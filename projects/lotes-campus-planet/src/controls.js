// 羅東國小 3D 視角控制：支援 3D 鳥瞰、2D 俯視與第三人稱主角跟隨漫遊行走
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { MascotPlayer } from './mascot.js';

export class ViewController {
  constructor(campusScene, buildings) {
    this.campus = campusScene;
    this.camera = campusScene.camera;
    this.controls = campusScene.controls;
    this.buildings = buildings;

    this.mode = 'orbit'; // 'orbit', 'top', 'walk'
    this.walkSpeed = 18; // 米/秒
    this.keysPressed = {};

    // 實體主角公仔：羅小東 / 蘿絲
    this.mascot = new MascotPlayer(this.campus.scene, 'luodong');
    // 出生點：清潭路新大門門口前迎賓處 (x: 8, z: -63)
    this.playerPos = new THREE.Vector3(8, 0, -63);
    // 開場攝影機方位角 (Math.PI 代表相機在主角身後北側 -Z 處，面朝南望入校園)
    this.playerAngle = Math.PI; 
    // 主角身體朝向角（面向校園南面 +Z 方向進入校區）
    this.mascotHeading = 0; 
    this.mascot.setPosition(this.playerPos.x, this.playerPos.y, this.playerPos.z);
    this.mascot.setRotationY(this.mascotHeading);
    this.mascot.group.visible = true; // 鳥瞰視角也常駐顯示，清楚看見主角站在大門口迎賓！

    // 第三人稱攝影機參數
    this.camDistance = 14;
    this.camHeight = 7.5;
    this.camLookHeight = 2.0;

    this.setupKeyboardListeners();
    this.setupPointerListeners();
  }

  setMode(mode) {
    this.mode = mode;
    this.mascot.group.visible = true; // 各視角皆保留主角

    if (mode === 'orbit') {
      this.controls.enabled = true;
      this.controls.maxPolarAngle = Math.PI * 0.48;
    } else if (mode === 'top') {
      this.controls.enabled = true;
      this.campus.setTopView();
    } else if (mode === 'walk') {
      this.controls.enabled = false;

      // 切換為地面漫遊時，相機平滑拉近到主角身後跟隨
      this.updateCameraFollow(true);
    }
  }

  // 切換主角造型 (羅小東 <-> 蘿絲)
  toggleMascot() {
    const next = (this.mascot.type === 'luodong') ? 'rose' : 'luodong';
    this.mascot.switchCharacter(next);
    return next;
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.code] = true;
      // 同步相容 e.key (大小寫或注音輸入法按鍵)
      if (e.key) {
        const k = e.key.toLowerCase();
        if (k === 'w') this.keysPressed['KeyW'] = true;
        if (k === 's') this.keysPressed['KeyS'] = true;
        if (k === 'a') this.keysPressed['KeyA'] = true;
        if (k === 'd') this.keysPressed['KeyD'] = true;
      }
      if (e.code === 'Escape' && this.mode === 'walk') {
        this.setMode('orbit');
        this.campus.resetView();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.code] = false;
      if (e.key) {
        const k = e.key.toLowerCase();
        if (k === 'w') this.keysPressed['KeyW'] = false;
        if (k === 's') this.keysPressed['KeyS'] = false;
        if (k === 'a') this.keysPressed['KeyA'] = false;
        if (k === 'd') this.keysPressed['KeyD'] = false;
      }
    });
  }

  setupPointerListeners() {
    const dom = this.campus.renderer.domElement;
    let isDown = false;
    let lastX = 0;

    dom.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'walk') return;
      isDown = true;
      lastX = e.clientX;
    });

    window.addEventListener('pointermove', (e) => {
      if (this.mode !== 'walk' || !isDown) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      this.playerAngle -= dx * 0.006;
    });

    window.addEventListener('pointerup', () => {
      isDown = false;
    });
  }

  update(deltaTime) {
    if (this.mode !== 'walk') return;

    // 計算移動
    let moveFwd = 0;
    let moveSide = 0;

    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) moveFwd += 1;
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) moveFwd -= 1;
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) moveSide -= 1;
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) moveSide += 1;

    const isMoving = (moveFwd !== 0 || moveSide !== 0);

    if (isMoving) {
      // 依據玩家旋轉角計算方向
      const fwd = new THREE.Vector3(-Math.sin(this.playerAngle), 0, -Math.cos(this.playerAngle));
      const right = new THREE.Vector3(Math.cos(this.playerAngle), 0, -Math.sin(this.playerAngle));

      const moveDir = new THREE.Vector3()
        .addScaledVector(fwd, moveFwd)
        .addScaledVector(right, moveSide)
        .normalize();

      const step = moveDir.multiplyScalar(this.walkSpeed * deltaTime);
      const nextPos = this.playerPos.clone().add(step);

      // 校舍碰撞偵測
      if (!this.checkBuildingCollision(nextPos)) {
        this.playerPos.copy(nextPos);
        this.mascot.setPosition(this.playerPos.x, this.playerPos.y, this.playerPos.z);
      }

      // 主角身體轉向：讓正面面向實際移動方向
      // 模型局部 +Z 為臉部正面，世界座標中面向 moveDir 時需要的 Y 旋轉角為 Math.atan2(moveDir.x, moveDir.z)
      const targetHeading = Math.atan2(moveDir.x, moveDir.z);
      // 平滑轉向插值 (避免瞬間瞬轉)
      let diff = targetHeading - this.mascotHeading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.mascotHeading += diff * Math.min(1.0, deltaTime * 16.0);
      this.mascot.setRotationY(this.mascotHeading);
    }

    // 更新主角行走擺手踢腿動畫
    this.mascot.update(deltaTime, isMoving);

    // 第三人稱鏡頭平滑跟隨
    this.updateCameraFollow(false);
  }

  updateCameraFollow(instant = false) {
    // 鏡頭在主角後上方
    const offset = new THREE.Vector3(
      Math.sin(this.playerAngle) * this.camDistance,
      this.camHeight,
      Math.cos(this.playerAngle) * this.camDistance
    );
    const targetCamPos = this.playerPos.clone().add(offset);
    const lookAtTarget = this.playerPos.clone().add(new THREE.Vector3(0, this.camLookHeight, 0));

    if (instant) {
      this.camera.position.copy(targetCamPos);
      this.camera.lookAt(lookAtTarget);
    } else {
      this.camera.position.lerp(targetCamPos, 0.1);
      this.camera.lookAt(lookAtTarget);
    }
  }

  checkBuildingCollision(pos) {
    const margin = 2.0;
    for (const b of this.buildings) {
      // 排除大門、操場、中庭花園、停車場等開闊地面，主角可以在上面自由走動！
      if (b.category === 'gate' || b.category === 'service' || b.category === 'landscape' ||
          b.id === 'track_field' || b.id === 'courtyard' || b.id.startsWith('parking')) continue;
      const minX = b.x - b.w / 2 - margin;
      const maxX = b.x + b.w / 2 + margin;
      const minZ = b.z - b.d / 2 - margin;
      const maxZ = b.z + b.d / 2 + margin;

      if (pos.x >= minX && pos.x <= maxX && pos.z >= minZ && pos.z <= maxZ) {
        return true;
      }
    }
    return false;
  }

  // 平滑飛向目標建築物
  flyTo(x, z, distance = 45) {
    if (this.mode === 'walk') {
      this.setMode('orbit');
    }
    const target = new THREE.Vector3(x, 0, z);
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = new THREE.Vector3(x - distance * 0.7, distance * 0.75, z + distance * 0.7);

    const duration = 1100;
    const startTime = performance.now();

    const animateFlight = (currentTime) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, target, ease);

      if (t < 1) {
        requestAnimationFrame(animateFlight);
      }
    };

    requestAnimationFrame(animateFlight);
  }
}
