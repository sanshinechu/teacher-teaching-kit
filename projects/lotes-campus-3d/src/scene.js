// 羅東國小 3D 場景管理器：光影立體感升級版
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js';

export class CampusScene {
  constructor(containerElement) {
    this.container = containerElement;
    this.width = containerElement.clientWidth || window.innerWidth;
    this.height = containerElement.clientHeight || window.innerHeight;
    this.isNight = false;

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initLights();
    this.initMaterials();
    this.initControls();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 柔和陰影
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#dbe7df'); // 柔和草木綠灰背景
    this.scene.fog = new THREE.FogExp2('#dbe7df', 0.0028);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(42, this.width / this.height, 1, 1000);
    // 預設立體鳥瞰：從西南側斜 38 度角眺望校園核心，清楚看到建物側面窗戶與操場
    this.defaultCameraPos = new THREE.Vector3(-110, 68, 105);
    this.defaultTarget = new THREE.Vector3(5, 5, -8);
    this.camera.position.copy(this.defaultCameraPos);
  }

  initLights() {
    // 1. 半球環境光（降低散射強度，避免沖淡陰影）
    this.hemiLight = new THREE.HemisphereLight('#fefefe', '#8da892', 0.55);
    this.scene.add(this.hemiLight);

    // 2. 太陽平行光（增強陽光對比，拉出建築物立體陰影）
    this.sunLight = new THREE.DirectionalLight('#fff8e7', 1.45);
    this.sunLight.position.set(-130, 160, 90);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 450;
    this.sunLight.shadow.camera.left = -160;
    this.sunLight.shadow.camera.right = 160;
    this.sunLight.shadow.camera.top = 160;
    this.sunLight.shadow.camera.bottom = -160;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // 3. 背側冷色微補光
    this.fillLight = new THREE.DirectionalLight('#92b9cf', 0.35);
    this.fillLight.position.set(120, 70, -110);
    this.scene.add(this.fillLight);
  }

  initMaterials() {
    const createMat = (color, roughness = 0.75, metalness = 0.05) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });

    this.materials = {
      grass: createMat('#7ca86b', 0.9, 0),        // 校園濃綠草皮
      field: createMat('#5c9c57', 0.85, 0),       // 操場中央足球場草地
      track: createMat('#b85448', 0.65, 0.05),    // 200M PU 紅色跑道（更鮮明）
      road: createMat('#4a555e', 0.75, 0.1),      // 周圍柏油道路（沉穩深灰）
      roadLine: new THREE.LineBasicMaterial({ color: '#f0e68c', linewidth: 2 }),
      pave: createMat('#ded4be', 0.8, 0.05),      // 中庭石磚
      lineWhite: new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 2 }),

      // 建物牆身與屋頂（增強色彩對比）
      hanyu: createMat('#dfe9dc', 0.7),           // 涵育樓淡青雅白
      xiaoyou: createMat('#f5e8cf', 0.7),         // 校友館溫潤米黃
      yingxi_north: createMat('#ece6d8', 0.75),   // 迎曦樓淺奶茶
      yingxi_south: createMat('#ece6d8', 0.75),
      bailing_main: createMat('#e5dcce', 0.75),   // 百齡樓質感灰棕
      bailing_kindergarten: createMat('#ffebb8', 0.7), // 幼兒園陽光黃
      gymnasium: createMat('#d2ded0', 0.7),       // 樹人館
      science: createMat('#d8e4eb', 0.7),         // 科學館

      wallCream: createMat('#ece3d2', 0.75),
      wallWhite: createMat('#ffffff', 0.65),
      wallBrick: createMat('#ad5949', 0.8),
      roofRed: createMat('#964132', 0.65),        // 磚紅琉璃瓦
      roofGreen: createMat('#396b52', 0.6),       // 墨綠屋頂
      roofDark: createMat('#465057', 0.7),        // 女兒牆壓頂灰

      // 窗櫺（深海青藍反射，立體感來源）
      window: new THREE.MeshStandardMaterial({
        color: '#2e5163',
        roughness: 0.15,
        metalness: 0.45
      }),
      windowFrame: createMat('#ffffff', 0.5),
      metal: createMat('#3d474e', 0.4, 0.6),
      trunk: createMat('#5c4432', 0.9, 0),
      treeFoliage: createMat('#2d6342', 0.85, 0),
      treeLight: createMat('#427e54', 0.85, 0),
      treeAccent: createMat('#589464', 0.85, 0)
    };
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 350;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.target.copy(this.defaultTarget);
  }

  toggleDayNight() {
    this.isNight = !this.isNight;
    if (this.isNight) {
      this.scene.background.set('#0d1520');
      this.scene.fog.color.set('#0d1520');
      this.hemiLight.intensity = 0.2;
      this.sunLight.intensity = 0.12;
      this.sunLight.color.set('#6a82a0');
      this.materials.window.emissive.set('#ffcc66');
      this.materials.window.emissiveIntensity = 0.8;
    } else {
      this.scene.background.set('#dbe7df');
      this.scene.fog.color.set('#dbe7df');
      this.hemiLight.intensity = 0.55;
      this.sunLight.intensity = 1.45;
      this.sunLight.color.set('#fff8e7');
      this.materials.window.emissive.set('#000000');
      this.materials.window.emissiveIntensity = 0;
    }
    return this.isNight;
  }

  resetView() {
    this.controls.target.copy(this.defaultTarget);
    this.camera.position.copy(this.defaultCameraPos);
  }

  setTopView() {
    this.controls.target.copy(this.defaultTarget);
    this.camera.position.set(5, 175, -8);
  }

  onWindowResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
