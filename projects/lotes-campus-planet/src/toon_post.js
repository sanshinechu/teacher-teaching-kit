// 羅東國小卡通渲染後製器：色階調色 + 法線/深度雙重邊緣檢測（描出黑邊）
import * as THREE from '../vendor/three.module.js';

export class ToonPost {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    const size = new THREE.Vector2();
    renderer.getSize(size);
    const pr = renderer.getPixelRatio();
    const w = Math.round(size.x * pr);
    const h = Math.round(size.y * pr);

    // 1. 顏色與深度 Target
    this.colorRT = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      depthBuffer: true,
      depthTexture: new THREE.DepthTexture(w, h, THREE.UnsignedIntType)
    });

    // 2. 法線 Target
    this.normalRT = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat
    });
    this.normalMaterial = new THREE.MeshNormalMaterial();

    // 3. 後製全螢幕材質 Shader
    this.postMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: this.colorRT.texture },
        tDepth: { value: this.colorRT.depthTexture },
        tNormal: { value: this.normalRT.texture },
        uResolution: { value: new THREE.Vector2(w, h) },
        cameraNear: { value: camera.near },
        cameraFar: { value: camera.far },
        uOutlineColor: { value: new THREE.Color('#242b29') },
        uOutlineThickness: { value: 1.25 * pr },
        uDepthMultiplier: { value: 25.0 },
        uNormalThreshold: { value: 0.32 },
        uEnabled: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        #include <packing>
        uniform sampler2D tColor;
        uniform sampler2D tDepth;
        uniform sampler2D tNormal;
        uniform vec2 uResolution;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform vec3 uOutlineColor;
        uniform float uOutlineThickness;
        uniform float uDepthMultiplier;
        uniform float uNormalThreshold;
        uniform float uEnabled;

        varying vec2 vUv;

        float readDepth(vec2 coord) {
          float fragCoordZ = texture2D(tDepth, coord).x;
          float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
          return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
        }

        void main() {
          vec4 baseColor = texture2D(tColor, vUv);
          if (uEnabled < 0.5) {
            gl_FragColor = baseColor;
            return;
          }

          vec2 texel = vec2(uOutlineThickness) / uResolution;

          // 八鄰域深度採樣 (Sobel 核心邊緣檢測)
          float d0 = readDepth(vUv + vec2(-texel.x, -texel.y));
          float d1 = readDepth(vUv + vec2(0.0, -texel.y));
          float d2 = readDepth(vUv + vec2(texel.x, -texel.y));
          float d3 = readDepth(vUv + vec2(-texel.x, 0.0));
          float d5 = readDepth(vUv + vec2(texel.x, 0.0));
          float d6 = readDepth(vUv + vec2(-texel.x, texel.y));
          float d7 = readDepth(vUv + vec2(0.0, texel.y));
          float d8 = readDepth(vUv + vec2(texel.x, texel.y));

          float dX = (d2 + 2.0 * d5 + d8) - (d0 + 2.0 * d3 + d6);
          float dY = (d6 + 2.0 * d7 + d8) - (d0 + 2.0 * d1 + d2);
          float depthEdge = length(vec2(dX, dY)) * uDepthMultiplier;

          // 法線邊緣檢測
          vec3 n0 = texture2D(tNormal, vUv + vec2(-texel.x, 0.0)).xyz;
          vec3 n1 = texture2D(tNormal, vUv + vec2(texel.x, 0.0)).xyz;
          vec3 n2 = texture2D(tNormal, vUv + vec2(0.0, -texel.y)).xyz;
          vec3 n3 = texture2D(tNormal, vUv + vec2(0.0, texel.y)).xyz;

          vec3 diffN1 = n1 - n0;
          vec3 diffN2 = n3 - n2;
          float normalEdge = length(diffN1) + length(diffN2);

          // 綜合邊界判斷
          float edge = 0.0;
          if (depthEdge > 0.08 || normalEdge > uNormalThreshold) {
            edge = 1.0;
          }

          // 顏色輕微增艷提亮，更具童趣插畫感
          vec3 cartoonColor = pow(baseColor.rgb, vec3(0.92));
          vec3 finalColor = mix(cartoonColor, uOutlineColor, edge * 0.88);

          gl_FragColor = vec4(finalColor, baseColor.a);
        }
      `,
      depthTest: false,
      depthWrite: false
    });

    // 建立全螢幕 Quad
    this.fsQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postMaterial);
    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.postScene.add(this.fsQuad);
  }

  setSize(width, height) {
    const pr = this.renderer.getPixelRatio();
    const w = Math.round(width * pr);
    const h = Math.round(height * pr);
    this.colorRT.setSize(w, h);
    this.normalRT.setSize(w, h);
    this.postMaterial.uniforms.uResolution.value.set(w, h);
    this.postMaterial.uniforms.uOutlineThickness.value = 1.25 * pr;
  }

  render() {
    // Pass 1: 渲染常規顏色與深度
    this.renderer.setRenderTarget(this.colorRT);
    this.renderer.render(this.scene, this.camera);

    // Pass 2: 將整場景替換為法線材質渲染法線圖
    this.scene.overrideMaterial = this.normalMaterial;
    this.renderer.setRenderTarget(this.normalRT);
    this.renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = null;

    // Pass 3: 邊緣檢測描邊並輸出到 Canvas
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCamera);
  }
}
