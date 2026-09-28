import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { CityData } from '../../ambulance/types';
import { findRoute } from '../../ambulance/ambulanceData';
import type { CameraMode, SimulationState } from '../simulationTypes';
import { getSimulationPosition, getSimulationRoadPath, getSimulationRoutePath } from '../simulationRoadGeometry';
import { getSimulationSignalState } from '../simulationEngine';

interface Simulation3DSceneProps { city: CityData; state: SimulationState; cameraMode: Exclude<CameraMode, 'map' | 'follow'> }
type Color = THREE.ColorRepresentation;
const SCALE = 0.025;
interface TrafficMotion { group: THREE.Group; points: THREE.Vector3[]; lengths: number[]; totalLength: number; speed: number; phase: number; laneOffset: number }

function cleanName(value?: string) { return value?.replace(' (demo)', '') ?? 'Unknown location'; }
function geoPoint(lat: number, lng: number, originLat: number, originLng: number) {
  return new THREE.Vector3((lng - originLng) * 96_000 * SCALE, 0, -(lat - originLat) * 111_000 * SCALE);
}
function material(color: Color, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...options });
}
function makeBox(parent: THREE.Object3D, dims: [number, number, number], color: Color, position: THREE.Vector3, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dims), material(color, opts));
  mesh.position.copy(position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function addVehicle(parent: THREE.Object3D, color: Color, ambulance = false, kind: 'ambulance' | 'bus' | 'car' = 'car') {
  const group = new THREE.Group(); parent.add(group);
  const width = kind === 'bus' ? 0.069 : 0.064;
  const length = kind === 'bus' ? 0.18 : 0.145;
  const body = makeBox(group, [width, 0.032, length], color, new THREE.Vector3(0, 0.024, 0));
  body.material.roughness = 0.5;
  const cabinLength = kind === 'bus' ? 0.12 : 0.062;
  const cabin = makeBox(group, [width * 0.82, 0.025, cabinLength], kind === 'bus' ? color : '#f1f2ed', new THREE.Vector3(0, 0.052, -length * 0.13));
  cabin.material.roughness = 0.46;
  makeBox(group, [width * 0.68, 0.013, 0.002], '#34474c', new THREE.Vector3(0, 0.056, -length * 0.49), { metalness: 0.22, roughness: 0.2 });
  for (const side of [-1, 1]) {
    makeBox(group, [0.002, 0.011, cabinLength * 0.72], '#48636a', new THREE.Vector3(side * width * 0.415, 0.056, -length * 0.12), { roughness: 0.26 });
    if (ambulance) makeBox(group, [0.002, 0.006, length * 0.62], '#d9483f', new THREE.Vector3(side * width * 0.5, 0.03, length * 0.015));
  }
  const headlamp = material('#fff2bf', { emissive: '#d8ae5f', emissiveIntensity: 0.24, roughness: 0.28 });
  const tailLamp = material('#df4d43', { emissive: '#861f1b', emissiveIntensity: 0.18, roughness: 0.32 });
  for (const side of [-1, 1]) {
    const front = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.005, 0.003), headlamp); front.position.set(side * width * 0.33, 0.03, -length / 2); group.add(front);
    const rear = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.003), tailLamp); rear.position.set(side * width * 0.33, 0.03, length / 2); group.add(rear);
  }
  const wheelGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.012, 10);
  for (const x of [-width * 0.51, width * 0.51]) for (const z of [-length * 0.31, length * 0.31]) {
    const wheel = new THREE.Mesh(wheelGeometry, material('#303735', { roughness: 0.94 }));
    wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.013, z); group.add(wheel);
  }
  if (ambulance) {
    makeBox(group, [0.009, 0.014, 0.002], '#e34538', new THREE.Vector3(0, 0.068, 0.006));
    makeBox(group, [0.025, 0.005, 0.002], '#e34538', new THREE.Vector3(0, 0.068, 0.006));
    const beaconMaterial = new THREE.MeshStandardMaterial({ color: '#fa5545', emissive: '#f32921', emissiveIntensity: 2.5, roughness: 0.3 });
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.01), beaconMaterial); beacon.position.set(0, 0.078, 0.024); group.add(beacon);
    group.userData.beacon = beacon;
    const beacon2 = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.01), material('#4a98b5', { emissive: '#137da4', emissiveIntensity: 1.1 })); beacon2.position.set(0, 0.078, 0.011); group.add(beacon2);
    void beacon2;
  }
  void cabin;
  void body;
  return group;
}

function updateTrafficMotion(motion: TrafficMotion, simulationTimeSeconds: number) {
  const cycleDistance = (simulationTimeSeconds * motion.speed + motion.phase) % (motion.totalLength * 2);
  const returning = cycleDistance > motion.totalLength;
  let distance = returning ? motion.totalLength * 2 - cycleDistance : cycleDistance;
  let segment = 0;
  while (segment < motion.lengths.length - 1 && distance > motion.lengths[segment]) {
    distance -= motion.lengths[segment];
    segment += 1;
  }
  const length = motion.lengths[segment] || 1;
  const fraction = THREE.MathUtils.clamp(distance / length, 0, 1);
  const from = motion.points[segment];
  const to = motion.points[segment + 1];
  const dx = (to.x - from.x) * (returning ? -1 : 1);
  const dz = (to.z - from.z) * (returning ? -1 : 1);
  const directionLength = Math.hypot(dx, dz) || 1;
  const lane = returning ? -motion.laneOffset : motion.laneOffset;
  const position = from.clone().lerp(to, fraction);
  motion.group.position.set(position.x - dz / directionLength * lane, 0, position.z + dx / directionLength * lane);
  motion.group.rotation.y = Math.atan2(-dx, -dz);
}
function addLabel(parent: THREE.Object3D, text: string, color = '#203431') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 112;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.fillStyle = 'rgba(248,249,246,.92)'; ctx.beginPath(); ctx.roundRect(18, 18, 476, 76, 24); ctx.fill();
  ctx.fillStyle = color; ctx.font = '600 33px -apple-system, BlinkMacSystemFont, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text.slice(0, 25), 256, 56);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(2.2, 0.48, 1); parent.add(sprite); return sprite;
}

export function Simulation3DScene({ city, state, cameraMode }: Simulation3DSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state); stateRef.current = state;
  const cityRef = useRef(city); cityRef.current = city;
  const cameraModeRef = useRef(cameraMode); cameraModeRef.current = cameraMode;
  const [error, setError] = useState('');
  const [orbit, setOrbit] = useState(0);
  const orbitRef = useRef(orbit); orbitRef.current = orbit;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch {
      setError('This browser could not start the 3D viewport. Select Map view to continue.');
      return;
    }
    const nodes = city.nodes;
    const originLat = nodes.reduce((sum, node) => sum + node.lat, 0) / Math.max(1, nodes.length);
    const originLng = nodes.reduce((sum, node) => sum + node.lng, 0) / Math.max(1, nodes.length);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#cddadd'); scene.fog = new THREE.Fog('#cddadd', 115, 340);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.002, 420);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.07;
    scene.add(new THREE.HemisphereLight('#f2f7ed', '#697b67', 2.0));
    const sun = new THREE.DirectionalLight('#fff3d9', 3.2); sun.position.set(-45, 80, -25); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -180; sun.shadow.camera.right = 180; sun.shadow.camera.top = 180; sun.shadow.camera.bottom = -180; sun.shadow.bias = -0.0005; scene.add(sun);

    const center = new THREE.Vector3();
    const worldNodes = new Map(city.nodes.map((node) => [node.id, geoPoint(node.lat, node.lng, originLat, originLng)]));
    for (const point of worldNodes.values()) center.add(point);
    center.divideScalar(Math.max(1, worldNodes.size));
    const minX = Math.min(...[...worldNodes.values()].map((point) => point.x));
    const maxX = Math.max(...[...worldNodes.values()].map((point) => point.x));
    const minZ = Math.min(...[...worldNodes.values()].map((point) => point.z));
    const maxZ = Math.max(...[...worldNodes.values()].map((point) => point.z));
    const cityWidth = Math.max(12, maxX - minX + 24), cityDepth = Math.max(12, maxZ - minZ + 24);
    const ground = document.createElement('canvas'); ground.width = 256; ground.height = 256;
    const groundContext = ground.getContext('2d');
    if (groundContext) {
      groundContext.fillStyle = '#aab59c'; groundContext.fillRect(0, 0, 256, 256);
      let noise = 712367;
      const random = () => { noise = (noise * 16807) % 2147483647; return (noise - 1) / 2147483646; };
      for (let patch = 0; patch < 1100; patch += 1) {
        const green = random() > 0.54;
        groundContext.fillStyle = green ? 'rgba(83,116,77,.10)' : 'rgba(139,125,94,.08)';
        groundContext.beginPath(); groundContext.ellipse(random() * 256, random() * 256, 2 + random() * 10, 1 + random() * 5, random() * Math.PI, 0, Math.PI * 2); groundContext.fill();
      }
    }
    const groundTexture = new THREE.CanvasTexture(ground); groundTexture.colorSpace = THREE.SRGBColorSpace;
    groundTexture.wrapS = THREE.RepeatWrapping; groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(cityWidth / 12, cityDepth / 12);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(cityWidth, cityDepth), material('#d2d8c8', { map: groundTexture, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.set(center.x, 0, center.z); floor.receiveShadow = true; scene.add(floor);

    const roadMeshes = new Map<string, THREE.Mesh[]>();
    const routeLines = new Map<string, THREE.Mesh>();
    const signalLamps = new Map<string, THREE.Mesh[]>();
    const trafficVehicles: TrafficMotion[] = [];
    const laneDashes: { position: THREE.Vector3; angle: number }[] = [];
    const treePoints: { x: number; z: number; scale: number; tint: Color }[] = [];
    const buildingColors = ['#d9d2be', '#c6cabb', '#b8c4be', '#d7c8b8', '#adbcb7', '#dedbcf'];
    const facadeCanvas = document.createElement('canvas'); facadeCanvas.width = 256; facadeCanvas.height = 256;
    const facadeContext = facadeCanvas.getContext('2d');
    if (facadeContext) {
      facadeContext.clearRect(0, 0, 256, 256);
      for (let row = 0; row < 5; row += 1) for (let column = 0; column < 5; column += 1) {
        const x = 12 + column * 49, y = 10 + row * 49;
        facadeContext.fillStyle = 'rgba(237,231,209,.7)'; facadeContext.fillRect(x - 2, y - 2, 34, 34);
        facadeContext.fillStyle = ['#52736d', '#536c6e', '#798578'][(row + column) % 3]; facadeContext.fillRect(x, y, 30, 30);
        facadeContext.fillStyle = 'rgba(216,231,219,.42)'; facadeContext.fillRect(x + 3, y + 3, 10, 23);
        facadeContext.fillStyle = 'rgba(224,222,201,.75)'; facadeContext.fillRect(x, y + 31, 30, 2);
      }
    }
    const facadeTexture = new THREE.CanvasTexture(facadeCanvas); facadeTexture.colorSpace = THREE.SRGBColorSpace;
    const facadeMaterial = new THREE.MeshStandardMaterial({ map: facadeTexture, transparent: true, side: THREE.DoubleSide, roughness: 0.48, depthWrite: false });
    const asphaltCanvas = document.createElement('canvas'); asphaltCanvas.width = 128; asphaltCanvas.height = 128;
    const asphaltContext = asphaltCanvas.getContext('2d');
    if (asphaltContext) {
      asphaltContext.fillStyle = '#d0d2ca'; asphaltContext.fillRect(0, 0, 128, 128);
      let grain = 19417;
      const randomGrain = () => { grain = (grain * 48271) % 2147483647; return (grain - 1) / 2147483646; };
      for (let speck = 0; speck < 1900; speck += 1) {
        const shade = Math.round(132 + randomGrain() * 92);
        asphaltContext.fillStyle = `rgba(${shade},${shade + 1},${shade - 2},${0.1 + randomGrain() * 0.22})`;
        const size = 0.35 + randomGrain() * 1.3;
        asphaltContext.fillRect(randomGrain() * 128, randomGrain() * 128, size, size);
      }
    }
    const asphaltTexture = new THREE.CanvasTexture(asphaltCanvas); asphaltTexture.colorSpace = THREE.SRGBColorSpace; asphaltTexture.wrapS = THREE.RepeatWrapping; asphaltTexture.wrapT = THREE.RepeatWrapping; asphaltTexture.repeat.set(5, 13);
    city.roads.forEach((road, roadIndex) => {
      const raw = getSimulationRoadPath(city, road);
      const path = raw.map(([lat, lng]) => geoPoint(lat, lng, originLat, originLng));
      if (path.length < 2) return;
      const routeMat = material('#8dbb78', { emissive: '#4c8c51', emissiveIntensity: 0.65, transparent: true, opacity: 0.82 });
      const curve = new THREE.CatmullRomCurve3(path); const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(16, path.length * 8), 0.0028, 6, false), routeMat); tube.position.y = 0.0038; scene.add(tube); routeLines.set(road.id, tube);
      const pieces: THREE.Mesh[] = [];
      for (let index = 1; index < path.length; index += 1) {
        const start = path[index - 1], end = path[index]; const dx = end.x - start.x, dz = end.z - start.z; const length = Math.hypot(dx, dz); if (length < 0.01) continue;
        const angle = Math.atan2(dx, dz); const midpoint = new THREE.Vector3((start.x + end.x) / 2, -0.005, (start.z + end.z) / 2);
        const roadSurface = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.012, length + 0.025), material('#515a56', { map: asphaltTexture, roughness: 0.97 })); roadSurface.position.copy(midpoint); roadSurface.rotation.y = angle; roadSurface.receiveShadow = true; scene.add(roadSurface); pieces.push(roadSurface);
        const startTrim = index === 1 ? ((city.adjacency[road.from]?.length ?? 0) > 2 ? 0.48 : 0.16) : 0;
        const endTrim = index === path.length - 1 ? ((city.adjacency[road.to]?.length ?? 0) > 2 ? 0.48 : 0.16) : 0;
        const sidewalkLength = Math.max(0.05, length - startTrim - endTrim);
        const sidewalkCenter = midpoint.clone().add(new THREE.Vector3(dx / length * (startTrim - endTrim) / 2, 0, dz / length * (startTrim - endTrim) / 2));
        for (const side of [-1, 1]) {
          const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.003, sidewalkLength), material('#9da69a')); sidewalk.position.set(sidewalkCenter.x + Math.cos(angle) * 0.129 * side, 0.0015, sidewalkCenter.z - Math.sin(angle) * 0.129 * side); sidewalk.rotation.y = angle; scene.add(sidewalk);
        }
        const dashCount = Math.max(1, Math.floor(length / 0.32));
        for (let dash = 0; dash < dashCount; dash += 1) {
          const fraction = (dash + 0.5) / dashCount;
          laneDashes.push({ position: new THREE.Vector3(start.x + dx * fraction, 0.0025, start.z + dz * fraction), angle });
        }
      }
      roadMeshes.set(road.id, pieces);

      // Build small, stable street fronts along each road so every camera has a city around it.
      const rng = (roadIndex * 9301 + 49297) % 233280;
      const random = (n: number) => ((rng + n * 7919) % 233280) / 233280;
      let buildingIndex = 0;
      for (let segment = 0; segment < path.length - 1; segment += 1) {
        const a = path[segment], z = path[segment + 1]; const dx = z.x - a.x, dz = z.z - a.z; const length = Math.hypot(dx, dz); if (length < 0.04) continue;
        const buildingCount = Math.max(1, Math.min(4, Math.floor(length / 0.42)));
        for (let lot = 0; lot < buildingCount; lot += 1) for (const side of [-1, 1]) {
          const b = buildingIndex++;
          const fraction = (lot + 0.5) / buildingCount;
          const offset = 0.27 + random(b * 7 + 4) * 0.13;
          const width = 0.13 + random(b * 17 + 10) * 0.12; const depth = 0.13 + random(b * 19 + 12) * 0.13; const height = 0.12 + random(b * 23 + 14) * 0.38;
          const x = a.x + dx * fraction - dz / length * offset * side;
          const zPos = a.z + dz * fraction + dx / length * offset * side;
          makeBox(scene, [width, height, depth], buildingColors[(roadIndex + b) % buildingColors.length], new THREE.Vector3(x, height / 2 - 0.01, zPos));
          const facade = (w: number, position: THREE.Vector3, rotation: number) => {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, height * 0.82), facadeMaterial);
            mesh.position.copy(position); mesh.rotation.y = rotation; scene.add(mesh);
          };
          const facadeY = height * 0.48;
          facade(width * 0.9, new THREE.Vector3(x, facadeY, zPos + depth / 2 + 0.002), 0);
          facade(width * 0.9, new THREE.Vector3(x, facadeY, zPos - depth / 2 - 0.002), Math.PI);
          facade(depth * 0.9, new THREE.Vector3(x + width / 2 + 0.002, facadeY, zPos), Math.PI / 2);
          facade(depth * 0.9, new THREE.Vector3(x - width / 2 - 0.002, facadeY, zPos), -Math.PI / 2);
          if (height > 0.28) makeBox(scene, [0.055, 0.035, 0.05], '#898878', new THREE.Vector3(x, height + 0.009, zPos));
        }
      }
      for (let segment = 0; segment < path.length - 1; segment += 1) {
        const a = path[segment], b = path[segment + 1]; const dx = b.x - a.x, dz = b.z - a.z; const length = Math.hypot(dx, dz); if (length < 0.8) continue;
        const treeCount = Math.min(3, Math.floor(length / 0.72));
        for (let tree = 0; tree < treeCount; tree += 1) for (const side of [-1, 1]) {
          const seed = roadIndex * 71 + segment * 29 + tree * 13 + side * 3;
          if (random(seed) < 0.24) continue;
          const fraction = (tree + 1) / (treeCount + 1);
          const offset = 0.57 + random(seed + 5) * 0.1;
          treePoints.push({ x: a.x + dx * fraction - dz / length * offset * side, z: a.z + dz * fraction + dx / length * offset * side, scale: 0.78 + random(seed + 9) * 0.54, tint: ['#5e8060', '#6f8d67', '#55775a'][(roadIndex + tree + (side > 0 ? 1 : 0)) % 3] });
        }
      }
    });

    if (treePoints.length) {
      const trunkInstances = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.005, 0.008, 0.075, 6), material('#776049'), treePoints.length);
      const canopyInstances = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.055, 1), material('#ffffff', { roughness: 0.95 }), treePoints.length);
      const transform = new THREE.Object3D();
      treePoints.forEach((tree, index) => {
        transform.position.set(tree.x, 0.0375 * tree.scale, tree.z); transform.scale.setScalar(tree.scale); transform.updateMatrix(); trunkInstances.setMatrixAt(index, transform.matrix);
        transform.position.set(tree.x, 0.14375 * tree.scale, tree.z); transform.scale.set(tree.scale * 1.04, tree.scale * 1.25, tree.scale * 1.04); transform.updateMatrix(); canopyInstances.setMatrixAt(index, transform.matrix); canopyInstances.setColorAt(index, new THREE.Color(tree.tint));
      });
      trunkInstances.instanceMatrix.needsUpdate = true; canopyInstances.instanceMatrix.needsUpdate = true; scene.add(trunkInstances, canopyInstances);
    }

    if (laneDashes.length) {
      const dashBatch = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.003, 0.13), material('#e8dfc4', { emissive: '#746d57', emissiveIntensity: 0.16 }), laneDashes.length);
      const transform = new THREE.Object3D();
      laneDashes.forEach((dash, index) => { transform.position.copy(dash.position); transform.rotation.y = dash.angle; transform.updateMatrix(); dashBatch.setMatrixAt(index, transform.matrix); });
      dashBatch.instanceMatrix.needsUpdate = true; scene.add(dashBatch);
    }

    const hospital = city.hospitals.find((item) => item.id === stateRef.current.vehicle.destinationId);
    if (hospital) {
      const location = worldNodes.get(hospital.nodeId);
      if (location) {
        const body = makeBox(scene, [0.32, 0.52, 0.3], '#ede4d0', new THREE.Vector3(location.x + 0.58, 0.26, location.z), { roughness: 0.6 });
        makeBox(scene, [0.06, 0.18, 0.018], '#f7f6ec', new THREE.Vector3(body.position.x, 0.39, body.position.z + 0.16));
        makeBox(scene, [0.18, 0.05, 0.018], '#d84f40', new THREE.Vector3(body.position.x, 0.39, body.position.z + 0.17));
        const badge = addLabel(scene, cleanName(hospital.name), '#456955'); if (badge) badge.position.set(location.x + 0.58, 0.72, location.z);
      }
    }

    city.nodes.filter((node) => node.type === 'junction').forEach((node) => {
      const point = worldNodes.get(node.id); if (!point) return;
      const label = addLabel(scene, cleanName(node.name)); if (label) label.position.set(point.x + 0.28, 0.14, point.z - 0.24);
    });
    city.signals.forEach((signal) => {
      const point = worldNodes.get(signal.nodeId); if (!point) return;
      makeBox(scene, [0.01, 0.18, 0.01], '#454e48', new THREE.Vector3(point.x + 0.14, 0.09, point.z + 0.12));
      makeBox(scene, [0.028, 0.054, 0.023], '#333d38', new THREE.Vector3(point.x + 0.14, 0.185, point.z + 0.12));
      const lights: THREE.Mesh[] = [];
      for (let index = 0; index < 3; index += 1) {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 8, 6), new THREE.MeshStandardMaterial({ color: '#657069', emissive: '#000000' }));
        lamp.position.set(point.x + 0.14, 0.202 - index * 0.017, point.z + 0.135); scene.add(lamp); lights.push(lamp);
      }
      signalLamps.set(signal.id, lights);
    });

    (city.vehicles ?? []).filter((vehicle) => vehicle.type !== 'ambulance').forEach((vehicle, index) => {
      const route = findRoute(city, vehicle.currentNodeId, vehicle.destinationNodeId);
      if (!route) return;
      const points = getSimulationRoutePath(city, route).map(([lat, lng]) => geoPoint(lat, lng, originLat, originLng));
      const lengths = points.slice(1).map((point, pointIndex) => point.distanceTo(points[pointIndex]));
      const totalLength = lengths.reduce((sum, length) => sum + length, 0);
      if (points.length < 2 || totalLength <= 0) return;
      const group = addVehicle(scene, vehicle.type === 'bus' ? '#2d7a79' : '#84918d', false, vehicle.type === 'bus' ? 'bus' : 'car');
      const motion: TrafficMotion = { group, points, lengths, totalLength, speed: Math.max(0.06, vehicle.speedKph / 3.6 * SCALE), phase: index * 0.8, laneOffset: -0.035 };
      updateTrafficMotion(motion, 0);
      trafficVehicles.push(motion);
    });
    const ambulance = addVehicle(scene, '#edede5', true); scene.add(ambulance);
    const routeOrigin = worldNodes.get(city.bases[0]?.nodeId ?? '') ?? center;
    camera.position.set(routeOrigin.x + 1.6, 1.5, routeOrigin.z + 1.9); camera.lookAt(routeOrigin);
    let frame = 0, stopped = false;
    const resize = new ResizeObserver(() => {
      if (!canvas.parentElement) return;
      const width = Math.max(1, canvas.parentElement.clientWidth), height = Math.max(1, canvas.parentElement.clientHeight);
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    }); resize.observe(canvas.parentElement ?? canvas);
    const onPointerMove = (event: PointerEvent) => {
      if (event.buttons !== 1 || cameraModeRef.current !== 'third-person') return;
      setOrbit((value) => value - event.movementX * 0.004);
    };
    canvas.addEventListener('pointermove', onPointerMove);
    const onWheelZoom = (event: WheelEvent) => { if (cameraModeRef.current === 'third-person') { event.preventDefault(); setOrbitDistance((value) => Math.max(0.42, Math.min(4.5, value + event.deltaY * 0.004))); } };
    canvas.addEventListener('wheel', onWheelZoom, { passive: false });
    let distance = 0.68; function setOrbitDistance(next: (value: number) => number) { distance = next(distance); }

    const render = () => {
      if (stopped) return;
      frame = requestAnimationFrame(render);
      const current = stateRef.current; const mode = cameraModeRef.current;
      const position = getSimulationPosition(cityRef.current, current);
      routeLines.forEach((mesh) => { mesh.visible = mode !== 'driver' && mode !== 'rear-view'; });
      if (position) {
        const target = geoPoint(position.lat, position.lng, originLat, originLng);
        const heading = position.bearing * Math.PI / 180;
        const forward = new THREE.Vector3(Math.sin(heading), 0, -Math.cos(heading));
        target.add(new THREE.Vector3(forward.z, 0, -forward.x).multiplyScalar(0.034));
        ambulance.position.lerp(new THREE.Vector3(target.x, 0, target.z), 0.18);
        ambulance.rotation.y = THREE.MathUtils.damp(ambulance.rotation.y, -heading, 6, 1 / 60);
        let desired: THREE.Vector3, look: THREE.Vector3;
        if (mode === 'driver') {
          desired = target.clone().add(new THREE.Vector3(0, 0.044, 0)).addScaledVector(forward, 0.11);
          look = target.clone().add(new THREE.Vector3(0, 0.065, 0)).addScaledVector(forward, 1.2);
        } else if (mode === 'rear-view') {
          desired = target.clone().add(new THREE.Vector3(0, 0.105, 0)).addScaledVector(forward, -0.14);
          look = target.clone().add(new THREE.Vector3(0, 0.1, 0)).addScaledVector(forward, -1.1);
        } else {
          // Keep the starting camera behind the ambulance and turn with its
          // heading. A world-fixed orbit starts over an empty part of the map.
          const theta = orbitRef.current - heading; const radius = distance;
          desired = target.clone().add(new THREE.Vector3(Math.sin(theta) * radius, radius * 0.5, Math.cos(theta) * radius));
          look = target.clone().add(new THREE.Vector3(0, 0.05, 0));
        }
        camera.position.lerp(desired, mode === 'third-person' ? 0.065 : 0.16);
        camera.lookAt(look);
        if (current.routeRoadIds.length) {
          routeLines.forEach((mesh, id) => { const active = current.routeRoadIds.includes(id); (mesh.material as THREE.MeshStandardMaterial).color.set(active ? '#49b76a' : '#9eaf91'); (mesh.material as THREE.MeshStandardMaterial).emissive.set(active ? '#258946' : '#67715d'); });
        } else routeLines.forEach((mesh) => (mesh.material as THREE.MeshStandardMaterial).color.set('#9eaf91'));
      }
      city.roads.forEach((road) => {
        const meshes = roadMeshes.get(road.id) ?? [];
        const color = road.blocked ? '#783f3b' : road.congestion === 'high' ? '#6d5b46' : road.congestion === 'medium' ? '#58605a' : '#515a56';
        meshes.forEach((mesh) => (mesh.material as THREE.MeshStandardMaterial).color.set(color));
      });
      city.signals.forEach((signal) => {
        const values = signalLamps.get(signal.id); if (!values) return;
        const phase = getSimulationSignalState(signal, current.simulationTimeSeconds).state;
        const activeColor = phase === 'green' ? '#4cbd70' : phase === 'yellow' ? '#f1b954' : '#ed6353';
        values.forEach((lamp, index) => {
          const enabled = (phase === 'red' && index === 0) || (phase === 'yellow' && index === 1) || (phase === 'green' && index === 2);
          (lamp.material as THREE.MeshStandardMaterial).color.set(enabled ? activeColor : '#39423e');
          (lamp.material as THREE.MeshStandardMaterial).emissive.set(enabled ? activeColor : '#000000');
          (lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = enabled ? 0.8 : 0;
        });
      });
      const running = current.status === 'running';
      const beacon = ambulance.userData.beacon as THREE.Mesh | undefined;
      if (beacon) (beacon.material as THREE.MeshStandardMaterial).emissiveIntensity = running && Math.sin(current.simulationTimeSeconds * 8) > 0 ? 3 : 0.5;
      trafficVehicles.forEach((vehicle) => updateTrafficMotion(vehicle, current.simulationTimeSeconds));
      renderer.render(scene, camera);
    };
    render();
    return () => {
      stopped = true; cancelAnimationFrame(frame); resize.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('wheel', onWheelZoom);
      scene.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const mats = Array.isArray(object.material) ? object.material : [object.material]; mats.forEach((mat) => { if ('map' in mat && mat.map instanceof THREE.Texture) mat.map.dispose(); mat.dispose(); }); } });
      renderer.dispose();
    };
  }, [city]);

  const destination = city.hospitals.find((hospital) => hospital.id === state.vehicle.destinationId);
  const nextSignal = city.signals.find((signal) => state.routeNodeIds.slice(1).includes(signal.nodeId));
  const signalNode = nextSignal && city.nodes.find((node) => node.id === nextSignal.nodeId);
  const activeScenarios = [...state.scenarios, ...state.externalScenarios].filter((scenario) => scenario.active);
  const speed = Math.round(state.currentSpeedKph);
  const progress = state.distanceTravelledMeters + state.distanceRemainingMeters > 0 ? Math.min(1, state.distanceTravelledMeters / (state.distanceTravelledMeters + state.distanceRemainingMeters)) : 0;
  const signalPhase = nextSignal ? getSimulationSignalState(nextSignal, state.simulationTimeSeconds).state : null;
  const labels = { driver: 'DRIVER VIEW', 'third-person': 'ORBIT CAMERA', 'rear-view': 'REAR VIEW' };

  return <div className={`simulation-3d-scene camera-${cameraMode} ${state.status === 'running' ? 'is-running' : ''}`} aria-label={`${labels[cameraMode]} of the simulated route to ${cleanName(destination?.name)}`}>
    <canvas ref={canvasRef} className="simulation-3d-canvas" aria-label="Interactive three dimensional simulated Bengaluru road network" />
    <div className="scene-telemetry" aria-label="Live simulation telemetry">
      <div className="scene-telemetry-item"><span>AMBULANCE SPEED</span><strong>{speed}<small> km/h</small></strong></div>
      <div className="scene-telemetry-item"><span className={state.signalWaitSeconds > 0 || signalPhase === 'red' ? 'signal-waiting' : ''}>{state.signalWaitSeconds > 0 ? `RED · ${Math.ceil(state.signalWaitSeconds)} SEC` : signalNode ? `${signalPhase?.toUpperCase()} SIGNAL AHEAD` : 'ROUTE STATUS'}</span><strong>{signalNode ? cleanName(signalNode.name) : activeScenarios.length ? activeScenarios.map((scenario) => scenario.name).join(' · ') : cleanName(destination?.name)}</strong></div>
      <div className="scene-telemetry-item"><span>ROUTE PROGRESS</span><strong>{Math.round(progress * 100)}%</strong><div className="scene-progress" role="progressbar" aria-label="Ambulance route progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><i style={{ width: `${progress * 100}%` }} /></div></div>
    </div>
    {cameraMode === 'third-person' && <span className="scene-drag-hint">Drag to orbit · scroll to zoom</span>}
    {error && <div className="scene-error" role="status">{error}</div>}
  </div>;
}
