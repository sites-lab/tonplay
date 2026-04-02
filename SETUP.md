# TonPlay – TON Connect Integration

## What was implemented

### Frontend (`index.html`)
- **TON Connect UI SDK** integrated via CDN
- **Connect Wallet** button renders automatically in the deposit section
- Wallet connection state (dot indicator + truncated address) shown in real-time
- **Pay button** replaces the old "copy address" flow
- On click → generates a unique comment (e.g. `TP-123456-A1B2C3`) → sends a TON transaction via TON Connect
- Transaction opens in Tonkeeper / Telegram Wallet for user confirmation
- After submission → **polling starts** every 10 seconds against the TON Center API
- On detection → balance updates in Firestore automatically, success banner shown
- Full error handling: user rejects, wallet disconnects, amount too low, etc.

### Backend (`functions/index.js`)
- Firebase Cloud Function that **runs every 1 minute** (scheduled)
- Polls last 50 transactions on the vault wallet via TON Center API
- Parses the text comment from each transaction (handles both `msg.dataText` and `msg.dataRaw`)
- Matches comment to a `pendingPayments` Firestore document
- Verifies amount (with 1% slippage tolerance)
- Uses a **Firestore transaction** (atomic) to:
  - Mark `pendingPayment` as `confirmed`
  - Create a `deposits` record
  - Increment user `balance` and `totalDeposited`
  - Unlock withdrawals
- Sends an admin Telegram notification
- **Idempotent** — safe to run multiple times, won't double-credit

---

## Setup Instructions

### 1. TON Connect Manifest
Edit `tonconnect-manifest.json` with your actual deployed URL:
```json
{
  "url": "https://YOUR_ACTUAL_DOMAIN.com",
  "name": "TonPlay",
  "iconUrl": "https://YOUR_ACTUAL_DOMAIN.com/icon.png"
}
```
This file must be **publicly accessible** at the URL you set as `manifestUrl` in the JS.

In `index.html`, update this line:
```js
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: 'https://YOUR_ACTUAL_DOMAIN.com/tonconnect-manifest.json',
  ...
});
```

### 2. Deploy Firebase Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 3. (Optional) TON Center API Key
For higher rate limits (default is 1 req/sec):
1. Get a key at https://toncenter.com/api
2. Set it: `firebase functions:config:set ton.api_key="YOUR_KEY"`
3. Re-deploy: `firebase deploy --only functions`

Or paste it directly into `TONCENTER_KEY` in `functions/index.js`.

---

## How it works – User Flow

```
User enters amount
      ↓
Clicks "Pay with TON Wallet"
      ↓
Confirmation modal shown
      ↓
TON Connect opens Tonkeeper / Telegram Wallet
      ↓
User confirms transaction on-chain
      ↓
Frontend polls TON API every 10s  ←──┐
Cloud Function polls every 1 min  ←──┤
      ↓                              │
Comment matched to pendingPayment ───┘
      ↓
Firestore updated atomically
Balance credited instantly
Admin notified via Telegram
```

---

## Firestore Collections

| Collection         | Purpose                                               |
|--------------------|-------------------------------------------------------|
| `pendingPayments`  | Created on each Pay click; updated to `confirmed`     |
| `deposits`         | One record per confirmed deposit (`autoDetected: true`)|
| `users`            | Balance, totalDeposited updated automatically          |

---

## Security Notes
- Private keys are **never** used. Only user wallet signatures.
- The vault address is read-only on the frontend.
- The Cloud Function only reads the blockchain; it never sends transactions.
- Firestore transactions guarantee no double-crediting.
