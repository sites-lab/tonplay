/**
 * TonPlay – Firebase Cloud Function: Payment Watcher
 * ───────────────────────────────────────────────────
 * Polls the TON blockchain every minute for new transactions
 * arriving at the vault wallet, parses the comment, matches it to
 * a pendingPayment document in Firestore, and automatically
 * credits the user's balance.
 *
 * Deploy:
 *   npm install -g firebase-tools
 *   cd functions && npm install
 *   firebase deploy --only functions
 */

const functions  = require('firebase-functions');
const admin      = require('firebase-admin');
const fetch      = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

// ─── Config ──────────────────────────────────────────────
const VAULT_ADDRESS = 'UQBnGPixB1lrqOvhgaJNEzOuI_mLkVlq49i3wBysTE8WZJFE';
const TONCENTER_URL = 'https://toncenter.com/api/v2';
const TONCENTER_KEY = ''; // optional: set via: firebase functions:config:set ton.api_key="YOUR_KEY"
const BOT_TOKEN     = '8681109703:AAEEPc3hw3iniKA7GH3uMk47l5ace__hxgU';
const ADMIN_CHAT    = '5222030484';
// ─────────────────────────────────────────────────────────

/**
 * Scheduled function: runs every 1 minute.
 * Checks for new TON transactions and auto-credits matching pending payments.
 */
exports.watchTonPayments = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('🔍 Checking TON transactions...');
    try {
      await processTonTransactions();
    } catch (err) {
      console.error('watchTonPayments error:', err);
    }
    return null;
  });

/**
 * HTTP endpoint for manual trigger / webhook (optional).
 * Call: POST https://<region>-<project>.cloudfunctions.net/checkTonPayment
 * Body: { "comment": "TP-XXXXXX-XXXX" }
 */
exports.checkTonPayment = functions.https.onRequest(async (req, res) => {
  try {
    const { comment } = req.body || {};
    if (comment) {
      await processSpecificComment(comment);
    } else {
      await processTonTransactions();
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Core logic ───────────────────────────────────────────

async function processTonTransactions() {
  const txs = await fetchTransactions(50);
  if (!txs.length) return;

  // Load all pending payments from Firestore
  const pendingSnap = await db.collection('pendingPayments')
    .where('status', '==', 'pending')
    .limit(100)
    .get();

  if (pendingSnap.empty) {
    console.log('No pending payments in Firestore.');
    return;
  }

  // Build a map: comment → pending payment doc
  const pendingMap = {};
  pendingSnap.docs.forEach(d => {
    const data = d.data();
    if (data.comment) pendingMap[data.comment] = { id: d.id, ...data };
  });

  // Match transactions to pending payments
  for (const tx of txs) {
    const comment = extractComment(tx);
    if (!comment) continue;

    const pending = pendingMap[comment];
    if (!pending) continue;

    // Verify amount (allow 1% slippage for network fees)
    const receivedNano = parseInt(tx.in_msg?.value || '0');
    const expectedNano = Math.floor((pending.amount || 0) * 1e9 * 0.99);
    if (receivedNano < expectedNano) {
      console.log(`Amount mismatch for comment ${comment}: got ${receivedNano}, expected ≥${expectedNano}`);
      continue;
    }

    console.log(`✅ Matched payment! Comment: ${comment}, User: ${pending.userId}, Amount: ${pending.amount} TON`);
    await creditUser(pending, tx);
    delete pendingMap[comment]; // avoid double-processing same comment
  }
}

async function processSpecificComment(comment) {
  const pendingSnap = await db.collection('pendingPayments')
    .where('comment', '==', comment)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (pendingSnap.empty) {
    console.log('No pending payment found for comment:', comment);
    return;
  }

  const pending = { id: pendingSnap.docs[0].id, ...pendingSnap.docs[0].data() };
  const txs     = await fetchTransactions(20);

  for (const tx of txs) {
    const txComment = extractComment(tx);
    if (txComment !== comment) continue;

    const receivedNano = parseInt(tx.in_msg?.value || '0');
    const expectedNano = Math.floor((pending.amount || 0) * 1e9 * 0.99);
    if (receivedNano < expectedNano) continue;

    await creditUser(pending, tx);
    return;
  }

  console.log('Transaction not yet found for comment:', comment);
}

// ─── Credit user in Firestore ─────────────────────────────

async function creditUser(pending, tx) {
  const { userId, amount, comment, id: pendingDocId } = pending;

  // Use Firestore transaction for atomicity (prevents double-credit)
  await db.runTransaction(async (t) => {
    const pendingRef = db.collection('pendingPayments').doc(pendingDocId);
    const userRef    = db.collection('users').doc(userId);

    const [pendingDoc, userDoc] = await Promise.all([
      t.get(pendingRef),
      t.get(userRef)
    ]);

    // Idempotency guard: skip if already confirmed
    if (pendingDoc.data()?.status === 'confirmed') {
      console.log(`Already confirmed: ${pendingDocId}`);
      return;
    }

    // Mark pending payment confirmed
    t.update(pendingRef, {
      status: 'confirmed',
      confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      txHash: tx.transaction_id?.hash || ''
    });

    // Create deposit record
    const depositRef = db.collection('deposits').doc();
    t.set(depositRef, {
      userId,
      userName:     pending.userName || '',
      displayName:  pending.displayName || '',
      amount,
      comment,
      walletAddress: tx.in_msg?.source || '',
      txHash:        tx.transaction_id?.hash || '',
      status:        'active',
      weeksActive:   0,
      earned:        0,
      autoDetected:  true,
      createdAt:     admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user balance and totalDeposited
    if (userDoc.exists) {
      const ud     = userDoc.data();
      const newBal = parseFloat(((ud.balance || 0) + amount).toFixed(6));
      const newDep = parseFloat(((ud.totalDeposited || 0) + amount).toFixed(6));
      t.update(userRef, {
        balance:          newBal,
        totalDeposited:   newDep,
        withdrawUnlocked: true
      });
    }
  });

  // Notify admin via Telegram bot
  await sendBotMessage(
    `✅ <b>Auto-Detected Deposit!</b>\n\n` +
    `👤 <b>User:</b> ${pending.userName ? '@' + pending.userName : userId}\n` +
    `💰 <b>Amount:</b> ${amount} TON\n` +
    `🔑 <b>Comment:</b> <code>${comment}</code>\n` +
    `🔗 <b>TxHash:</b> <code>${(tx.transaction_id?.hash || '?').slice(0, 16)}…</code>\n` +
    `📱 <b>Source:</b> TON Connect (auto via Cloud Function)`
  );

  console.log(`✅ Credited ${amount} TON to user ${userId}`);
}

// ─── TON API helpers ──────────────────────────────────────

async function fetchTransactions(limit = 20) {
  const apiKey      = TONCENTER_KEY || (functions.config().ton && functions.config().ton.api_key) || '';
  const apiKeyParam = apiKey ? `&api_key=${apiKey}` : '';
  const url         = `${TONCENTER_URL}/getTransactions?address=${VAULT_ADDRESS}&limit=${limit}${apiKeyParam}`;

  const res  = await fetch(url);
  const data = await res.json();

  if (!data.ok) {
    console.error('TON API error:', JSON.stringify(data));
    return [];
  }
  return data.result || [];
}

function extractComment(tx) {
  const inMsg = tx.in_msg;
  if (!inMsg?.msg_data) return null;

  const msgData = inMsg.msg_data;

  // msg.dataText — base64-encoded UTF-8
  if (msgData['@type'] === 'msg.dataText') {
    try {
      const text = Buffer.from(msgData.text || '', 'base64').toString('utf8');
      return text.replace(/^\x00+/, '').trim() || null;
    } catch(e) { return null; }
  }

  // msg.dataRaw — binary payload, first 4 bytes = opcode 0x00000000 for text comment
  if (msgData['@type'] === 'msg.dataRaw') {
    try {
      const bytes = Buffer.from(msgData.body || '', 'base64');
      if (bytes.length < 4) return null;
      const op = bytes.readUInt32BE(0);
      if (op !== 0) return null; // only process simple text comments
      const text = bytes.slice(4).toString('utf8').trim();
      return text || null;
    } catch(e) { return null; }
  }

  return null;
}

// ─── Telegram Bot notification ────────────────────────────

async function sendBotMessage(text) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: ADMIN_CHAT, text, parse_mode: 'HTML' })
    });
  } catch(e) {
    console.error('Bot message failed:', e.message);
  }
}
