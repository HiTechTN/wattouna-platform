/* Wattouna 3D Mechanical Viewer engine — TypeScript source of truth.
   Compiled via:
     npx esbuild src/lib/three-viewer.ts --bundle --format=esm --minify --outfile=public/vendor/three-viewer.js
   three.js + STLLoader + OrbitControls bundled (self-hosted, offline PWA).
   Lazy-loaded by /projects/[slug] only on user click. */
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface BBox { x: number; y: number; z: number }
export interface Measured { facets: number; bbox: BBox }

export function measure(geo: THREE.BufferGeometry): Measured {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  return {
    facets: Math.floor(pos.count / 3),
    bbox: {
      x: bb.max.x - bb.min.x,
      y: bb.max.y - bb.min.y,
      z: bb.max.z - bb.min.z,
    },
  };
}

/** Parse STL bytes (ASCII or binary) → geometry. Pure, DOM-free, testable. */
export function parseStl(data: ArrayBuffer): THREE.BufferGeometry {
  return new STLLoader().parse(data);
}

export async function parseStlFromUrl(url: string, onProgress?: (p: number) => void): Promise<THREE.BufferGeometry> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`stl-http-${res.status}`);
  const total = Number(res.headers.get('content-length') || 0);
  const reader = res.body?.getReader();
  if (!reader || !total) {
    onProgress?.(0.5);
    return parseStl(await res.arrayBuffer());
  }
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onProgress?.(got / total);
  }
  const buf = new Uint8Array(got);
  let o = 0;
  for (const c of chunks) { buf.set(c, o); o += c.length; }
  return parseStl(buf.buffer as ArrayBuffer);
}

export interface ViewerHandle {
  loadUrl(url: string, onProgress?: (p: number) => void): Promise<Measured>;
  setWireframe(b: boolean): void;
  setColor(hex: string): void;
  dispose(): void;
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Mount studio scene into container. Throws if WebGL unavailable. */
export function mountViewer(container: HTMLElement): ViewerHandle {
  if (!webglAvailable()) throw new Error('no-webgl');
  const W = () => container.clientWidth || 640;
  const H = () => Math.round(W() * 0.625);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(W(), H());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W() / H(), 1, 5000);
  camera.position.set(260, 220, 320);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(220, 320, 180);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x38bdf8, 0.5);
  rim.position.set(-200, 120, -220);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.ShadowMaterial({ opacity: 0.35 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.9;
  renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; }, { once: true });

  const mat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, metalness: 0.25, roughness: 0.55,
  });
  let mesh: THREE.Mesh | null = null;
  let raf = 0;
  let dead = false;

  function frame() {
    if (dead) return;
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  frame();

  function onResize() {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  }
  window.addEventListener('resize', onResize);

  async function loadUrl(url: string, onProgress?: (p: number) => void): Promise<Measured> {
    const geo = await parseStlFromUrl(url, onProgress);
    geo.center();
    geo.computeVertexNormals();
    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
    }
    mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const m = measure(geo);
    const r = Math.max(m.bbox.x, m.bbox.y, m.bbox.z);
    ground.position.y = -m.bbox.y / 2 - 1;
    camera.position.set(r * 1.35, r * 1.1, r * 1.6);
    controls.target.set(0, 0, 0);
    controls.update();
    return m;
  }

  return {
    loadUrl,
    setWireframe(b: boolean) { mat.wireframe = b; },
    setColor(hex: string) { mat.color.set(hex); },
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      if (mesh) mesh.geometry.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
