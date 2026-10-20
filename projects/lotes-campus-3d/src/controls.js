// 羅東國小 3D 視角控制：支援 3D 鳥瞰、2D 俯視與第一人稱漫遊行走（WASD／虛擬方向鍵）
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

export class ViewController {
  constructor(campusScene, buildings) {
    this.campus = campusScene;
    this.camera = campusScene.camera;
    this.controls = campusScene.controls;
    this.buildings = buildings;

    this.mode = 'orbit'; // 'orbit', 'top', 'walk'
    this.walkSpeed = 22; // 米/秒
    this.keysPressed = {};
    this.walkHeight = 2.4; // 學生/訪客身高視角

    // 第一人稱漫遊旋轉角
    this.yaw = 0;
    this.pitch = 0;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    this.setupKeyboardListeners();
    this.setupPointerListeners();
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'orbit') {
      this.controls.enabled = true;
      this.controls.maxPolarAngle = Math.PI * 0.48;
    } else if (mode === 'top') {
      this.controls.enabled = true;
      this.campus.setTopView();
    } else if (mode === 'walk') {
      this.controls.enabled = false;
      // 將相機置放於民族路新大門入口處開始漫遊
      this.camera.position.set(-68, this.walkHeight, -60);
      this.yaw = Math.PI * 0.25; // 面向校園中庭東北方
      this.pitch = 0;
      this.updateWalkRotation();
    }
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed[e.code] = true;
      if (e.code === 'Escape' && this.mode === 'walk') {
        this.setMode('orbit');
        this.campus.resetView();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.code] = false;
    });
  }

  setupPointerListeners() {
    const dom = this.campus.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'walk') return;
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
      if (this.mode !== 'walk' || !this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.yaw -= deltaX * 0.003;
      this.pitch -= deltaY * 0.003;
      this.pitch = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.35, this.pitch));

      this.updateWalkRotation();
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });
  }

  updateWalkRotation() {
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  update(deltaTime) {
    if (this.mode !== 'walk') return;

    // 行走方向計算
    const moveVector = new THREE.Vector3(0, 0, 0);
    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) moveVector.z -= 1;
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) moveVector.z += 1;
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) moveVector.x -= 1;
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) moveVector.x += 1;

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      const step = moveVector.multiplyScalar(this.walkSpeed * deltaTime);

      // 簡易校舍邊界碰撞檢測
      const nextPos = this.camera.position.clone().add(step);
      if (!this.checkBuildingCollision(nextPos)) {
        this.camera.position.x = nextPos.x;
        this.camera.position.z = nextPos.z;
      }
    }

    this.camera.position.y = this.walkHeight;
  }

  checkBuildingCollision(pos) {
    const margin = 2.0;
    for (const b of this.buildings) {
      if (b.category === 'gate' || b.id === 'track_field' || b.id === 'courtyard') continue;
      const minX = b.x - b.w / 2 - margin;
      const maxX = b.x + b.w / 2 + margin;
      const minZ = b.z - b.d / 2 - margin;
      const maxZ = b.z + b.d / 2 + margin;

      if (pos.x >= minX && pos.x <= maxX && pos.z >= minZ && pos.z <= maxZ) {
        return true; // 發生碰撞，阻擋前進
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

    const duration = 1100; // 毫秒
    const startTime = performance.now();

    const animateFlight = (currentTime) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(1, elapsed / duration);
      // Ease In Out
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
