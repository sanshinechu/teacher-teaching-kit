// 羅東國小 3D 場景管理器：高飽和度、立體色彩增強版
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
    // 使用標準色調對應，避免強光過曝白化，保留飽滿色彩
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#cce2d3'); // 飽滿晴空草木綠底
    this.scene.fog = new THREE.FogExp2('#cce2d3', 0.0022);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(42, this.width / this.height, 1, 1000);
    this.defaultCameraPos = new THREE.Vector3(-110, 68, 105);
    this.defaultTarget = new THREE.Vector3(5, 5, -8);
    this.camera.position.copy(this.defaultCameraPos);
  }

  initLights() {
    // 降低環境光散射強度，拉開受光面與背光面的立體明暗反差
    this.hemiLight = new THREE.HemisphereLight('#ffffff', '#5c8065', 0.45);
    this.scene.add(this.hemiLight);

    // 主要太陽直射光（微暖金黃陽光）
    this.sunLight = new THREE.DirectionalLight('#fff5db', 1.6);
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

    // 側面微冷補光，讓背光面有細節但保持立體深淺
    this.fillLight = new THREE.DirectionalLight('#7daecc', 0.25);
    this.fillLight.position.set(120, 70, -110);
    this.scene.add(this.fillLight);
  }

  initMaterials() {
    const createMat = (color, roughness = 0.65, metalness = 0.05) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });

    this.materials = {
      // 鮮明飽滿的戶外地坪與球場
      grass: createMat('#5d944c', 0.85, 0),        // 濃郁生機校園綠草地
      field: createMat('#468a3f', 0.8, 0),         // 足球場深綠茵草坪
      track: createMat('#c04234', 0.55, 0.05),     // 鮮紅標準 PU 跑道
      road: createMat('#37424a', 0.7, 0.1),        // 沉穩瀝青柏油路
      roadLine: new THREE.LineBasicMaterial({ color: '#f5d04c', linewidth: 2 }),
      pave: createMat('#cfbe9b', 0.75, 0.05),      // 中庭溫潤石板鋪面
      lineWhite: new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 2 }),

      // 建物牆身與屋頂（色彩飽和度加重，各棟特色分明）
      hanyu: createMat('#cde2cb', 0.65),           // 涵育樓青翠淡綠磚
      xiaoyou: createMat('#ebd1a0', 0.65),         // 校友館溫潤米黃石
      yingxi_north: createMat('#d8ceb9', 0.7),     // 迎曦樓典雅奶茶色
      yingxi_south: createMat('#d8ceb9', 0.7),
      bailing_main: createMat('#d4c3ab', 0.7),     // 百齡樓質感棕褐
      bailing_kindergarten: createMat('#ffdb8b', 0.65), // 幼兒園活潑金黃
      gymnasium: createMat('#bed4bc', 0.65),       // 樹人館
      science: createMat('#bed4e3', 0.65),         // 科學館科技藍灰

      wallCream: createMat('#dfd2bb', 0.7),
      wallWhite: createMat('#f5f5f5', 0.6),
      wallBrick: createMat('#a84b39', 0.75),       // 濃郁紅磚門柱
      roofRed: createMat('#943324', 0.55),         // 鮮明磚紅琉璃瓦
      roofGreen: createMat('#2b6647', 0.55),       // 濃郁墨綠圓拱頂
      roofDark: createMat('#373f45', 0.65),        // 深灰色女兒牆輪廓線

      // 深邃寶藍色窗格（立體感最強的視覺亮點）
      window: new THREE.MeshStandardMaterial({
        color: '#1a4154',
        roughness: 0.1,
        metalness: 0.6
      }),
      windowFrame: createMat('#ffffff', 0.5),
      metal: createMat('#333d45', 0.35, 0.7),
      trunk: createMat('#4f3622', 0.9, 0),

      // 濃郁立體樹冠（三種深淺綠意交疊）
      treeFoliage: createMat('#1f5735', 0.8, 0),
      treeLight: createMat('#337848', 0.8, 0),
      treeAccent: createMat('#48945b', 0.8, 0)
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
      this.scene.background.set('#0a111a');
      this.scene.fog.color.set('#0a111a');
      this.hemiLight.intensity = 0.18;
      this.sunLight.intensity = 0.1;
      this.sunLight.color.set('#5f7591');
      this.materials.window.emissive.set('#ffc34d');
      this.materials.window.emissiveIntensity = 0.9;
    } else {
      this.scene.background.set('#cce2d3');
      this.scene.fog.color.set('#cce2d3');
      this.hemiLight.intensity = 0.45;
      this.sunLight.intensity = 1.6;
      this.sunLight.color.set('#fff5db');
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
