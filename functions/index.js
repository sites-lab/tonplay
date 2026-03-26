/**
 * TonPlay – Firebase Cloud Functions
 * ────────────────────────────────────────────────────────────────
 * 1. watchTonPayments  – runs every minute, auto-credits deposits
 * 2. processWeeklyYield – runs every hour, pays 5% (or 10% for
 *    deposits ≥ 100 TON) exactly 7 days after each deposit / last payout
 * 3. checkTonPayment   – HTTP manual trigger
 *
 * Deploy:
 *   npm install -g firebase-tools
 *   cd functions && npm install
 *   firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const fetch     = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

// ─── Config ───────────────────────────────────────────────────────
const VAULT_ADDRESS = 'UQBnGPixB1lrqOvhgaJNEzOuI_mLkVlq49i3wBysTE8WZJFE';
const TONCENTER_URL = 'https://toncenter.com/api/v2';
const TONCENTER_KEY = ''; // optional: firebase functions:config:set ton.api_key="KEY"
const BOT_TOKEN     = '8681109703:AAEEPc3hw3iniKA7GH3uMk47l5ace__hxgU';
const ADMIN_CHAT    = '5222030484';

const SEVEN_DAYS_MS  = 7 * 24 * 60 * 60 * 1000;
// Yield rates
const YIELD_STANDARD = 0.05;  // 5%  – all deposits
const YIELD_PREMIUM  = 0.10;  // 10% – deposits ≥ 100 TON
const PREMIUM_THRESHOLD = 100; // TON
// ─────────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════
// 1.  WATCH TON PAYMENTS  (every 1 minute)
// ═══════════════════════════════════════════════════════════════════
exports.watchTonPayments = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async () => {
    console.log('🔍 Checking TON transactions...');
    try { await processTonTransactions(); } catch (err) { console.error('watchTonPayments error:', err); }
    return null;
  });

// HTTP trigger – manual / webhook
exports.checkTonPayment = functions.https.onRequest(async (req, res) => {
  try {
    const { comment } = req.body || {};
    if (comment) await processSpecificComment(comment);
    else         await processTonTransactions();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// ═══════════════════════════════════════════════════════════════════
// 2.  WEEKLY YIELD PROCESSOR  (every hour)
//     – Scans all active deposit docs under users/{uid}/deposits
//     – When (now - lastYieldAt) >= 7 days, credits the yield
//     – Rate: 5% standard, 10% if originalAmount >= 100 TON
// ═══════════════════════════════════════════════════════════════════
exports.processWeeklyYield = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async () => {
    console.log('💰 Processing weekly yield...');
    try { await runWeeklyYield(); } catch (err) { console.error('processWeeklyYield error:', err); }
    return null;
  });

// HTTP trigger – manual testing
exports.triggerWeeklyYield = functions.https.onRequest(async (req, res) => {
  try {
    await runWeeklyYield();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

async function runWeeklyYield() {
  const now = Date.now();

  // Fetch ALL users that have at least one deposit
  const usersSnap = await db.collection('users').get();
  if (usersSnap.empty) return;

  let processed = 0;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;

    // Get all active deposits for this user
    const depositsSnap = await db
      .collection('users').doc(userId)
      .collection('deposits')
      .where('status', '==', 'active')
      .get();

    if (depositsSnap.empty) continue;

    for (const depDoc of depositsSnap.docs) {
      const dep = depDoc.data();

      // Determine the clock start: first payout uses createdAt, subsequent use lastYieldAt
      const clockStart = dep.lastYieldAt
        ? dep.lastYieldAt.toMillis()
        : (dep.createdAt?.toMillis ? dep.createdAt.toMillis() : null);

      if (!clockStart) continue; // no timestamp yet – skip

      const elapsed = now - clockStart;
      if (elapsed < SEVEN_DAYS_MS) continue; // not yet 7 days

      // ── Determine yield rate ──────────────────────────────────
      // Use originalAmount if stored, otherwise fall back to amount
      const principal = dep.originalAmount || dep.amount || 0;
      const rate      = principal >= PREMIUM_THRESHOLD ? YIELD_PREMIUM : YIELD_STANDARD;
      const yieldAmt  = parseFloat((dep.amount * rate).toFixed(6)); // % of current amount

      if (yieldAmt <= 0) continue;

      const newAmount   = parseFloat((dep.amount + yieldAmt).toFixed(6));
      const newEarned   = parseFloat(((dep.earned || 0) + yieldAmt).toFixed(6));
      const newWeeks    = (dep.weeksActive || 0) + 1;

      // ── Atomic Firestore transaction ─────────────────────────
      await db.runTransaction(async (t) => {
        const depRef  = db.collection('users').doc(userId).collection('deposits').doc(depDoc.id);
        const userRef = db.collection('users').doc(userId);

        const [freshDep, freshUser] = await Promise.all([t.get(depRef), t.get(userRef)]);

        // Idempotency: re-check the clock inside the transaction
        const fd = freshDep.data();
        const cs2 = fd.lastYieldAt
          ? fd.lastYieldAt.toMillis()
          : (fd.createdAt?.toMillis ? fd.createdAt.toMillis() : 0);
        if ((Date.now() - cs2) < SEVEN_DAYS_MS) return; // another invocation beat us

        // Update deposit doc
        t.update(depRef, {
          amount:      newAmount,
          earned:      newEarned,
          weeksActive: newWeeks,
          lastYieldAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update user balance & totalEarned
        if (freshUser.exists) {
          const ud       = freshUser.data();
          const newBal   = parseFloat(((ud.balance || 0) + yieldAmt).toFixed(6));
          const newTotal = parseFloat(((ud.totalEarned || 0) + yieldAmt).toFixed(6));
          t.update(userRef, { balance: newBal, totalEarned: newTotal });
        }
      });

      processed++;
      console.log(`✅ Yield paid: ${yieldAmt} TON → user ${userId} | deposit ${depDoc.id} | rate ${rate*100}%`);

      // ── Notify user via bot ───────────────────────────────────
      const ud      = userDoc.data();
      const chatId  = userId; // Telegram user ID == Firestore doc ID
      const lang    = ud.lang || 'en';
      const isPrem  = rate === YIELD_PREMIUM;

      let msg;
      if (lang === 'ru') {
        msg =
          `💸 <b>Еженедельная выплата!</b>\n\n` +
          `💰 <b>+${yieldAmt.toFixed(4)} TON</b> зачислено на ваш баланс\n` +
          `📊 Доходность: <b>${isPrem ? '10% 🌟 Премиум' : '5% стандарт'}</b>\n` +
          `🏦 Депозит сейчас: <b>${newAmount.toFixed(4)} TON</b>\n` +
          `📅 Неделя #${newWeeks}\n\n` +
          `⏳ Следующая выплата через 7 дней.\n` +
          (isPrem
            ? `🌟 Вы используете премиум ставку (депозит ≥ 100 TON)!\n`
            : `💡 Внесите ≥ 100 TON для повышения до 10% в неделю!\n`) +
          `\n👇 Открыть приложение`;
      } else {
        msg =
          `💸 <b>Weekly Yield Paid!</b>\n\n` +
          `💰 <b>+${yieldAmt.toFixed(4)} TON</b> added to your balance\n` +
          `📊 Rate: <b>${isPrem ? '10% 🌟 Premium' : '5% standard'}</b>\n` +
          `🏦 Deposit now: <b>${newAmount.toFixed(4)} TON</b>\n` +
          `📅 Week #${newWeeks}\n\n` +
          `⏳ Next yield in 7 days.\n` +
          (isPrem
            ? `🌟 You're on the premium rate (deposit ≥ 100 TON)!\n`
            : `💡 Deposit ≥ 100 TON to upgrade to 10% per week!\n`) +
          `\n👇 Open the app`;
      }

      await sendBotMessageToUser(chatId, msg);

      // Admin log
      await sendBotMessage(
        `💰 <b>Yield Paid</b>\n` +
        `👤 User: ${ud.userName ? '@'+ud.userName : userId}\n` +
        `💵 Amount: +${yieldAmt.toFixed(4)} TON (${(rate*100)}%)\n` +
        `🏦 Deposit: ${newAmount.toFixed(4)} TON | Week #${newWeeks}`
      );
    }
  }

  console.log(`✅ Weekly yield run complete. Processed: ${processed} deposits.`);
}


// ═══════════════════════════════════════════════════════════════════
// 3.  PAYMENT WATCHER CORE LOGIC
// ═══════════════════════════════════════════════════════════════════

async function processTonTransactions() {
  const txs = await fetchTransactions(50);
  if (!txs.length) return;

  const pendingSnap = await db.collection('pendingPayments')
    .where('status', '==', 'pending')
    .limit(100)
    .get();

  if (pendingSnap.empty) { console.log('No pending payments in Firestore.'); return; }

  const pendingMap = {};
  pendingSnap.docs.forEach(d => {
    const data = d.data();
    if (data.comment) pendingMap[data.comment] = { id: d.id, ...data };
  });

  for (const tx of txs) {
    const comment = extractComment(tx);
    if (!comment) continue;
    const pending = pendingMap[comment];
    if (!pending) continue;

    const receivedNano = parseInt(tx.in_msg?.value || '0');
    const expectedNano = Math.floor((pending.amount || 0) * 1e9 * 0.99);
    if (receivedNano < expectedNano) {
      console.log(`Amount mismatch for ${comment}: got ${receivedNano}, expected ≥${expectedNano}`);
      continue;
    }

    console.log(`✅ Matched: ${comment}, User: ${pending.userId}, Amount: ${pending.amount} TON`);
    await creditUser(pending, tx);
    delete pendingMap[comment];
  }
}

async function processSpecificComment(comment) {
  const pendingSnap = await db.collection('pendingPayments')
    .where('comment', '==', comment)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (pendingSnap.empty) { console.log('No pending payment for comment:', comment); return; }

  const pending = { id: pendingSnap.docs[0].id, ...pendingSnap.docs[0].data() };
  const txs     = await fetchTransactions(20);

  for (const tx of txs) {
    if (extractComment(tx) !== comment) continue;
    const receivedNano = parseInt(tx.in_msg?.value || '0');
    const expectedNano = Math.floor((pending.amount || 0) * 1e9 * 0.99);
    if (receivedNano < expectedNano) continue;
    await creditUser(pending, tx);
    return;
  }
  console.log('Transaction not yet found for comment:', comment);
}


// ─── Credit user in Firestore ─────────────────────────────────────

async function creditUser(pending, tx) {
  const { userId, amount, comment, id: pendingDocId } = pending;

  await db.runTransaction(async (t) => {
    const pendingRef = db.collection('pendingPayments').doc(pendingDocId);
    const userRef    = db.collection('users').doc(userId);

    const [pendingDoc, userDoc] = await Promise.all([t.get(pendingRef), t.get(userRef)]);

    if (pendingDoc.data()?.status === 'confirmed') {
      console.log(`Already confirmed: ${pendingDocId}`); return;
    }

    t.update(pendingRef, {
      status:      'confirmed',
      confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      txHash:      tx.transaction_id?.hash || ''
    });

    // Create deposit record in users/{uid}/deposits sub-collection
    // Store originalAmount so yield rate never changes after upgrades
    const depositRef = db.collection('users').doc(userId).collection('deposits').doc();
    t.set(depositRef, {
      userId,
      userName:       pending.userName || '',
      displayName:    pending.displayName || '',
      amount,
      originalAmount: amount, // locked – used to determine 5% vs 10%
      comment,
      walletAddress:  tx.in_msg?.source || '',
      txHash:         tx.transaction_id?.hash || '',
      status:         'active',
      weeksActive:    0,
      earned:         0,
      autoDetected:   true,
      lastYieldAt:    null,  // null = use createdAt as clock start
      createdAt:      admin.firestore.FieldValue.serverTimestamp()
    });

    if (userDoc.exists) {
      const ud     = userDoc.data();
      const newBal = parseFloat(((ud.balance || 0) + amount).toFixed(6));
      const newDep = parseFloat(((ud.totalDeposited || 0) + amount).toFixed(6));
      t.update(userRef, { balance: newBal, totalDeposited: newDep, withdrawUnlocked: true });
    }
  });

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


// ─── TON API helpers ───────────────────────────────────────────────

async function fetchTransactions(limit = 20) {
  const apiKey      = TONCENTER_KEY || (functions.config().ton && functions.config().ton.api_key) || '';
  const apiKeyParam = apiKey ? `&api_key=${apiKey}` : '';
  const url         = `${TONCENTER_URL}/getTransactions?address=${VAULT_ADDRESS}&limit=${limit}${apiKeyParam}`;
  const res  = await fetch(url);
  const data = await res.json();
  if (!data.ok) { console.error('TON API error:', JSON.stringify(data)); return []; }
  return data.result || [];
}

function extractComment(tx) {
  const inMsg = tx.in_msg;
  if (!inMsg?.msg_data) return null;
  const msgData = inMsg.msg_data;

  if (msgData['@type'] === 'msg.dataText') {
    try {
      const text = Buffer.from(msgData.text || '', 'base64').toString('utf8');
      return text.replace(/^\x00+/, '').trim() || null;
    } catch(e) { return null; }
  }

  if (msgData['@type'] === 'msg.dataRaw') {
    try {
      const bytes = Buffer.from(msgData.body || '', 'base64');
      if (bytes.length < 4) return null;
      if (bytes.readUInt32BE(0) !== 0) return null;
      return bytes.slice(4).toString('utf8').trim() || null;
    } catch(e) { return null; }
  }

  return null;
}


// ─── Telegram Bot helpers ──────────────────────────────────────────

async function sendBotMessage(text) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: ADMIN_CHAT, text, parse_mode: 'HTML' })
    });
  } catch(e) { console.error('Bot message (admin) failed:', e.message); }
}

async function sendBotMessageToUser(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch(e) { console.error('Bot message (user) failed:', e.message); }
}
