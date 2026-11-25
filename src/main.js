import * as THREE from 'three';
import { buildDesk } from './scene/desk.js';
import { buildProps } from './scene/props.js';
import { Notebook, W, H } from './scene/notebook.js';
import { buildPageList, loadFonts, PW, PH } from './pages/render.js';
import { buildA11y } from './ui/a11y.js';
import * as C from './content.js';

const $ = id => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = () => innerWidth < 760;

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

buildA11y($('a11y'));
$('resumeBtn').href = C.RESUME;

if (!hasWebGL()) {
  $('nogl').classList.add('show');
  $('loading').classList.add('done');
} else {
  start();
}

async function start() {
  await loadFonts();
  const canvas = $('gl');
  const mobile = matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 900;
  const quality = mobile ? 'low' : 'high';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.75 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 60);
  buildDesk(scene, renderer, { quality });
  const props = buildProps(scene, renderer);

  const clothNormal = new THREE.TextureLoader().load(import.meta.env.BASE_URL + 'assets/cloth_nor_1k.jpg');
  const pages = buildPageList();
  const book = new Notebook({ renderer, pages, sections: C.sections, clothNormal });
  book.maxTextures = mobile ? 6 : 10;
  scene.add(book.group);

  // ---------------- camera rig ----------------
  const rig = { mode: 'closed', pos: new THREE.Vector3(), tgt: new THREE.Vector3(), curPos: new THREE.Vector3(), curTgt: new THREE.Vector3(), focus: 0 };
  const tmpV = new THREE.Vector3();
  function viewFor(mode) {
    const aspect = innerWidth / innerHeight, tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let w, h, elev, tx = 0, tz = 0;
    if (mode === 'closed') { w = W + 1.6; h = H + 1.6; elev = 58; tz = 0.15; }
    else if (mode === 'read') {
      if (isSmall()) { w = W + 0.15; h = H + 0.2; tx = rig.focus * W / 2; }
      else { w = 2 * W + 0.25; h = H + 0.3; }
      elev = 82;
    } else {
      if (isSmall()) { w = W + 0.5; h = H + 0.9; tx = rig.focus * W / 2; }
      else { w = 2 * W + 2.6; h = H + 1.5; }
      elev = 64; tz = 0.25;
    }
    const d = Math.max(h / (2 * tan), w / (2 * tan * aspect)) * (mode === 'read' ? 1.0 : 1.04);
    const e = THREE.MathUtils.degToRad(elev);
    return { pos: new THREE.Vector3(tx, d * Math.sin(e), tz + d * Math.cos(e)), tgt: new THREE.Vector3(tx, 0, tz * 0.4) };
  }
  function setMode(mode) {
    rig.mode = mode;
    const v = viewFor(mode); rig.pos.copy(v.pos); rig.tgt.copy(v.tgt);
    $('zoom').setAttribute('aria-pressed', mode === 'read');
    $('zoom').textContent = mode === 'read' ? 'overview' : 'read';
  }
  setMode('closed');
  // start a bit further out for an establishing move
  rig.curPos.copy(rig.pos).multiplyScalar(1.35).add(new THREE.Vector3(1.5, 0.5, 0));
  rig.curTgt.copy(rig.tgt);

  // ---------------- HUD ----------------
  function updateHud() {
    const s = book.spread;
    $('hud').classList.toggle('hidden', s === 0);
    $('hint').classList.toggle('hidden', s !== 0 || hintDismissed);
    $('prev').disabled = s <= 0;
    $('next').disabled = s >= book.maxSpread;
    const [l, r] = book.visiblePages(s);
    const ref = r ?? l;
    const sec = ref != null ? pages.sectionOf(ref) : null;
    const pn = [l, r].filter(x => x != null).map(x => x + 1);
    const pgTxt = pn.length ? 'p. ' + pn.join('–') : '';
    $('where').innerHTML = s === 0 ? '' : (sec ? `<b>${sec.mark} ${sec.label}</b> · ${pgTxt}` : `<b>Keyi Yu</b> · ${pgTxt || 'cover'}`);
    if (isSmall() && s > 0) { rig.focus = r != null ? 1 : -1; setMode(rig.mode); }
  }
  let hintDismissed = false;
  book.onSpreadChange = (s) => {
    if (s === 0) setMode('closed'); else if (rig.mode === 'closed') setMode('open');
    updateHud();
  };
  $('prev').onclick = () => smallAwarePrev();
  $('next').onclick = () => smallAwareNext();
  $('zoom').onclick = () => { if (book.spread > 0) setMode(rig.mode === 'read' ? 'open' : 'read'); };
  $('close').onclick = () => book.goToSpread(0);

  // On phones one page is framed at a time: step through left/right pages before turning.
  function smallAwareNext() {
    if (isSmall() && book.spread > 0 && rig.focus < 0) { const [, r] = book.visiblePages(); if (r != null) { rig.focus = 1; setMode(rig.mode); return; } }
    book.next();
    if (isSmall()) { rig.focus = book.visiblePages()[0] != null ? -1 : 1; setMode(rig.mode); }
  }
  function smallAwarePrev() {
    if (isSmall() && book.spread > 0 && rig.focus > 0) { const [l] = book.visiblePages(); if (l != null) { rig.focus = -1; setMode(rig.mode); return; } }
    book.prev();
    if (isSmall()) { rig.focus = book.visiblePages()[1] != null ? 1 : -1; setMode(rig.mode); }
  }

  // ---------------- picking ----------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const deskPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2);
  const pickTargets = [...book.raycastTargets, ...props.targets];
  function pick(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickTargets, false);
    return hits[0] || null;
  }
  function localX(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const p = ray.ray.intersectPlane(deskPlane, tmpV);
    return p ? p.x - book.group.position.x : null;
  }
  // Which interactive thing is under the pointer?
  function classify(hit) {
    if (!hit) return null;
    const o = hit.object, s = book.spread;
    if (o.userData.prop) return { kind: 'prop', prop: o.userData.prop };
    if (o.userData.tab) return { kind: 'tab', page: o.userData.tab.page };
    if (o.userData.cover) {
      if (s === 0) return { kind: 'cover' };
      if (s === 1 && hit.face && hit.face.normal.y < -0.5) return { kind: 'page', side: 'left', page: 'front-endpaper', hit };
      return null;
    }
    if (o.userData.backBoard) return s === book.maxSpread ? { kind: 'page', side: 'right', page: 'back-endpaper', hit } : null;
    const leaf = o.userData.leaf;
    if (!leaf || leaf.anim) return null;
    if (o.userData.face === 'front' && leaf.index === s - 1 && leaf.theta < 1e-3) return { kind: 'page', side: 'right', leaf, page: 2 * leaf.index, hit };
    if (o.userData.face === 'back' && leaf.index === s - 2 && leaf.theta > Math.PI - 1e-3) return { kind: 'page', side: 'left', leaf, page: 2 * leaf.index + 1, hit };
    return null;
  }
  function hotspotAt(info) {
    if (!info || info.kind !== 'page' || !info.hit.uv) return null;
    let list, u = info.hit.uv.x, v = info.hit.uv.y, cw = PW, ch = PH;
    if (info.page === 'front-endpaper') { list = book.frontEndpaper.hotspots; u = 1 - u; }
    else if (info.page === 'back-endpaper') list = book.backEndpaper.hotspots;
    else { list = book.hotspotsFor(info.page); if (info.side === 'left') u = 1 - u; }
    const x = u * cw, y = (1 - v) * ch;
    return list.find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) || null;
  }
  function follow(href) {
    if (href.startsWith('#page:')) { book.goToPage(+href.slice(6)); if (isSmall()) { rig.focus = (+href.slice(6)) % 2 === 0 ? 1 : -1; setMode(rig.mode); } return; }
    if (href.startsWith('mailto:')) { location.href = href; return; }
    window.open(href, '_blank', 'noopener');
  }

  // ---------------- pointer: click, drag-to-flip, hover ----------------
  let down = null;
  canvas.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    const info = classify(pick(ev));
    down = { x: ev.clientX, y: ev.clientY, info, lx: localX(ev), dragging: false, samples: [] };
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', ev => {
    pointer.x = (ev.clientX / innerWidth) * 2 - 1; pointer.y = (ev.clientY / innerHeight) * 2 - 1;
    if (!down) { hover(ev); return; }
    const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y);
    const info = down.info;
    if (!down.dragging && moved > 8 && info && info.kind === 'page' && info.leaf && !book.busy && down.lx != null) {
      down.dragging = true; book.dragging = true; info.leaf.curl = 1.15;
      canvas.style.cursor = 'grabbing';
    }
    if (down.dragging) {
      const x = localX(ev); if (x == null) return;
      const x0 = down.lx, leaf = info.leaf;
      let xe;
      if (info.side === 'right') xe = W - (x0 - x) * (2 * W) / Math.max(0.4, x0 + W);
      else xe = -W + (x - x0) * (2 * W) / Math.max(0.4, W - x0);
      leaf.theta = Math.acos(THREE.MathUtils.clamp(xe / W, -1, 1));
      down.samples.push([performance.now(), leaf.theta]); if (down.samples.length > 6) down.samples.shift();
    }
  });
  const endPointer = ev => {
    if (!down) return;
    const d = down; down = null;
    if (d.dragging) {
      const leaf = d.info.leaf; book.dragging = false; leaf.curl = 1;
      let vel = 0; const sm = d.samples;
      if (sm.length > 1) { const [t0, a0] = sm[0], [t1, a1] = sm[sm.length - 1]; vel = (a1 - a0) / Math.max(1, t1 - t0) * 1000; }
      const flip = leaf.theta + vel * 0.12 > Math.PI / 2;
      book.animateLeaf(leaf, flip ? Math.PI : 0, { dur: 0.45 });
      if (flip !== (d.info.side === 'left')) {
        // spread changes by one; the leaf animation is already running
        book.spread += d.info.side === 'right' ? 1 : -1;
        book.ensureTextures(); book.onSpreadChange(book.spread);
        if (isSmall()) { rig.focus = d.info.side === 'right' ? -1 : 1; setMode(rig.mode); }
      }
      canvas.style.cursor = '';
      dismissHint();
      return;
    }
    if (ev.type === 'pointercancel') return;
    // a click
    const info = d.info;
    if (!info) return;
    dismissHint();
    if (info.kind === 'prop') { follow(info.prop.href); return; }
    if (info.kind === 'cover') { book.goToSpread(1); return; }
    if (info.kind === 'tab') { follow('#page:' + info.page); return; }
    if (info.kind === 'page') {
      const hs = hotspotAt(info);
      if (hs) { follow(hs.href); return; }
      if (isSmall()) { info.side === 'right' ? smallAwareNext() : smallAwarePrev(); return; }
      if (info.side === 'right') book.next(); else book.prev();
    }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  let hoverQueued = null;
  function hover(ev) { hoverQueued = ev; }
  const tip = $('tip');
  function doHover() {
    if (!hoverQueued) return;
    const ev = hoverQueued, info = classify(pick(ev)); hoverQueued = null;
    let cur = '', label = '';
    if (info) {
      if (info.kind === 'prop') { cur = 'pointer'; label = info.prop.label; }
      else if (info.kind === 'cover' || info.kind === 'tab' || hotspotAt(info)) cur = 'pointer';
      else if (info.kind === 'page') cur = info.leaf ? 'grab' : 'pointer';
    }
    props.setHover(info && info.kind === 'prop' ? info.prop.root : null);
    canvas.style.cursor = cur;
    tip.textContent = label; tip.classList.toggle('show', !!label);
    if (label) { tip.style.left = ev.clientX + 'px'; tip.style.top = ev.clientY + 'px'; }
  }
  function dismissHint() { hintDismissed = true; $('hint').classList.add('hidden'); }

  // keyboard + wheel
  addEventListener('keydown', ev => {
    if (ev.target.closest && ev.target.closest('a, button') && (ev.key === 'Enter' || ev.key === ' ')) return;
    if (ev.key === 'ArrowRight' || ev.key === 'PageDown' || ev.key === ' ') { ev.preventDefault(); smallAwareNext(); dismissHint(); }
    else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); smallAwarePrev(); }
    else if (ev.key === 'Home') book.goToSpread(1);
    else if (ev.key === 'End') book.goToSpread(book.maxSpread);
    else if (ev.key === 'z' || ev.key === 'Z') $('zoom').click();
    else if (ev.key === 'Escape' && rig.mode === 'read') setMode('open');
  });
  let wheelLock = 0;
  canvas.addEventListener('wheel', ev => {
    ev.preventDefault();
    if (book.spread === 0 || performance.now() < wheelLock) return;
    if (ev.deltaY < -4 && rig.mode !== 'read') { setMode('read'); wheelLock = performance.now() + 500; }
    else if (ev.deltaY > 4 && rig.mode === 'read') { setMode('open'); wheelLock = performance.now() + 500; }
  }, { passive: false });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    setMode(rig.mode);
  });

  // ---------------- loop ----------------
  const pointer = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  updateHud();
  function frame() {
    const dt = Math.min(clock.getDelta(), 1 / 20);
    book.tick(reduceMotion ? 10 : dt);
    props.tick(dt, clock.elapsedTime);
    const k = 1 - Math.exp(-dt * (reduceMotion ? 60 : 3.2));
    rig.curPos.lerp(rig.pos, k); rig.curTgt.lerp(rig.tgt, k);
    // gentle parallax (none while reading)
    const par = reduceMotion || rig.mode === 'read' ? 0 : 0.35;
    camera.position.copy(rig.curPos).add(tmpV.set(pointer.x * par, 0, pointer.y * par * 0.6));
    camera.lookAt(rig.curTgt);
    doHover();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
  requestAnimationFrame(() => $('loading').classList.add('done'));

  // debug handle for development
  window.__nb = { book, props, setMode, rig, renderer, scene, camera };
}
