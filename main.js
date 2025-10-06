import * as THREE from "./three/three.module.js";
import { VRButton } from './three/webxr/VRButton.js';
import { OrbitControls } from './three/controls/OrbitControls.js';
import HoloCube from "./HoloCube.js";
import { GUI } from './three/libs/lil-gui.module.min.js'; 
import HoloMaterial from "./HoloMaterial.js";
import HoloCubeDisplay from "./HoloCubeDisplay.js";
import { remoteScene } from "./remoteScene.js";
import Stats from './three/libs/stats.module.js';
import { InteractiveGroup } from './three/interactive/InteractiveGroup.js';
import { HTMLMesh } from './three/interactive/HTMLMesh.js';
import { XRControllerModelFactory } from './three/webxr/XRControllerModelFactory.js';
import SpatialAnnotations from "./SpatialAnnotations.js";

const renderer = new THREE.WebGLRenderer(({alpha: true, antialias: true}));
renderer.autoClear = false;
renderer.antialias = false;
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
renderer.xr.enabled = true;

document.body.appendChild( renderer.domElement );
document.body.appendChild( VRButton.createButton( renderer ) );


const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xccBBcc );
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 50 );
camera.position.set( 1.5, 1.5, 2 );

const orbitControls = new OrbitControls( camera, renderer.domElement );

const gridHelper = new THREE.GridHelper();
scene.add( gridHelper );



const textureWidth = 2048;
const textureHeight = 2048;
const renderSettings = {
	minFilter: THREE.NearestFilter,
	magFilter: THREE.NearestFilter,
	format: THREE.RGBAFormat,
	type: THREE.FloatType,
}

const renderTargets = {};
const screenTextures = {};
const cameras = {};


for( const face of ["x", "y", "z"] ) {
	renderTargets[face] = new THREE.WebGLRenderTarget(textureWidth, textureHeight, renderSettings);
	renderTargets[face].depthTexture = new THREE.DepthTexture(textureWidth, textureHeight);
	renderTargets[face].depthTexture.format = THREE.DepthFormat;
	renderTargets[face].depthTexture.type = THREE.FloatType;

	screenTextures[face] = {
		texture: renderTargets[face].texture,
		depthTexture: renderTargets[face].depthTexture,
	}

	cameras[face] = new THREE.PerspectiveCamera();
	cameras[face].matrixAutoUpdate = false;
}

const pickingTextureWidth = 1024;
const pickingTextureHeight = 1024;
const pickingRenderTarget = new THREE.WebGLRenderTarget(pickingTextureWidth, pickingTextureHeight, renderSettings);
pickingRenderTarget.depthTexture = new THREE.DepthTexture(pickingTextureWidth, pickingTextureHeight);
pickingRenderTarget.depthTexture.format = THREE.DepthFormat;
pickingRenderTarget.depthTexture.type = THREE.FloatType;
const plane = new THREE.Mesh(
	new THREE.PlaneGeometry(1, 1),
	new THREE.MeshBasicMaterial({map: pickingRenderTarget.texture, color: 0xFFFFFF}),
);
// scene.add(plane)
plane.position.set(2, 0, 0)


const holoCube = new HoloCube();
holoCube.position = new THREE.Vector3(0, 1, 0);
const holoCubeDisplay = new HoloCubeDisplay( holoCube, screenTextures );
scene.add(holoCubeDisplay.display);
scene.add(holoCubeDisplay.screens);


const renderTargetsR = {};
const screenTexturesR = {};
const camerasR = {};


for( const face of ["x", "y", "z"] ) {
	renderTargetsR[face] = new THREE.WebGLRenderTarget(textureWidth, textureHeight, renderSettings);
	renderTargetsR[face].depthTexture = new THREE.DepthTexture(textureWidth, textureHeight);
	renderTargetsR[face].depthTexture.format = THREE.DepthFormat;
	renderTargetsR[face].depthTexture.type = THREE.FloatType;

	screenTexturesR[face] = {
		texture: renderTargetsR[face].texture,
		depthTexture: renderTargetsR[face].depthTexture,
	}

	camerasR[face] = new THREE.PerspectiveCamera();
	camerasR[face].matrixAutoUpdate = false;
}

const holoCubeDisplayR = new HoloCubeDisplay( holoCube, screenTexturesR );

// console.log(renderer.xr.getRenderTarget())



const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 5 ) ] );

const controller1 = renderer.xr.getController( 0 );
controller1.add( new THREE.Line( lineGeometry ) );
scene.add( controller1 );

// const controllerModelFactory = new XRControllerModelFactory();
// const controllerGrip1 = renderer.xr.getControllerGrip( 0 );
// controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
// scene.add( controllerGrip1 );



const controllerForward = new THREE.Vector3();
const controllerPosition = new THREE.Vector3();
controller1.getWorldDirection(controllerForward);
controller1.getWorldPosition(controllerPosition);

const controllerArrow = new THREE.ArrowHelper(controllerForward, controllerForward)
// scene.add(controllerArrow)


const origin = new THREE.Vector3(-1, -1, -1);
const direction = new THREE.Vector3(1, 1, 1).normalize();

const pickingTextureSize = pickingTextureWidth * pickingTextureHeight;
const readPickingTarget = new Float32Array( 4 * pickingTextureSize );

function getClosestHit ( ) {
	const closestPoint = new THREE.Vector3();
	let minDist = 1000000.0;
	let dist = 0.;
	let count = 0.; 

	renderer.readRenderTargetPixels(pickingRenderTarget, 0, 0, pickingTextureWidth, pickingTextureHeight, readPickingTarget);
	const pixel = new THREE.Vector4();
	const point = new THREE.Vector3();
	for ( let p = 0; p < pickingTextureSize; ++p ) {
		pixel.fromArray( readPickingTarget, 4 * p );
		if ( readPickingTarget[4*p+3] == 0 ) {
			++count;
			point.set( pixel.x, pixel.y, pixel.z );
			dist = point.distanceToSquared( origin );
			if ( dist < minDist ) {
				minDist = dist;
				closestPoint.copy(point);
			}
		}
	}

	if ( count == 0 ) {
		return undefined;
	}

	return closestPoint;
}

const pointer = new THREE.Mesh(
	new THREE.SphereGeometry(0.025, 32, 32),
	new THREE.MeshBasicMaterial({color: 0xff0000})
)
scene.add(pointer)

const pickingScene = new THREE.Scene();
pickingScene.background = new THREE.Color( 0x000000 );
const closestPoint = new THREE.Vector3();
function pickInScene ( camera ) {
	renderer.setRenderTarget( pickingRenderTarget );
	renderer.clear();
	holoCubeDisplay.picking = true;
	renderer.render( holoCubeDisplay.screens, camera );
	const closest = getClosestHit();
	if( closest !== undefined ) {
		closestPoint.copy(closest);
		pointer.position.copy(closest)
	}
	else {
		pointer.position.set(10, 10, 10);
	}
	holoCubeDisplay.picking = false;

	renderer.setRenderTarget( null );
}

let scaleInput = 1;
let displayScaleInput = 1;
let squeezing = false;
function animate ( ) {
	holoCubeDisplay.update();
	holoCubeDisplayR.update();

	spatialAnnotations.update();


	holoCubeDisplay.setPickingRay({
		origin,
		direction,
		epsilon: guiParams.epsilon,
	});


	const currentRT = renderer.getRenderTarget();
	const VRenabled = renderer.xr.enabled;

	renderer.xr.enabled = false;
	if(renderer.xr.isPresenting) {
		const stereoCameras = renderer.xr.getCamera().cameras;
		controller1.getWorldDirection(controllerForward);
		controller1.getWorldPosition(controllerPosition);

		controllerForward.normalize().negate();

		holoCube.computeCameraMatrices( stereoCameras[0].position, cameras );
		holoCubeDisplay.updateScreens( stereoCameras[0].position );

		origin.copy(controllerPosition);
		direction.copy(controllerForward);
		holoCubeDisplay.setPickingRay({ origin, direction, epsilon: guiParams.epsilon });

		for( const face of ["x", "y", "z"] ) {
			renderer.setRenderTarget( renderTargets[face] );
			renderer.render( remoteScene, cameras[face] );
		}

		holoCube.computeCameraMatrices( stereoCameras[1].position, camerasR );
		holoCubeDisplayR.updateScreens( stereoCameras[1].position );

		for( const face of ["x", "y", "z"] ) {
			renderer.setRenderTarget( renderTargetsR[face] );
			renderer.render( remoteScene, camerasR[face] );
		}

		pickInScene( stereoCameras[0] );


		const session = renderer.xr.getSession();
		if(session?.inputSources.length) {
			const source = session.inputSources[0];
			const gamepad = source.gamepad;
			if( gamepad ) {
				const axes = gamepad.axes;
				if(axes.length > 0) {
					if(!squeezing) {
						if(Math.abs(axes[3]) > Math.abs(axes[2])) {
							scaleInput += axes[3] * 0.01;
							holoCube.viewScale = new THREE.Vector3(scaleInput, scaleInput, scaleInput);
							// console.log(axes)
						}
						else{
							displayScaleInput += axes[2] * 0.01;
							holoCube.scale = new THREE.Vector3(displayScaleInput, displayScaleInput, displayScaleInput);
						}	
					}
					else {
						holoCube.viewPosition = holoCube.viewPosition.clone().add(new THREE.Vector3(-axes[2], axes[3], 0).multiplyScalar(0.025))
					}

				}
			}
		}
	}

	else {
		holoCube.computeCameraMatrices( camera.position, cameras );
		holoCubeDisplay.updateScreens( camera.position );
		
		for( const face of ["x", "y", "z"] ) {
			renderer.setRenderTarget( renderTargets[face] );
			renderer.render( remoteScene, cameras[face] );
		}

		pickInScene( camera );
	}


	renderer.xr.enabled = VRenabled;
	renderer.setRenderTarget( currentRT );

	renderer.render( scene, camera );
}

renderer.xr.addEventListener('sessionstart', ( event ) => {
	console.log(`session start`);

	const baseReferenceSpace = renderer.xr.getReferenceSpace();
	const offsetRotation = new THREE.Quaternion();
	const offsetPosition = camera.position;

	const transform = new XRRigidTransform( offsetPosition.multiplyScalar(-1), offsetRotation ); 
	const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace( transform );

	// xrRenderTarget = renderer.getRenderTarget();
	renderer.xr.setReferenceSpace( teleportSpaceOffset );

	scene.add(holoCubeDisplayR.screens);
	holoCubeDisplay.setScreenLayers(1);
	holoCubeDisplayR.setScreenLayers(2);

});

renderer.xr.addEventListener('sessionend', ( event ) => {
	console.log(`session end`);
	scene.remove(holoCubeDisplayR.screens);
	holoCubeDisplay.setScreenLayers(0);

});




const spatialAnnotations = new SpatialAnnotations(holoCube);
scene.add(spatialAnnotations.annotations);




function updateHoloCubeTransform ( ) {
	holoCube.position = guiParams.holoCubeTransforms.position;
	holoCube.scale = guiParams.holoCubeTransforms.scale;
	// const axisH = new THREE.Vector3().set(guiParams.holoCubeTransforms.rotation.x, guiParams.holoCubeTransforms.rotation.y, guiParams.holoCubeTransforms.rotation.z)
	// const rotationHoloCube = new THREE.Quaternion().setFromAxisAngle(axisH, guiParams.holoCubeTransforms.rotation.w);
	// holoCube.rotation = rotationHoloCube;

	holoCube.viewPosition = guiParams.remoteTransforms.position;
	holoCube.viewScale = guiParams.remoteTransforms.scale;
	const axisV = new THREE.Vector3().set(guiParams.remoteTransforms.rotation.x, guiParams.remoteTransforms.rotation.y, guiParams.remoteTransforms.rotation.z)
	const rotationRemote = new THREE.Quaternion().setFromAxisAngle(axisV, guiParams.remoteTransforms.rotation.w);
	holoCube.viewRotation = rotationRemote;

	spatialAnnotations.update();
	console.log("update")
}

function normalizeLockedX ( vector ) {
	const length = vector.length();
	
	const lengthRemain = Math.sqrt(length - vector.x*vector.x);
	const lengthOther = Math.hypot(vector.y, vector.z);
	if(lengthOther != 0) {
		vector.y = vector.y / lengthOther * lengthRemain; 
		vector.z = vector.z / lengthOther * lengthRemain; 
	} else {
		vector.y = lengthRemain; 
		vector.z = 0; 
	}
	vector.normalize();
}

function updateAxisH ( a0, a1, a2 ) {
	const axis = guiParams.holoCubeTransforms.rotation;
	updateAxes ( axis, a0, a1, a2 );
	updateHoloCubeTransform();
}

function updateAxisV ( a0, a1, a2 ) {
	const axis = guiParams.remoteTransforms.rotation;
	updateAxes ( axis, a0, a1, a2 );
	updateHoloCubeTransform();
}

function updateAxes ( axis, a0, a1, a2 ) {
	const nAxis = new THREE.Vector3(axis[a0], axis[a1], axis[a2])
	normalizeLockedX(nAxis);
	axis[a0] = nAxis.x;
	axis[a1] = nAxis.y;
	axis[a2] = nAxis.z;
}



























const gui = new GUI({ width: 300 });
const guiParams = {
	holoCubeTransforms : {
		position: new THREE.Vector3(0, 1, 0),
		scale: new THREE.Vector3(1, 1, 1),
		rotation: new THREE.Vector4(1, 0, 0, 0),
	},
	remoteTransforms : {
		position: new THREE.Vector3(0, 0, 0),
		scale: new THREE.Vector3(1, 1, 1),
		rotation: new THREE.Vector4(1, 0, 0, 0),
	},
	epsilon : 0.01
}




const holoCubeTransformsFolder = gui.addFolder("Holocube transforms");
const holoCubePositionFolder = holoCubeTransformsFolder.addFolder("position");
holoCubePositionFolder.add(guiParams.holoCubeTransforms.position, "x").min(-10.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
holoCubePositionFolder.add(guiParams.holoCubeTransforms.position, "y").min(0.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
holoCubePositionFolder.add(guiParams.holoCubeTransforms.position, "z").min(-10.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
const holoCubeScaleFolder = holoCubeTransformsFolder.addFolder("scale");
holoCubeScaleFolder.add(guiParams.holoCubeTransforms.scale, "x").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
holoCubeScaleFolder.add(guiParams.holoCubeTransforms.scale, "y").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
holoCubeScaleFolder.add(guiParams.holoCubeTransforms.scale, "z").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
// const holoCubeRotationFolder = holoCubeTransformsFolder.addFolder("rotation");
// holoCubeRotationFolder.add(guiParams.holoCubeTransforms.rotation, "x").min(-1).max(1).step(0.01).onChange(() => { updateAxisH("x", "y", "z")}).listen();
// holoCubeRotationFolder.add(guiParams.holoCubeTransforms.rotation, "y").min(-1).max(1).step(0.01).onChange(() => { updateAxisH("y", "z", "x")}).listen();
// holoCubeRotationFolder.add(guiParams.holoCubeTransforms.rotation, "z").min(-1).max(1).step(0.01).onChange(() => { updateAxisH("z", "x", "y")}).listen();
// holoCubeRotationFolder.add(guiParams.holoCubeTransforms.rotation, "w").name("angle").min(-Math.PI).max(Math.PI).step(0.01).onChange(updateHoloCubeTransform);

const remoteTransformsFolder = gui.addFolder("Remote Scene transforms");
const remoteScenePositionFolder = remoteTransformsFolder.addFolder("position");
remoteScenePositionFolder.add(guiParams.remoteTransforms.position, "x").min(-10.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
remoteScenePositionFolder.add(guiParams.remoteTransforms.position, "y").min(0.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
remoteScenePositionFolder.add(guiParams.remoteTransforms.position, "z").min(-10.0).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
const remoteSceneScaleFolder = remoteTransformsFolder.addFolder("scale");
remoteSceneScaleFolder.add(guiParams.remoteTransforms.scale, "x").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
remoteSceneScaleFolder.add(guiParams.remoteTransforms.scale, "y").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
remoteSceneScaleFolder.add(guiParams.remoteTransforms.scale, "z").min(0.1).max(10.0).step(0.01).onChange(updateHoloCubeTransform);
const remoteRotationFolder = remoteTransformsFolder.addFolder("rotation");
remoteRotationFolder.add(guiParams.remoteTransforms.rotation, "x").min(-1).max(1).step(0.01).onChange(() => { updateAxisV("x", "y", "z")}).listen();
remoteRotationFolder.add(guiParams.remoteTransforms.rotation, "y").min(-1).max(1).step(0.01).onChange(() => { updateAxisV("y", "z", "x")}).listen();
remoteRotationFolder.add(guiParams.remoteTransforms.rotation, "z").min(-1).max(1).step(0.01).onChange(() => { updateAxisV("z", "x", "y")}).listen();
remoteRotationFolder.add(guiParams.remoteTransforms.rotation, "w").name("angle").min(-Math.PI).max(Math.PI).step(0.01).onChange(updateHoloCubeTransform);

gui.add(guiParams, "epsilon").min(0.001).max(1).step(0.001)



/// VR specific code

controller1.addEventListener('selectstart', () => {
    console.log('Controller 1: Trigger pressed');
    controller1.children[0].material.color.set(0xff0000)
});
controller1.addEventListener('selectend', () => {
    console.log('Controller 1: Trigger released');
    controller1.children[0].material.color.set(0xffffff)

	spatialAnnotations.addAnnotation(closestPoint.clone());
});

controller1.addEventListener( 'squeezestart', () => {
	squeezing = true;
	console.log("squeeze start");
} );

controller1.addEventListener( 'squeezeend', () => {
	squeezing = false;
	console.log("squeeze end");
} );

