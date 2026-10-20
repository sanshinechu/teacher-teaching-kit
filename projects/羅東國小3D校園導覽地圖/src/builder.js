// 羅東國小 3D 校園建造器：使用純 Three.js 幾何積木參數化生成校舍、操場、跑道、球場與植栽
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { BUILDINGS } from '../data/buildings.js';

export class CampusBuilder {
  constructor(scene, materials) {
    this.scene = scene;
    this.materials = materials;
    this.interactiveObjects = []; // 供點選的建築物 Meshes
  }

  buildAll() {
    this.buildGround();
    this.buildTrackAndField();
    this.buildBuildings();
    this.buildRoads();
    this.buildFencesAndGates();
    this.buildTrees();
    return this.interactiveObjects;
  }

  // 1. 地面基座與綠意地毯
  buildGround() {
    const groundGeo = new THREE.PlaneGeometry(300, 260);
    const ground = new THREE.Mesh(groundGeo, this.materials.grass);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 迎曦百齡中庭地磚
    const courtGeo = new THREE.PlaneGeometry(28, 42);
    const courtMesh = new THREE.Mesh(courtGeo, this.materials.pave);
    courtMesh.rotation.x = -Math.PI / 2;
    courtMesh.position.set(-14, 0.05, 16);
    courtMesh.receiveShadow = true;
    this.scene.add(courtMesh);
  }

  // 2. 200M PU 操場跑道與足球場草皮
  buildTrackAndField() {
    const trackGroup = new THREE.Group();
    trackGroup.position.set(18, 0.08, -68);

    // 紅色 PU 跑道底板（圓角跑道形狀）
    const trackShape = new THREE.Shape();
    const w = 38;
    const r = 24;
    trackShape.moveTo(-w, -r);
    trackShape.lineTo(w, -r);
    trackShape.absarc(w, 0, r, -Math.PI / 2, Math.PI / 2, false);
    trackShape.lineTo(-w, r);
    trackShape.absarc(-w, 0, r, Math.PI / 2, 3 * Math.PI / 2, false);

    const trackGeo = new THREE.ShapeGeometry(trackShape);
    const trackMesh = new THREE.Mesh(trackGeo, this.materials.track);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.receiveShadow = true;
    trackMesh.userData = { id: "track_field", name: "200M PU 操場跑道" };
    trackGroup.add(trackMesh);
    this.interactiveObjects.push(trackMesh);

    // 內圈綠色茵茵草地
    const innerShape = new THREE.Shape();
    const iw = 36;
    const ir = 18;
    innerShape.moveTo(-iw, -ir);
    innerShape.lineTo(iw, -ir);
    innerShape.absarc(iw, 0, ir, -Math.PI / 2, Math.PI / 2, false);
    innerShape.lineTo(-iw, ir);
    innerShape.absarc(-iw, 0, ir, Math.PI / 2, 3 * Math.PI / 2, false);

    const innerGeo = new THREE.ShapeGeometry(innerShape);
    const innerMesh = new THREE.Mesh(innerGeo, this.materials.field);
    innerMesh.rotation.x = -Math.PI / 2;
    innerMesh.position.y = 0.02;
    innerMesh.receiveShadow = true;
    trackGroup.add(innerMesh);

    // 白線跑道標示（5道跑道線條示意）
    for (let i = 0; i < 4; i++) {
      const cr = ir + (r - ir) * (i / 3);
      const linePoints = [];
      for (let a = -Math.PI / 2; a <= Math.PI / 2; a += Math.PI / 24) {
        linePoints.push(new THREE.Vector3(iw + Math.cos(a) * cr, 0.03, Math.sin(a) * cr));
      }
      for (let a = Math.PI / 2; a <= (3 * Math.PI) / 2; a += Math.PI / 24) {
        linePoints.push(new THREE.Vector3(-iw + Math.cos(a) * cr, 0.03, Math.sin(a) * cr));
      }
      linePoints.push(linePoints[0]);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const line = new THREE.Line(lineGeo, this.materials.lineWhite);
      trackGroup.add(line);
    }

    // 升旗司令台
    const stageGeo = new THREE.BoxGeometry(16, 2.2, 8);
    const stage = new THREE.Mesh(stageGeo, this.materials.wallCream);
    stage.position.set(0, 1.1, 23);
    stage.castShadow = true;
    stage.receiveShadow = true;
    trackGroup.add(stage);

    // 司令台頂蓬
    const roofGeo = new THREE.BoxGeometry(18, 0.5, 10);
    const roof = new THREE.Mesh(roofGeo, this.materials.roofRed);
    roof.position.set(0, 4.2, 23);
    roof.castShadow = true;
    trackGroup.add(roof);

    // 司令台柱子
    for (let px of [-7.5, 7.5]) {
      for (let pz of [19.5, 26.5]) {
        const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.5);
        const pillar = new THREE.Mesh(pillarGeo, this.materials.metal);
        pillar.position.set(px, 2.8, pz);
        trackGroup.add(pillar);
      }
    }

    this.scene.add(trackGroup);
  }

  // 3. 參數化繪製各主要校舍（百齡樓、涵育樓、校友館、迎曦樓、體育館、科學館）
  buildBuildings() {
    BUILDINGS.forEach(b => {
      if (b.category === "gate" || b.id === "track_field" || b.id === "courtyard") return;

      const group = new THREE.Group();
      group.position.set(b.x, 0, b.z);

      // 主建物盒體
      const bodyGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const bodyMat = this.materials[b.id] || this.materials.wallCream;
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = b.h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      body.userData = { ...b };
      group.add(body);
      this.interactiveObjects.push(body);

      // 屋頂樣式（平頂、斜瓦頂或圓頂）
      if (b.id === "xiaoyou") {
        // 校友館特色斜屋頂
        const roofGeo = new THREE.ConeGeometry(b.w * 0.6, 3.5, 4);
        const roof = new THREE.Mesh(roofGeo, this.materials.roofRed);
        roof.position.y = b.h + 1.75;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);
      } else if (b.id === "gymnasium") {
        // 樹人館圓弧拱頂
        const arcGeo = new THREE.CylinderGeometry(b.d * 0.52, b.d * 0.52, b.w, 32, 1, false, 0, Math.PI);
        const arcRoof = new THREE.Mesh(arcGeo, this.materials.roofGreen);
        arcRoof.rotation.z = Math.PI / 2;
        arcRoof.rotation.x = Math.PI / 2;
        arcRoof.position.y = b.h;
        arcRoof.castShadow = true;
        group.add(arcRoof);
      } else {
        // 現代平頂女兒牆與防水層
        const roofEdgeGeo = new THREE.BoxGeometry(b.w + 0.8, 0.6, b.d + 0.8);
        const roofEdge = new THREE.Mesh(roofEdgeGeo, this.materials.wallCream);
        roofEdge.position.y = b.h + 0.3;
        roofEdge.castShadow = true;
        group.add(roofEdge);

        // 頂樓水塔／階梯間
        const topHutGeo = new THREE.BoxGeometry(Math.min(6, b.w * 0.25), 2.4, Math.min(6, b.d * 0.25));
        const topHut = new THREE.Mesh(topHutGeo, this.materials.wallWhite);
        topHut.position.set(-b.w * 0.25, b.h + 1.5, -b.d * 0.2);
        topHut.castShadow = true;
        group.add(topHut);
      }

      // 玻璃窗格飾條（以細長條模擬多層窗櫺）
      const floorH = b.h / (b.floors || 3);
      for (let f = 1; f <= (b.floors || 3); f++) {
        const wy = (f - 0.5) * floorH;
        // 正面窗格
        const frontWinGeo = new THREE.BoxGeometry(b.w * 0.88, floorH * 0.45, 0.2);
        const frontWin = new THREE.Mesh(frontWinGeo, this.materials.window);
        frontWin.position.set(0, wy, b.d / 2 + 0.05);
        group.add(frontWin);

        // 背面窗格
        const backWinGeo = new THREE.BoxGeometry(b.w * 0.88, floorH * 0.45, 0.2);
        const backWin = new THREE.Mesh(backWinGeo, this.materials.window);
        backWin.position.set(0, wy, -b.d / 2 - 0.05);
        group.add(backWin);
      }

      this.scene.add(group);
    });

    // 連接涵育樓、迎曦樓、校友館的風雨走廊（遮雨廊道）
    this.buildCoveredWalkways();
  }

  // 4. 校園風雨遮雨走廊
  buildCoveredWalkways() {
    const corridorMat = this.materials.roofRed;
    const pillarMat = this.materials.metal;

    const corridors = [
      { x1: -55, z1: -28, x2: -55, z2: -15, w: 3 },
      { x1: -55, z1: -15, x2: -10, z2: -15, w: 3 },
      { x1: -10, z1: -8, x2: -10, z2: 6, w: 3 }
    ];

    corridors.forEach(c => {
      const len = Math.hypot(c.x2 - c.x1, c.z2 - c.z1);
      const angle = Math.atan2(c.x2 - c.x1, c.z2 - c.z1);
      const mx = (c.x1 + c.x2) / 2;
      const mz = (c.z1 + c.z2) / 2;

      const roofGeo = new THREE.BoxGeometry(c.w, 0.3, len);
      const roof = new THREE.Mesh(roofGeo, corridorMat);
      roof.position.set(mx, 3.8, mz);
      roof.rotation.y = angle;
      roof.castShadow = true;
      this.scene.add(roof);

      // 支柱
      const count = Math.max(2, Math.floor(len / 4));
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const px = c.x1 + (c.x2 - c.x1) * t;
        const pz = c.z1 + (c.z2 - c.z1) * t;
        for (let side of [-c.w / 2 + 0.2, c.w / 2 - 0.2]) {
          const pGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.8);
          const p = new THREE.Mesh(pGeo, pillarMat);
          const sx = px + Math.cos(angle) * side;
          const sz = pz - Math.sin(angle) * side;
          p.position.set(sx, 1.9, sz);
          this.scene.add(p);
        }
      }
    });
  }

  // 5. 周圍道路：清潭路、民族路、南昌街、開羅街
  buildRoads() {
    const roadMat = this.materials.road;
    const roads = [
      { x: -95, z: 0, w: 14, d: 240 },   // 民族路與清潭路西段
      { x: 0, z: -108, w: 260, d: 14 },  // 清潭路北段
      { x: 105, z: 0, w: 14, d: 240 },   // 開羅街與南昌街東段
      { x: 0, z: 98, w: 260, d: 14 }     // 南昌街南段
    ];

    roads.forEach(r => {
      const roadGeo = new THREE.PlaneGeometry(r.w, r.d);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(r.x, 0.02, r.z);
      road.receiveShadow = true;
      this.scene.add(road);
    });
  }

  // 6. 特色動物校門與圍牆立柱
  buildFencesAndGates() {
    const gates = BUILDINGS.filter(b => b.category === "gate");
    gates.forEach(g => {
      const gateGroup = new THREE.Group();
      gateGroup.position.set(g.x, 0, g.z);

      // 兩側柱子
      for (let s of [-g.w / 2, g.w / 2]) {
        const pillarGeo = new THREE.BoxGeometry(1.6, g.h, 1.6);
        const pillar = new THREE.Mesh(pillarGeo, this.materials.wallBrick);
        pillar.position.set(s, g.h / 2, 0);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        gateGroup.add(pillar);
      }

      // 頂部拱門橫樑
      const beamGeo = new THREE.BoxGeometry(g.w + 1.2, 1, 1.4);
      const beam = new THREE.Mesh(beamGeo, this.materials.wallCream);
      beam.position.set(0, g.h + 0.5, 0);
      beam.castShadow = true;
      gateGroup.add(beam);

      // 校門可點選地標物件
      const hitGeo = new THREE.BoxGeometry(g.w, g.h, 2);
      const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
      hitMesh.position.y = g.h / 2;
      hitMesh.userData = { ...g };
      gateGroup.add(hitMesh);
      this.interactiveObjects.push(hitMesh);

      this.scene.add(gateGroup);
    });
  }

  // 7. 校園綠意樹木群（操場周邊、校門與迎曦花園林蔭）
  buildTrees() {
    const treePositions = [];

    // 操場跑道外環林蔭
    for (let x = -20; x <= 65; x += 12) {
      treePositions.push({ x, z: -98, scale: 1.1 });
    }
    for (let z = -90; z <= -45; z += 12) {
      treePositions.push({ x: 68, z, scale: 1.2 });
    }

    // 民族路校門兩側樟樹
    for (let z = -65; z <= -20; z += 10) {
      treePositions.push({ x: -75, z, scale: 1.0 });
    }

    // 迎風中庭景觀樹
    treePositions.push({ x: -14, z: 8, scale: 1.3 });
    treePositions.push({ x: -18, z: 24, scale: 1.2 });
    treePositions.push({ x: -10, z: 32, scale: 1.1 });

    treePositions.forEach(pos => {
      const tree = new THREE.Group();
      tree.position.set(pos.x, 0, pos.z);

      // 樹幹
      const trunkGeo = new THREE.CylinderGeometry(0.35 * pos.scale, 0.5 * pos.scale, 2.8 * pos.scale, 8);
      const trunk = new THREE.Mesh(trunkGeo, this.materials.trunk);
      trunk.position.y = 1.4 * pos.scale;
      trunk.castShadow = true;
      tree.add(trunk);

      // 樹冠（兩層圓球）
      const foliageGeo1 = new THREE.DodecahedronGeometry(2.2 * pos.scale, 1);
      const foliage1 = new THREE.Mesh(foliageGeo1, this.materials.treeFoliage);
      foliage1.position.y = 3.8 * pos.scale;
      foliage1.castShadow = true;
      tree.add(foliage1);

      const foliageGeo2 = new THREE.DodecahedronGeometry(1.6 * pos.scale, 1);
      const foliage2 = new THREE.Mesh(foliageGeo2, this.materials.treeLight);
      foliage2.position.set(0.3, 4.6 * pos.scale, 0.2);
      foliage2.castShadow = true;
      tree.add(foliage2);

      this.scene.add(tree);
    });
  }
}
