// 羅東國小 3D 場景管理器：翠綠草地基座、清晰日照陰影與卡通 Toon 質感
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js';
import { ToonPost } from './toon_post.js';

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
    this.initPostProcessing();

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
    // 溫暖明亮的晴天色
    this.scene.background = new THREE.Color('#86bfe6');
    this.scene.fog = null;
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 1, 1000);
    // 預設經典視角：西南方斜側眺望全校（操場在左、風雨球場與百齡樓在右中）
    this.defaultCameraPos = new THREE.Vector3(-110, 85, 125);
    this.defaultTarget = new THREE.Vector3(5, 5, 8);
    this.camera.position.copy(this.defaultCameraPos);
  }

  initLights() {
    // 1. 環境光
    this.hemiLight = new THREE.HemisphereLight('#cce5f7', '#254a31', 0.65);
    this.scene.add(this.hemiLight);

    // 2. 主陽光（卡通斜射暖陽）
    this.sunLight = new THREE.DirectionalLight('#fff4dc', 1.6);
    this.sunLight.position.set(-140, 160, 85);
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

    // 3. 補光
    this.fillLight = new THREE.DirectionalLight('#608da8', 0.45);
    this.fillLight.position.set(130, 70, -110);
    this.scene.add(this.fillLight);
  }

  initMaterials() {
    // 全面採用 MeshToonMaterial 打造卡通賽璐珞動畫風格
    const createToon = (color) => new THREE.MeshToonMaterial({ color });

    this.materials = {
      // 大地草皮
      grass: createToon('#48914f'),
      field: createToon('#2d7334'),
      track: createToon('#2a63b0'),        // 湛藍 PU 跑道
      artificialTurf: createToon('#309448'),
      artificialTurfLight: createToon('#3cb558'),
      court: createToon('#e6a860'),
      courtInner: createToon('#3a8a47'),
      solarPanel: createToon('#182535'),   // 太陽能光電板
      road: createToon('#30373e'),         // 瀝青路面
      roadLine: new THREE.LineBasicMaterial({ color: '#f5c518', linewidth: 3 }),
      pave: createToon('#c9af83'),         // 中庭石磚
      parkingPave: createToon('#3b454f'),
      lineWhite: new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 2 }),

      // 校舍立面（飽滿童趣插畫色階）
      hanyu: createToon('#6ea385'),           // 涵育樓青翠磚
      xiaoyou: createToon('#dbab58'),         // 校友館亮金麥
      yingxi_north: createToon('#b5986e'),    // 迎曦樓厚實奶茶棕
      yingxi_south: createToon('#b5986e'),
      bailing_wave: createToon('#9aa4b0'),    // 百齡樓高雅灰
      bailing_main: createToon('#9aa4b0'),
      bailing_kindergarten: createToon('#f2a833'), // 幼兒園活力橙
      gymnasium: createToon('#5b9971'),       // 樹人館蒼翠鋼構
      science: createToon('#4a7b9c'),         // 科學館海軍藍

      wallGray: createToon('#9aa4b0'),
      wallCream: createToon('#c4b08d'),
      wallWhite: createToon('#eff1f5'),
      wallBrick: createToon('#a63524'),       // 磚紅大門柱
      roofRed: createToon('#8f2317'),         // 深紅瓦
      roofGreen: createToon('#195230'),
      roofWaveGreen: createToon('#30824e'),   // 翠綠波浪圓拱屋頂
      roofWaveBeige: createToon('#ebe1cb'),   // 米黃波浪圓拱飾條
      roofDark: createToon('#222a30'),

      // 窗格
      window: createToon('#1b3240'),
      windowFrame: createToon('#ffffff'),
      metal: createToon('#2b333a'),
      trunk: createToon('#452814'),

      // 校園樹木
      treeFoliage: createToon('#164a27'),
      treeLight: createToon('#236335'),
      treeAccent: createToon('#328246')
    };
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 350;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.copy(this.defaultTarget);
  }

  initPostProcessing() {
    this.post = new ToonPost(this.renderer, this.scene, this.camera);
  }

  toggleDayNight() {
    this.isNight = !this.isNight;
    if (this.isNight) {
      this.scene.background.set('#0b1424');
      this.hemiLight.intensity = 0.25;
      this.sunLight.intensity = 0.12;
      this.sunLight.color.set('#6a83a3');
      this.materials.window.emissive = new THREE.Color('#ffc14d');
      this.materials.window.emissiveIntensity = 0.85;
    } else {
      this.scene.background.set('#86bfe6');
      this.hemiLight.intensity = 0.65;
      this.sunLight.intensity = 1.6;
      this.sunLight.color.set('#fff4dc');
      this.materials.window.emissive = new THREE.Color('#000000');
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
    this.camera.position.set(5, 210, 8);
  }

  onWindowResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    if (this.post) {
      this.post.setSize(this.width, this.height);
    }
  }

  render() {
    this.controls.update();
    if (this.post) {
      this.post.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
