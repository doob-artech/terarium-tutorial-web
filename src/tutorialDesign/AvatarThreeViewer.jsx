import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { deinterleaveGeometry, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const SOFT_SHADOW_TEXTURE = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 124);
  gradient.addColorStop(0, 'rgba(22, 31, 45, 0.28)');
  gradient.addColorStop(0.45, 'rgba(22, 31, 45, 0.14)');
  gradient.addColorStop(1, 'rgba(22, 31, 45, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
})();

const disposeObject = (object) => {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    const materials = Array.isArray(child.material) ? child.material : [child.material].filter(Boolean);
    for (const material of materials) {
      material.dispose();
    }
  });
};

const getRenderRole = (mesh) => {
  const name = `${mesh.name || ''} ${mesh.parent?.name || ''}`.toLowerCase();
  if (/hair|bang/.test(name)) return 'hair';
  if (/cloth|sleeve|shirt|pants|skirt|onepiece|dress|bottom|top|jacket|hoodie|short|long|shoe|sandal/.test(name)) return 'cloth';
  return 'body';
};

const isLoadingBaseBodyMesh = (mesh) => {
  const name = `${mesh.name || ''} ${mesh.parent?.name || ''}`.toLowerCase();
  if (/hair|bang|cloth|sleeve|shirt|pants|skirt|onepiece|dress|bottom|top|jacket|hoodie|short|long|shoe|sandal|glass|necklace|earring|accessory/.test(name)) {
    return false;
  }
  return /body|skin|face|head|arm|hand|leg|neck|torso/.test(name);
};

const makeSoftToonMaterial = (sourceMaterial, { role = 'body', variant = 'avatar' } = {}) => {
  const sourceColor = sourceMaterial?.color?.clone?.() || new THREE.Color(0xffffff);
  const isDarkSource = Math.max(sourceColor.r, sourceColor.g, sourceColor.b) < 0.28;
  const color = variant === 'loadingBase' ? new THREE.Color(0xaeb5bd) : sourceColor.clone();
  const map = sourceMaterial?.map || null;
  if (map) {
    map.colorSpace = THREE.SRGBColorSpace;
  }
  const isBody = role === 'body';
  const isHair = role === 'hair';
  if (variant !== 'loadingBase' && isDarkSource) {
    color.multiplyScalar(isHair ? 0.38 : role === 'cloth' ? 0.55 : 0.72);
  }
  return new THREE.MeshPhongMaterial({
    color,
    map: variant === 'loadingBase' ? null : map,
    specular: new THREE.Color(isHair ? 0x080a0d : isBody ? 0x121820 : 0x263241),
    shininess: isHair ? 3 : isBody ? 7 : 11,
    flatShading: false,
    transparent: Boolean(sourceMaterial?.transparent),
    opacity: sourceMaterial?.opacity ?? 1,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(isHair ? 0x030405 : isBody ? 0x151719 : 0x08090a),
    emissiveIntensity: variant === 'loadingBase' ? 0.12 : isHair ? 0.015 : isBody ? 0.055 : 0.035,
  });
};

const shouldRevealAvatarVariant = (variant) => variant === 'avatarReveal';
const isStaticAvatarVariant = (variant) => variant === 'staticFront';
const isDragDisabledVariant = (variant) => variant === 'loadingBase' || isStaticAvatarVariant(variant);

const applyModelRotation = (modelRoot, variant, rotationState, idleYawOffset = 0) => {
  if (!modelRoot) return;
  modelRoot.rotation.y = isStaticAvatarVariant(variant) ? idleYawOffset : rotationState.yaw + idleYawOffset;
  modelRoot.rotation.x = isStaticAvatarVariant(variant) ? 0 : rotationState.pitch;
};

const smoothGeometryNormals = (geometry, role = 'body') => {
  if (!geometry?.attributes?.position) return geometry;
  try {
    const workingGeometry = geometry.clone();
    const hasInterleavedAttributes = Object.values(workingGeometry.attributes).some(
      (attribute) => attribute?.isInterleavedBufferAttribute,
    );
    if (hasInterleavedAttributes) {
      deinterleaveGeometry(workingGeometry);
    }
    const mergedGeometry = mergeVertices(workingGeometry, 0.0001);
    mergedGeometry.computeVertexNormals();
    computePositionWeldedNormals(mergedGeometry, role === 'hair' ? 0.0022 : 0.00012);
    workingGeometry.dispose();
    geometry.dispose();
    return mergedGeometry;
  } catch (error) {
    console.warn('Avatar geometry smoothing skipped for one mesh.', error);
    geometry.computeVertexNormals();
    if (role === 'hair') {
      computePositionWeldedNormals(geometry, 0.0022);
    }
    return geometry;
  }
};

const vertexPositionHash = (position, index, tolerance) => {
  const multiplier = 1 / tolerance;
  return [
    Math.round(position.getX(index) * multiplier),
    Math.round(position.getY(index) * multiplier),
    Math.round(position.getZ(index) * multiplier),
  ].join(',');
};

const computePositionWeldedNormals = (geometry, tolerance = 0.0001) => {
  const position = geometry.getAttribute('position');
  if (!position || position.count < 3) return;

  const index = geometry.getIndex();
  const normalSums = new Map();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const faceNormal = new THREE.Vector3();

  const getIndex = (value) => (index ? index.getX(value) : value);
  const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(position.count / 3);

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const i0 = getIndex(triangleIndex * 3);
    const i1 = getIndex(triangleIndex * 3 + 1);
    const i2 = getIndex(triangleIndex * 3 + 2);
    a.fromBufferAttribute(position, i0);
    b.fromBufferAttribute(position, i1);
    c.fromBufferAttribute(position, i2);
    cb.subVectors(c, b);
    ab.subVectors(a, b);
    faceNormal.crossVectors(cb, ab);
    if (faceNormal.lengthSq() === 0) continue;
    faceNormal.normalize();

    for (const vertexIndex of [i0, i1, i2]) {
      const hash = vertexPositionHash(position, vertexIndex, tolerance);
      const sum = normalSums.get(hash) || new THREE.Vector3();
      sum.add(faceNormal);
      normalSums.set(hash, sum);
    }
  }

  const normals = new Float32Array(position.count * 3);
  const fallbackNormal = new THREE.Vector3(0, 1, 0);
  for (let vertexIndex = 0; vertexIndex < position.count; vertexIndex += 1) {
    const hash = vertexPositionHash(position, vertexIndex, tolerance);
    const normal = normalSums.get(hash) || fallbackNormal;
    if (normal.lengthSq() > 0) {
      normal.normalize();
    }
    normals[vertexIndex * 3] = normal.x;
    normals[vertexIndex * 3 + 1] = normal.y;
    normals[vertexIndex * 3 + 2] = normal.z;
  }
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
};

const getRenderOrder = (role) => {
  if (role === 'hair') return 4;
  if (role === 'cloth') return 3;
  return 1;
};

const getRevealDelay = (role, meshIndex) => {
  if (role === 'body') return meshIndex * 70;
  if (role === 'cloth') return 240 + meshIndex * 75;
  if (role === 'hair') return 460 + meshIndex * 85;
  return 340 + meshIndex * 80;
};

const createOutlineGroup = (sourceScene) => {
  const outline = sourceScene.clone(true);
  outline.traverse((child) => {
    if (!child.isMesh) return;
    const role = getRenderRole(child);
    child.material = new THREE.MeshBasicMaterial({
      color: role === 'cloth' ? 0x334052 : 0x243041,
      side: THREE.BackSide,
      transparent: true,
      opacity: role === 'cloth' ? 0.42 : role === 'hair' ? 0.56 : 0.48,
      depthWrite: false,
      depthTest: true,
    });
    child.renderOrder = 0;
  });
  return outline;
};

const createSoftShadowPlane = (object) => {
  if (!SOFT_SHADOW_TEXTURE) {
    return new THREE.Group();
  }
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.x, size.z, size.y * 0.42) || 1;
  const geometry = new THREE.PlaneGeometry(radius * 1.45, radius * 0.78);
  const material = new THREE.MeshBasicMaterial({
    map: SOFT_SHADOW_TEXTURE,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const shadow = new THREE.Mesh(geometry, material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(center.x, box.min.y + 0.012, center.z);
  shadow.renderOrder = -1;
  return shadow;
};

const fitCameraToObject = (camera, object, controlsTarget, distanceMultiplier = 1.82, fitFullBounds = false) => {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z) || 1;
  let distance = maxSize * distanceMultiplier;
  if (fitFullBounds) {
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const heightDistance = size.y / (2 * Math.tan(verticalFov / 2));
    const widthDistance = size.x / (2 * Math.tan(horizontalFov / 2));
    const depthPadding = Math.max(size.z, maxSize * 0.12);
    distance = Math.max(heightDistance, widthDistance, maxSize * 0.8) * distanceMultiplier + depthPadding;
  }

  controlsTarget.copy(center);
  camera.position.set(center.x, center.y + maxSize * 0.12, center.z + distance);
  camera.lookAt(center.x, center.y + maxSize * 0.08, center.z);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
};

const AvatarThreeViewer = ({
  src = '',
  alt = '',
  className = '',
  style = null,
  variant = 'avatar',
  distanceMultiplier = 1.82,
  fitFullBounds = false,
  initialYaw = 0,
  idleSway = false,
  onRotationChange = null,
  onReady = null,
}) => {
  const mountRef = useRef(null);
  const initialYawRef = useRef(initialYaw);
  const onReadyRef = useRef(onReady);
  const onRotationChangeRef = useRef(onRotationChange);
  const [loadState, setLoadState] = useState(src ? 'loading' : 'empty');

  useEffect(() => {
    initialYawRef.current = initialYaw;
  }, [initialYaw]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onRotationChangeRef.current = onRotationChange;
  }, [onRotationChange]);

  useEffect(() => {
    const mount = mountRef.current;
    setLoadState(src ? 'loading' : 'empty');
    if (!mount || !src) return undefined;

    let disposed = false;
    let frameId = 0;
    let modelRoot = null;
    const rotationState = {
      yaw: Number.isFinite(initialYawRef.current) ? initialYawRef.current : 0,
      pitch: 0,
      isDragging: false,
      pointerId: null,
      lastX: 0,
      lastY: 0,
      lastInteractionAt: 0,
      velocityX: 0,
      velocityY: 0,
      lastRotationNotifyAt: 0,
    };
    const target = new THREE.Vector3();

    let scene;
    let camera;
    let renderer;
    let resizeObserver;

    try {
      scene = new THREE.Scene();
      scene.background = null;

      camera = new THREE.PerspectiveCamera(28, 1, 0.01, 1000);
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: Boolean(onReadyRef.current),
      });
    } catch (error) {
      console.error('Avatar viewer failed to initialize WebGL.', error);
      setLoadState('error');
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = variant === 'staticFront' ? 1.28 : 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 180ms ease';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = isDragDisabledVariant(variant) ? 'default' : 'grab';
    mount.appendChild(renderer.domElement);

    const handlePointerDown = (event) => {
      if (isDragDisabledVariant(variant)) return;
      rotationState.isDragging = true;
      rotationState.pointerId = event.pointerId;
      rotationState.lastX = event.clientX;
      rotationState.lastY = event.clientY;
      rotationState.velocityX = 0;
      rotationState.velocityY = 0;
      rotationState.lastInteractionAt = performance.now();
      renderer.domElement.style.cursor = 'grabbing';
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
      if (!rotationState.isDragging || rotationState.pointerId !== event.pointerId) return;
      const dx = event.clientX - rotationState.lastX;
      const dy = event.clientY - rotationState.lastY;
      rotationState.lastX = event.clientX;
      rotationState.lastY = event.clientY;
      rotationState.yaw += dx * 0.008;
      rotationState.pitch = THREE.MathUtils.clamp(rotationState.pitch + dy * 0.006, -0.42, 0.32);
      rotationState.velocityX = dx * 0.0009;
      rotationState.velocityY = dy * 0.0007;
      rotationState.lastInteractionAt = performance.now();
    };

    const endDrag = (event) => {
      if (rotationState.pointerId !== event.pointerId) return;
      rotationState.isDragging = false;
      rotationState.pointerId = null;
      rotationState.lastInteractionAt = performance.now();
      renderer.domElement.style.cursor = isDragDisabledVariant(variant) ? 'default' : 'grab';
      renderer.domElement.releasePointerCapture?.(event.pointerId);
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', endDrag);
    renderer.domElement.addEventListener('pointercancel', endDrag);

    const ambientLight = new THREE.HemisphereLight(
      0xffffff,
      0xb8c7dc,
      variant === 'staticFront' ? 3.05 : variant === 'loadingBase' ? 2.8 : 2.55,
    );
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, variant === 'staticFront' ? 3.15 : 2.6);
    keyLight.position.set(variant === 'staticFront' ? 1.2 : 3.5, variant === 'staticFront' ? 3.4 : 5.2, 4.4);
    keyLight.castShadow = true;
    keyLight.shadow.radius = 7;
    keyLight.shadow.blurSamples = 16;
    keyLight.shadow.mapSize.set(2048, 2048);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9fd1fc, 1.25);
    rimLight.position.set(-4.5, 3.2, -3.6);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xfff1cd, variant === 'staticFront' ? 1.75 : 1.05);
    fillLight.position.set(-1.1, variant === 'staticFront' ? 2.5 : 1.8, 3.4);
    scene.add(fillLight);

    if (variant === 'staticFront') {
      const faceLight = new THREE.PointLight(0xffffff, 1.35, 5.2, 1.8);
      faceLight.position.set(0, 1.2, 2.2);
      scene.add(faceLight);
    }

    const resize = () => {
      if (!mount) return;
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const loader = new GLTFLoader();
    loader.load(
      src,
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }

        modelRoot = new THREE.Group();
        const model = gltf.scene;
        const revealStartAt = performance.now();
        let revealMeshIndex = 0;
        if (variant === 'loadingBase') {
          const removeNodes = [];
          model.traverse((child) => {
            if (child.isMesh && !isLoadingBaseBodyMesh(child)) {
              removeNodes.push(child);
            }
          });
          for (const child of removeNodes) {
            child.parent?.remove(child);
            disposeObject(child);
          }
        }
        model.traverse((child) => {
          if (!child.isMesh) return;
          const renderRole = getRenderRole(child);
          try {
            child.geometry = smoothGeometryNormals(child.geometry, renderRole);
          } catch (error) {
            console.warn('Avatar mesh preparation skipped for one mesh.', error);
          }
          child.castShadow = true;
          child.receiveShadow = true;
          child.renderOrder = getRenderOrder(renderRole);
          const materials = Array.isArray(child.material) ? child.material : [child.material].filter(Boolean);
          child.material = materials.length > 1
            ? materials.map((material) => makeSoftToonMaterial(material, { role: renderRole, variant }))
            : makeSoftToonMaterial(materials[0], { role: renderRole, variant });
          if (shouldRevealAvatarVariant(variant)) {
            const childMaterials = Array.isArray(child.material) ? child.material : [child.material].filter(Boolean);
            const revealDelay = getRevealDelay(renderRole, revealMeshIndex);
            revealMeshIndex += 1;
            for (const material of childMaterials) {
              material.transparent = true;
              material.userData.avatarTargetOpacity = material.opacity ?? 1;
              material.opacity = 0;
            }
            child.userData.avatarReveal = {
              startedAt: revealStartAt,
              delay: revealDelay,
              duration: 520,
            };
          }
        });

        if (variant !== 'loadingBase') {
          const outline = createOutlineGroup(model);
          if (shouldRevealAvatarVariant(variant)) {
            outline.traverse((child) => {
              if (!child.isMesh || !child.material) return;
              child.material.opacity = 0;
              child.userData.avatarReveal = {
                startedAt: revealStartAt,
                delay: 620,
                duration: 420,
              };
              child.material.userData.avatarTargetOpacity = 0.68;
            });
          }
          modelRoot.add(outline);
        }
        modelRoot.add(model);
        if (variant !== 'staticFront') {
          modelRoot.add(createSoftShadowPlane(model));
        }
        scene.add(modelRoot);
        fitCameraToObject(camera, modelRoot, target, distanceMultiplier, fitFullBounds || variant === 'staticFront');
        applyModelRotation(modelRoot, variant, rotationState);
        renderer.domElement.style.opacity = '1';
        setLoadState('ready');
        onReadyRef.current?.({
          capturePng: () => {
            renderer.render(scene, camera);
            return renderer.domElement.toDataURL('image/png');
          },
          variant,
          src,
        });
      },
      undefined,
      (error) => {
        console.error('Avatar GLB failed to load.', { src, error });
        mount.dataset.avatarLoadError = 'true';
        setLoadState('error');
      },
    );

    const render = () => {
      if (modelRoot) {
        const now = performance.now();
        const idleYawOffset = idleSway && !rotationState.isDragging
          ? Math.sin(now * 0.00145) * 0.085
          : 0;
        if (!idleSway && !isStaticAvatarVariant(variant) && !rotationState.isDragging) {
          rotationState.yaw += variant === 'loadingBase' ? 0.006 : 0.0032;
          rotationState.yaw += rotationState.velocityX;
          rotationState.pitch = THREE.MathUtils.clamp(rotationState.pitch + rotationState.velocityY, -0.42, 0.32);
          rotationState.velocityX *= 0.92;
          rotationState.velocityY *= 0.88;
        }
        applyModelRotation(modelRoot, variant, rotationState, idleYawOffset);
        if (onRotationChangeRef.current && now - rotationState.lastRotationNotifyAt > 160) {
          rotationState.lastRotationNotifyAt = now;
          onRotationChangeRef.current({
            yaw: rotationState.yaw,
            pitch: rotationState.pitch,
          });
        }
        if (shouldRevealAvatarVariant(variant)) {
          modelRoot.traverse((child) => {
            const reveal = child.userData?.avatarReveal;
            if (!reveal || !child.material) return;
            const progress = THREE.MathUtils.clamp((now - reveal.startedAt - reveal.delay) / reveal.duration, 0, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const childMaterials = Array.isArray(child.material) ? child.material : [child.material].filter(Boolean);
            for (const material of childMaterials) {
              material.opacity = (material.userData.avatarTargetOpacity ?? 1) * easedProgress;
              if (progress >= 1) {
                material.opacity = material.userData.avatarTargetOpacity ?? 1;
              }
            }
          });
        }
        camera.lookAt(target.x, target.y + 0.04, target.z);
      }
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      if (modelRoot) {
        disposeObject(modelRoot);
      }
      renderer?.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer?.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer?.domElement.removeEventListener('pointerup', endDrag);
      renderer?.domElement.removeEventListener('pointercancel', endDrag);
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [distanceMultiplier, fitFullBounds, idleSway, src, variant]);

  return (
    <div
      ref={mountRef}
      className={`${className} avatar-three-viewer state-${loadState}`}
      style={style}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
    />
  );
};

export default AvatarThreeViewer;
