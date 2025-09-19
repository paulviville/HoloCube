import * as THREE from "./three/three.module.js";

export const remoteScene = new THREE.Scene();

remoteScene.background = new THREE.Color(0xf0f0ff);

let ambientLight1 = new THREE.AmbientLight(0xffffff, 0.5);
let pointLight1 = new THREE.PointLight(0xffffff, 100);
pointLight1.position.set(5,4,5);

const torus0 = new THREE.Mesh(new THREE.TorusKnotGeometry( 0.4, 0.08, 95, 20 ), new THREE.MeshLambertMaterial({color: 0x33AA33, side: THREE.DoubleSide}));
const torus1 = new THREE.Mesh(new THREE.TorusKnotGeometry( 4, 0.5, 95, 20 ), new THREE.MeshLambertMaterial({color: 0x33AAAA, side: THREE.DoubleSide}));
const simContent = new THREE.Group();
simContent.add(torus0, torus1, ambientLight1, pointLight1);
remoteScene.add(simContent);
