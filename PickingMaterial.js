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
	uniform vec3 origin;
	uniform vec3 direction;
	uniform float epsilon;
	
	in vec2 vUv;

	bool filterOut ( vec3 pos ) {
		return (abs(pos.x) > 0.5 || abs(pos.y) > 0.5  || abs(pos.z) > 0.5);
	}
	
	void main() {
		float rawdepth = texture2D(tDepth, vUv).r;
		if(rawdepth >= 1.) 
			discard;

		vec4 remoteClipPos = vec4( 2. * vec3( vUv, rawdepth ) - vec3( 1. ), 1. );

		vec4 remoteViewPos = invOAProj * remoteClipPos;
		remoteViewPos /= remoteViewPos.w;
		vec4 remoteWorldPos = invOAView * remoteViewPos;
		vec4 modelPos = invTransform * remoteWorldPos;

		if(filterOut(modelPos.xyz))
			discard;

		vec3 localWorldPos = modelPos.xyz * scalingFactor;
		localWorldPos = (transform * vec4( localWorldPos, 1.0) ).xyz;
		vec4 localClipPos = projectionMatrix * viewMatrix * vec4(localWorldPos, 1.0);

		vec3 toPoint = localWorldPos - origin;
		float dist = length(cross(toPoint, direction));

		if(dist < epsilon && dot(direction, toPoint) > 0.)
			gl_FragColor = vec4((localWorldPos.xyz), 1.0);
		else
			// discard;
			gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);

		gl_FragDepth = (localClipPos.z / localClipPos.w) * 0.5 + 0.5;
		// gl_FragColor = vec4( localWorldPos, 1.0 );
	}
`


export default class PickingMaterial extends THREE.ShaderMaterial {
	
	constructor ( depthTexture ) {
		console.log( `PickingMaterial - constructor` );

		const uniforms = {
			tDepth: { value: depthTexture },
			scalingFactor: { value: new THREE.Vector3( 1, 1, 1 ) },
			invOAProj: { value: new THREE.Matrix4( ) },
			invOAView: { value: new THREE.Matrix4( ) },
			invTransform: { value: new THREE.Matrix4( ) },
			transform: { value: new THREE.Matrix4( ) },
			origin: { value: new THREE.Vector3( ) },
			direction: { value: new THREE.Vector3( ) },
			epsilon: { value: 1 },

		}

		super({ uniforms, vertexShader, fragmentShader, side: THREE.DoubleSide });
	}

	setUniforms ( uniforms = {} ) {
		for ( let [ uniform, value ] of Object.entries( uniforms ) ) {
			this.uniforms[uniform].value = value;
		}
	}
}