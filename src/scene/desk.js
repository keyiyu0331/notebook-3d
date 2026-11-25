// Wooden desk, lamp light and environment.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function buildDesk(scene, renderer, { quality = 'high' } = {}) {
  const base = import.meta.env.BASE_URL + 'assets/';
  const loader = new THREE.TextureLoader();
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const load = (f, srgb) => loader.load(base + f, t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.anisotropy = aniso;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  });

  const deskMat = new THREE.MeshStandardMaterial({
    map: load('wood_diff_2k.jpg', true),
    normalMap: load('wood_nor_gl_2k.jpg'),
    roughnessMap: load('wood_rough_2k.jpg'),
    color: 0xb8a48e, roughness: 1, metalness: 0,
  });
  deskMat.normalScale.set(0.6, 0.6);
  deskMat.envMapIntensity = 0.6;
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), deskMat);
  desk.rotation.x = -Math.PI / 2;
  desk.receiveShadow = true;
  desk.userData.desk = true;
  scene.add(desk);

  // environment for soft reflections / fill
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.28;
  scene.background = new THREE.Color(0x0e0b09);
  scene.fog = new THREE.Fog(0x0e0b09, 14, 26);

  // warm desk-lamp key light
  const lamp = new THREE.SpotLight(0xffd6a0, 170, 30, 0.7, 0.85, 1.6);
  lamp.position.set(-4.2, 8.5, -2.8);
  lamp.target.position.set(0.3, 0, 0.4);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
  lamp.shadow.bias = -0.00015;
  lamp.shadow.normalBias = 0.015;
  lamp.shadow.radius = 4;
  lamp.shadow.camera.near = 4; lamp.shadow.camera.far = 18;
  scene.add(lamp, lamp.target);

  // cool bounce from the room
  const hemi = new THREE.HemisphereLight(0xaebfe0, 0x3b2a1c, 0.45);
  scene.add(hemi);

  // faint rim from the window side
  const rim = new THREE.DirectionalLight(0x9fb7ff, 0.35);
  rim.position.set(6, 5, -6);
  scene.add(rim);

  return { desk, lamp };
}
