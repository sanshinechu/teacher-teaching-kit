// 羅東國小 3D 校園建造器：高精細校舍立面、窗格與豐富綠意
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { BUILDINGS } from '../data/buildings.js';

export class CampusBuilder {
  constructor(scene, materials) {
    this.scene = scene;
    this.materials = materials;
    this.interactiveObjects = [];
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

  buildGround() {
    // 基地主草皮
    const groundGeo = new THREE.PlaneGeometry(320, 280);
    const ground = new THREE.Mesh(groundGeo, this.materials.grass);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 迎曦百齡中庭步道地磚
    const courtGeo = new THREE.PlaneGeometry(30, 46);
    const courtMesh = new THREE.Mesh(courtGeo, this.materials.pave);
    courtMesh.rotation.x = -Math.PI / 2;
    courtMesh.position.set(-14, 0.05, 16);
    courtMesh.receiveShadow = true;
    this.scene.add(courtMesh);

    // 涵育樓前庭小廣場
    const plazaGeo = new THREE.PlaneGeometry(40, 20);
    const plazaMesh = new THREE.Mesh(plazaGeo, this.materials.pave);
    plazaMesh.rotation.x = -Math.PI / 2;
    plazaMesh.position.set(-55, 0.05, -20);
    plazaMesh.receiveShadow = true;
    this.scene.add(plazaMesh);
  }

  buildTrackAndField() {
    const trackGroup = new THREE.Group();
    trackGroup.position.set(18, 0.08, -68);

    // 紅色 PU 跑道
    const trackShape = new THREE.Shape();
    const w = 40;
    const r = 25;
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

    // 足球場內草皮
    const innerShape = new THREE.Shape();
    const iw = 38;
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

    // 跑道分道線（5 道白色分道標線）
    for (let i = 0; i <= 4; i++) {
      const cr = ir + (r - ir) * (i / 4);
      const linePoints = [];
      for (let a = -Math.PI / 2; a <= Math.PI / 2; a += Math.PI / 32) {
        linePoints.push(new THREE.Vector3(iw + Math.cos(a) * cr, 0.03, Math.sin(a) * cr));
      }
      for (let a = Math.PI / 2; a <= (3 * Math.PI) / 2; a += Math.PI / 32) {
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
    const roofGeo = new THREE.BoxGeometry(18, 0.6, 10);
    const roof = new THREE.Mesh(roofGeo, this.materials.roofRed);
    roof.position.set(0, 4.4, 23);
    roof.castShadow = true;
    trackGroup.add(roof);

    // 司令台立柱
    for (let px of [-7.5, 7.5]) {
      for (let pz of [19.5, 26.5]) {
        const pillarGeo = new THREE.CylinderGeometry(0.25, 0.25, 2.8);
        const pillar = new THREE.Mesh(pillarGeo, this.materials.metal);
        pillar.position.set(px, 2.9, pz);
        trackGroup.add(pillar);
      }
    }

    this.scene.add(trackGroup);
  }

  buildBuildings() {
    BUILDINGS.forEach(b => {
      if (b.category === "gate" || b.id === "track_field" || b.id === "courtyard") return;

      const group = new THREE.Group();
      group.position.set(b.x, 0, b.z);

      // 主建築實體
      const bodyGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const bodyMat = this.materials[b.id] || this.materials.wallCream;
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = b.h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      body.userData = { ...b };
      group.add(body);
      this.interactiveObjects.push(body);

      // 屋頂女兒牆與壓頂邊線（形成立體輪廓線條）
      const edgeGeo = new THREE.BoxGeometry(b.w + 0.9, 0.65, b.d + 0.9);
      const edge = new THREE.Mesh(edgeGeo, this.materials.roofDark);
      edge.position.y = b.h + 0.32;
      edge.castShadow = true;
      group.add(edge);

      // 特色屋頂造型
      if (b.id === "xiaoyou") {
        // 校友館四坡典雅瓦頂
        const roofGeo = new THREE.ConeGeometry(b.w * 0.65, 4.2, 4);
        const roof = new THREE.Mesh(roofGeo, this.materials.roofRed);
        roof.position.y = b.h + 2.1;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);
      } else if (b.id === "gymnasium") {
        // 樹人館圓弧挑高大跨距拱頂
        const arcGeo = new THREE.CylinderGeometry(b.d * 0.53, b.d * 0.53, b.w, 32, 1, false, 0, Math.PI);
        const arcRoof = new THREE.Mesh(arcGeo, this.materials.roofGreen);
        arcRoof.rotation.z = Math.PI / 2;
        arcRoof.rotation.x = Math.PI / 2;
        arcRoof.position.y = b.h;
        arcRoof.castShadow = true;
        group.add(arcRoof);
      } else {
        // 頂樓階梯間水塔凸出物
        const hutGeo = new THREE.BoxGeometry(Math.min(7, b.w * 0.28), 2.8, Math.min(6, b.d * 0.28));
        const hut = new THREE.Mesh(hutGeo, this.materials.wallWhite);
        hut.position.set(-b.w * 0.24, b.h + 1.7, -b.d * 0.2);
        hut.castShadow = true;
        group.add(hut);
      }

      // 立體窗格：依樓層精確產生連續窗帶與窗框，大幅增強立體細節
      const floors = b.floors || 3;
      const floorH = b.h / floors;
      for (let f = 1; f <= floors; f++) {
        const wy = (f - 0.5) * floorH;

        // 正面窗帶與白窗框
        const winGeo = new THREE.BoxGeometry(b.w * 0.86, floorH * 0.42, 0.25);
        const winFront = new THREE.Mesh(winGeo, this.materials.window);
        winFront.position.set(0, wy, b.d / 2 + 0.1);
        group.add(winFront);

        // 背面窗帶
        const winBack = new THREE.Mesh(winGeo, this.materials.window);
        winBack.position.set(0, wy, -b.d / 2 - 0.1);
        group.add(winBack);

        // 側面窗格（如果校舍側面寬度夠大）
        if (b.d >= 20) {
          const sideGeo = new THREE.BoxGeometry(0.25, floorH * 0.42, b.d * 0.7);
          const winSideL = new THREE.Mesh(sideGeo, this.materials.window);
          winSideL.position.set(-b.w / 2 - 0.1, wy, 0);
          group.add(winSideL);

          const winSideR = new THREE.Mesh(sideGeo, this.materials.window);
          winSideR.position.set(b.w / 2 + 0.1, wy, 0);
          group.add(winSideR);
        }
      }

      this.scene.add(group);
    });

    this.buildCoveredWalkways();
  }

  buildCoveredWalkways() {
    const corridorMat = this.materials.roofRed;
    const pillarMat = this.materials.metal;

    const corridors = [
      { x1: -55, z1: -28, x2: -55, z2: -15, w: 3.2 },
      { x1: -55, z1: -15, x2: -10, z2: -15, w: 3.2 },
      { x1: -10, z1: -8, x2: -10, z2: 6, w: 3.2 }
    ];

    corridors.forEach(c => {
      const len = Math.hypot(c.x2 - c.x1, c.z2 - c.z1);
      const angle = Math.atan2(c.x2 - c.x1, c.z2 - c.z1);
      const mx = (c.x1 + c.x2) / 2;
      const mz = (c.z1 + c.z2) / 2;

      const roofGeo = new THREE.BoxGeometry(c.w, 0.35, len);
      const roof = new THREE.Mesh(roofGeo, corridorMat);
      roof.position.set(mx, 3.8, mz);
      roof.rotation.y = angle;
      roof.castShadow = true;
      this.scene.add(roof);

      const count = Math.max(2, Math.floor(len / 4.5));
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const px = c.x1 + (c.x2 - c.x1) * t;
        const pz = c.z1 + (c.z2 - c.z1) * t;
        for (let side of [-c.w / 2 + 0.25, c.w / 2 - 0.25]) {
          const pGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.8);
          const p = new THREE.Mesh(pGeo, pillarMat);
          const sx = px + Math.cos(angle) * side;
          const sz = pz - Math.sin(angle) * side;
          p.position.set(sx, 1.9, sz);
          p.castShadow = true;
          this.scene.add(p);
        }
      }
    });
  }

  buildRoads() {
    const roadMat = this.materials.road;
    const roads = [
      { x: -98, z: 0, w: 16, d: 260 },   // 民族路與清潭路西段
      { x: 0, z: -110, w: 270, d: 16 },  // 清潭路北段
      { x: 108, z: 0, w: 16, d: 260 },   // 開羅街與南昌街東段
      { x: 0, z: 102, w: 270, d: 16 }    // 南昌街南段
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

  buildFencesAndGates() {
    const gates = BUILDINGS.filter(b => b.category === "gate");
    gates.forEach(g => {
      const gateGroup = new THREE.Group();
      gateGroup.position.set(g.x, 0, g.z);

      // 兩側磚紅立柱
      for (let s of [-g.w / 2, g.w / 2]) {
        const pillarGeo = new THREE.BoxGeometry(1.8, g.h, 1.8);
        const pillar = new THREE.Mesh(pillarGeo, this.materials.wallBrick);
        pillar.position.set(s, g.h / 2, 0);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        gateGroup.add(pillar);

        // 柱頂石燈裝飾
        const topCap = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.3, 2.1), this.materials.wallCream);
        topCap.position.set(s, g.h + 0.15, 0);
        topCap.castShadow = true;
        gateGroup.add(topCap);
      }

      // 頂部大氣橫樑
      const beamGeo = new THREE.BoxGeometry(g.w + 1.4, 1.1, 1.6);
      const beam = new THREE.Mesh(beamGeo, this.materials.wallCream);
      beam.position.set(0, g.h + 0.6, 0);
      beam.castShadow = true;
      gateGroup.add(beam);

      // 可點選判定物件
      const hitGeo = new THREE.BoxGeometry(g.w, g.h + 1, 3);
      const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
      hitMesh.position.y = g.h / 2;
      hitMesh.userData = { ...g };
      gateGroup.add(hitMesh);
      this.interactiveObjects.push(hitMesh);

      this.scene.add(gateGroup);
    });
  }

  buildTrees() {
    const treePositions = [];

    // 操場跑道外環林蔭（密集茂盛）
    for (let x = -22; x <= 68; x += 9) {
      treePositions.push({ x, z: -98, scale: 1.15 + (x % 3) * 0.1 });
    }
    for (let z = -94; z <= -42; z += 9) {
      treePositions.push({ x: 72, z, scale: 1.2 + (z % 2) * 0.1 });
    }

    // 民族路大門兩側行道樹
    for (let z = -70; z <= -18; z += 8) {
      treePositions.push({ x: -76, z, scale: 1.1 });
    }

    // 迎風中庭景觀大樹群
    treePositions.push({ x: -14, z: 6, scale: 1.4 });
    treePositions.push({ x: -20, z: 18, scale: 1.3 });
    treePositions.push({ x: -12, z: 28, scale: 1.35 });
    treePositions.push({ x: -18, z: 36, scale: 1.2 });

    // 百齡樓與南昌街綠帶
    for (let z = 20; z <= 75; z += 12) {
      treePositions.push({ x: 30, z, scale: 1.15 });
    }

    treePositions.forEach((pos, idx) => {
      const tree = new THREE.Group();
      tree.position.set(pos.x, 0, pos.z);

      // 樹幹
      const trunkGeo = new THREE.CylinderGeometry(0.4 * pos.scale, 0.55 * pos.scale, 3.2 * pos.scale, 8);
      const trunk = new THREE.Mesh(trunkGeo, this.materials.trunk);
      trunk.position.y = 1.6 * pos.scale;
      trunk.castShadow = true;
      tree.add(trunk);

      // 雙色多層立體樹冠
      const mat = (idx % 2 === 0) ? this.materials.treeFoliage : this.materials.treeLight;
      const foliageGeo1 = new THREE.DodecahedronGeometry(2.4 * pos.scale, 1);
      const foliage1 = new THREE.Mesh(foliageGeo1, mat);
      foliage1.position.y = 4.2 * pos.scale;
      foliage1.castShadow = true;
      tree.add(foliage1);

      const foliageGeo2 = new THREE.DodecahedronGeometry(1.7 * pos.scale, 1);
      const foliage2 = new THREE.Mesh(foliageGeo2, this.materials.treeAccent);
      foliage2.position.set(0.35 * pos.scale, 5.1 * pos.scale, 0.2 * pos.scale);
      foliage2.castShadow = true;
      tree.add(foliage2);

      this.scene.add(tree);
    });
  }
}
