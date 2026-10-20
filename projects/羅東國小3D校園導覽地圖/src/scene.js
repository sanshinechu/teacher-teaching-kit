// 羅東國小 3D 場景管理器：初始化 Three.js 場景、光照、相機、日夜切換與材質庫
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
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#eaf2ec'); // 羅小清新晨曦草木綠底
    this.scene.fog = new THREE.FogExp2('#eaf2ec', 0.0035);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
    // 預設鳥瞰視角：位於西南側高空，俯瞰整座羅東國小校園與操場
    this.defaultCameraPos = new THREE.Vector3(-90, 85, 120);
    this.defaultTarget = new THREE.Vector3(0, 0, -10);
    this.camera.position.copy(this.defaultCameraPos);
  }

  initLights() {
    // 1. 半球環境光（天空微青、地面柔和暖綠）
    this.hemiLight = new THREE.HemisphereLight('#ffffff', '#adc2aa', 0.85);
    this.scene.add(this.hemiLight);

    // 2. 太陽平行光（產生校舍立體陰影）
    this.sunLight = new THREE.DirectionalLight('#fffbe8', 1.25);
    this.sunLight.position.set(-100, 160, 80);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 400;
    this.sunLight.shadow.camera.left = -160;
    this.sunLight.shadow.camera.right = 160;
    this.sunLight.shadow.camera.top = 160;
    this.sunLight.shadow.camera.bottom = -160;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // 3. 補光
    this.fillLight = new THREE.DirectionalLight('#b0d5e8', 0.4);
    this.fillLight.position.set(100, 80, -100);
    this.scene.add(this.fillLight);
  }

  initMaterials() {
    const createMat = (color, roughness = 0.8, metalness = 0.1) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });

    this.materials = {
      grass: createMat('#8fae7e', 0.9, 0),        // 校園綠草皮
      field: createMat('#6d9f67', 0.9, 0),        // 操場中央足球場草地
      track: createMat('#b96459', 0.7, 0.05),     // 200M PU 紅色跑道
      road: createMat('#5a656e', 0.8, 0.1),       // 周圍柏油道路
      pave: createMat('#e3d8c4', 0.85, 0.05),     // 走道與中庭石磚
      lineWhite: new THREE.LineBasicMaterial({ color: '#fefefe', linewidth: 2 }),

      // 建物牆身與屋頂
      hanyu: createMat('#e6ede2', 0.75),          // 涵育樓淡青白磚
      xiaoyou: createMat('#f4ebd6', 0.8),         // 校友館暖米色
      yingxi_north: createMat('#f6f1e6', 0.8),    // 迎曦樓典雅白
      yingxi_south: createMat('#f6f1e6', 0.8),
      bailing_main: createMat('#ece4d5', 0.8),    // 百齡樓穩重淺褐
      bailing_kindergarten: createMat('#fff1d6', 0.8), // 幼兒園活潑鵝黃
      gymnasium: createMat('#d8e2d4', 0.7),       // 樹人館
      science: createMat('#e0e8ed', 0.75),        // 科學館

      wallCream: createMat('#eee7d8', 0.8),
      wallWhite: createMat('#fafafa', 0.7),
      wallBrick: createMat('#b56b5b', 0.85),
      roofRed: createMat('#9c5042', 0.7),
      roofGreen: createMat('#46735c', 0.65),

      window: new THREE.MeshStandardMaterial({
        color: '#466d7c',
        roughness: 0.25,
        metalness: 0.35
      }),
      metal: createMat('#4a555c', 0.5, 0.6),
      trunk: createMat('#6e543e', 0.9, 0),
      treeFoliage: createMat('#38734f', 0.85, 0),
      treeLight: createMat('#4e8b5a', 0.85, 0)
    };
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 350;
    this.controls.maxPolarAngle = Math.PI * 0.48; // 防止鏡頭鑽入地下
    this.controls.target.copy(this.defaultTarget);
  }

  toggleDayNight() {
    this.isNight = !this.isNight;
    if (this.isNight) {
      this.scene.background.set('#101924');
      this.scene.fog.color.set('#101924');
      this.hemiLight.intensity = 0.25;
      this.sunLight.intensity = 0.15;
      this.sunLight.color.set('#6a82a0');
      this.materials.window.emissive.set('#ffda78');
      this.materials.window.emissiveIntensity = 0.65;
    } else {
      this.scene.background.set('#eaf2ec');
      this.scene.fog.color.set('#eaf2ec');
      this.hemiLight.intensity = 0.85;
      this.sunLight.intensity = 1.25;
      this.sunLight.color.set('#fffbe8');
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
    this.camera.position.set(0, 180, -10);
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
