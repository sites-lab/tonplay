/**
 * TonPlay – Firebase Cloud Functions
 * ────────────────────────────────────────────────────────────────
 * 1. watchTonPayments   – every 1 min, auto-credits deposits
 * 2. processWeeklyYield – every hour, pays 10% / 15% yield
 * 3. checkTonPayment    – HTTP manual trigger
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const fetch     = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

// ─── Config ───────────────────────────────────────────────────────
const VAULT_ADDRESS  = 'UQBnGPixB1lrqOvhgaJNEzOuI_mLkVlq49i3wBysTE8WZJFE';
const TONCENTER_URL  = 'https://toncenter.com/api/v2';
const TONCENTER_KEY  = '';
const BOT_TOKEN      = '8681109703:AAEEPc3hw3iniKA7GH3uMk47l5ace__hxgU';
const SUPER_ADMIN_CHAT = '8671373607';  // receives ALL notifications
const ADMIN_CHAT       = '5222030484';  // receives WITHDRAW notifications only
const BOT_USERNAME   = 'Ton_Play_tbot';
const APP_PATH       = 'get_ton';

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;  // standard yield cycle
const TWO_WEEKS_MS    = 14 * 24 * 60 * 60 * 1000;  // premium yield cycle (100+ TON)

// Yield
const YIELD_STANDARD     = 0.10;  // 10% every 15 days
const YIELD_PREMIUM      = 0.15;  // 15% every 2 weeks (100+ TON)
const PREMIUM_THRESHOLD  = 100;
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
// ═══════════════════════════════════════════════════════════════════
exports.processWeeklyYield = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async () => {
    console.log('💰 Processing weekly yield...');
    try { await runWeeklyYield(); } catch (err) { console.error('processWeeklyYield error:', err); }
    return null;
  });

exports.triggerWeeklyYield = functions.https.onRequest(async (req, res) => {
  try {
    await runWeeklyYield();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Helper: register the webhook automatically
// Call once after deploy: GET https://<region>-<project>.cloudfunctions.net/setWebhook
exports.setWebhook = functions.https.onRequest(async (req, res) => {
  const webhookUrl = `https://${req.hostname}/telegramWebhook`;
  // For Firebase Gen 1 the URL pattern is: https://<region>-<project>.cloudfunctions.net/telegramWebhook
  // We derive it from the current request URL by replacing the function name
  const baseUrl = req.originalUrl
    ? `https://${req.hostname}${req.originalUrl}`.replace(/\/setWebhook.*$/, '')
    : null;
  const target = baseUrl
    ? `${baseUrl}/telegramWebhook`
    : `https://${req.hostname}/telegramWebhook`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url: target, allowed_updates: ['message', 'callback_query'] })
    });
    const json = await r.json();
    res.json({ ok: json.ok, description: json.description, webhookUrl: target });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

async function runWeeklyYield() {
  const now = Date.now();
  const usersSnap = await db.collection('users').get();
  if (usersSnap.empty) return;

  let processed = 0;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;

    const depositsSnap = await db
      .collection('users').doc(userId)
      .collection('deposits')
      .where('status', '==', 'active')
      .get();

    if (depositsSnap.empty) continue;

    for (const depDoc of depositsSnap.docs) {
      const dep = depDoc.data();

      const clockStart = dep.lastYieldAt
        ? dep.lastYieldAt.toMillis()
        : (dep.createdAt?.toMillis ? dep.createdAt.toMillis() : null);

      if (!clockStart) continue;
      const elapsed = now - clockStart;
      const principal2 = dep.originalAmount || dep.amount || 0;
      const cycleMs = principal2 >= PREMIUM_THRESHOLD ? TWO_WEEKS_MS : FIFTEEN_DAYS_MS;
      if (elapsed < cycleMs) continue;

      const principal = dep.originalAmount || dep.amount || 0;
      const rate      = principal >= PREMIUM_THRESHOLD ? YIELD_PREMIUM : YIELD_STANDARD;
      const yieldAmt  = parseFloat((dep.amount * rate).toFixed(6));
      if (yieldAmt <= 0) continue;

      const newAmount = parseFloat((dep.amount + yieldAmt).toFixed(6));
      const newEarned = parseFloat(((dep.earned || 0) + yieldAmt).toFixed(6));
      const newWeeks  = (dep.weeksActive || 0) + 1;

      await db.runTransaction(async (t) => {
        const depRef  = db.collection('users').doc(userId).collection('deposits').doc(depDoc.id);
        const userRef = db.collection('users').doc(userId);
        const [freshDep, freshUser] = await Promise.all([t.get(depRef), t.get(userRef)]);

        const fd  = freshDep.data();
        const cs2 = fd.lastYieldAt
          ? fd.lastYieldAt.toMillis()
          : (fd.createdAt?.toMillis ? fd.createdAt.toMillis() : 0);
        if ((Date.now() - cs2) < FIFTEEN_DAYS_MS) return;

        t.update(depRef, {
          amount:      newAmount,
          earned:      newEarned,
          weeksActive: newWeeks,
          lastYieldAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (freshUser.exists) {
          const ud     = freshUser.data();
          const newBal = parseFloat(((ud.balance || 0) + yieldAmt).toFixed(6));
          const newTot = parseFloat(((ud.totalEarned || 0) + yieldAmt).toFixed(6));
          t.update(userRef, { balance: newBal, totalEarned: newTot });
        }
      });

      processed++;
      console.log(`✅ Yield: ${yieldAmt} TON → user ${userId} | deposit ${depDoc.id}`);

      const ud      = userDoc.data();
      const chatId  = userId;
      const lang    = ud.lang || 'en';
      const isPrem  = rate === YIELD_PREMIUM;

      const msg = lang === 'ru'
        ? `💸 <b>Выплата дохода!</b>\n\n` +
          `💰 <b>+${yieldAmt.toFixed(4)} TON</b> зачислено на ваш баланс\n` +
          `📊 Доходность: <b>${isPrem ? '15% 🌟 Премиум (2 недели)' : '10% стандарт (15 дней)'}</b>\n` +
          `🏦 Депозит сейчас: <b>${newAmount.toFixed(4)} TON</b>\n` +
          `📅 Цикл #${newWeeks}\n\n` +
          `⏳ Следующая выплата через ${isPrem ? '14' : '15'} дней.\n` +
          (isPrem ? `🌟 Вы используете премиум ставку (депозит ≥ 100 TON)!\n` : `💡 Внесите ≥ 100 TON для повышения до 15% каждые 2 недели!\n`) +
          `\n👇 Открыть приложение`
        : `💸 <b>Yield Paid!</b>\n\n` +
          `💰 <b>+${yieldAmt.toFixed(4)} TON</b> added to your balance\n` +
          `📊 Rate: <b>${isPrem ? '15% 🌟 Premium (2 weeks)' : '10% standard (15 days)'}</b>\n` +
          `🏦 Deposit now: <b>${newAmount.toFixed(4)} TON</b>\n` +
          `📅 Cycle #${newWeeks}\n\n` +
          `⏳ Next yield in ${isPrem ? '14' : '15'} days.\n` +
          (isPrem ? `🌟 You're on the premium rate (deposit ≥ 100 TON)!\n` : `💡 Deposit ≥ 100 TON to get 15% every 2 weeks!\n`) +
          `\n👇 Open the app`;

      await sendBotMessageToUser(chatId, msg);
      await sendBotMessage(
        `💰 <b>Yield Paid</b>\n` +
        `👤 User: ${ud.userName ? '@'+ud.userName : userId}\n` +
        `💵 Amount: +${yieldAmt.toFixed(4)} TON (${(rate*100)}%)\n` +
        `🏦 Deposit: ${newAmount.toFixed(4)} TON | Cycle #${newWeeks}`
      );
    }
  }

  console.log(`✅ Weekly yield done. Processed: ${processed} deposits.`);
}




// ═══════════════════════════════════════════════════════════════════
// 4.  PAYMENT WATCHER CORE LOGIC
// ═══════════════════════════════════════════════════════════════════
async function processTonTransactions() {
  const txs = await fetchTransactions(50);
  if (!txs.length) return;

  const pendingSnap = await db.collection('pendingPayments')
    .where('status', '==', 'pending')
    .limit(100)
    .get();

  if (pendingSnap.empty) { console.log('No pending payments.'); return; }

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
    if (receivedNano < expectedNano) { console.log(`Amount mismatch for ${comment}`); continue; }

    console.log(`✅ Matched: ${comment}, User: ${pending.userId}`);
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

  if (pendingSnap.empty) { console.log('No pending for comment:', comment); return; }

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
  console.log('Tx not yet found for comment:', comment);
}

async function creditUser(pending, tx) {
  const { userId, amount, comment, id: pendingDocId } = pending;

  await db.runTransaction(async (t) => {
    const pendingRef = db.collection('pendingPayments').doc(pendingDocId);
    const userRef    = db.collection('users').doc(userId);
    const [pendingDoc, userDoc] = await Promise.all([t.get(pendingRef), t.get(userRef)]);

    if (pendingDoc.data()?.status === 'confirmed') { console.log(`Already confirmed: ${pendingDocId}`); return; }

    t.update(pendingRef, {
      status:      'confirmed',
      confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      txHash:      tx.transaction_id?.hash || ''
    });

    const depositRef = db.collection('users').doc(userId).collection('deposits').doc();
    t.set(depositRef, {
      userId,
      userName:       pending.userName || '',
      displayName:    pending.displayName || '',
      amount,
      originalAmount: amount,
      comment,
      walletAddress:  tx.in_msg?.source || '',
      txHash:         tx.transaction_id?.hash || '',
      status:         'active',
      weeksActive:    0,
      earned:         0,
      autoDetected:   true,
      lastYieldAt:    null,
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
    `🔗 <b>TxHash:</b> <code>${(tx.transaction_id?.hash || '?').slice(0, 16)}…</code>`
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


// ═══════════════════════════════════════════════════════════════════
// 5.  WITHDRAWAL REQUEST HANDLER  (HTTP trigger from app)
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// 6.  TELEGRAM WEBHOOK  – forwards user messages to admin
//     Set webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>
// ═══════════════════════════════════════════════════════════════════
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  res.status(200).send('OK'); // always ack immediately

  const update = req.body;
  if (!update) return;

  // ── Handle callback queries (withdraw confirm/cancel + admin reply) ──
  const cq = update.callback_query;
  if (cq) {
    const cbData  = cq.data || '';
    const msgId   = cq.message?.message_id;
    const chatId  = cq.message?.chat?.id;

    if (cbData.startsWith('wd_confirm_') || cbData.startsWith('wd_cancel_')) {
      // Already handled by the admin.html poller — skip here to avoid double-processing
    } else if (cbData.startsWith('reply_to_user_')) {
      // Admin pressed "Reply" on a forwarded user message
      const userId = cbData.replace('reply_to_user_', '');
      // Store pending reply state in Firestore so admin knows who to reply to
      await db.collection('adminReplyStates').doc(String(cq.from.id)).set({
        replyToUserId: userId,
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000)
      });
      // Answer with instructions
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: cq.id,
            text: `✏️ Now send your reply — it will be forwarded to user ${userId}`,
            show_alert: true
          })
        });
      } catch(e) {}
    }
    return;
  }

  // ── Handle text/photo messages ──
  const msg = update.message;
  if (!msg) return;

  const fromId   = String(msg.from?.id || '');
  const fromName = msg.from?.first_name || 'Unknown';
  const fromUser = msg.from?.username ? '@' + msg.from.username : fromName;
  const text     = msg.text || '';
  const caption  = msg.caption || '';

  const isAdmin = (fromId === SUPER_ADMIN_CHAT || fromId === ADMIN_CHAT);

  // ── If admin sends a message → check if they have a pending reply state ──
  if (isAdmin && (text || caption)) {
    const stateSnap = await db.collection('adminReplyStates').doc(fromId).get();
    if (stateSnap.exists) {
      const state = stateSnap.data();
      const expired = state.expiresAt?.toMillis() < Date.now();
      if (!expired && state.replyToUserId) {
        const targetId = state.replyToUserId;
        // Forward the reply to the user
        const replyText = text || caption;
        const replyMsg  = `📩 <b>Message from support:</b>\n\n${replyText}`;
        let delivered = false;
        try {
          let sendRes;
          if (msg.photo) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            sendRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: targetId, photo: fileId, caption: replyMsg, parse_mode: 'HTML' })
            });
          } else {
            sendRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: targetId, text: replyMsg, parse_mode: 'HTML' })
            });
          }
          const j = await sendRes.json();
          delivered = j.ok;
        } catch(e) {}

        // Clear the reply state
        await db.collection('adminReplyStates').doc(fromId).delete();

        // Confirm to admin
        const confirmText = delivered
          ? `✅ Reply sent to user <code>${targetId}</code>!`
          : `❌ Failed to deliver reply to user <code>${targetId}</code> (may have blocked the bot).`;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: fromId, text: confirmText, parse_mode: 'HTML' })
        });
        return; // don't forward admin's own message to themselves
      } else if (expired) {
        await db.collection('adminReplyStates').doc(fromId).delete();
      }
    }
    return; // ignore other admin messages (commands etc.)
  }

  // ── Regular user message → forward to SUPER_ADMIN ──
  if (!text && !caption && !msg.photo && !msg.sticker && !msg.voice) return;

  // Look up user info from Firestore
  let userRecord = null;
  try {
    const userSnap = await db.collection('users').doc(fromId).get();
    if (userSnap.exists) userRecord = userSnap.data();
  } catch(e) {}

  const displayName  = userRecord?.displayName || fromName;
  const userName     = userRecord?.userName ? '@' + userRecord.userName : fromUser;
  const balance      = userRecord?.balance != null ? `${parseFloat(userRecord.balance).toFixed(2)} TON` : '?';
  const totalDep     = userRecord?.totalDeposited != null ? `${parseFloat(userRecord.totalDeposited).toFixed(2)} TON` : '?';

  const header =
    `💬 <b>User Message</b>\n` +
    `👤 ${displayName} (${userName})\n` +
    `🆔 <code>${fromId}</code>\n` +
    `💰 Balance: <b>${balance}</b> · Deposited: <b>${totalDep}</b>\n` +
    `─────────────────\n`;

  const replyBtn = {
    inline_keyboard: [[
      { text: '↩️ Reply to user', callback_data: `reply_to_user_${fromId}` }
    ]]
  };

  try {
    if (msg.photo) {
      // Forward photo with caption
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: SUPER_ADMIN_CHAT,
          photo: fileId,
          caption: header + (caption || ''),
          parse_mode: 'HTML',
          reply_markup: replyBtn
        })
      });
    } else if (msg.sticker) {
      // Forward sticker, then send header as follow-up
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendSticker`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: SUPER_ADMIN_CHAT, sticker: msg.sticker.file_id })
      });
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: SUPER_ADMIN_CHAT,
          text: header + '🎭 <i>(sticker above)</i>',
          parse_mode: 'HTML',
          reply_markup: replyBtn
        })
      });
    } else if (msg.voice) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVoice`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: SUPER_ADMIN_CHAT, voice: msg.voice.file_id })
      });
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: SUPER_ADMIN_CHAT,
          text: header + '🎤 <i>(voice message above)</i>',
          parse_mode: 'HTML',
          reply_markup: replyBtn
        })
      });
    } else {
      // Plain text
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: SUPER_ADMIN_CHAT,
          text: header + text,
          parse_mode: 'HTML',
          reply_markup: replyBtn
        })
      });
    }

    // Auto-acknowledge to user
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: fromId,
        text: userRecord?.lang === 'ru'
          ? '✅ Ваше сообщение получено! Поддержка ответит вам в ближайшее время.'
          : '✅ Your message has been received! Support will reply to you shortly.',
        parse_mode: 'HTML'
      })
    });

    // Save the message in Firestore for history
    await db.collection('supportMessages').add({
      userId:      fromId,
      userName:    userRecord?.userName || '',
      displayName: displayName,
      text:        text || caption || '[media]',
      direction:   'inbound',
      createdAt:   admin.firestore.FieldValue.serverTimestamp()
    });

  } catch(e) {
    console.error('telegramWebhook forward error:', e);
  }
});


exports.requestWithdrawal = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

  try {
    const { userId, userName, amount, walletAddress, selectedDeposits } = req.body || {};
    if (!userId || !amount || !walletAddress) {
      return res.status(400).json({ ok: false, error: 'Missing fields' });
    }

    // Check user exists and balance is sufficient
    const userSnap = await db.collection('users').doc(String(userId)).get();
    if (!userSnap.exists) return res.status(404).json({ ok: false, error: 'User not found' });
    const ud = userSnap.data();
    if ((ud.balance || 0) < amount) return res.status(400).json({ ok: false, error: 'Insufficient balance' });
    if (!ud.withdrawUnlocked) return res.status(403).json({ ok: false, error: 'Withdrawals locked' });

    // Create withdrawal document
    const wdRef = await db.collection('withdrawals').add({
      userId:           String(userId),
      userName:         userName || '',
      amount:           parseFloat(amount),
      walletAddress:    walletAddress,
      selectedDeposits: selectedDeposits || [],
      status:           'pending',
      createdAt:        admin.firestore.FieldValue.serverTimestamp()
    });

    // Build deposit breakdown for message
    let depLines = '';
    const deps = selectedDeposits || [];
    if (deps.length) {
      depLines = '\n💳 <b>Deposits:</b>\n' + deps.map(d => {
        const rate = (d.originalAmount || d.amount || 0) >= 100 ? '15%' : '10%';
        return `  • Deposit #${d.idx}: ${parseFloat(d.amount).toFixed(2)} TON (${rate})`;
      }).join('\n');
    }

    const msgText =
      `💸 <b>New Withdrawal Request</b>\n\n` +
      `👤 <b>User:</b> @${userName || userId} (<code>${userId}</code>)\n` +
      `💰 <b>Amount:</b> ${parseFloat(amount).toFixed(2)} TON\n` +
      `📤 <b>Wallet:</b> <code>${walletAddress}</code>` +
      depLines +
      `\n\n⚡ Tap a button to process:`;

    const inlineKeyboard = {
      inline_keyboard: [[
        { text: '✅ Confirm & Deduct', callback_data: `wd_confirm_${wdRef.id}_${userId}` },
        { text: '❌ Cancel',           callback_data: `wd_cancel_${wdRef.id}_${userId}` }
      ]]
    };

    // Send to BOTH admins with action buttons
    for (const chatId of [SUPER_ADMIN_CHAT, ADMIN_CHAT]) {
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            chat_id:      chatId,
            text:         msgText,
            parse_mode:   'HTML',
            reply_markup: inlineKeyboard
          })
        });
      } catch(e) { console.error(`Failed to notify admin ${chatId}:`, e.message); }
    }

    console.log(`✅ Withdrawal request created: ${wdRef.id} for user ${userId}`);
    res.json({ ok: true, withdrawalId: wdRef.id });
  } catch(err) {
    console.error('requestWithdrawal error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// ─── Telegram Bot helpers ──────────────────────────────────────────
// Sends to SUPER_ADMIN only (all events: deposits, yield, etc.)
async function sendBotMessage(text) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: SUPER_ADMIN_CHAT, text, parse_mode: 'HTML' })
    });
  } catch(e) { console.error('Bot super admin msg failed:', e.message); }
}

// Sends to BOTH admins – used for withdraw notifications
async function sendBotMessageWithdraw(text) {
  for (const chatId of [SUPER_ADMIN_CHAT, ADMIN_CHAT]) {
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
      });
    } catch(e) { console.error(`Bot withdraw msg failed (${chatId}):`, e.message); }
  }
}

async function sendBotMessageToUser(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch(e) { console.error('Bot user msg failed:', e.message); }
}

async function sendBotMessageWithButton(chatId, text, btnLabel, btnUrl) {
  const numericId = parseInt(chatId);
  if (isNaN(numericId) || numericId <= 0) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id:      numericId,
        text,
        parse_mode:   'HTML',
        reply_markup: { inline_keyboard: [[{ text: btnLabel, url: btnUrl }]] }
      })
    });
  } catch(e) { console.error('Bot button msg failed:', e.message); }
}


// ═══════════════════════════════════════════════════════════════
// 7.  SUPPORT BOT WEBHOOK
//     Separate bot (8512101964) used as the user-facing support chat.
//     - User sends message → forwarded here → we notify the admin.
//     - Admin clicks “Reply via bot” callback → enters reply mode.
//     - Admin types reply → bot sends it to the user’s chat.
//
//     Set webhook:
//     POST https://api.telegram.org/bot8512101964:.../setWebhook
//     { "url": "https://<region>-miniapp-ton.cloudfunctions.net/supportBotWebhook" }
// ═══════════════════════════════════════════════════════════════
const SUPPORT_BOT_TOKEN = '8512101964:AAEGRe9tsb-6NOuXYpE1DJe0l6zHVvY1bqs';
const SUPPORT_ADMIN_1   = '8671373607';
const SUPPORT_ADMIN_2   = '5222030484';
// In-memory store of admin reply states (cleared on function cold start, good enough)
// Format: { [adminChatId]: { userId, userName, expiresAt } }
const supportReplyStates = {};

exports.supportBotWebhook = functions.https.onRequest(async (req, res) => {
  res.status(200).send('OK'); // always ack immediately

  const update = req.body;
  if (!update) return;

  // ── Helper: send via support bot ──
  async function suppSend(chatId, text, markup) {
    const body = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (markup) body.reply_markup = markup;
    try {
      await fetch(`https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch(e) { console.error('suppSend error:', e.message); }
  }

  async function suppAnswer(queryId, text) {
    try {
      await fetch(`https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: queryId, text, show_alert: true })
      });
    } catch(e) {}
  }

  const ADMINS = [SUPPORT_ADMIN_1, SUPPORT_ADMIN_2];

  // ── Callback query: admin pressed “Reply via bot” ──
  const cq = update.callback_query;
  if (cq) {
    const cbData  = cq.data || '';
    const adminId = String(cq.from?.id || '');
    if (cbData.startsWith('reply_') && ADMINS.includes(adminId)) {
      const targetUserId = cbData.replace('reply_', '');
      // Store reply state for 5 minutes
      supportReplyStates[adminId] = {
        userId:    targetUserId,
        expiresAt: Date.now() + 5 * 60 * 1000
      };
      await suppAnswer(cq.id, `✏️ Reply mode ON — type your reply now and send it. It will go to user ${targetUserId}.`);
    }
    return;
  }

  // ── Message ──
  const msg    = update.message;
  if (!msg) return;
  const fromId = String(msg.from?.id || '');
  const text   = msg.text || msg.caption || '';
  if (!text) return;

  const isAdmin = ADMINS.includes(fromId);

  // ── Admin sends a message → check reply state ──
  if (isAdmin) {
    const state = supportReplyStates[fromId];
    if (state && state.expiresAt > Date.now()) {
      const targetId = state.userId;
      delete supportReplyStates[fromId];
      // Send reply to user
      const replyText = `📩 <b>Support reply:</b>\n\n${text}`;
      await suppSend(targetId, replyText);
      // Confirm to admin
      await suppSend(fromId, `✅ Reply sent to user <code>${targetId}</code>`);
    } else {
      // Admin texted bot without active reply state
      await suppSend(fromId, `ℹ️ No active reply target. Use the “Reply via bot” button on a support message first.`);
    }
    return;
  }

  // ── /start command → welcome message ──
  if (text.startsWith('/start')) {
    const firstName = msg.from?.first_name || 'there';
    await suppSend(fromId,
      `👋 <b>Hi, ${firstName}!</b>\n\n` +
      `Welcome to <b>TonPlay Support</b>. Just send your message and our team will reply as soon as possible.\n\n` +
      `🇧🇧 Или пишите на русском — мы ответим вам.`
    );
    return;
  }

  // ── Regular user message → look up user record (best-effort, no index needed) and forward to admins ──
  let userRecord = null;
  try {
    // Simple doc lookup by Telegram ID – no composite index required
    const snap = await db.collection('users').doc(fromId).get();
    if (snap.exists) userRecord = snap.data();
  } catch(e) { console.warn('User lookup failed (non-critical):', e.message); }

  const displayName = userRecord?.displayName || `${msg.from?.first_name || ''} ${msg.from?.last_name || ''}`.trim() || 'Unknown';
  const userName    = userRecord?.userName
    ? '@' + userRecord.userName
    : (msg.from?.username ? '@' + msg.from.username : fromId);
  const balance  = userRecord?.balance != null ? `${parseFloat(userRecord.balance).toFixed(2)} TON` : '—';
  const totalDep = userRecord?.totalDeposited != null ? `${parseFloat(userRecord.totalDeposited).toFixed(2)} TON` : '—';
  const lang     = userRecord?.lang || (msg.from?.language_code?.startsWith('ru') ? 'ru' : 'en');

  const header =
    `💬 <b>Support Message</b>\n` +
    `👤 ${displayName} (${userName})\n` +
    `🆔 <code>${fromId}</code>\n` +
    `💰 Balance: <b>${balance}</b> · Deposited: <b>${totalDep}</b>\n` +
    `🌐 ${lang === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}\n` +
    `─────────────────\n` +
    text;

  const replyBtn = {
    inline_keyboard: [[
      { text: '↩️ Reply via bot', callback_data: `reply_${fromId}` }
    ]]
  };

  // Forward to both admins
  for (const adminId of ADMINS) {
    await suppSend(adminId, header, replyBtn);
  }

  // Acknowledge receipt to user
  const isRu = lang === 'ru';
  await suppSend(
    fromId,
    isRu
      ? '✅ Сообщение получено! Поддержка ответит вам в ближайшее время.'
      : '✅ Message received! Our support team will reply shortly.'
  );

  console.log(`💬 Support msg from ${fromId} (${userName}): ${text.slice(0, 80)}`);
});

// Register support bot webhook (call once after deploy)
exports.setSupportWebhook = functions.https.onRequest(async (req, res) => {
  const baseUrl = `https://${req.hostname}`;
  // Derive the function URL from current request host (works on Firebase Gen 1)
  const target = `${baseUrl}/supportBotWebhook`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${SUPPORT_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: target, allowed_updates: ['message', 'callback_query'] })
    });
    const json = await r.json();
    res.json({ ok: json.ok, description: json.description, webhookUrl: target });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
