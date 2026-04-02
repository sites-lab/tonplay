<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>TonPlay</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">

<!-- TON Connect UI SDK -->
<script src="https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js"></script>

<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#F0F4FF;--surf:#FFFFFF;--card:#FFFFFF;--card2:#F7F9FF;
  --ton:#2196F3;--ton2:#1565C0;--ton-light:#E3F0FF;
  --gold:#F59E0B;--gold2:#D97706;--gold-light:#FEF3C7;
  --green:#10B981;--green-light:#D1FAE5;
  --red:#EF4444;--red-light:#FEE2E2;
  --text:#0F172A;--sub:#64748B;--muted:#94A3B8;--border:#E2E8F0;
  --shadow:0 1px 3px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.04);
  --r:16px;--r-sm:10px;
}

html,body{
  height:100%;width:100%;
  background:var(--bg);color:var(--text);
  font-family:'Inter',sans-serif;
  overflow:hidden;
  user-select:none;-webkit-user-select:none;
  -webkit-tap-highlight-color:transparent;
}

.bg-layer{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
.bg-layer::before{content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at 20% 10%,rgba(33,150,243,0.08) 0%,transparent 55%),
             radial-gradient(ellipse at 85% 80%,rgba(99,102,241,0.07) 0%,transparent 50%),
             radial-gradient(ellipse at 50% 50%,rgba(16,185,129,0.04) 0%,transparent 60%);}
.bg-circle{position:absolute;border-radius:50%;background:rgba(33,150,243,0.06);animation:floatCircle var(--d,12s) ease-in-out infinite var(--dl,0s);}
@keyframes floatCircle{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(var(--tx,10px),var(--ty,-15px)) scale(1.04)}}

.app{position:fixed;inset:0;z-index:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg);}

/* ─── HEADER ─── */
.header{padding:10px 14px 9px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:var(--surf);border-bottom:1px solid var(--border);box-shadow:0 1px 4px rgba(0,0,0,0.06);width:100%;}
.logo{display:flex;align-items:center;gap:9px;}
.logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#2196F3,#1565C0);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(33,150,243,0.3);flex-shrink:0;}
.logo-icon svg{width:18px;height:18px;}
.logo-name{font-size:19px;font-weight:900;color:var(--text);letter-spacing:-0.5px;}
.logo-name span{color:var(--ton);}
.header-right{display:flex;align-items:center;gap:7px;}
.stars-chip{background:linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.06));border:1.5px solid rgba(245,158,11,0.35);border-radius:40px;padding:4px 10px 4px 7px;display:flex;align-items:center;gap:5px;}
.stars-chip-icon{font-size:15px;line-height:1;}
.stars-chip-val{font-family:'DM Mono',monospace;font-size:12px;font-weight:700;color:var(--gold2);line-height:1.2;}
.bal-chip{background:var(--ton-light);border:1px solid rgba(33,150,243,0.2);border-radius:40px;padding:5px 12px 5px 8px;display:flex;align-items:center;gap:7px;}
.bci{width:26px;height:26px;border-radius:50%;background:linear-gradient(160deg,#2AABEE 0%,#0088CC 60%,#005F99 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(0,136,204,0.45),inset 0 1px 0 rgba(255,255,255,0.25);}
.bci svg{width:16px;height:16px;}
.bc-val{font-family:'DM Mono',monospace;font-size:12px;font-weight:600;color:var(--ton2);line-height:1.2;}
.bc-unit{font-size:9px;color:var(--sub);margin-left:1px;}

/* ─── TAB BAR ─── */
.tab-bar{display:flex;padding:8px 12px 4px;gap:4px;flex-shrink:0;background:var(--surf);border-bottom:1px solid var(--border);}
.tab-btn{flex:1;padding:8px 4px;border:1.5px solid var(--border);background:var(--surf);color:var(--sub);font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:.3px;cursor:pointer;border-radius:12px;transition:all 0.18s;display:flex;flex-direction:column;align-items:center;gap:3px;line-height:1;}
.tab-btn svg{width:17px;height:17px;}
.tab-btn.active{background:linear-gradient(145deg,rgba(33,150,243,0.1),rgba(33,150,243,0.04));border-color:rgba(33,150,243,0.4);color:var(--ton);box-shadow:0 2px 8px rgba(33,150,243,0.1);}
.tab-btn.ref-tab.active{background:linear-gradient(145deg,rgba(16,185,129,0.1),rgba(16,185,129,0.03));border-color:rgba(16,185,129,0.4);color:var(--green);}
.tab-btn.wd-tab.active{background:linear-gradient(145deg,rgba(245,158,11,0.1),rgba(245,158,11,0.03));border-color:rgba(245,158,11,0.4);color:var(--gold);}

/* ─── USER LINE ─── */
.user-line{padding:3px 14px 4px;font-size:10px;color:var(--sub);font-weight:500;flex-shrink:0;background:var(--surf);border-bottom:1px solid var(--border);}

/* ─── TAB CONTENT ─── */
.tab-content{flex:1;width:100%;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:12px 12px 80px;display:none;}
.tab-content.active{display:block;}
.tab-content::-webkit-scrollbar{width:3px;}
.tab-content::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}

/* ─── TON CONNECT WALLET BANNER ─── */
.wallet-banner{
  background:linear-gradient(135deg,rgba(33,150,243,0.08),rgba(21,101,192,0.04));
  border:1.5px solid rgba(33,150,243,0.2);
  border-radius:16px;padding:14px 16px;margin-bottom:12px;
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  width:100%;
}
.wallet-banner-info{display:flex;align-items:center;gap:10px;min-width:0;}
.wallet-banner-dot{width:8px;height:8px;border-radius:50%;background:var(--muted);flex-shrink:0;transition:background .3s;}
.wallet-banner-dot.connected{background:var(--green);box-shadow:0 0 0 3px rgba(16,185,129,0.2);animation:pulse 1.8s ease-in-out infinite;}
.wallet-banner-text{min-width:0;}
.wallet-banner-label{font-size:10px;font-weight:700;color:var(--sub);letter-spacing:.3px;text-transform:uppercase;}
.wallet-banner-addr{font-family:'DM Mono',monospace;font-size:11px;color:var(--text);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

/* TON Connect Button Overrides */
#ton-connect-btn-container{flex-shrink:0;}
#ton-connect-btn-container tc-root{
  --tc-button-background:linear-gradient(135deg,var(--ton),var(--ton2)) !important;
  --tc-button-border-radius:10px !important;
}

/* ─── DEPOSIT CARD (new Web3 style) ─── */
.deposit-web3-card{
  background:var(--surf);border:1px solid var(--border);
  border-radius:var(--r);padding:16px;margin-bottom:10px;
  box-shadow:var(--shadow);width:100%;
}
.deposit-web3-title{font-size:13px;font-weight:800;color:var(--text);margin-bottom:4px;}
.deposit-web3-sub{font-size:10px;color:var(--sub);line-height:1.5;margin-bottom:14px;}

/* ─── PAY BUTTON ─── */
.btn-pay{
  width:100%;padding:15px;
  background:linear-gradient(135deg,#1565C0,#2196F3,#42A5F5);
  color:#fff;border:none;border-radius:14px;
  font-family:'Inter',sans-serif;font-size:15px;font-weight:800;
  cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;
  box-shadow:0 6px 20px rgba(33,150,243,0.35);
  transition:all .2s;
  letter-spacing:-.2px;
}
.btn-pay:not(:disabled):active{transform:scale(0.97);}
.btn-pay:disabled{opacity:.5;cursor:not-allowed;}
.btn-pay-icon{width:22px;height:22px;background:rgba(255,255,255,0.2);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

/* Payment status indicator */
.pay-status{
  display:none;align-items:center;gap:10px;
  background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.04));
  border:1.5px solid rgba(16,185,129,0.3);
  border-radius:12px;padding:12px 14px;margin-top:10px;
}
.pay-status.show{display:flex;}
.pay-status-icon{font-size:18px;flex-shrink:0;}
.pay-status-text{font-size:11px;color:var(--green);font-weight:700;line-height:1.4;}

/* Pending detection banner */
.detection-banner{
  display:none;
  align-items:center;gap:10px;
  background:rgba(245,158,11,0.08);
  border:1.5px solid rgba(245,158,11,0.3);
  border-radius:12px;padding:12px 14px;margin-top:10px;
}
.detection-banner.show{display:flex;}
.detection-banner-text{font-size:11px;color:var(--gold2);font-weight:600;line-height:1.4;}

/* ─── GENERIC CARD ─── */
.card{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--shadow);margin-bottom:10px;overflow:hidden;width:100%;}
.card-pad{padding:16px;}

/* ─── HERO BALANCE CARD ─── */
.hero-card{background:linear-gradient(135deg,#1565C0 0%,#2196F3 50%,#42A5F5 100%);border-radius:20px;padding:16px;margin-bottom:12px;position:relative;overflow:hidden;box-shadow:0 6px 24px rgba(33,150,243,0.3);width:100%;display:block;transition:background .3s;}
.hero-card::before{content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.07);}
.hero-card::after{content:'';position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.05);}
.hero-label{font-size:10px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;}
.hero-balance{font-family:'DM Mono',monospace;font-size:32px;font-weight:500;color:#fff;line-height:1.1;margin-bottom:2px;word-break:break-all;}
.hero-balance-unit{font-size:14px;color:rgba(255,255,255,0.7);font-weight:500;}
.hero-sub{font-size:11px;color:rgba(255,255,255,0.65);margin-bottom:16px;}
.hero-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;position:relative;z-index:1;margin-top:10px;}
.hero-stat{background:rgba(255,255,255,0.14);border-radius:12px;padding:10px 12px;}
.hero-stat-val{font-family:'DM Mono',monospace;font-size:18px;font-weight:700;color:#fff;line-height:1;word-break:break-all;}
.hero-stat-lbl{font-size:9px;color:rgba(255,255,255,0.65);margin-top:3px;font-weight:600;letter-spacing:.3px;}

/* ─── 7-DAY PROJECTION BOX ─── */
.hero-projection{
  background:rgba(255,255,255,0.13);
  border:1.5px solid rgba(255,255,255,0.28);
  border-radius:14px;
  padding:11px 14px;
  margin-top:12px;
  display:none;
  position:relative;z-index:1;
}
.hero-projection.visible{display:block;}
.hero-projection-label{font-size:9px;font-weight:800;color:rgba(255,255,255,0.7);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;}
.hero-projection-row{display:flex;align-items:center;justify-content:space-between;}
.hero-projection-left{display:flex;align-items:center;gap:8px;}
.hero-projection-icon{font-size:20px;line-height:1;}
.hero-projection-desc{font-size:10px;color:rgba(255,255,255,0.75);line-height:1.4;}
.hero-projection-val{font-family:'DM Mono',monospace;font-size:22px;font-weight:700;color:#fff;line-height:1;}
.hero-projection-unit{font-size:10px;color:rgba(255,255,255,0.65);margin-top:1px;text-align:right;}
.hero-projection-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.35);border-radius:20px;padding:3px 9px;font-size:9px;font-weight:800;color:#fff;margin-top:7px;}

/* ─── YIELD BADGE ─── */
.yield-badge{display:inline-flex;align-items:center;gap:6px;background:var(--green-light);border:1.5px solid rgba(16,185,129,0.3);border-radius:40px;padding:6px 14px;font-size:11px;font-weight:700;color:var(--green);margin-bottom:12px;}
.yield-dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 1.8s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}

/* ─── DEPOSIT FORM ─── */
.deposit-form{background:var(--card2);border:1.5px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:10px;width:100%;display:block;}
.form-label{font-size:11px;font-weight:700;color:var(--sub);letter-spacing:.4px;text-transform:uppercase;margin-bottom:6px;display:block;}
.amount-input-wrap{position:relative;margin-bottom:12px;}
.amount-input{width:100%;padding:14px 54px 14px 16px;background:var(--surf);border:1.5px solid var(--border);border-radius:12px;color:var(--text);font-family:'DM Mono',monospace;font-size:18px;font-weight:600;outline:none;transition:border-color .2s;}
.amount-input:focus{border-color:var(--ton);box-shadow:0 0 0 3px rgba(33,150,243,0.1);}
.amount-input::placeholder{color:var(--muted);font-size:14px;font-weight:400;}
.ton-label{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:12px;font-weight:700;color:var(--sub);}
.amount-presets{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;}
.preset-btn{padding:6px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--surf);font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:var(--sub);cursor:pointer;}
.preset-btn.selected{border-color:var(--ton);background:var(--ton-light);color:var(--ton);}

/* ─── WEEKLY EARNINGS PREVIEW ─── */
.earn-preview{background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.03));border:1.5px solid rgba(16,185,129,0.25);border-radius:14px;padding:12px 14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;}
.earn-preview-left{display:flex;align-items:center;gap:10px;}
.earn-preview-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--green),#059669);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;}
.earn-preview-label{font-size:10px;color:var(--sub);font-weight:700;letter-spacing:.3px;text-transform:uppercase;}
.earn-preview-val{font-family:'DM Mono',monospace;font-size:18px;font-weight:700;color:var(--green);line-height:1.1;}
.earn-preview-unit{font-size:10px;color:var(--sub);margin-top:1px;}

/* ─── SPECIAL DEAL BANNER ─── */
.special-deal{background:linear-gradient(135deg,#7C3AED,#6D28D9,#5B21B6);border-radius:18px;padding:16px;margin-bottom:10px;position:relative;overflow:hidden;box-shadow:0 6px 20px rgba(124,58,237,0.3);width:100%;}
.special-deal::before{content:'';position:absolute;top:-20px;right:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.07);pointer-events:none;}
.special-deal::after{content:'';position:absolute;bottom:-15px;left:10px;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.05);pointer-events:none;}
.deal-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.2);border:1.5px solid rgba(255,255,255,0.35);border-radius:20px;padding:3px 10px;font-size:9px;font-weight:800;color:#fff;letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;}
.deal-title{font-size:15px;font-weight:900;color:#fff;margin-bottom:4px;letter-spacing:-.3px;}
.deal-sub{font-size:11px;color:rgba(255,255,255,0.8);line-height:1.5;margin-bottom:12px;}
.deal-stats{display:flex;gap:8px;}
.deal-stat{flex:1;background:rgba(255,255,255,0.12);border-radius:10px;padding:9px 10px;text-align:center;}
.deal-stat-val{font-family:'DM Mono',monospace;font-size:16px;font-weight:700;color:#fff;line-height:1;}
.deal-stat-lbl{font-size:9px;color:rgba(255,255,255,0.7);margin-top:3px;font-weight:600;letter-spacing:.3px;}

/* ─── DEPOSIT SLOT CARDS ─── */
/* Number-switcher pills inside hero card */
.dep-switcher{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px;position:relative;z-index:2;}
.dep-sw-pill{
  width:30px;height:30px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-family:'DM Mono',monospace;font-size:11px;font-weight:800;
  cursor:pointer;border:2px solid rgba(255,255,255,0.4);
  background:rgba(255,255,255,0.18);color:#fff;
  transition:all .18s;flex-shrink:0;
}
.dep-sw-pill:active{transform:scale(0.9);}
.dep-sw-pill.active{
  background:#fff;border-color:#fff;
  box-shadow:0 2px 10px rgba(0,0,0,0.25);transform:scale(1.1);
}
/* pill active text colour matches the slot accent */
.dep-sw-pill.active.sc1{color:#1565C0;}
.dep-sw-pill.active.sc2{color:#B45309;}
.dep-sw-pill.active.sc3{color:#065F46;}
.dep-sw-pill.active.sc4{color:#374151;}
.dep-sw-pill.active.sc5{color:#5B21B6;}
.dep-sw-pill.active.sc6{color:#991B1B;}
.dep-sw-pill.active.sc7{color:#831843;}
.dep-sw-pill.active.sc8{color:#134E4A;}
.dep-sw-pill.active.sc9{color:#7C2D12;}
.dep-sw-pill.active.sc10{color:#1E1B4B;}

/* Inline deposit panel inside the hero card — now the MAIN content when a deposit is selected */
.dep-inline-panel{
  margin-top:8px;
  position:relative;z-index:1;
  animation:fadeIn .2s ease;
}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.dep-inline-panel.hidden{display:none;}
.dep-inline-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;}
.dep-inline-label{font-size:9px;font-weight:800;color:rgba(255,255,255,0.7);letter-spacing:1px;text-transform:uppercase;}
.dep-inline-status{font-size:8px;font-weight:800;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.35);letter-spacing:.4px;}
.dep-inline-amount{font-family:'DM Mono',monospace;font-size:32px;font-weight:700;color:#fff;line-height:1;}
.dep-inline-unit{font-size:12px;color:rgba(255,255,255,0.7);font-weight:600;margin-bottom:4px;}
.dep-inline-will-get{font-size:13px;color:rgba(255,255,255,0.9);font-weight:800;margin-bottom:6px;}
.dep-inline-will-get span{color:#86EFAC;font-size:18px;}
.dep-inline-meta{display:flex;align-items:center;justify-content:space-between;}
.dep-inline-date{font-size:9px;color:rgba(255,255,255,0.6);font-weight:600;}
.dep-inline-badge{font-size:9px;font-weight:800;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.3);}
.dep-inline-cd{font-size:10px;font-weight:700;color:rgba(255,255,255,0.9);margin-top:5px;display:flex;align-items:center;gap:4px;}
.dep-inline-cd.ready{color:#86EFAC;}

/* ─── DEPOSIT HISTORY TEXT LIST ─── */
.dep-history-list{display:flex;flex-direction:column;gap:0;margin-bottom:10px;}
.dep-history-row{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 14px;border-bottom:1px solid var(--border);
  gap:10px;
}
.dep-history-row:last-child{border-bottom:none;}
.dep-history-num{
  width:24px;height:24px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-family:'DM Mono',monospace;font-size:10px;font-weight:800;
  flex-shrink:0;cursor:pointer;
  transition:all .15s;
}
.dep-history-info{flex:1;min-width:0;}
.dep-history-amount{font-family:'DM Mono',monospace;font-size:13px;font-weight:700;color:var(--text);}
.dep-history-meta{font-size:10px;color:var(--sub);margin-top:1px;}
.dep-history-right{text-align:right;flex-shrink:0;}
.dep-history-yield{font-size:12px;font-weight:800;}
.dep-history-rate{font-size:9px;color:var(--sub);margin-top:1px;}
.dep-history-cd{font-size:9px;font-weight:700;color:var(--ton);margin-top:2px;}
.dep-history-cd.ready{color:var(--green);}

/* ─── DEPOSIT ITEMS (legacy) ─── */
.deposit-item{display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid var(--border);}
.deposit-item:last-child{border:none;}
.di-icon{width:40px;height:40px;border-radius:12px;background:var(--ton-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.di-icon svg{width:18px;height:18px;}
.di-info{flex:1;min-width:0;}
.di-amount{font-family:'DM Mono',monospace;font-size:14px;font-weight:600;color:var(--text);}
.di-date{font-size:10px;color:var(--sub);margin-top:2px;}
.di-right{text-align:right;flex-shrink:0;}
.di-yield{font-size:11px;font-weight:700;color:var(--green);}
.di-weeks{font-size:10px;color:var(--sub);}
/* ─── Deposit countdown ─── */
.di-countdown{font-size:10px;font-weight:700;color:var(--ton);margin-top:3px;display:flex;align-items:center;gap:4px;}
.di-countdown.urgent{color:var(--gold2);}
.di-countdown.ready{color:var(--green);}
.di-rate-badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;margin-top:3px;}
.di-rate-badge.premium{background:linear-gradient(135deg,rgba(124,58,237,0.12),rgba(124,58,237,0.06));color:#7C3AED;border:1px solid rgba(124,58,237,0.25);}
.di-rate-badge.standard{background:var(--ton-light);color:var(--ton2);border:1px solid rgba(33,150,243,0.2);}

/* ─── INFO TILES ─── */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;width:100%;}
.info-tile{background:var(--surf);border:1px solid var(--border);border-radius:14px;padding:12px;box-shadow:var(--shadow);text-align:center;}
.info-tile-val{font-family:'DM Mono',monospace;font-size:20px;font-weight:600;color:var(--ton);margin-bottom:2px;}
.info-tile-lbl{font-size:10px;color:var(--sub);font-weight:600;}
.info-box{background:var(--ton-light);border:1.5px solid rgba(33,150,243,0.2);border-radius:14px;padding:14px;margin-bottom:10px;width:100%;}
.info-box-title{font-size:12px;font-weight:800;color:var(--ton2);margin-bottom:8px;}
.info-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(33,150,243,0.1);font-size:11px;}
.info-row:last-child{border:none;}
.ir-l{color:var(--sub);font-weight:600;}
.ir-r{font-family:'DM Mono',monospace;color:var(--text);font-weight:600;}

/* ─── REFERRAL HERO ─── */
.ref-hero{background:linear-gradient(135deg,#059669,#10B981);border-radius:16px;padding:12px 14px;margin-bottom:10px;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(16,185,129,0.22);width:100%;display:block;}
.ref-hero::before{content:'';position:absolute;top:-16px;right:-16px;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,0.08);pointer-events:none;}
.ref-hero-title{font-size:13px;font-weight:800;color:#fff;margin-bottom:2px;}
.ref-hero-sub{font-size:10px;color:rgba(255,255,255,0.8);margin-bottom:10px;line-height:1.4;}
.ref-code-box{background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.3);border-radius:11px;padding:10px 12px;display:flex;flex-direction:column;gap:7px;width:100%;}
.ref-code-label{font-size:9px;color:rgba(255,255,255,0.75);letter-spacing:1px;text-transform:uppercase;font-weight:700;}
.ref-code-val{font-family:'DM Mono',monospace;font-size:18px;color:#fff;font-weight:700;letter-spacing:3px;word-break:break-all;line-height:1.2;}
.ref-link-box{background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.3);border-radius:8px;padding:7px 10px;font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,0.9);word-break:break-all;line-height:1.5;width:100%;}
.ref-copy-btn{background:rgba(255,255,255,0.25);border:2px solid rgba(255,255,255,0.5);border-radius:9px;padding:9px 14px;font-size:12px;font-weight:800;color:#fff;cursor:pointer;width:100%;text-align:center;}
.ref-copy-btn:active{transform:scale(0.97);background:rgba(255,255,255,0.35);}

/* ─── REF STATS ─── */
.ref-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;width:100%;}
.ref-stat{background:var(--surf);border:1px solid var(--border);border-radius:14px;padding:12px;text-align:center;box-shadow:var(--shadow);}
.ref-stat-val{font-family:'DM Mono',monospace;font-size:20px;font-weight:700;color:var(--green);margin-bottom:2px;}
.ref-stat-lbl{font-size:10px;color:var(--sub);font-weight:600;}

/* ─── MILESTONES (single card, list rows) ─── */
.milestones-wrap{
  background:var(--surf);
  border:1px solid var(--border);
  border-radius:18px;
  box-shadow:var(--shadow);
  overflow:hidden;
  margin-bottom:12px;
}

.ms-row{
  display:flex;
  align-items:center;
  gap:12px;
  padding:12px 14px;
  border-bottom:1px solid var(--border);
  position:relative;
  transition:background .15s;
}
.ms-row:last-child{border-bottom:none;}
.ms-row.done-ms{}
.ms-row.next-ms{
  background:linear-gradient(90deg,rgba(99,102,241,0.04),transparent);
}
.ms-row.locked-ms{
  opacity:.5;
  filter:saturate(0.4);
}

/* Left accent bar */
.ms-row::before{
  content:'';
  position:absolute;
  left:0;top:8px;bottom:8px;
  width:3px;
  border-radius:0 3px 3px 0;
  opacity:0;
}
.ms-row.done-ms::before{background:var(--green);opacity:1;}
.ms-row.next-ms::before{background:#6366F1;opacity:1;animation:ms-bar-pulse 2s ease-in-out infinite;}
.ms-row.locked-ms::before{background:var(--muted);opacity:.4;}
.ms-row:not(.done-ms):not(.next-ms):not(.locked-ms)::before{background:var(--gold);opacity:1;}
@keyframes ms-bar-pulse{0%,100%{opacity:.6}50%{opacity:1}}

/* Icon badge */
.ms-icon-badge{
  width:42px;height:42px;
  border-radius:14px;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
  position:relative;
  overflow:hidden;
}
.ms-row.done-ms   .ms-icon-badge{background:linear-gradient(145deg,#059669,#34D399);box-shadow:0 3px 10px rgba(16,185,129,0.3);}
.ms-row.next-ms   .ms-icon-badge{background:linear-gradient(145deg,#4F46E5,#9333EA);box-shadow:0 3px 10px rgba(99,102,241,0.35);}
.ms-row.locked-ms .ms-icon-badge{background:linear-gradient(145deg,#94A3B8,#64748B);}
.ms-row:not(.done-ms):not(.next-ms):not(.locked-ms) .ms-icon-badge{background:linear-gradient(145deg,#D97706,#FBBF24);box-shadow:0 3px 10px rgba(245,158,11,0.3);}

.ms-star-svg{width:24px;height:24px;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.3));position:relative;z-index:2;}

/* Telegram icon behind star in milestone badge */
.ms-tg-bg{
  position:absolute;inset:0;
  display:flex;align-items:center;justify-content:center;
  z-index:1;
  pointer-events:none;
}
.ms-tg-bg svg{
  width:36px;height:36px;
  opacity:0.18;
  animation:ms-tg-float 3.5s ease-in-out infinite;
}
.ms-row.done-ms .ms-tg-bg svg{opacity:0.22;animation:ms-tg-float 3.5s ease-in-out infinite;}
.ms-row.next-ms .ms-tg-bg svg{opacity:0.28;animation:ms-tg-pulse 2.2s ease-in-out infinite;}
@keyframes ms-tg-float{
  0%,100%{transform:scale(1) rotate(-6deg);opacity:0.18;}
  50%{transform:scale(1.15) rotate(4deg);opacity:0.28;}
}
@keyframes ms-tg-pulse{
  0%,100%{transform:scale(1) rotate(0deg);opacity:0.22;}
  40%{transform:scale(1.2) rotate(-5deg);opacity:0.38;}
  70%{transform:scale(0.95) rotate(3deg);opacity:0.25;}
}

/* Telegram Stars label below reward value */
.ms-tg-stars-lbl{
  font-size:8px;
  font-weight:800;
  letter-spacing:.3px;
  text-transform:uppercase;
  display:flex;
  align-items:center;
  gap:3px;
  margin-top:1px;
}
.ms-row.done-ms   .ms-tg-stars-lbl{color:rgba(16,185,129,0.7);}
.ms-row.next-ms   .ms-tg-stars-lbl{color:rgba(99,102,241,0.8);}
.ms-row.locked-ms .ms-tg-stars-lbl{color:var(--muted);}
.ms-row:not(.done-ms):not(.next-ms):not(.locked-ms) .ms-tg-stars-lbl{color:rgba(217,119,6,0.75);}

/* Middle: info */
.ms-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;}

.ms-info-top{display:flex;align-items:center;justify-content:space-between;gap:6px;}
.ms-friends-label{
  font-size:13px;font-weight:800;
  color:var(--text);
  letter-spacing:-.2px;
}
.ms-status-chip{
  font-size:8px;font-weight:800;
  padding:2px 8px;
  border-radius:20px;
  letter-spacing:.4px;
  text-transform:uppercase;
  flex-shrink:0;
}
.ms-status-chip.done  {background:var(--green-light);color:var(--green);border:1px solid rgba(16,185,129,0.3);}
.ms-status-chip.next  {background:rgba(99,102,241,0.1);color:#6366F1;border:1px solid rgba(99,102,241,0.3);}
.ms-status-chip.locked{background:var(--card2);color:var(--muted);border:1px solid var(--border);}
.ms-status-chip.gold  {background:var(--gold-light);color:var(--gold2);border:1px solid rgba(245,158,11,0.3);}

/* Stars reward */
.ms-reward-line{
  display:flex;align-items:center;gap:5px;
}
.ms-reward-val{
  font-family:'DM Mono',monospace;
  font-size:11px;font-weight:700;
}
.ms-row.done-ms   .ms-reward-val{color:var(--green);}
.ms-row.next-ms   .ms-reward-val{color:#6366F1;}
.ms-row.locked-ms .ms-reward-val{color:var(--muted);}
.ms-row:not(.done-ms):not(.next-ms):not(.locked-ms) .ms-reward-val{color:var(--gold2);}

/* Progress bar */
.ms-bar{height:4px;background:var(--border);border-radius:3px;overflow:hidden;margin-top:2px;}
.ms-bar-fill{height:100%;border-radius:3px;transition:width .8s cubic-bezier(.4,0,.2,1);}
.ms-row.done-ms   .ms-bar-fill{background:linear-gradient(90deg,#059669,#6EE7B7);}
.ms-row.next-ms   .ms-bar-fill{background:linear-gradient(90deg,#4F46E5,#9333EA);}
.ms-row.locked-ms .ms-bar-fill{background:var(--muted);}
.ms-row:not(.done-ms):not(.next-ms):not(.locked-ms) .ms-bar-fill{background:linear-gradient(90deg,#D97706,#FBBF24);}

/* ─── REF ENTER CODE ─── */
.ref-enter-card{background:var(--card2);border:1.5px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:10px;width:100%;}
.ref-input{width:100%;padding:13px 16px;background:var(--surf);border:1.5px solid var(--border);border-radius:12px;color:var(--text);font-family:'DM Mono',monospace;font-size:16px;outline:none;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;}
.ref-input:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(16,185,129,0.1);}
.ref-input::placeholder{text-transform:none;letter-spacing:0;font-size:12px;font-family:'Inter',sans-serif;}
.btn-green{width:100%;padding:13px;background:linear-gradient(135deg,#059669,#10B981);color:#fff;border:none;border-radius:12px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(16,185,129,0.25);}
.btn-green:active{transform:scale(0.97);}
.ref-used-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:10px;font-weight:700;background:var(--green-light);border:1px solid rgba(16,185,129,0.3);color:var(--green);margin-bottom:8px;}
.btn-share{width:100%;padding:11px;background:var(--ton-light);border:1.5px solid rgba(33,150,243,0.3);border-radius:12px;color:var(--ton);font-family:'Inter',sans-serif;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;margin-bottom:12px;}
.btn-share:active{transform:scale(0.97);}

/* ─── WITHDRAW HERO ─── */
.wd-hero{background:linear-gradient(135deg,#D97706,#F59E0B);border-radius:20px;padding:18px;margin-bottom:12px;position:relative;overflow:hidden;box-shadow:0 6px 20px rgba(245,158,11,0.25);width:100%;display:block;}
.wd-hero-title{font-size:16px;font-weight:800;color:#fff;margin-bottom:4px;}
.wd-hero-sub{font-size:11px;color:rgba(255,255,255,0.75);}
.wd-hero-bal{font-family:'DM Mono',monospace;font-size:28px;font-weight:600;color:#fff;margin:10px 0 4px;word-break:break-all;}
.wd-form-card{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:10px;box-shadow:var(--shadow);width:100%;}
.wd-form-title{font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px;}
.wd-form-sub{font-size:10px;color:var(--sub);margin-bottom:12px;line-height:1.5;}
.wd-input{width:100%;padding:11px 13px;background:var(--card2);border:1.5px solid var(--border);border-radius:11px;color:var(--text);font-family:'DM Mono',monospace;font-size:12px;outline:none;margin-bottom:8px;}
.wd-input:focus{border-color:var(--ton);}
.wd-input::placeholder{color:var(--muted);font-family:'Inter',sans-serif;font-size:11px;}
.btn-gold{width:100%;padding:13px;background:linear-gradient(135deg,#D97706,#F59E0B);color:#fff;border:none;border-radius:12px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(245,158,11,0.3);display:flex;align-items:center;justify-content:center;gap:7px;}
.btn-gold:active{transform:scale(0.97);}
.wd-locked-card{background:var(--red-light);border:1.5px solid rgba(239,68,68,0.2);border-radius:14px;padding:16px;text-align:center;margin-bottom:10px;width:100%;}
.wd-locked-title{font-size:14px;font-weight:800;color:var(--red);margin-bottom:6px;}
.wd-locked-sub{font-size:11px;color:var(--sub);line-height:1.6;}

/* ─── CRYPTO WALLET CARD ─── */
.crypto-addr-card{background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(217,119,6,0.04));border:1.5px solid rgba(245,158,11,0.3);border-radius:16px;padding:16px 16px 16px 20px;margin-bottom:10px;position:relative;width:100%;}
.crypto-addr-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--gold),var(--gold2));border-radius:16px 0 0 16px;}
.crypto-addr-label{font-size:10px;font-weight:800;color:var(--gold2);letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px;}
.crypto-addr-desc{font-size:11px;color:var(--sub);line-height:1.5;margin-bottom:10px;}
.crypto-addr-input{width:100%;padding:13px 14px;background:var(--surf);border:1.5px solid var(--border);border-radius:11px;color:var(--text);font-family:'DM Mono',monospace;font-size:12px;outline:none;margin-bottom:8px;}
.crypto-addr-input:focus{border-color:var(--gold);}
.crypto-addr-input::placeholder{color:var(--muted);font-family:'Inter',sans-serif;font-size:11px;}
.crypto-saved-badge{display:none;align-items:center;gap:5px;padding:7px 12px;border-radius:9px;font-size:11px;font-weight:700;background:var(--green-light);border:1px solid rgba(16,185,129,0.3);color:var(--green);margin-bottom:8px;}
.crypto-saved-badge.show{display:flex;}
.btn-save-addr{width:100%;padding:12px;background:linear-gradient(135deg,#D97706,#F59E0B);color:#fff;border:none;border-radius:11px;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(245,158,11,0.25);}
.btn-save-addr:active{transform:scale(0.97);}

/* ─── WITHDRAWAL HISTORY ─── */
.wd-req-item{padding:12px 14px;border-bottom:1px solid var(--border);}
.wd-req-item:last-child{border:none;}
.wri-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;}
.wri-amount{font-family:'DM Mono',monospace;font-size:13px;font-weight:600;color:var(--text);}
.wri-status{font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;}
.wri-status.pending{background:var(--gold-light);color:var(--gold2);}
.wri-status.done{background:var(--green-light);color:var(--green);}
.wri-addr{font-size:10px;color:var(--sub);font-family:'DM Mono',monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wri-date{font-size:9px;color:var(--muted);margin-top:1px;}

/* ─── TOAST ─── */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(10px);background:var(--text);color:#fff;padding:10px 20px;border-radius:20px;font-size:12px;font-weight:600;opacity:0;pointer-events:none;transition:all .25s;white-space:nowrap;z-index:999;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}

/* ─── MODAL SHEET ─── */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:200;display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .25s;backdrop-filter:blur(4px);}
.modal-bg.open{opacity:1;pointer-events:all;}
.modal-sheet{background:var(--surf);border-radius:24px 24px 0 0;padding:24px 20px 32px;width:100%;max-width:100%;transform:translateY(100%);transition:transform .3s cubic-bezier(.34,1.56,.64,1);max-height:85vh;overflow-y:auto;}
.modal-bg.open .modal-sheet{transform:translateY(0);}
.modal-handle{width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 18px;}
.modal-title{font-size:16px;font-weight:800;color:var(--text);margin-bottom:16px;}
.modal-field{margin-bottom:12px;}
.modal-label{font-size:10px;color:var(--sub);font-weight:700;letter-spacing:.4px;text-transform:uppercase;margin-bottom:5px;display:block;}
.modal-input{width:100%;padding:11px 13px;background:var(--card2);border:1.5px solid var(--border);border-radius:10px;color:var(--text);font-family:'DM Mono',monospace;font-size:13px;outline:none;}
.modal-input:focus{border-color:var(--ton);}
.modal-btns{display:flex;gap:8px;margin-top:14px;}
.btn-modal{flex:1;padding:12px;border-radius:12px;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;cursor:pointer;}
.btn-modal.confirm{background:linear-gradient(135deg,var(--ton),var(--ton2));color:#fff;border:none;box-shadow:0 4px 12px rgba(33,150,243,0.25);}
.btn-modal.cancel{background:var(--card2);color:var(--sub);border:1.5px solid var(--border);}
.btn-modal:active{transform:scale(0.97);}

/* ─── MISC ─── */
.spinner{width:20px;height:20px;border:2px solid rgba(33,150,243,0.2);border-top-color:var(--ton);border-radius:50%;animation:spin .7s linear infinite;display:inline-block;}
@keyframes spin{to{transform:rotate(360deg)}}
.empty-state{text-align:center;padding:32px 20px;color:var(--sub);}
.empty-state p{font-size:12px;line-height:1.6;}
.sec-title{font-size:10px;font-weight:800;color:var(--sub);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;}
.notice{background:var(--ton-light);border:1.5px solid rgba(33,150,243,0.2);border-radius:12px;padding:12px 14px;margin-bottom:10px;font-size:11px;color:var(--ton2);line-height:1.6;width:100%;}
.notice strong{font-weight:700;}
</style>

<!-- ─── i18n translations ─── -->
<script>
// Language detection: RU for Russian, Ukrainian, Belarusian, Kazakh locales — English for everything else
const RU_LOCALES = ['ru','uk','be','kk'];
function detectLang() {
  const langs = navigator.languages || [navigator.language || navigator.userLanguage || 'en'];
  for (const l of langs) {
    const code = l.toLowerCase().split('-')[0];
    if (RU_LOCALES.includes(code)) return 'ru';
  }
  return 'en';
}
const LANG = detectLang();

const T = {
  en: {
    stars_chip: '⭐',
    ton_unit: 'TON',
    loading: 'Loading...',
    tab_home: 'HOME',
    tab_referral: 'REFERRAL',
    tab_withdraw: 'WITHDRAW',
    tab_info: 'INFO',
    total_balance: 'Total Balance',
    hero_sub_start: 'Start depositing to earn rewards every 15 days',
    hero_sub_active: 'Next yield in ~15 days',
    next_yield_in: 'Next yield in',
    yield_ready: '🎉 Yield ready soon!',
    days_short: 'd',
    hours_short: 'h',
    mins_short: 'm',
    premium_rate: '🌟 15% Premium (2 weeks)',
    standard_rate: '10% Standard (15 days)',
    dep_countdown_label: 'Next +%RATE% in',
    total_deposited: 'DEPOSITED',
    total_earned: 'TOTAL EARNED',
    proj_label: '📅 After 15 Days You\'ll Have',
    proj_desc: 'Projected balance\nincluding yield',
    proj_badge_5: '+10% / 15 days',
    proj_badge_10: '+15% ✨ 100 TON deal',
    yield_badge: '+10% Every 15 Days on every deposit',
    deal_badge: '⚡ Special Deal',
    deal_title: '🚀 Deposit 100+ TON → Get 15% Every 2 Weeks!',
    deal_sub: 'Special offer! Deposit 100 TON or more and earn <strong style="color:#fff;">15% every 2 weeks</strong> instead of the standard 10% per 15 days.',
    deal_standard: 'Standard',
    deal_50ton: '100+ TON ✨',
    deal_wk1: '2-week bonus',
    wallet_not_connected: 'Wallet not connected',
    wallet_connect_hint: 'Connect to pay in 1 click',
    wallet_connected: 'Wallet connected ✓',
    make_deposit: 'Make a Deposit',
    amount_label: 'Amount (min 0.5 TON)',
    amount_placeholder: '0.5',
    earn_after: 'You will get (after 15 days)',
    earn_unit_5: 'TON (10% yield)',
    earn_unit_10: 'TON (15% yield)',
    earn_unit_special: 'TON (15% / 2 weeks)',
    earn_unit_standard: 'TON (10% / 15 days)',
    deposited_label: 'DEPOSITED',
    you_will_get: 'You will get',
    pay_btn: 'Pay with TON Wallet',
    pay_opening: 'Opening wallet…',
    detecting: '⏳ Confirming on blockchain…',
    pay_confirmed: '✅ Payment confirmed!\nYour balance has been updated.',
    active_deposits: 'Deposit History',
    deposit_active: 'Active',
    deposit_pending: 'Pending',
    deposit_week: 'Week',
    dep_rate_premium: '🌟 15% / 2 weeks',
    dep_rate_standard: '10% / 15 days',
    dep_rate_badge_100: '⚡ 100 TON → 15% / 2 weeks',
    ref_hero_title: '🎁 Invite Friends, Earn ⭐ Stars',
    ref_hero_sub: 'Share your unique link. Every friend who joins earns you Telegram Stars!',
    ref_code_label: '🔑 Your Referral Code',
    ref_link_label: '🔗 Your Invite Link',
    ref_copy_btn: '📋 Copy Invite Link',
    friends_invited: 'Friends Invited',
    stars_earned: 'Stars Earned',
    share_btn: 'Share Invite Link via Telegram',
    reward_milestones: '⭐ Reward Milestones',
    enter_ref_code: 'Enter a Referral Code',
    ref_input_placeholder: 'Enter code (e.g. ABC123)',
    apply_code_btn: '✓ Apply Code',
    invited_friends: '👥 Invited Friends',
    milestone_done: '✓ Claimed',
    milestone_next: '🔥 Up Next',
    milestone_locked: '🔒 Locked',
    milestone_complete: '✓ Completed!',
    milestone_more: (n) => `Invite ${n} more friend${n!==1?'s':''}`,
    milestone_friends_lbl: 'friends',
    milestone_stars_lbl: 'Telegram Stars',
    milestone_invite_lbl: 'Invite',
    milestone_info_title: 'How Reward Milestones Work',
    milestone_info_body: 'Invite friends using your referral link. As more friends join and use your code, you unlock milestone rewards:\n\n⭐ Stars are Telegram Stars sent directly to you.\n💰 TON bonuses (on higher tiers) are added to your TonPlay balance.\n\nProgress is tracked automatically — no action needed from you!',
    milestone_info_close: 'Got it',
    joined_badge: '✓ Joined',
    ref_used_prefix: '✓ Code applied: ',
    wd_title: '💸 Withdraw TON',
    wd_avail: 'Available Balance',
    wd_form_title: 'Request Withdrawal',
    wd_form_sub: 'Enter your TON wallet address and the amount you wish to withdraw. Our team will process it shortly.',
    wd_wallet_label: 'Your TON Wallet Address',
    wd_wallet_placeholder: 'EQ... or UQ... your TON wallet address',
    wd_amount_label: 'Amount (TON)',
    wd_amount_placeholder: 'Amount to withdraw',
    wd_submit_btn: 'Submit Withdrawal Request',
    wd_history: 'Withdrawal History',
    wd_status_done: '✅ Done',
    wd_status_pending: '⏳ Pending',
    how_it_works_modal_title: 'How TonPlay Works',
    how_it_works_modal_body: `<div style="font-size:13px;color:var(--sub);line-height:1.8;">
<div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(33,150,243,0.1),rgba(33,150,243,0.04));border:1.5px solid rgba(33,150,243,0.2);border-radius:12px;padding:12px 14px;margin-bottom:12px;">
  <span style="font-size:22px;">💰</span>
  <div><div style="font-size:12px;font-weight:800;color:var(--ton2);margin-bottom:2px;">1. Deposit TON</div><div style="font-size:11px;">Make a deposit of at least <b>0.5 TON</b>. Your funds start earning <b>immediately</b>.</div></div>
</div>
<div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.03));border:1.5px solid rgba(16,185,129,0.2);border-radius:12px;padding:12px 14px;margin-bottom:12px;">
  <span style="font-size:22px;">📈</span>
  <div><div style="font-size:12px;font-weight:800;color:var(--green);margin-bottom:2px;">2. Earn 10% Every 15 Days</div><div style="font-size:11px;">Your balance grows by <b>+10% every 15 days</b>. Yield compounds — each cycle you earn on the new total.</div></div>
</div>
<div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(124,58,237,0.08),rgba(124,58,237,0.03));border:1.5px solid rgba(124,58,237,0.2);border-radius:12px;padding:12px 14px;margin-bottom:12px;">
  <span style="font-size:22px;">🚀</span>
  <div><div style="font-size:12px;font-weight:800;color:#7C3AED;margin-bottom:2px;">3. Deposit 100+ TON → 15% Every 2 Weeks!</div><div style="font-size:11px;">Deposit <b>100 TON or more</b> and earn <b>15% every 2 weeks</b>. That's the special deal!</div></div>
</div>
<div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.03));border:1.5px solid rgba(245,158,11,0.2);border-radius:12px;padding:12px 14px;margin-bottom:12px;">
  <span style="font-size:22px;">💸</span>
  <div><div style="font-size:12px;font-weight:800;color:var(--gold2);margin-bottom:2px;">4. Withdraw Anytime</div><div style="font-size:11px;">Once your balance grows, request a withdrawal in the <b>Withdraw</b> tab. Our team processes all requests promptly.</div></div>
</div>
<div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:11px;color:var(--sub);">
  <b>Example:</b> Deposit <b>10 TON</b> → after 15 days you have <b>11 TON</b> → after 30 days <b>12.1 TON</b>. The longer you hold, the faster it grows! 🎯
</div>
</div>`,
    how_it_works_modal_close: 'Got it!',
    how_it_works: '📈 How TonPlay Works',
    weekly_return: 'Standard Return',
    premium_return_lbl: 'Premium (100+ TON)',
    days_label: 'days',
    min_deposit: 'Min Deposit',
    payout_schedule: 'Payout Schedule',
    payout_value: 'Every 15 days',
    my_balance_lbl: 'My Balance',
    my_deposited_lbl: 'Total Deposited',
    total_earned_info: 'Total Earned',
    withdrawals_locked: 'Locked',
    notif_title: 'How does TonPlay work?',
    notif_body: 'Deposit TON → earn +10% every 15 days. Invite friends → earn Stars. Withdraw anytime!',
    notif_btn: 'Got it 👍',
    wd_select_label: 'Select Deposit to Withdraw From',
    wd_all: 'ALL',
    wd_deposit_label: 'Deposit(s) #',
    wd_yield_label: 'Yield:',
    wd_multiple_rates: 'Multiple rates',
    wd_deposits_selected: (n) => `${n} deposit${n!==1?'s':''} selected`,
    dep_inline_deposited: 'TON deposited',
    dep_inline_you_get: '→ You will get:',
    dep_inline_deposit: 'Deposit #',
    dep_inline_active: 'Active',
    dep_inline_ready: 'Ready!',
    dep_inline_countdown_label: 'Next yield in',
    deposit_active: 'Active',
    deposit_pending: 'Pending',
    dep_rate_premium: '🌟 15% / 2 weeks',
    dep_rate_standard: '10% / 15 days',
    total_deposited_lbl: 'DEPOSITED',
    total_earned_lbl: 'TOTAL EARNED',
    compounding: 'Compounding',
    yes: 'Yes',
    weekly_yield_tile: 'Per 15 Days',
    annual_est: 'Annual Est. (std)',
    my_deposits: 'My Deposits',
    weeks_active: 'Weeks Active',
    example_returns: 'Example Returns',
    compound_notice: '<strong>💡 Compound Growth:</strong> Every 15 days your balance grows by 10% (or 15% every 2 weeks for 100+ TON). Each cycle you earn on the new total — growth accelerates over time.',
    my_account: 'My Account',
    tg_id_lbl: 'Telegram ID',
    username_lbl: 'Username',
    ref_code_info: 'Referral Code',
    ton_wallet_lbl: 'TON Wallet',
    not_connected: 'Not connected',
    withdrawals_lbl: 'Withdrawals',
    withdrawals_open: 'Open',
    withdrawals_locked: 'Locked',
    stars_lbl: 'Stars',
    ref_notice: '<strong>🎁 Referral System:</strong> Every player gets a unique referral code. Share your link — when a friend joins and uses your code, you earn Stars!',
    cancel_btn: 'Cancel',
    confirm_btn: 'Confirm',
    connect_wallet_first: '⚠️ Connect your wallet first',
    min_deposit_warn: '⚠️ Minimum deposit is 0.5 TON',
    link_copied: '✅ Invite link copied!',
    no_ref_code: '⚠️ No referral code yet',
    enter_ref_warn: '⚠️ Enter a referral code',
    already_used_warn: '⚠️ You already used a code',
    own_code_warn: '⚠️ Cannot use your own code',
    invalid_code: '❌ Invalid referral code',
    code_applied: '✅ Code applied! Welcome 🎉',
    enter_amount_warn: '⚠️ Enter a valid amount',
    enter_wallet_warn: '⚠️ Enter your TON wallet address',
    wallet_format_warn: '⚠️ Address must start with EQ or UQ',
    insufficient: '⚠️ Insufficient balance',
    wd_submitted: '✅ Withdrawal request submitted!',
    balance_updated: '🎉 Balance updated! Check Telegram for confirmation.',
    tx_sent: '✅ Transaction sent! Crediting balance…',
    tx_cancelled: '❌ Transaction cancelled',
    wallet_disconnected: '⚠️ Wallet disconnected. Please reconnect.',
    tx_failed: '❌ Transaction failed: ',
    confirm_payment: '💎 Confirm Payment',
    amount_to_send: 'AMOUNT TO SEND',
    from_wallet: 'FROM WALLET',
    to_vault: 'TO VAULT',
    payment_ref: '🔑 PAYMENT REFERENCE',
    payment_ref_sub: 'Auto-included in transaction — do not edit',
    confirm_withdrawal: '💸 Confirm Withdrawal',
    bot_deposit_confirmed: '✅ <b>Deposit Confirmed!</b>',
    bot_amount_credited: '💰 <b>Amount:</b>',
    bot_new_balance: '📊 <b>New Balance:</b>',
    bot_reference: '🔑 <b>Reference:</b>',
    bot_yield_msg: 'Your deposit is now earning <b>+10% every 15 days</b>! 🚀\nOpen the app to track your earnings 👇',
    bot_open_app: '🎮 Open TonPlay App',
  },
  ru: {
    stars_chip: '⭐',
    ton_unit: 'TON',
    loading: 'Загрузка...',
    tab_home: 'ГЛАВНАЯ',
    tab_referral: 'РЕФЕРАЛЫ',
    tab_withdraw: 'ВЫВОД',
    tab_info: 'INFO',
    total_balance: 'Общий баланс',
    hero_sub_start: 'Сделайте депозит, чтобы получать награды каждые 15 дней',
    hero_sub_active: 'Следующая выплата через ~15 дней',
    next_yield_in: 'Следующая выплата через',
    yield_ready: '🎉 Выплата скоро!',
    days_short: 'д',
    hours_short: 'ч',
    mins_short: 'м',
    premium_rate: '🌟 15% Премиум (2 недели)',
    standard_rate: '10% Стандарт (15 дней)',
    dep_countdown_label: 'След. +%RATE% через',
    total_deposited: 'ВНЕСЕНО',
    total_earned: 'ЗАРАБОТАНО ВСЕГО',
    proj_label: '📅 Через 15 дней у вас будет',
    proj_desc: 'Прогноз баланса\nвключая доходность',
    proj_badge_5: '+10% / 15 дней',
    proj_badge_10: '+15% ✨ сделка 100 TON',
    yield_badge: '+10% каждые 15 дней на каждый депозит',
    deal_badge: '⚡ Спецпредложение',
    deal_title: '🚀 Депозит от 100 TON → 15% каждые 2 недели!',
    deal_sub: 'Спецпредложение! Внесите от 100 TON и зарабатывайте <strong style="color:#fff;">15% каждые 2 недели</strong> вместо стандартных 10% за 15 дней.',
    deal_standard: 'Стандарт',
    deal_50ton: 'от 100 TON ✨',
    deal_wk1: 'Бонус за 2 нед.',
    wallet_not_connected: 'Кошелёк не подключён',
    wallet_connect_hint: 'Подключите для оплаты в 1 клик',
    wallet_connected: 'Кошелёк подключён ✓',
    make_deposit: 'Сделать депозит',
    amount_label: 'Сумма (мин. 0.5 TON)',
    amount_placeholder: '0.5',
    earn_after: 'Вы получите (через 15 дней)',
    earn_unit_5: 'TON (доходность 10%)',
    earn_unit_10: 'TON (доходность 15%)',
    earn_unit_special: 'TON (15% / 2 недели)',
    earn_unit_standard: 'TON (10% / 15 дней)',
    deposited_label: 'ВНЕСЕНО',
    you_will_get: 'Вы получите',
    pay_btn: 'Оплатить через TON Wallet',
    pay_opening: 'Открываем кошелёк…',
    detecting: '⏳ Подтверждение в блокчейне…',
    pay_confirmed: '✅ Платёж подтверждён!\nВаш баланс обновлён.',
    active_deposits: 'История депозитов',
    deposit_active: 'Активный',
    deposit_pending: 'В обработке',
    deposit_week: 'Неделя',
    dep_rate_premium: '🌟 15% / 2 нед.',
    dep_rate_standard: '10% / 15 дней',
    dep_rate_badge_100: '⚡ 100 TON → 15% / 2 нед.',
    ref_hero_title: '🎁 Приглашай друзей — получай ⭐ звёзды',
    ref_hero_sub: 'Поделитесь уникальной ссылкой. Каждый вступивший друг приносит вам Telegram-звёзды!',
    ref_code_label: '🔑 Ваш реферальный код',
    ref_link_label: '🔗 Ваша пригласительная ссылка',
    ref_copy_btn: '📋 Скопировать ссылку',
    friends_invited: 'Приглашено друзей',
    stars_earned: 'Заработано звёзд',
    share_btn: 'Поделиться ссылкой в Telegram',
    reward_milestones: '⭐ Достижения за рефералов',
    enter_ref_code: 'Введите реферальный код',
    ref_input_placeholder: 'Введите код (напр. ABC123)',
    apply_code_btn: '✓ Применить код',
    invited_friends: '👥 Приглашённые друзья',
    milestone_done: '✓ Получено',
    milestone_next: '🔥 Следующий',
    milestone_locked: '🔒 Закрыто',
    milestone_complete: '✓ Выполнено!',
    milestone_more: (n) => `Пригласи ещё ${n} ${n===1?'друга':n<5?'друга':'друзей'}`,
    milestone_friends_lbl: 'друзей',
    milestone_stars_lbl: 'Telegram Stars',
    milestone_invite_lbl: 'Пригласи',
    milestone_info_title: 'Как работают награды за рефералов',
    milestone_info_body: 'Приглашай друзей по своей реферальной ссылке. Чем больше друзей вступает и использует твой код — тем больше наград ты получаешь:\n\n⭐ Звёзды — это Telegram Stars, которые отправляются тебе напрямую.\n💰 Бонусы TON (на высоких уровнях) зачисляются на твой баланс в TonPlay.\n\nПрогресс отслеживается автоматически — тебе ничего не нужно делать!',
    milestone_info_close: 'Понятно',
    joined_badge: '✓ Вступил',
    ref_used_prefix: '✓ Код применён: ',
    wd_title: '💸 Вывод TON',
    wd_avail: 'Доступный баланс',
    wd_form_title: 'Запрос на вывод',
    wd_form_sub: 'Укажите адрес TON-кошелька и сумму для вывода. Наша команда обработает запрос в ближайшее время.',
    wd_wallet_label: 'Ваш адрес TON-кошелька',
    wd_wallet_placeholder: 'EQ... или UQ... ваш адрес TON-кошелька',
    wd_amount_label: 'Сумма (TON)',
    wd_amount_placeholder: 'Сумма для вывода',
    wd_submit_btn: 'Отправить запрос на вывод',
    wd_history: 'История выводов',
    wd_status_done: '✅ Выполнено',
    wd_status_pending: '⏳ В обработке',
    how_it_works_modal_title: 'Как работает TonPlay',
    how_it_works_modal_body: `<div style="font-size:13px;color:var(--sub);line-height:1.8;">
<div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(33,150,243,0.1),rgba(33,150,243,0.04));border:1.5px solid rgba(33,150,243,0.2);border-radius:12px;padding:12px 14px;margin-bottom:12px;">
  <span style="font-size:22px;">💰</span>
  <div><div style="font-size:12px;font-weight:800;color:var(--ton2);margin-bottom:2px;">1. Сделай депозит</div><div style="font-size:11px;">Внеси минимум <b>0.5 TON</b>. Средства начинают работать <b>сразу же</b> после подтверждения.</div></div>
</div>
<div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.03));border:1.5px solid rgba(16,185,129,0.2);border-radius:12px;padding:12px 14px;margin-bottom:12px;">
  <span style="font-size:22px;">📈</span>
  <div><div style="font-size:12px;font-weight:800;color:var(--green);margin-bottom:2px;">2. Зарабатывай 10% каждые 15 дней</div><div style="font-size:11px;">Баланс растёт на <b>+10% каждые 15 дней</b>. Проценты начисляются на весь текущий баланс — чем дольше держишь, тем быстрее растёт!</div></div>
</div>
<div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(124,58,237,0.08),rgba(124,58,237,0.03));border:1.5px solid rgba(124,58,237,0.2);border-radius:12px;padding:12px 14px;margin-bottom:12px;">
  <span style="font-size:22px;">🚀</span>
  <div><div style="font-size:12px;font-weight:800;color:#7C3AED;margin-bottom:2px;">3. Депозит от 100 TON → 15% каждые 2 недели!</div><div style="font-size:11px;">Внеси <b>100 TON и больше</b> — получай ставку: <b>15% каждые 2 недели</b>. Это спецпредложение!</div></div>
</div>
<div style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.03));border:1.5px solid rgba(245,158,11,0.2);border-radius:12px;padding:12px 14px;margin-bottom:12px;">
  <span style="font-size:22px;">💸</span>
  <div><div style="font-size:12px;font-weight:800;color:var(--gold2);margin-bottom:2px;">4. Выводи в любое время</div><div style="font-size:11px;">Когда захочешь — переходи во вкладку <b>Вывод</b> и отправь заявку. Команда обрабатывает запросы оперативно.</div></div>
</div>
<div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:11px;color:var(--sub);">
  <b>Пример:</b> Депозит <b>10 TON</b> → через 15 дней <b>11 TON</b> → через 30 дней <b>12.1 TON</b>. Магия сложного процента! 🎯
</div>
</div>`,
    how_it_works_modal_close: 'Понятно!',
    how_it_works: '📈 Как работает TonPlay',
    weekly_return: 'Стандартная доходность',
    premium_return_lbl: 'Премиум (от 100 TON)',
    days_label: 'дней',
    min_deposit: 'Мин. депозит',
    payout_schedule: 'График выплат',
    payout_value: 'Каждые 15 дней',
    my_balance_lbl: 'Мой баланс',
    my_deposited_lbl: 'Всего внесено',
    total_earned_info: 'Всего заработано',
    withdrawals_locked: 'Заблокировано',
    notif_title: 'Как работает TonPlay?',
    notif_body: 'Сделайте депозит → получайте +10% каждые 15 дней. Приглашайте друзей → зарабатывайте звёзды. Выводите в любое время!',
    notif_btn: 'Понятно 👍',
    wd_select_label: 'Выберите депозит для вывода',
    wd_all: 'ВСЕ',
    wd_deposit_label: 'Депозит(ы) №',
    wd_yield_label: 'Доходность:',
    wd_multiple_rates: 'Разные ставки',
    wd_deposits_selected: (n) => `${n} депозит${n===1?'':n<5?'а':'ов'} выбрано`,
    dep_inline_deposited: 'TON внесено',
    dep_inline_you_get: '→ Вы получите:',
    dep_inline_deposit: 'Депозит №',
    dep_inline_active: 'Активный',
    dep_inline_ready: 'Готово!',
    dep_inline_countdown_label: 'Следующая выплата через',
    deposit_active: 'Активный',
    deposit_pending: 'В обработке',
    dep_rate_premium: '🌟 15% / 2 нед.',
    dep_rate_standard: '10% / 15 дней',
    total_deposited_lbl: 'ВНЕСЕНО',
    total_earned_lbl: 'ЗАРАБОТАНО ВСЕГО',
    compounding: 'Реинвестирование',
    yes: 'Да',
    weekly_yield_tile: 'За 15 дней',
    annual_est: 'Годовая (стандарт)',
    my_deposits: 'Мои депозиты',
    weeks_active: 'Недель активно',
    example_returns: 'Примеры доходности',
    compound_notice: '<strong>💡 Сложный процент:</strong> Каждые 15 дней ваш баланс растёт на 10% (или 15% каждые 2 недели для депозитов от 100 TON). Каждый цикл начисляется на новый итог — рост ускоряется!',
    my_account: 'Мой аккаунт',
    tg_id_lbl: 'Telegram ID',
    username_lbl: 'Имя пользователя',
    ref_code_info: 'Реферальный код',
    ton_wallet_lbl: 'TON-кошелёк',
    not_connected: 'Не подключён',
    withdrawals_lbl: 'Выводы',
    withdrawals_open: 'Открыто',
    withdrawals_locked: 'Заблокировано',
    stars_lbl: 'Звёзды',
    ref_notice: '<strong>🎁 Реферальная система:</strong> Каждый игрок получает уникальный код. Поделитесь ссылкой — когда друг вступит и введёт ваш код, вы получите звёзды!',
    cancel_btn: 'Отмена',
    confirm_btn: 'Подтвердить',
    connect_wallet_first: '⚠️ Сначала подключите кошелёк',
    min_deposit_warn: '⚠️ Минимальный депозит — 0.5 TON',
    link_copied: '✅ Пригласительная ссылка скопирована!',
    no_ref_code: '⚠️ Реферальный код ещё не создан',
    enter_ref_warn: '⚠️ Введите реферальный код',
    already_used_warn: '⚠️ Вы уже использовали код',
    own_code_warn: '⚠️ Нельзя использовать собственный код',
    invalid_code: '❌ Неверный реферальный код',
    code_applied: '✅ Код применён! Добро пожаловать 🎉',
    enter_amount_warn: '⚠️ Введите корректную сумму',
    enter_wallet_warn: '⚠️ Введите адрес TON-кошелька',
    wallet_format_warn: '⚠️ Адрес должен начинаться с EQ или UQ',
    insufficient: '⚠️ Недостаточно средств',
    wd_submitted: '✅ Запрос на вывод отправлен!',
    balance_updated: '🎉 Баланс обновлён! Проверьте Telegram для подтверждения.',
    tx_sent: '✅ Транзакция отправлена! Зачисляем баланс…',
    tx_cancelled: '❌ Транзакция отменена',
    wallet_disconnected: '⚠️ Кошелёк отключён. Переподключите его.',
    tx_failed: '❌ Ошибка транзакции: ',
    confirm_payment: '💎 Подтвердите платёж',
    amount_to_send: 'СУММА К ОТПРАВКЕ',
    from_wallet: 'С КОШЕЛЬКА',
    to_vault: 'НА ХРАНИЛИЩЕ',
    payment_ref: '🔑 МЕТКА ПЛАТЕЖА',
    payment_ref_sub: 'Включается в транзакцию автоматически — не редактируйте',
    confirm_withdrawal: '💸 Подтвердите вывод',
    bot_deposit_confirmed: '✅ <b>Депозит подтверждён!</b>',
    bot_amount_credited: '💰 <b>Сумма:</b>',
    bot_new_balance: '📊 <b>Новый баланс:</b>',
    bot_reference: '🔑 <b>Метка:</b>',
    bot_yield_msg: 'Ваш депозит теперь приносит <b>+10% каждые 15 дней</b>! 🚀\nОткройте приложение, чтобы отслеживать прибыль 👇',
    bot_open_app: '🎮 Открыть TonPlay',
  }
};

const t = T[LANG];
window.t = t;
window.LANG = LANG;
</script>

</head>
<body>

<div class="bg-layer">
  <div class="bg-circle" style="width:300px;height:300px;top:-80px;right:-60px;--d:14s;--tx:-20px;--ty:25px;"></div>
  <div class="bg-circle" style="width:200px;height:200px;bottom:-40px;left:-50px;--d:11s;--dl:2s;--tx:15px;--ty:-20px;"></div>
</div>

<div class="app">

  <!-- Header -->
  <div class="header">
    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z" fill="white" opacity=".9"/><path d="M9 12l2 2 4-4" stroke="rgba(33,150,243,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="logo-name">Ton<span>Play</span></div>
    </div>
    <div class="header-right">
      <div class="stars-chip" id="stars-chip">
        <span class="stars-chip-icon">⭐</span>
        <span class="stars-chip-val" id="header-stars">0</span>
      </div>
      <div class="bal-chip">
        <div class="bci">
        <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M28 10 L44 22 L28 22 Z" fill="white" opacity="0.95"/>
          <path d="M28 10 L12 22 L28 22 Z" fill="white" opacity="0.75"/>
          <path d="M28 22 L12 22 L28 47 Z" fill="white" opacity="0.85"/>
          <path d="M28 22 L44 22 L28 47 Z" fill="white" opacity="0.65"/>
          <line x1="28" y1="22" x2="28" y2="47" stroke="rgba(0,136,204,0.35)" stroke-width="0.8"/>
          <line x1="12" y1="22" x2="44" y2="22" stroke="rgba(0,136,204,0.25)" stroke-width="0.6"/>
        </svg>
        </div>
        <div><div class="bc-val" id="header-balance">0.00</div><div class="bc-unit">TON</div></div>
      </div>
    </div>
  </div>

  <!-- User line -->
  <div class="user-line" id="user-line" data-i18n="loading">Loading...</div>

  <!-- Tab Bar -->
  <div class="tab-bar">
    <button class="tab-btn active" onclick="switchTab('home',this)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
      <span data-i18n="tab_home">HOME</span>
    </button>
    <button class="tab-btn ref-tab" onclick="switchTab('referral',this)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
      <span data-i18n="tab_referral">REFERRAL</span>
    </button>
    <button class="tab-btn wd-tab" onclick="switchTab('withdraw',this)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
      <span data-i18n="tab_withdraw">WITHDRAW</span>
    </button>
    <button class="tab-btn" onclick="switchTab('info',this)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span data-i18n="tab_info">INFO</span>
    </button>
  </div>

  <!-- ════════════════ HOME TAB ════════════════ -->
  <div class="tab-content active" id="tab-home">

    <div class="hero-card">
      <div style="position:relative;z-index:1;">

        <!-- Info button -->
        <button onclick="showHowItWorksModal()" style="position:absolute;top:0;right:0;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </button>
        <!-- Default view: total balance + no deposits selected -->
        <div id="hero-default-view">
          <div class="hero-label" data-i18n="total_balance">Total Balance</div>
          <div class="hero-balance"><span id="hero-balance">0.00</span> <span class="hero-balance-unit">TON</span></div>
          <div class="hero-sub" id="hero-sub">Start depositing to earn rewards every 15 days</div>
        </div>
        <!-- Deposit-selected view: replaces balance area -->
        <div id="dep-inline-panel" class="dep-inline-panel hidden"></div>
        <!-- Pill switcher (always shown when deposits exist) -->
        <div id="dep-switcher-wrap" style="display:none;"></div>
      </div>
    </div>

    <div style="text-align:center;margin-bottom:10px;">
      <div class="yield-badge"><div class="yield-dot"></div><span data-i18n="yield_badge">+5% Weekly Yield on every deposit</span></div>
    </div>

    <!-- ══ SPECIAL DEAL ══ -->
    <div class="special-deal">
      <div style="position:relative;z-index:1;">
        <div class="deal-badge" data-i18n="deal_badge">⚡ Special Deal</div>
        <div class="deal-title" data-i18n="deal_title">🚀 Deposit 100+ TON → Get 10% Weekly!</div>
        <div class="deal-sub" data-i18n-html="deal_sub">Double your yield! Deposit 100 TON or more and earn <strong style="color:#fff;">10% every week</strong> instead of the standard 5%.</div>
        <div class="deal-stats">
          <div class="deal-stat"><div class="deal-stat-val">10%</div><div class="deal-stat-lbl" data-i18n="deal_standard">Standard</div></div>
          <div class="deal-stat" style="background:rgba(255,255,255,0.22);border:1.5px solid rgba(255,255,255,0.3);"><div class="deal-stat-val" style="color:#FCD34D;">15%</div><div class="deal-stat-lbl" style="color:rgba(255,255,255,0.9);" data-i18n="deal_50ton">100+ TON ✨</div></div>
          <div class="deal-stat"><div class="deal-stat-val">+15 TON</div><div class="deal-stat-lbl" data-i18n="deal_wk1">2-week bonus</div></div>
        </div>
      </div>
    </div>

    <!-- ══ TON CONNECT WALLET BANNER ══ -->
    <div class="wallet-banner" id="wallet-banner">
      <div class="wallet-banner-info">
        <div class="wallet-banner-dot" id="wallet-dot"></div>
        <div class="wallet-banner-text">
          <div class="wallet-banner-label" id="wallet-status-label" data-i18n="wallet_not_connected">Wallet not connected</div>
          <div class="wallet-banner-addr" id="wallet-addr-display" data-i18n="wallet_connect_hint">Connect to pay in 1 click</div>
        </div>
      </div>
      <div id="ton-connect-btn-container"></div>
    </div>

    <!-- ══ DEPOSIT FORM ══ -->
    <div class="deposit-form">
      <div class="sec-title" data-i18n="make_deposit">Make a Deposit</div>
      <label class="form-label" data-i18n="amount_label">Amount (min 0.5 TON)</label>
      <div class="amount-input-wrap">
        <input class="amount-input" id="deposit-amount" type="number" min="0.5" step="0.1" placeholder="0.5">
        <span class="ton-label">TON</span>
      </div>
      <div class="amount-presets">
        <button class="preset-btn" onclick="setAmount(1,this)">1</button>
        <button class="preset-btn" onclick="setAmount(5,this)">5</button>
        <button class="preset-btn" onclick="setAmount(10,this)">10</button>
        <button class="preset-btn" onclick="setAmount(25,this)">25</button>
        <button class="preset-btn" onclick="setAmount(50,this)">50</button>
        <button class="preset-btn" onclick="setAmount(100,this)">100</button>
      </div>

      <div class="earn-preview" id="earn-preview" style="display:none;">
        <div class="earn-preview-left">
          <div class="earn-preview-icon">📈</div>
          <div>
            <div class="earn-preview-label" data-i18n="earn_after">After 1 week you'll earn</div>
            <div class="earn-preview-val" id="earn-preview-val">+0.00</div>
            <div class="earn-preview-unit" id="earn-preview-unit">TON (5% yield)</div>
          </div>
        </div>
        <div id="earn-preview-rate-badge" style="background:var(--green-light);border:1.5px solid rgba(16,185,129,0.3);border-radius:20px;padding:4px 10px;font-size:10px;font-weight:800;color:var(--green);flex-shrink:0;">+5%</div>
      </div>

      <button class="btn-pay" id="btn-pay" onclick="handlePay()">
        <div class="btn-pay-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
        </div>
        <span data-i18n="pay_btn">Pay with TON Wallet</span>
      </button>

      <div class="detection-banner" id="detection-banner">
        <span style="font-size:18px;">⏳</span>
        <div class="detection-banner-text" id="detection-text" data-i18n="detecting">Waiting for blockchain confirmation…</div>
      </div>
      <div class="pay-status" id="pay-status">
        <span class="pay-status-icon">✅</span>
        <div class="pay-status-text" id="pay-status-text">Payment confirmed!<br>Your balance has been updated.</div>
      </div>
    </div>

    <div class="sec-title" id="deposits-title" style="display:none;" data-i18n="active_deposits">Deposit History</div>
    <div class="card" id="deposits-list" style="display:none;"></div>
  </div>

  <!-- ════════════════ REFERRAL TAB ════════════════ -->
  <div class="tab-content" id="tab-referral">
    <div class="ref-hero">
      <div style="position:relative;z-index:1;">
        <div class="ref-hero-title" data-i18n="ref_hero_title">🎁 Invite Friends, Earn ⭐ Stars</div>
        <div class="ref-hero-sub" data-i18n="ref_hero_sub">Share your unique link. Every friend who joins earns you Telegram Stars!</div>
        <div class="ref-code-box">
          <div class="ref-code-label" data-i18n="ref_code_label">🔑 Your Referral Code</div>
          <div class="ref-code-val" id="ref-code-val">—</div>
          <div class="ref-code-label" data-i18n="ref_link_label">🔗 Your Invite Link</div>
          <div class="ref-link-box" id="ref-link-display">—</div>
          <button class="ref-copy-btn" onclick="copyRefLink()" data-i18n="ref_copy_btn">📋 Copy Invite Link</button>
        </div>
      </div>
    </div>
    <div class="ref-stats-grid">
      <div class="ref-stat"><div class="ref-stat-val" id="ref-count">0</div><div class="ref-stat-lbl" data-i18n="friends_invited">Friends Invited</div></div>
      <div class="ref-stat"><div class="ref-stat-val" style="color:var(--ton);font-size:16px;" id="ref-earned">0 ⭐</div><div class="ref-stat-lbl" data-i18n="stars_earned">Stars Earned</div></div>
    </div>
    <button class="btn-share" onclick="shareRefLink()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      <span data-i18n="share_btn">Share Invite Link via Telegram</span>
    </button>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <div class="sec-title" style="margin-bottom:0;" data-i18n="reward_milestones">⭐ Reward Milestones</div>
      <button onclick="showMilestoneInfo()" style="width:26px;height:26px;border-radius:50%;border:1.5px solid var(--border);background:var(--surf);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sub)" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </button>
    </div>
    <div id="milestones-list"><div class="empty-state"><div class="spinner"></div></div></div>
    <div class="ref-enter-card">
      <div class="sec-title" data-i18n="enter_ref_code">Enter a Referral Code</div>
      <div id="ref-used-display"></div>
      <input class="ref-input" id="ref-code-input" type="text" maxlength="10" data-i18n-placeholder="ref_input_placeholder" placeholder="Enter code (e.g. ABC123)">
      <button class="btn-green" id="ref-submit-btn" onclick="submitRefCode()" data-i18n="apply_code_btn">✓ Apply Code</button>
    </div>
    <div class="sec-title" id="invited-title" style="display:none;margin-top:4px;" data-i18n="invited_friends">👥 Invited Friends</div>
    <div class="card" id="invited-list" style="display:none;"></div>
  </div>

  <!-- ════════════════ WITHDRAW TAB ════════════════ -->
  <div class="tab-content" id="tab-withdraw">
    <div class="wd-hero">
      <div class="wd-hero-title" data-i18n="wd_title">💸 Withdraw TON</div>
      <div class="wd-hero-sub" data-i18n="wd_avail">Available Balance</div>
      <div class="wd-hero-bal"><span id="wd-balance">0.00</span> TON</div>
    </div>
    <!-- Select deposit card to withdraw from -->
    <div id="wd-deposit-select" style="display:none;margin-bottom:10px;">
      <div class="sec-title" style="margin-bottom:6px;" id="wd-select-label">Select Deposit to Withdraw From</div>
      <div id="wd-deposit-pills" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;"></div>
      <div id="wd-deposit-info" style="background:linear-gradient(135deg,rgba(245,158,11,0.10),rgba(217,119,6,0.05));border:1.5px solid rgba(245,158,11,0.3);border-radius:14px;padding:12px 14px;display:none;">
        <div style="font-size:10px;font-weight:800;color:var(--gold2);letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px;" id="wd-deposit-label-el">Deposit(s) #<span id="wd-sel-num">1</span></div>
        <div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:700;color:var(--text);" id="wd-sel-amount">0.00 TON</div>
        <div style="font-size:11px;color:var(--sub);margin-top:2px;"><span id="wd-yield-label-el">Yield:</span> <span style="color:var(--green);font-weight:700;" id="wd-sel-yield">+0.00 TON</span> &nbsp;·&nbsp; <span id="wd-sel-rate">10% / 15d</span></div>
        <div style="font-size:10px;color:var(--sub);margin-top:3px;" id="wd-sel-date"></div>
      </div>
    </div>
    <div class="wd-form-card">
      <div class="wd-form-title" data-i18n="wd_form_title">Request Withdrawal</div>
      <div class="wd-form-sub" data-i18n="wd_form_sub">Enter your TON wallet address and the amount you wish to withdraw.</div>
      <label class="form-label" style="margin-top:8px;" data-i18n="wd_wallet_label">Your TON Wallet Address</label>
      <input class="wd-input" id="wd-wallet-input" type="text" data-i18n-placeholder="wd_wallet_placeholder" placeholder="EQ... or UQ..." spellcheck="false" autocomplete="off" style="margin-bottom:10px;">
      <label class="form-label" data-i18n="wd_amount_label">Amount (TON)</label>
      <input class="wd-input" id="wd-amount" type="number" min="0.1" step="0.1" data-i18n-placeholder="wd_amount_placeholder" placeholder="Amount to withdraw">
      <button class="btn-gold" onclick="submitWithdraw()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        <span data-i18n="wd_submit_btn">Submit Withdrawal Request</span>
      </button>
    </div>
    <div class="sec-title" id="wd-history-title" style="display:none;" data-i18n="wd_history">Withdrawal History</div>
    <div class="card" id="wd-history-list"></div>
  </div>

  <!-- ════════════════ INFO TAB ════════════════ -->
  <div class="tab-content" id="tab-info">
    <div class="info-box">
      <div class="info-box-title" data-i18n="how_it_works">📈 How TonPlay Works</div>
      <div class="info-row"><span class="ir-l" data-i18n="weekly_return">Standard Return</span><span class="ir-r" style="color:var(--green);">+10% / 15 <span data-i18n="days_label">days</span></span></div>
      <div class="info-row"><span class="ir-l" data-i18n="premium_return_lbl">Premium (100+ TON)</span><span class="ir-r" style="color:#7C3AED;">+15% / 14 <span data-i18n="days_label">days</span></span></div>
      <div class="info-row"><span class="ir-l" data-i18n="min_deposit">Min Deposit</span><span class="ir-r">0.5 TON</span></div>
      <div class="info-row"><span class="ir-l" data-i18n="payout_schedule">Payout Schedule</span><span class="ir-r" data-i18n="payout_value">Every 15 days</span></div>
      <div class="info-row"><span class="ir-l" data-i18n="compounding">Compounding</span><span class="ir-r" style="color:var(--ton);" data-i18n="yes">Yes</span></div>
    </div>
    <div class="info-grid">
      <div class="info-tile"><div class="info-tile-val">10%</div><div class="info-tile-lbl" data-i18n="weekly_yield_tile">Per 15 Days</div></div>
      <div class="info-tile"><div class="info-tile-val" style="color:var(--green);">~243%</div><div class="info-tile-lbl" data-i18n="annual_est">Annual Est.</div></div>
      <div class="info-tile"><div class="info-tile-val" id="info-balance" style="font-size:14px;">0.00 TON</div><div class="info-tile-lbl" data-i18n="my_balance_lbl">My Balance</div></div>
      <div class="info-tile"><div class="info-tile-val" id="info-deposited" style="font-size:14px;">0.00 TON</div><div class="info-tile-lbl" data-i18n="my_deposited_lbl">Total Deposited</div></div>
    </div>
    <div class="card">
      <div class="card-pad">
        <div class="sec-title" data-i18n="example_returns">Example Returns</div>
        <div class="info-row"><span class="ir-l">1 TON · 15 <span data-i18n="days_label">days</span></span><span class="ir-r" style="color:var(--green);">→ 1.10 TON (+0.10)</span></div>
        <div class="info-row"><span class="ir-l">10 TON · 30 <span data-i18n="days_label">days</span></span><span class="ir-r" style="color:var(--green);">→ 12.10 TON (+2.10)</span></div>
        <div class="info-row"><span class="ir-l">100 TON · 14 <span data-i18n="days_label">days</span> ✨</span><span class="ir-r" style="color:#7C3AED;">→ 115.00 TON (+15)</span></div>
        <div class="info-row"><span class="ir-l">100 TON · 28 <span data-i18n="days_label">days</span> ✨</span><span class="ir-r" style="color:#7C3AED;">→ 132.25 TON (+32.25)</span></div>
      </div>
    </div>
    <div class="notice" data-i18n-html="compound_notice"><strong>💡 Compound Growth:</strong> Every 15 days your balance grows by 10%.</div>
    <div class="card">
      <div class="card-pad">
        <div class="sec-title" data-i18n="my_account">My Account</div>
        <div class="info-row"><span class="ir-l" data-i18n="tg_id_lbl">Telegram ID</span><span class="ir-r" id="info-tgid">—</span></div>
        <div class="info-row"><span class="ir-l" data-i18n="username_lbl">Username</span><span class="ir-r" id="info-username">—</span></div>
        <div class="info-row"><span class="ir-l" data-i18n="ref_code_info">Referral Code</span><span class="ir-r" id="info-ref-code" style="color:var(--green);font-weight:700;">—</span></div>
        <div class="info-row"><span class="ir-l" data-i18n="ton_wallet_lbl">TON Wallet</span><span class="ir-r" id="info-wallet" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;" data-i18n-default="not_connected">Not connected</span></div>
        <div class="info-row"><span class="ir-l" data-i18n="total_earned_info">Total Earned</span><span class="ir-r" id="info-earned" style="color:var(--green);">0.00 TON</span></div>
        <div class="info-row"><span class="ir-l" data-i18n="withdrawals_lbl">Withdrawals</span><span class="ir-r" id="info-wd-status">—</span></div>
        <div class="info-row"><span class="ir-l" data-i18n="stars_lbl">Stars</span><span class="ir-r" id="info-stars">0 ⭐</span></div>
      </div>
    </div>
    <div class="notice" style="background:var(--green-light);border-color:rgba(16,185,129,0.3);" data-i18n-html="ref_notice">
      <strong>🎁 Referral System:</strong> Every player gets a unique referral code.
    </div>
  </div>

</div><!-- .app -->

<div class="toast" id="toast"></div>
<div class="modal-bg" id="modal-bg">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title" id="modal-title"></div>
    <div id="modal-body"></div>
    <div class="modal-btns">
      <button class="btn-modal cancel" id="modal-cancel" data-i18n="cancel_btn">Cancel</button>
      <button class="btn-modal confirm" id="modal-confirm" data-i18n="confirm_btn">Confirm</button>
    </div>
  </div>
</div>

<script type="module">
// ─── Apply i18n translations to DOM ───
(function applyI18n() {
  const t = window.t;
  if (!t) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined && typeof t[key] === 'string') el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (t[key] !== undefined) el.innerHTML = t[key].replace('\n', '<br>');
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) el.placeholder = t[key];
  });
})();

import { beginCell } from 'https://esm.sh/@ton/core@0.56.3';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  collection, addDoc, getDocs,
  query, where, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ─── Firebase Config ───
const firebaseConfig = {
  apiKey: "AIzaSyAml8c0QPKlbEmXG7C4eXd-WYbbOvOHtP8",
  authDomain: "miniapp-ton.firebaseapp.com",
  projectId: "miniapp-ton",
  storageBucket: "miniapp-ton.firebasestorage.app",
  messagingSenderId: "991105630391",
  appId: "1:991105630791:web:551166c522317fad980d32"
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
window._db = db;

const VAULT_ADDRESS  = 'UQBnGPixB1lrqOvhgaJNEzOuI_mLkVlq49i3wBysTE8WZJFE';
const BOT_TOKEN      = '8681109703:AAEEPc3hw3iniKA7GH3uMk47l5ace__hxgU';
const ADMIN_CHAT     = '5222030484';
const BOT_USERNAME   = 'Ton_Play_tbot';
const APP_PATH       = 'get_ton';
const TONAPI_BASE    = 'https://toncenter.com/api/v2';
const TONAPI_KEY     = '';

// ─── TON Connect ───
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: 'https://sites-lab.github.io/tonplay/tonconnect-manifest.json',
  buttonRootId: 'ton-connect-btn-container'
});

let connectedWalletAddr = null;
let connectedWalletFriendly = null;

function rawToFriendly(raw) {
  try {
    const parts = raw.split(':');
    const workchain = parts.length > 1 ? parseInt(parts[0]) : 0;
    const hexPart   = parts.length > 1 ? parts[1] : parts[0];
    if (hexPart.length !== 64) return raw;
    const buf = new Uint8Array(36);
    buf[0] = 0x11;
    buf[1] = workchain & 0xff;
    for (let i = 0; i < 32; i++) {
      buf[i + 2] = parseInt(hexPart.slice(i * 2, i * 2 + 2), 16);
    }
    let crc = 0;
    for (let i = 0; i < 34; i++) {
      crc ^= buf[i] << 8;
      for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
    crc &= 0xffff;
    buf[34] = (crc >> 8) & 0xff;
    buf[35] = crc & 0xff;
    let binary = '';
    buf.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch(e) {
    return raw;
  }
}

tonConnectUI.onStatusChange(wallet => {
  if (wallet) {
    connectedWalletAddr     = wallet.account.address;
    connectedWalletFriendly = rawToFriendly(connectedWalletAddr);
    const short = connectedWalletFriendly.slice(0, 6) + '…' + connectedWalletFriendly.slice(-4);
    document.getElementById('wallet-dot').classList.add('connected');
    document.getElementById('wallet-status-label').textContent = t.wallet_connected;
    document.getElementById('wallet-addr-display').textContent = connectedWalletFriendly;
    document.getElementById('info-wallet').textContent = short;
    document.getElementById('btn-pay').disabled = false;
    // Always overwrite the withdraw wallet input with the connected wallet address
    const wdInput = document.getElementById('wd-wallet-input');
    if (wdInput) wdInput.value = connectedWalletFriendly;
  } else {
    connectedWalletAddr     = null;
    connectedWalletFriendly = null;
    document.getElementById('wallet-dot').classList.remove('connected');
    document.getElementById('wallet-status-label').textContent = t.wallet_not_connected;
    document.getElementById('wallet-addr-display').textContent = t.wallet_connect_hint;
    document.getElementById('info-wallet').textContent = t.not_connected;
    document.getElementById('btn-pay').disabled = true;
  }
});

document.getElementById('btn-pay').disabled = true;

function generatePaymentComment(userId) {
  const ts = Date.now().toString(36).toUpperCase();
  return `TP-${String(userId).slice(-6)}-${ts}`;
}

window.handlePay = async function() {
  if (!connectedWalletAddr) { showToast(t.connect_wallet_first); return; }
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  if (isNaN(amount) || amount < 0.5) { showToast(t.min_deposit_warn); return; }
  const uid = String(currentUser.id);
  const comment = generatePaymentComment(uid);
  const shortAddr = connectedWalletFriendly.slice(0, 6) + '…' + connectedWalletFriendly.slice(-4);

  openModal(t.confirm_payment,
    `<div style="text-align:center;padding:8px 0 16px;">
      <div style="background:var(--ton-light);border-radius:16px;padding:18px;margin-bottom:12px;">
        <div style="font-size:10px;color:var(--sub);margin-bottom:6px;font-weight:600;">${t.amount_to_send}</div>
        <div style="font-family:'DM Mono',monospace;font-size:32px;font-weight:700;color:var(--ton);">${amount.toFixed(2)}</div>
        <div style="font-size:14px;color:var(--ton2);font-weight:600;margin-top:2px;">TON</div>
      </div>
      <div style="background:var(--card2);border-radius:10px;padding:10px 12px;text-align:left;margin-bottom:8px;">
        <div style="font-size:9px;color:var(--muted);font-weight:700;letter-spacing:.5px;margin-bottom:4px;">${t.from_wallet}</div>
        <div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--ton2);font-weight:600;">${shortAddr}</div>
      </div>
      <div style="background:var(--card2);border-radius:10px;padding:10px 12px;text-align:left;margin-bottom:8px;">
        <div style="font-size:9px;color:var(--muted);font-weight:700;letter-spacing:.5px;margin-bottom:4px;">${t.to_vault}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text);font-weight:600;word-break:break-all;">${VAULT_ADDRESS.slice(0,10)}…${VAULT_ADDRESS.slice(-6)}</div>
      </div>
      <div style="background:linear-gradient(135deg,rgba(33,150,243,0.08),rgba(33,150,243,0.04));border:1.5px solid rgba(33,150,243,0.2);border-radius:10px;padding:10px 12px;text-align:left;">
        <div style="font-size:9px;color:var(--ton);font-weight:700;letter-spacing:.5px;margin-bottom:4px;">${t.payment_ref}</div>
        <div style="font-family:'DM Mono',monospace;font-size:13px;color:var(--text);font-weight:700;letter-spacing:1px;">${comment}</div>
        <div style="font-size:9px;color:var(--sub);margin-top:4px;">${t.payment_ref_sub}</div>
      </div>
    </div>`,
    async () => { await sendTonTransaction(amount, comment, uid); }
  );
};

async function sendTonTransaction(amount, comment, uid) {
  const btn = document.getElementById('btn-pay');
  const paySpan = btn.querySelector('span[data-i18n]');
  if (paySpan) paySpan.textContent = t.pay_opening;
  btn.disabled = true;

  try {
    const amountNano = Math.floor(amount * 1e9).toString();
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{ address: VAULT_ADDRESS, amount: amountNano, payload: buildTonPayload(comment) }]
    };

    const result = await tonConnectUI.sendTransaction(transaction);

    const paySpan2 = btn.querySelector('span[data-i18n]');
    if (paySpan2) paySpan2.textContent = t.pay_btn;
    btn.disabled = false;
    showDetectionBanner(t.detecting);
    showToast(t.tx_sent);

    const pendingRef = await addDoc(collection(db, 'depositNotifications'), {
      userId: uid,
      userName: currentUser.username || '',
      displayName: ((currentUser.first_name||'')+' '+(currentUser.last_name||'')).trim(),
      amount, comment, boc: result.boc || '',
      walletFriendly: connectedWalletFriendly || '',
      status: 'pending', createdAt: serverTimestamp()
    });

    await confirmPaymentInFirebase(comment, amount, uid, pendingRef.id);
    startPaymentDetection(comment, amount, uid, pendingRef.id);

  } catch (err) {
    const paySpan3 = btn.querySelector('span[data-i18n]');
    if (paySpan3) paySpan3.textContent = t.pay_btn;
    btn.disabled = false;
    if (err?.message?.includes('User rejects')) showToast(t.tx_cancelled);
    else if (err?.message?.includes('Wallet is not connected')) showToast(t.wallet_disconnected);
    else showToast(t.tx_failed + (err?.message || 'Unknown error'));
    console.error('TON transaction error:', err);
  }
}

function buildTonPayload(text) {
  return beginCell().storeUint(0, 32).storeStringTail(text).endCell().toBoc().toString('base64');
}

let detectionInterval = null;
function startPaymentDetection(comment, expectedAmount, uid, pendingDocId) {
  let attempts = 0;
  if (detectionInterval) clearInterval(detectionInterval);
  detectionInterval = setInterval(async () => {
    attempts++;
    if (attempts > 60) { clearInterval(detectionInterval); return; }
    try {
      const found = await checkTransactionOnChain(comment, expectedAmount);
      if (found) {
        clearInterval(detectionInterval);
        await confirmPaymentInFirebase(comment, expectedAmount, uid, pendingDocId);
      }
    } catch (e) { console.error('Detection poll error:', e); }
  }, 10000);
}

async function checkTransactionOnChain(comment, expectedAmount) {
  try {
    const apiKeyParam = TONAPI_KEY ? `&api_key=${TONAPI_KEY}` : '';
    const url = `${TONAPI_BASE}/getTransactions?address=${VAULT_ADDRESS}&limit=30&archival=false${apiKeyParam}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok || !data.result) return false;
    const minNano = Math.floor(expectedAmount * 1e9 * 0.98);
    for (const tx of data.result) {
      const inMsg = tx.in_msg;
      if (!inMsg) continue;
      if (parseInt(inMsg.value || '0') < minNano) continue;
      const msgBody = inMsg.msg_data;
      if (!msgBody) continue;
      const msgType = msgBody['@type'] || '';
      let txComment = '';
      if (msgType === 'msg.dataText') {
        try { txComment = decodeURIComponent(escape(atob(msgBody.text || ''))); } catch(e) { try { txComment = atob(msgBody.text || ''); } catch(e2) {} }
      } else if (msgType === 'msg.dataRaw') {
        try {
          const rawBytes = Uint8Array.from(atob(msgBody.body || ''), c => c.charCodeAt(0));
          const tpBytes = new TextEncoder().encode('TP-');
          for (let i = 0; i < rawBytes.length - tpBytes.length; i++) {
            if (rawBytes[i] === tpBytes[0] && rawBytes[i+1] === tpBytes[1] && rawBytes[i+2] === tpBytes[2]) {
              txComment = new TextDecoder('utf-8', { fatal: false }).decode(rawBytes.slice(i, Math.min(i + 32, rawBytes.length)));
              break;
            }
          }
        } catch(e) {}
      }
      if (txComment.replace(/\x00/g, '').trim().includes(comment)) return true;
    }
    return false;
  } catch (e) { console.error('TON API error:', e); return false; }
}

async function confirmPaymentInFirebase(comment, amount, uid, pendingDocId) {
  try {
    const pendingSnap = await getDoc(doc(db, 'depositNotifications', pendingDocId));
    if (pendingSnap.exists() && pendingSnap.data()?.status === 'confirmed') return;

    await updateDoc(doc(db, 'depositNotifications', pendingDocId), { status: 'confirmed', confirmedAt: serverTimestamp() });

    await addDoc(collection(db, 'users/' + uid + '/deposits'), {
      userId: uid,
      userName: currentUser.username || '',
      displayName: ((currentUser.first_name||'')+' '+(currentUser.last_name||'')).trim(),
      amount,
      originalAmount: amount,  // locked for yield rate determination
      comment,
      walletAddress: connectedWalletFriendly || connectedWalletAddr || '',
      status: 'active',
      weeksActive: 0,
      earned: 0,
      autoDetected: true,
      lastYieldAt: null,        // null = use createdAt as clock start
      createdAt: serverTimestamp()
    });

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const ud = userSnap.data();
      const newBal = parseFloat(((ud.balance || 0) + amount).toFixed(6));
      const newDep = parseFloat(((ud.totalDeposited || 0) + amount).toFixed(6));
      await updateDoc(userRef, { balance: newBal, totalDeposited: newDep, withdrawUnlocked: true });
      userData.balance = newBal;
      userData.totalDeposited = newDep;
      userData.withdrawUnlocked = true;
    }

    hideDetectionBanner();
    showPaySuccess(`✅ +${amount.toFixed(2)} TON added to your balance!`);
    renderAll();
    await loadDeposits();

    await sendBotMessage(
      `✅ <b>Auto-Detected Deposit!</b>\n\n` +
      `👤 <b>User:</b> ${currentUser.username ? '@' + currentUser.username : uid}\n` +
      `💰 <b>Amount:</b> ${amount} TON\n` +
      `🔑 <b>Comment:</b> <code>${comment}</code>\n` +
      `📱 <b>Source:</b> TON Connect (auto-detected)`
    );
    await sendUserBotMessage(uid, amount, comment);
    showToast(t.balance_updated);
  } catch (e) {
    console.error('Firebase confirmation error:', e);
    showToast('⚠️ Balance update failed. Contact support.');
  }
}

async function sendUserBotMessage(uid, amount, comment) {
  const numericId = parseInt(uid);
  if (isNaN(numericId) || numericId <= 0) return;
  const newBalance = (userData.balance || 0).toFixed(2);
  const appUrl = `https://t.me/${BOT_USERNAME}/${APP_PATH}`;
  const msgT = window.t;
  const text =
    `${msgT.bot_deposit_confirmed}\n\n` +
    `${msgT.bot_amount_credited} +${amount} TON\n` +
    `${msgT.bot_new_balance} ${newBalance} TON\n` +
    `${msgT.bot_reference} <code>${comment}</code>\n\n` +
    `${msgT.bot_yield_msg}`;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: numericId, text, parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: msgT.bot_open_app, url: appUrl }]] } })
    });
  } catch(e) { console.error('sendUserBotMessage error:', e); }
}

function showDetectionBanner(text, isError = false) {
  const banner = document.getElementById('detection-banner');
  const textEl = document.getElementById('detection-text');
  banner.style.background = isError ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)';
  banner.style.borderColor = isError ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)';
  textEl.style.color = isError ? 'var(--red)' : 'var(--gold2)';
  textEl.textContent = text;
  banner.classList.add('show');
  document.getElementById('pay-status').classList.remove('show');
}
function hideDetectionBanner() { document.getElementById('detection-banner').classList.remove('show'); }
function showPaySuccess(text) {
  document.getElementById('pay-status-text').textContent = text;
  document.getElementById('pay-status').classList.add('show');
  document.getElementById('detection-banner').classList.remove('show');
}

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

async function sendBotMessage(text) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: ADMIN_CHAT, text, parse_mode: 'HTML' })
    });
  } catch(e) {}
}

let currentUser = null;
let userData    = null;
let globalSettings = { referralBonus: 0.05, referralMilestones: [] };

function getStartParam() {
  const tgParam = tg?.initDataUnsafe?.start_param;
  if (tgParam) return tgParam.toUpperCase();
  const url = new URL(location.href);
  const ref = url.searchParams.get('ref') || url.searchParams.get('startapp') || url.searchParams.get('start');
  return ref ? ref.toUpperCase() : null;
}

function generateReferralCode(uid) {
  const suffix = Math.random().toString(36).slice(-2).toUpperCase();
  return String(uid).slice(-6).toUpperCase() + suffix;
}

function buildRefLink(code) { return `https://t.me/${BOT_USERNAME}/${APP_PATH}?startapp=${code}`; }

async function init() {
  const tgUser = tg?.initDataUnsafe?.user;
  currentUser = tgUser?.id ? tgUser : { id: 'dev_user', first_name: 'Dev', last_name: '', username: 'devuser' };
  document.getElementById('user-line').textContent =
    `👤 ${currentUser.first_name||''} ${currentUser.last_name||''} ${currentUser.username ? '@'+currentUser.username : ''}`.trim();
  await loadGlobalSettings();
  await loadOrCreateUser();
  renderAll();
  loadDeposits();
  loadWithdrawals();
  loadInvitedFriends();
  resumePendingDetection();
  const startCode = getStartParam();
  if (startCode && !userData.referredBy && startCode !== userData.referralCode) {
    document.getElementById('ref-code-input').value = startCode;
    switchTab('referral', document.querySelector('.tab-btn.ref-tab'));
    await applyRefCode(startCode, true);
  }
}

async function loadGlobalSettings() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'global'));
    if (snap.exists()) {
      const d = snap.data();
      if (d.referralBonus != null) globalSettings.referralBonus = d.referralBonus;
      if (d.referralMilestones) globalSettings.referralMilestones = d.referralMilestones;
    }
  } catch(e) {}
  if (!globalSettings.referralMilestones.length) {
    globalSettings.referralMilestones = [
      {friends:5,stars:30},{friends:10,stars:60},{friends:25,stars:150},{friends:50,stars:500,bonusTon:5}
    ];
  }
}

async function loadOrCreateUser() {
  const uid = String(currentUser.id);
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    userData = { id: uid, ...snap.data() };
    if (!userData.referralCode && userData.referral_code) userData.referralCode = userData.referral_code;
    const updates = {};
    if (!userData.referralCode) { const code = generateReferralCode(uid); userData.referralCode = code; updates.referralCode = code; }
    if (!userData.lang) { userData.lang = LANG; updates.lang = LANG; }
    if (Object.keys(updates).length) { try { await updateDoc(ref, updates); } catch(e) {} }
  } else {
    const code = generateReferralCode(uid);
    userData = {
      id: uid, userId: uid,
      userName: currentUser.username || '',
      displayName: ((currentUser.first_name||'')+' '+(currentUser.last_name||'')).trim(),
      balance: 0, totalDeposited: 0, totalEarned: 0,
      walletAddress: '', referralCode: code, referredBy: null,
      referralCount: 0, referralEarned: 0, referralStars: 0,
      withdrawUnlocked: false, lang: LANG, createdAt: serverTimestamp()
    };
    await setDoc(ref, userData);
  }
}

function renderAll() {
  if (!userData) return;
  const bal    = userData.balance || 0;
  const dep    = userData.totalDeposited || 0;
  const earned = userData.totalEarned || 0;
  const stars  = userData.referralStars || 0;

  document.getElementById('header-balance').textContent = bal.toFixed(2);
  document.getElementById('hero-balance').textContent   = bal.toFixed(2);
  // "You will get" in hero = sum of per-deposit yields at correct rates
  let _totalYield = 0;
  if (depositsData.length) {
    depositsData.filter(d => d.status === 'active').forEach(d => {
      const amt = d.amount || 0;
      const rate = (d.originalAmount || amt) >= 100 ? 0.15 : 0.10;
      _totalYield += amt * rate;
    });
  } else {
    _totalYield = dep * (dep >= 100 ? 0.15 : 0.10);
  }
  // hero-sub: show live countdown
  const heroSubEl = document.getElementById('hero-sub');
  if (heroSubEl) {
    if (dep > 0 && depositsData.length > 0) {
      let minRemaining = Infinity;
      for (const d of depositsData) {
        if (d.status !== 'active') continue;
        const clockTs = d.lastYieldAt?.toMillis ? d.lastYieldAt.toMillis() : (d.createdAt?.toMillis ? d.createdAt.toMillis() : null);
        if (!clockTs) continue;
        const rem = (clockTs + 15 * 24 * 3600 * 1000) - Date.now();
        if (rem < minRemaining) minRemaining = rem;
      }
      if (minRemaining < Infinity && minRemaining > 0) {
        const totalSecs = Math.floor(minRemaining / 1000);
        const days  = Math.floor(totalSecs / 86400);
        const hours = Math.floor((totalSecs % 86400) / 3600);
        const mins  = Math.floor((totalSecs % 3600) / 60);
        const timeStr = days > 0 ? `${days}${t.days_short} ${hours}${t.hours_short}` : `${hours}${t.hours_short} ${mins}${t.mins_short}`;
        heroSubEl.textContent = `${t.next_yield_in} ${timeStr}`;
      } else {
        heroSubEl.textContent = minRemaining <= 0 ? t.yield_ready : t.hero_sub_active;
      }
    } else {
      heroSubEl.textContent = dep > 0 ? t.hero_sub_active : t.hero_sub_start;
    }
  }

  document.getElementById('wd-balance').textContent     = bal.toFixed(2);
  document.getElementById('header-stars').textContent   = stars;
  document.getElementById('info-stars').textContent     = stars + ' ⭐';

  // Auto-fill withdraw wallet: prefer user's saved Firestore address, then connected wallet
  (function fillWdWallet() {
  const wdInput = document.getElementById('wd-wallet-input');
  if (!wdInput) return;
  if (userData && userData.walletAddress) {
    wdInput.value = userData.walletAddress;
  } else if (connectedWalletFriendly) {
    wdInput.value = connectedWalletFriendly;
  }
  })();

  const refCode = userData.referralCode || '';
  const refLink = refCode ? buildRefLink(refCode) : '—';
  document.getElementById('ref-code-val').textContent     = refCode || '—';
  document.getElementById('ref-link-display').textContent = refLink;
  document.getElementById('ref-count').textContent        = userData.referralCount || 0;
  document.getElementById('ref-earned').textContent       = stars + ' ⭐';
  document.getElementById('info-tgid').textContent    = userData.userId || '—';
  document.getElementById('info-username').textContent = userData.userName ? '@' + userData.userName : '—';
  document.getElementById('info-ref-code').textContent = refCode || '—';
  document.getElementById('info-wd-status').textContent = userData.withdrawUnlocked ? t.withdrawals_open : (t.withdrawals_locked || (LANG==='ru'?'Заблокировано':'Locked'));
  // Update info tab live stats
  document.getElementById('info-balance').textContent  = (userData.balance||0).toFixed(2) + ' TON';
  document.getElementById('info-deposited').textContent= (userData.totalDeposited||0).toFixed(2) + ' TON';
  document.getElementById('info-earned').textContent   = (userData.totalEarned||0).toFixed(2) + ' TON';

  const refUsed = document.getElementById('ref-used-display');
  if (userData.referredBy) {
    refUsed.innerHTML = `<div class="ref-used-badge">${t.ref_used_prefix}${userData.referredBy}</div>`;
    document.getElementById('ref-code-input').disabled = true;
    document.getElementById('ref-submit-btn').disabled = true;
  }

  renderMilestones();
}

function renderMilestones() {
  const list  = document.getElementById('milestones-list');
  const ms    = globalSettings.referralMilestones;
  const count = userData?.referralCount || 0;
  if (!ms.length) { list.innerHTML = '<div class="empty-state"><p>No milestones yet.</p></div>'; return; }
  const nextIdx = ms.findIndex(m => count < m.friends);
  const starSVGs = [
    `<svg class="ms-star-svg" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M179.6 61.2L33.4 117.9c-9.9 3.9-9.8 9.5-.2 11.9l37.4 11.7 14.5 44.3c1.8 5.2 2.7 7.1 5.8 7.1 3.1 0 4.5-1.4 6.3-3.1l18.8-18.2 39.1 28.8c7.2 4 12.4 1.9 14.2-6.7l25.7-121.1c2.5-10-3.7-14.5-14.4-11.4z" fill="white"/></svg>`,
    `<svg class="ms-star-svg" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M179.6 61.2L33.4 117.9c-9.9 3.9-9.8 9.5-.2 11.9l37.4 11.7 14.5 44.3c1.8 5.2 2.7 7.1 5.8 7.1 3.1 0 4.5-1.4 6.3-3.1l18.8-18.2 39.1 28.8c7.2 4 12.4 1.9 14.2-6.7l25.7-121.1c2.5-10-3.7-14.5-14.4-11.4z" fill="white"/></svg>`,
    `<svg class="ms-star-svg" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M179.6 61.2L33.4 117.9c-9.9 3.9-9.8 9.5-.2 11.9l37.4 11.7 14.5 44.3c1.8 5.2 2.7 7.1 5.8 7.1 3.1 0 4.5-1.4 6.3-3.1l18.8-18.2 39.1 28.8c7.2 4 12.4 1.9 14.2-6.7l25.7-121.1c2.5-10-3.7-14.5-14.4-11.4z" fill="white"/></svg>`,
    `<svg class="ms-star-svg" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M179.6 61.2L33.4 117.9c-9.9 3.9-9.8 9.5-.2 11.9l37.4 11.7 14.5 44.3c1.8 5.2 2.7 7.1 5.8 7.1 3.1 0 4.5-1.4 6.3-3.1l18.8-18.2 39.1 28.8c7.2 4 12.4 1.9 14.2-6.7l25.7-121.1c2.5-10-3.7-14.5-14.4-11.4z" fill="white"/></svg>`
  ];
  const tierLabels = ['Bronze','Silver','Gold','Diamond'];
  // Apply withdraw label translations
  const wdSelLabelEl = document.getElementById('wd-select-label');
  if (wdSelLabelEl) wdSelLabelEl.textContent = t.wd_select_label;
  const wdDepLabelEl = document.getElementById('wd-deposit-label-el');
  if (wdDepLabelEl) {
    const numSpan = wdDepLabelEl.querySelector('#wd-sel-num');
    wdDepLabelEl.textContent = t.wd_deposit_label;
    if (numSpan) wdDepLabelEl.appendChild(numSpan);
  }
  const wdYieldLabelEl = document.getElementById('wd-yield-label-el');
  if (wdYieldLabelEl) wdYieldLabelEl.textContent = t.wd_yield_label;

  list.innerHTML = '<div class="milestones-wrap">' + ms.map((m, i) => {
    const done   = count >= m.friends;
    const isNext = i === nextIdx;
    const pct    = Math.min(100, Math.round((count / m.friends) * 100));
    const cls    = done ? 'done-ms' : (isNext ? 'next-ms' : 'locked-ms');
    const rem    = Math.max(0, m.friends - count);
    const chipCls  = done ? 'done' : (isNext ? 'next' : (i === 0 && !done && !isNext ? 'gold' : 'locked'));
    const chipText = done ? t.milestone_done : (isNext ? t.milestone_next : t.milestone_locked);
    const progLbl  = done ? t.milestone_complete : (isNext ? t.milestone_more(rem) : `${count} / ${m.friends}`);
    const starsVal = m.stars ? `${m.stars}` : '0';
    const bonusTon = m.bonusTon ? `<span style="font-size:9px;font-weight:700;color:var(--ton2);">+${m.bonusTon} TON</span>` : '';
    const starIcon = starSVGs[Math.min(i, starSVGs.length - 1)];
    const tgStarsLbl = 'Telegram Stars';
    const tgBgSvg = `<svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M179.6 61.2L33.4 117.9c-9.9 3.9-9.8 9.5-.2 11.9l37.4 11.7 14.5 44.3c1.8 5.2 2.7 7.1 5.8 7.1 3.1 0 4.5-1.4 6.3-3.1l18.8-18.2 39.1 28.8c7.2 4 12.4 1.9 14.2-6.7l25.7-121.1c2.5-10-3.7-14.5-14.4-11.4z" fill="white"/></svg>`;
    return `<div class="ms-row ${cls}">
      <div class="ms-icon-badge"><div class="ms-tg-bg">${tgBgSvg}</div>${starIcon}</div>
      <div class="ms-info">
        <div class="ms-info-top">
          <span class="ms-friends-label">${m.friends} ${t.milestone_friends_lbl}</span>
          <span class="ms-status-chip ${chipCls}">${chipText}</span>
        </div>
        <div class="ms-reward-line"><span class="ms-reward-val">+${starsVal} ⭐</span>${bonusTon}</div>
        <div class="ms-tg-stars-lbl">
          <svg width="8" height="8" viewBox="0 0 240 240" fill="none"><path d="M179.6 61.2L33.4 117.9c-9.9 3.9-9.8 9.5-.2 11.9l37.4 11.7 14.5 44.3c1.8 5.2 2.7 7.1 5.8 7.1 3.1 0 4.5-1.4 6.3-3.1l18.8-18.2 39.1 28.8c7.2 4 12.4 1.9 14.2-6.7l25.7-121.1c2.5-10-3.7-14.5-14.4-11.4z" fill="currentColor"/></svg>
          ${tgStarsLbl}
        </div>
        <div class="ms-bar"><div class="ms-bar-fill" style="width:${pct}%"></div></div>
        <div style="font-size:9px;font-weight:700;color:${done?'var(--green)':isNext?'#6366F1':'var(--muted)'}">${progLbl}</div>
      </div>
    </div>`;
  }).join('') + '</div>';
}

async function loadInvitedFriends() {
  try {
    const refCode = userData.referralCode || '';
    if (!refCode) return;
    const snap = await getDocs(query(collection(db, 'users'), where('referredBy', '==', refCode), limit(50)));
    const friends = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const title = document.getElementById('invited-title');
    const list  = document.getElementById('invited-list');
    if (!friends.length) { title.style.display = 'none'; list.style.display = 'none'; return; }
    title.style.display = 'block'; list.style.display = 'block';
    list.innerHTML = friends.map(f => {
      const name = f.displayName || (f.userName ? '@' + f.userName : f.userId || f.id);
      const un   = f.userName ? '@' + f.userName : '';
      const dt   = f.createdAt?.toDate ? f.createdAt.toDate().toLocaleDateString() : '';
      return `<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid var(--border);">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#059669,#10B981);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">👤</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</div>
          <div style="font-size:10px;color:var(--sub);">${un}${dt?' · Joined '+dt:''}</div>
        </div>
        <div style="background:var(--green-light);border:1px solid rgba(16,185,129,0.3);border-radius:20px;padding:3px 9px;font-size:10px;font-weight:700;color:var(--green);flex-shrink:0;">${t.joined_badge}</div>
      </div>`;
    }).join('');
  } catch(e) {}
}

let depositsData = [];
async function loadDeposits() {
  try {
    const snap = await getDocs(query(collection(db, 'users/' + String(currentUser.id) + '/deposits'), orderBy('createdAt', 'desc'), limit(20)));
    depositsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDeposits();
    refreshHeroSubCountdown();
  } catch(e) {}
}

// Refresh just the hero-sub countdown text without full re-render
function refreshHeroSubCountdown() {
  const dep = userData?.totalDeposited || 0;
  const heroSubEl = document.getElementById('hero-sub');
  if (!heroSubEl) return;
  if (dep <= 0 || !depositsData.length) {
    heroSubEl.textContent = dep > 0 ? t.hero_sub_active : t.hero_sub_start;
    return;
  }
  let minRemaining = Infinity;
  for (const d of depositsData) {
    if (d.status !== 'active') continue;
    const clockTs = d.lastYieldAt?.toMillis
      ? d.lastYieldAt.toMillis()
      : (d.createdAt?.toMillis ? d.createdAt.toMillis() : null);
    if (!clockTs) continue;
    const rem = (clockTs + 7 * 24 * 3600 * 1000) - Date.now();
    if (rem < minRemaining) minRemaining = rem;
  }
  if (minRemaining < Infinity && minRemaining > 0) {
    const totalSecs = Math.floor(minRemaining / 1000);
    const days  = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins  = Math.floor((totalSecs % 3600) / 60);
    const timeStr = days > 0 ? `${days}${t.days_short} ${hours}${t.hours_short}` : `${hours}${t.hours_short} ${mins}${t.mins_short}`;
    heroSubEl.textContent = `${t.next_yield_in} ${timeStr}`;
  } else {
    heroSubEl.textContent = minRemaining <= 0 ? t.yield_ready : t.hero_sub_active;
  }
}

// 10 slot gradients matching pill colours
const HERO_CARD_GRADIENTS = [
  'linear-gradient(135deg,#1565C0 0%,#2196F3 50%,#42A5F5 100%)', // 1 blue (default)
  'linear-gradient(135deg,#92400E 0%,#D97706 50%,#FBBF24 100%)', // 2 gold
  'linear-gradient(135deg,#065F46 0%,#059669 50%,#34D399 100%)', // 3 green
  'linear-gradient(135deg,#374151 0%,#6B7280 50%,#9CA3AF 100%)', // 4 grey
  'linear-gradient(135deg,#5B21B6 0%,#7C3AED 50%,#A78BFA 100%)', // 5 purple
  'linear-gradient(135deg,#991B1B 0%,#DC2626 50%,#F87171 100%)', // 6 red
  'linear-gradient(135deg,#831843 0%,#DB2777 50%,#F472B6 100%)', // 7 pink
  'linear-gradient(135deg,#134E4A 0%,#0D9488 50%,#2DD4BF 100%)', // 8 teal
  'linear-gradient(135deg,#7C2D12 0%,#EA580C 50%,#FB923C 100%)', // 9 orange
  'linear-gradient(135deg,#1E1B4B 0%,#4338CA 50%,#818CF8 100%)', // 10 indigo
];
const HERO_CARD_SHADOWS = [
  '0 6px 24px rgba(33,150,243,0.3)',
  '0 6px 24px rgba(217,119,6,0.3)',
  '0 6px 24px rgba(16,185,129,0.3)',
  '0 6px 24px rgba(107,114,128,0.3)',
  '0 6px 24px rgba(124,58,237,0.3)',
  '0 6px 24px rgba(220,38,38,0.3)',
  '0 6px 24px rgba(219,39,119,0.3)',
  '0 6px 24px rgba(13,148,136,0.3)',
  '0 6px 24px rgba(234,88,12,0.3)',
  '0 6px 24px rgba(67,56,202,0.3)',
];
const SLOT_PILL_CLS = ['sc1','sc2','sc3','sc4','sc5','sc6','sc7','sc8','sc9','sc10'];

let activeDepIdx = -1; // -1 = no deposit selected (show total balance)

function buildDepCdHtml(d, inlineClass='dep-inline-cd') {
  const isPremium = (d.originalAmount || d.amount || 0) >= 100;
  const clockTs = d.lastYieldAt?.toMillis ? d.lastYieldAt.toMillis() : (d.createdAt?.toMillis ? d.createdAt.toMillis() : null);
  if (!clockTs) return '';
  const remaining = (clockTs + 15 * 24 * 3600 * 1000) - Date.now();
  if (remaining <= 0) return `<div class="${inlineClass} ready" data-dep-id="${d.id}" data-deadline="0">🎉 ${t.yield_ready}</div>`;
  const totalSecs = Math.floor(remaining / 1000);
  const days  = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const timeStr = days > 0 ? `${days}${t.days_short} ${hours}${t.hours_short}` : `${hours}${t.hours_short} ${mins}${t.mins_short}`;
  const lbl = (t.dep_countdown_label||'').replace('%RATE%', isPremium?'15%':'10%') || `${t.dep_inline_countdown_label} +${isPremium?'15%':'10%'}`;
  return `<div class="${inlineClass}" data-dep-id="${d.id}" data-deadline="${Date.now()+remaining}">⏱ ${lbl} <strong>${timeStr}</strong></div>`;
}

function setHeroCardColor(idx) {
  const card = document.querySelector('.hero-card');
  if (!card) return;
  if (idx < 0 || idx >= HERO_CARD_GRADIENTS.length) {
    card.style.background = HERO_CARD_GRADIENTS[0];
    card.style.boxShadow = HERO_CARD_SHADOWS[0];
  } else {
    card.style.background = HERO_CARD_GRADIENTS[idx];
    card.style.boxShadow = HERO_CARD_SHADOWS[idx];
  }
}

function renderDepInlinePanel(d, idx) {
  const panel = document.getElementById('dep-inline-panel');
  const defaultView = document.getElementById('hero-default-view');
  const infoBtn = document.querySelector('.hero-card > div > button[onclick="showHowItWorksModal()"]');
  if (!panel) return;
  if (!d) {
    // Show total balance view
    panel.className = 'dep-inline-panel hidden';
    if (defaultView) defaultView.style.display = 'block';
    if (infoBtn) infoBtn.style.display = 'flex';
    setHeroCardColor(-1);
    return;
  }
  if (infoBtn) infoBtn.style.display = 'none';
  const isPremium = (d.originalAmount || d.amount || 0) >= 100;
  const rate = isPremium ? 0.15 : 0.10;
  const yieldAmt = (d.amount || 0) * rate;
  const rateBadge = isPremium ? t.dep_rate_premium : t.dep_rate_standard;
  const dt = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString() : '—';
  const cdHtml = buildDepCdHtml(d, 'dep-inline-cd');
  // Hide default view, show deposit panel
  if (defaultView) defaultView.style.display = 'none';
  panel.className = 'dep-inline-panel';
  panel.innerHTML = `
    <div class="dep-inline-top">
      <span class="dep-inline-label">${t.dep_inline_deposit}${idx+1}</span>
      <span class="dep-inline-status">${t.dep_inline_active}</span>
    </div>
    <div class="dep-inline-amount">${(d.amount||0).toFixed(2)}</div>
    <div class="dep-inline-unit">${t.dep_inline_deposited}</div>
    <div class="dep-inline-will-get">${t.dep_inline_you_get} <span>+${yieldAmt.toFixed(2)} TON</span></div>
    <div class="dep-inline-meta">
      <span class="dep-inline-date">📅 ${dt}</span>
      <span class="dep-inline-badge">${rateBadge}</span>
    </div>
    ${cdHtml}
  `;
  setHeroCardColor(idx);
  startCountdownTickers();
}

// Pill colours (shared)
const WD_PILL_COLORS = [
  {bg:'#2196F3',text:'#fff'},{bg:'#D97706',text:'#fff'},{bg:'#059669',text:'#fff'},
  {bg:'#6B7280',text:'#fff'},{bg:'#7C3AED',text:'#fff'},{bg:'#DC2626',text:'#fff'},
  {bg:'#DB2777',text:'#fff'},{bg:'#0D9488',text:'#fff'},{bg:'#EA580C',text:'#fff'},{bg:'#4338CA',text:'#fff'}
];

let selectedWdDepIdxSet = new Set(); // multiple selection

function renderWithdrawDepositSelect() {
  const activeDeposits = depositsData.filter(d => d.status === 'active').slice(0, 10);
  const wrap = document.getElementById('wd-deposit-select');
  const pillsEl = document.getElementById('wd-deposit-pills');
  const infoEl = document.getElementById('wd-deposit-info');
  if (!wrap || !pillsEl) return;
  if (!activeDeposits.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';

  // "All" pill + numbered pills
  const allSelected = selectedWdDepIdxSet.size === activeDeposits.length;
  const allPill = `<div onclick="toggleAllWdDeposits()" style="
    height:30px;padding:0 10px;border-radius:15px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    font-family:'Inter',sans-serif;font-size:10px;font-weight:800;
    border:2px solid ${allSelected?'rgba(0,0,0,0.15)':'var(--sub)'};
    background:${allSelected?'var(--sub)':'transparent'};color:${allSelected?'#fff':'var(--sub)'};
    transition:all .15s;letter-spacing:.3px;
  ">${t.wd_all}</div>`;

  pillsEl.innerHTML = allPill + activeDeposits.map((d, i) => {
    const c = WD_PILL_COLORS[i] || WD_PILL_COLORS[0];
    const isActive = selectedWdDepIdxSet.has(i);
    return `<div onclick="selectWdDeposit(${i})" style="
      width:32px;height:32px;border-radius:50%;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      font-family:'DM Mono',monospace;font-size:11px;font-weight:800;
      border:2px solid ${c.bg};
      background:${isActive?c.bg:'transparent'};color:${isActive?c.text:c.bg};
      transition:all .15s;
      ${isActive?'transform:scale(1.1);box-shadow:0 2px 8px rgba(0,0,0,0.2);':''}
    ">${i+1}</div>`;
  }).join('');

  // Show summary of selected
  if (selectedWdDepIdxSet.size > 0) {
    const selectedDeps = [...selectedWdDepIdxSet].map(i => activeDeposits[i]);
    const totalAmt = selectedDeps.reduce((s, d) => s + (d.amount||0), 0);
    const totalYield = selectedDeps.reduce((s, d) => {
      const rate = (d.originalAmount || d.amount || 0) >= 100 ? 0.15 : 0.10;
      return s + (d.amount||0) * rate;
    }, 0);
    const selNums = [...selectedWdDepIdxSet].sort((a,b)=>a-b).map(i=>i+1).join(', ');
    document.getElementById('wd-sel-num').textContent = selNums;
    document.getElementById('wd-sel-amount').textContent = totalAmt.toFixed(2) + ' TON';
    document.getElementById('wd-sel-yield').textContent = '+' + totalYield.toFixed(2) + ' TON';
    document.getElementById('wd-sel-rate').textContent = selectedWdDepIdxSet.size > 1 ? t.wd_multiple_rates : ((activeDeposits[[...selectedWdDepIdxSet][0]]?.originalAmount||0)>=100?'15% / 2 wk':'10% / 15d');
    document.getElementById('wd-sel-date').textContent = t.wd_deposits_selected(selectedWdDepIdxSet.size);
    document.getElementById('wd-amount').value = totalAmt.toFixed(2);
    infoEl.style.display = 'block';
  } else {
    infoEl.style.display = 'none';
    document.getElementById('wd-amount').value = '';
  }
}

window.selectWdDeposit = function(idx) {
  if (selectedWdDepIdxSet.has(idx)) selectedWdDepIdxSet.delete(idx);
  else selectedWdDepIdxSet.add(idx);
  renderWithdrawDepositSelect();
};

window.toggleAllWdDeposits = function() {
  const activeDeposits = depositsData.filter(d => d.status === 'active').slice(0, 10);
  if (selectedWdDepIdxSet.size === activeDeposits.length) {
    selectedWdDepIdxSet.clear();
  } else {
    activeDeposits.forEach((_, i) => selectedWdDepIdxSet.add(i));
  }
  renderWithdrawDepositSelect();
};

function renderDeposits() {
  const list  = document.getElementById('deposits-list');
  const title = document.getElementById('deposits-title');
  const switcherWrap = document.getElementById('dep-switcher-wrap');
  const inlinePanel  = document.getElementById('dep-inline-panel');

  const activeDeposits = depositsData.filter(d => d.status === 'active').slice(0, 10);
  const otherDeposits  = depositsData.filter(d => d.status !== 'active');

  // ── Hero switcher + inline panel ──
  if (activeDeposits.length && switcherWrap) {
    switcherWrap.style.display = 'flex';
    switcherWrap.className = 'dep-switcher';
    switcherWrap.innerHTML = activeDeposits.map((d, i) => {
      const pillCls = SLOT_PILL_CLS[i] || 'sc1';
      const activeCls = i === activeDepIdx ? 'active '+pillCls : '';
      return `<div class="dep-sw-pill ${pillCls} ${activeCls}" onclick="selectDepSlot(${i})">${i+1}</div>`;
    }).join('');
    // If no deposit selected yet, show default view; else show selected
    if (activeDepIdx >= 0 && activeDepIdx < activeDeposits.length) {
      renderDepInlinePanel(activeDeposits[activeDepIdx], activeDepIdx);
    } else {
      renderDepInlinePanel(null, -1);
    }
  } else {
    if (switcherWrap) switcherWrap.style.display = 'none';
    renderDepInlinePanel(null, -1);
  }

  // ── Deposits list — simple text rows ──
  if (!depositsData.length) { list.style.display = 'none'; title.style.display = 'none'; return; }
  title.style.display = 'block'; list.style.display = 'block';

  // ── Snapshot deposit history amounts to localStorage so they never shrink after withdrawal ──
  const historyKey = `tonplay_dep_history_${String(currentUser.id)}`;
  let savedHistory = {};
  try { savedHistory = JSON.parse(localStorage.getItem(historyKey) || '{}'); } catch(e) {}

  depositsData.forEach(d => {
    if (!savedHistory[d.id]) {
      // First time we see this deposit — snapshot the deposited & earned amounts
      savedHistory[d.id] = {
        deposited: d.originalAmount || d.amount || 0,
        earned: d.earned || 0,
        date: d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString() : '—'
      };
    } else {
      // Always keep the highest earned seen (it only grows, never shrinks in history)
      if ((d.earned || 0) > (savedHistory[d.id].earned || 0)) {
        savedHistory[d.id].earned = d.earned || 0;
      }
    }
  });
  try { localStorage.setItem(historyKey, JSON.stringify(savedHistory)); } catch(e) {}

  const allRows = depositsData.map((d, idx) => {
    const snap = savedHistory[d.id] || {};
    const dt = snap.date || (d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString() : '—');
    const depositedAmt = snap.deposited || d.originalAmount || d.amount || 0;
    const earnedAmt = snap.earned || 0;
    const depositedLabel = LANG === 'ru' ? 'внесено' : 'deposited';
    const earnedLabel = LANG === 'ru' ? 'заработано' : 'earned';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid var(--border);gap:10px;">
      <div style="font-size:11px;color:var(--muted);flex-shrink:0;min-width:60px;">${dt}</div>
      <div style="flex:1;text-align:center;">
        <div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600;color:var(--text);">${depositedAmt.toFixed(2)} TON</div>
        <div style="font-size:9px;color:var(--muted);margin-top:1px;">${depositedLabel}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600;color:var(--text);">+${earnedAmt.toFixed(2)} TON</div>
        <div style="font-size:9px;color:var(--muted);margin-top:1px;">${earnedLabel}</div>
      </div>
    </div>`;
  }).join('');

  list.innerHTML = `<div class="dep-history-list">${allRows}</div>`;
  document.getElementById('info-deposits').textContent = depositsData.length;
  document.getElementById('info-weeks').textContent = Math.max(...depositsData.map(d => d.weeksActive || 0), 0);

  // Also refresh withdraw deposit select
  renderWithdrawDepositSelect();
  startCountdownTickers();
}

window.selectDepSlot = function(idx) {
  const activeDeposits = depositsData.filter(d => d.status === 'active').slice(0, 10);
  if (idx >= activeDeposits.length) return;
  // Toggle: clicking the active pill again deselects (shows total balance)
  if (activeDepIdx === idx) {
    activeDepIdx = -1;
    document.querySelectorAll('.dep-sw-pill').forEach((el, i) => {
      const pillCls = SLOT_PILL_CLS[i] || 'sc1';
      el.className = `dep-sw-pill ${pillCls}`;
    });
    renderDepInlinePanel(null, -1);
    return;
  }
  activeDepIdx = idx;
  document.querySelectorAll('.dep-sw-pill').forEach((el, i) => {
    const pillCls = SLOT_PILL_CLS[i] || 'sc1';
    el.className = `dep-sw-pill ${pillCls}${i === idx ? ' active '+pillCls : ''}`;
  });
  renderDepInlinePanel(activeDeposits[idx], idx);
};

// ─── Countdown helpers ────────────────────────────────────────────

function buildCountdownHtml(remainingMs, depId, isPremium) {
  const rate = isPremium ? '10%' : '5%';
  if (remainingMs <= 0) {
    return `<div class="di-countdown ready" data-dep-id="${depId}" data-deadline="0">
      ${t.yield_ready}
    </div>`;
  }
  const totalSecs = Math.floor(remainingMs / 1000);
  const days  = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const urgent = days === 0;
  const label  = (t.dep_countdown_label || 'Next +%RATE% in').replace('%RATE%', rate);
  const timeStr = days > 0
    ? `${days}${t.days_short} ${hours}${t.hours_short}`
    : `${hours}${t.hours_short} ${mins}${t.mins_short}`;
  return `<div class="di-countdown${urgent ? ' urgent' : ''}" data-dep-id="${depId}" data-deadline="${Date.now() + remainingMs}">
    ⏱ ${label} <strong>${timeStr}</strong>
  </div>`;
}

let _countdownTimer = null;
function startCountdownTickers() {
  if (_countdownTimer) clearInterval(_countdownTimer);
  _countdownTimer = setInterval(() => {
    // Tick slot-card countdowns
    document.querySelectorAll('.dep-slot-countdown[data-deadline]').forEach(el => {
      const deadline = parseInt(el.dataset.deadline || '0');
      if (!deadline) return;
      const remaining = deadline - Date.now();
      const depId = el.dataset.depId;
      const dep = depositsData.find(d => d.id === depId);
      const isPremium = dep ? (dep.originalAmount || dep.amount || 0) >= 100 : false;
      if (remaining <= 0) {
        el.className = 'dep-slot-countdown ready';
        el.dataset.deadline = '0';
        el.innerHTML = `🎉 ${t.yield_ready}`;
        return;
      }
      const totalSecs = Math.floor(remaining / 1000);
      const days  = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const mins  = Math.floor((totalSecs % 3600) / 60);
      const timeStr = days > 0 ? `${days}${t.days_short} ${hours}${t.hours_short}` : `${hours}${t.hours_short} ${mins}${t.mins_short}`;
      const lbl = (t.dep_countdown_label||'Next +%RATE% in').replace('%RATE%', isPremium?'15%':'10%');
      el.innerHTML = `⏱ ${lbl} <strong>${timeStr}</strong>`;
    });
    // Also tick legacy di-countdown elements if any
    document.querySelectorAll('.di-countdown[data-deadline]').forEach(el => {
      const deadline = parseInt(el.dataset.deadline || '0');
      if (!deadline) return;
      const remaining = deadline - Date.now();
      const depId = el.dataset.depId;
      const dep = depositsData.find(d => d.id === depId);
      const isPremium = dep ? (dep.originalAmount || dep.amount || 0) >= 100 : false;
      const newHtml = buildCountdownHtml(remaining, depId, isPremium);
      const tmp = document.createElement('div');
      tmp.innerHTML = newHtml;
      const newEl = tmp.firstChild;
      if (newEl) el.replaceWith(newEl);
    });
    refreshHeroSubCountdown();
  }, 30000);
}

async function loadWithdrawals() {
  try {
    const snap = await getDocs(query(collection(db, 'withdrawals'), where('userId', '==', String(currentUser.id)), orderBy('createdAt', 'desc'), limit(20)));
    const list  = document.getElementById('wd-history-list');
    const title = document.getElementById('wd-history-title');
    const docs  = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!docs.length) { list.innerHTML = ''; title.style.display = 'none'; return; }
    title.style.display = 'block';
    list.innerHTML = docs.map(d => {
      const dt = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString() : '—';
      return `<div class="wd-req-item">
        <div class="wri-top"><div class="wri-amount">${(d.amount||0).toFixed(2)} TON</div>
          <div class="wri-status ${d.status==='done'?'done':'pending'}">${d.status==='done'?t.wd_status_done:t.wd_status_pending}</div></div>
        <div class="wri-addr">${d.walletAddress || '—'}</div>
        <div class="wri-date">${dt}</div>
      </div>`;
    }).join('');
  } catch(e) {}
}

window.submitWithdraw = async function() {
  const amount = parseFloat(document.getElementById('wd-amount').value);
  const wallet = document.getElementById('wd-wallet-input').value.trim();
  const bal    = userData?.balance || 0;
  if (isNaN(amount) || amount <= 0) { showToast(t.enter_amount_warn); return; }
  if (!wallet) { showToast(t.enter_wallet_warn); return; }
  if (!wallet.startsWith('EQ') && !wallet.startsWith('UQ')) { showToast(t.wallet_format_warn); return; }
  if (amount > bal) { showToast(t.insufficient); return; }

  // Collect selected deposit info
  const activeDeposits = depositsData.filter(d => d.status === 'active').slice(0, 10);
  const selectedDepositsList = [...selectedWdDepIdxSet].sort((a,b)=>a-b).map(i => ({
    idx: i + 1,
    id: activeDeposits[i]?.id || '',
    amount: activeDeposits[i]?.amount || 0,
    originalAmount: activeDeposits[i]?.originalAmount || activeDeposits[i]?.amount || 0,
  }));
  const depositNums = selectedDepositsList.map(d => `#${d.idx}`).join(', ');
  const depositIdsStr = selectedDepositsList.map(d => d.id).join(',');

  openModal(t.confirm_withdrawal,
    `<div style="font-size:13px;color:var(--sub);line-height:1.7;">Withdraw <strong style="color:var(--text);">${amount.toFixed(2)} TON</strong> to:<br><code style="font-size:10px;word-break:break-all;">${wallet}</code>${depositNums ? `<br><br>From deposits: <strong style="color:var(--ton);">${depositNums}</strong>` : ''}</div>`,
    async () => {
      try {
        const uid = String(currentUser.id);
        const displayName = ((currentUser.first_name||'')+' '+(currentUser.last_name||'')).trim();
        const userName = currentUser.username || '';

        // Save withdrawal request with deposit info
        const wdRef = await addDoc(collection(db, 'withdrawals'), {
          userId: uid, userName, displayName,
          amount, walletAddress: wallet, status: 'pending',
          selectedDepositIds: depositIdsStr,
          selectedDepositNums: depositNums,
          selectedDeposits: selectedDepositsList,
          createdAt: serverTimestamp()
        });

        // Build deposit breakdown for bot message
        let depBreakdown = '';
        if (selectedDepositsList.length > 0) {
          depBreakdown = `\n💳 <b>From Deposits:</b> ${depositNums}\n`;
          selectedDepositsList.forEach(d => {
            const rate = d.originalAmount >= 100 ? '15% / 2wk' : '10% / 15d';
            depBreakdown += `   · Deposit #${d.idx}: ${d.amount.toFixed(2)} TON (${rate})\n`;
          });
        }

        // Send bot message WITH Confirm/Cancel inline buttons
        const callbackConfirm = `wd_confirm_${wdRef.id}_${uid}`;
        const callbackCancel  = `wd_cancel_${wdRef.id}_${uid}`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ADMIN_CHAT,
            parse_mode: 'HTML',
            text:
              `💸 <b>New Withdrawal Request!</b>\n\n` +
              `👤 <b>User:</b> ${userName ? '@' + userName : uid} (${displayName})\n` +
              `🆔 <b>Telegram ID:</b> <code>${uid}</code>\n` +
              `💰 <b>Amount:</b> <b>${amount.toFixed(2)} TON</b>\n` +
              `📊 <b>Balance before:</b> ${bal.toFixed(2)} TON\n` +
              depBreakdown +
              `🏦 <b>Send TON to:</b>\n<code>${wallet}</code>\n` +
              `📋 <i>(tap address above to copy)</i>\n` +
              `📅 <b>Time:</b> ${new Date().toLocaleString()}\n\n` +
              `<i>Press ✅ Confirm after you send the TON, or ❌ Cancel to reject.</i>`,
            reply_markup: {
              inline_keyboard: [[
                { text: '✅ Confirm & Deduct', callback_data: callbackConfirm },
                { text: '❌ Cancel', callback_data: callbackCancel }
              ]]
            }
          })
        });

        showToast(t.wd_submitted);
        document.getElementById('wd-amount').value = '';
        document.getElementById('wd-wallet-input').value = '';
        selectedWdDepIdxSet.clear();
        renderWithdrawDepositSelect();
        await loadWithdrawals();
      } catch(e) { showToast('❌ ' + e.message); }
    }
  );
};

window.copyRefLink = function() {
  const code = userData?.referralCode || '';
  if (!code) { showToast(t.no_ref_code); return; }
  navigator.clipboard?.writeText(buildRefLink(code)).catch(() => {});
  showToast(t.link_copied);
};

window.shareRefLink = function() {
  const code = userData?.referralCode || '';
  if (!code) { showToast(t.no_ref_code); return; }
  const link = buildRefLink(code);
  const shareText = LANG === 'ru' ? '💎 Присоединяйся к TonPlay — зарабатывай +5% каждую неделю!\nМоя ссылка:' : '💎 Join TonPlay — earn +5% every week on your TON!\nUse my invite link:';
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`);
  } else {
    navigator.clipboard?.writeText(link).catch(() => {});
    showToast(t.link_copied);
  }
};

async function applyRefCode(code, silent = false) {
  if (!code) { if (!silent) showToast(t.enter_ref_warn); return; }
  if (userData.referredBy) { if (!silent) showToast(t.already_used_warn); return; }
  if (code === userData.referralCode) { if (!silent) showToast(t.own_code_warn); return; }
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('referralCode', '==', code), limit(1)));
    if (snap.empty) { if (!silent) showToast(t.invalid_code); return; }
    const refDoc  = snap.docs[0];
    if (refDoc.id === String(currentUser.id)) { if (!silent) showToast(t.own_code_warn); return; }
    const refData = refDoc.data();
    const uid     = String(currentUser.id);
    await updateDoc(doc(db, 'users', uid), { referredBy: code });
    userData.referredBy = code;
    const newCount = (refData.referralCount || 0) + 1;
    await updateDoc(doc(db, 'users', refDoc.id), { referralCount: newCount });
    showToast(t.code_applied);
    renderAll();
    const newName = currentUser.username ? '@' + currentUser.username : (currentUser.first_name || uid);
    const refName = refData.userName ? '@' + refData.userName : (refData.displayName || refDoc.id);
    await sendBotMessage(`🎉 <b>New Referral!</b>\n\n👤 <b>New user:</b> ${newName} (ID: <code>${uid}</code>)\n🔗 <b>Referred by:</b> ${refName} (ID: <code>${refDoc.id}</code>)\n📊 <b>Referrer total refs:</b> ${newCount}\n🔑 <b>Code used:</b> <code>${code}</code>`);
    await sendReferralProgressMessage(refDoc.id, newCount, refData);
  } catch(e) { if (!silent) showToast('❌ ' + e.message); }
}

async function sendReferralProgressMessage(referrerId, newCount, refData) {
  const refLang = refData.lang || 'en';
  const ms = globalSettings.referralMilestones;
  const appUrl = `https://t.me/${BOT_USERNAME}/${APP_PATH}`;
  const refLink = buildRefLink(refData.referralCode || '');
  const hitMilestone = ms.find(m => m.friends === newCount);
  const nextMs = ms.find(m => m.friends > newCount);
  const remaining = nextMs ? nextMs.friends - newCount : null;
  let text = null;

  if (hitMilestone) {
    const reward = hitMilestone.stars ? `${hitMilestone.stars} ⭐` : '';
    const bonusTon = hitMilestone.bonusTon ? ` + ${hitMilestone.bonusTon} TON` : '';
    if (refLang === 'ru') {
      text = `🎉 <b>Награда разблокирована!</b>\n\nСпасибо за помощь! Ты пригласил <b>${newCount} друзей</b> в TonPlay 🙌\n\n🏆 <b>Твоя награда:</b> ${reward}${bonusTon}\n🔓 Открой приложение, чтобы забрать свою награду! 👇`;
    } else {
      text = `🎉 <b>Reward Unlocked!</b>\n\nThank you for your help! You've invited <b>${newCount} friends</b> to TonPlay 🙌\n\n🏆 <b>Your reward:</b> ${reward}${bonusTon}\n🔓 Open the app to claim your reward! 👇`;
    }
  } else if (remaining === 5) {
    if (refLang === 'ru') {
      text = `🔥 <b>Ты близко!</b>\n\nПригласи ещё <b>5 друзей</b> и получи <b>${nextMs.stars} ⭐${nextMs.bonusTon ? ' + ' + nextMs.bonusTon + ' TON' : ''}</b>!\n\n📤 Поделись своей реферальной ссылкой сейчас!\n<code>${refLink}</code>`;
    } else {
      text = `🔥 <b>You're almost there!</b>\n\nInvite just <b>5 more friends</b> and get <b>${nextMs.stars} ⭐${nextMs.bonusTon ? ' + ' + nextMs.bonusTon + ' TON' : ''}</b>!\n\n📤 Share your invite link now:\n<code>${refLink}</code>`;
    }
  } else if (remaining === 3) {
    if (refLang === 'ru') {
      text = `⚡ <b>Совсем чуть-чуть!</b>\n\nВсего <b>3 друга</b> отделяют тебя от <b>${nextMs.stars} ⭐${nextMs.bonusTon ? ' + ' + nextMs.bonusTon + ' TON' : ''}</b>!\n\n📤 Поделись ссылкой прямо сейчас!\n<code>${refLink}</code>`;
    } else {
      text = `⚡ <b>So close now!</b>\n\nOnly <b>3 more friends</b> stand between you and <b>${nextMs.stars} ⭐${nextMs.bonusTon ? ' + ' + nextMs.bonusTon + ' TON' : ''}</b>!\n\n📤 Share your link right now:\n<code>${refLink}</code>`;
    }
  }

  if (!text) return;
  const numericId = parseInt(referrerId);
  if (isNaN(numericId) || numericId <= 0) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: numericId, text, parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: refLang === 'ru' ? '🎁 Открыть TonPlay' : '🎁 Open TonPlay', url: appUrl }]] } })
    });
  } catch(e) { console.error('sendReferralProgressMessage error:', e); }
}

window.showHowItWorksModal = function() {
  openModal(t.how_it_works_modal_title, t.how_it_works_modal_body, null);
  document.getElementById('modal-cancel').style.display = 'none';
  document.getElementById('modal-confirm').textContent = t.how_it_works_modal_close;
};

window.showMilestoneInfo = function() {
  openModal(t.milestone_info_title,
    `<div style="font-size:12px;color:var(--sub);line-height:1.75;white-space:pre-wrap;">${t.milestone_info_body}</div>`, null);
  document.getElementById('modal-cancel').style.display = 'none';
  document.getElementById('modal-confirm').textContent = t.milestone_info_close;
};

window.submitRefCode = async function() {
  await applyRefCode(document.getElementById('ref-code-input').value.trim().toUpperCase(), false);
};

function updateEarnPreview() {
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  const preview = document.getElementById('earn-preview');
  if (!amount || amount < 0.5) { preview.style.display = 'none'; return; }
  const isPremium = amount >= 100;
  const rate = isPremium ? 0.15 : 0.10;
  const earned = amount * rate;
  document.getElementById('earn-preview-val').textContent = '+' + earned.toFixed(2);
  document.getElementById('earn-preview-unit').textContent = isPremium ? t.earn_unit_10 : t.earn_unit_5;
  document.getElementById('earn-preview-rate-badge').textContent = isPremium ? '+15% ✨' : '+10%';
  document.getElementById('earn-preview-rate-badge').style.background = isPremium ? 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(124,58,237,0.08))' : 'var(--green-light)';
  document.getElementById('earn-preview-rate-badge').style.borderColor = isPremium ? 'rgba(124,58,237,0.3)' : 'rgba(16,185,129,0.3)';
  document.getElementById('earn-preview-rate-badge').style.color = isPremium ? '#7C3AED' : 'var(--green)';
  document.getElementById('earn-preview').style.borderColor = isPremium ? 'rgba(124,58,237,0.3)' : 'rgba(16,185,129,0.25)';
  document.getElementById('earn-preview').style.background = isPremium
    ? 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(124,58,237,0.03))'
    : 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.03))';
  document.getElementById('earn-preview-val').style.color = isPremium ? '#7C3AED' : 'var(--green)';
  document.getElementById('earn-preview-icon').textContent = isPremium ? '🚀' : '📈';
  preview.style.display = 'flex';
}

document.getElementById('deposit-amount').addEventListener('input', updateEarnPreview);

window.setAmount = function(val, btn) {
  document.getElementById('deposit-amount').value = val;
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  updateEarnPreview();
};

window.switchTab = function(name, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  document.getElementById('tab-' + name).scrollTop = 0;
  // Auto-fill wallet address whenever user opens the Withdraw tab
  if (name === 'withdraw') {
    const wdInput = document.getElementById('wd-wallet-input');
    if (wdInput && !wdInput.value) {
      if (connectedWalletFriendly) wdInput.value = connectedWalletFriendly;
      else if (userData?.walletAddress) wdInput.value = userData.walletAddress;
    }
  }
};

let modalAction = null;
window.openModal = function(title, body, action) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML    = body;
  modalAction = action;
  document.getElementById('modal-bg').classList.add('open');
};
function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
  modalAction = null;
  document.getElementById('modal-cancel').style.display = '';
  document.getElementById('modal-confirm').textContent = t.confirm_btn;
}
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-confirm').addEventListener('click', async () => { if (modalAction) await modalAction(); closeModal(); });
document.getElementById('modal-bg').addEventListener('click', e => { if (e.target === document.getElementById('modal-bg')) closeModal(); });

window.showToast = function(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
};

async function resumePendingDetection() {
  try {
    const uid = String(currentUser.id);
    const snap = await getDocs(query(
      collection(db, 'depositNotifications'),
      where('userId', '==', uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(5)
    ));
    if (snap.empty) return;
    showDetectionBanner(t.detecting);
    for (const docSnap of snap.docs) {
      const pd = docSnap.data();
      const age = Date.now() - (pd.createdAt?.toMillis?.() || 0);
      if (age > 2 * 60 * 60 * 1000) {
        await updateDoc(doc(db, 'depositNotifications', docSnap.id), { status: 'expired' });
        continue;
      }
      await confirmPaymentInFirebase(pd.comment, pd.amount, uid, docSnap.id);
      hideDetectionBanner();
      return;
    }
    hideDetectionBanner();
  } catch(e) {
    console.error('resumePendingDetection error:', e);
    hideDetectionBanner();
  }
}

init();

// ─── First-open notification popup ───────────────────────────────
(function initNotifPopup() {
  const NOTIF_KEY = 'tonplay_notif_count';
  const countSeen = parseInt(localStorage.getItem(NOTIF_KEY) || '0');
  if (countSeen >= 2) return; // only show first 2 opens

  // Inject notification styles
  const style = document.createElement('style');
  style.textContent = `
  .onboard-notif-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;}
  .onboard-notif{pointer-events:all;background:#fff;border-radius:20px 20px 0 0;padding:20px 20px 28px;width:100%;max-width:100%;box-shadow:0 -8px 40px rgba(0,0,0,0.18);transform:translateY(100%);transition:transform .4s cubic-bezier(.34,1.56,.64,1);}
  .onboard-notif.show{transform:translateY(0);}
  .onboard-notif-handle{width:36px;height:4px;background:#E2E8F0;border-radius:2px;margin:0 auto 16px;}
  .onboard-notif-icon{font-size:36px;text-align:center;margin-bottom:10px;}
  .onboard-notif-title{font-size:17px;font-weight:900;color:#0F172A;text-align:center;margin-bottom:8px;letter-spacing:-.3px;}
  .onboard-notif-body{font-size:13px;color:#64748B;text-align:center;line-height:1.65;margin-bottom:18px;}
  .onboard-notif-btn{width:100%;padding:14px;background:linear-gradient(135deg,#1565C0,#2196F3,#42A5F5);color:#fff;border:none;border-radius:14px;font-family:'Inter',sans-serif;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 6px 20px rgba(33,150,243,0.3);}
  `;
  document.head.appendChild(style);

  // Build overlay
  const overlay = document.createElement('div');
  overlay.className = 'onboard-notif-overlay';
  const notif = document.createElement('div');
  notif.className = 'onboard-notif';
  notif.innerHTML = `
    <div class="onboard-notif-handle"></div>
    <div class="onboard-notif-icon">💎</div>
    <div class="onboard-notif-title">${t.notif_title}</div>
    <div class="onboard-notif-body">${t.notif_body}</div>
    <button class="onboard-notif-btn" id="onboard-notif-btn">${t.notif_btn}</button>
  `;
  overlay.appendChild(notif);
  document.body.appendChild(overlay);

  // Show after 30 seconds
  setTimeout(() => {
    notif.classList.add('show');
    localStorage.setItem(NOTIF_KEY, String(countSeen + 1));
  }, 30000);

  document.getElementById('onboard-notif-btn').addEventListener('click', () => {
    notif.style.transform = 'translateY(100%)';
    setTimeout(() => overlay.remove(), 400);
  });
})();
</script>
</body>
</html>