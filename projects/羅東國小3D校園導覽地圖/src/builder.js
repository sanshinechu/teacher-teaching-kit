// 羅東國小 3D 校園建造器：高精細校舍立面、超醒目大型 3D 動物雕塑校門與浮動萌系地標標籤
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
    this.buildPerimeterFences();
    this.buildFencesAndGates(); // 超醒目大體積動物雕塑校門
    this.buildTrees();
    return this.interactiveObjects;
  }

  buildGround() {
    const outerGeo = new THREE.PlaneGeometry(360, 320);
    const outerGround = new THREE.Mesh(outerGeo, new THREE.MeshStandardMaterial({ color: '#2a4d2e', roughness: 0.9 }));
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.receiveShadow = true;
    this.scene.add(outerGround);

    const campusShape = new THREE.Shape();
    campusShape.moveTo(-88, -100);
    campusShape.lineTo(96, -100);
    campusShape.lineTo(96, 92);
    campusShape.lineTo(-88, 92);
    campusShape.closePath();

    const campusGeo = new THREE.ShapeGeometry(campusShape);
    const campusGround = new THREE.Mesh(campusGeo, this.materials.grass);
    campusGround.rotation.x = -Math.PI / 2;
    campusGround.position.y = 0.04;
    campusGround.receiveShadow = true;
    this.scene.add(campusGround);

    const courtGeo = new THREE.PlaneGeometry(30, 46);
    const courtMesh = new THREE.Mesh(courtGeo, this.materials.pave);
    courtMesh.rotation.x = -Math.PI / 2;
    courtMesh.position.set(-14, 0.08, 16);
    courtMesh.receiveShadow = true;
    this.scene.add(courtMesh);

    const plazaGeo = new THREE.PlaneGeometry(40, 20);
    const plazaMesh = new THREE.Mesh(plazaGeo, this.materials.pave);
    plazaMesh.rotation.x = -Math.PI / 2;
    plazaMesh.position.set(-55, 0.08, -20);
    plazaMesh.receiveShadow = true;
    this.scene.add(plazaMesh);
  }

  buildTrackAndField() {
    const trackGroup = new THREE.Group();
    trackGroup.position.set(18, 0.12, -68);

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

    const stageGeo = new THREE.BoxGeometry(16, 2.2, 8);
    const stage = new THREE.Mesh(stageGeo, this.materials.wallCream);
    stage.position.set(0, 1.1, 23);
    stage.castShadow = true;
    stage.receiveShadow = true;
    trackGroup.add(stage);

    const roofGeo = new THREE.BoxGeometry(18, 0.6, 10);
    const roof = new THREE.Mesh(roofGeo, this.materials.roofRed);
    roof.position.set(0, 4.4, 23);
    roof.castShadow = true;
    trackGroup.add(roof);

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

      const bodyGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const bodyMat = this.materials[b.id] || this.materials.wallCream;
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = b.h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      body.userData = { ...b };
      group.add(body);
      this.interactiveObjects.push(body);

      const edgeGeo = new THREE.BoxGeometry(b.w + 0.9, 0.65, b.d + 0.9);
      const edge = new THREE.Mesh(edgeGeo, this.materials.roofDark);
      edge.position.y = b.h + 0.32;
      edge.castShadow = true;
      group.add(edge);

      if (b.id === "xiaoyou") {
        const roofGeo = new THREE.ConeGeometry(b.w * 0.65, 4.2, 4);
        const roof = new THREE.Mesh(roofGeo, this.materials.roofRed);
        roof.position.y = b.h + 2.1;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);
      } else if (b.id === "gymnasium") {
        const arcGeo = new THREE.CylinderGeometry(b.d * 0.53, b.d * 0.53, b.w, 32, 1, false, 0, Math.PI);
        const arcRoof = new THREE.Mesh(arcGeo, this.materials.roofGreen);
        arcRoof.rotation.z = Math.PI / 2;
        arcRoof.rotation.x = Math.PI / 2;
        arcRoof.position.y = b.h;
        arcRoof.castShadow = true;
        group.add(arcRoof);
      } else {
        const hutGeo = new THREE.BoxGeometry(Math.min(7, b.w * 0.28), 2.8, Math.min(6, b.d * 0.28));
        const hut = new THREE.Mesh(hutGeo, this.materials.wallWhite);
        hut.position.set(-b.w * 0.24, b.h + 1.7, -b.d * 0.2);
        hut.castShadow = true;
        group.add(hut);
      }

      const floors = b.floors || 3;
      const floorH = b.h / floors;
      for (let f = 1; f <= floors; f++) {
        const wy = (f - 0.5) * floorH;

        const winGeo = new THREE.BoxGeometry(b.w * 0.86, floorH * 0.42, 0.25);
        const winFront = new THREE.Mesh(winGeo, this.materials.window);
        winFront.position.set(0, wy, b.d / 2 + 0.1);
        group.add(winFront);

        const winBack = new THREE.Mesh(winGeo, this.materials.window);
        winBack.position.set(0, wy, -b.d / 2 - 0.1);
        group.add(winBack);

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
      road.position.set(r.x, 0.03, r.z);
      road.receiveShadow = true;
      this.scene.add(road);
    });
  }

  // --- 校園立體圍籬 ---
  buildPerimeterFences() {
    const fenceRailMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.2,
      metalness: 0.7
    });
    const wallBaseMat = this.materials.wallBrick;

    const fenceSegments = [
      // 北界（清潭路）：西北角到新大門、新大門到白兔門、白兔門到無尾熊門
      { x1: -88, z1: -100, x2: -82, z2: -100 },
      { x1: -62, z1: -100, x2: -42, z2: -100 },
      { x1: -30, z1: -100, x2: -10, z2: -100 },
      { x1: 2, z1: -100, x2: 96, z2: -100 },

      // 西界（民族路）：西北角到民族路門、民族路門到孔雀門、孔雀門到開元市場門、開元市場門到西南角
      { x1: -88, z1: -100, x2: -88, z2: -78 },
      { x1: -88, z1: -62, x2: -88, z2: -58 },
      { x1: -88, z1: -46, x2: -88, z2: 42 },
      { x1: -88, z1: 54, x2: -88, z2: 92 },

      // 東界（開羅街/南昌街）：東北角到海豚門、海豚門到東南角
      { x1: 96, z1: -100, x2: 96, z2: -74 },
      { x1: 96, z1: -62, x2: 96, z2: 92 },

      // 南界（南昌街）：西南角到企鵝門、企鵝門到恐龍門、恐龍門到東南角
      { x1: -88, z1: 92, x2: -18, z2: 92 },
      { x1: -6, z1: 92, x2: 42, z2: 92 },
      { x1: 54, z1: 92, x2: 96, z2: 92 }
    ];

    fenceSegments.forEach(seg => {
      const len = Math.hypot(seg.x2 - seg.x1, seg.z2 - seg.z1);
      const angle = Math.atan2(seg.x2 - seg.x1, seg.z2 - seg.z1);
      const mx = (seg.x1 + seg.x2) / 2;
      const mz = (seg.z1 + seg.z2) / 2;

      // 磚牆基座
      const baseGeo = new THREE.BoxGeometry(0.8, 1.0, len);
      const base = new THREE.Mesh(baseGeo, wallBaseMat);
      base.position.set(mx, 0.5, mz);
      base.rotation.y = angle;
      base.castShadow = true;
      base.receiveShadow = true;
      this.scene.add(base);

      // 壓頂白石
      const capGeo = new THREE.BoxGeometry(0.95, 0.2, len);
      const cap = new THREE.Mesh(capGeo, this.materials.wallWhite);
      cap.position.set(mx, 1.05, mz);
      cap.rotation.y = angle;
      cap.castShadow = true;
      this.scene.add(cap);

      // 圍籬雙層欄杆
      const topRailGeo = new THREE.BoxGeometry(0.15, 0.15, len);
      const topRail = new THREE.Mesh(topRailGeo, fenceRailMat);
      topRail.position.set(mx, 2.5, mz);
      topRail.rotation.y = angle;
      topRail.castShadow = true;
      this.scene.add(topRail);

      const midRail = new THREE.Mesh(topRailGeo, fenceRailMat);
      midRail.position.set(mx, 1.8, mz);
      midRail.rotation.y = angle;
      midRail.castShadow = true;
      this.scene.add(midRail);

      // 格柵立柱
      const postCount = Math.max(2, Math.floor(len / 2.2));
      for (let i = 0; i <= postCount; i++) {
        const t = i / postCount;
        const px = seg.x1 + (seg.x2 - seg.x1) * t;
        const pz = seg.z1 + (seg.z2 - seg.z1) * t;

        const postGeo = new THREE.BoxGeometry(0.3, 1.6, 0.3);
        const post = new THREE.Mesh(postGeo, fenceRailMat);
        post.position.set(px, 1.8, pz);
        post.castShadow = true;
        this.scene.add(post);
      }
    });
  }

  // --- 校門建造：放大體積 2.5 倍，色彩鮮明極度搶眼 ---
  buildFencesAndGates() {
    const gates = BUILDINGS.filter(b => b.category === "gate");
    gates.forEach(g => {
      const gateGroup = new THREE.Group();
      gateGroup.position.set(g.x, 0, g.z);

      const isNorthSouthBorder = Math.abs(g.z - (-100)) < 2 || Math.abs(g.z - 92) < 2;
      if (!isNorthSouthBorder) {
        gateGroup.rotation.y = Math.PI / 2;
      }

      // 兩側磚柱（加大加寬，威嚴醒目）
      for (let s of [-g.w / 2, g.w / 2]) {
        const pillarGeo = new THREE.BoxGeometry(2.4, g.h + 0.5, 2.4);
        const pillar = new THREE.Mesh(pillarGeo, this.materials.wallBrick);
        pillar.position.set(s, (g.h + 0.5) / 2, 0);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        gateGroup.add(pillar);

        const topCap = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.5, 2.8), this.materials.wallCream);
        topCap.position.set(s, g.h + 0.6, 0);
        topCap.castShadow = true;
        gateGroup.add(topCap);
      }

      // 拱門大橫樑
      const beamGeo = new THREE.BoxGeometry(g.w + 1.8, 1.6, 2.4);
      const beam = new THREE.Mesh(beamGeo, this.materials.wallCream);
      beam.position.set(0, g.h + 1.0, 0);
      beam.castShadow = true;
      gateGroup.add(beam);

      // 門頭專屬超大 3D 動物雕塑 (尺寸全面放大 2.2 ~ 2.5 倍！)
      const animalSculpture = this.createAnimalSculpture(g.id);
      if (animalSculpture) {
        animalSculpture.position.set(0, g.h + 1.8, 0);
        gateGroup.add(animalSculpture);
      }

      // 地標判定盒（放大判定區）
      const hitGeo = new THREE.BoxGeometry(g.w + 2, g.h + 8, 5);
      const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
      hitMesh.position.y = g.h / 2 + 2;
      hitMesh.userData = { ...g };
      gateGroup.add(hitMesh);
      this.interactiveObjects.push(hitMesh);

      this.scene.add(gateGroup);
    });
  }

  // --- 超醒目、大體積 3D 動物雕塑產生器 ---
  createAnimalSculpture(gateId) {
    const group = new THREE.Group();
    // 使用高飽和度活潑色彩，讓動物在遠處鳥瞰時一眼就看見！
    const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.3 });
    const blueMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.2, metalness: 0.3 });
    const greenMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.3 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.25 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.25 });
    const grayMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.35 });
    const pinkMat = new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.25 });

    if (gateId === 'gate_rabbit') {
      // 🐰 白兔門：巨大萌萌立體大白兔（高約 6 米，圓圓胖胖、長長粉耳）
      const body = new THREE.Mesh(new THREE.SphereGeometry(2.0, 20, 20), whiteMat);
      body.position.y = 1.8;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(1.5, 20, 20), whiteMat);
      head.position.set(0, 3.8, 0);
      head.castShadow = true;
      group.add(head);

      // 巨大白兔長耳 + 粉紅耳心
      for (let ox of [-0.65, 0.65]) {
        const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.6, 16), whiteMat);
        ear.position.set(ox, 5.6, 0);
        ear.rotation.z = ox > 0 ? -0.18 : 0.18;
        ear.castShadow = true;
        group.add(ear);

        const innerEar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.0, 0.1), pinkMat);
        innerEar.position.set(ox, 5.5, 0.32);
        innerEar.rotation.z = ox > 0 ? -0.18 : 0.18;
        group.add(innerEar);
      }

      // 紅眼睛
      for (let ox of [-0.45, 0.45]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), pinkMat);
        eye.position.set(ox, 4.0, 1.4);
        group.add(eye);
      }

      // 手抱大胡蘿蔔
      const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.8, 12), orangeMat);
      carrot.rotation.z = 0.6;
      carrot.position.set(0.6, 2.2, 1.4);
      group.add(carrot);

      return group;
    }

    if (gateId === 'gate_peacock') {
      // 🦚 孔雀門：華麗翠綠開屏孔雀（扇形高達 7 米，宛如璀璨翡翠屏風）
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 3.2, 16), blueMat);
      body.position.y = 1.8;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 16), blueMat);
      head.position.set(0, 3.8, 0.5);
      head.castShadow = true;
      group.add(head);

      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 8), yellowMat);
      crown.position.set(0, 4.7, 0.5);
      group.add(crown);

      // 巨大開屏扇形羽毛（9 片層疊）
      for (let a = -Math.PI * 0.45; a <= Math.PI * 0.45; a += Math.PI * 0.11) {
        const feather = new THREE.Mesh(new THREE.ConeGeometry(0.55, 4.2, 8), greenMat);
        feather.position.set(Math.sin(a) * 2.2, 3.2 + Math.cos(a) * 1.8, -0.6);
        feather.rotation.z = -a;
        feather.castShadow = true;
        group.add(feather);

        // 羽翎金眼
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), yellowMat);
        eye.position.set(Math.sin(a) * 3.4, 3.8 + Math.cos(a) * 2.6, -0.4);
        group.add(eye);
      }
      return group;
    }

    if (gateId === 'gate_koala') {
      // 🐨 無尾熊門：巨大呆萌無尾熊（大耳朵、大黑鼻、超有存在感）
      const body = new THREE.Mesh(new THREE.SphereGeometry(2.0, 20, 20), grayMat);
      body.position.y = 1.8;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 20), grayMat);
      head.position.set(0, 3.8, 0);
      head.castShadow = true;
      group.add(head);

      // 超大招牌圓耳朵
      for (let ox of [-1.4, 1.4]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), grayMat);
        ear.position.set(ox, 4.6, 0);
        ear.castShadow = true;
        group.add(ear);

        const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), whiteMat);
        innerEar.position.set(ox * 0.9, 4.6, 0.35);
        group.add(innerEar);
      }

      // 巨大黑色橢圓鼻
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), darkMat);
      nose.scale.set(0.9, 1.3, 0.8);
      nose.position.set(0, 3.6, 1.45);
      group.add(nose);

      return group;
    }

    if (gateId === 'gate_dolphin') {
      // 🐬 海豚門：巨大蔚藍躍水海豚（長 5 米，流線型破浪而起）
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.5, 4.8, 20), blueMat);
      body.rotation.z = Math.PI * 0.38;
      body.position.set(0, 2.6, 0);
      body.castShadow = true;
      group.add(body);

      const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, 4.2, 16), whiteMat);
      belly.rotation.z = Math.PI * 0.38;
      belly.position.set(0.2, 2.2, 0);
      group.add(belly);

      // 挺拔背鰭
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 6), blueMat);
      fin.position.set(-0.4, 3.8, 0);
      fin.rotation.z = -0.4;
      group.add(fin);

      // 尾鰭
      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.8), blueMat);
      tailFin.position.set(-1.8, 1.1, 0);
      tailFin.rotation.z = 0.4;
      group.add(tailFin);

      return group;
    }

    if (gateId === 'gate_dinosaur') {
      // 🦖 恐龍門：霸氣亮綠暴龍（高 5.5 米，威武可愛守護南昌街）
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 3.6), greenMat);
      body.position.y = 2.0;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 2.4), greenMat);
      head.position.set(0, 4.0, 1.5);
      head.castShadow = true;
      group.add(head);

      // 暴龍長長金黃背刺骨板
      for (let z of [-1.2, -0.4, 0.4, 1.2]) {
        const spine = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 4), yellowMat);
        spine.position.set(0, 3.9, z);
        spine.castShadow = true;
        group.add(spine);
      }

      // 萌萌大眼
      for (let ox of [-0.95, 0.95]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), yellowMat);
        eye.position.set(ox, 4.2, 1.8);
        group.add(eye);
      }

      return group;
    }

    if (gateId === 'gate_penguin') {
      // 🐧 企鵝門：圓滾滾大企鵝（高 4.8 米，白肚肚、亮橘大嘴巴）
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.5, 3.6, 20), darkMat);
      body.position.y = 1.8;
      body.castShadow = true;
      group.add(body);

      const belly = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 16), whiteMat);
      belly.position.set(0, 1.7, 0.6);
      group.add(belly);

      // 鮮黃尖尖企鵝嘴
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.0, 8), orangeMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 3.0, 1.35);
      group.add(beak);

      // 企鵝雙翅
      for (let ox of [-1.4, 1.4]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.8), darkMat);
        wing.position.set(ox, 2.2, 0);
        wing.rotation.z = ox > 0 ? -0.2 : 0.2;
        group.add(wing);
      }

      return group;
    }

    // 清潭路正大門與民族路大門（巨幅純金校徽）
    if (gateId === 'gate_new' || gateId === 'gate_minzu') {
      const emblem = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.4, 32), yellowMat);
      emblem.rotation.x = Math.PI / 2;
      emblem.position.y = 2.0;
      emblem.castShadow = true;
      group.add(emblem);
      return group;
    }

    return null;
  }

  buildTrees() {
    const treePositions = [];

    for (let x = -22; x <= 68; x += 9) {
      treePositions.push({ x, z: -98, scale: 1.15 + (x % 3) * 0.1 });
    }
    for (let z = -94; z <= -42; z += 9) {
      treePositions.push({ x: 72, z, scale: 1.2 + (z % 2) * 0.1 });
    }

    for (let z = -70; z <= -18; z += 8) {
      treePositions.push({ x: -76, z, scale: 1.1 });
    }

    treePositions.push({ x: -14, z: 6, scale: 1.4 });
    treePositions.push({ x: -20, z: 18, scale: 1.3 });
    treePositions.push({ x: -12, z: 28, scale: 1.35 });
    treePositions.push({ x: -18, z: 36, scale: 1.2 });

    for (let z = 20; z <= 75; z += 12) {
      treePositions.push({ x: 30, z, scale: 1.15 });
    }

    treePositions.forEach((pos, idx) => {
      const tree = new THREE.Group();
      tree.position.set(pos.x, 0, pos.z);

      const trunkGeo = new THREE.CylinderGeometry(0.4 * pos.scale, 0.55 * pos.scale, 3.2 * pos.scale, 8);
      const trunk = new THREE.Mesh(trunkGeo, this.materials.trunk);
      trunk.position.y = 1.6 * pos.scale;
      trunk.castShadow = true;
      tree.add(trunk);

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
