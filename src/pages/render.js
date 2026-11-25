// Draws notebook pages onto canvases in the lab-notebook visual language.
// Each page records link hotspots (canvas px) so the 3D page can be clicked.
import * as C from '../content.js';

export const PW = 1200, PH = 1600;           // page canvas size (3:4, matches mesh)
const MARGIN_X = 168;                          // red margin rule
const L = MARGIN_X + 36;                       // text left edge
const R = PW - 84;                             // text right edge

const COL = {
  paper: '#f6f2e7', grid: 'rgba(76,120,160,.11)', gridStrong: 'rgba(76,120,160,.20)',
  ink: '#1b2636', soft: '#46505f', faint: '#7d8696', rule: '#d9a3a0',
  pen: '#2b4fa3', red: '#b8423a', hl: 'rgba(251,226,122,.85)', line: '#d3ccbc',
};
const F = {
  serif: '"IBM Plex Serif", Georgia, serif',
  sans: '"IBM Plex Sans", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
  hand: 'Caveat, cursive',
};

export async function loadFonts() {
  const specs = [
    `400 30px ${F.sans}`, `600 30px ${F.sans}`, `600 30px ${F.serif}`, `italic 400 30px ${F.serif}`,
    `italic 500 30px ${F.serif}`, `500 30px ${F.mono}`, `400 30px ${F.mono}`, `600 30px ${F.mono}`, `600 30px ${F.hand}`,
  ];
  try { await Promise.all(specs.map(s => document.fonts.load(s))); } catch (e) { /* fall back to system fonts */ }
}

// ---------- seeded noise so pages look the same every load ----------
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909), (s >>>= 0) / 4294967296)); }

let noiseTile;
function paperNoise() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), img = g.createImageData(256, 256), r = rng(7);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (r() - .5) * 40;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 22;
  }
  g.putImageData(img, 0, 0);
  return (noiseTile = c);
}

// ---------- rich text ----------
// ==mark==, **bold**, [label](url)
function parseRich(str) {
  const runs = [], re = /(==(.+?)==|\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\))/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) runs.push({ t: str.slice(last, m.index) });
    if (m[2]) runs.push({ t: m[2], mark: true });
    else if (m[3]) runs.push({ t: m[3], bold: true });
    else runs.push({ t: m[4], href: m[5] });
    last = re.lastIndex;
  }
  if (last < str.length) runs.push({ t: str.slice(last) });
  return runs;
}

class Page {
  constructor(opts = {}) {
    this.c = document.createElement('canvas');
    this.c.width = PW; this.c.height = PH;
    this.g = this.c.getContext('2d');
    this.hotspots = [];
    this.side = opts.side || 'right';   // which side of the spread (for gutter shading)
    this.y = 0;
    this.r = rng(opts.seed || 1);
  }

  background({ grid = true, margin = true, header = true, pageNo, label } = {}) {
    const g = this.g;
    g.fillStyle = COL.paper; g.fillRect(0, 0, PW, PH);
    if (grid) {
      for (let x = 0; x <= PW; x += 30) { g.fillStyle = x % 150 === 0 ? COL.gridStrong : COL.grid; g.fillRect(x, 0, 2, PH); }
      for (let y = 0; y <= PH; y += 30) { g.fillStyle = y % 150 === 0 ? COL.gridStrong : COL.grid; g.fillRect(0, y, PW, 2); }
    }
    if (margin) { g.fillStyle = COL.rule; g.globalAlpha = .85; g.fillRect(MARGIN_X, 0, 3, PH); g.globalAlpha = 1; }
    g.fillStyle = g.createPattern(paperNoise(), 'repeat'); g.fillRect(0, 0, PW, PH);
    if (header) {
      this.font(`400 20px ${F.mono}`, COL.faint);
      g.textBaseline = 'alphabetic';
      g.fillText('NOTEBOOK · K. YU · VOL. ' + new Date().getFullYear(), L, 78);
      if (pageNo != null) { g.textAlign = 'right'; g.fillText('p. ' + String(pageNo).padStart(2, '0'), R, 78); g.textAlign = 'left'; }
      g.fillStyle = COL.line; g.fillRect(L, 98, R - L, 2);
    }
    if (label) this.marginLabel(label, 190);
    this.y = 170;
  }

  // Gutter shadow + edge darkening, drawn last so it sits over content.
  finish() {
    const g = this.g, inner = this.side === 'right' ? 0 : PW, dir = this.side === 'right' ? 1 : -1;
    const grad = g.createLinearGradient(inner, 0, inner + dir * 140, 0);
    grad.addColorStop(0, 'rgba(60,45,25,.30)'); grad.addColorStop(.35, 'rgba(60,45,25,.08)'); grad.addColorStop(1, 'rgba(60,45,25,0)');
    g.fillStyle = grad; g.fillRect(0, 0, PW, PH);
    const outer = PW - inner, og = g.createLinearGradient(outer, 0, outer - dir * 40, 0);
    og.addColorStop(0, 'rgba(90,70,40,.10)'); og.addColorStop(1, 'rgba(90,70,40,0)');
    g.fillStyle = og; g.fillRect(0, 0, PW, PH);
    return this;
  }

  font(f, color) { this.g.font = f; if (color) this.g.fillStyle = color; }

  marginLabel(text, y) {
    const g = this.g; this.font(`500 24px ${F.mono}`, COL.red);
    g.textAlign = 'right'; g.fillText(text, MARGIN_X - 20, y); g.textAlign = 'left';
  }

  // Wrapped rich text. Returns bottom y.
  rich(str, { x = L, w = R - L, size = 29, lh = 1.5, family = F.sans, weight = 400, style = '', color = COL.soft, y = this.y } = {}) {
    const g = this.g, lineH = size * lh;
    const fontFor = r => `${style} ${r.bold ? 600 : weight} ${size}px ${family}`.trim();
    // tokenise into words keeping run styles
    const words = [];
    for (const r of parseRich(str)) for (const part of r.t.split(/(\s+)/)) if (part) words.push({ ...r, t: part });
    let cx = x, cy = y + size, lineWords = [];
    const flush = () => { for (const wd of lineWords) this._drawWord(wd, size, color, lineH); lineWords = []; };
    for (const wd of words) {
      g.font = fontFor(wd);
      const ww = g.measureText(wd.t).width;
      if (/^\s+$/.test(wd.t)) { if (cx > x) { wd.x = cx; wd.y = cy; wd.w = ww; wd.f = g.font; lineWords.push(wd); cx += ww; } continue; }
      if (cx + ww > x + w && cx > x) {
        // drop trailing space on the line
        while (lineWords.length && /^\s+$/.test(lineWords[lineWords.length - 1].t)) lineWords.pop();
        flush(); cx = x; cy += lineH;
      }
      wd.x = cx; wd.y = cy; wd.w = ww; wd.f = g.font; lineWords.push(wd); cx += ww;
    }
    flush();
    this.y = cy + (lineH - size);
    return this.y;
  }

  _drawWord(wd, size, color, lineH) {
    const g = this.g;
    if (wd.mark) {
      g.fillStyle = COL.hl;
      const j = (this.r() - .5) * 3;
      g.beginPath(); g.moveTo(wd.x - 3, wd.y - size * .82 + j); g.lineTo(wd.x + wd.w + 3, wd.y - size * .86 - j);
      g.lineTo(wd.x + wd.w + 3, wd.y + size * .26 + j); g.lineTo(wd.x - 3, wd.y + size * .3); g.fill();
    }
    g.font = wd.f;
    g.fillStyle = wd.href ? COL.pen : (wd.mark ? COL.ink : color);
    g.fillText(wd.t, wd.x, wd.y);
    if (wd.href && !/^\s+$/.test(wd.t)) {
      g.fillRect(wd.x, wd.y + 5, wd.w, 2);
      this.hotspots.push({ x: wd.x - 4, y: wd.y - size, w: wd.w + 8, h: lineH, href: wd.href });
    }
  }

  line(text, { x = L, size = 29, family = F.sans, weight = 400, style = '', color = COL.ink, y = this.y, align = 'left' } = {}) {
    const g = this.g; this.font(`${style} ${weight} ${size}px ${family}`.trim(), color);
    g.textAlign = align; g.fillText(text, x, y + size); g.textAlign = 'left';
    const w = g.measureText(text).width;
    this.y = y + size * 1.35;
    return w;
  }

  hand(text, x, y, { rot = -0.05, size = 44, color = COL.pen, align = 'left' } = {}) {
    const g = this.g; g.save(); g.translate(x, y); g.rotate(rot);
    this.font(`600 ${size}px ${F.hand}`, color); g.textAlign = align; g.fillText(text, 0, 0); g.restore();
  }

  heading(mark, title, sub) {
    this.marginLabel(mark, this.y + 44);
    this.line(title, { size: 54, family: F.serif, weight: 600 });
    if (sub) { this.y += 2; this.line(sub.toUpperCase(), { size: 20, family: F.mono, weight: 500, color: COL.faint }); }
    this.y += 26;
  }

  group(text) {
    const g = this.g; this.y += 14;
    this.font(`600 20px ${F.mono}`, COL.red); g.fillText(text.toUpperCase(), L, this.y + 20);
    const w = g.measureText(text.toUpperCase()).width;
    g.fillStyle = COL.line; g.fillRect(L + w + 18, this.y + 12, R - L - w - 18, 2);
    this.y += 52;
  }

  // Bordered "experiment" card with dt/dd fields.
  card({ head = [], idx, title, titleHref, role, fields = [], note, now }) {
    const main = this.g, top = this.y, pad = 34, x0 = L, x1 = R;
    // draw contents on a transparent layer, then the sheet behind it
    const layer = document.createElement('canvas'); layer.width = PW; layer.height = PH;
    const g = (this.g = layer.getContext('2d'));
    this.y = top + pad;
    let hx = x0 + pad;
    for (let i = 0; i < head.length; i++) {
      const isId = i === 0 && idx;
      this.font(`${isId ? 600 : 400} 22px ${F.mono}`, isId ? COL.red : COL.faint);
      g.fillText(head[i], hx, this.y + 22); hx += g.measureText(head[i]).width + 30;
    }
    this.y += 40;
    const tx = x0 + pad, tw = x1 - x0 - pad * 2, tY0 = this.y;
    this.rich(titleHref ? `[${title}](${titleHref})` : title, { x: tx, w: tw - (now ? 90 : 0), size: 38, lh: 1.25, family: F.serif, weight: 600, color: COL.ink });
    if (now) {
      this.font(`600 17px ${F.mono}`); const lw = g.measureText('NOW').width + 20;
      g.fillStyle = COL.red; g.fillRect(x1 - pad - lw, tY0 + 6, lw, 30);
      g.fillStyle = COL.paper; g.fillText('NOW', x1 - pad - lw + 10, tY0 + 28);
    }
    if (role) { this.y += 4; this.rich(role, { x: tx, w: tw, size: 28, family: F.serif, style: 'italic', color: COL.soft }); }
    this.y += fields.length ? 22 : 8;
    const dtW = 150;
    for (const [dt, dd, kind] of fields) {
      this.font(`500 19px ${F.mono}`, COL.faint); g.fillText(dt.toUpperCase(), tx, this.y + 26);
      this.rich(dd, kind === 'mono'
        ? { x: tx + dtW, w: tw - dtW, size: 23, lh: 1.6, family: F.mono }
        : { x: tx + dtW, w: tw - dtW, size: 27, lh: 1.5 });
      this.y += 14;
    }
    const bottom = this.y + pad - 14;
    this.g = main;
    main.fillStyle = 'rgba(255,255,255,.55)'; main.fillRect(x0, top, x1 - x0, bottom - top);
    main.strokeStyle = COL.line; main.lineWidth = 2; main.strokeRect(x0 + 1, top + 1, x1 - x0 - 2, bottom - top - 2);
    main.drawImage(layer, 0, 0);
    if (note) {
      const g = main; this.font(`600 40px ${F.hand}`);
      const nw = g.measureText(note).width;
      g.save(); g.translate(x1 - 40 - nw, top + 10); g.rotate(.04);
      g.fillStyle = COL.paper; g.fillRect(-10, -30, nw + 20, 40);
      g.fillStyle = COL.red; g.fillText(note, 0, 0); g.restore();
    }
    this.y = bottom + 34;
  }

  button(text, x, y, href, primary) {
    const g = this.g; this.font(`500 26px ${F.mono}`);
    const w = g.measureText(text).width;
    if (primary) {
      g.fillStyle = COL.ink; g.fillRect(x, y, w + 36, 58);
      g.fillStyle = COL.paper; g.fillText(text, x + 18, y + 38);
      this.hotspots.push({ x, y, w: w + 36, h: 58, href });
      return w + 36;
    }
    g.fillStyle = COL.pen; g.fillText(text, x, y + 38); g.fillRect(x, y + 45, w, 2);
    this.hotspots.push({ x: x - 6, y: y + 4, w: w + 12, h: 54, href });
    return w;
  }
}

// ---------------- page builders ----------------
const year = new Date().getFullYear();

function titlePage(p) {
  p.background({ pageNo: 1 });
  p.marginLabel('p. 01', 300);
  p.y = 260;
  p.line(C.profile.label.toUpperCase(), { size: 21, family: F.mono, weight: 500, color: COL.red });
  p.y += 6;
  p.line(C.profile.name, { size: 128, family: F.serif, weight: 600 });
  p.y += 4;
  p.rich(C.profile.tagline, { size: 36, family: F.serif, style: 'italic', color: COL.soft, lh: 1.35 });
  p.y += 46;
  // abstract with left rule
  const top = p.y;
  p.line('ABSTRACT', { x: L + 30, size: 20, family: F.mono, weight: 500, color: COL.ink });
  p.y += 4;
  p.rich(C.profile.abstract, { x: L + 30, w: R - L - 40, size: 29, lh: 1.55, color: COL.ink });
  p.g.fillStyle = COL.ink; p.g.fillRect(L, top, 5, p.y - top);
  p.y += 50;
  let x = L;
  for (const l of C.profile.links) x += p.button(l.label, x, p.y, l.href, l.primary) + 40;
  p.hand(C.profile.note + ' → §6', L + 10, p.y + 170, { rot: -0.04, size: 46 });
  p.hand('flip the page →', R, PH - 90, { rot: -0.03, size: 40, color: COL.faint, align: 'right' });
}

function contentsPage(p, toc) {
  p.background({ pageNo: 2 });
  p.y = 200;
  p.line('Contents', { size: 64, family: F.serif, weight: 600 });
  p.y += 40;
  const g = p.g;
  for (const t of toc) {
    const y = p.y;
    p.marginLabel(t.mark, y + 44);
    p.font(`600 50px ${F.hand}`, COL.pen);
    g.fillText(t.label, L, y + 46);
    const lw = g.measureText(t.label).width;
    // dotted leader
    p.font(`400 26px ${F.mono}`, COL.faint);
    const pg = 'p. ' + String(t.page + 1).padStart(2, '0');
    const pw = g.measureText(pg).width;
    g.fillText(pg, R - pw, y + 44);
    for (let dx = L + lw + 20; dx < R - pw - 20; dx += 16) g.fillRect(dx, y + 40, 4, 4);
    p.hotspots.push({ x: L - 10, y: y - 4, w: R - L + 20, h: 70, href: '#page:' + t.page });
    p.y += 104;
  }
  p.y += 30;
  p.hand('tip: drag a page corner, use ← →,', L, p.y + 40, { rot: -0.02, size: 40, color: COL.faint });
  p.hand('or click the coloured tabs', L + 40, p.y + 92, { rot: -0.02, size: 40, color: COL.faint });
}

function jobPage(p, n, jobs, { heading, label } = {}) {
  p.background({ pageNo: n + 1 });
  if (heading) p.heading('§1', 'Experience', 'Positions held, newest first');
  for (const j of jobs) p.card({ head: [j.when, j.where], title: j.org, titleHref: j.href, role: j.role, fields: j.fields, note: j.note, now: j.now });
  if (label) p.marginLabel(label, PH - 100);
}

function earlierPage(p, n) {
  p.background({ pageNo: n + 1 });
  p.marginLabel('§1', 230);
  p.group('Earlier positions');
  const g = p.g;
  for (const e of C.earlier) {
    const top = p.y;
    p.font(`400 22px ${F.mono}`, COL.faint);
    g.fillText(e.when, L, top + 28);
    const x = L + 260, w = R - x;
    p.y = top;
    p.rich(e.org, { x, w, size: 30, weight: 600, color: COL.ink, lh: 1.3 });
    p.rich(e.role, { x, w, size: 27, family: F.serif, style: 'italic', color: COL.soft });
    if (e.text) { p.y += 4; p.rich(e.text, { x, w, size: 26 }); }
    p.y += 26;
    g.fillStyle = COL.line; for (let dx = L; dx < R; dx += 14) g.fillRect(dx, p.y, 7, 2);
    p.y += 30;
  }
  p.hand('← earlier: neuroscience & wet lab', L + 20, p.y + 80, { rot: -0.03, size: 42, color: COL.red });
}

function projectPage(p, n, proj, heading) {
  p.background({ pageNo: n + 1 });
  if (heading) p.heading('§2', 'Projects', 'Experiments, written up');
  else p.marginLabel('§2', 200);
  p.card({ head: [proj.id, proj.when, proj.where], idx: true, title: proj.title, fields: proj.fields, note: proj.note });
}

function pubsPage(p, n) {
  p.background({ pageNo: n + 1 });
  p.heading('§3', 'Publications', 'Papers, abstracts, posters');
  const g = p.g;
  C.pubs.forEach((pub, i) => {
    const top = p.y;
    p.font(`500 24px ${F.mono}`, COL.red); g.fillText(`[${i + 1}]`, L, top + 34);
    const x = L + 70, w = R - x;
    p.rich(pub.href ? `[${pub.title}](${pub.href})` : pub.title, { x, w, size: 32, family: F.serif, style: 'italic', weight: 500, color: COL.ink, lh: 1.4, y: top });
    p.y += 6; p.rich(pub.venue, { x, w, size: 22, family: F.mono, color: COL.faint, lh: 1.55 });
    if (pub.note) { p.y += 2; p.rich(pub.note, { x, w, size: 26 }); }
    p.y += 26;
    g.fillStyle = COL.line; for (let dx = L; dx < R; dx += 14) g.fillRect(dx, p.y, 7, 2);
    p.y += 34;
  });
  p.hand('preprint, not yet peer-reviewed', R - 20, p.y + 40, { rot: -0.04, size: 40, color: COL.faint, align: 'right' });
}

function materialsPage(p, n) {
  p.background({ pageNo: n + 1 });
  p.heading('§4', 'Materials & methods', 'Tools and techniques');
  const g = p.g, colW = (R - L - 50) / 2, top = p.y;
  C.materials.forEach(([h, items], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = L + col * (colW + 50), y = top + row * 390;
    p.font(`500 20px ${F.mono}`, COL.faint); g.fillText(h.toUpperCase(), x, y + 22);
    g.fillStyle = COL.line; g.fillRect(x, y + 38, colW, 2);
    p.font(`400 25px ${F.mono}`, COL.ink);
    items.forEach((it, k) => { g.fillStyle = COL.faint; g.fillText('–', x, y + 86 + k * 46); g.fillStyle = COL.ink; g.fillText(it, x + 30, y + 86 + k * 46); });
  });
}

function trainingPage(p, n) {
  p.background({ pageNo: n + 1 });
  p.heading('§5', 'Training', 'Education');
  const g = p.g;
  for (const s of C.schools) {
    const top = p.y;
    p.line(s.name, { size: 42, family: F.serif, weight: 600 });
    p.font(`400 23px ${F.mono}`, COL.faint); g.textAlign = 'right'; g.fillText(s.when, R, top + 36); g.textAlign = 'left';
    p.rich(s.deg, { size: 29, family: F.serif, style: 'italic', color: COL.soft });
    p.y += 10; p.rich(s.cw, { size: 25, color: COL.faint, lh: 1.6 });
    p.y += 34; g.fillStyle = COL.line; for (let dx = L; dx < R; dx += 14) g.fillRect(dx, p.y, 7, 2);
    p.y += 50;
  }
  p.hand('GPA 3.85 / 3.93', R - 40, p.y + 60, { rot: -0.05, size: 48, color: COL.red, align: 'right' });
}

function contactPage(p, n) {
  p.background({ pageNo: n + 1 });
  p.y = 260;
  p.heading('§6', 'Correspondence', 'Get in touch');
  p.rich(C.contact.text, { size: 34, color: COL.ink, lh: 1.55 });
  p.y += 50;
  let x = L;
  x += p.button('keyiyu@stanford.edu', x, p.y, C.EMAIL, true) + 40;
  x += p.button('resume.pdf', x, p.y, C.RESUME) + 40;
  p.button('linkedin', x, p.y, C.LINKEDIN);
  p.hand('— Keyi', L + 20, p.y + 230, { rot: -0.04, size: 96 });
  p.y = PH - 170; p.g.fillStyle = COL.line; p.g.fillRect(L, p.y, R - L, 2);
  p.line(`© ${year} Keyi Yu · Palo Alto, CA`, { y: p.y + 20, size: 21, family: F.mono, color: COL.faint });
  p.line('end of entry', { y: p.y - 8, x: R, size: 21, family: F.mono, color: COL.faint, align: 'right' });
}

// Endpapers (inside of the covers): marbled-ish pale blue with a label.
function endpaper(p, { label } = {}) {
  const g = p.g;
  g.fillStyle = '#dfe5e6'; g.fillRect(0, 0, PW, PH);
  const r = rng(label ? 3 : 9);
  g.globalAlpha = .07;
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = r() > .5 ? '#2f4a5a' : '#ffffff'; g.lineWidth = 1 + r() * 3;
    const x = r() * PW, y = r() * PH; g.beginPath(); g.moveTo(x, y);
    g.bezierCurveTo(x + (r() - .5) * 300, y + (r() - .5) * 80, x + (r() - .5) * 300, y + (r() - .5) * 80, x + (r() - .5) * 400, y + (r() - .5) * 60); g.stroke();
  }
  g.globalAlpha = 1;
  g.fillStyle = g.createPattern(paperNoise(), 'repeat'); g.fillRect(0, 0, PW, PH);
  if (label) {
    // bookplate
    const w = 640, h = 380, x = (PW - w) / 2, y = 520;
    g.fillStyle = '#f8f5ec'; g.fillRect(x, y, w, h);
    g.strokeStyle = '#1b2636'; g.lineWidth = 3; g.strokeRect(x + 16, y + 16, w - 32, h - 32);
    g.lineWidth = 1; g.strokeRect(x + 26, y + 26, w - 52, h - 52);
    p.font(`500 22px ${F.mono}`, COL.faint); g.textAlign = 'center';
    g.fillText('THIS NOTEBOOK BELONGS TO', PW / 2, y + 96);
    p.font(`600 92px ${F.hand}`, COL.pen); g.fillText('Keyi Yu', PW / 2, y + 210);
    p.font(`400 22px ${F.mono}`, COL.faint); g.fillText('if found, please email keyiyu@stanford.edu', PW / 2, y + 300);
    g.textAlign = 'left';
    p.hotspots.push({ x, y, w, h, href: C.EMAIL });
  }
}

// ---------- page list ----------
// Returns array of { canvas, hotspots } builders (lazy). Page 0 = right page after the cover.
export function buildPageList() {
  const pages = [];
  const add = (fn) => pages.push(fn);
  const toc = [];
  const mark = (key, label, m) => toc.push({ key, label, mark: m, page: pages.length });

  add(p => titlePage(p));                                    // 0
  add(p => contentsPage(p, toc));                           // 1
  mark('exp', 'Experience', '§1');
  add(p => jobPage(p, 2, C.jobs.slice(0, 2), { heading: true }));   // 2  Woods + Genentech
  add(p => jobPage(p, 3, [C.jobs[2]]));                     // 3  Boussard
  add(p => jobPage(p, 4, [C.jobs[3]]));                     // 4  STEMz
  add(p => jobPage(p, 5, [C.jobs[4]]));                     // 5  EndoMD
  add(p => jobPage(p, 6, [C.jobs[5]]));                     // 6  Mesirov
  add(p => earlierPage(p, 7));                              // 7
  mark('proj', 'Projects', '§2');
  C.projects.forEach((pr, i) => { const n = pages.length; add(p => projectPage(p, n, pr, i === 0)); });  // 8-11
  mark('pubs', 'Publications', '§3');
  add(p => pubsPage(p, 12));                                // 12
  mark('mat', 'Materials & methods', '§4');
  add(p => materialsPage(p, 13));                           // 13
  mark('edu', 'Training', '§5');
  add(p => trainingPage(p, 14));                            // 14
  mark('contact', 'Correspondence', '§6');
  add(p => contactPage(p, 15));                             // 15

  const sectionStart = Object.fromEntries(toc.map(t => [t.key, t.page]));
  const sectionOf = (i) => { let cur = null; for (const t of toc) if (t.page <= i) cur = t; return cur; };

  return {
    count: pages.length,
    sectionStart, toc, sectionOf,
    render(i) {
      const p = new Page({ side: i % 2 === 0 ? 'right' : 'left', seed: 100 + i });
      pages[i](p);
      return { canvas: p.finish().c, hotspots: p.hotspots };
    },
    endpaper(which) {
      const p = new Page({ seed: which === 'front' ? 3 : 9 });
      endpaper(p, { label: which === 'front' });
      return { canvas: p.c, hotspots: p.hotspots };
    },
  };
}

// ---------- cover ----------
export function coverCanvas() {
  const c = document.createElement('canvas'); c.width = 1240; c.height = 1680;
  const g = c.getContext('2d'), r = rng(42);
  g.fillStyle = '#1f3a3d'; g.fillRect(0, 0, c.width, c.height);
  // cloth weave
  for (let i = 0; i < 26000; i++) {
    g.fillStyle = r() > .5 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.05)';
    g.fillRect(r() * c.width, r() * c.height, 1 + r() * 3, 1);
  }
  // worn edges
  const vg = g.createRadialGradient(c.width / 2, c.height / 2, c.height * .3, c.width / 2, c.height / 2, c.height * .75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
  g.fillStyle = vg; g.fillRect(0, 0, c.width, c.height);
  // spine band
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, 70, c.height);
  // label
  const w = 760, h = 470, x = (c.width - w) / 2 + 30, y = 360;
  g.fillStyle = '#f1ebdc'; g.fillRect(x, y, w, h);
  g.strokeStyle = '#1b2636'; g.lineWidth = 4; g.strokeRect(x + 18, y + 18, w - 36, h - 36);
  g.lineWidth = 1.5; g.strokeRect(x + 30, y + 30, w - 60, h - 60);
  g.fillStyle = '#1b2636'; g.textAlign = 'center';
  g.font = `600 52px ${F.serif}`; g.fillText('LABORATORY', x + w / 2, y + 120);
  g.fillText('NOTEBOOK', x + w / 2, y + 180);
  g.fillStyle = '#b8423a'; g.fillRect(x + 80, y + 214, w - 160, 3);
  g.fillStyle = '#5a6270'; g.font = `500 24px ${F.mono}`;
  g.fillText('NAME', x + 140, y + 290); g.fillText('VOL.', x + 140, y + 380);
  g.textAlign = 'left'; g.fillStyle = '#2b4fa3';
  g.font = `600 84px ${F.hand}`; g.fillText('Keyi Yu', x + 220, y + 300);
  g.font = `600 64px ${F.hand}`; g.fillText(String(year) + '  ·  Healthcare AI', x + 220, y + 388);
  g.fillStyle = '#5a6270'; g.fillRect(x + 210, y + 310, w - 270, 2); g.fillRect(x + 210, y + 398, w - 270, 2);
  // embossed bottom text
  g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.18)'; g.font = `500 30px ${F.mono}`;
  g.fillText('STANFORD · BIOENGINEERING', c.width / 2 + 30, c.height - 150);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.font = `600 52px ${F.hand}`;
  g.fillText('click to open', c.width / 2 + 30, c.height - 260);
  return c;
}

export function backCoverCanvas() {
  const c = document.createElement('canvas'); c.width = 620; c.height = 840;
  const g = c.getContext('2d'), r = rng(43);
  g.fillStyle = '#1f3a3d'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 7000; i++) { g.fillStyle = r() > .5 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.05)'; g.fillRect(r() * c.width, r() * c.height, 1 + r() * 2, 1); }
  return c;
}

// Paper edge texture for the page block sides (fine horizontal lines).
export function pageEdgeCanvas() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const g = c.getContext('2d'), r = rng(5);
  g.fillStyle = '#ebe5d6'; g.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 2) { g.fillStyle = `rgba(120,100,70,${.08 + r() * .18})`; g.fillRect(0, y, 64, 1); }
  return c;
}

export function tabCanvas(text, color, aspect = 0.5) {
  const c = document.createElement('canvas'); c.width = 200; c.height = Math.round(200 / aspect);
  const g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = color; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, 0, w, 6);
  g.fillStyle = 'rgba(0,0,0,.10)'; g.fillRect(0, h - 6, w, 6);
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 0, 10, h);   // where it tucks under the page
  g.fillStyle = '#1b2636'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = 58; g.font = `600 ${size}px ${F.hand}`;
  while (g.measureText(text).width > w - 36 && size > 30) { size -= 2; g.font = `600 ${size}px ${F.hand}`; }
  g.fillText(text, w / 2 + 4, h / 2);
  return c;
}
