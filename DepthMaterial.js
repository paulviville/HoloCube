import * as THREE from "./three/three.module.js";

const vertexShader = `
	out vec2 vUv;

	void main () {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}
`;

const fragmentShader = `
	uniform sampler2D tDepth;
	uniform sampler2D tColor;
	uniform vec3 scalingFactor;
	
	uniform mat4 projectionMatrix;
	uniform mat4 invOAProj;
	uniform mat4 invOAView;
	uniform mat4 invTransform; // view to model space
	uniform mat4 transform; // model to display space
	
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

		vec4 remoteViewPos = invOAProj * remoteClipPos;
		remoteViewPos /= remoteViewPos.w;
		vec4 remoteWorldPos = invOAView * remoteViewPos;
		vec4 localPos = invTransform * remoteWorldPos;

		if(filterOut(localPos.xyz))
			discard;

		vec3 localWorldPos = localPos.xyz * scalingFactor;
		vec4 localClipPos = projectionMatrix * viewMatrix * transform * vec4(localWorldPos, 1.0);

		gl_FragDepth = (localClipPos.z / localClipPos.w) * 0.5 + 0.5;
		gl_FragColor = vec4(texture2D(tColor, vUv).xyz * 2., 1.0);
	}
`


export default class DepthMaterial extends THREE.ShaderMaterial {
	
	constructor ( texture, depthTexture ) {
		console.log( `DepthMaterial - constructor` );

		const uniforms = {
			tColor: { value: texture },
			tDepth: { value: depthTexture },
			scalingFactor: { value: new THREE.Vector3( 1, 1, 1 ) },
			invOAProj: { value: new THREE.Matrix4( ) },
			invOAView: { value: new THREE.Matrix4( ) },
			invTransform: { value: new THREE.Matrix4( ) },
			transform: { value: new THREE.Matrix4( ) },
		}

		super({ uniforms, vertexShader, fragmentShader, side: THREE.DoubleSide });
	}

	setUniforms ( uniforms = {} ) {
		for ( let [ uniform, value ] of Object.entries( uniforms ) ) {
			this.uniforms[uniform].value = value;
		}
	}
}