// Desk props, modelled procedurally. Some are shortcuts (mug → email, sticky note → resume,
// business card → LinkedIn); the pen is decoration.
import * as THREE from 'three';
import * as C from '../content.js';

const HAND = 'Caveat, cursive', MONO = '"IBM Plex Mono", monospace', SERIF = '"IBM Plex Serif", Georgia, serif';

function tex(canvas, renderer) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function shadowed(obj) { obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return obj; }

// ---------- coffee mug ----------
function mug(renderer) {
  const g = new THREE.Group();
  const R = 0.38, Hh = 0.88, wall = 0.035;
  const pts = [
    [0, 0], [R - 0.04, 0], [R - 0.01, 0.015], [R, 0.05], [R + 0.01, Hh - 0.02], [R + 0.005, Hh],
    [R - wall, Hh], [R - wall - 0.005, 0.1], [R - 0.08, 0.075], [0, 0.07],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  // printed band
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#ece6da'; x.fillRect(0, 0, 1024, 256);
  x.fillStyle = '#8c1515'; x.fillRect(0, 150, 1024, 14);
  x.fillStyle = '#8c1515'; x.font = `600 46px ${SERIF}`; x.textAlign = 'center';
  x.fillText('Stanford', 512, 120);
  x.fillStyle = '#5a6270'; x.font = `500 22px ${MONO}`; x.fillText('BIOENGINEERING', 512, 205);
  const t = tex(c, renderer);
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: t, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), ceramic);
  // lathe UVs run around (u) and along the profile (v); stretch the print over the outer wall only
  // outer wall is profile segment 3→4 of 9, i.e. v in [1/3, 4/9]
  t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(1, 9); t.offset.set(0, -3);
  body.rotation.y = Math.PI;   // print faces the viewer
  g.add(body);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.048, 16, 40, Math.PI * 1.15),
    new THREE.MeshPhysicalMaterial({ color: 0xece6da, roughness: 0.35, clearcoat: 0.6 }));
  handle.rotation.z = -Math.PI / 2 - 0.07 * Math.PI; handle.position.set(R + 0.02, Hh * 0.5, 0);
  g.add(handle);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(R - wall - 0.004, 48),
    new THREE.MeshPhysicalMaterial({ color: 0x2a160b, roughness: 0.12, clearcoat: 1 }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = Hh - 0.12;
  g.add(coffee);

  // steam: a few soft sprites drifting up
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const sx = sc.getContext('2d'), grd = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  sx.fillStyle = grd; sx.fillRect(0, 0, 128, 128);
  const steamTex = new THREE.CanvasTexture(sc);
  const steam = [];
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0 }));
    s.userData.phase = i / 7; s.userData.seed = Math.random() * 10;
    g.add(s); steam.push(s);
  }
  g.userData.tick = (t, hover) => {
    for (const s of steam) {
      const p = (t * 0.12 + s.userData.phase) % 1;
      s.position.set(Math.sin(t * 0.8 + s.userData.seed) * 0.08 * p, Hh + 0.05 + p * 1.1, Math.cos(t * 0.6 + s.userData.seed) * 0.06 * p);
      const sz = 0.18 + p * 0.45; s.scale.set(sz, sz, 1);
      s.material.opacity = Math.sin(p * Math.PI) * (hover ? 0.32 : 0.18);
    }
  };
  g.userData.ignoreRaycast = steam;
  return g;
}

// ---------- sticky note (slightly curled) ----------
function stickyNote(renderer) {
  const S = 0.8, seg = 12;
  const geo = new THREE.PlaneGeometry(S, S, seg, seg); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / S + 0.5, z = p.getZ(i) / S + 0.5;          // 0..1, z=1 is the bottom edge
    const lift = Math.pow(Math.max(0, z - 0.55) / 0.45, 2.2) * 0.07 + Math.pow(Math.max(0, x + z - 1.4) / 0.6, 2) * 0.05;
    p.setY(i, lift);
  }
  geo.computeVertexNormals();
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#f7de6a'; x.fillRect(0, 0, 512, 512);
  x.fillStyle = 'rgba(0,0,0,.05)'; x.fillRect(0, 0, 512, 70);          // glue strip
  for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(120,90,0,${Math.random() * .05})`; x.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
  x.fillStyle = '#1b2636'; x.font = `600 74px ${HAND}`; x.textAlign = 'center';
  x.save(); x.translate(256, 190); x.rotate(-0.05);
  x.fillText('my resume', 0, 0);
  x.fillStyle = '#b8423a'; x.font = `600 92px ${HAND}`; x.fillText('↓ pdf', 0, 110);
  x.fillStyle = '#2b4fa3'; x.font = `600 50px ${HAND}`; x.fillText('(click me)', 0, 200);
  x.restore();
  const mat = new THREE.MeshStandardMaterial({ map: tex(c, renderer), roughness: 0.9, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = 0.006;
  const g = new THREE.Group(); g.add(m);
  // a second note underneath, peeking out
  const under = new THREE.Mesh(new THREE.PlaneGeometry(S, S).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf2a6a0, roughness: 0.9 }));
  under.position.set(0.06, 0.003, -0.05); under.rotation.y = 0.18; g.add(under);
  return g;
}

// ---------- business card ----------
function businessCard(renderer) {
  const c = document.createElement('canvas'); c.width = 900; c.height = 520;
  const x = c.getContext('2d');
  x.fillStyle = '#f8f6f0'; x.fillRect(0, 0, 900, 520);
  x.fillStyle = '#8c1515'; x.fillRect(0, 0, 18, 520);
  x.fillStyle = '#1b2636'; x.font = `600 76px ${SERIF}`; x.fillText('Keyi Yu', 70, 150);
  x.fillStyle = '#5a6270'; x.font = `italic 400 36px ${SERIF}`; x.fillText('Healthcare AI · Stanford Bioengineering', 70, 210);
  x.fillStyle = '#b8423a'; x.fillRect(70, 250, 120, 4);
  x.fillStyle = '#2b4fa3'; x.font = `500 30px ${MONO}`;
  x.fillText('in/keyiyu03', 70, 340);
  x.fillText('github.com/keyiyu0331', 70, 390);
  x.fillText('keyiyu@stanford.edu', 70, 440);
  const face = new THREE.MeshStandardMaterial({ map: tex(c, renderer), roughness: 0.75 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.8 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.012, 0.52), [edge, edge, face, edge, edge, edge]);
  m.position.y = 0.006;
  const g = new THREE.Group(); g.add(m);
  return g;
}

// ---------- fountain pen ----------
function pen() {
  const g = new THREE.Group();
  const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x0f1d33, roughness: 0.18, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd4a94f, roughness: 0.25, metalness: 1 });
  const r = 0.055;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, 0.82, 32), lacquer); barrel.position.y = 0.41;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.06, 0.62, 32), lacquer); cap.position.y = 0.82 + 0.31 - 0.02;
  const capEnd = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lacquer); capEnd.position.y = 1.42;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.08, 0.035, 32), gold); ring.position.y = 0.82;
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.42, 0.03), gold); clip.position.set(0, 1.18, r * 1.1 + 0.012);
  const section = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.6, 0.14, 32), lacquer); section.position.y = -0.07;
  const nib = new THREE.Mesh(new THREE.ConeGeometry(r * 0.6, 0.16, 24), gold); nib.rotation.x = Math.PI; nib.position.y = -0.22;
  g.add(barrel, cap, capEnd, ring, clip, section, nib);
  // lay it down: axis along X, resting on the desk
  const holder = new THREE.Group(); g.rotation.z = Math.PI / 2; g.position.y = r * 1.06; holder.add(g);
  return holder;
}

// ---------- assemble ----------
export function buildProps(scene, renderer) {
  const items = [];
  const place = (obj, { x, z, rotY = 0, prop }) => {
    obj.position.set(x, 0, z); obj.rotation.y = rotY;
    obj.userData.baseY = 0; obj.userData.lift = 0; obj.userData.prop = prop || null;
    shadowed(obj);
    if (prop) obj.traverse(o => { if (o.isMesh) o.userData.prop = { ...prop, root: obj }; });
    scene.add(obj); items.push(obj);
    return obj;
  };

  place(mug(renderer), { x: 3.05, z: -1.05, rotY: -0.3, prop: { href: C.EMAIL, label: 'email me ✉' } });
  place(stickyNote(renderer), { x: -3.0, z: 1.05, rotY: 0.16, prop: { href: C.RESUME, label: 'open resume.pdf ↓' } });
  place(businessCard(renderer), { x: -3.05, z: -0.85, rotY: -0.22, prop: { href: C.LINKEDIN, label: 'LinkedIn ↗' } });
  place(pen(), { x: 3.0, z: 0.95, rotY: 0.75 });

  // steam sprites shouldn't catch clicks
  const targets = [];
  for (const it of items) it.traverse(o => { if (o.isMesh && o.userData.prop) targets.push(o); });

  let hovered = null;
  return {
    targets,
    setHover(root) { hovered = root; },
    tick(dt, t) {
      for (const it of items) {
        const want = it === hovered ? 1 : 0;
        it.userData.lift += (want - it.userData.lift) * Math.min(1, dt * 10);
        const l = it.userData.lift;
        it.position.y = l * 0.06;
        it.rotation.x = l * -0.04;
        if (it.userData.tick) it.userData.tick(t, it === hovered);
      }
    },
  };
}
