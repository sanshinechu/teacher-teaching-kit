// 羅東國小 3D 校園建造器：依 Google 衛星空照真實形狀與方位建造高精細校舍、特色動物雕塑校門與周邊道路
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
    // 1. 周邊城市大地基座
    const outerGeo = new THREE.PlaneGeometry(380, 360);
    const outerGround = new THREE.Mesh(outerGeo, new THREE.MeshStandardMaterial({ color: '#1e3823', roughness: 0.9 }));
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.receiveShadow = true;
    this.scene.add(outerGround);

    // 2. 羅東國小空照真實多邊形校園草坪輪廓
    const campusShape = new THREE.Shape();
    campusShape.moveTo(-25, -88); // 北端清潭路大門段
    campusShape.lineTo(25, -61);  // 沿清潭路斜向東南
    campusShape.lineTo(47, -25);  // 開羅街/清潭路轉角
    campusShape.lineTo(61, -20);
    campusShape.lineTo(81, -14);  // 操場東北角
    campusShape.lineTo(86, 79);   // 操場東南開羅街角
    campusShape.lineTo(82, 86);   // 東南角（南昌街東端）
    campusShape.lineTo(-54, 86);  // 南界南昌街西端
    campusShape.lineTo(-65, 79);  // 西南角切角
    campusShape.lineTo(-79, 68);  // 開元市場側門段
    campusShape.lineTo(-82, 39);  // 西界弧形向上
    campusShape.lineTo(-86, 7);   // 民族路/孔雀門段
    campusShape.lineTo(-82, -25);
    campusShape.lineTo(-74, -54); // 民族路歷史門牌段
    campusShape.lineTo(-57, -72); // 西北角弧線
    campusShape.lineTo(-39, -84); // 接回北界
    campusShape.closePath();

    const campusGeo = new THREE.ShapeGeometry(campusShape);
    const campusGround = new THREE.Mesh(campusGeo, this.materials.grass);
    campusGround.rotation.x = -Math.PI / 2;
    campusGround.position.y = 0.04;
    campusGround.receiveShadow = true;
    this.scene.add(campusGround);

    // 3. 北側清潭路新大門迎賓停車廣場（斜向 -32 度）
    const northPlazaGeo = new THREE.PlaneGeometry(30, 22);
    const northPlaza = new THREE.Mesh(northPlazaGeo, this.materials.parkingPave);
    northPlaza.rotation.x = -Math.PI / 2;
    northPlaza.rotation.z = -0.56;
    northPlaza.position.set(18, 0.08, -54);
    northPlaza.receiveShadow = true;
    this.scene.add(northPlaza);

    // 迎賓停車格標線
    for (let i = -3; i <= 3; i++) {
      const lineGeo = new THREE.PlaneGeometry(0.18, 5.0);
      const lineMesh = new THREE.Mesh(lineGeo, this.materials.lineWhite);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.rotation.z = -0.56;
      const lx = 18 + Math.cos(-0.56) * (i * 2.8);
      const lz = -54 - Math.sin(-0.56) * (i * 2.8);
      lineMesh.position.set(lx, 0.09, lz);
      this.scene.add(lineMesh);
    }

    // 4. 西南教職員停車場
    const swPlazaGeo = new THREE.PlaneGeometry(26, 24);
    const swPlaza = new THREE.Mesh(swPlazaGeo, this.materials.parkingPave);
    swPlaza.rotation.x = -Math.PI / 2;
    swPlaza.position.set(-62, 0.08, 52);
    swPlaza.receiveShadow = true;
    this.scene.add(swPlaza);

    for (let i = -3; i <= 3; i++) {
      const lineGeo = new THREE.PlaneGeometry(0.18, 5.2);
      const lineMesh = new THREE.Mesh(lineGeo, this.materials.lineWhite);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.position.set(-62 + i * 2.8, 0.09, 52);
      this.scene.add(lineMesh);
    }

    // 5. 中庭溫潤石磚步道花園（迎曦樓、涵育樓與百齡樓之間）
    const courtGeo = new THREE.PlaneGeometry(26, 52);
    const courtMesh = new THREE.Mesh(courtGeo, this.materials.pave);
    courtMesh.rotation.x = -Math.PI / 2;
    courtMesh.position.set(-36, 0.07, -20);
    courtMesh.receiveShadow = true;
    this.scene.add(courtMesh);

    // 6. 迎風圓形展演涼亭（空照圖操場西側醒目圓形紅白同心條紋頂棚）
    const pavilionGroup = new THREE.Group();
    pavilionGroup.position.set(23, 0, 38);

    // 同心圓階梯基座
    const step1Geo = new THREE.CylinderGeometry(7.2, 7.5, 0.35, 32);
    const step1 = new THREE.Mesh(step1Geo, this.materials.pave);
    step1.position.y = 0.18;
    step1.receiveShadow = true;
    pavilionGroup.add(step1);

    const step2Geo = new THREE.CylinderGeometry(6.0, 6.2, 0.3, 32);
    const step2 = new THREE.Mesh(step2Geo, this.materials.wallWhite);
    step2.position.y = 0.45;
    step2.receiveShadow = true;
    pavilionGroup.add(step2);

    // 鋼構立柱
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const pillarGeo = new THREE.CylinderGeometry(0.14, 0.14, 3.8, 12);
      const pillar = new THREE.Mesh(pillarGeo, this.materials.metal);
      pillar.position.set(Math.cos(a) * 4.8, 2.35, Math.sin(a) * 4.8);
      pillar.castShadow = true;
      pavilionGroup.add(pillar);
    }

    // 條紋圓頂遮陽棚
    const canopyGeo = new THREE.ConeGeometry(5.8, 2.2, 24);
    const canopy = new THREE.Mesh(canopyGeo, this.materials.roofRed);
    canopy.position.y = 4.8;
    canopy.castShadow = true;
    pavilionGroup.add(canopy);

    const ringGeo = new THREE.TorusGeometry(5.8, 0.25, 8, 32);
    const ring = new THREE.Mesh(ringGeo, this.materials.wallWhite);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 3.8;
    pavilionGroup.add(ring);

    this.scene.add(pavilionGroup);

    // 7. 圓形生態景觀花園（圓形亭子北方）
    const gardenGeo = new THREE.CircleGeometry(5.5, 24);
    const garden = new THREE.Mesh(gardenGeo, this.materials.field);
    garden.rotation.x = -Math.PI / 2;
    garden.position.set(18, 0.08, 16);
    this.scene.add(garden);
  }

  // --- 200M PU 操場跑道與內圈多功能球場（精確定位於東南開闊區） ---
  buildTrackAndField() {
    const trackGroup = new THREE.Group();
    // 操場跑道中心：X=54（東南象限）、Z=34（南依南昌街、東臨開羅街）
    trackGroup.position.set(54, 0.12, 34);
    trackGroup.rotation.y = -0.05; // 微傾斜約 3 度，對齊開照道路走向

    // 南北向標準 200M 跑道幾何形狀（直線跑道沿 Z 軸長 38 米，兩端半圓沿 X 軸半徑 24 米）
    const slen = 19; // 直線段半長 (Z 軸向從 -19 到 +19，全長 38 米)
    const r = 24;    // 彎道外半徑 (X 軸向從 -24 到 +24，跑道全寬 48 米，範圍 X: 30 到 78)

    const trackShape = new THREE.Shape();
    trackShape.moveTo(-r, -slen);
    trackShape.absarc(0, -slen, r, Math.PI, 0, false); // 北端半圓彎道（弧頂朝北）
    trackShape.lineTo(r, slen);                       // 東側直線跑道
    trackShape.absarc(0, slen, r, 0, Math.PI, false);  // 南端半圓彎道（弧頂朝南）
    trackShape.lineTo(-r, -slen);                      // 西側直線跑道

    const trackGeo = new THREE.ShapeGeometry(trackShape);
    const trackMesh = new THREE.Mesh(trackGeo, this.materials.track); // 湛藍色 PU 跑道
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.receiveShadow = true;
    trackMesh.userData = { id: "track_field", name: "200M 湛藍 PU 操場" };
    trackGroup.add(trackMesh);
    this.interactiveObjects.push(trackMesh);

    // 內圈球場基座（暖黃橙色排球/籃球場地坪，空照圖真實特徵）
    const ir = 16.5; // 內圈半徑
    const innerShape = new THREE.Shape();
    innerShape.moveTo(-ir, -slen);
    innerShape.absarc(0, -slen, ir, Math.PI, 0, false);
    innerShape.lineTo(ir, slen);
    innerShape.absarc(0, slen, ir, 0, Math.PI, false);
    innerShape.lineTo(-ir, -slen);

    const innerGeo = new THREE.ShapeGeometry(innerShape);
    const innerMesh = new THREE.Mesh(innerGeo, this.materials.court);
    innerMesh.rotation.x = -Math.PI / 2;
    innerMesh.position.y = 0.02;
    innerMesh.receiveShadow = true;
    trackGroup.add(innerMesh);

    // 內圈中央跳球區與緩衝草坪
    const centerGrassGeo = new THREE.PlaneGeometry(16, 20);
    const centerGrass = new THREE.Mesh(centerGrassGeo, this.materials.courtInner);
    centerGrass.rotation.x = -Math.PI / 2;
    centerGrass.position.set(0, 0.025, 0);
    trackGroup.add(centerGrass);

    // 6 條白漆跑道分隔線（完美封閉同心圓滑環）
    for (let i = 0; i <= 5; i++) {
      const cr = ir + (r - ir) * (i / 5);
      const linePoints = [];
      for (let a = Math.PI; a >= 0; a -= Math.PI / 32) {
        linePoints.push(new THREE.Vector3(Math.cos(a) * cr, 0.03, -slen - Math.sin(a) * cr));
      }
      linePoints.push(new THREE.Vector3(cr, 0.03, slen));
      for (let a = 0; a <= Math.PI; a += Math.PI / 32) {
        linePoints.push(new THREE.Vector3(Math.cos(a) * cr, 0.03, slen + Math.sin(a) * cr));
      }
      linePoints.push(new THREE.Vector3(-cr, 0.03, -slen));
      linePoints.push(linePoints[0]);

      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const line = new THREE.Line(lineGeo, this.materials.lineWhite);
      trackGroup.add(line);
    }

    // 內圈球場標線（籃球禁區與中線）
    for (let sz of [-slen * 0.55, slen * 0.55]) {
      const courtLinePoints = [
        new THREE.Vector3(-8, 0.035, sz - 7),
        new THREE.Vector3(8, 0.035, sz - 7),
        new THREE.Vector3(8, 0.035, sz + 7),
        new THREE.Vector3(-8, 0.035, sz + 7),
        new THREE.Vector3(-8, 0.035, sz - 7)
      ];
      const clGeo = new THREE.BufferGeometry().setFromPoints(courtLinePoints);
      const cl = new THREE.Line(clGeo, this.materials.lineWhite);
      trackGroup.add(cl);

      // 三秒區鑰匙圈
      const hoopPoints = [];
      for (let a = 0; a <= Math.PI * 2; a += Math.PI / 16) {
        hoopPoints.push(new THREE.Vector3(Math.cos(a) * 2.8, 0.035, sz + Math.sin(a) * 2.8));
      }
      const hoopGeo = new THREE.BufferGeometry().setFromPoints(hoopPoints);
      trackGroup.add(new THREE.Line(hoopGeo, this.materials.lineWhite));
    }

    // 司令台（位於操場西側直道外緣，坐西朝東面向全操場）
    const stageGeo = new THREE.BoxGeometry(7, 2.2, 14);
    const stage = new THREE.Mesh(stageGeo, this.materials.wallCream);
    stage.position.set(-r - 3.8, 1.1, 0);
    stage.castShadow = true;
    stage.receiveShadow = true;
    trackGroup.add(stage);

    const roofGeo = new THREE.BoxGeometry(9, 0.6, 16);
    const roof = new THREE.Mesh(roofGeo, this.materials.roofRed);
    roof.position.set(-r - 3.8, 4.4, 0);
    roof.castShadow = true;
    trackGroup.add(roof);

    for (let px of [-r - 6.8, -r - 0.8]) {
      for (let pz of [-6.5, 6.5]) {
        const pillarGeo = new THREE.CylinderGeometry(0.22, 0.22, 2.8);
        const pillar = new THREE.Mesh(pillarGeo, this.materials.metal);
        pillar.position.set(px, 2.9, pz);
        trackGroup.add(pillar);
      }
    }

    this.scene.add(trackGroup);
  }

  // --- 核心校舍群立體造型（依真實建築特徵參數化塑造） ---
  buildBuildings() {
    BUILDINGS.forEach(b => {
      if (b.category === "gate" || b.id === "track_field" || b.id === "courtyard" || b.id === "circular_pavilion" || b.id.startsWith("parking")) return;

      const group = new THREE.Group();
      group.position.set(b.x, 0, b.z);
      if (b.rotationY) {
        group.rotation.y = b.rotationY;
      }

      // 主體量體
      if (b.id === "bailing") {
        // 🏛️ 百齡樓雙翼複合建築群（依空照紅框兩道箭頭精確構建雙翼連通大樓）
        // 北翼：高年級教學棟
        const w1Geo = new THREE.BoxGeometry(22, b.h, 32);
        const w1 = new THREE.Mesh(w1Geo, this.materials.wallCream);
        w1.position.set(-11, b.h / 2, -7);
        w1.castShadow = true;
        w1.receiveShadow = true;
        w1.userData = { ...b };
        group.add(w1);
        this.interactiveObjects.push(w1);

        const edge1 = new THREE.Mesh(new THREE.BoxGeometry(22.8, 0.6, 32.8), this.materials.roofDark);
        edge1.position.set(-11, b.h + 0.3, -7);
        edge1.castShadow = true;
        group.add(edge1);

        const solar1 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 24), this.materials.solarPanel);
        solar1.position.set(-11, b.h + 0.9, -7);
        solar1.rotation.x = 0.08;
        group.add(solar1);

        // 南翼：生活、幼兒園與中央廚房棟
        const h2 = 13.5;
        const w2Geo = new THREE.BoxGeometry(32, h2, 22);
        const w2 = new THREE.Mesh(w2Geo, this.materials.wallCream);
        w2.position.set(15, h2 / 2, 14);
        w2.castShadow = true;
        w2.receiveShadow = true;
        w2.userData = { ...b };
        group.add(w2);
        this.interactiveObjects.push(w2);

        const edge2 = new THREE.Mesh(new THREE.BoxGeometry(32.8, 0.6, 22.8), this.materials.roofDark);
        edge2.position.set(15, h2 + 0.3, 14);
        edge2.castShadow = true;
        group.add(edge2);

        const solar2 = new THREE.Mesh(new THREE.BoxGeometry(24, 0.2, 15), this.materials.solarPanel);
        solar2.position.set(15, h2 + 0.9, 14);
        solar2.rotation.z = -0.06;
        group.add(solar2);

        // 轉角連通穿堂
        const cornerGeo = new THREE.BoxGeometry(14, 15, 14);
        const corner = new THREE.Mesh(cornerGeo, this.materials.wallCream);
        corner.position.set(-2, 7.5, 6);
        corner.castShadow = true;
        corner.userData = { ...b };
        group.add(corner);
        this.interactiveObjects.push(corner);
      } else {
        const bodyGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
        const bodyMat = this.materials[b.id] || this.materials.wallCream;
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = b.h / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        body.userData = { ...b };
        group.add(body);
        this.interactiveObjects.push(body);

        // 女兒牆石材收邊
        const edgeGeo = new THREE.BoxGeometry(b.w + 0.8, 0.6, b.d + 0.8);
        const edge = new THREE.Mesh(edgeGeo, this.materials.roofDark);
        edge.position.y = b.h + 0.3;
        edge.castShadow = true;
        group.add(edge);
      }

      // --- 各棟特色屋頂架構 ---
      if (b.id === "wind_rain_court") {
        // 🏛️ 風雨操場：6 連棟雙色交替圓拱拱頂（空照圖正中心最醒目的綠色圓拱屋頂！）
        const archCount = 6;
        const archWidth = b.w / archCount;
        const archRadius = archWidth * 0.55;

        for (let i = 0; i < archCount; i++) {
          const ax = -b.w / 2 + (i + 0.5) * archWidth;
          const archGeo = new THREE.CylinderGeometry(archRadius, archRadius, b.d, 24, 1, false, 0, Math.PI);
          const mat = (i % 2 === 0) ? this.materials.roofWaveGreen : this.materials.roofWaveBeige;
          const archMesh = new THREE.Mesh(archGeo, mat);
          archMesh.rotation.x = Math.PI / 2;
          archMesh.position.set(ax, b.h + 0.6, 0);
          archMesh.castShadow = true;
          group.add(archMesh);
        }
      } else if (b.id === "gymnasium") {
        // 🏛️ 體育館（樹人館）：大跨度挑高雙斜坡鋼構屋頂（北坡光電板、南坡紅瓦邊）
        const roofHeight = 4.2;
        const roofGeo = new THREE.BoxGeometry(b.w + 1.2, roofHeight, b.d + 1.2);
        const roofGroup = new THREE.Group();
        roofGroup.position.set(0, b.h + roofHeight / 2, 0);

        // 北坡大面積深色太陽能板陣列
        const solarGeo = new THREE.PlaneGeometry(b.w * 0.92, b.d * 0.44);
        const solar = new THREE.Mesh(solarGeo, this.materials.solarPanel);
        solar.rotation.x = -Math.PI / 3.2;
        solar.position.set(0, 1.2, -b.d * 0.22);
        roofGroup.add(solar);

        // 南坡紅瓦斜面
        const tileGeo = new THREE.PlaneGeometry(b.w * 0.95, b.d * 0.48);
        const tile = new THREE.Mesh(tileGeo, this.materials.roofRed);
        tile.rotation.x = Math.PI / 3.2;
        tile.position.set(0, 1.0, b.d * 0.22);
        roofGroup.add(tile);

        group.add(roofGroup);
      } else if (b.id === "science") {
        // 🏛️ 科學館：頂樓天文台圓頂
        const domeGeo = new THREE.SphereGeometry(3.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(domeGeo, this.materials.wallWhite);
        dome.position.set(0, b.h + 0.6, 0);
        dome.castShadow = true;
        group.add(dome);

        const ringGeo = new THREE.TorusGeometry(3.6, 0.25, 8, 24);
        const ring = new THREE.Mesh(ringGeo, this.materials.metal);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, b.h + 0.6, 0);
        group.add(ring);
      } else {
        // 一般校舍：頂樓電梯機房與太陽能棚架
        const hutGeo = new THREE.BoxGeometry(Math.min(7, b.w * 0.3), 2.8, Math.min(6, b.d * 0.3));
        const hut = new THREE.Mesh(hutGeo, this.materials.wallWhite);
        hut.position.set(-b.w * 0.22, b.h + 1.7, -b.d * 0.18);
        hut.castShadow = true;
        group.add(hut);

        if (b.w >= 20) {
          const solarPanelGeo = new THREE.BoxGeometry(b.w * 0.5, 0.2, b.d * 0.45);
          const solarPanel = new THREE.Mesh(solarPanelGeo, this.materials.solarPanel);
          solarPanel.position.set(b.w * 0.15, b.h + 1.0, 0);
          solarPanel.rotation.x = 0.1;
          group.add(solarPanel);
        }
      }

      // 立面窗格（每層樓帶金屬反光鍍膜窗）
      const floors = b.floors || 3;
      const floorH = b.h / floors;
      for (let f = 1; f <= floors; f++) {
        const wy = (f - 0.5) * floorH;

        const winGeo = new THREE.BoxGeometry(b.w * 0.85, floorH * 0.42, 0.25);
        const winFront = new THREE.Mesh(winGeo, this.materials.window);
        winFront.position.set(0, wy, b.d / 2 + 0.1);
        group.add(winFront);

        const winBack = new THREE.Mesh(winGeo, this.materials.window);
        winBack.position.set(0, wy, -b.d / 2 - 0.1);
        group.add(winBack);

        if (b.d >= 18) {
          const sideGeo = new THREE.BoxGeometry(0.25, floorH * 0.42, b.d * 0.65);
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

  // --- 校舍間紅瓦風雨走廊連通系統 ---
  buildCoveredWalkways() {
    const corridorMat = this.materials.roofRed;
    const pillarMat = this.materials.metal;

    const corridors = [
      // 涵育樓至風雨操場
      { x1: -3, z1: -47, x2: -18, z2: -15, w: 3.2 },
      // 風雨操場至迎曦樓中庭走廊
      { x1: -36, z1: -9, x2: -48, z2: -25, w: 3.2 },
      // 風雨操場至百齡樓
      { x1: -25, z1: 2, x2: -35, z2: 22, w: 3.0 }
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

  // --- 周邊四面環繞真實道路網絡 ---
  buildRoads() {
    const roadMat = this.materials.road;

    // 1. 北側清潭路（斜向貫穿，寬 16 米，連接開羅街與新大門）
    const northRoadGeo = new THREE.PlaneGeometry(16, 175);
    const northRoad = new THREE.Mesh(northRoadGeo, roadMat);
    northRoad.rotation.x = -Math.PI / 2;
    northRoad.rotation.z = -0.56;
    northRoad.position.set(10, 0.03, -78);
    northRoad.receiveShadow = true;
    this.scene.add(northRoad);

    // 2. 東側開羅街／清潭路南段（操場東緣，長 180 米）
    const eastRoadGeo = new THREE.PlaneGeometry(16, 210);
    const eastRoad = new THREE.Mesh(eastRoadGeo, roadMat);
    eastRoad.rotation.x = -Math.PI / 2;
    eastRoad.position.set(96, 0.03, 35);
    eastRoad.receiveShadow = true;
    this.scene.add(eastRoad);

    // 3. 南側南昌街（體育館南緣，長 240 米）
    const southRoadGeo = new THREE.PlaneGeometry(240, 16);
    const southRoad = new THREE.Mesh(southRoadGeo, roadMat);
    southRoad.rotation.x = -Math.PI / 2;
    southRoad.position.set(10, 0.03, 96);
    southRoad.receiveShadow = true;
    this.scene.add(southRoad);

    // 4. 西側民族路／清潭路西段（沿西界弧形分段道路）
    const westRoads = [
      { x: -95, z: 25, len: 90, rotZ: 0 },
      { x: -90, z: -35, len: 65, rotZ: 0.28 },
      { x: -70, z: -75, len: 60, rotZ: 0.65 }
    ];

    westRoads.forEach(wr => {
      const wGeo = new THREE.PlaneGeometry(16, wr.len);
      const wMesh = new THREE.Mesh(wGeo, roadMat);
      wMesh.rotation.x = -Math.PI / 2;
      wMesh.rotation.z = wr.rotZ;
      wMesh.position.set(wr.x, 0.03, wr.z);
      wMesh.receiveShadow = true;
      this.scene.add(wMesh);
    });

    // 5. 新大門前行人斑馬線
    const zebraGroup = new THREE.Group();
    zebraGroup.position.set(22, 0.038, -66);
    zebraGroup.rotation.y = -0.56;
    for (let i = -4; i <= 4; i++) {
      const stripeGeo = new THREE.PlaneGeometry(0.8, 4.8);
      const stripe = new THREE.Mesh(stripeGeo, this.materials.lineWhite);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(i * 1.4, 0, 0);
      zebraGroup.add(stripe);
    }
    this.scene.add(zebraGroup);
  }

  // --- 校園真實多邊形立體圍籬（依空照外廓全封閉＋留設校門開口） ---
  buildPerimeterFences() {
    const fenceRailMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.2,
      metalness: 0.7
    });
    const wallBaseMat = this.materials.wallBrick;

    // 精確多邊形圍籬段（已依 9 座校門扣除開口寬度）
    const fenceSegments = [
      // 北界清潭路斜向段
      { x1: -39, z1: -84, x2: -25, z2: -88 },
      { x1: -25, z1: -88, x2: -19, z2: -82 },
      // [留設白兔門開口: -19,-82 至 -11,-77]
      { x1: -11, z1: -77, x2: 14, z2: -66 },
      // [留設清潭路新大門開口: 14,-66 至 28,-58]
      { x1: 28, z1: -58, x2: 41, z2: -29 },
      // [留設無尾熊門開口: 41,-29 至 48,-21]
      { x1: 48, z1: -21, x2: 61, z2: -20 },
      { x1: 61, z1: -20, x2: 81, z2: -14 },

      // 東界開羅街段（操場東圍籬）
      { x1: 81, z1: -14, x2: 83, z2: 15 },
      // [留設海豚門開口: 83,15 至 83,25]
      { x1: 83, z1: 25, x2: 84, z2: 63 },
      // [留設恐龍門開口: 84,63 至 84,73]
      { x1: 84, z1: 73, x2: 86, z2: 79 },
      { x1: 86, z1: 79, x2: 82, z2: 86 },

      // 南界南昌街段（體育館南緣）
      { x1: 82, z1: 86, x2: -5, z2: 86 },
      // [留設企鵝門開口: -5,86 至 -15,86]
      { x1: -15, z1: 86, x2: -54, z2: 86 },
      { x1: -54, z1: 86, x2: -65, z2: 79 },

      // 西南界開元市場段
      { x1: -65, z1: 79, x2: -71, z2: 60 },
      // [留設開元市場門開口: -71,60 至 -78,49]
      { x1: -78, z1: 49, x2: -82, z2: 39 },
      { x1: -82, z1: 39, x2: -85, z2: 10 },

      // 西界民族路／清潭路西段
      // [留設孔雀門開口: -85,10 至 -83,0]
      { x1: -83, z1: 0, x2: -82, z2: -25 },
      { x1: -82, z1: -25, x2: -74, z2: -50 },
      // [留設民族路1號大門開口: -74,-50 至 -65,-59]
      { x1: -65, z1: -59, x2: -57, z2: -72 },
      { x1: -57, z1: -72, x2: -39, z2: -84 }
    ];

    fenceSegments.forEach(seg => {
      const len = Math.hypot(seg.x2 - seg.x1, seg.z2 - seg.z1);
      if (len < 0.5) return;
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

  // --- 校門建造：放大體積 2.5 倍，色彩鮮明極度搶眼，精確貼合圍籬走向 ---
  buildFencesAndGates() {
    const gates = BUILDINGS.filter(b => b.category === "gate");
    gates.forEach(g => {
      const gateGroup = new THREE.Group();
      gateGroup.position.set(g.x, 0, g.z);
      if (g.rotationY !== undefined) {
        gateGroup.rotation.y = g.rotationY;
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
    const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.3 });
    const blueMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.2, metalness: 0.3 });
    const greenMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.3 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.25 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.25 });
    const grayMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.35 });
    const pinkMat = new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.25 });

    if (gateId === 'gate_rabbit') {
      // 🐰 白兔門：巨大萌萌立體大白兔
      const body = new THREE.Mesh(new THREE.SphereGeometry(2.0, 20, 20), whiteMat);
      body.position.y = 1.8;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(1.5, 20, 20), whiteMat);
      head.position.set(0, 3.8, 0);
      head.castShadow = true;
      group.add(head);

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

      for (let ox of [-0.45, 0.45]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), pinkMat);
        eye.position.set(ox, 4.0, 1.4);
        group.add(eye);
      }

      const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.8, 12), orangeMat);
      carrot.rotation.z = 0.6;
      carrot.position.set(0.6, 2.2, 1.4);
      group.add(carrot);

      return group;
    }

    if (gateId === 'gate_peacock') {
      // 🦚 孔雀門：華麗翠綠開屏孔雀
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

      for (let a = -Math.PI * 0.45; a <= Math.PI * 0.45; a += Math.PI * 0.11) {
        const feather = new THREE.Mesh(new THREE.ConeGeometry(0.55, 4.2, 8), greenMat);
        feather.position.set(Math.sin(a) * 2.2, 3.2 + Math.cos(a) * 1.8, -0.6);
        feather.rotation.z = -a;
        feather.castShadow = true;
        group.add(feather);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), yellowMat);
        eye.position.set(Math.sin(a) * 3.4, 3.8 + Math.cos(a) * 2.6, -0.4);
        group.add(eye);
      }
      return group;
    }

    if (gateId === 'gate_koala') {
      // 🐨 無尾熊門：巨大呆萌無尾熊
      const body = new THREE.Mesh(new THREE.SphereGeometry(2.0, 20, 20), grayMat);
      body.position.y = 1.8;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 20), grayMat);
      head.position.set(0, 3.8, 0);
      head.castShadow = true;
      group.add(head);

      for (let ox of [-1.4, 1.4]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), grayMat);
        ear.position.set(ox, 4.6, 0);
        ear.castShadow = true;
        group.add(ear);

        const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), whiteMat);
        innerEar.position.set(ox * 0.9, 4.6, 0.35);
        group.add(innerEar);
      }

      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), darkMat);
      nose.scale.set(0.9, 1.3, 0.8);
      nose.position.set(0, 3.6, 1.45);
      group.add(nose);

      return group;
    }

    if (gateId === 'gate_dolphin') {
      // 🐬 海豚門：巨大蔚藍躍水海豚
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.5, 4.8, 20), blueMat);
      body.rotation.z = Math.PI * 0.38;
      body.position.set(0, 2.6, 0);
      body.castShadow = true;
      group.add(body);

      const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, 4.2, 16), whiteMat);
      belly.rotation.z = Math.PI * 0.38;
      belly.position.set(0.2, 2.2, 0);
      group.add(belly);

      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 6), blueMat);
      fin.position.set(-0.4, 3.8, 0);
      fin.rotation.z = -0.4;
      group.add(fin);

      const tailFin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.8), blueMat);
      tailFin.position.set(-1.8, 1.1, 0);
      tailFin.rotation.z = 0.4;
      group.add(tailFin);

      return group;
    }

    if (gateId === 'gate_dinosaur') {
      // 🦖 恐龍門：霸氣亮綠暴龍
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 3.6), greenMat);
      body.position.y = 2.0;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 2.4), greenMat);
      head.position.set(0, 4.0, 1.5);
      head.castShadow = true;
      group.add(head);

      for (let z of [-1.2, -0.4, 0.4, 1.2]) {
        const spine = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 4), yellowMat);
        spine.position.set(0, 3.9, z);
        spine.castShadow = true;
        group.add(spine);
      }

      for (let ox of [-0.95, 0.95]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), yellowMat);
        eye.position.set(ox, 4.2, 1.8);
        group.add(eye);
      }

      return group;
    }

    if (gateId === 'gate_penguin') {
      // 🐧 企鵝門：圓滾滾大企鵝
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.5, 3.6, 20), darkMat);
      body.position.y = 1.8;
      body.castShadow = true;
      group.add(body);

      const belly = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 16), whiteMat);
      belly.position.set(0, 1.7, 0.6);
      group.add(belly);

      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.0, 8), orangeMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 3.0, 1.35);
      group.add(beak);

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

  // --- 依空照植被分佈佈設層次綠樹（中庭花園、操場四周、西界林蔭道） ---
  buildTrees() {
    const treePositions = [];

    // 1. 操場西側與中庭綠帶樹群
    for (let z = -2; z <= 65; z += 11) {
      treePositions.push({ x: 26, z, scale: 1.25 + (z % 2) * 0.1 });
    }

    // 2. 操場東緣開羅街圍籬林蔭
    for (let z = 0; z <= 70; z += 14) {
      treePositions.push({ x: 80, z, scale: 1.15 });
    }

    // 3. 操場北側綠草坪樹群
    for (let x = 40; x <= 75; x += 10) {
      treePositions.push({ x, z: -18, scale: 1.2 });
    }

    // 4. 西界清潭路西段與迎曦樓西側林蔭道
    for (let z = -50; z <= 35; z += 12) {
      treePositions.push({ x: -75, z, scale: 1.2 + (z % 3) * 0.08 });
    }

    // 5. 百齡樓與迎曦樓迎風中庭花園造景樹
    treePositions.push({ x: -36, z: -35, scale: 1.35 });
    treePositions.push({ x: -36, z: -20, scale: 1.4 });
    treePositions.push({ x: -36, z: -5, scale: 1.3 });
    treePositions.push({ x: -36, z: 12, scale: 1.25 });

    // 6. 圓形展演涼亭周邊造景樹
    treePositions.push({ x: 29, z: 46, scale: 1.2 });
    treePositions.push({ x: 16, z: 44, scale: 1.15 });
    treePositions.push({ x: 28, z: 30, scale: 1.2 });

    // 7. 南界南昌街圍籬綠帶
    for (let x = -40; x <= 0; x += 12) {
      treePositions.push({ x, z: 82, scale: 1.1 });
    }

    treePositions.forEach((pos, idx) => {
      const tree = new THREE.Group();
      tree.position.set(pos.x, 0, pos.z);

      const trunkGeo = new THREE.CylinderGeometry(0.38 * pos.scale, 0.52 * pos.scale, 3.2 * pos.scale, 8);
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
