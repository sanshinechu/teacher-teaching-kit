// 羅東國小 3D 場景管理器：翠綠草地基座、清晰日照陰影與飽滿厚實質感
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
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    // 溫暖明亮的晴空白雲天色
    this.scene.background = new THREE.Color('#8bb8cb');
    this.scene.fog = null; // 徹底關閉白霧，確保材質原始濃郁度
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 1, 1000);
    // 預設經典視角：西南方斜側眺望
    this.defaultCameraPos = new THREE.Vector3(-115, 62, 100);
    this.defaultTarget = new THREE.Vector3(5, 4, -8);
    this.camera.position.copy(this.defaultCameraPos);
  }

  initLights() {
    // 1. 環境光：降低強度並採用「天藍＋大地暗綠」，受光與背光對比拉到 3:1
    this.hemiLight = new THREE.HemisphereLight('#b3d9f2', '#1b3b22', 0.42);
    this.scene.add(this.hemiLight);

    // 2. 主陽光：強烈斜射陽光，拉出深色剪影
    this.sunLight = new THREE.DirectionalLight('#fff2d4', 1.85);
    this.sunLight.position.set(-140, 150, 85);
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

    // 3. 背面冷藍微補光，暗面不會死黑但層次立體
    this.fillLight = new THREE.DirectionalLight('#3e6885', 0.25);
    this.fillLight.position.set(130, 60, -110);
    this.scene.add(this.fillLight);
  }

  initMaterials() {
    const createMat = (color, roughness = 0.5, metalness = 0.05) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });

    this.materials = {
      // 濃郁大地草皮（鮮翠深草綠，托起整座校園）
      grass: createMat('#327838', 0.7, 0),         // 鮮翠校園草皮
      field: createMat('#225e26', 0.65, 0),        // 足球場深蔥綠
      track: createMat('#b5271a', 0.45, 0.05),     // 鮮豔紅赭色 200M PU 跑道
      road: createMat('#22282e', 0.6, 0.1),        // 沉穩深黑灰瀝青路面
      roadLine: new THREE.LineBasicMaterial({ color: '#f5c518', linewidth: 3 }),
      pave: createMat('#ba9f72', 0.55, 0.05),      // 中庭溫潤黃褐石磚鋪面
      lineWhite: new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 2 }),

      // 校舍立面：色彩飽滿、厚實，不再灰白
      hanyu: createMat('#649479', 0.45),           // 涵育樓：在地沉穩青翠磚
      xiaoyou: createMat('#cc9847', 0.45),         // 校友館：溫潤亮金麥色石
      yingxi_north: createMat('#aa8c61', 0.45),    // 迎曦樓：厚實深奶茶棕
      yingxi_south: createMat('#aa8c61', 0.45),
      bailing_main: createMat('#876d54', 0.45),    // 百齡樓：大氣赭紅灰褐
      bailing_kindergarten: createMat('#e69a24', 0.45), // 幼兒園：活潑亮金橙
      gymnasium: createMat('#4f8562', 0.45),       // 樹人館：蒼翠鋼構
      science: createMat('#416d8a', 0.45),         // 科學館：海軍深科技藍

      wallCream: createMat('#b8a37f', 0.5),
      wallWhite: createMat('#e3e6ea', 0.4),
      wallBrick: createMat('#8f2a1b', 0.55),       // 濃郁磚紅大門柱
      roofRed: createMat('#7d1d12', 0.35),         // 鮮濃深紅瓦
      roofGreen: createMat('#134226', 0.35),       // 濃郁墨綠圓拱頂
      roofDark: createMat('#1b2126', 0.45),        // 俐落深色女兒牆壓頂

      // 深邃反光鍍膜窗格（高反差金屬反光）
      window: new THREE.MeshStandardMaterial({
        color: '#081a24',
        roughness: 0.05,
        metalness: 0.85
      }),
      windowFrame: createMat('#ffffff', 0.35),
      metal: createMat('#20262b', 0.25, 0.85),
      trunk: createMat('#331d0e', 0.85, 0),

      // 濃郁層次立體樟樹與榕樹
      treeFoliage: createMat('#0b361b', 0.65, 0),
      treeLight: createMat('#184d28', 0.65, 0),
      treeAccent: createMat('#266937', 0.65, 0)
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
      this.scene.background.set('#04080e');
      this.hemiLight.intensity = 0.15;
      this.sunLight.intensity = 0.08;
      this.sunLight.color.set('#5f7591');
      this.materials.window.emissive.set('#ffb833');
      this.materials.window.emissiveIntensity = 1.0;
    } else {
      this.scene.background.set('#8bb8cb');
      this.hemiLight.intensity = 0.42;
      this.sunLight.intensity = 1.85;
      this.sunLight.color.set('#fff2d4');
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
