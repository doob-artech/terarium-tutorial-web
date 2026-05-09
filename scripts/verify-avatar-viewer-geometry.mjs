import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { deinterleaveGeometry, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

globalThis.ProgressEvent ??= class ProgressEvent extends Event {
  constructor(type, options = {}) {
    super(type);
    this.lengthComputable = Boolean(options.lengthComputable);
    this.loaded = options.loaded ?? 0;
    this.total = options.total ?? 0;
  }
};

globalThis.self ??= globalThis;

THREE.LoaderUtils.extractUrlBase = (url) => {
  const value = String(url || '');
  const index = value.lastIndexOf('/');
  return index === -1 ? './' : value.slice(0, index + 1);
};

const loadArrayBuffer = async (url) => {
  const filePath = fileURLToPath(url);
  const buffer = await readFile(filePath);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

const smoothGeometryNormals = (geometry) => {
  if (!geometry?.attributes?.position) return geometry;
  const workingGeometry = geometry.clone();
  const hasInterleavedAttributes = Object.values(workingGeometry.attributes).some(
    (attribute) => attribute?.isInterleavedBufferAttribute,
  );
  if (hasInterleavedAttributes) {
    deinterleaveGeometry(workingGeometry);
  }
  const mergedGeometry = mergeVertices(workingGeometry, 0.0001);
  mergedGeometry.computeVertexNormals();
  workingGeometry.dispose();
  return mergedGeometry;
};

const filePath = process.argv[2];
if (!filePath) {
  throw new Error('Usage: node scripts/verify-avatar-viewer-geometry.mjs <avatar.glb>');
}

const url = pathToFileURL(filePath).href;
const arrayBuffer = await loadArrayBuffer(url);
const loader = new GLTFLoader();
const gltf = await new Promise((resolve, reject) => {
  loader.parse(arrayBuffer, THREE.LoaderUtils.extractUrlBase(url), resolve, reject);
});

let meshCount = 0;
gltf.scene.traverse((child) => {
  if (!child.isMesh) return;
  meshCount += 1;
  const smoothed = smoothGeometryNormals(child.geometry);
  smoothed.dispose();
});

console.log(`verified ${meshCount} avatar meshes`);
