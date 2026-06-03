import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createWorker, PSM } from "tesseract.js";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import api from "../api/api";
import ScheduleDesignPreview, { getAccent, fmtTime, courseBaseColor } from "../components/ScheduleDesignPreview";

const EXPORT_W = 900;

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday"];
const DAY_SHORT = {Sunday:"Sun",Monday:"Mon",Tuesday:"Tue",Wednesday:"Wed",Thursday:"Thu"};

const DEMO_DATA = [
  {id:1, name:"MGMT 523",day:"Sunday",   startTime:"08:00",endTime:"09:30",room:"G101", emoji:"📊",confidence:99,instructor:"Dr. Al-Qassem"},
  {id:2, name:"CIS 422", day:"Sunday",   startTime:"10:00",endTime:"11:30",room:"B204", emoji:"💻",confidence:99,instructor:"Dr. Rahman"},
  {id:3, name:"CIS 423", day:"Monday",   startTime:"08:00",endTime:"09:30",room:"Lab 3",emoji:"⚡",confidence:99,instructor:""},
  {id:4, name:"CIS 326", day:"Monday",   startTime:"12:00",endTime:"13:30",room:"A102", emoji:"🖥️",confidence:99,instructor:""},
  {id:5, name:"CIS 422", day:"Wednesday",startTime:"10:00",endTime:"11:30",room:"B204", emoji:"💻",confidence:99,instructor:"Dr. Rahman"},
  {id:6, name:"MGMT 523",day:"Wednesday",startTime:"08:00",endTime:"09:30",room:"G101", emoji:"📊",confidence:99,instructor:"Dr. Al-Qassem"},
  {id:7, name:"CIS 423", day:"Thursday", startTime:"08:00",endTime:"09:30",room:"Lab 3",emoji:"⚡",confidence:99,instructor:""},
  {id:8, name:"CIS 326", day:"Thursday", startTime:"12:00",endTime:"13:30",room:"A102", emoji:"🖥️",confidence:99,instructor:""},
];

const THEMES = [
  {id:"minimal",       label:"Minimal",       desc:"Clean & focused",      previewBg:"#f8fafc"},
  {id:"glassmorphism", label:"Glassmorphism", desc:"Frosted glass layers",  previewBg:"linear-gradient(135deg,#667eea,#764ba2)"},
  {id:"campus-card",   label:"Campus Card",   desc:"University style",      previewBg:"linear-gradient(135deg,#1e3a5f,#2d6a9f)"},
  {id:"gradient",      label:"Gradient",      desc:"Vivid gradient cards",  previewBg:"linear-gradient(135deg,#f093fb,#f5576c)"},
  {id:"dark-academic", label:"Dark Academic", desc:"Warm & scholarly",      previewBg:"linear-gradient(135deg,#1a1209,#2a1f0f)"},
];

const CARD_STYLES = [
  {id:"rounded",  label:"Rounded",  desc:"Balanced"},
  {id:"compact",  label:"Compact",  desc:"Dense"},
  {id:"detailed", label:"Detailed", desc:"Full info"},
  {id:"large",    label:"Large",    desc:"Spacious"},
];

const BG_PRESETS = [
  {id:"clean",  label:"White",  bg:"#ffffff"},
  {id:"slate",  label:"Slate",  bg:"#f1f5f9"},
  {id:"dark",   label:"Dark",   bg:"#0f172a"},
  {id:"purple", label:"Purple", bg:"linear-gradient(135deg,#667eea,#764ba2)"},
  {id:"sunset", label:"Sunset", bg:"linear-gradient(135deg,#f093fb,#f5576c)"},
  {id:"ocean",  label:"Ocean",  bg:"linear-gradient(135deg,#0575e6,#021b79)"},
  {id:"forest", label:"Forest", bg:"linear-gradient(135deg,#134e5e,#71b280)"},
  {id:"warmth", label:"Warmth", bg:"linear-gradient(135deg,#f8b500,#e05c00)"},
];

const PALETTE = ["#4f6ef7","#7c3aed","#0ea5e9","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16","#f97316","#6366f1","#14b8a6"];
const DAY_COLORS = {Sunday:"#2563eb",Monday:"#16a34a",Tuesday:"#9333ea",Wednesday:"#ea580c",Thursday:"#e11d48"};
const EMOJIS = ["💻","📐","🔬","⚡","📚","🎯","🌍","💡","🏛️","⚗️","🧪","🎨","🎵","🧮","📊","🗄️","📝","🔭","🧬","🏋️","🎓","🔐","📡","🖥️","🔧","📌","🌐","🏆"];
const TIME_OPTS = Array.from({length:29},(_,i)=>{const m=8*60+i*30,h=Math.floor(m/60),mm=m%60;return `${String(h).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;});
const DEFAULT_DESIGN = {theme:"minimal",darkMode:false,colorStyle:"by-course",courseColors:{},bgPreset:"clean",bgCustom:"#f8fafc",cardStyle:"rounded",viewMode:"week",showEmoji:true,showRoom:true,showDuration:true};

const COURSE_CODE_RE = /\b([A-Z]{2,5})\s*[-]?\s*(\d{3}[A-Z]?)\b/g;
const TIME_RE = /\b(\d{1,2})[:.،](\d{2})\b/g;
const ROOM_RE = /\b([A-Z]{0,2}\d{3,4}[A-Z]?|[Ll]ab\s*\d+|[A-Z]{1,3}[-/]\d{3})\b/g;
const SECTION_RE = /\b(?:sec(?:tion)?\.?\s*|#)(\d{1,3}[A-Z]?)\b/gi;
const TYPE_RE_DETECT = /\b(lec(?:ture)?|lab(?:oratory)?|tut(?:orial)?)\b/gi;
const TYPE_MAP = {"lec":"Lecture","lecture":"Lecture","lab":"Laboratory","laboratory":"Laboratory","tut":"Tutorial","tutorial":"Tutorial"};

const DAY_PATTERNS = {
  Sunday:    ["sunday","sun","أحد","الأحد","الاحد","ahd"],
  Monday:    ["monday","mon","اثنين","الاثنين","الثنين","ithnayn"],
  Tuesday:   ["tuesday","tue","ثلاثاء","الثلاثاء","ثلاثا","tues"],
  Wednesday: ["wednesday","wed","أربعاء","الأربعاء","اربعاء","arb"],
  Thursday:  ["thursday","thu","خميس","الخميس","khamis"],
  Friday:    ["friday","fri","جمعة","الجمعة"],
  Saturday:  ["saturday","sat","سبت","السبت"],
};

const KNOWN_DEPTS = new Set([
  "CIS","CS","CPSC","IT","IS","SE","MIS","ECE","EE","ME","CE","IE",
  "MGMT","MAN","BUS","ACCT","FIN","MKT","HRM","MGT",
  "MATH","STAT","PHYS","CHEM","BIO","GEO","SCI",
  "ENGL","ARAB","FREN","COMM","GE","PE","IAS","ISL",
]);

const DEPT_OCR_FIX = {
  "GIS":"CIS","CLS":"CIS","EIS":"CIS","0IS":"CIS","CI5":"CIS","ClS":"CIS","CIS":"CIS",
  "MGNT":"MGMT","MGHT":"MGMT","MGM":"MGMT","MGML":"MGMT","MGMIT":"MGMT",
  "C5":"CS","G5":"CS","CS5":"CS",
  "MATI":"MATH","MATI-I":"MATH","MATIH":"MATH",
  "STATI":"STAT","STATI5":"STAT",
  "ENGI":"ENGL","ENOL":"ENGL",
  "ARABI":"ARAB","AR AB":"ARAB",
};

function correctDeptCode(raw) {
  if (!raw) return raw;
  const up = raw.toUpperCase().replace(/\s+/g,"").trim();
  if (KNOWN_DEPTS.has(up)) return up;
  if (DEPT_OCR_FIX[up]) return DEPT_OCR_FIX[up];
  const noDigits = up.replace(/[0-9]/g,"O").replace(/[1]/g,"I");
  if (KNOWN_DEPTS.has(noDigits)) return noDigits;
  return up;
}

function correctNumCode(raw) {

  return raw
    .replace(/[Oo]/g,"0")
    .replace(/[lI](?=\d)/g,"1")
    .replace(/[sS](?=\d)/g,"5");
}

function extractTimePairFromText(text) {

  const rangeRe = /(\d{1,2})[:.،](\d{2})\s*(am|pm)?\s*[-–—to]+\s*(\d{1,2})[:.،](\d{2})\s*(am|pm)?/gi;
  rangeRe.lastIndex = 0;
  let m = rangeRe.exec(text);
  if (m) {
    let h1=parseInt(m[1]), mn1=parseInt(m[2]);
    let h2=parseInt(m[4]), mn2=parseInt(m[5]);
    const ap1=m[3]?.toLowerCase(), ap2=m[6]?.toLowerCase();
    if (ap1==="pm" && h1!==12) h1+=12;
    if (ap1==="am" && h1===12) h1=0;
    if (ap2==="pm" && h2!==12) h2+=12;
    if (ap2==="am" && h2===12) h2=0;

    if (!ap2 && h2>0 && h2<h1 && h2<=6) h2+=12;
    const s=h1*60+mn1, e=h2*60+mn2;
    if (s>=6*60 && e<=23*60 && e>s && e-s<=240) {
      return {
        startTime:`${String(h1).padStart(2,"0")}:${String(mn1).padStart(2,"0")}`,
        endTime:  `${String(h2).padStart(2,"0")}:${String(mn2).padStart(2,"0")}`,
      };
    }
  }

  const singles=[];
  const sRe=/(\d{1,2})[:.،](\d{2})\s*(am|pm)?/gi;
  let sm;
  while ((sm=sRe.exec(text))!==null) {
    let h=parseInt(sm[1]), mn=parseInt(sm[2]);
    const ap=sm[3]?.toLowerCase();
    if (ap==="pm" && h!==12) h+=12;
    if (ap==="am" && h===12) h=0;
    const total=h*60+mn;
    if (total>=6*60 && total<=23*60) singles.push({h, mn, total, explicit:!!ap});
  }
  if (singles.length>=2) {
    let [a,b]=[singles[0],singles[1]];

    if (!b.explicit && b.total<a.total && b.h>=1 && b.h<=6) {
      b={...b, h:b.h+12, total:b.total+12*60};
    }
    if (b.total>a.total && b.total-a.total<=240) {
      return {
        startTime:`${String(a.h).padStart(2,"0")}:${String(a.mn).padStart(2,"0")}`,
        endTime:  `${String(b.h).padStart(2,"0")}:${String(b.mn).padStart(2,"0")}`,
      };
    }
  }
  return null;
}

function detectSkewAngle(srcCanvas) {
  const MAX_W = 500;
  const sc = Math.min(1, MAX_W / srcCanvas.width);
  const sw = Math.round(srcCanvas.width * sc);
  const sh = Math.round(srcCanvas.height * sc);
  const tmp = document.createElement("canvas");
  tmp.width = sw; tmp.height = sh;
  const tCtx = tmp.getContext("2d");
  tCtx.drawImage(srcCanvas, 0, 0, sw, sh);
  const pd = tCtx.getImageData(0, 0, sw, sh).data;
  const binary = new Uint8Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) binary[i] = pd[i * 4] < 140 ? 1 : 0;
  const cx = sw / 2, cy = sh / 2;
  let bestAngle = 0, bestVar = -1;
  for (let ai = -16; ai <= 16; ai++) {
    const ang = ai * 0.5;
    const rad = ang * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const rowSums = new Float32Array(sh);
    for (let y = 0; y < sh; y++) {
      let cnt = 0;
      for (let x = 0; x < sw; x++) {
        const sx = Math.round((x - cx) * cos + (y - cy) * sin + cx);
        const sy = Math.round(-(x - cx) * sin + (y - cy) * cos + cy);
        if (sx >= 0 && sx < sw && sy >= 0 && sy < sh) cnt += binary[sy * sw + sx];
      }
      rowSums[y] = cnt;
    }
    const mean = rowSums.reduce((a, b) => a + b, 0) / sh;
    const v = rowSums.reduce((a, b) => a + (b - mean) ** 2, 0) / sh;
    if (v > bestVar) { bestVar = v; bestAngle = ang; }
  }
  return Math.abs(bestAngle) >= 0.4 ? bestAngle : 0;
}

function preprocessForOCR(imgEl) {
  const MAX_W = 2800;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {willReadFrequently:true});

  const nw = imgEl.naturalWidth || imgEl.width || 800;
  const nh = imgEl.naturalHeight || imgEl.height || 600;

  let scale = nw < 1400 ? Math.min(2.5, 1400/nw) : 1;
  if (nw * scale > MAX_W) scale = MAX_W / nw;
  scale = Math.max(scale, 1);

  canvas.width = Math.round(nw * scale);
  canvas.height = Math.round(nh * scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

  const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = d.data;
  const W = canvas.width, H = canvas.height;

  for (let i=0; i<data.length; i+=4) {
    const g = Math.round(0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]);
    data[i] = data[i+1] = data[i+2] = g;
  }

  let lo=255, hi=0;
  for (let i=0; i<data.length; i+=4) { lo=Math.min(lo,data[i]); hi=Math.max(hi,data[i]); }
  const rng = hi-lo || 1;
  for (let i=0; i<data.length; i+=4) {
    let g = ((data[i]-lo)/rng)*255;
    g = Math.min(255, Math.max(0, (g-128)*1.65+128));
    data[i] = data[i+1] = data[i+2] = Math.round(g);
  }

  if (W * H < 3_000_000) {
    const src = new Uint8Array(data.length);
    src.set(data);
    const k = [-1,-1,-1,-1,9,-1,-1,-1,-1];
    for (let y=1; y<H-1; y++) {
      for (let x=1; x<W-1; x++) {
        let s=0;
        for (let ky=-1;ky<=1;ky++) for (let kx=-1;kx<=1;kx++) {
          s += src[((y+ky)*W+(x+kx))*4] * k[(ky+1)*3+(kx+1)];
        }
        const idx=(y*W+x)*4;
        const v=Math.min(255,Math.max(0,s));
        data[idx]=data[idx+1]=data[idx+2]=v;
      }
    }
  }

  ctx.putImageData(d, 0, 0);

  const skewAngle = detectSkewAngle(canvas);
  if (skewAngle !== 0) {
    const rot = document.createElement("canvas");
    rot.width = W; rot.height = H;
    const rCtx = rot.getContext("2d");
    rCtx.fillStyle = "#ffffff";
    rCtx.fillRect(0, 0, W, H);
    rCtx.translate(W / 2, H / 2);
    rCtx.rotate(-skewAngle * Math.PI / 180);
    rCtx.drawImage(canvas, -W / 2, -H / 2);
    return rot;
  }

  return canvas;
}

function parseTimeStr(s) {
  if (!s) return null;

  const ampm = s.match(/(\d{1,2})[:.،](\d{2})\s*(am|pm)/i);
  if (ampm) {
    let h=parseInt(ampm[1]), mn=parseInt(ampm[2]);
    const pm=ampm[3].toLowerCase()==="pm";
    if (pm && h!==12) h+=12;
    if (!pm && h===12) h=0;
    if (h<0||h>23||mn>59) return null;
    return `${String(h).padStart(2,"0")}:${String(mn).padStart(2,"0")}`;
  }
  const m = s.match(/(\d{1,2})[:.،](\d{2})/);
  if (!m) return null;
  const h=parseInt(m[1]), mn=parseInt(m[2]);
  if (h>23||mn>59) return null;
  return `${String(h).padStart(2,"0")}:${m[2]}`;
}

function addMinutes(t, mins) {
  if (!t) return null;
  const [h,m] = t.split(":").map(Number);
  const end = h*60+m+mins;
  return `${String(Math.floor(end/60)).padStart(2,"0")}:${String(end%60).padStart(2,"0")}`;
}

function _scanHeaderZone(words, imgW, headerZone) {
  const cols = {};
  for (const w of words) {
    if (w.bbox.y1 > headerZone) continue;
    const raw = w.text.trim();
    if (raw.length < 2) continue;
    const lo = raw.toLowerCase().replace(/[^a-z؀-ۿ]/g, "");
    const firstWord = lo.split(/\d/)[0];
    for (const [day, pats] of Object.entries(DAY_PATTERNS)) {
      let best = 0;
      for (const p of pats) {
        if (lo === p || firstWord === p) { best = 2; break; }
        if (p.length >= 3 && (lo.includes(p) || firstWord.includes(p))) { best = Math.max(best, 1); }
      }
      if (best > 0) {
        const score = w.confidence + best * 10;
        if (!cols[day] || score > cols[day].score) {
          cols[day] = {
            cx: (w.bbox.x0 + w.bbox.x1) / 2,
            x0: w.bbox.x0,
            x1: w.bbox.x1,
            bottom: w.bbox.y1,
            y0: w.bbox.y0,
            score,
          };
        }
      }
    }
  }

  const headerWords = words
    .filter(w => w.bbox.y1 <= headerZone && w.text.trim().length >= 2)
    .sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
  for (let i = 0; i < headerWords.length - 1; i++) {
    const w1 = headerWords[i], w2 = headerWords[i + 1];
    const gap = w2.bbox.x0 - w1.bbox.x1;
    const rowOverlap = Math.min(w1.bbox.y1, w2.bbox.y1) - Math.max(w1.bbox.y0, w2.bbox.y0);
    if (gap < imgW * 0.15 && rowOverlap > 0) {
      const combined = (w1.text + w2.text).toLowerCase().replace(/[^a-z؀-ۿ]/g, "");
      const cx = (w1.bbox.x0 + w1.bbox.x1 + w2.bbox.x0 + w2.bbox.x1) / 4;
      const x0 = Math.min(w1.bbox.x0, w2.bbox.x0);
      const x1 = Math.max(w1.bbox.x1, w2.bbox.x1);
      const bottom = Math.max(w1.bbox.y1, w2.bbox.y1);
      const avgConf = (w1.confidence + w2.confidence) / 2;
      for (const [day, pats] of Object.entries(DAY_PATTERNS)) {
        for (const p of pats) {
          if (combined === p || (p.length >= 4 && combined.includes(p))) {
            const score = avgConf + 15;
            if (!cols[day] || score > cols[day].score) {
              cols[day] = { cx, x0, x1, bottom, y0: Math.min(w1.bbox.y0, w2.bbox.y0), score };
            }
          }
        }
      }
    }
  }
  return cols;
}

function findDayColumns(words, imgW, imgH) {

  const zones = [0.20, 0.30, 0.45, 0.60];
  let bestCols = {};
  for (const frac of zones) {
    const cols = _scanHeaderZone(words, imgW, imgH * frac);
    const n = Object.keys(cols).length;
    console.log(`[OCR] Day scan zone=${Math.round(frac*100)}%: found ${n} day(s) — ${Object.keys(cols).join(", ")||"none"}`);
    if (n > Object.keys(bestCols).length) bestCols = cols;
    if (n >= 2) break;
  }
  const entries = Object.entries(bestCols);
  if (entries.length > 0) {
    console.log("[OCR] Day columns detected:", entries.map(([d,v])=>`${d}@x=${Math.round(v.cx)}(x0=${Math.round(v.x0)})`).join(", "));
  } else {
    console.log("[OCR] No day columns detected — will use text fallback");
  }
  return bestCols;
}

function buildColBounds(dayColumns, imgW) {
  const dayList = Object.entries(dayColumns).sort((a, b) => a[1].cx - b[1].cx);
  const colBounds = dayList.map(([day, info], i) => {
    const prevCx = i > 0 ? dayList[i-1][1].cx : info.cx - (dayList[1] ? dayList[1][1].cx - info.cx : imgW * 0.1);
    const nextCx = i < dayList.length-1 ? dayList[i+1][1].cx : info.cx + (info.cx - dayList[i-1][1].cx);
    return { day, cx: info.cx, xMin: (info.cx + prevCx) / 2, xMax: (info.cx + nextCx) / 2 };
  });

  const firstInfo = dayList[0][1];
  const firstLeftEdge = typeof firstInfo.x0 === "number"
    ? Math.max(0, firstInfo.x0 - imgW * 0.05)
    : 0;
  colBounds[0].xMin = firstLeftEdge;
  colBounds[colBounds.length - 1].xMax = imgW;
  console.log("[OCR] Column bounds:", colBounds.map(c=>`${c.day}:[${Math.round(c.xMin)}-${Math.round(c.xMax)}]`).join(", "));
  return colBounds;
}

function findTimeRows(words, imgW, imgH, headerBottom) {
  const leftZone = imgW * 0.22;

  const timeWordRe = /(\d{1,2})[:.،](\d{2})\s*(am|pm)?/i;

  const candidates = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const cx = (w.bbox.x0 + w.bbox.x1) / 2;
    const cy = (w.bbox.y0 + w.bbox.y1) / 2;
    if (cx > leftZone) continue;
    if (cy <= headerBottom) continue;
    if (w.confidence < 18) continue;

    let text = w.text.trim();

    if (i + 1 < words.length) {
      const nxt = words[i + 1];
      const nxtCx = (nxt.bbox.x0 + nxt.bbox.x1) / 2;
      const nxtCy = (nxt.bbox.y0 + nxt.bbox.y1) / 2;
      if (nxtCx <= leftZone && Math.abs(nxtCy - cy) < 20 && /^(am|pm)$/i.test(nxt.text.trim())) {
        text = w.text + nxt.text;
      }
    }

    const m = text.match(timeWordRe);
    if (!m) continue;

    let h = parseInt(m[1]), mn = parseInt(m[2]);
    const ap = m[3]?.toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    const total = h * 60 + mn;
    if (total < 5 * 60 || total > 23 * 60) continue;

    candidates.push({
      time: `${String(h).padStart(2,"0")}:${String(mn).padStart(2,"0")}`,
      total, h, mn,
      hasExplicitAmPm: !!ap,
      y0: w.bbox.y0, y1: w.bbox.y1,
      yCy: cy,
    });
  }

  candidates.sort((a, b) => a.y0 - b.y0);

  const deduped = candidates.filter((c, i) =>
    i === 0 || c.y0 - candidates[i - 1].y1 > 12
  );

  if (deduped.length >= 3) {
    let maxSoFar = deduped[0].total;
    for (let i = 1; i < deduped.length; i++) {
      const cur = deduped[i];
      if (!cur.hasExplicitAmPm && cur.total < maxSoFar && cur.h >= 1 && cur.h <= 6) {
        const newH = cur.h + 12;
        const newTotal = cur.total + 12 * 60;
        deduped[i] = {
          ...cur,
          time: `${String(newH).padStart(2,"0")}:${String(cur.mn).padStart(2,"0")}`,
          total: newTotal,
          h: newH,
        };
      }
      maxSoFar = Math.max(maxSoFar, deduped[i].total);
    }
  }

  const rowBounds = deduped.map((tw, i) => ({
    time: tw.time,
    total: tw.total,
    yCy: tw.yCy,
    yMin: i === 0
      ? Math.max(headerBottom, tw.y0 - 30)
      : (tw.y0 + deduped[i - 1].y1) / 2,
    yMax: i < deduped.length - 1
      ? (tw.y1 + deduped[i + 1].y0) / 2
      : imgH,
  }));

  console.log("[OCR] Time rows:", rowBounds.map(r => `${r.time}@y=${Math.round(r.yCy)}`).join(", ") || "none");
  return rowBounds;
}

function clusterWordsIntoBlocks(words, colBounds, imgH, headerBottom) {
  const byCol = {};
  for (const col of colBounds) byCol[col.day] = [];

  for (const w of words) {
    if (!w.text.trim() || w.confidence < 18) continue;
    const cx = (w.bbox.x0 + w.bbox.x1) / 2;
    if ((w.bbox.y0 + w.bbox.y1) / 2 <= headerBottom) continue;
    const col = colBounds.find(c => cx >= c.xMin && cx < c.xMax);
    if (col) byCol[col.day].push(w);
  }

  const allBlocks = [];
  const vertGap = imgH * 0.06;

  for (const [day, colWords] of Object.entries(byCol)) {
    const sorted = [...colWords].sort((a, b) => a.bbox.y0 - b.bbox.y0);
    if (!sorted.length) continue;

    let current = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].bbox.y0 - current[current.length - 1].bbox.y1 <= vertGap) {
        current.push(sorted[i]);
      } else {
        allBlocks.push(_makeBlock(day, current));
        current = [sorted[i]];
      }
    }
    allBlocks.push(_makeBlock(day, current));
  }

  console.log(`[OCR] ${allBlocks.length} blocks across ${colBounds.length} columns`);
  return allBlocks;
}

function _makeBlock(day, cluster) {
  return {
    day,
    words: cluster,
    text: cluster.map(w => w.text).join(" "),
    bbox: {
      x0: Math.min(...cluster.map(w => w.bbox.x0)),
      y0: Math.min(...cluster.map(w => w.bbox.y0)),
      x1: Math.max(...cluster.map(w => w.bbox.x1)),
      y1: Math.max(...cluster.map(w => w.bbox.y1)),
    },
    cy: (Math.min(...cluster.map(w => w.bbox.y0)) + Math.max(...cluster.map(w => w.bbox.y1))) / 2,
    avgConf: Math.round(cluster.reduce((a, w) => a + w.confidence, 0) / cluster.length),
  };
}

function assignBlockTime(block, timeRows, imgH) {

  const textPair = extractTimePairFromText(block.text);
  if (textPair) return { startTime: textPair.startTime, endTime: textPair.endTime, source: "text" };

  if (!timeRows.length) return { startTime: null, endTime: null, source: "none" };

  const band = timeRows.find(r => block.cy >= r.yMin && block.cy < r.yMax);
  if (band?.time) return { startTime: band.time, endTime: addMinutes(band.time, 90), source: "band" };

  let nearest = null, nearestDist = Infinity;
  for (const row of timeRows) {
    if (!row.time) continue;
    const d = Math.abs(block.cy - row.yCy);
    if (d < nearestDist) { nearestDist = d; nearest = row; }
  }
  if (nearest && nearestDist < imgH * 0.15) {
    return { startTime: nearest.time, endTime: addMinutes(nearest.time, 90), source: "nearest" };
  }

  return { startTime: null, endTime: null, source: "none" };
}

function extractCoursesFromBlocks(blocks, timeRows, imgH) {
  const courses = [];
  const seen = new Set();

  for (const block of blocks) {
    const { text, day, avgConf } = block;

    COURSE_CODE_RE.lastIndex = 0;
    const rawMatches = [...text.matchAll(COURSE_CODE_RE)];
    COURSE_CODE_RE.lastIndex = 0;
    if (!rawMatches.length) continue;

    const codes = rawMatches.map(m => `${correctDeptCode(m[1])} ${correctNumCode(m[2])}`);

    ROOM_RE.lastIndex = 0;
    const rooms = [...text.matchAll(ROOM_RE)].map(m => m[0]);
    ROOM_RE.lastIndex = 0;

    SECTION_RE.lastIndex = 0;
    const secMatch = SECTION_RE.exec(text);
    const section = secMatch ? secMatch[1] : "";
    SECTION_RE.lastIndex = 0;

    TYPE_RE_DETECT.lastIndex = 0;
    const typeMatch = TYPE_RE_DETECT.exec(text);
    const type = typeMatch ? (TYPE_MAP[typeMatch[1].toLowerCase()] || "") : "";
    TYPE_RE_DETECT.lastIndex = 0;

    const { startTime, endTime, source } = assignBlockTime(block, timeRows, imgH);

    let rem = text;
    codes.forEach(c => { rem = rem.replace(new RegExp(c.replace(/\s+/g, "\\s*"), "gi"), ""); });
    rooms.forEach(r => { rem = rem.replace(r, ""); });
    rem = rem.replace(/\d{1,2}[:.،]\d{2}\s*[-–—to]*\s*\d{1,2}[:.،]\d{2}/g, "");
    rem = rem.replace(/\d{1,2}[:.،]\d{2}/g, "");
    if (typeMatch) rem = rem.replace(new RegExp(typeMatch[1], "gi"), "");
    const namedInstr = rem.match(/\b(?:Dr|Prof|Eng)\.?\s+[A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,})*/);
    const instructor = (namedInstr ? namedInstr[0] : rem.replace(/[^a-zA-Z؀-ۿ\s.]/g, " ").replace(/\s+/g, " ").trim()).slice(0, 60);

    const needsReview = avgConf < 65 || source === "none" || source === "nearest" || !startTime;
    const timeFromBlock = source === "text";

    codes.forEach(code => {
      const dedupeKey = `${code}||${day}||${startTime || "?"}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      console.log(`[OCR] Course: code=${code} day=${day} time=${startTime||"?"}-${endTime||"?"} src=${source} conf=${avgConf} bbox=[${Math.round(block.bbox.x0)},${Math.round(block.bbox.y0)},${Math.round(block.bbox.x1)},${Math.round(block.bbox.y1)}] review=${needsReview}`);

      courses.push({
        id: Date.now() + Math.random(),
        name: code,
        day,
        startTime: startTime || null,
        endTime: endTime || null,
        room: rooms[0] || "",
        instructor,
        section,
        type,
        emoji: "📚",
        confidence: avgConf,
        needsReview,
        timeFromBlock,
      });
    });
  }

  return courses.length > 0 ? courses : null;
}

function textFallbackParse(rawText) {
  const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 1);
  const courses = [];
  let currentDay = null;

  for (const line of lines) {
    for (const [day, pats] of Object.entries(DAY_PATTERNS)) {
      const lo = line.toLowerCase();
      if (pats.some(p => lo.includes(p.toLowerCase()))) { currentDay = day; break; }
    }

    COURSE_CODE_RE.lastIndex = 0;
    const rawMatches = [...line.matchAll(COURSE_CODE_RE)];
    COURSE_CODE_RE.lastIndex = 0;
    if (rawMatches.length === 0) continue;
    const codes = rawMatches.map(m => `${correctDeptCode(m[1])} ${correctNumCode(m[2])}`);

    const timePair = extractTimePairFromText(line);
    let st = null, et = null;
    if (timePair) {
      st = timePair.startTime;
      et = timePair.endTime;
    } else {
      TIME_RE.lastIndex = 0;
      const times = [...line.matchAll(TIME_RE)].map(m => parseTimeStr(m[0])).filter(Boolean);
      TIME_RE.lastIndex = 0;
      if (times.length >= 2) { st = times[0]; et = times[1]; }
      else if (times.length === 1) { st = times[0]; }

    }

    ROOM_RE.lastIndex = 0;
    const rooms = [...line.matchAll(ROOM_RE)].map(m => m[0]);
    ROOM_RE.lastIndex = 0;

    SECTION_RE.lastIndex = 0;
    const secFb = SECTION_RE.exec(line);
    SECTION_RE.lastIndex = 0;
    TYPE_RE_DETECT.lastIndex = 0;
    const typeFb = TYPE_RE_DETECT.exec(line);
    TYPE_RE_DETECT.lastIndex = 0;

    codes.forEach(code => {
      console.log(`[OCR] TextFallback: code=${code} day=${currentDay||"unknown"} time=${st||"?"}-${et||"?"}`);
      courses.push({
        id: Date.now() + Math.random(),
        name: code,
        day: currentDay || null,
        startTime: st,
        endTime: et,
        room: rooms[0] || "",
        instructor: "",
        section: secFb ? secFb[1] : "",
        type: typeFb ? (TYPE_MAP[typeFb[1].toLowerCase()] || "") : "",
        emoji: "📚",
        confidence: 45,
        needsReview: true,
      });
    });
  }
  return courses;
}

function parseOCRResult(ocrData, imgW, imgH) {
  const words = (ocrData.words || []).filter(w => w.text?.trim().length > 0);
  const rawText = ocrData.text || "";
  const avgConf = words.length ? words.reduce((a, w) => a + w.confidence, 0) / words.length : 0;

  console.log(`[OCR] Image: ${imgW}x${imgH}  words: ${words.length}  avgConf: ${Math.round(avgConf)}`);

  let courses = null, gridDetected = false;

  const dayColumns = findDayColumns(words, imgW, imgH);
  if (Object.keys(dayColumns).length >= 2) {
    const colBounds = buildColBounds(dayColumns, imgW);
    const headerBottom = Math.max(...Object.values(dayColumns).map(d => d.bottom)) + 20;
    const timeRows = findTimeRows(words, imgW, imgH, headerBottom);
    const blocks = clusterWordsIntoBlocks(words, colBounds, imgH, headerBottom);
    courses = extractCoursesFromBlocks(blocks, timeRows, imgH);
    if (courses?.length > 0) gridDetected = true;
  }

  if (!courses || courses.length === 0) {
    console.log("[OCR] Falling back to text-line parser");
    courses = textFallbackParse(rawText);
  }

  if (!courses || courses.length === 0) {
    console.log("[OCR] Last resort: scanning raw text for course codes (day/time unknown)");
    COURSE_CODE_RE.lastIndex = 0;
    const allMatches = [...rawText.matchAll(COURSE_CODE_RE)];
    COURSE_CODE_RE.lastIndex = 0;
    const seen = new Set();
    allMatches.forEach(m => {
      const code = `${correctDeptCode(m[1])} ${correctNumCode(m[2])}`;
      if (!seen.has(code)) {
        seen.add(code);
        courses = courses || [];

        courses.push({
          id: Date.now() + Math.random(),
          name: code,
          day: null,
          startTime: null,
          endTime: null,
          room: "",
          instructor: "",
          emoji: "📚",
          confidence: 30,
          needsReview: true,
        });
      }
    });
  }

  let finalConf = Math.round(avgConf);
  if (!gridDetected) finalConf = Math.round(finalConf * 0.80);
  const hasLowConf = courses?.some(c => c.confidence < 55);
  if (hasLowConf) finalConf = Math.min(finalConf, 65);
  if (!courses || courses.length === 0) finalConf = 0;

  const needsReviewCount = (courses || []).filter(c => c.needsReview).length;
  console.log(`[OCR] Result: ${courses?.length || 0} courses, gridDetected=${gridDetected}, finalConf=${finalConf}, needsReview=${needsReviewCount}`);

  return {
    courses: courses || [],
    confidence: finalConf,
    gridDetected,
    warning: finalConf < 70 || needsReviewCount > 0,
    needsReviewCount,
    rawText,
  };
}


export default function ScheduleImportLab() {
  const appTheme = localStorage.getItem("sc-theme")||"light";
  const dark = appTheme==="dark";
  const navigate = useNavigate();

  const [step,setStep]=useState(1);
  const [toast,setToast]=useState("");
  const [isSaving,setIsSaving]=useState(false);
  const [isExporting,setIsExporting]=useState(false);
  const [saveConfirm,setSaveConfirm]=useState(false);
  const previewRef=useRef(null);

  const [imageFile,setImageFile]=useState(null);
  const [imageUrl,setImageUrl]=useState(null);
  const [isDragging,setIsDragging]=useState(false);

  const [isProcessing,setIsProcessing]=useState(false);
  const [ocrStatus,setOcrStatus]=useState("");
  const [ocrProgress,setOcrProgress]=useState(0);
  const [ocrConfidence,setOcrConfidence]=useState(null);
  const [gridDetected,setGridDetected]=useState(false);
  const [lowConfWarning,setLowConfWarning]=useState(false);
  const tWorker=useRef(null);

  const [courses,setCourses]=useState([]);
  const [editId,setEditId]=useState(null);
  const [editData,setEditData]=useState({});
  const [emojiFor,setEmojiFor]=useState(null);
  const [addingNew,setAddingNew]=useState(false);
  const [newCourse,setNewCourse]=useState({name:"",day:"Sunday",startTime:"08:00",endTime:"09:30",room:"",instructor:"",emoji:"📚"});

  const [design,setDesign]=useState({...DEFAULT_DESIGN});

  const [openSec,setOpenSec]=useState(()=>
    window.innerWidth<768 ? new Set(["theme"]) : new Set(["theme","display","card","colors","bg","show"])
  );

  const fileRef=useRef();
  const showToast=(m)=>{setToast(m);setTimeout(()=>setToast(""),3000);};
  const setD=(k,v)=>setDesign(d=>({...d,[k]:v}));
  const toggleSec=(id)=>setOpenSec(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});

  useEffect(()=>()=>{if(tWorker.current)tWorker.current.terminate();},[]);

  const handleFile=useCallback((file)=>{
    if(!file?.type.startsWith("image/")){showToast("⚠️ Please upload an image file (PNG, JPG, HEIC…)");return;}
    if(imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  },[imageUrl]);

  const onDrop=useCallback((e)=>{e.preventDefault();setIsDragging(false);handleFile(e.dataTransfer.files[0]);},[handleFile]);

  const startOCR=async()=>{
    if(!imageUrl||!imageFile){showToast("⚠️ Please upload an image first");return;}
    setIsProcessing(true);setOcrProgress(0);setOcrStatus("Loading image…");

    try{

      const img=new Image();
      img.src=imageUrl;
      await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error("Image load failed"));});

      setOcrStatus("Preprocessing image (grayscale · contrast · sharpen · deskew)…");
      await tick();
      const canvas=preprocessForOCR(img);

      setOcrStatus("Loading OCR engine (first run downloads ~15 MB)…");
      await tick();

      const worker=await createWorker("eng+ara", 1, {
        logger:(m)=>{
          if(m.status==="recognizing text"){
            const p=Math.round((m.progress||0)*100);
            setOcrProgress(p);
            setOcrStatus(`Recognizing text… ${p}%`);
          } else if(m.status==="loading tesseract core"){
            setOcrStatus("Loading Tesseract core…");
          } else if(m.status==="initializing tesseract"){
            setOcrStatus("Initializing OCR engine…");
          } else if(m.status==="loading language traineddata"){
            setOcrStatus("Downloading language data (eng + ara)…");
          } else if(m.status==="initialized api"){
            setOcrStatus("OCR engine ready · starting recognition…");
          }
        }
      });
      tWorker.current=worker;

      await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT,preserve_interword_spaces:"1"});

      setOcrStatus("Recognizing text in schedule…");
      const {data}=await worker.recognize(canvas);
      await worker.terminate();
      tWorker.current=null;

      setOcrStatus("Analyzing schedule grid structure…");
      await tick();

      const result=parseOCRResult(data,canvas.width,canvas.height);
      setCourses(result.courses.map(c=>({...c,id:Date.now()+Math.random()})));
      setOcrConfidence(result.confidence);
      setGridDetected(result.gridDetected);
      setLowConfWarning(result.warning);
      setIsProcessing(false);
      setStep(2);

      if(result.courses.length===0){
        showToast("⚠️ No courses detected. Try a clearer image or add manually.");
      } else if(result.needsReviewCount>0){
        showToast(`⚠️ ${result.courses.length} courses extracted — ${result.needsReviewCount} need review.`);
      } else {
        showToast(`✅ ${result.courses.length} courses extracted!${result.gridDetected?" Grid detected.":""}`);
      }
    } catch(err){
      console.error("OCR error:",err);
      setIsProcessing(false);
      if(tWorker.current){tWorker.current.terminate();tWorker.current=null;}
      setOcrStatus("");
      const msg=err?.message||"";
      if(msg.includes("fetch")||msg.includes("network")||msg.includes("load")){
        showToast("❌ Could not load OCR engine — check internet connection (needed for first run)");
      } else {
        showToast("❌ OCR failed — try a clearer image or use Demo Data");
      }
    }
  };

  const tick=()=>new Promise(r=>setTimeout(r,40));


  const loadDemo=()=>{
    setCourses(DEMO_DATA.map(c=>({...c,id:Date.now()+Math.random()})));
    setOcrConfidence(99);setGridDetected(true);setLowConfWarning(false);
    setStep(2);showToast("📋 Demo schedule loaded!");
  };

  const saveEdit=()=>{
    if(!editData.name?.trim()){showToast("⚠️ Course name required");return;}
    if(!editData.day){showToast("⚠️ Please select a day before saving");return;}
    if(!editData.startTime){showToast("⚠️ Please select a start time before saving");return;}

    const reviewed={...editData,needsReview:false};
    setCourses(cs=>cs.map(c=>c.id===editId?reviewed:c));
    setEditId(null);setEditData({});setEmojiFor(null);
  };
  const deleteCourse=(id)=>{setCourses(cs=>cs.filter(c=>c.id!==id));showToast("🗑 Removed");};
  const addCourse=()=>{
    if(!newCourse.name.trim()){showToast("⚠️ Course name required");return;}
    setCourses(cs=>[...cs,{...newCourse,id:Date.now()+Math.random(),confidence:99}]);
    setNewCourse({name:"",day:"Sunday",startTime:"08:00",endTime:"09:30",room:"",instructor:"",emoji:"📚"});
    setAddingNew(false);showToast("✅ Course added");
  };

  const saveAsDraft=async()=>{
    const draft={courses,design,savedAt:new Date().toISOString()};
    localStorage.setItem("sil_draft_v1",JSON.stringify(draft));
    showToast("💾 Draft saved!");
    try{await api.post("/schedule-draft",{draftJson:JSON.stringify(draft)});}catch{}
  };

  const saveAsMySchedule=async()=>{
    setSaveConfirm(false);

    const bad=courses.filter(c=>!c.day||!c.startTime||!c.endTime||!c.name?.trim());
    if(bad.length>0){
      showToast(`❌ ${bad.length} course(s) still missing day or time — review before saving`);
      return;
    }
    setIsSaving(true);
    showToast("⏳ Saving schedule…");
    try{

      const existing=await api.get("/schedule");
      const entries=existing.data||[];

      await Promise.all(entries.map(e=>api.delete(`/schedule/${e.id}`)));

      for(const c of courses){
        const accent=getAccent(c,design);
        await api.post("/schedule",{
          courseName:c.name,
          dayOfWeek:c.day,
          startTime:c.startTime,
          endTime:c.endTime,
          room:c.room||"",
          color:accent,
        });
      }

      const colorsByName = {};
      if (design.colorStyle === "custom") {
        courses.forEach(c => { if (design.courseColors[c.id]) colorsByName[c.name] = design.courseColors[c.id]; });
      }
      const designToSave = {...design, courseColorsByName: colorsByName};
      localStorage.setItem("sil_design_v1", JSON.stringify(designToSave));
      try { await api.post("/schedule-design", { designJson: JSON.stringify(designToSave) }); } catch {}
      setIsSaving(false);
      showToast("✅ Schedule saved! Redirecting…");
      setTimeout(()=>navigate("/schedule"),1200);
    }catch(err){
      setIsSaving(false);
      const msg=err?.response?.data?.message||err?.message||"Unknown error";
      if(err?.response?.status===401){
        showToast("❌ Not logged in — please sign in first");
      } else {
        showToast(`❌ Save failed: ${msg}`);
      }
    }
  };

  const captureCanvas=async(bgColor=null)=>{
    if(!previewRef.current) throw new Error("Preview not mounted");
    const dpr=window.devicePixelRatio||1;
    const scale=Math.min(Math.max(dpr,2),3);
    return html2canvas(previewRef.current,{
      scale,
      useCORS:true,
      backgroundColor:bgColor,
      logging:false,
      width:EXPORT_W,
      windowWidth:EXPORT_W,
      onclone:(_,el)=>{
        el.style.width=EXPORT_W+"px";
        el.style.maxWidth=EXPORT_W+"px";
        el.style.overflow="visible";
        el.querySelectorAll("*").forEach(child=>{
          const cs=child.style;
          if(cs.overflowX==="auto"||cs.overflow==="auto"){
            cs.overflowX="visible";
            cs.overflow="visible";
          }
          const mw=parseFloat(cs.minWidth);
          if(!isNaN(mw)&&mw>0) cs.minWidth=Math.max(mw,EXPORT_W-60)+"px";
        });
      },
    });
  };

  const exportPNG=async()=>{
    if(!previewRef.current){showToast("⚠️ Preview not ready");return;}
    setIsExporting(true);
    showToast("📸 Generating PNG…");
    try{
      const canvas=await captureCanvas(null);
      const link=document.createElement("a");
      link.download="smart-campus-schedule.png";
      link.href=canvas.toDataURL("image/png");
      link.click();
      showToast("✅ PNG downloaded!");
    }catch(err){
      showToast("❌ PNG export failed");
      console.error(err);
    }finally{
      setIsExporting(false);
    }
  };

  const exportPDF=async()=>{
    if(!previewRef.current){showToast("⚠️ Preview not ready");return;}
    setIsExporting(true);
    showToast("📄 Generating PDF…");
    try{
      const canvas=await captureCanvas("#ffffff");
      const imgData=canvas.toDataURL("image/png");

      const pdfW=EXPORT_W;
      const pdfH=Math.round((canvas.height/canvas.width)*pdfW);
      const pdf=new jsPDF({
        orientation:pdfW>pdfH?"landscape":"portrait",
        unit:"px",
        format:[pdfW,pdfH],
        hotfixes:["px_scaling"],
      });
      pdf.addImage(imgData,"PNG",0,0,pdfW,pdfH);
      pdf.save("smart-campus-schedule.pdf");
      showToast("✅ PDF downloaded!");
    }catch(err){
      showToast("❌ PDF export failed");
      console.error(err);
    }finally{
      setIsExporting(false);
    }
  };

  const shareImage=async()=>{
    if(!previewRef.current){showToast("⚠️ Preview not ready");return;}
    setIsExporting(true);
    showToast("📸 Preparing image…");
    try{
      const canvas=await captureCanvas(null);
      canvas.toBlob(async(blob)=>{
        if(!blob){showToast("❌ Failed to generate image");setIsExporting(false);return;}
        const file=new File([blob],"smart-campus-schedule.png",{type:"image/png"});
        if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
          try{
            await navigator.share({files:[file],title:"My Schedule — Smart Campus"});
            showToast("✅ Shared!");
          }catch(e){
            if(e.name!=="AbortError"){

              const url=URL.createObjectURL(blob);
              const a=document.createElement("a");
              a.href=url;a.download="smart-campus-schedule.png";a.click();
              setTimeout(()=>URL.revokeObjectURL(url),1000);
              showToast("✅ Image saved!");
            }
          }
        } else {

          const url=URL.createObjectURL(blob);
          const a=document.createElement("a");
          a.href=url;a.download="smart-campus-schedule.png";a.click();
          setTimeout(()=>URL.revokeObjectURL(url),1000);
          showToast("✅ Image saved!");
        }
        setIsExporting(false);
      },"image/png");
    }catch(err){
      showToast("❌ Export failed");
      console.error(err);
      setIsExporting(false);
    }
  };

  useEffect(()=>{
    (async()=>{
      try{
        const r=await api.get("/schedule-draft");
        if(r.status===200&&r.data?.draftJson){
          const{courses:c,design:des}=JSON.parse(r.data.draftJson);
          if(c?.length){setCourses(c);if(des)setDesign({...DEFAULT_DESIGN,...des});}
          return;
        }
      }catch{}
      try{
        const d=localStorage.getItem("sil_draft_v1");
        if(d){const{courses:c,design:des}=JSON.parse(d);if(c?.length){setCourses(c);if(des)setDesign({...DEFAULT_DESIGN,...des});}}
      }catch{}
    })();
  },[]);

  const css=`
    [data-sil="${appTheme}"] {
      --sl-bg:${dark?"#060b14":"#f4f6fb"};
      --sl-card:${dark?"#0c1322":"#ffffff"};
      --sl-muted:${dark?"#101a2e":"#f1f5f9"};
      --sl-muted2:${dark?"#152036":"#e8edf5"};
      --sl-border:${dark?"rgba(255,255,255,0.08)":"#e2e8f0"};
      --sl-text:${dark?"#eef2f8":"#0a0f1e"};
      --sl-text2:${dark?"#8599b8":"#3d4f6e"};
      --sl-text3:${dark?"#4e6380":"#8596b0"};
      --sl-shadow:${dark?"0 2px 8px rgba(0,0,0,0.3)":"0 1px 4px rgba(10,15,30,0.05),0 2px 12px rgba(10,15,30,0.04)"};
      --sl-shadowlg:${dark?"0 6px 28px rgba(0,0,0,0.45)":"0 4px 24px rgba(10,15,30,0.10)"};
    }
    [data-sil] *{box-sizing:border-box;}
    [data-sil]{font-family:'Inter','DM Sans',system-ui,sans-serif;overflow-x:hidden;}

    /* Brand banner */
    .sil-banner{background:linear-gradient(90deg,#1d4ed8,#4338ca,#6d28d9);color:#ffffff;font-size:10px;font-weight:700;letter-spacing:0.07em;text-align:center;padding:6px 16px;position:sticky;top:0;z-index:100;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;}

    /* Step dots */
    .sil-dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;transition:all 0.25s;}
    .sil-dot.done{background:linear-gradient(135deg,#4f6ef7,#7c3aed);color:white;box-shadow:0 4px 12px rgba(79,110,247,0.35);}
    .sil-dot.active{background:linear-gradient(135deg,#4f6ef7,#7c3aed);color:white;box-shadow:0 0 0 4px rgba(79,110,247,0.2),0 4px 14px rgba(79,110,247,0.35);}
    .sil-dot.idle{background:var(--sl-muted2);color:var(--sl-text3);}
    .sil-line{flex:1;height:2px;background:var(--sl-muted2);}
    .sil-line.done{background:linear-gradient(90deg,#4f6ef7,#7c3aed);}

    /* Drop zone */
    .sil-drop{border:2.5px dashed var(--sl-border);border-radius:20px;padding:44px 20px;text-align:center;cursor:pointer;transition:all 0.2s;background:var(--sl-muted);position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent;}
    .sil-drop:hover,.sil-drop.drag{border-color:#4f6ef7;background:rgba(79,110,247,0.07);transform:scale(1.01);}
    .sil-drop.has-img{padding:0;border-style:solid;border-color:#4f6ef7;cursor:default;}

    /* Buttons */
    .sil-btn{padding:10px 20px;border-radius:11px;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;display:inline-flex;align-items:center;gap:7px;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
    .sil-btn:active{transform:scale(0.97);}
    .sil-btn:disabled{opacity:0.45;cursor:not-allowed;transform:none!important;}
    .sil-btn-primary{background:linear-gradient(135deg,#4f6ef7,#7c3aed);color:white;box-shadow:0 4px 14px rgba(79,110,247,0.3);}
    .sil-btn-primary:hover:not(:disabled){filter:brightness(1.08);box-shadow:0 6px 22px rgba(79,110,247,0.42);}
    .sil-btn-secondary{background:var(--sl-muted);color:var(--sl-text2);border:1.5px solid var(--sl-border);}
    .sil-btn-secondary:hover:not(:disabled){background:var(--sl-muted2);color:var(--sl-text);}
    .sil-btn-ghost{background:transparent;color:var(--sl-text2);border:1.5px solid var(--sl-border);}
    .sil-btn-ghost:hover:not(:disabled){background:var(--sl-muted);color:var(--sl-text);}
    .sil-btn-danger{background:rgba(239,68,68,0.1);color:#ef4444;border:1.5px solid rgba(239,68,68,0.22);}
    .sil-btn-danger:hover:not(:disabled){background:rgba(239,68,68,0.18);}
    .sil-btn-sm{padding:7px 13px;font-size:12px;border-radius:9px;}
    .sil-btn-xs{padding:5px 10px;font-size:11px;border-radius:7px;}

    /* Inputs */
    .sil-input{width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--sl-border);background:var(--sl-muted);color:var(--sl-text);font-size:13px;font-family:inherit;transition:all 0.15s;}
    .sil-input:focus{outline:none;border-color:#4f6ef7;background:var(--sl-card);box-shadow:0 0 0 3px rgba(79,110,247,0.14);}
    .sil-select{appearance:none;cursor:pointer;}

    /* Chip */
    .sil-chip{padding:8px 13px;border-radius:10px;border:1.5px solid var(--sl-border);background:var(--sl-muted);color:var(--sl-text2);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;text-align:center;user-select:none;-webkit-tap-highlight-color:transparent;}
    .sil-chip:hover{border-color:#4f6ef7;color:var(--sl-text);}
    .sil-chip.on{background:linear-gradient(135deg,rgba(79,110,247,0.12),rgba(124,58,237,0.10));border-color:#4f6ef7;color:#4f6ef7;}

    /* Theme card */
    .sil-tc{border:2px solid var(--sl-border);border-radius:12px;cursor:pointer;overflow:hidden;transition:all 0.2s;display:flex;align-items:center;gap:10px;padding:9px 11px;-webkit-tap-highlight-color:transparent;}
    .sil-tc:hover{border-color:#4f6ef7;transform:translateY(-1px);box-shadow:var(--sl-shadowlg);}
    .sil-tc.on{border-color:#4f6ef7;box-shadow:0 0 0 3px rgba(79,110,247,0.18),var(--sl-shadowlg);}

    /* Card style option */
    .sil-co{padding:9px 10px;border-radius:10px;border:1.5px solid var(--sl-border);background:var(--sl-muted);cursor:pointer;transition:all 0.15s;text-align:center;}
    .sil-co:hover{border-color:#4f6ef7;}
    .sil-co.on{border-color:#4f6ef7;background:rgba(79,110,247,0.08);}

    /* Swatch */
    .sil-sw{width:36px;height:36px;border-radius:9px;cursor:pointer;border:2.5px solid transparent;transition:all 0.15s;flex-shrink:0;}
    .sil-sw:hover{transform:scale(1.12);}
    .sil-sw.on{border-color:white;box-shadow:0 0 0 2.5px #4f6ef7;}

    /* Toggle */
    .sil-tog{display:flex;align-items:center;gap:9px;cursor:pointer;-webkit-tap-highlight-color:transparent;}
    .sil-tog-track{width:38px;height:21px;border-radius:999px;transition:background 0.2s;display:flex;align-items:center;padding:0 3px;flex-shrink:0;}
    .sil-tog-thumb{width:15px;height:15px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,0.25);transition:transform 0.2s;}

    /* Accordion */
    .sil-acc-hdr{width:100%;padding:13px 16px;border:none;background:none;display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent;}
    .sil-acc-arr{transition:transform 0.2s;color:var(--sl-text3);font-size:12px;}

    /* Course row */
    .sil-cr{background:var(--sl-card);border:1.5px solid var(--sl-border);border-radius:13px;transition:all 0.15s;}
    .sil-cr:hover{border-color:rgba(79,110,247,0.3);box-shadow:var(--sl-shadow);}

    /* Emoji button */
    .sil-em{width:34px;height:34px;border:none;background:var(--sl-muted);border-radius:8px;font-size:17px;cursor:pointer;transition:all 0.12s;-webkit-tap-highlight-color:transparent;}
    .sil-em:hover{background:var(--sl-muted2);transform:scale(1.15);}

    /* Confidence badge */
    .sil-conf-high{background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.25);padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;}
    .sil-conf-med{background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid rgba(245,158,11,0.25);padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;}
    .sil-conf-low{background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;}

    /* Progress bar */
    @keyframes sil-slide{from{transform:translateX(-100%)}to{transform:translateX(0)}}
    .sil-prog-bar{height:4px;border-radius:999px;background:linear-gradient(90deg,#4f6ef7,#7c3aed);transition:width 0.4s ease;}

    /* Animations */
    @keyframes sil-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
    @keyframes sil-spin{to{transform:rotate(360deg)}}
    .sil-fu{animation:sil-up 0.3s ease;}
    .sil-spin{animation:sil-spin 1s linear infinite;display:inline-block;}

    /* Toast */
    .sil-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${dark?"#1e293b":"#0f172a"};color:white;padding:12px 24px;border-radius:999px;font-size:13px;font-weight:700;box-shadow:0 12px 36px rgba(0,0,0,0.25);z-index:9999;white-space:nowrap;font-family:inherit;animation:sil-up 0.25s ease;border:1px solid ${dark?"rgba(255,255,255,0.08)":"transparent"};}

    /* Section label */
    .sil-lbl{font-size:10px;font-weight:700;color:var(--sl-text3);text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:8px;}

    /* Warning banner */
    .sil-warn{background:rgba(245,158,11,0.1);border:1.5px solid rgba(245,158,11,0.3);border-radius:12px;padding:12px 16px;margin-bottom:16px;}

    /* ── Mobile ─────────────────────────────────────────── */
    @media(max-width:768px){
      .sil-design-layout{flex-direction:column!important;}
      .sil-design-panel{width:100%!important;max-height:none!important;overflow-y:visible!important;position:static!important;}
      .sil-preview-wrap{position:static!important;}
      .sil-step-lbl{display:none!important;}
      .sil-drop{padding:30px 16px!important;}
      .sil-stats-row{grid-template-columns:repeat(3,1fr)!important;}
      .sil-form3{grid-template-columns:1fr 1fr!important;}
      .sil-nav-footer{flex-direction:column!important;gap:8px!important;}
      .sil-nav-footer .sil-btn{width:100%;justify-content:center;}
      .sil-header-row{flex-direction:column!important;align-items:flex-start!important;}
      .sil-header-row .sil-btn-row{width:100%;display:flex;flex-wrap:wrap;gap:8px;}
      .sil-header-row .sil-btn-row .sil-btn{flex:1;justify-content:center;}
    }
    @media(max-width:480px){
      .sil-form3{grid-template-columns:1fr!important;}
      .sil-dot{width:26px!important;height:26px!important;font-size:10px!important;}
      .sil-outer-pad{padding:16px 12px 48px!important;}
      .sil-card-pad{padding:16px!important;}
      .sil-title{font-size:20px!important;}
    }
    @media(max-width:380px){
      .sil-sw{width:30px!important;height:30px!important;}
    }
  `;

  const Tog=({on,onChange,label})=>(
    <div className="sil-tog" onClick={()=>onChange(!on)}>
      <div className="sil-tog-track" style={{background:on?"#4f6ef7":"var(--sl-muted2)"}}>
        <div className="sil-tog-thumb" style={{transform:on?"translateX(17px)":"none"}}/>
      </div>
      <span style={{fontSize:"13px",color:"var(--sl-text2)",userSelect:"none"}}>{label}</span>
    </div>
  );

  const Acc=({id,title,children})=>{
    const open=openSec.has(id);
    return(
      <div style={{background:"var(--sl-card)",border:"1.5px solid var(--sl-border)",borderRadius:14,overflow:"hidden",marginBottom:10,boxShadow:"var(--sl-shadow)"}}>
        <button className="sil-acc-hdr" onClick={()=>toggleSec(id)}>
          <span style={{fontSize:"11px",fontWeight:"700",color:"var(--sl-text2)",textTransform:"uppercase",letterSpacing:"0.07em"}}>{title}</span>
          <span className="sil-acc-arr" style={{transform:open?"rotate(180deg)":"none"}}>▼</span>
        </button>
        {open&&<div style={{padding:"0 16px 14px"}}>{children}</div>}
      </div>
    );
  };

  const ConfBadge=({conf})=>{
    if(conf==null)return null;
    const cls=conf>=80?"sil-conf-high":conf>=60?"sil-conf-med":"sil-conf-low";
    const label=conf>=80?"High confidence":conf>=60?"Medium confidence":"Low confidence";
    return<span className={cls}>{label} {conf}%</span>;
  };

  const CourseRow=({course})=>{
    const editing=editId===course.id;
    const acc=getAccent(course,design);
    const confCls=course.confidence>=80?"sil-conf-high":course.confidence>=60?"sil-conf-med":"sil-conf-low";

    if(editing){
      return(
        <div className="sil-cr sil-fu" style={{padding:"14px",borderColor:"rgba(79,110,247,0.4)",boxShadow:"0 0 0 3px rgba(79,110,247,0.1)"}}>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"10px",alignItems:"start",marginBottom:"10px"}}>
            <button className="sil-em" style={{width:42,height:42,fontSize:20,borderRadius:10,border:"1.5px solid var(--sl-border)",background:"var(--sl-muted)"}} onClick={()=>setEmojiFor(emojiFor===course.id?null:course.id)}>{editData.emoji||"📚"}</button>
            <input className="sil-input" value={editData.name||""} onChange={e=>setEditData(d=>({...d,name:e.target.value}))} placeholder="Course code / name"/>
          </div>
          {emojiFor===course.id&&(
            <div style={{background:"var(--sl-muted)",borderRadius:11,padding:"9px",marginBottom:"10px",display:"flex",flexWrap:"wrap",gap:"3px",border:"1.5px solid var(--sl-border)"}}>
              {EMOJIS.map(em=><button key={em} className="sil-em" onClick={()=>{setEditData(d=>({...d,emoji:em}));setEmojiFor(null);}}>{em}</button>)}
            </div>
          )}
          <div className="sil-form3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"7px",marginBottom:"9px"}}>
            <div>
              <label className="sil-lbl">Day{!editData.day&&<span style={{color:"#ef4444",marginLeft:4}}>*required</span>}</label>
              <select className="sil-input sil-select" value={editData.day||""} onChange={e=>setEditData(d=>({...d,day:e.target.value||null}))} style={!editData.day?{borderColor:"rgba(245,158,11,0.6)"}:{}}>
                <option value="">— Select Day —</option>
                {DAYS.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="sil-lbl">Start{!editData.startTime&&<span style={{color:"#ef4444",marginLeft:4}}>*</span>}</label>
              <select className="sil-input sil-select" value={editData.startTime||""} onChange={e=>setEditData(d=>({...d,startTime:e.target.value||null}))} style={!editData.startTime?{borderColor:"rgba(245,158,11,0.6)"}:{}}>
                <option value="">— Pick —</option>
                {TIME_OPTS.map(t=><option key={t} value={t}>{fmtTime(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="sil-lbl">End</label>
              <select className="sil-input sil-select" value={editData.endTime||""} onChange={e=>setEditData(d=>({...d,endTime:e.target.value||null}))}>
                <option value="">— Pick —</option>
                {TIME_OPTS.map(t=><option key={t} value={t}>{fmtTime(t)}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginBottom:"7px"}}>
            <input className="sil-input" value={editData.room||""} onChange={e=>setEditData(d=>({...d,room:e.target.value}))} placeholder="Room (e.g. G101)"/>
            <input className="sil-input" value={editData.instructor||""} onChange={e=>setEditData(d=>({...d,instructor:e.target.value}))} placeholder="Instructor"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginBottom:"10px"}}>
            <input className="sil-input" value={editData.section||""} onChange={e=>setEditData(d=>({...d,section:e.target.value}))} placeholder="Section (e.g. 001)"/>
            <select className="sil-input sil-select" value={editData.type||""} onChange={e=>setEditData(d=>({...d,type:e.target.value}))}>
              <option value="">Type (optional)</option>
              <option value="Lecture">Lecture</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Tutorial">Tutorial</option>
            </select>
          </div>
          <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
            <button className="sil-btn sil-btn-primary sil-btn-sm" onClick={saveEdit}>✓ Save</button>
            <button className="sil-btn sil-btn-ghost sil-btn-sm" onClick={()=>{setEditId(null);setEditData({});setEmojiFor(null);}}>Cancel</button>
            <button className="sil-btn sil-btn-danger sil-btn-sm" style={{marginLeft:"auto"}} onClick={()=>deleteCourse(course.id)}>🗑 Remove</button>
          </div>
        </div>
      );
    }

    return(
      <div className="sil-cr" style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:"10px",borderColor:course.needsReview?"rgba(245,158,11,0.45)":"var(--sl-border)",background:course.needsReview?"rgba(245,158,11,0.03)":"var(--sl-card)"}}>
        <div style={{width:9,height:9,borderRadius:"50%",background:acc,flexShrink:0}}/>
        <span style={{fontSize:"15px",flexShrink:0}}>{course.emoji}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:"700",fontSize:"13px",color:"var(--sl-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {course.name}{course.section?<span style={{fontWeight:"400",fontSize:"11px",color:"var(--sl-text3)",marginLeft:5}}>§{course.section}</span>:null}
            {course.type?<span style={{fontWeight:"500",fontSize:"10px",color:"var(--sl-text3)",marginLeft:6,background:"var(--sl-muted2)",padding:"1px 5px",borderRadius:4}}>{course.type}</span>:null}
          </div>
          <div style={{fontSize:"11px",color:"var(--sl-text3)",marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {course.day ? (DAY_SHORT[course.day]||course.day) : <span style={{color:"#f59e0b",fontWeight:"700"}}>Day?</span>}
            {" · "}
            {course.startTime ? fmtTime(course.startTime) : <span style={{color:"#f59e0b",fontWeight:"700"}}>Time?</span>}
            {"–"}
            {course.endTime ? fmtTime(course.endTime) : <span style={{color:"#f59e0b",fontWeight:"700"}}>?</span>}
            {course.room?` · ${course.room}`:""}
          </div>
        </div>
        {course.needsReview&&(
          <span style={{flexShrink:0,background:"rgba(245,158,11,0.12)",color:"#92400e",border:"1px solid rgba(245,158,11,0.35)",padding:"2px 8px",borderRadius:"999px",fontSize:"10px",fontWeight:"700",whiteSpace:"nowrap"}}>
            ⚠️ Review
          </span>
        )}
        {!course.needsReview&&course.confidence<70&&<span className={confCls} style={{flexShrink:0,fontSize:"10px"}}>{course.confidence}%</span>}
        <button className="sil-btn sil-btn-ghost sil-btn-xs" style={{flexShrink:0,borderColor:course.needsReview?"rgba(245,158,11,0.5)":undefined,color:course.needsReview?"#92400e":undefined}} onClick={()=>{setEditId(course.id);setEditData({...course});}}>Edit</button>
      </div>
    );
  };

  const Step1=()=>(
    <div className="sil-fu">
      <div style={{maxWidth:560,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"24px"}}>
          <div style={{fontSize:"44px",marginBottom:"10px",lineHeight:1}}>📸</div>
          <h2 style={{fontSize:"22px",fontWeight:"800",color:"var(--sl-text)",margin:"0 0 6px",letterSpacing:"-0.4px"}}>Upload Your Schedule Image</h2>
          <p style={{color:"var(--sl-text3)",fontSize:"13px",margin:0,lineHeight:1.6}}>Drop a photo or screenshot of your university timetable.</p>
        </div>

        <div style={{background:"var(--sl-muted)",border:"1.5px solid var(--sl-border)",borderRadius:13,padding:"13px 15px",marginBottom:"18px",display:"flex",alignItems:"flex-start",gap:"11px"}}>
          <span style={{fontSize:"22px",flexShrink:0,lineHeight:1,marginTop:2}}>🔤</span>
          <div>
            <div style={{fontWeight:"700",fontSize:"13px",color:"var(--sl-text)",marginBottom:3}}>Smart Local OCR</div>
            <p style={{fontSize:"11px",color:"var(--sl-text3)",margin:0,lineHeight:1.5}}>Processes your schedule image locally using bilingual OCR (English + Arabic). Detects grid layout, day columns, and time rows automatically. Works offline after first run — downloads ~15 MB language data once.</p>
          </div>
        </div>

        <div
          className={`sil-drop${isDragging?" drag":""}${imageUrl?" has-img":""}`}
          onClick={()=>!imageUrl&&fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e=>{e.preventDefault();setIsDragging(true);}}
          onDragLeave={()=>setIsDragging(false)}
        >
          {imageUrl?(
            <div style={{position:"relative"}}>
              <img src={imageUrl} alt="Schedule preview" style={{width:"100%",maxHeight:"340px",objectFit:"contain",borderRadius:18,display:"block"}}/>
              <button className="sil-btn sil-btn-danger sil-btn-sm" style={{position:"absolute",top:10,right:10}}
                onClick={e=>{e.stopPropagation();URL.revokeObjectURL(imageUrl);setImageUrl(null);setImageFile(null);}}>✕ Remove</button>
            </div>
          ):(
            <div style={{pointerEvents:"none"}}>
              <div style={{width:60,height:60,borderRadius:16,background:"linear-gradient(135deg,#4f6ef7,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",boxShadow:"0 8px 24px rgba(79,110,247,0.3)"}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:26,height:26}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <p style={{fontWeight:"700",fontSize:"15px",color:"var(--sl-text)",margin:"0 0 5px"}}>Drop schedule image here</p>
              <p style={{color:"var(--sl-text3)",fontSize:"12px",margin:"0 0 14px"}}>or click to browse · PNG · JPG · HEIC · Screenshot</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>

        <div style={{display:"flex",gap:"10px",marginTop:"16px",flexWrap:"wrap"}}>
          <button className="sil-btn sil-btn-primary" style={{flex:1,justifyContent:"center",minWidth:150}}
            disabled={!imageUrl||isProcessing} onClick={startOCR}>
            {isProcessing
              ? <><span className="sil-spin" style={{width:15,height:15,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"white",borderRadius:"50%"}}/>Extracting…</>
              : <><span>🔤</span>Smart Local OCR Extract</>}
          </button>
          <button className="sil-btn sil-btn-secondary" disabled={isProcessing} onClick={loadDemo} style={{flexShrink:0}}>
            ✨ Demo Data
          </button>
        </div>

        {isProcessing&&(
          <div className="sil-fu" style={{marginTop:"18px",background:"var(--sl-muted)",borderRadius:14,padding:"16px 18px",border:"1.5px solid var(--sl-border)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
              <span style={{fontWeight:"700",color:"var(--sl-text)",fontSize:"13px"}}>Processing…</span>
              {ocrProgress>0&&<span style={{fontSize:"12px",color:"#4f6ef7",fontWeight:"700"}}>{ocrProgress}%</span>}
            </div>
            <div style={{background:"var(--sl-muted2)",borderRadius:"999px",height:4,marginBottom:"10px",overflow:"hidden"}}>
              <div className="sil-prog-bar" style={{width:`${ocrProgress||5}%`}}/>
            </div>
            <p style={{fontSize:"12px",color:"var(--sl-text2)",margin:"0 0 8px",fontWeight:"500"}}>{ocrStatus}</p>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              {["Preprocessing image (grayscale · contrast · sharpen · deskew)","Loading bilingual OCR (eng + ara)","Recognizing text in schedule cells","Detecting grid structure (rows × columns)","Extracting course codes, times, and rooms"].map((s,i)=>(
                <div key={i} style={{fontSize:"11px",color:"var(--sl-text3)",display:"flex",alignItems:"center",gap:"7px"}}>
                  <span style={{color:"#4f6ef7",fontWeight:"700"}}>◆</span>{s}
                </div>
              ))}
            </div>
            <p style={{fontSize:"10px",color:"var(--sl-text3)",marginTop:"10px",marginBottom:0,fontStyle:"italic"}}>First run requires internet to download ~15 MB language data (cached after)</p>
          </div>
        )}
      </div>
    </div>
  );

  const Step2=()=>{
    const reviewCount=courses.filter(c=>c.needsReview).length;
    return(
    <div className="sil-fu">
      <div className="sil-header-row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px",flexWrap:"wrap"}}>
            <h2 style={{fontSize:"19px",fontWeight:"800",color:"var(--sl-text)",margin:0}}>Review Extracted Courses</h2>
            {ocrConfidence!=null&&<ConfBadge conf={ocrConfidence}/>}
            {gridDetected&&<span style={{fontSize:"10px",background:"rgba(16,185,129,0.1)",color:"#10b981",padding:"2px 8px",borderRadius:"999px",border:"1px solid rgba(16,185,129,0.25)",fontWeight:"700"}}>Grid ✓</span>}
            {reviewCount>0&&<span style={{fontSize:"10px",background:"rgba(245,158,11,0.12)",color:"#92400e",padding:"2px 8px",borderRadius:"999px",border:"1px solid rgba(245,158,11,0.3)",fontWeight:"700"}}>⚠️ {reviewCount} need review</span>}
          </div>
          <p style={{color:"var(--sl-text3)",fontSize:"12px",margin:0}}>{courses.length} entries extracted · Edit each row before saving</p>
        </div>
        <div className="sil-btn-row" style={{display:"flex",gap:"8px",flexWrap:"wrap",flexShrink:0}}>
          <button className="sil-btn sil-btn-ghost sil-btn-sm" onClick={()=>setAddingNew(true)} disabled={addingNew}>+ Add</button>
          <button className="sil-btn sil-btn-primary sil-btn-sm" onClick={()=>setStep(3)} disabled={courses.length===0}>Design →</button>
        </div>
      </div>

      {reviewCount>0&&(
        <div className="sil-warn">
          <p style={{fontWeight:"700",fontSize:"13px",color:"#92400e",margin:"0 0 4px"}}>⚠️ {reviewCount} {reviewCount===1?"row needs":"rows need"} review before saving</p>
          <p style={{fontSize:"12px",color:"#78350f",margin:0}}>Rows marked ⚠️ have low OCR confidence or uncertain times/days. Tap "Edit" to correct them. Never save unreviewed data.</p>
        </div>
      )}

      <div className="sil-stats-row" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px",marginBottom:"16px"}}>
        {[
          {label:"Courses",val:[...new Set(courses.map(c=>c.name))].length,color:"#4f6ef7"},
          {label:"Days",val:[...new Set(courses.map(c=>c.day))].length,color:"#16a34a"},
          {label:"Entries",val:courses.length,color:"#9333ea"},
          {label:"Review",val:reviewCount,color:reviewCount>0?"#f59e0b":"#10b981"},
        ].map(s=>(
          <div key={s.label} style={{background:"var(--sl-card)",border:"1.5px solid var(--sl-border)",borderRadius:12,padding:"12px 14px",textAlign:"center",boxShadow:"var(--sl-shadow)"}}>
            <div style={{fontSize:"20px",fontWeight:"800",color:s.color}}>{s.val}</div>
            <div style={{fontSize:"10px",color:"var(--sl-text3)",marginTop:"2px"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {addingNew&&(
        <div className="sil-fu" style={{background:"var(--sl-card)",border:"1.5px solid rgba(79,110,247,0.4)",borderRadius:13,padding:"14px",marginBottom:"14px",boxShadow:"0 0 0 3px rgba(79,110,247,0.08)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
            <h4 style={{margin:0,fontSize:"13px",fontWeight:"700",color:"var(--sl-text)"}}>Add Course</h4>
            <button className="sil-btn sil-btn-ghost sil-btn-xs" onClick={()=>{setAddingNew(false);setEmojiFor(null);}}>✕</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"9px",alignItems:"start",marginBottom:"9px"}}>
            <button className="sil-em" style={{width:40,height:40,fontSize:20,borderRadius:10,border:"1.5px solid var(--sl-border)",background:"var(--sl-muted)"}} onClick={()=>setEmojiFor(emojiFor==="new"?null:"new")}>{newCourse.emoji}</button>
            <input className="sil-input" value={newCourse.name} onChange={e=>setNewCourse(d=>({...d,name:e.target.value}))} placeholder="Course code (e.g. CIS 422)"/>
          </div>
          {emojiFor==="new"&&<div style={{background:"var(--sl-muted)",borderRadius:10,padding:"9px",marginBottom:"9px",display:"flex",flexWrap:"wrap",gap:"3px",border:"1.5px solid var(--sl-border)"}}>{EMOJIS.map(em=><button key={em} className="sil-em" onClick={()=>{setNewCourse(d=>({...d,emoji:em}));setEmojiFor(null);}}>{em}</button>)}</div>}
          <div className="sil-form3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"7px",marginBottom:"9px"}}>
            <div><label className="sil-lbl">Day</label><select className="sil-input sil-select" value={newCourse.day} onChange={e=>setNewCourse(d=>({...d,day:e.target.value}))}>{DAYS.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label className="sil-lbl">Start</label><select className="sil-input sil-select" value={newCourse.startTime} onChange={e=>setNewCourse(d=>({...d,startTime:e.target.value}))}>{TIME_OPTS.map(t=><option key={t} value={t}>{fmtTime(t)}</option>)}</select></div>
            <div><label className="sil-lbl">End</label><select className="sil-input sil-select" value={newCourse.endTime} onChange={e=>setNewCourse(d=>({...d,endTime:e.target.value}))}>{TIME_OPTS.map(t=><option key={t} value={t}>{fmtTime(t)}</option>)}</select></div>
          </div>
          <input className="sil-input" style={{marginBottom:"9px"}} value={newCourse.room} onChange={e=>setNewCourse(d=>({...d,room:e.target.value}))} placeholder="Room (e.g. G101)"/>
          <div style={{display:"flex",gap:"7px"}}>
            <button className="sil-btn sil-btn-primary sil-btn-sm" onClick={addCourse}>✓ Add</button>
          </div>
        </div>
      )}

      {courses.length===0?(
        <div style={{textAlign:"center",padding:"50px 20px",background:"var(--sl-card)",borderRadius:16,border:"1.5px dashed var(--sl-border)"}}>
          <div style={{fontSize:"36px",marginBottom:"10px"}}>🔍</div>
          <p style={{fontWeight:"700",color:"var(--sl-text)",margin:"0 0 5px"}}>No courses extracted</p>
          <p style={{color:"var(--sl-text3)",fontSize:"12px",margin:"0 0 14px"}}>Try uploading a clearer image, or add courses manually.</p>
          <div style={{display:"flex",gap:"9px",justifyContent:"center",flexWrap:"wrap"}}>
            <button className="sil-btn sil-btn-ghost sil-btn-sm" onClick={()=>setStep(1)}>← Try Again</button>
            <button className="sil-btn sil-btn-secondary sil-btn-sm" onClick={()=>setAddingNew(true)}>+ Add Course</button>
          </div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
          {courses.map(c=><CourseRow key={c.id} course={c}/>)}
        </div>
      )}

      <div className="sil-nav-footer" style={{display:"flex",justifyContent:"space-between",marginTop:"22px",gap:"10px"}}>
        <button className="sil-btn sil-btn-ghost" onClick={()=>setStep(1)}>← Back</button>
        <button className="sil-btn sil-btn-primary" onClick={()=>setStep(3)} disabled={courses.length===0}>Continue to Design →</button>
      </div>
    </div>
  );};

  const Step3=()=>{
    const uniq=[...new Map(courses.map(c=>[c.name,c])).values()];
    return(
      <div className="sil-fu">
        <div className="sil-header-row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px",marginBottom:"18px"}}>
          <div>
            <h2 style={{fontSize:"19px",fontWeight:"800",color:"var(--sl-text)",margin:"0 0 4px"}}>Customize Your Schedule</h2>
            <p style={{color:"var(--sl-text3)",fontSize:"12px",margin:0}}>Changes apply live in the preview →</p>
          </div>
          <div className="sil-btn-row" style={{display:"flex",gap:"8px",flexWrap:"wrap",flexShrink:0}}>
            <button className="sil-btn sil-btn-ghost sil-btn-sm" onClick={()=>{setDesign({...DEFAULT_DESIGN});showToast("↺ Reset");}}>↺ Reset</button>
            <button className="sil-btn sil-btn-primary sil-btn-sm" onClick={()=>setStep(4)}>Preview →</button>
          </div>
        </div>

        <div className="sil-design-layout" style={{display:"flex",gap:"18px",alignItems:"flex-start"}}>

          <div className="sil-design-panel" style={{width:300,flexShrink:0}}>

            <Acc id="theme" title="Theme">
              <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
                {THEMES.map(th=>(
                  <div key={th.id} className={`sil-tc${design.theme===th.id?" on":""}`} onClick={()=>setD("theme",th.id)}>
                    <div style={{width:34,height:34,borderRadius:9,background:th.previewBg,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"12px",fontWeight:"700",color:"var(--sl-text)"}}>{th.label}</div>
                      <div style={{fontSize:"10px",color:"var(--sl-text3)"}}>{th.desc}</div>
                    </div>
                    {design.theme===th.id&&<span style={{color:"#4f6ef7",fontSize:"14px",flexShrink:0}}>✓</span>}
                  </div>
                ))}
              </div>
            </Acc>

            <Acc id="display" title="Display Mode">
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                <Tog on={design.darkMode} onChange={v=>setD("darkMode",v)} label="Dark mode preview"/>
                <div>
                  <label className="sil-lbl">View Mode</label>
                  <div style={{display:"flex",gap:"7px"}}>
                    {[{id:"week",label:"📅 Week"},{id:"day",label:"📋 Day Tabs"}].map(vm=>(
                      <button key={vm.id} className={`sil-chip${design.viewMode===vm.id?" on":""}`} style={{flex:1}} onClick={()=>setD("viewMode",vm.id)}>{vm.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </Acc>

            <Acc id="card" title="Card Style">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
                {CARD_STYLES.map(cs=>(
                  <div key={cs.id} className={`sil-co${design.cardStyle===cs.id?" on":""}`} onClick={()=>setD("cardStyle",cs.id)}>
                    <div style={{fontSize:"12px",fontWeight:"700",color:"var(--sl-text)"}}>{cs.label}</div>
                    <div style={{fontSize:"10px",color:"var(--sl-text3)",marginTop:"2px"}}>{cs.desc}</div>
                  </div>
                ))}
              </div>
            </Acc>

            <Acc id="colors" title="Course Colors">
              <div style={{display:"flex",flexDirection:"column",gap:"7px",marginBottom:"12px"}}>
                {[
                  {id:"by-course",label:"By Course",desc:"Each subject has a unique color"},
                  {id:"by-day",label:"By Day",desc:"Color changes per day of week"},
                  {id:"custom",label:"Custom",desc:"Pick colors manually per course"},
                ].map(cs=>(
                  <div key={cs.id} className={`sil-chip${design.colorStyle===cs.id?" on":""}`} style={{textAlign:"left",padding:"9px 11px",display:"flex",alignItems:"center",justifyContent:"space-between"}}
                    onClick={()=>setD("colorStyle",cs.id)}>
                    <div>
                      <div style={{fontSize:"12px",fontWeight:"700",color:"var(--sl-text)"}}>{cs.label}</div>
                      <div style={{fontSize:"10px",color:"var(--sl-text3)",marginTop:"1px"}}>{cs.desc}</div>
                    </div>
                    {design.colorStyle===cs.id&&<span style={{color:"#4f6ef7",flexShrink:0}}>✓</span>}
                  </div>
                ))}
              </div>
              {design.colorStyle==="custom"&&(
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  <label className="sil-lbl">Per-course colors</label>
                  {uniq.map(c=>{
                    const col=design.courseColors[c.id]||courseBaseColor(c.name);
                    return(
                      <div key={c.id} style={{display:"flex",alignItems:"center",gap:"9px"}}>
                        <input type="color" value={col} onChange={e=>setD("courseColors",{...design.courseColors,[c.id]:e.target.value})}
                          style={{width:30,height:30,borderRadius:8,border:"1.5px solid var(--sl-border)",padding:2,cursor:"pointer",background:"none",flexShrink:0}}/>
                        <span style={{fontSize:"12px",color:"var(--sl-text2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.emoji} {c.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Acc>

            <Acc id="bg" title="Background">
              <div style={{display:"flex",gap:"7px",flexWrap:"wrap",marginBottom:"12px"}}>
                {BG_PRESETS.map(bg=>(
                  <div key={bg.id} title={bg.label} className={`sil-sw${design.bgPreset===bg.id?" on":""}`}
                    style={{background:bg.bg}} onClick={()=>setD("bgPreset",bg.id)}/>
                ))}
              </div>
              <div style={{display:"flex",gap:"9px",alignItems:"center"}}>
                <input type="color" value={design.bgCustom||"#f8fafc"} onChange={e=>{setD("bgCustom",e.target.value);setD("bgPreset","custom");}}
                  style={{width:36,height:36,borderRadius:9,border:"1.5px solid var(--sl-border)",padding:2,cursor:"pointer",background:"none",flexShrink:0}}/>
                <span style={{fontSize:"11px",color:"var(--sl-text3)"}}>Custom color</span>
              </div>
            </Acc>

            <Acc id="show" title="Show / Hide">
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                <Tog on={design.showEmoji} onChange={v=>setD("showEmoji",v)} label="Course emojis"/>
                <Tog on={design.showRoom} onChange={v=>setD("showRoom",v)} label="Room / location"/>
                <Tog on={design.showDuration} onChange={v=>setD("showDuration",v)} label="Duration"/>
              </div>
            </Acc>
          </div>

          <div className="sil-preview-wrap" style={{flex:1,minWidth:0,position:"sticky",top:16}}>
            <div style={{background:"var(--sl-card)",border:"1.5px solid var(--sl-border)",borderRadius:16,padding:"14px",boxShadow:"var(--sl-shadow)"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
                <span style={{fontSize:"11px",fontWeight:"700",color:"var(--sl-text2)"}}>Live Preview</span>
                <span style={{fontSize:"10px",background:"rgba(79,110,247,0.12)",color:"#4f6ef7",padding:"2px 8px",borderRadius:"999px",fontWeight:"700",border:"1px solid rgba(79,110,247,0.2)"}}>{THEMES.find(t=>t.id===design.theme)?.label}</span>
                <span style={{marginLeft:"auto",fontSize:"10px",color:"var(--sl-text3)"}}>Updates live</span>
              </div>
              <ScheduleDesignPreview courses={courses} design={design}/>
            </div>
          </div>
        </div>

        <div className="sil-nav-footer" style={{display:"flex",justifyContent:"space-between",marginTop:"22px",gap:"10px"}}>
          <button className="sil-btn sil-btn-ghost" onClick={()=>setStep(2)}>← Edit Courses</button>
          <button className="sil-btn sil-btn-primary" onClick={()=>setStep(4)}>Full Preview →</button>
        </div>
      </div>
    );
  };

  const Step4=()=>{

    const unreviewedCount=courses.filter(c=>c.needsReview||!c.day||!c.startTime||!c.endTime||!c.name?.trim()).length;
    const canSave=courses.length>0&&unreviewedCount===0;
    return(
    <div className="sil-fu">

      {saveConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:dark?"#0c1322":"#ffffff",borderRadius:18,padding:"28px 24px",maxWidth:400,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.35)",border:`1.5px solid ${dark?"rgba(255,255,255,0.08)":"#e2e8f0"}`}}>
            <div style={{fontSize:"32px",marginBottom:"10px",textAlign:"center"}}>⚠️</div>
            <h3 style={{fontWeight:"800",fontSize:"16px",color:dark?"#eef2f8":"#0a0f1e",margin:"0 0 8px",textAlign:"center"}}>Replace Current Schedule?</h3>
            <p style={{fontSize:"13px",color:dark?"#8599b8":"#3d4f6e",margin:"0 0 20px",textAlign:"center",lineHeight:1.6}}>This will delete your current schedule and replace it with the {courses.length} imported courses. This cannot be undone.</p>
            <div style={{display:"flex",gap:"10px"}}>
              <button className="sil-btn sil-btn-ghost" style={{flex:1,justifyContent:"center"}} onClick={()=>setSaveConfirm(false)}>Cancel</button>
              <button className="sil-btn sil-btn-primary" style={{flex:1,justifyContent:"center"}} onClick={saveAsMySchedule}>Yes, Replace</button>
            </div>
          </div>
        </div>
      )}

      <div className="sil-header-row" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px",marginBottom:"22px"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px",flexWrap:"wrap"}}>
            <h2 style={{fontSize:"21px",fontWeight:"800",color:"var(--sl-text)",margin:0,letterSpacing:"-0.3px"}}>Your Schedule</h2>
            <span style={{fontSize:"10px",background:"linear-gradient(135deg,rgba(79,110,247,0.15),rgba(124,58,237,0.1))",color:"#4f6ef7",padding:"3px 9px",borderRadius:"999px",fontWeight:"700",border:"1px solid rgba(79,110,247,0.25)"}}>{THEMES.find(t=>t.id===design.theme)?.label}</span>
          </div>
          <p style={{color:"var(--sl-text3)",fontSize:"12px",margin:0}}>{courses.length} classes · Better than the original screenshot 🎉</p>
        </div>
        <div className="sil-btn-row" style={{display:"flex",gap:"8px",flexWrap:"wrap",flexShrink:0}}>
          <button className="sil-btn sil-btn-ghost sil-btn-sm" onClick={()=>setStep(3)}>← Edit Design</button>
          <button className="sil-btn sil-btn-secondary sil-btn-sm" onClick={saveAsDraft}>💾 Draft</button>
        </div>
      </div>

      <div ref={previewRef} style={{background:"var(--sl-card)",borderRadius:18,border:"1.5px solid var(--sl-border)",padding:"18px",boxShadow:"var(--sl-shadowlg)"}}>
        <ScheduleDesignPreview courses={courses} design={design}/>
      </div>

      <div style={{marginTop:"16px",background:"var(--sl-muted)",borderRadius:14,padding:"16px 18px",border:"1.5px solid var(--sl-border)"}}>
        <p style={{fontWeight:"700",fontSize:"13px",color:"var(--sl-text)",margin:"0 0 12px"}}>Actions</p>
        {!canSave&&unreviewedCount>0&&(
          <div style={{background:"rgba(245,158,11,0.1)",border:"1.5px solid rgba(245,158,11,0.3)",borderRadius:10,padding:"9px 13px",marginBottom:"12px",fontSize:"12px",color:"#92400e",fontWeight:"600"}}>
            ⚠️ {unreviewedCount} {unreviewedCount===1?"course needs":"courses need"} review before saving — click Edit on each ⚠️ row in Step 2 to set day and time.
          </div>
        )}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          <button className="sil-btn sil-btn-primary" disabled={isSaving||!canSave} onClick={()=>setSaveConfirm(true)} style={{flex:"1 1 160px",justifyContent:"center",opacity:!canSave&&!isSaving?0.5:1}}>
            {isSaving?<><span className="sil-spin" style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"white",borderRadius:"50%"}}/>Saving…</>:"💾 Save as My Schedule"}
          </button>
          <button className="sil-btn sil-btn-secondary" disabled={isExporting} onClick={shareImage} style={{flex:"1 1 130px",justifyContent:"center"}}>
            {isExporting?"⏳ Working…":"📤 Share / Save Photo"}
          </button>
          <button className="sil-btn sil-btn-secondary" disabled={isExporting} onClick={exportPNG} style={{flex:"1 1 110px",justifyContent:"center"}}>
            {isExporting?"⏳ Working…":"🖼 PNG"}
          </button>
          <button className="sil-btn sil-btn-secondary" disabled={isExporting} onClick={exportPDF} style={{flex:"1 1 110px",justifyContent:"center"}}>
            {isExporting?"⏳ Working…":"📄 PDF"}
          </button>
          <button className="sil-btn sil-btn-ghost sil-btn-sm" onClick={()=>setStep(1)} style={{justifyContent:"center"}}>Start Over</button>
        </div>
        <p style={{fontSize:"11px",color:"var(--sl-text3)",margin:"10px 0 0",lineHeight:1.5}}>
          "Save as My Schedule" requires login and replaces your current schedule with {courses.length} courses. "Share / Save Photo" opens the native share sheet on mobile — use it to save directly to your Photos or share on WhatsApp / Instagram.
        </p>
      </div>

      <div style={{marginTop:"14px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"9px"}}>
        {[
          {label:"Theme",val:THEMES.find(t=>t.id===design.theme)?.label,icon:"🎨"},
          {label:"View",val:design.viewMode==="week"?"Weekly Grid":"Day Tabs",icon:"📅"},
          {label:"Colors",val:{["by-course"]:"By Course",["by-day"]:"By Day",custom:"Custom"}[design.colorStyle],icon:"🎯"},
          {label:"Cards",val:CARD_STYLES.find(c=>c.id===design.cardStyle)?.label,icon:"🃏"},
        ].map(s=>(
          <div key={s.label} style={{background:"var(--sl-card)",border:"1.5px solid var(--sl-border)",borderRadius:11,padding:"11px 13px",boxShadow:"var(--sl-shadow)"}}>
            <div style={{fontSize:"15px",marginBottom:"4px"}}>{s.icon}</div>
            <div style={{fontSize:"10px",color:"var(--sl-text3)",fontWeight:"600"}}>{s.label}</div>
            <div style={{fontSize:"12px",fontWeight:"700",color:"var(--sl-text)",marginTop:"2px"}}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );};

  const STEP_LABELS=["Upload","Extract","Design","Preview"];

  return(
    <div data-sil={appTheme} style={{minHeight:"100vh",background:"var(--sl-bg)"}}>
      <style>{css}</style>

      <div className="sil-banner">
        <span>🎓</span><span>Smart Campus</span><span>·</span><span>Schedule Import</span>
      </div>

      {toast&&<div className="sil-toast">{toast}</div>}

      <div className="sil-outer-pad" style={{maxWidth:1080,margin:"0 auto",padding:"22px 16px 56px"}}>

        <div style={{marginBottom:"22px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"5px",flexWrap:"wrap"}}>
            <div style={{width:36,height:36,borderRadius:9,background:"linear-gradient(135deg,#1d4ed8,#6d28d9)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 12px rgba(29,78,216,0.3)"}}>
              <span style={{fontSize:"18px",lineHeight:1}}>🎓</span>
            </div>
            <h1 className="sil-title" style={{fontSize:"24px",fontWeight:"900",color:"var(--sl-text)",margin:0,letterSpacing:"-0.5px"}}>Schedule Import</h1>
          </div>
          <p style={{color:"var(--sl-text3)",fontSize:"12.5px",margin:0}}>Upload a schedule image → Smart Local OCR (bilingual, grid-aware) → Customize design → Save to your account</p>
        </div>

        <div style={{background:"var(--sl-card)",border:"1.5px solid var(--sl-border)",borderRadius:14,padding:"14px 20px",marginBottom:"20px",boxShadow:"var(--sl-shadow)"}}>
          <div style={{display:"flex",alignItems:"center"}}>
            {STEP_LABELS.map((label,i)=>{
              const n=i+1,state=n<step?"done":n===step?"active":"idle";
              return(
                <div key={n} style={{display:"contents"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
                    <div className={`sil-dot ${state}`} style={{cursor:state==="done"?"pointer":"default"}} onClick={()=>{if(state==="done")setStep(n);}}>
                      {state==="done"?"✓":n}
                    </div>
                    <span className="sil-step-lbl" style={{fontSize:"10px",fontWeight:"600",color:state==="active"?"#4f6ef7":state==="done"?"var(--sl-text2)":"var(--sl-text3)",whiteSpace:"nowrap"}}>{label}</span>
                  </div>
                  {i<STEP_LABELS.length-1&&<div className={`sil-line${n<step?" done":""}`}/>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sil-card-pad" style={{background:"var(--sl-card)",border:"1.5px solid var(--sl-border)",borderRadius:18,padding:"24px",boxShadow:"var(--sl-shadow)"}}>
          {step===1&&<Step1/>}
          {step===2&&<Step2/>}
          {step===3&&<Step3/>}
          {step===4&&<Step4/>}
        </div>
      </div>
    </div>
  );
}
