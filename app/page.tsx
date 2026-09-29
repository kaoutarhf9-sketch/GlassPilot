/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-html-link-for-pages */
'use client';
import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SplashScreen from '@/app/components/SplashScreen';

// Tabs
const tabData = [
  {
    stat: '3 min',
    sub: 'par dossier complet',
    title: 'Zéro friction, de bout en bout',
    desc: "Créez le dossier, déclenchez la cession de créance, signez électroniquement et télétransmettez à l'assureur — en un seul flux, sans ressaisie."
  },
  {
    stat: '100%',
    sub: 'données en temps réel',
    title: 'Visibilité totale sur votre centre',
    desc: "Encaissements, taux de remboursement, performance par technicien. Des tableaux de bord qui rendent les décisions évidentes."
  },
  {
    stat: 'iOS & Android',
    sub: 'natif & hors-ligne',
    title: "L'atelier dans leur poche",
    desc: "Interventions, photos, PV, signature client. Tout se synchronise automatiquement dès le retour en zone réseau."
  }
];

function setTab(index: number, btn: HTMLElement) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const d = tabData[index];
  const tabContent = document.getElementById('tab-content');
  if (tabContent) {
    tabContent.innerHTML = `
      <div class="tab-big-stat">${d.stat}</div>
      <div class="tab-stat-sub">${d.sub}</div>
      <div class="tab-title">${d.title}</div>
      <p class="tab-desc">${d.desc}</p>
      <a href="/inscription" class="btn-hero" style="font-size:.83rem;padding:.72rem 1.6rem;display:inline-flex">Voir en démo →</a>
    `;
  }
}

const marqueeItems = ["EDI certifié","Signature électronique","Cession de créance","Hébergement France","RGPD","Accès Web Responsive","Support 24/7","30+ assureurs"];
const doubled = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

export default function Page() {
  useEffect(() => {
    
// Nav scroll
window.addEventListener('scroll', () => {
  document.getElementById('main-nav')?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });



// Counter animation
function animateCounter(el: HTMLElement, target: number, suffix: string) {
  let v = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    v += step;
    if (v >= target) { v = target; clearInterval(timer); }
    el.textContent = Math.floor(v) + suffix;
  }, 16);
}
const statsObs = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    const c1 = document.getElementById('counter-1');
    const c2 = document.getElementById('counter-2');
    if (c1) animateCounter(c1, 1500, '+');
    if (c2) animateCounter(c2, 98, '%');
    statsObs.disconnect();
  }
});
const statsTarget = document.getElementById('counter-1');
if (statsTarget) statsObs.observe(statsTarget);


// Contact button logic removed to allow real form submission

  }, []);

  return (
    <>
      <SplashScreen />
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#04090f;
  --surface:rgba(56, 189, 248, 0.08);
  --surface2:rgba(56, 189, 248, 0.15);
  --border:rgba(255,255,255,0.06);
  --border-glow:rgba(96,165,250,0.18);
  --ink:#ffffff;
  --ink2:#f1f5f9;
  --muted:#cbd5e1;
  --accent:#60a5fa;
  --accent2:#93c5fd;
  --accent-dim:rgba(96,165,250,0.08);
  --accent-mid:rgba(96,165,250,0.15);
  --green:#34d399;
  --green-dim:rgba(52,211,153,0.1);
  --amber:#fbbf24;
  --ff-display:'Cormorant Garamond',Georgia,serif;
  --ff-body:'DM Sans',system-ui,sans-serif;
  --r:14px;
  --r-lg:22px;
}
html{scroll-behavior:smooth; font-size: 105%;}
body{
  background:var(--bg);
  color:var(--ink);
  font-family:var(--ff-body);
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
  font-size: 1.05rem; /* Increase base font size slightly to avoid zooming */
}

/* NOISE OVERLAY */
body::before{
  content:'';
  position:fixed;inset:0;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events:none;z-index:0;opacity:.4;
}

/* AMBIENT LIGHTS */
.glow{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0}
.glow-1{width:700px;height:700px;background:radial-gradient(circle,rgba(37,99,235,.12),transparent 70%);top:-200px;right:-100px}
.glow-2{width:500px;height:500px;background:radial-gradient(circle,rgba(16,185,129,.06),transparent 70%);bottom:-100px;left:-50px}
.glow-3{width:400px;height:400px;background:radial-gradient(circle,rgba(96,165,250,.07),transparent 70%);top:40%;left:30%}

/* NAV */
nav{
  position:fixed;top:0;width:100%;z-index:200;
  height:70px;display:flex;align-items:center;
  padding:0 2.5rem;
  background:rgba(4,9,15,0.95);
  backdrop-filter:blur(28px);
  border-bottom:1px solid var(--border);
  transition:all .4s cubic-bezier(.25,.46,.45,.94);
}
nav.scrolled{
  background:rgba(2,5,10,0.98);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}
.nav-inner{max-width:1240px;margin:0 auto;width:100%;display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:.55rem;text-decoration:none}
.logo-mark{
  width:32px;height:32px;border-radius:10px;
  background:linear-gradient(135deg,#3b82f6,#1d4ed8);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--ff-display);font-style:italic;font-size:1.2rem;color:#fff;font-weight:600;
  box-shadow:0 0 20px rgba(59,130,246,.3);
}
.logo-text{font-weight:600;font-size:.95rem;color:var(--ink);letter-spacing:-.01em}
.logo-text span{color:var(--accent)}
.nav-links{display:flex;gap:2.2rem;list-style:none}
.nav-links a{font-size:.82rem;font-weight:500;color:var(--ink2);text-decoration:none;letter-spacing:.01em;transition:color .2s}
.nav-links a:hover{color:var(--ink)}
.nav-right{display:flex;align-items:center;gap:1rem}
.nav-login{font-size:.82rem;font-weight:500;color:var(--ink2);text-decoration:none;transition:color .2s}
.nav-login:hover{color:var(--accent)}
.btn-primary{
  font-family:var(--ff-body);font-weight:600;font-size:.8rem;letter-spacing:.03em;
  background:linear-gradient(135deg,#3b82f6,#1e40af);
  color:#fff;border:none;cursor:pointer;
  padding:.55rem 1.3rem;border-radius:8px;text-decoration:none;
  display:inline-flex;align-items:center;gap:.3rem;
  box-shadow:0 4px 16px rgba(59,130,246,.25),0 0 0 1px rgba(255,255,255,.08);
  transition:all .25s;
}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(59,130,246,.4),0 0 0 1px rgba(255,255,255,.12)}

/* HERO */
.hero{
  min-height:100vh;display:flex;align-items:center;
  padding:100px 2.5rem 80px;position:relative;z-index:1;
}
.hero-inner{max-width:1240px;margin:0 auto;width:100%;display:grid;grid-template-columns:1fr 520px;gap:6rem;align-items:center}

.eyebrow{
  display:inline-flex;align-items:center;gap:.5rem;
  font-size:.7rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;
  color:#38bdf8;background:rgba(56,189,248,0.1);
  border:1px solid rgba(56,189,248,0.2);
  border-radius:100px;padding:.4rem 1.2rem;margin-bottom:2.5rem;
}
.eyebrow-dot{width:6px;height:6px;background:#38bdf8;border-radius:50%;box-shadow:0 0 10px #38bdf8;animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}

h1{
  font-family:var(--ff-display);font-weight:600;
  font-size:clamp(3.8rem,6vw,5.8rem);
  line-height:1.05;letter-spacing:-.03em;color:var(--ink);
  margin-bottom:1.8rem;
  text-shadow: 0 0 1px rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.8);
}
h1 em{
  font-style:normal;
  color:transparent;
  background:linear-gradient(135deg,#60a5fa,#38bdf8);
  -webkit-background-clip:text;background-clip:text;font-weight:600;
  filter: drop-shadow(0 2px 8px rgba(56,189,248,0.4));
}

.hero-sub{font-size:1.1rem;color:var(--ink2);line-height:1.65;max-width:480px;margin-bottom:3.2rem;font-weight:500; text-shadow: 0 2px 4px rgba(0,0,0,0.8);}

.hero-ctas{display:flex;gap:1.2rem;margin-bottom:4.5rem;align-items:center;flex-wrap:wrap}
.btn-hero{
  font-family:var(--ff-body);font-weight:700;font-size:1rem;
  background:linear-gradient(135deg,#38bdf8,#0284c7);
  color:#fff;border:none;cursor:pointer;
  padding:1.1rem 2.8rem;border-radius:100px;text-decoration:none;
  display:inline-flex;align-items:center;gap:.5rem;
  box-shadow:0 6px 28px rgba(59,130,246,.35);
  transition:all .28s cubic-bezier(.25,.46,.45,.94);
  position:relative;overflow:hidden;
}
.btn-hero::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,.15),transparent);
  border-radius:inherit;
}
.btn-hero:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(59,130,246,.5)}
.btn-secondary{
  font-family:var(--ff-body);font-weight:700;font-size:.95rem;
  background:rgba(255,255,255,.05);color:var(--ink);
  border:1px solid rgba(255,255,255,.1);
  cursor:pointer;padding:1.1rem 2.2rem;border-radius:100px;text-decoration:none;
  display:inline-flex;align-items:center;gap:.5rem;
  transition:all .22s;backdrop-filter:blur(8px);
}
.btn-secondary:hover{border-color:rgba(255,255,255,.18);color:var(--ink);background:rgba(255,255,255,.08)}

/* Stats row */
.stats-row{display:flex;align-items:center;gap:3.5rem;padding-top:2.5rem;border-top:1px solid rgba(255,255,255,0.06)}
.stat-num{font-family:var(--ff-display);font-size:2.8rem;font-weight:600;color:var(--ink);line-height:1;margin-bottom:0.3rem; text-shadow: 0 0 1px rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.8);}
.stat-label{font-size:.75rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.stat-sep{width:1px;height:45px;background:rgba(255,255,255,0.06)}

/* DASHBOARD WIDGET */
.dashboard-widget{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:22px;
  overflow:hidden;
  box-shadow:0 40px 100px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.04),inset 0 1px 0 rgba(255,255,255,.06);
  animation:levitate 6s ease-in-out infinite;
  position:relative;
}
.dashboard-widget::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(96,165,250,.04),transparent 60%);
  pointer-events:none;z-index:0;border-radius:inherit;
}
@keyframes levitate{0%,100%{transform:translateY(0) rotate(-.3deg)}50%{transform:translateY(-10px) rotate(.3deg)}}

.widget-bar{
  background:var(--surface2);border-bottom:1px solid var(--border);
  padding:.8rem 1.2rem;display:flex;align-items:center;gap:.7rem;position:relative;z-index:1;
}
.traffic-lights{display:flex;gap:.35rem}
.traffic-lights span{width:10px;height:10px;border-radius:50%}
.widget-title{font-size:.68rem;font-weight:600;color:var(--muted);letter-spacing:.04em}
.live-badge{margin-left:auto;display:flex;align-items:center;gap:.3rem;font-size:.64rem;color:var(--green);font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.live-dot{width:5px;height:5px;background:var(--green);border-radius:50%;animation:pulse 1.5s ease-in-out infinite;box-shadow:0 0 6px var(--green)}

.widget-body{padding:1.2rem;position:relative;z-index:1}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin-bottom:.8rem}
.kpi-card{background:rgba(56,189,248,0.18);border:1px solid rgba(56,189,248,0.3);border-radius:12px;padding:.9rem .8rem;position:relative;overflow:hidden}
.kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(56,189,248,.5),transparent)}
.kpi-value{font-family:var(--ff-display);font-size:1.5rem;font-weight:400;color:var(--ink);line-height:1}
.kpi-label{font-size:.58rem;color:var(--muted);font-weight:500;margin-top:.2rem;letter-spacing:.04em;text-transform:uppercase}
.kpi-trend{font-size:.58rem;color:var(--green);font-weight:700;margin-top:.25rem}

.chart-area{background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);border-radius:12px;padding:1rem;margin-bottom:.7rem}
.chart-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem}
.chart-header span{font-size:.66rem;color:var(--muted);font-weight:500}
.chart-header span:first-child{color:var(--ink2);font-weight:600}
.bar-chart{display:flex;align-items:flex-end;gap:.4rem;height:56px}
.bar{flex:1;border-radius:4px 4px 0 0}

.records{display:flex;flex-direction:column;gap:.45rem}
.record{
  display:flex;align-items:center;justify-content:space-between;
  padding:.65rem .8rem;
  background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);border-radius:12px;
  transition:all .2s;cursor:pointer;
}
.record:hover{background:rgba(56,189,248,.25);border-color:var(--border-glow)}
.record-left{display:flex;align-items:center;gap:.65rem}
.avatar{
  width:28px;height:28px;border-radius:8px;
  background:linear-gradient(135deg,var(--surface2),rgba(96,165,250,.2));
  border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--ff-display);font-style:italic;font-size:.78rem;color:var(--accent2);
}
.record-name{font-size:.73rem;font-weight:600;color:var(--ink)}
.record-sub{font-size:.6rem;color:var(--muted)}
.badge{font-size:.57rem;font-weight:700;padding:.22rem .6rem;border-radius:100px;white-space:nowrap}
.badge-green{background:var(--green-dim);color:var(--green)}
.badge-blue{background:var(--accent-dim);color:var(--accent)}
.badge-amber{background:rgba(251,191,36,.1);color:var(--amber)}

/* MARQUEE */
.marquee{
  background: rgba(5, 16, 29, 0.6);
  border-top:1px solid rgba(56, 189, 248, 0.15);border-bottom:1px solid rgba(56, 189, 248, 0.15);
  padding:1rem 0;overflow:hidden;position:relative;z-index:1;
}
.marquee::before,.marquee::after{
  content:'';position:absolute;top:0;width:120px;height:100%;z-index:2;pointer-events:none;
}
.marquee::before{left:0;background:linear-gradient(90deg,var(--bg),transparent)}
.marquee::after{right:0;background:linear-gradient(-90deg,var(--bg),transparent)}
.marquee-track{display:flex;gap:3rem;animation:marquee 26s linear infinite;white-space:nowrap}
.marquee-item{display:flex;align-items:center;gap:.8rem;font-size:.75rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#38bdf8;text-shadow: 0 0 10px rgba(56,189,248,0.3)}
.marquee-diamond{width:6px;height:6px;background:#38bdf8;transform:rotate(45deg);opacity:.8;box-shadow: 0 0 8px #38bdf8}
@keyframes marquee{to{transform:translateX(-50%)}}

/* SECTIONS */
.section{padding:7rem 2.5rem;position:relative;z-index:1}
.section-inner{max-width:1240px;margin:0 auto}
.section-label{font-size:.66rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:.8rem}
h2{
  font-family:var(--ff-display);font-weight:300;
  font-size:clamp(2.4rem,4vw,3.8rem);line-height:1.06;
  letter-spacing:-.02em;color:var(--ink);margin-bottom:1rem;
}
h2 em{font-style:italic;color:var(--accent2);font-weight:400}
.section-sub{font-size:.93rem;color:var(--ink2);line-height:1.8;font-weight:300;max-width:460px}

/* FEATURES */
.features-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4rem;gap:2rem}
.features-grid{
  display:grid;grid-template-columns:repeat(3,1fr);
  border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;
  background:var(--border);gap:1px;
}
.feature-card{
  background:var(--surface);padding:2.8rem 2.2rem;
  transition:background .3s;position:relative;overflow:hidden;
}
.feature-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);
}
.feature-card:hover{background:var(--surface2)}
.feature-card:hover .feature-icon{color:var(--accent);transform:scale(1.1)}
.feature-num{font-family:var(--ff-body);font-weight:700;font-size:.75rem;color:#38bdf8;letter-spacing:.15em;margin-bottom:1.5rem;background:rgba(56,189,248,0.1);padding:.3rem .7rem;border-radius:6px;display:inline-block}
.feature-icon{font-size:2rem;color:#38bdf8;margin-bottom:1.2rem;transition:all .3s;display:block;text-shadow:0 0 15px rgba(56,189,248,0.4)}
.feature-title{font-family:var(--ff-display);font-size:1.4rem;font-weight:500;color:var(--ink);margin-bottom:.8rem;letter-spacing:-.02em}
.feature-desc{font-size:.9rem;color:var(--ink2);line-height:1.6;font-weight:400}

/* TABS */
.tabs-layout{display:grid;grid-template-columns:260px 1fr;gap:3rem;margin-top:4.5rem}
.tab-nav{display:flex;flex-direction:column;gap:4px}
.tab-btn{
  padding:1.1rem 1.3rem;border-radius:12px;cursor:pointer;
  background:none;border:none;text-align:left;
  display:flex;align-items:center;gap:.9rem;
  transition:all .22s;position:relative;
}
.tab-btn:hover{background:rgba(255,255,255,.03)}
.tab-btn.active{background:var(--surface);border:1px solid var(--border);box-shadow:0 4px 20px rgba(0,0,0,.4)}
.tab-btn.active::before{
  content:'';position:absolute;left:0;top:20%;height:60%;width:2px;
  background:var(--accent);border-radius:0 2px 2px 0;
}
.tab-num{font-family:var(--ff-display);font-style:italic;font-size:.8rem;color:var(--muted);min-width:20px;transition:color .2s}
.tab-btn.active .tab-num{color:var(--accent)}
.tab-name{font-size:.85rem;font-weight:600;color:var(--muted);transition:color .2s}
.tab-btn.active .tab-name{color:var(--ink)}
.tab-panel{
  background:var(--surface);border:1px solid var(--border);border-radius:20px;
  padding:3.5rem;position:relative;overflow:hidden;
}
.tab-panel::before{
  content:'';position:absolute;top:-100px;right:-100px;
  width:300px;height:300px;
  background:radial-gradient(circle,rgba(96,165,250,.06),transparent 70%);
  pointer-events:none;
}
.tab-big-stat{font-family:var(--ff-display);font-size:4.5rem;font-weight:300;color:var(--accent);line-height:1;letter-spacing:-.03em}
.tab-stat-sub{font-size:.66rem;text-transform:uppercase;letter-spacing:.14em;color:var(--muted);font-weight:600;margin-bottom:2rem;margin-top:.25rem}
.tab-title{font-family:var(--ff-display);font-size:1.7rem;font-weight:400;color:var(--ink);margin-bottom:.8rem}
.tab-desc{font-size:.9rem;color:var(--ink2);line-height:1.8;max-width:430px;margin-bottom:2.2rem;font-weight:300}

/* TESTIMONIALS */
.testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:4.5rem}
.testi-card{
  background:var(--surface);border:1px solid var(--border);border-radius:18px;
  padding:2.2rem;transition:all .3s;
}
.testi-card:hover{border-color:var(--border-glow);transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.5)}
.testi-stars{color:var(--amber);font-size:.72rem;letter-spacing:.08em;margin-bottom:.9rem}
.testi-quote{font-family:var(--ff-display);font-size:3.5rem;color:rgba(96,165,250,.15);line-height:.6;margin-bottom:.5rem}
.testi-text{font-size:.86rem;color:var(--ink2);line-height:1.8;margin-bottom:1.8rem;font-style:italic;font-weight:300}
.testi-footer{display:flex;align-items:center;gap:.8rem;padding-top:1.2rem;border-top:1px solid var(--border)}
.testi-avatar{
  width:36px;height:36px;border-radius:10px;
  background:linear-gradient(135deg,var(--surface2),rgba(96,165,250,.2));
  border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--ff-display);font-style:italic;font-size:.9rem;color:var(--accent2);
}
.testi-name{font-size:.8rem;font-weight:700;color:var(--ink)}
.testi-role{font-size:.68rem;color:var(--muted)}

/* PRICING */
.pricing-section{border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05)}
.pricing-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2.5rem;max-width:960px;margin:5rem auto 0}
.price-card{
  background:rgba(15,23,42,0.4);border:1px solid rgba(255,255,255,0.05);border-radius:32px;
  padding:3.5rem 3rem;display:flex;flex-direction:column;
  position:relative;transition:all .3s;overflow:hidden;backdrop-filter:blur(20px);
}
.price-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);
}
.price-card:hover{transform:translateY(-4px);box-shadow:0 24px 64px rgba(0,0,0,.6)}
.price-card.featured{
  border-color:rgba(56,189,248,0.3);
  background:linear-gradient(180deg, rgba(15,23,42,0.8), rgba(4,9,15,0.9));
  box-shadow:0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1);
}
.price-card.featured::before{background:linear-gradient(90deg,transparent,rgba(56,189,248,.4),transparent)}
.price-badge{
  position:absolute;top:0;left:50%;transform:translateX(-50%);
  background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;
  font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.15em;
  padding:.4rem 1.5rem;border-radius:0 0 12px 12px;
  box-shadow:0 6px 20px rgba(56,189,248,.4);
}
.price-name{font-family:var(--ff-display);font-size:2.2rem;font-weight:500;color:var(--ink);margin-bottom:.8rem}
.price-desc{font-size:.9rem;color:var(--ink2);line-height:1.6;margin-bottom:2.5rem;font-weight:300}
.price-amount{font-family:var(--ff-display);font-size:4.5rem;font-weight:400;color:var(--ink);line-height:1;margin-bottom:2.5rem;letter-spacing:-.03em;display:flex;align-items:baseline;gap:.2rem}
.price-card.featured .price-amount{
  background:linear-gradient(135deg,#60a5fa,#38bdf8);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
}
.price-card.featured .price-amount sup, .price-card.featured .price-amount sub{
  -webkit-text-fill-color:var(--ink2);
}
.price-amount sup{font-size:1.8rem;margin-top:.8rem;font-family:var(--ff-body);font-weight:400;color:var(--ink2)}
.price-amount sub{font-size:.95rem;font-family:var(--ff-body);font-weight:400;color:var(--muted);letter-spacing:0}
.price-features{list-style:none;display:flex;flex-direction:column;gap:1.2rem;margin-bottom:3.5rem;flex-grow:1}
.price-features li{display:flex;align-items:flex-start;gap:.8rem;font-size:.9rem;color:var(--ink2);line-height:1.5;font-weight:400}
.price-features li.dim{color:var(--muted);opacity:.6}
.check{color:#38bdf8;font-weight:800;margin-top:.05rem;flex-shrink:0;text-shadow:0 0 10px rgba(56,189,248,0.4)}
.price-features li.dim .check{color:var(--border);text-shadow:none}
.btn-plan{
  display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--ff-body);font-weight:700;font-size:.95rem;
  padding:1.1rem;border-radius:100px;text-decoration:none;
  transition:all .28s;width:100%;
}
.price-card:not(.featured) .btn-plan{background:rgba(255,255,255,.05);color:var(--ink);border:1px solid rgba(255,255,255,.1)}
.price-card:not(.featured) .btn-plan:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2);color:#fff}
.price-card.featured .btn-plan{background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;box-shadow:0 6px 28px rgba(56,189,248,.35);border:none}
.price-card.featured .btn-plan:hover{box-shadow:0 12px 40px rgba(56,189,248,.5);transform:translateY(-2px)}

/* CTA */
.cta-section{
  padding:8rem 2.5rem;
  display:flex;justify-content:center;
  position:relative;z-index:1;
}
.cta-inner{
  max-width:900px;width:100%;
  background:linear-gradient(180deg, rgba(15,23,42,0.6), rgba(4,9,15,0.9));
  border:1px solid rgba(56,189,248,0.15);
  border-radius:32px;
  padding:5rem 3rem;
  text-align:center;
  position:relative;
  box-shadow:0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05);
  overflow:hidden;
}
.cta-inner::before{
  content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;
  background:radial-gradient(circle at 50% 0%, rgba(56,189,248,0.12), transparent 50%);
  pointer-events:none;z-index:0;
}
.cta-inner > *{position:relative;z-index:1}
.cta-inner h2{
  font-size:3.5rem;line-height:1.15;margin-bottom:1.5rem;letter-spacing:-.03em;
}
.cta-inner h2 em{
  background:linear-gradient(135deg,#60a5fa,#38bdf8);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  font-style:normal;
}
.cta-sub{
  font-size:1.1rem;color:var(--ink2);margin:0 auto 3.5rem;
  font-weight:300;line-height:1.7;max-width:550px;
}
.cta-buttons{display:flex;justify-content:center;gap:1.2rem;flex-wrap:wrap}
.btn-cta{
  font-family:var(--ff-body);font-weight:700;font-size:1rem;
  background:linear-gradient(135deg,#38bdf8,#0284c7);
  color:#fff;border:none;cursor:pointer;
  padding:1.1rem 2.8rem;border-radius:100px;text-decoration:none;
  display:inline-flex;align-items:center;gap:.5rem;
  box-shadow:0 6px 28px rgba(59,130,246,.35);
  transition:all .28s;position:relative;overflow:hidden;
}
.btn-cta::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12),transparent);border-radius:inherit}
.btn-cta:hover{transform:translateY(-2px);box-shadow:0 12px 44px rgba(59,130,246,.5)}
.btn-ghost{
  font-family:var(--ff-body);font-weight:600;font-size:.95rem;
  background:rgba(255,255,255,.05);color:var(--ink);border:1px solid rgba(255,255,255,.1);
  cursor:pointer;padding:1.1rem 2.2rem;border-radius:100px;text-decoration:none;
  display:inline-flex;align-items:center;gap:.4rem;transition:all .22s;
}
.btn-ghost:hover{color:var(--ink);border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.04)}
.cta-note{font-size:.75rem;color:var(--muted);margin-top:2.5rem;letter-spacing:.05em;text-transform:uppercase;font-weight:600}

/* CONTACT */
.contact-section{padding:7rem 2.5rem;position:relative;z-index:1}
.contact-inner{max-width:1240px;margin:0 auto}
.contact-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:5rem;align-items:start}
.contact-address{font-size:.9rem;color:var(--ink2);line-height:1.7;margin-bottom:1.8rem;font-weight:300}
.contact-links{display:flex;flex-direction:column;gap:.5rem;margin-bottom:2.5rem}
.contact-link{
  font-size:.9rem;font-weight:600;color:var(--accent);text-decoration:none;
  display:inline-flex;align-items:center;gap:.4rem;transition:opacity .2s;
}
.contact-link:hover{opacity:.75}
.contact-features{display:flex;flex-direction:column;gap:.8rem}
.contact-feature{display:flex;align-items:center;gap:.65rem;font-size:.82rem;color:var(--ink2);font-weight:300}
.contact-feature-icon{
  width:28px;height:28px;border-radius:8px;
  background:var(--accent-dim);border:1px solid var(--border-glow);
  display:flex;align-items:center;justify-content:center;font-size:.75rem;flex-shrink:0;
}
.contact-form-card{
  background:var(--surface);border:1px solid var(--border);border-radius:22px;
  padding:3rem;position:relative;overflow:hidden;
}
.contact-form-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);
}
.form-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:1rem}
.form-group{margin-bottom:1rem}
.contact-form-card input,
.contact-form-card textarea{
  width:100%;padding:1rem 1.2rem;
  background:rgba(255,255,255,.04);
  border:1px solid var(--border);
  border-radius:12px;
  font-size:.875rem;color:var(--ink);
  font-family:var(--ff-body);font-weight:300;
  transition:all .22s;
}
.contact-form-card input::placeholder,
.contact-form-card textarea::placeholder{color:var(--muted)}
.contact-form-card input:focus,
.contact-form-card textarea:focus{
  outline:none;border-color:rgba(96,165,250,.35);
  background:rgba(96,165,250,.04);
  box-shadow:0 0 0 3px rgba(96,165,250,.1);
}
.btn-submit{
  font-family:var(--ff-body);font-weight:600;font-size:.88rem;
  background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;
  border:none;cursor:pointer;padding:.95rem 2.2rem;
  border-radius:10px;display:inline-flex;align-items:center;gap:.5rem;
  transition:all .25s;box-shadow:0 4px 16px rgba(59,130,246,.25);
}
.btn-submit:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(59,130,246,.4)}

/* FOOTER */
footer{
  background:var(--surface);border-top:1px solid var(--border);
  padding:5rem 2.5rem 3rem;position:relative;z-index:1;
}
.footer-inner{max-width:1240px;margin:0 auto}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:3rem;margin-bottom:3.5rem}
.footer-brand p{font-size:.82rem;color:var(--ink2);line-height:1.75;margin-top:.9rem;max-width:240px;font-weight:300}
.footer-col h5{font-size:.66rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:1.4rem}
.footer-col ul{list-style:none;display:flex;flex-direction:column;gap:.55rem}
.footer-col a{font-size:.82rem;color:var(--ink2);text-decoration:none;transition:color .2s;font-weight:300}
.footer-col a:hover{color:var(--ink)}
.footer-bar{display:flex;justify-content:space-between;align-items:center;padding-top:2rem;border-top:1px solid var(--border)}
.footer-bar p{font-size:.74rem;color:var(--muted)}
.footer-badges{display:flex;gap:.6rem}
.badge-pill{
  font-size:.62rem;font-weight:600;color:var(--accent2);
  background:var(--accent-dim);border:1px solid var(--border-glow);
  padding:.25rem .75rem;border-radius:100px;letter-spacing:.04em;
}

/* MODAL */
.modal-overlay{
  position:fixed;inset:0;z-index:500;
  display:flex;align-items:center;justify-content:center;padding:2rem;
  background:rgba(4,9,15,.85);backdrop-filter:blur(20px);
  opacity:0;pointer-events:none;transition:opacity .3s;
}
.modal-overlay.open{opacity:1;pointer-events:all}
.modal{
  background:var(--surface);border:1px solid var(--border);border-radius:24px;
  max-width:900px;width:100%;padding:1.5rem;
  box-shadow:0 40px 120px rgba(0,0,0,.8);
  transform:scale(.96) translateY(10px);transition:transform .3s;
  position:relative;
}
.modal-overlay.open .modal{transform:scale(1) translateY(0)}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem}
.modal-live{display:flex;align-items:center;gap:.5rem;font-size:.75rem;font-weight:700;color:var(--ink);letter-spacing:.04em}
.modal-close{
  width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.06);
  border:1px solid var(--border);cursor:pointer;color:var(--ink2);
  display:flex;align-items:center;justify-content:center;font-size:.9rem;
  transition:all .2s;
}
.modal-close:hover{background:rgba(255,255,255,.1);color:var(--ink)}
.modal-video{border-radius:16px;overflow:hidden;background:#000;aspect-ratio:16/9}
.modal-video video{width:100%;height:100%;display:block}
.modal-footer{display:flex;justify-content:space-between;align-items:center;margin-top:1rem}
.modal-footer p{font-size:.74rem;color:var(--muted)}
.modal-footer span{font-size:.74rem;color:var(--accent);font-weight:600}

/* BENTO LAYOUT FOR SOLUTIONS */
.bento-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(180px, auto);
  gap: 1.5rem;
  margin-top: 3rem;
}
.bento-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.bento-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}
.bento-item::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.5s;
}
.bento-item:hover::before { opacity: 1; }

.bento-item:nth-child(1) { grid-column: span 2; grid-row: span 2; background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%); border-color: rgba(255,255,255,0.12); }
.bento-item:nth-child(2) { grid-column: span 2; }
.bento-item:nth-child(3) { grid-column: span 2; }
.bento-item:nth-child(4) { grid-column: span 2; }
.bento-item:nth-child(5) { grid-column: span 2; }

@media(min-width: 1024px) {
  .bento-item:nth-child(1) { grid-column: span 2; grid-row: span 2; }
  .bento-item:nth-child(2) { grid-column: span 2; grid-row: span 1; }
  .bento-item:nth-child(3) { grid-column: span 1; grid-row: span 1; }
  .bento-item:nth-child(4) { grid-column: span 1; grid-row: span 1; }
  .bento-item:nth-child(5) { grid-column: span 4; grid-row: span 1; display: flex; flex-direction: row; align-items: center; justify-content: space-between; padding: 2rem 3rem;}
  .bento-item:nth-child(5) .bento-text { max-width: 60%; }
}

@media(max-width: 1023px) and (min-width: 768px) {
  .bento-container { grid-template-columns: repeat(2, 1fr); }
  .bento-item { grid-column: span 1 !important; grid-row: span 1 !important; }
  .bento-item:nth-child(5) { grid-column: span 2 !important; }
}

@media(max-width: 767px) {
  .bento-container { grid-template-columns: 1fr; }
  .bento-item { grid-column: 1 / -1 !important; grid-row: auto !important; }
}

.bento-icon {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
  color: var(--accent);
}
.bento-item:nth-child(1) .bento-icon { font-size: 3.5rem; margin-bottom: auto; padding-top: 1rem; color: var(--accent2); }
.bento-item:nth-child(5) .bento-icon { font-size: 6rem; margin-bottom: 0; color: #fff; opacity: 0.05; position: absolute; right: 2rem; bottom: -2rem; }

.bento-title {
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: #fff;
  letter-spacing: -0.02em;
}
.bento-item:nth-child(1) .bento-title { font-size: 2.2rem; }

.bento-desc {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.5;
}
.bento-item:nth-child(1) .bento-desc { font-size: 1.15rem; max-width: 90%; }

/* RESPONSIVE */
@media(max-width:1024px){
  .hero-inner,.contact-grid{grid-template-columns:1fr;gap:3rem}
  .features-header{flex-direction:column}
  .features-grid{grid-template-columns:repeat(2,1fr)}
  .tabs-layout{grid-template-columns:1fr}
  .tab-nav{flex-direction:row;overflow-x:auto;padding-bottom:.25rem}
  .pricing-grid{grid-template-columns:1fr;max-width:480px}
  .testi-grid{grid-template-columns:1fr}
  .footer-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:640px){
  .features-grid{grid-template-columns:1fr}
  .hero-ctas{flex-direction:column;align-items:flex-start}
  nav .nav-links{display:none}
  .nav-right{gap:0.5rem}
  .nav-login{font-size:0.75rem}
  .btn-primary{padding:0.4rem 0.8rem;font-size:0.75rem}
  nav{padding:0 1rem}
  .section{padding:4.5rem 1.5rem}
  .hero{padding:100px 1.5rem 60px}
  .footer-grid{grid-template-columns:1fr}
  .footer-bar{flex-direction:column;gap:.8rem;text-align:center}
  .form-grid-2{grid-template-columns:1fr}
  .stats-row{flex-wrap:wrap;gap:1.5rem}
}

      `}} />
      

<div className="glow glow-1"></div>
<div className="glow glow-2"></div>
<div className="glow glow-3"></div>

{/*  NAV  */}
<nav id="main-nav">
  <div className="nav-inner">
    <Link href="/" className="logo">
      <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(56,189,248,0.3)]">
        <img src="/logo.jpeg" alt="Logo GlassPilot" className="w-full h-full object-cover object-center" />
      </div>
      <span className="logo-text">Glass<span>Pilot</span></span>
    </Link>
    <ul className="nav-links">
      <li><a href="#">Accueil</a></li>
      <li><a href="#workflow">Fonctionnalités</a></li>
      <li><a href="#solutions">Solutions</a></li>
      <li><a href="#tarifs">Tarifs & Formules</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
    <div className="nav-right">
      <a href="/connexion" className="nav-login">Connexion</a>
      <a href="/inscription" className="btn-primary">S'inscrire →</a>
    </div>
  </div>
</nav>

{/*  HERO  */}
<section className="hero">
  <div className="hero-inner">
    {/*  Left  */}
    <div>
      <div className="eyebrow"><span className="eyebrow-dot"></span>ERP vitrage · Nouvelle génération</div>
      <h1>Pilotez votre centre.<br />Encaissez <em>plus vite.</em></h1>
      <p className="hero-sub">De la prise de rendez-vous à la télétransmission assurance, GlassPilot automatise l'administratif pour que vous vous concentriez sur l'essentiel — votre atelier.</p>
      <div className="hero-ctas">
        <a href="/inscription" className="btn-hero">S'inscrire gratuitement →</a>
        <button className="btn-secondary" onClick={() => document.getElementById('demo-modal')?.classList.add('open')}>▶ &nbsp;Voir la démo</button>
      </div>
      <div className="stats-row">
        <div>
          <div className="stat-num" id="counter-1">0</div>
          <div className="stat-label">Centres équipés</div>
        </div>
        <div className="stat-sep"></div>
        <div>
          <div className="stat-num" id="counter-2">0</div>
          <div className="stat-label">Satisfaction client</div>
        </div>
        <div className="stat-sep"></div>
        <div>
          <div className="stat-num">45<small style={{fontSize: '.9rem', fontWeight: '300'}}> min</small></div>
          <div className="stat-label">Gagnées / dossier</div>
        </div>
      </div>
    </div>

    {/*  Dashboard Widget  */}
    <div className="dashboard-widget">
      <div className="widget-bar">
        <div className="traffic-lights">
          <span style={{background: '#FF5F57'}}></span>
          <span style={{background: '#FEBC2E'}}></span>
          <span style={{background: '#28C840'}}></span>
        </div>
        <span className="widget-title">Tableau de bord · GlassPilot</span>
        <span className="live-badge"><span className="live-dot"></span>En direct</span>
      </div>
      <div className="widget-body">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-value">87</div>
            <div className="kpi-label">Dossiers / mois</div>
            <div className="kpi-trend">↑ +12 ce mois</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">94%</div>
            <div className="kpi-label">Taux paiement</div>
            <div className="kpi-trend">↑ Excellent</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">2.3j</div>
            <div className="kpi-label">Délai remb.</div>
            <div className="kpi-trend" style={{color: 'var(--accent)'}}>↓ Record</div>
          </div>
        </div>
        <div className="chart-area">
          <div className="chart-header">
            <span>Encaissements</span><span>6 derniers mois</span>
          </div>
          <div className="bar-chart">
            <div className="bar" style={{height: '38%', background: 'rgba(96,165,250,.15)'}}></div>
            <div className="bar" style={{height: '52%', background: 'rgba(96,165,250,.2)'}}></div>
            <div className="bar" style={{height: '35%', background: 'rgba(96,165,250,.15)'}}></div>
            <div className="bar" style={{height: '68%', background: 'rgba(96,165,250,.25)'}}></div>
            <div className="bar" style={{height: '60%', background: 'rgba(96,165,250,.2)'}}></div>
            <div className="bar" style={{height: '88%', background: 'linear-gradient(180deg,#60a5fa,#3b82f6)', boxShadow: '0 0 12px rgba(96,165,250,.4)'}}></div>
          </div>
        </div>
        <div className="records">
          <div className="record">
            <div className="record-left">
              <div className="avatar">MT</div>
              <div>
                <div className="record-name">Martin — Toyota Yaris</div>
                <div className="record-sub">Pare-brise · Télétransmis</div>
              </div>
            </div>
            <span className="badge badge-green">Remboursé</span>
          </div>
          <div className="record">
            <div className="record-left">
              <div className="avatar">DB</div>
              <div>
                <div className="record-name">Dupont — BMW X3</div>
                <div className="record-sub">Rétroviseur · En cours</div>
              </div>
            </div>
            <span className="badge badge-blue">EDI envoyé</span>
          </div>
          <div className="record">
            <div className="record-left">
              <div className="avatar">LC</div>
              <div>
                <div className="record-name">Leclerc — Renault Clio</div>
                <div className="record-sub">Vitre · RDV planifié</div>
              </div>
            </div>
            <span className="badge badge-amber">J+2</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  MARQUEE  */}
<div className="marquee">
  <div className="marquee-track" id="marquee-track">
    {doubled.map((t, i) => (
      <span key={i} className="marquee-item">
        <span className="marquee-diamond"></span>{t}
      </span>
    ))}
  </div>
</div>

{/*  FONCTIONNALITES  */}
<section className="section" id="workflow">
  <div className="section-inner">
    <div className="features-header">
      <div>
        <p className="section-label">Fonctionnalités</p>
        <h2>Tout ce dont un centre a besoin.</h2>
      </div>
      <p className="section-sub">Pas un outil généraliste adapté à la va-vite. Conçu dès le départ pour le vitrage automobile.</p>
    </div>
    <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div className="feature-card">
        <div className="feature-num">01</div>
        <div className="feature-icon">◈</div>
        <div className="feature-title">Centralisation</div>
        <div className="feature-desc">Tous vos documents et démarches réunis en un seul espace pour un suivi clair et efficace.</div>
      </div>
      <div className="feature-card">
        <div className="feature-num">02</div>
        <div className="feature-icon">⬡</div>
        <div className="feature-title">Automatisation</div>
        <div className="feature-desc">Réalisez vos tâches répétitives en quelques clics et gagnez jusqu’à 2h par jour.</div>
      </div>
      <div className="feature-card">
        <div className="feature-num">03</div>
        <div className="feature-icon">◎</div>
        <div className="feature-title">Chiffrage sur mesure</div>
        <div className="feature-desc">Évaluez vos dossiers bris de glace et générez vos devis & factures directement depuis la plateforme.</div>
      </div>
      <div className="feature-card">
        <div className="feature-num">04</div>
        <div className="feature-icon">◉</div>
        <div className="feature-title">Recouvrement</div>
        <div className="feature-desc">Suivi automatisé des paiements et des relances pour réduire les impayés et protéger vos revenus.</div>
      </div>
      <div className="feature-card">
        <div className="feature-num">05</div>
        <div className="feature-icon">◇</div>
        <div className="feature-title">Signature électronique</div>
        <div className="feature-desc">Validez vos documents en ligne, sans impression ni envoi postal.</div>
      </div>
      <div className="feature-card">
        <div className="feature-num">06</div>
        <div className="feature-icon">⬢</div>
        <div className="feature-title">Courriers recommandés</div>
        <div className="feature-desc">Envoi simplifié de lettres recommandées, directement depuis la plateforme.</div>
      </div>
      <div className="feature-card">
        <div className="feature-num">07</div>
        <div className="feature-icon">❖</div>
        <div className="feature-title">Accessibilité & sécurité</div>
        <div className="feature-desc">Interface intuitive, utilisable partout, avec protection renforcée de vos données.</div>
      </div>
      <div className="feature-card">
        <div className="feature-num">08</div>
        <div className="feature-icon">⎔</div>
        <div className="feature-title">Support 6j/7</div>
        <div className="feature-desc">Gestionnaires disponibles du : lundi au vendredi 8h–18h. Assistance en ligne 6j/7.</div>
      </div>
    </div>
  </div>
</section>

{/*  SOLUTIONS  */}
<section className="section" id="solutions">
  <div className="section-inner">
    <div className="features-header">
      <div>
        <p className="section-label">Assistant GlassPilot</p>
        <h2>Pourquoi choisir notre solution ?</h2>
      </div>
      <p className="section-sub">Une organisation plus claire, plus rapide, plus rentable.</p>
    </div>
    <div className="bento-container">
      <div className="bento-item">
        <div className="bento-icon">◈</div>
        <div className="bento-text">
          <div className="bento-title">Déclarations simplifiées</div>
          <div className="bento-desc">Fini les démarches longues et complexes. Générez vos déclarations de bris de glace en quelques clics.</div>
        </div>
      </div>
      <div className="bento-item">
        <div className="bento-icon">⬡</div>
        <div className="bento-text">
          <div className="bento-title">100 % digital</div>
          <div className="bento-desc">Plus besoin d’imprimer, scanner ou envoyer manuellement : tout se fait depuis votre espace en ligne.</div>
        </div>
      </div>
      <div className="bento-item">
        <div className="bento-icon">◎</div>
        <div className="bento-text">
          <div className="bento-title">Suivi complet</div>
          <div className="bento-desc">Gardez un œil sur chaque dossier, de la création à la facturation, jusqu’au recouvrement si nécessaire.</div>
        </div>
      </div>
      <div className="bento-item">
        <div className="bento-icon">◉</div>
        <div className="bento-text">
          <div className="bento-title">100 % francophone</div>
          <div className="bento-desc">Bénéficiez d’un accompagnement humain, réactif et spécialisé dans le vitrage automobile.</div>
        </div>
      </div>
      <div className="bento-item">
        <div className="bento-text">
          <div className="bento-title">Performance garantie</div>
          <div className="bento-desc">Moins de paperasse, moins d’erreurs, plus de temps pour vos clients et votre atelier.</div>
        </div>
        <div className="bento-icon">◇</div>
      </div>
    </div>
  </div>
</section>

{/*  PRICING  */}
<section className="section pricing-section" id="tarifs">
  <div className="section-inner">
    <p className="section-label" style={{textAlign: 'center'}}>Tarifs</p>
    <h2 style={{textAlign: 'center'}}>Une offre simple. <em>Aucun frais caché.</em></h2>
    <p className="section-sub" style={{textAlign: 'center', margin: '0 auto'}}>Choisissez le plan adapté à la taille de votre centre et commencez dès aujourd'hui.</p>
    <div className="pricing-grid">
      {/*  Simple  */}
      <div className="price-card">
        <div className="price-name">Simple</div>
        <p className="price-desc">Pour les ateliers indépendants qui souhaitent digitaliser leur gestion de dossiers.</p>
        <div className="price-amount"><sup>€</sup>8<sub>&nbsp;/ jeton</sub></div>
        <ul className="price-features">
          <li><span className="check">✓</span>Gérer vos dossiers en toute autonomie</li>
          <li><span className="check">✓</span>SANS intervention du gestionnaire</li>
          <li><span className="check">✓</span>Accès à la facturation en toute autonomie</li>
          <li><span className="check">✓</span>Génération signature manuscrite</li>
          <li><span className="check">✓</span>Envoi recommandé AR aux assurances</li>
          <li><span className="check">✓</span>Messagerie à votre service en cas de besoin</li>
          <li><span className="check">✓</span>Export PDF fichiers clients</li>
          <li className="dim"><span className="check">✗</span>Suivi limité</li>
          <li className="dim"><span className="check">✗</span>Aucune relance</li>
          <li className="dim"><span className="check">✗</span>Aucune vérification / déclaration</li>
        </ul>
        <a href="/inscription" className="btn-plan">S'inscrire</a>
      </div>
      {/*  Prestige  */}
      <div className="price-card featured">
        <div className="price-badge">Recommandé</div>
        <div className="price-name">Prestige</div>
        <p className="price-desc">Pour les centres en forte croissance et réseaux exigeant une automatisation intégrale.</p>
        <div className="price-amount"><sup>€</sup>25<sub>&nbsp;/ jeton</sub></div>
        <ul className="price-features">
          <li><span className="check">✓</span><strong>Service complet pour vos clients</strong></li>
          <li><span className="check">✓</span><strong>AVEC intervention dédiée d'un gestionnaire</strong></li>
          <li><span className="check">✓</span>Accès à la facturation en toute autonomie</li>
          <li><span className="check">✓</span>Génération signature manuscrite</li>
          <li><span className="check">✓</span>Envoi recommandé AR aux assurances</li>
          <li><span className="check">✓</span>Relance assurance / expert</li>
          <li><span className="check">✓</span>Messagerie dédiée avec nos gestionnaires</li>
          <li><span className="check">✓</span>Export PDF fichiers clients</li>
          <li><span className="check">✓</span>Suivi complet du dossier</li>
          <li><span className="check">✓</span><strong>Support prioritaire</strong></li>
        </ul>
        <a href="/inscription" className="btn-plan">Choisir Prestige</a>
      </div>
    </div>
  </div>
</section>

{/*  TESTIMONIALS  */}
<section className="section" id="avis">
  <div className="section-inner">
    <p className="section-label">Avis clients</p>
    <h2>Ils ont fait <em>le saut.</em></h2>
    <p className="section-sub">Rejoignez les centaines de pros qui ont transformé leur gestion.</p>
    <div className="testi-grid">
      <div className="testi-card">
        <div className="testi-stars">★★★★★</div>
        <div className="testi-quote">"</div>
        <p className="testi-text">On a divisé par quatre le temps passé sur l'administratif. Les dossiers partent le soir même, on est remboursés deux jours plus tôt.</p>
        <div className="testi-footer">
          <div className="testi-avatar">T</div>
          <div>
            <div className="testi-name">Thomas Bernard</div>
            <div className="testi-role">Directeur · AutoGlass Pro, Lyon</div>
          </div>
        </div>
      </div>
      <div className="testi-card">
        <div className="testi-stars">★★★★★</div>
        <div className="testi-quote">"</div>
        <p className="testi-text">L'onboarding a duré une heure. Le lendemain, toute l'équipe était autonome. Aucun outil n'a jamais été aussi simple à adopter.</p>
        <div className="testi-footer">
          <div className="testi-avatar">S</div>
          <div>
            <div className="testi-name">Sophie Martin</div>
            <div className="testi-role">Gérante · RapidPareBrise, Bordeaux</div>
          </div>
        </div>
      </div>
      <div className="testi-card">
        <div className="testi-stars">★★★★★</div>
        <div className="testi-quote">"</div>
        <p className="testi-text">Quatre centres pilotés depuis un seul tableau de bord. GlassPilot a rendu possible ce qu'on pensait impossible sans recruter.</p>
        <div className="testi-footer">
          <div className="testi-avatar">D</div>
          <div>
            <div className="testi-name">David Leroy</div>
            <div className="testi-role">PDG · Mondial Pare-Brise, Paris</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  CTA  */}
<section className="cta-section">
  <div className="cta-inner">
    <p className="section-label" style={{background: 'rgba(56,189,248,0.1)', color: '#38bdf8', padding: '0.4rem 1.2rem', display: 'inline-block', borderRadius: '100px', marginBottom: '2rem'}}>L'avenir de votre centre</p>
    <h2>Votre atelier mérite<br /><em>mieux que des tableurs.</em></h2>
    <p className="cta-sub">Rejoignez la plateforme et automatisez votre gestion dès aujourd'hui. Sans engagement, sans frais cachés.</p>
    <div className="cta-buttons">
      <a href="/inscription" className="btn-cta">S'inscrire gratuitement →</a>
      <a href="#solutions" className="btn-ghost">En savoir plus</a>
    </div>
    <p className="cta-note">1 500+ centres équipés · Hébergement France · RGPD · EDI certifié</p>
  </div>
</section>

{/*  CONTACT  */}
<section className="contact-section" id="contact">
  <div className="contact-inner">
    <div className="contact-grid">
      <div>
        <p className="section-label">Contact</p>
        <h2>Discutons de<br />votre garage.</h2>
        <p className="contact-address">58 Rue de Monceau<br />75008 Paris</p>
        <div className="contact-links">
          <a href="tel:+33745109606" className="contact-link">→ +33 7 45 10 96 06</a>
          <a href="mailto:glasspilotcontact@gmail.com" className="contact-link">→ glasspilotcontact@gmail.com</a>
        </div>
        <div className="contact-features">
          <div className="contact-feature"><div className="contact-feature-icon">⚡</div>Réponse sous 2h en jours ouvrés</div>
          <div className="contact-feature"><div className="contact-feature-icon">🇫🇷</div>Équipe 100% basée en France</div>
          <div className="contact-feature"><div className="contact-feature-icon">🔒</div>Vos données ne sont jamais revendues</div>
        </div>
      </div>
      <form action="https://formsubmit.co/glasspilotcontact@gmail.com" method="POST" className="contact-form-card">
        <input type="hidden" name="_subject" value="Nouveau contact depuis le site GlassPilot !" />
        {/* Désactiver le captcha de formsubmit pour une meilleure fluidité */}
        <input type="hidden" name="_captcha" value="false" />
        
        <div className="form-grid-2">
          <div className="form-group"><input type="text" name="name" placeholder="Nom &amp; prénom" required /></div>
          <div className="form-group"><input type="tel" name="phone" placeholder="Téléphone" required /></div>
        </div>
        <div className="form-group"><input type="email" name="email" placeholder="Adresse e-mail" required /></div>
        <div className="form-group"><textarea name="message" placeholder="Votre message..." rows={4} required></textarea></div>
        <button type="submit" className="btn-submit">Être contacté &nbsp;→</button>
      </form>
    </div>
  </div>
</section>

{/*  FOOTER  */}
<footer>
  <div className="footer-inner">
    <div className="footer-grid">
      <div className="footer-brand">
        <Link href="/" className="logo">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            <img src="/logo.jpeg" alt="Logo GlassPilot" className="w-full h-full object-cover object-center" />
          </div>
          <span className="logo-text">Glass<span>Pilot</span></span>
        </Link>
        <p>L'ERP nouvelle génération pour les professionnels du vitrage automobile. Conçu en France, pour la France.</p>
      </div>
      <div className="footer-col">
        <h5>Produit</h5>
        <ul>
          <li><a href="#">Fonctionnalités</a></li>
          <li><a href="#">Changelog</a></li>
          <li><a href="#">Roadmap</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h5>Ressources</h5>
        <ul>
          <li><a href="#">Documentation</a></li>
          <li><a href="#">API</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">Statut système</a></li>
        </ul>
      </div>
      <div className="footer-col">
        <h5>Société</h5>
        <ul>
          <li><a href="#">À propos</a></li>
          <li><a href="#">Carrières</a></li>
          <li><a href="#">Contact</a></li>
          <li><a href="#">Mentions légales</a></li>
        </ul>
      </div>
    </div>
    <div className="footer-bar">
      <p>© 2026 GlassPilot SAS — Tous droits réservés.</p>
      <div className="footer-badges">
        <span className="badge-pill">🇫🇷 Hébergé en France</span>
        <span className="badge-pill">EDI certifié</span>
        <span className="badge-pill">RGPD</span>
      </div>
    </div>
  </div>
</footer>

{/*  DEMO MODAL  */}
<div className="modal-overlay" id="demo-modal" onClick={(e) => { if(e.target===e.currentTarget) e.currentTarget.classList.remove('open') }}>
  <div className="modal">
    <div className="modal-header">
      <div className="modal-live">
        <span className="live-dot" style={{width: '7px', height: '7px', flexShrink: '0'}}></span>
        Démonstration automatisée · GlassPilot
      </div>
      <button className="modal-close" onClick={() => document.getElementById('demo-modal')?.classList.remove('open')}>✕</button>
    </div>
    <div className="modal-video">
      <video src="/demo_glasspilot.webm" controls autoPlay style={{width: '100%', height: '100%', objectFit: 'cover'}}></video>
    </div>
    <div className="modal-footer">
      <p>Découvrez comment créer un dossier et gérer vos jetons en moins de 2 minutes.</p>
      <span>Plateforme Web Responsive</span>
    </div>
  </div>
</div>


    </>
  );
}
