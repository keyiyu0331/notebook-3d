// The 3D notebook: hard covers, spine, page blocks, bendable leaves and index tabs.
// Book lies in the XZ plane, spine along Z at x = 0. A leaf at theta = 0 lies on the
// right (x in [0, W]); at theta = PI it lies on the left. theta rotates +x toward +y.
import * as THREE from 'three';
import { coverCanvas, backCoverCanvas, pageEdgeCanvas, tabCanvas, PW, PH } from '../pages/render.js';

export const W = 2.1, H = 2.8;           // page size (1 unit = 10 cm)
const O = 0.07;                           // cover overhang
const B = 0.045;                          // board thickness
const T = 0.16;                           // total page-block thickness
const EPS = 0.0022;                       // spacing between loose leaves
const SEG = 48;                           // bend segments along the page width
const CURL = 1.25;                        // how much a turning page bends (radians across the page)

const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function canvasTex(canvas, renderer, { repeatMirror = false } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (repeatMirror) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; }
  return t;
}

// ---------- a single bendable sheet (front + back mesh sharing one geometry) ----------
class Leaf {
  constructor(paperMat, index) {
    this.index = index;
    this.theta = 0; this.curl = 1; this.anim = null;
    const nv = (SEG + 1) * 2;
    const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = [];
    for (let i = 0; i <= SEG; i++) for (let j = 0; j < 2; j++) {
      const k = i * 2 + j;
      uv[k * 2] = i / SEG; uv[k * 2 + 1] = j === 0 ? 1 : 0;   // j=0 is the far (top) edge
    }
    for (let i = 0; i < SEG; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    this.geo = geo;
    this.front = new THREE.Mesh(geo, paperMat.clone());
    this.back = new THREE.Mesh(geo, paperMat.clone());
    this.back.material.side = THREE.BackSide;
    for (const m of [this.front, this.back]) {
      m.castShadow = m.receiveShadow = true;
      m.userData.leaf = this;
    }
    this.front.userData.face = 'front'; this.back.userData.face = 'back';
    this.tabs = [];
    this._last = null;
  }

  setTextures(front, back) {
    if (front !== undefined) { this.front.material.map = front; this.front.material.needsUpdate = true; }
    if (back !== undefined) { this.back.material.map = back; this.back.material.needsUpdate = true; }
  }

  // Edge point + tangent angle at arc length s for the current shape.
  shape(s, theta, a) {
    if (Math.abs(a) < 1e-5) return [s * Math.cos(theta), s * Math.sin(theta), theta];
    const ang = theta + a * s;
    return [(Math.sin(ang) - Math.sin(theta)) / a, (Math.cos(theta) - Math.cos(ang)) / a, ang];
  }

  update(yBase) {
    const theta = this.theta, a = (CURL * this.curl * Math.sin(theta)) / W;
    const key = theta.toFixed(5) + '|' + a.toFixed(5) + '|' + yBase.toFixed(5);
    if (key === this._last) return;
    this._last = key;
    const p = this.geo.attributes.position.array;
    for (let i = 0; i <= SEG; i++) {
      const [x, y] = this.shape((i / SEG) * W, theta, a);
      for (let j = 0; j < 2; j++) {
        const k = (i * 2 + j) * 3;
        p[k] = x; p[k + 1] = y + yBase; p[k + 2] = j === 0 ? -H / 2 : H / 2;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.geo.computeBoundingSphere();
    // tabs ride on the fore-edge
    const [ex, ey, ang] = this.shape(W, theta, a);
    for (const t of this.tabs) { t.position.set(ex, ey + yBase, t.userData.z); t.rotation.z = ang; }
  }
}

export class Notebook {
  constructor({ renderer, pages, sections, clothNormal }) {
    this.renderer = renderer;
    this.pages = pages;
    this.group = new THREE.Group();
    this.raycastTargets = [];
    this.nLeaves = Math.ceil(pages.count / 2);
    this.spread = 0;           // 0 = closed, 1 = cover open (title page on the right), ...
    this.maxSpread = this.nLeaves + 1;
    this.texCache = new Map(); // page index -> { tex, hotspots, used }
    this.onSpreadChange = () => {};

    const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.93, metalness: 0 });
    this.blankTex = this._blankPageTex();
    paperMat.map = this.blankTex;

    // --- covers ---
    const cloth = new THREE.MeshStandardMaterial({ color: 0x1f3a3d, roughness: 0.82 });
    if (clothNormal) {
      clothNormal.wrapS = clothNormal.wrapT = THREE.RepeatWrapping; clothNormal.repeat.set(6, 8);
      cloth.normalMap = clothNormal; cloth.normalScale.set(0.35, 0.35);
    }
    const coverTop = cloth.clone(); coverTop.map = canvasTex(coverCanvas(), renderer); coverTop.color.set(0xffffff);
    const ep = pages.endpaper('front');
    this.frontEndpaper = ep;
    const epTex = canvasTex(ep.canvas, renderer); epTex.center.set(0.5, 0.5); epTex.rotation = Math.PI;
    const coverInside = new THREE.MeshStandardMaterial({ map: epTex, roughness: 0.9 });
    const coverGeo = new THREE.BoxGeometry(W + O, B, H + 2 * O);
    coverGeo.translate((W + O) / 2, B / 2, 0);
    this.cover = new THREE.Mesh(coverGeo, [cloth, cloth, coverTop, coverInside, cloth, cloth]);
    this.cover.castShadow = this.cover.receiveShadow = true;
    this.cover.userData.cover = true;
    this.coverPivot = new THREE.Group(); this.coverPivot.add(this.cover);
    this.coverTheta = 0; this.coverAnim = null;

    const bp = pages.endpaper('back');
    this.backEndpaper = bp;
    const backInside = new THREE.MeshStandardMaterial({ map: canvasTex(bp.canvas, renderer), roughness: 0.9 });
    const backOut = cloth.clone(); backOut.map = canvasTex(backCoverCanvas(), renderer); backOut.color.set(0xffffff);
    const backGeo = new THREE.BoxGeometry(W + O, B, H + 2 * O); backGeo.translate((W + O) / 2, B / 2, 0);
    this.backBoard = new THREE.Mesh(backGeo, [cloth, cloth, backInside, backOut, cloth, cloth]);
    this.backBoard.castShadow = this.backBoard.receiveShadow = true;
    this.backBoard.userData.backBoard = true;

    const spineH = 2 * B + T + this.nLeaves * EPS + 0.01;
    const spineGeo = new THREE.BoxGeometry(B, spineH, H + 2 * O); spineGeo.translate(-B / 2, spineH / 2, 0);
    this.spine = new THREE.Mesh(spineGeo, cloth); this.spine.castShadow = true;

    // --- page blocks (the bulk of the paper, drawn as boxes with lined edges) ---
    const edgeTex = canvasTex(pageEdgeCanvas(), renderer);
    edgeTex.wrapS = edgeTex.wrapT = THREE.RepeatWrapping;
    const edgeMat = new THREE.MeshStandardMaterial({ map: edgeTex, roughness: 0.95 });
    const topMat = new THREE.MeshStandardMaterial({ color: 0xf2ede0, roughness: 0.95 });
    const blockGeo = new THREE.BoxGeometry(W - 0.01, 1, H - 0.004); blockGeo.translate(0, 0.5, 0);
    const mats = [edgeMat, edgeMat, topMat, topMat, edgeMat, edgeMat];
    this.blockR = new THREE.Mesh(blockGeo, mats); this.blockR.position.x = W / 2 + 0.005;
    this.blockL = new THREE.Mesh(blockGeo, mats); this.blockL.position.x = -W / 2 - 0.005;
    for (const b of [this.blockR, this.blockL]) { b.castShadow = b.receiveShadow = true; b.userData.block = true; }

    this.group.add(this.coverPivot, this.backBoard, this.spine, this.blockR, this.blockL);

    // --- leaves ---
    this.leaves = [];
    for (let i = 0; i < this.nLeaves; i++) {
      const leaf = new Leaf(paperMat, i);
      this.leaves.push(leaf);
      this.group.add(leaf.front, leaf.back);
      this.raycastTargets.push(leaf.front, leaf.back);
    }
    this.raycastTargets.push(this.cover, this.backBoard);

    // --- index tabs ---
    this.tabs = [];
    const n = sections.length, span = H - 0.5, step = span / n;
    sections.forEach((sec, k) => {
      const page = pages.sectionStart[sec.key];
      const leaf = this.leaves[Math.floor(page / 2)];
      const tw = 0.2, th = step - 0.06;
      const g = new THREE.PlaneGeometry(tw, th); g.rotateX(-Math.PI / 2); g.translate(tw / 2, 0, 0);
      const tex = canvasTex(tabCanvas(sec.short, sec.color, tw / th), renderer);
      const backTex = canvasTex(tabCanvas(sec.short, sec.color, tw / th), renderer, { repeatMirror: true });
      const tab = new THREE.Group();
      const mf = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, side: THREE.FrontSide }));
      const mb = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.6, side: THREE.BackSide }));
      for (const m of [mf, mb]) { m.castShadow = true; m.userData.tab = { section: sec.key, page }; this.raycastTargets.push(m); }
      tab.add(mf, mb);
      tab.userData.z = -span / 2 + step * (k + 0.5);
      leaf.tabs.push(tab);
      this.group.add(tab);
      this.tabs.push(tab);
    });

    this.layout();
    this.ensureTextures();
  }

  _blankPageTex() {
    const c = document.createElement('canvas'); c.width = 300; c.height = 400;
    const g = c.getContext('2d'); g.fillStyle = '#f6f2e7'; g.fillRect(0, 0, 300, 400);
    g.fillStyle = 'rgba(76,120,160,.12)';
    for (let x = 0; x < 300; x += 8) g.fillRect(x, 0, 1, 400);
    for (let y = 0; y < 400; y += 8) g.fillRect(0, y, 300, 1);
    g.fillStyle = 'rgba(217,163,160,.8)'; g.fillRect(42, 0, 1, 400);
    return canvasTex(c, this.renderer);
  }

  // ---------- textures (rendered lazily, small LRU so GPU memory stays bounded) ----------
  pageTex(i) {
    if (i < 0 || i >= this.pages.count) return null;
    let e = this.texCache.get(i);
    if (!e) {
      const { canvas, hotspots } = this.pages.render(i);
      e = { tex: canvasTex(canvas, this.renderer, { repeatMirror: i % 2 === 1 }), hotspots };
      this.texCache.set(i, e);
    }
    e.used = performance.now();
    return e;
  }

  ensureTextures(extra = []) {
    const s = this.spread;
    const want = new Set(extra);
    for (let j = s - 3; j <= s + 1; j++) if (j >= 0 && j < this.nLeaves) want.add(j);
    for (const j of want) {
      const f = this.pageTex(2 * j), b = this.pageTex(2 * j + 1);
      this.leaves[j].setTextures(f ? f.tex : this.blankTex, b ? b.tex : this.blankTex);
    }
    // evict
    const LIMIT = this.maxTextures || 10;
    if (this.texCache.size > LIMIT) {
      const keep = new Set([...want].flatMap(j => [2 * j, 2 * j + 1]));
      const old = [...this.texCache.entries()].filter(([i]) => !keep.has(i)).sort((a, b) => a[1].used - b[1].used);
      while (this.texCache.size > LIMIT && old.length) {
        const [i, e] = old.shift();
        const leaf = this.leaves[Math.floor(i / 2)];
        if (i % 2 === 0) leaf.setTextures(this.blankTex, undefined); else leaf.setTextures(undefined, this.blankTex);
        e.tex.dispose(); this.texCache.delete(i);
      }
    }
  }

  hotspotsFor(pageIndex) { const e = this.texCache.get(pageIndex); return e ? e.hotspots : []; }

  // ---------- animation ----------
  animateLeaf(leaf, to, { dur, delay = 0 } = {}) {
    const from = leaf.theta;
    if (Math.abs(to - from) < 1e-4) { leaf.anim = null; return; }
    dur = dur ?? 0.55 + 0.35 * Math.abs(to - from) / Math.PI;
    leaf.anim = { from, to, t: -delay, dur };
  }

  animateCover(to, dur = 1.1, delay = 0) { this.coverAnim = { from: this.coverTheta, to, t: -delay, dur }; }

  // Jump (with page riffle) to a spread index.
  goToSpread(target, { fast = false } = {}) {
    target = Math.max(0, Math.min(this.maxSpread, target));
    const prev = this.spread;
    if (target === prev) return;
    this.spread = target;
    const leafRange = [];
    for (let j = Math.min(prev, target) - 1; j <= Math.max(prev, target); j++) if (j >= 0 && j < this.nLeaves) leafRange.push(j);
    this.ensureTextures(leafRange);
    if (target >= 1 && this.coverTheta < Math.PI - 1e-3 && !(this.coverAnim && this.coverAnim.to === Math.PI)) this.animateCover(Math.PI);
    const many = Math.abs(target - prev) > 1;
    const order = target > prev ? this.leaves : [...this.leaves].reverse();
    const coverDelay = prev === 0 && target > 1 ? 0.6 : 0;
    let k = 0;
    for (const leaf of order) {
      const want = leaf.index < target - 1 ? Math.PI : 0;
      if (Math.abs(leaf.theta - want) < 1e-4 && !leaf.anim) continue;
      if (many || fast) this.animateLeaf(leaf, want, { dur: 0.6, delay: coverDelay + 0.09 * k++ });
      else this.animateLeaf(leaf, want);
    }
    if (target === 0) this.animateCover(0, 1.0, prev > 1 ? 0.6 + 0.09 * k : 0);
    this.onSpreadChange(this.spread);
  }

  next() { this.goToSpread(this.spread + 1); }
  prev() { this.goToSpread(this.spread - 1); }

  spreadForPage(p) { return p % 2 === 0 ? p / 2 + 1 : (p + 1) / 2; }
  goToPage(p) { this.goToSpread(this.spreadForPage(p)); }

  // Pages visible for the current spread: [leftPage, rightPage] (null = endpaper/none)
  visiblePages(s = this.spread) {
    if (s === 0) return [null, null];
    const left = s - 2 >= 0 ? 2 * (s - 2) + 1 : null;
    const right = 2 * (s - 1) < this.pages.count ? 2 * (s - 1) : null;
    return [left, right];
  }

  get openAmount() { return this.coverTheta / Math.PI; }
  get busy() { return !!this.coverAnim || this.leaves.some(l => l.anim) || !!this.dragging; }

  tick(dt) {
    if (this.coverAnim) {
      const a = this.coverAnim; a.t += dt;
      const u = Math.min(1, Math.max(0, a.t / a.dur));
      if (a.t >= 0) this.coverTheta = a.from + (a.to - a.from) * easeInOut(u);
      if (u >= 1) this.coverAnim = null;
    }
    for (const l of this.leaves) {
      if (!l.anim) continue;
      const a = l.anim; a.t += dt;
      if (a.t < 0) continue;
      const u = Math.min(1, a.t / a.dur);
      l.theta = a.from + (a.to - a.from) * easeInOut(u);
      if (u >= 1) { l.theta = a.to; l.anim = null; }
    }
    this.layout();
  }

  layout() {
    const N = this.nLeaves;
    let fl = 0; for (const l of this.leaves) fl += l.theta / Math.PI;
    const fracL = fl / N, fracR = 1 - fracL;
    const hR = T * fracR, hL = T * fracL;
    this.blockR.scale.y = Math.max(hR, 1e-4); this.blockR.position.y = B; this.blockR.visible = hR > 0.002;
    this.blockL.scale.y = Math.max(hL, 1e-4); this.blockL.position.y = B; this.blockL.visible = hL > 0.002 && this.coverTheta > 1;
    const baseR = B + hR + 0.002, baseL = B + hL + 0.002;
    for (const l of this.leaves) {
      const yR = baseR + (N - 1 - l.index) * EPS, yL = baseL + l.index * EPS;
      const u = l.theta / Math.PI;
      l.update(yR + (yL - yR) * u);
    }
    // cover: hinge rises with the stack when closed, rests on the desk when open
    const topR = baseR + N * EPS + 0.001;
    const u = this.coverTheta / Math.PI;
    this.coverPivot.position.y = topR + (B - topR) * u;
    this.coverPivot.rotation.z = this.coverTheta;
    this.spine.rotation.z = this.coverTheta / 2;
    // slide the book so whatever is showing stays centred on the desk
    this.group.position.x = -(W / 2) * (1 - u);
  }
}
