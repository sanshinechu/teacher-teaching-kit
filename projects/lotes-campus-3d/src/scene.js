// 羅東國小 3D 場景管理器：高對比、鮮明立體、無霧氣白化的真實校園質感版
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
    // 使用 Cineon 增強色彩飽和度與暗部反差
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    // 晴朗純淨天空藍（移除白霧，徹底消除霧化泛白感）
    this.scene.background = new THREE.Color('#98c4d8');
    this.scene.fog = null; // 徹底關閉霧氣，讓所有色彩最純粹透亮
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(42, this.width / this.height, 1, 1000);
    this.defaultCameraPos = new THREE.Vector3(-110, 68, 105);
    this.defaultTarget = new THREE.Vector3(5, 5, -8);
    this.camera.position.copy(this.defaultCameraPos);
  }

  initLights() {
    // 1. 環境光：降低強度並採用清透天藍＋深綠，杜絕漫射強光沖淡色彩
    this.hemiLight = new THREE.HemisphereLight('#87b5d1', '#284d33', 0.4);
    this.scene.add(this.hemiLight);

    // 2. 主陽光：鮮明金黃陽光，拉出強烈立體陰影與高反差
    this.sunLight = new THREE.DirectionalLight('#fff0cf', 1.8);
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

    // 3. 側面藍調微補光
    this.fillLight = new THREE.DirectionalLight('#5084a6', 0.2);
    this.fillLight.position.set(120, 70, -110);
    this.scene.add(this.fillLight);
  }

  initMaterials() {
    // 粗糙度降至 0.45，讓材質更有質感光澤，不再粉白乾澀
    const createMat = (color, roughness = 0.45, metalness = 0.08) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });

    this.materials = {
      // 鮮濃純正的大地地坪
      grass: createMat('#387e35', 0.7, 0),         // 鮮郁深草綠（對比強烈）
      field: createMat('#286b2b', 0.65, 0),        // 足球場深蔥綠
      track: createMat('#b82c1e', 0.45, 0.05),     // 鮮紅艷麗的 200M PU 跑道
      road: createMat('#232a30', 0.6, 0.1),        // 沉穩深黑灰瀝青路面
      roadLine: new THREE.LineBasicMaterial({ color: '#f5c518', linewidth: 3 }),
      pave: createMat('#bfa67a', 0.55, 0.05),      // 中庭厚實黃褐石磚
      lineWhite: new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 2 }),

      // 校舍外牆：濃郁有厚度，各棟色彩鮮明
      hanyu: createMat('#7ea88f', 0.45),           // 涵育樓：沉穩蒼綠磚
      xiaoyou: createMat('#cfa55b', 0.45),         // 校友館：飽滿金黃麥色石
      yingxi_north: createMat('#b89d74', 0.45),    // 迎曦樓：溫潤濃郁奶茶棕
      yingxi_south: createMat('#b89d74', 0.45),
      bailing_main: createMat('#968065', 0.45),    // 百齡樓：大氣灰褐磚
      bailing_kindergarten: createMat('#e8a638', 0.45), // 幼兒園：鮮明亮橙黃
      gymnasium: createMat('#699679', 0.45),       // 樹人館：翠綠典雅
      science: createMat('#557d99', 0.45),         // 科學館：沉著海軍科技藍

      wallCream: createMat('#c2b090', 0.5),
      wallWhite: createMat('#e8eaed', 0.45),
      wallBrick: createMat('#963321', 0.55),       // 濃郁紅磚
      roofRed: createMat('#852014', 0.4),          // 深絳紅琉璃屋瓦
      roofGreen: createMat('#194d30', 0.4),        // 濃郁墨綠圓拱頂
      roofDark: createMat('#22282d', 0.5),         // 俐落深黑灰女兒牆

      // 窗櫺：高反射深墨藍（像真正的反射鍍膜玻璃）
      window: new THREE.MeshStandardMaterial({
        color: '#0d2836',
        roughness: 0.05,
        metalness: 0.8
      }),
      windowFrame: createMat('#ffffff', 0.4),
      metal: createMat('#262d33', 0.3, 0.8),
      trunk: createMat('#382213', 0.85, 0),

      // 濃郁生機的立體樹林
      treeFoliage: createMat('#104222', 0.65, 0),
      treeLight: createMat('#1d5c31', 0.65, 0),
      treeAccent: createMat('#2c7840', 0.65, 0)
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
      this.scene.background.set('#060b12');
      this.hemiLight.intensity = 0.15;
      this.sunLight.intensity = 0.08;
      this.sunLight.color.set('#5f7591');
      this.materials.window.emissive.set('#ffb833');
      this.materials.window.emissiveIntensity = 1.0;
    } else {
      this.scene.background.set('#98c4d8');
      this.hemiLight.intensity = 0.4;
      this.sunLight.intensity = 1.8;
      this.sunLight.color.set('#fff0cf');
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
