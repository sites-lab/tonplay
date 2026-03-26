/**
 * TonPlay – Firebase Cloud Functions
 * ────────────────────────────────────────────────────────────────
 * 1. watchTonPayments       – every 1 min, auto-credits deposits
 * 2. processWeeklyYield     – every hour, pays 10% / 15% yield
 * 3. checkNoWithdrawBonus   – every hour, awards TG Stars to users
 *    who deposited ≥15 TON and haven't withdrawn:
 *      • After week 1  → notification (in-app + Telegram)
 *      • After 4 weeks (1 month) → Stars credited
 *        Stars = 100 base + 10 per extra TON above 15 (max 50 extra TON)
 *        Example: 20 TON → 100 + 50 = 150 ⭐
 *                 45 TON → 100 + 300 = 400 ⭐
 *                 65 TON → 100 + 500 = 600 ⭐ (capped)
 * 4. checkTonPayment        – HTTP manual trigger
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
const ADMIN_CHAT     = '5222030484';
const BOT_USERNAME   = 'Ton_Play_tbot';
const APP_PATH       = 'get_ton';

const SEVEN_DAYS_MS   = 7  * 24 * 60 * 60 * 1000;  // kept for NWB week-1 check
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;  // standard yield cycle
const TWO_WEEKS_MS    = 14 * 24 * 60 * 60 * 1000;  // premium yield cycle (100+ TON)
const FOUR_WEEKS_MS   = 28 * 24 * 60 * 60 * 1000;

// Yield
const YIELD_STANDARD     = 0.10;  // 10% every 15 days
const YIELD_PREMIUM      = 0.15;  // 15% every 2 weeks (100+ TON)
const PREMIUM_THRESHOLD  = 100;

// No-Withdraw Stars Bonus
const NWB_MIN_TON        = 15;    // min deposit to qualify
const NWB_BASE_STARS     = 100;   // base stars after 4 weeks
const NWB_STARS_PER_TON  = 10;    // extra stars per TON above 15
const NWB_MAX_EXTRA_TON  = 50;    // cap on extra TON (50 → max +500 extra)
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
// 3.  NO-WITHDRAW BONUS  (every hour)
//
//  Rules:
//  • Deposit must be ≥ 15 TON (originalAmount)
//  • No withdrawal recorded for this user since deposit
//
//  Timeline per qualifying deposit:
//    Week 1 (7 days)  → In-app + Telegram NOTIFICATION only
//                        "Keep going! Hold for 3 more weeks to earn ⭐ Stars"
//    Week 4 (28 days) → Stars credited + notification
//                        Stars = 100 + 10 × min(extraTON, 50)
//
//  Tracking stored on the deposit doc:
//    nwbWeek1NotifSent: bool
//    nwbStarsAwarded:   bool
// ═══════════════════════════════════════════════════════════════════
exports.checkNoWithdrawBonus = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async () => {
    console.log('⭐ Checking no-withdraw bonus...');
    try { await runNoWithdrawBonus(); } catch (err) { console.error('checkNoWithdrawBonus error:', err); }
    return null;
  });

exports.triggerNoWithdrawBonus = functions.https.onRequest(async (req, res) => {
  try {
    await runNoWithdrawBonus();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

async function runNoWithdrawBonus() {
  const now      = Date.now();
  const usersSnap = await db.collection('users').get();
  if (usersSnap.empty) return;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const ud     = userDoc.data();

    // Check if user has any completed (done) withdrawal
    const wdSnap = await db.collection('withdrawals')
      .where('userId', '==', userId)
      .where('status', '==', 'done')
      .limit(1)
      .get();
    const hasWithdrawn = !wdSnap.empty;

    // Also check pending withdrawals (to be safe — treat pending as "tried to withdraw")
    const wdPendingSnap = await db.collection('withdrawals')
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    const hasPendingWd = !wdPendingSnap.empty;

    if (hasWithdrawn || hasPendingWd) continue; // user withdrew — skip

    // Check active deposits ≥ NWB_MIN_TON
    const depositsSnap = await db
      .collection('users').doc(userId)
      .collection('deposits')
      .where('status', '==', 'active')
      .get();

    if (depositsSnap.empty) continue;

    for (const depDoc of depositsSnap.docs) {
      const dep       = depDoc.data();
      const original  = dep.originalAmount || dep.amount || 0;
      if (original < NWB_MIN_TON) continue;

      const createdTs = dep.createdAt?.toMillis ? dep.createdAt.toMillis() : null;
      if (!createdTs) continue;

      const ageMs = now - createdTs;

      // ── Week 1 notification (≥ 7 days, not yet sent) ──────────
      if (ageMs >= SEVEN_DAYS_MS && !dep.nwbWeek1NotifSent) {
        const extraTon   = Math.min(original - NWB_MIN_TON, NWB_MAX_EXTRA_TON);
        const starsToEarn = NWB_BASE_STARS + Math.floor(extraTon) * NWB_STARS_PER_TON;
        const lang = ud.lang || 'en';

        const week1Msg = lang === 'ru'
          ? `🎉 <b>Отличная работа!</b>\n\n` +
            `💎 Вы держите <b>${original.toFixed(1)} TON</b> уже 1 неделю без вывода!\n\n` +
            `⭐ <b>Продолжайте ещё 3 недели</b> (всего 1 месяц) — и получите\n` +
            `<b>${starsToEarn} Telegram Stars</b> прямо на свой аккаунт!\n\n` +
            `🏦 Ваш депозит продолжает расти (+10% каждые 15 дней). Не спешите выводить!\n\n` +
            `⏳ <i>Осталось 3 недели до награды</i>\n👇 Открыть приложение`
          : `🎉 <b>Great job!</b>\n\n` +
            `💎 You've held <b>${original.toFixed(1)} TON</b> for 1 full week without withdrawing!\n\n` +
            `⭐ <b>Keep going for 3 more weeks</b> (1 month total) and earn\n` +
            `<b>${starsToEarn} Telegram Stars</b> sent straight to your account!\n\n` +
            `🏦 Your deposit keeps growing (+10% every 15 days). Don't withdraw yet!\n\n` +
            `⏳ <i>3 weeks left until your Stars reward</i>\n👇 Open the app`;

        const appUrl = `https://t.me/${BOT_USERNAME}/${APP_PATH}`;
        const btnLabel = lang === 'ru' ? '🎮 Открыть TonPlay' : '🎮 Open TonPlay';

        await sendBotMessageWithButton(userId, week1Msg, btnLabel, appUrl);

        // Mark notif sent on the deposit doc
        await db.collection('users').doc(userId)
          .collection('deposits').doc(depDoc.id)
          .update({ nwbWeek1NotifSent: true });

        // Also write a Firestore notification so the in-app popup can show it
        await db.collection('users').doc(userId)
          .collection('notifications').add({
            type:    'nwb_week1',
            depositId: depDoc.id,
            starsToEarn,
            depositAmount: original,
            read:    false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

        console.log(`📣 Week-1 NWB notif → user ${userId} | deposit ${depDoc.id} | ${starsToEarn} ⭐ pending`);
      }

      // ── 4-week Stars payout (≥ 28 days, not yet awarded) ──────
      if (ageMs >= FOUR_WEEKS_MS && !dep.nwbStarsAwarded) {
        const extraTon    = Math.min(original - NWB_MIN_TON, NWB_MAX_EXTRA_TON);
        const starsEarned = NWB_BASE_STARS + Math.floor(extraTon) * NWB_STARS_PER_TON;
        const lang = ud.lang || 'en';

        // Credit stars to user doc
        await db.runTransaction(async (t) => {
          const depRef  = db.collection('users').doc(userId).collection('deposits').doc(depDoc.id);
          const userRef = db.collection('users').doc(userId);
          const [freshDep, freshUser] = await Promise.all([t.get(depRef), t.get(userRef)]);

          // Idempotency
          if (freshDep.data()?.nwbStarsAwarded) return;

          t.update(depRef, { nwbStarsAwarded: true, nwbStarsAmount: starsEarned });

          if (freshUser.exists) {
            const curStars = freshUser.data().referralStars || 0;
            t.update(userRef, { referralStars: curStars + starsEarned });
          }
        });

        // Telegram notification
        const appUrl   = `https://t.me/${BOT_USERNAME}/${APP_PATH}`;
        const btnLabel = lang === 'ru' ? '🎮 Открыть TonPlay' : '🎮 Open TonPlay';

        const starMsg = lang === 'ru'
          ? `🌟 <b>Поздравляем! Вы получили ${starsEarned} ⭐ Telegram Stars!</b>\n\n` +
            `💎 Вы держали <b>${original.toFixed(1)} TON</b> целый месяц без вывода — это потрясающе!\n\n` +
            `📊 <b>Как начислено:</b>\n` +
            `• Базовая награда: 100 ⭐\n` +
            `• Бонус за депозит (${Math.min(Math.floor(original - NWB_MIN_TON), NWB_MAX_EXTRA_TON)} TON × 10): +${Math.floor(extraTon) * NWB_STARS_PER_TON} ⭐\n` +
            `• <b>Итого: ${starsEarned} ⭐ Stars</b>\n\n` +
            `⭐ Stars уже зачислены на ваш баланс в TonPlay!\n\n` +
            `👇 Откройте приложение, чтобы увидеть свой баланс`
          : `🌟 <b>Congratulations! You've earned ${starsEarned} ⭐ Telegram Stars!</b>\n\n` +
            `💎 You held <b>${original.toFixed(1)} TON</b> for a full month without withdrawing — incredible!\n\n` +
            `📊 <b>How it's calculated:</b>\n` +
            `• Base reward: 100 ⭐\n` +
            `• Deposit bonus (${Math.min(Math.floor(original - NWB_MIN_TON), NWB_MAX_EXTRA_TON)} TON × 10): +${Math.floor(extraTon) * NWB_STARS_PER_TON} ⭐\n` +
            `• <b>Total: ${starsEarned} ⭐ Stars</b>\n\n` +
            `⭐ Stars have been credited to your TonPlay balance!\n\n` +
            `👇 Open the app to see your Stars balance`;

        await sendBotMessageWithButton(userId, starMsg, btnLabel, appUrl);

        // In-app notification
        await db.collection('users').doc(userId)
          .collection('notifications').add({
            type:    'nwb_stars_awarded',
            depositId: depDoc.id,
            starsEarned,
            depositAmount: original,
            read:    false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

        // Admin log
        await sendBotMessage(
          `⭐ <b>NWB Stars Awarded</b>\n` +
          `👤 User: ${ud.userName ? '@'+ud.userName : userId}\n` +
          `💰 Deposit: ${original.toFixed(2)} TON (held 4 weeks)\n` +
          `⭐ Stars: ${starsEarned}`
        );

        console.log(`✅ NWB Stars: ${starsEarned} ⭐ → user ${userId} | deposit ${depDoc.id}`);
      }
    }
  }
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
      nwbWeek1NotifSent: false,
      nwbStarsAwarded:   false,
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


// ─── Telegram Bot helpers ──────────────────────────────────────────
async function sendBotMessage(text) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: ADMIN_CHAT, text, parse_mode: 'HTML' })
    });
  } catch(e) { console.error('Bot admin msg failed:', e.message); }
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
