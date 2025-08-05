import * as THREE from "./three/three.module.js";

const vertexShader = `
	out vec2 vUv;

	void main () {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const fragmentShader = `
	uniform sampler2D tDepth;
	uniform sampler2D tColor;

	uniform vec3 display;
	uniform mat4 projectionMatrix;
	uniform mat4 offAxisProj;
	uniform mat4 offAxisView;
	uniform mat4 displayTransform;
	
	in vec2 vUv;

	bool filterOut ( vec3 pos ) {
		return (abs(pos.x) > 0.5 || abs(pos.y) > 0.5  || abs(pos.z) > 0.5);
	}
	
	void main() {
		float rawdepth = texture2D(tDepth, vUv).r;
		if(rawdepth >= 1.) 
			discard;

		vec4 remoteClipPos = vec4(
			vUv.x * 2.0 - 1.0,
			vUv.y * 2.0 - 1.0,
			rawdepth * 2.0 - 1.0,
			1.0);

		vec4 remoteViewPos = offAxisProj * remoteClipPos;
		remoteViewPos /= remoteViewPos.w;
		vec4 remoteWorldPos = offAxisView * remoteViewPos;
		vec4 localPos = displayTransform * remoteWorldPos;

		if(filterOut(localPos.xyz))
			discard;

		vec3 localWorldPos = localPos.xyz * display;

		vec4 localClipPos = projectionMatrix * viewMatrix * vec4(localWorldPos, 1.0);

		gl_FragDepth = (localClipPos.z / localClipPos.w) * 0.5 + 0.5;
		gl_FragColor = vec4(texture2D(tColor, vUv).xyz * 2., 1.0);
	}
`;

export default class HoloMaterial extends THREE.RawShaderMaterial {
	constructor ( colorTexture, depthTexture ) {
		console.log( `HoloMaterial - constructor` ); 
		
		const materialParameters = {
			uniforms: {
				tDepth: { value: undefined },
				tColor: { value: undefined },
				scalingFactor: { value: new THREE.Vector3( 1, 1, 1 ) },
				offAxisProj: { value: new THREE.Matrix4() },
				offAxisView: { value: new THREE.Matrix4() },
				cubeTransform: { value: new THREE.Matrix4() },
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
		}

		super( materialParameters );
	}


}