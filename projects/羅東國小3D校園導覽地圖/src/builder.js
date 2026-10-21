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
    campusShape.lineTo(1, -74);
    campusShape.lineTo(15, -66);  // 清潭路新大門
    campusShape.lineTo(61, -20);  // 沿清潭路北側圍牆斜向東南至轉角（-45度斜線）
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

    // 3. 北側清潭路新大門迎賓停車廣場（完全置於校園圍牆內側，與北側圍籬平行 -45度對齊）
    const northPlazaGeo = new THREE.PlaneGeometry(34, 16);
    const northPlaza = new THREE.Mesh(northPlazaGeo, this.materials.parkingPave);
    northPlaza.rotation.x = -Math.PI / 2;
    northPlaza.rotation.z = -Math.PI / 4;
    northPlaza.position.set(23, 0.08, -45);
    northPlaza.receiveShadow = true;
    this.scene.add(northPlaza);

    // 迎賓停車格標線（沿圍籬方向平行排列，車頭朝向圍籬）
    const ly = 5.2;
    for (let i = -5; i <= 5; i++) {
      const lx = i * 2.8;
      const lineGeo = new THREE.PlaneGeometry(0.18, 5.0);
      const lineMesh = new THREE.Mesh(lineGeo, this.materials.lineWhite);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.rotation.z = -Math.PI / 4;
      const gx = 23 + (lx + ly) / Math.SQRT2;
      const gz = -45 + (lx - ly) / Math.SQRT2;
      lineMesh.position.set(gx, 0.09, gz);
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

    // 6. 迎風圓形司令台展演亭（順著箭頭移至操場西側直道邊緣，中軸 Z=34 完美對齊操場中圈）
    const pavilionGroup = new THREE.Group();
    pavilionGroup.position.set(22, 0, 34);

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

    // 內圈綠茵球場基座（高質感人工草皮，深淺相間割草條紋）
    const ir = 16.5; // 內圈半徑
    const innerShape = new THREE.Shape();
    innerShape.moveTo(-ir, -slen);
    innerShape.absarc(0, -slen, ir, Math.PI, 0, false);
    innerShape.lineTo(ir, slen);
    innerShape.absarc(0, slen, ir, 0, Math.PI, false);
    innerShape.lineTo(-ir, -slen);

    const innerGeo = new THREE.ShapeGeometry(innerShape);
    const innerMesh = new THREE.Mesh(innerGeo, this.materials.artificialTurf);
    innerMesh.rotation.x = -Math.PI / 2;
    innerMesh.position.y = 0.02;
    innerMesh.receiveShadow = true;
    trackGroup.add(innerMesh);

    // 人工草皮深淺割草斑紋（6 道對比均勻的橫向草皮條帶）
    const stripeWidth = (slen * 2) / 6; // 約 6.3 米寬
    for (let i = 0; i < 6; i += 2) {
      const sz = -slen + (i + 0.5) * stripeWidth;
      const stripeGeo = new THREE.PlaneGeometry(ir * 1.95, stripeWidth);
      const stripeMesh = new THREE.Mesh(stripeGeo, this.materials.artificialTurfLight);
      stripeMesh.rotation.x = -Math.PI / 2;
      stripeMesh.position.set(0, 0.022, sz);
      stripeMesh.receiveShadow = true;
      trackGroup.add(stripeMesh);
    }

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

    // 人工草皮球場專屬白色標線（足球/多功能球場）
    // 1. 球場外圍邊界白線
    const fw = 13.0; // 球場半寬
    const fl = 25.0; // 球場半長
    const fieldBorderPts = [
      new THREE.Vector3(-fw, 0.026, -fl),
      new THREE.Vector3(fw, 0.026, -fl),
      new THREE.Vector3(fw, 0.026, fl),
      new THREE.Vector3(-fw, 0.026, fl),
      new THREE.Vector3(-fw, 0.026, -fl)
    ];
    trackGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(fieldBorderPts), this.materials.lineWhite));

    // 2. 中央半場中線
    const midLinePts = [
      new THREE.Vector3(-fw, 0.026, 0),
      new THREE.Vector3(fw, 0.026, 0)
    ];
    trackGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(midLinePts), this.materials.lineWhite));

    // 3. 中央開球圓圈 (半徑 4.5 米)
    const centerCirclePts = [];
    for (let a = 0; a <= Math.PI * 2; a += Math.PI / 20) {
      centerCirclePts.push(new THREE.Vector3(Math.cos(a) * 4.5, 0.026, Math.sin(a) * 4.5));
    }
    trackGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(centerCirclePts), this.materials.lineWhite));

    // 4. 南北兩側大禁區、小球門區與 3D 足球門
    for (let side of [-1, 1]) {
      const penaltyBoxPts = [
        new THREE.Vector3(-8.5, 0.026, side * fl),
        new THREE.Vector3(-8.5, 0.026, side * (fl - 7.5)),
        new THREE.Vector3(8.5, 0.026, side * (fl - 7.5)),
        new THREE.Vector3(8.5, 0.026, side * fl)
      ];
      trackGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(penaltyBoxPts), this.materials.lineWhite));

      const goalAreaPts = [
        new THREE.Vector3(-4.5, 0.026, side * fl),
        new THREE.Vector3(-4.5, 0.026, side * (fl - 3.5)),
        new THREE.Vector3(4.5, 0.026, side * (fl - 3.5)),
        new THREE.Vector3(4.5, 0.026, side * fl)
      ];
      trackGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(goalAreaPts), this.materials.lineWhite));

      // 白色 3D 足球門立體架構
      const goalGroup = new THREE.Group();
      goalGroup.position.set(0, 0, side * fl);
      goalGroup.rotation.y = side === 1 ? Math.PI : 0;

      const goalMat = this.materials.wallWhite;
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8), goalMat);
      postL.position.set(-2.5, 1.1, 0);
      goalGroup.add(postL);

      const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8), goalMat);
      postR.position.set(2.5, 1.1, 0);
      goalGroup.add(postR);

      const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.0, 8), goalMat);
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0, 2.2, 0);
      goalGroup.add(crossbar);

      const backL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), goalMat);
      backL.position.set(-2.5, 1.1, -0.6);
      backL.rotation.x = -0.5;
      goalGroup.add(backL);

      const backR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), goalMat);
      backR.position.set(2.5, 1.1, -0.6);
      backR.rotation.x = -0.5;
      goalGroup.add(backR);

      trackGroup.add(goalGroup);
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

      // 開放式風雨操場專屬建造（開放式挑高鋼構柱列＋內部多功能球場）
      if (b.id === "wind_rain_court") {
        this.buildWindRainCourt(group, b);
        this.scene.add(group);
        return;
      }

      // 主體量體
      if (b.id === "bailing") {
        // 🏛️ 百齡樓雙翼複合建築群（依空照紅框兩道箭頭精確構建雙翼連通大樓，適度縮小量體退縮）
        // 北翼：高年級教學棟（灰色外觀）
        const w1Geo = new THREE.BoxGeometry(18, b.h, 26);
        const w1 = new THREE.Mesh(w1Geo, this.materials.bailing_main);
        w1.position.set(-9, b.h / 2, -6);
        w1.castShadow = true;
        w1.receiveShadow = true;
        w1.userData = { ...b };
        group.add(w1);
        this.interactiveObjects.push(w1);

        const edge1 = new THREE.Mesh(new THREE.BoxGeometry(18.6, 0.5, 26.6), this.materials.roofDark);
        edge1.position.set(-9, b.h + 0.25, -6);
        edge1.castShadow = true;
        group.add(edge1);

        const solar1 = new THREE.Mesh(new THREE.BoxGeometry(14, 0.15, 20), this.materials.solarPanel);
        solar1.position.set(-9, b.h + 0.7, -6);
        solar1.rotation.x = 0.08;
        group.add(solar1);

        // 南翼：生活、幼兒園與中央廚房棟（灰色外觀）
        const h2 = 12.0;
        const w2Geo = new THREE.BoxGeometry(26, h2, 17);
        const w2 = new THREE.Mesh(w2Geo, this.materials.bailing_main);
        w2.position.set(12, h2 / 2, 11);
        w2.castShadow = true;
        w2.receiveShadow = true;
        w2.userData = { ...b };
        group.add(w2);
        this.interactiveObjects.push(w2);

        const edge2 = new THREE.Mesh(new THREE.BoxGeometry(26.6, 0.5, 17.6), this.materials.roofDark);
        edge2.position.set(12, h2 + 0.25, 11);
        edge2.castShadow = true;
        group.add(edge2);

        const solar2 = new THREE.Mesh(new THREE.BoxGeometry(20, 0.15, 12), this.materials.solarPanel);
        solar2.position.set(12, h2 + 0.7, 11);
        solar2.rotation.z = -0.06;
        group.add(solar2);

        // 🏛️ 百齡樓 1 樓中間挑高通透大穿堂與 2~4 樓連通大樓（灰色外觀）
        const passH = 4.2; // 1 樓挑空穿堂高度
        const upperH = 13.0 - passH; // 2~4 樓高度 8.8m
        const cx = -1, cz = 4;

        // 1. 2~4 樓上層實體建築量體
        const upperGeo = new THREE.BoxGeometry(11, upperH, 11);
        const upper = new THREE.Mesh(upperGeo, this.materials.bailing_main);
        upper.position.set(cx, passH + upperH / 2, cz);
        upper.castShadow = true;
        upper.receiveShadow = true;
        upper.userData = { ...b };
        group.add(upper);
        this.interactiveObjects.push(upper);

        // 頂部深色女兒牆壓頂
        const upperEdgeGeo = new THREE.BoxGeometry(11.6, 0.5, 11.6);
        const upperEdge = new THREE.Mesh(upperEdgeGeo, this.materials.roofDark);
        upperEdge.position.set(cx, 13.0 + 0.25, cz);
        upperEdge.castShadow = true;
        group.add(upperEdge);

        // 2. 1 樓穿堂石材地坪鋪面（通往後側西南教職員停車場）
        const passFloorGeo = new THREE.BoxGeometry(9.4, 0.1, 11.2);
        const passFloor = new THREE.Mesh(passFloorGeo, this.materials.pave);
        passFloor.position.set(cx, 0.05, cz);
        passFloor.receiveShadow = true;
        group.add(passFloor);

        // 3. 1 樓穿堂兩側四角支撐立柱（中間完全挑空通透，視線穿透前後中庭與停車場）
        for (let px of [cx - 4.8, cx + 4.8]) {
          for (let pz of [cz - 4.8, cz + 4.8]) {
            const pillarGeo = new THREE.BoxGeometry(1.2, passH, 1.2);
            const pillar = new THREE.Mesh(pillarGeo, this.materials.bailing_main);
            pillar.position.set(px, passH / 2, pz);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            group.add(pillar);
          }
        }
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
      if (b.id === "gymnasium") {
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
        const domeGeo = new THREE.SphereGeometry(2.4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(domeGeo, this.materials.wallWhite);
        dome.position.set(0, b.h + 0.4, 0);
        dome.castShadow = true;
        group.add(dome);

        const ringGeo = new THREE.TorusGeometry(2.5, 0.18, 8, 24);
        const ring = new THREE.Mesh(ringGeo, this.materials.metal);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, b.h + 0.4, 0);
        group.add(ring);
      } else if (b.id === "xiaoyou") {
        // 🏛️ 校友館：二層挑高，屋頂滿鋪太陽能光電板陣列
        const solarGroup = new THREE.Group();
        solarGroup.position.set(0, b.h + 0.25, 0);

        // 鋁合金鋼構框架基座
        const frameGeo = new THREE.BoxGeometry(b.w * 0.94, 0.15, b.d * 0.94);
        const frame = new THREE.Mesh(frameGeo, this.materials.metal);
        solarGroup.add(frame);

        // 太陽能板模組（整面矩陣排列）
        const panelCount = 7;
        const pLen = (b.d * 0.90) / panelCount;
        for (let pi = 0; pi < panelCount; pi++) {
          const pz = -b.d * 0.45 + (pi + 0.5) * pLen;
          const pvGeo = new THREE.BoxGeometry(b.w * 0.88, 0.1, pLen * 0.88);
          const pv = new THREE.Mesh(pvGeo, this.materials.solarPanel);
          pv.position.set(0, 0.12, pz);
          pv.rotation.x = 0.05;
          pv.castShadow = true;
          solarGroup.add(pv);
        }
        group.add(solarGroup);
      } else if (b.id === "hanyu") {
        // 🏛️ 涵育樓：屋頂完全置中對稱設計（中央白色採光通風天窗＋前後對稱太陽能板）
        const roofCenterGroup = new THREE.Group();
        roofCenterGroup.position.set(0, b.h, 0);

        // 中央置中電梯機房與採光天窗 (X=0, Z=0 完全置中)
        const skylightGeo = new THREE.BoxGeometry(b.w * 0.36, 1.8, b.d * 0.38);
        const skylight = new THREE.Mesh(skylightGeo, this.materials.wallWhite);
        skylight.position.set(0, 0.9, 0);
        skylight.castShadow = true;
        roofCenterGroup.add(skylight);

        // 採光拱頂天幕
        const archGeo = new THREE.CylinderGeometry(b.d * 0.18, b.d * 0.18, b.w * 0.34, 16, 1, false, 0, Math.PI);
        const arch = new THREE.Mesh(archGeo, this.materials.wallCream);
        arch.rotation.z = Math.PI / 2;
        arch.position.set(0, 1.8, 0);
        roofCenterGroup.add(arch);

        // 前後置中對稱鋪設太陽能光電模組板 (X=0 置中)
        for (let side of [-1, 1]) {
          const pvGeo = new THREE.BoxGeometry(b.w * 0.65, 0.15, b.d * 0.22);
          const pv = new THREE.Mesh(pvGeo, this.materials.solarPanel);
          pv.position.set(0, 0.6, side * (b.d * 0.32));
          pv.rotation.x = side * 0.08;
          pv.castShadow = true;
          roofCenterGroup.add(pv);
        }

        group.add(roofCenterGroup);
      } else {
        // 一般校舍（如迎曦樓等）：頂樓電梯機房與太陽能棚架全面 X=0 軸線置中對稱
        const hutGeo = new THREE.BoxGeometry(Math.min(7, b.w * 0.28), 2.2, Math.min(6, b.d * 0.28));
        const hut = new THREE.Mesh(hutGeo, this.materials.wallWhite);
        hut.position.set(0, b.h + 1.2, -b.d * 0.18); // X=0 置中
        hut.castShadow = true;
        group.add(hut);

        if (b.w >= 20) {
          const solarPanelGeo = new THREE.BoxGeometry(b.w * 0.58, 0.18, b.d * 0.42);
          const solarPanel = new THREE.Mesh(solarPanelGeo, this.materials.solarPanel);
          solarPanel.position.set(0, b.h + 0.9, b.d * 0.15); // X=0 置中
          solarPanel.rotation.x = 0.08;
          group.add(solarPanel);
        }
      }

      this.scene.add(group);
    });

    // 依空照圖與實景紅線建立棟際遮雨走廊連通系統
    this.buildCoveredWalkways();
  }

  // --- 校舍棟際遮雨走廊系統（迎曦↔涵育、迎曦↔百齡、校友館↔體育館） ---
  buildCoveredWalkways() {
    const roofMat = this.materials.roofWaveBeige;
    const pillarMat = this.materials.metal;
    const paveMat = this.materials.pave;

    const corridors = [
      // 1. 涵育樓 ↔ 迎曦樓（依實景紅框：直連涵育樓南牆與迎曦樓北端）
      [
        { x: -28, z: -56 },
        { x: -31, z: -37 }
      ],
      // 2. 迎曦樓 ↔ 百齡樓（依實景紅框：由迎曦樓南端垂直直連百齡樓北端）
      [
        { x: -53, z: -15 },
        { x: -53, z: 19 }
      ],
      // 3. 百齡樓 ↔ 體育館（樹人館）（依最新實景紅線：由百齡樓東南角橫向直連體育館西北側）
      [
        { x: -19, z: 56 },
        { x: -5, z: 58 }
      ],
      // 4. 校友館 ↔ 體育館（樹人館）南北向主通廊（串連校友館、圓形司令台與體育館北門）
      [
        { x: 11, z: 10 },
        { x: 11, z: 22 },
        { x: 13, z: 40 },
        { x: 14, z: 58 }
      ]
    ];

    corridors.forEach(path => {
      // 1. 各節段走廊本體
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.hypot(dx, dz);
        const angle = Math.atan2(dx, dz);
        const mx = (p1.x + p2.x) / 2;
        const mz = (p1.z + p2.z) / 2;
        const w = 2.8;

        // 地坪水泥步道（微抬升 0.08m，防止地面 z-fighting）
        const pathGeo = new THREE.BoxGeometry(w, 0.15, len);
        const pathMesh = new THREE.Mesh(pathGeo, paveMat);
        pathMesh.position.set(mx, 0.08, mz);
        pathMesh.rotation.y = angle;
        pathMesh.receiveShadow = true;
        this.scene.add(pathMesh);

        // 遮雨棚頂（高雅淺暖米色波浪頂棚，微弧拱頂增加立體層次）
        const roofGeo = new THREE.BoxGeometry(w + 0.35, 0.22, len + 0.15);
        const roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(mx, 3.25, mz);
        roofMesh.rotation.y = angle;
        roofMesh.castShadow = true;
        this.scene.add(roofMesh);

        // 棚頂中央高光脊樑
        const ridgeGeo = new THREE.BoxGeometry(0.3, 0.1, len + 0.15);
        const ridge = new THREE.Mesh(ridgeGeo, pillarMat);
        ridge.position.set(mx, 3.38, mz);
        ridge.rotation.y = angle;
        this.scene.add(ridge);

        // 金屬結構支撐縱樑（設置於頂棚下方兩側）
        const edgeGeo = new THREE.BoxGeometry(w + 0.1, 0.08, len + 0.1);
        const edgeMesh = new THREE.Mesh(edgeGeo, pillarMat);
        edgeMesh.position.set(mx, 3.12, mz);
        edgeMesh.rotation.y = angle;
        this.scene.add(edgeMesh);

        // 兩側金屬圓柱（間距約 3.5~4 米一根）
        const pillarCount = Math.max(2, Math.floor(len / 3.8));
        for (let k = 0; k <= pillarCount; k++) {
          const t = k / pillarCount;
          const px = p1.x + dx * t;
          const pz = p1.z + dz * t;
          for (let side of [-w / 2 + 0.2, w / 2 - 0.2]) {
            const pillar = new THREE.Mesh(
              new THREE.CylinderGeometry(0.09, 0.09, 3.15, 12),
              pillarMat
            );
            const sx = px + Math.cos(angle) * side;
            const sz = pz - Math.sin(angle) * side;
            pillar.position.set(sx, 1.58, sz);
            pillar.castShadow = true;
            this.scene.add(pillar);
          }
        }
      }

      // 2. 轉角節點平滑覆蓋（防止折角處留有縫隙）
      for (let i = 1; i < path.length - 1; i++) {
        const pt = path[i];
        const cornerRoof = new THREE.Mesh(
          new THREE.CylinderGeometry(1.65, 1.65, 0.24, 16),
          roofMat
        );
        cornerRoof.position.set(pt.x, 3.26, pt.z);
        cornerRoof.castShadow = true;
        this.scene.add(cornerRoof);

        const cornerFloor = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 0.16, 16),
          paveMat
        );
        cornerFloor.position.set(pt.x, 0.08, pt.z);
        cornerFloor.receiveShadow = true;
        this.scene.add(cornerFloor);
      }
    });
  }

  // --- 開放式風雨操場（挑高鋼構柱列、無封閉牆面，內設標準多功能球場） ---
  buildWindRainCourt(group, b) {
    // 1. 多功能球場基座（外緣綠色、中央湛藍壓克力地坪）
    const courtOuterGeo = new THREE.PlaneGeometry(b.w, b.d);
    const courtOuter = new THREE.Mesh(courtOuterGeo, this.materials.courtInner);
    courtOuter.rotation.x = -Math.PI / 2;
    courtOuter.position.y = 0.08;
    courtOuter.receiveShadow = true;
    courtOuter.userData = { ...b };
    group.add(courtOuter);
    this.interactiveObjects.push(courtOuter);

    // 內圈湛藍球場面
    const cw = b.w * 0.88;
    const cd = b.d * 0.84;
    const courtInnerGeo = new THREE.PlaneGeometry(cw, cd);
    const courtInner = new THREE.Mesh(courtInnerGeo, this.materials.track);
    courtInner.rotation.x = -Math.PI / 2;
    courtInner.position.y = 0.085;
    courtInner.receiveShadow = true;
    group.add(courtInner);

    // 2. 白色多功能球場標線（籃球場/排球場）
    const hx = cw / 2;
    const hz = cd / 2;
    const borderPts = [
      new THREE.Vector3(-hx, 0.09, -hz),
      new THREE.Vector3(hx, 0.09, -hz),
      new THREE.Vector3(hx, 0.09, hz),
      new THREE.Vector3(-hx, 0.09, hz),
      new THREE.Vector3(-hx, 0.09, -hz)
    ];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(borderPts), this.materials.lineWhite));

    // 中線
    const midPts = [new THREE.Vector3(0, 0.09, -hz), new THREE.Vector3(0, 0.09, hz)];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(midPts), this.materials.lineWhite));

    // 中央跳球圈
    const centerCirclePts = [];
    for (let a = 0; a <= Math.PI * 2; a += Math.PI / 16) {
      centerCirclePts.push(new THREE.Vector3(Math.cos(a) * 2.2, 0.09, Math.sin(a) * 2.2));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(centerCirclePts), this.materials.lineWhite));

    // 東西兩端籃球禁區、罰球圈與立體籃球架
    for (let sx of [-1, 1]) {
      const keyPts = [
        new THREE.Vector3(sx * hx, 0.09, -3.0),
        new THREE.Vector3(sx * (hx - 5.5), 0.09, -2.4),
        new THREE.Vector3(sx * (hx - 5.5), 0.09, 2.4),
        new THREE.Vector3(sx * hx, 0.09, 3.0)
      ];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(keyPts), this.materials.lineWhite));

      const ftCirclePts = [];
      for (let a = -Math.PI / 2; a <= Math.PI / 2; a += Math.PI / 12) {
        ftCirclePts.push(new THREE.Vector3(sx * (hx - 5.5) - sx * Math.cos(a) * 2.2, 0.09, Math.sin(a) * 2.2));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ftCirclePts), this.materials.lineWhite));

      // 🏀 3D 立體籃球架（立體基座、伸展臂、紅白籃板、橘色籃框）
      const hoopGroup = new THREE.Group();
      hoopGroup.position.set(sx * (hx - 0.6), 0, 0);
      hoopGroup.rotation.y = sx === 1 ? -Math.PI / 2 : Math.PI / 2;

      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.9), this.materials.metal);
      baseMesh.position.set(0, 0.35, -1.2);
      hoopGroup.add(baseMesh);

      const postArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.2, 8), this.materials.metal);
      postArm.position.set(0, 1.9, -0.6);
      postArm.rotation.x = -0.32;
      hoopGroup.add(postArm);

      const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.08), this.materials.wallWhite);
      board.position.set(0, 3.1, 0);
      hoopGroup.add(board);

      const innerBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.09), this.materials.roofRed);
      innerBox.position.set(0, 3.0, 0.01);
      hoopGroup.add(innerBox);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 16), this.materials.bailing_kindergarten);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(0, 2.75, 0.4);
      hoopGroup.add(rim);

      group.add(hoopGroup);
    }

    // 3. 開放式鋼構立柱列（四周完全無牆，視覺通透無阻）
    const pillarH = 8.5; // 開放式挑高淨空
    const archCount = 6;
    const archWidth = b.w / archCount;

    for (let i = 0; i <= archCount; i++) {
      const px = -b.w / 2 + i * archWidth;
      for (let pz of [-b.d / 2 + 0.5, b.d / 2 - 0.5]) {
        const pillarGeo = new THREE.CylinderGeometry(0.24, 0.28, pillarH, 12);
        const pillar = new THREE.Mesh(pillarGeo, this.materials.wallCream);
        pillar.position.set(px, pillarH / 2, pz);
        pillar.castShadow = true;
        group.add(pillar);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.7), this.materials.metal);
        cap.position.set(px, pillarH + 0.15, pz);
        group.add(cap);
      }

      // 橫向鋼桁架（北至南跨越）
      const trussGeo = new THREE.BoxGeometry(0.25, 0.5, b.d - 0.6);
      const truss = new THREE.Mesh(trussGeo, this.materials.metal);
      truss.position.set(px, pillarH + 0.25, 0);
      truss.castShadow = true;
      group.add(truss);
    }

    // 縱向鋼構大樑
    for (let pz of [-b.d / 2 + 0.5, b.d / 2 - 0.5]) {
      const beamGeo = new THREE.BoxGeometry(b.w + 0.8, 0.5, 0.5);
      const beam = new THREE.Mesh(beamGeo, this.materials.metal);
      beam.position.set(0, pillarH + 0.25, pz);
      group.add(beam);
    }

    // 4. 頂部 6 連棟翠綠圓拱波浪頂棚（架於挑高鋼構大樑之上）
    const archRadius = archWidth * 0.52;
    for (let i = 0; i < archCount; i++) {
      const ax = -b.w / 2 + (i + 0.5) * archWidth;
      // 真正的橫跨對稱半圓拱形：角度範圍 [-PI/2, PI/2]，繞 X 軸轉 -PI/2 形成跨寬向上凸起的頂棚
      const archGeo = new THREE.CylinderGeometry(archRadius, archRadius, b.d + 1.2, 24, 1, false, -Math.PI / 2, Math.PI);
      const mat = (i % 2 === 0) ? this.materials.roofWaveGreen : this.materials.roofWaveBeige;
      const archMesh = new THREE.Mesh(archGeo, mat);
      archMesh.rotation.x = -Math.PI / 2;
      archMesh.position.set(ax, pillarH + 0.5, 0);
      archMesh.castShadow = true;
      group.add(archMesh);

      // ☀️ 5. 圓拱頂部現代化太陽能光電板陣列（光電風雨球場綠能棚架）
      const archTopY = pillarH + 0.5 + archRadius;
      
      // (1) 縱向鋁合金導軌支架（每道拱脊兩側各一條）
      for (let railX of [-archWidth * 0.22, archWidth * 0.22]) {
        const railGeo = new THREE.BoxGeometry(0.12, 0.18, b.d + 0.6);
        const rail = new THREE.Mesh(railGeo, this.materials.metal);
        rail.position.set(ax + railX, archTopY + 0.08, 0);
        group.add(rail);
      }

      // (2) 太陽能光電模組板（沿南北向均勻鋪設 8 組，微幅迎光傾角）
      const panelCountZ = 8;
      const panelLenZ = (b.d - 1.2) / panelCountZ;
      const panelW = archWidth * 0.42;

      for (let pzIdx = 0; pzIdx < panelCountZ; pzIdx++) {
        const pz = -b.d / 2 + 1.0 + (pzIdx + 0.5) * panelLenZ;

        // 東西兩側各一片模組，貼合拱弧微傾約 6 度 (0.1 弧度)
        for (let side of [-1, 1]) {
          const px = ax + side * (panelW * 0.54);
          const py = archTopY + 0.16;

          // 太陽能板本體（深藍黑色光電矽晶面）
          const panelMesh = new THREE.Mesh(
            new THREE.BoxGeometry(panelW * 0.94, 0.08, panelLenZ * 0.90),
            this.materials.solarPanel
          );
          panelMesh.position.set(px, py, pz);
          panelMesh.rotation.z = side * -0.11; // 東西微傾洩水角
          panelMesh.castShadow = true;
          group.add(panelMesh);

          // 模組鋁合金邊框外緣
          const frameMesh = new THREE.Mesh(
            new THREE.BoxGeometry(panelW * 0.98, 0.04, panelLenZ * 0.94),
            this.materials.metal
          );
          frameMesh.position.set(px, py - 0.03, pz);
          frameMesh.rotation.z = side * -0.11;
          group.add(frameMesh);
        }
      }
    }

    // 6. 點選判定包覆盒
    const courtTotalH = pillarH + archRadius + 1.8;
    const hitBoxGeo = new THREE.BoxGeometry(b.w, courtTotalH, b.d);
    const hitBox = new THREE.Mesh(hitBoxGeo, new THREE.MeshBasicMaterial({ visible: false }));
    hitBox.position.y = courtTotalH / 2;
    hitBox.userData = { ...b };
    group.add(hitBox);
    this.interactiveObjects.push(hitBox);
  }

  // --- 周邊四面環繞真實道路網絡 ---
  buildRoads() {
    const roadMat = this.materials.road;

    // 1. 東側開羅街／清潭路南段（操場東緣，長 210 米）
    const eastRoadGeo = new THREE.PlaneGeometry(16, 210);
    const eastRoad = new THREE.Mesh(eastRoadGeo, roadMat);
    eastRoad.rotation.x = -Math.PI / 2;
    eastRoad.position.set(96, 0.03, 35);
    eastRoad.receiveShadow = true;
    this.scene.add(eastRoad);

    // 2. 南側南昌街（體育館南緣，長 240 米）
    const southRoadGeo = new THREE.PlaneGeometry(240, 16);
    const southRoad = new THREE.Mesh(southRoadGeo, roadMat);
    southRoad.rotation.x = -Math.PI / 2;
    southRoad.position.set(10, 0.03, 96);
    southRoad.receiveShadow = true;
    this.scene.add(southRoad);

    // 3. 西側民族路段（長 90 米，筆直貼齊西側校界）
    const westRoadGeo = new THREE.PlaneGeometry(16, 90);
    const westRoad = new THREE.Mesh(westRoadGeo, roadMat);
    westRoad.rotation.x = -Math.PI / 2;
    westRoad.position.set(-95, 0.03, 25);
    westRoad.receiveShadow = true;
    this.scene.add(westRoad);
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
      { x1: -25, z1: -88, x2: 1, z2: -74 },
      // [留設清潭路新大門開口: 1,-74 至 15,-66]
      { x1: 15, z1: -66, x2: 61, z2: -20 },
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
      // 西界民族路／清潭路西段（紅線斜向段）
      { x1: -65, z1: -59, x2: -57, z2: -72 },
      { x1: -57, z1: -72, x2: -46.8, z2: -78.8 },
      // [留設白兔門開口: -46.8,-78.8 至 -40.2,-83.2，依紅線朝向清潭路]
      { x1: -40.2, z1: -83.2, x2: -39, z2: -84 }
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

    // 1. 操場西側與中庭綠帶樹群（避開司令台 X:22~30, Z:24~44 與圓形涼亭）
    for (let z of [-2, 9, 20, 52, 64]) {
      treePositions.push({ x: 26, z, scale: 1.25 + (z % 2) * 0.1 });
    }

    // 2. 操場東緣開羅街圍籬林蔭
    for (let z = 0; z <= 70; z += 14) {
      treePositions.push({ x: 80, z, scale: 1.15 });
    }

    // 3. 操場北側綠草坪樹群（置於草坪內側，避開北側圍牆與轉角，絕不穿透圍欄）
    for (let x of [38, 48]) {
      treePositions.push({ x, z: -12, scale: 1.15 });
    }

    // 4. 西界清潭路西段與迎曦樓西側林蔭道
    for (let z = -50; z <= 35; z += 12) {
      treePositions.push({ x: -75, z, scale: 1.2 + (z % 3) * 0.08 });
    }

    // 5. 百齡樓與迎曦樓迎風中庭花園造景樹（移除原穿透走廊之 Z:-35 樹木）
    treePositions.push({ x: -36, z: -20, scale: 1.4 });
    treePositions.push({ x: -36, z: -5, scale: 1.3 });
    treePositions.push({ x: -34, z: 8, scale: 1.25 });

    // 6. 南界南昌街圍籬綠帶（避開科學館 X:-31~-19 與企鵝門 X:-15~-5）
    for (let x of [-48, -38, -17, 2]) {
      treePositions.push({ x, z: 82, scale: 1.1 });
    }

    // 校門、遮雨走廊與圍牆淨空防護（嚴格禁止長樹與穿透結構）
    const gates = BUILDINGS.filter(b => b.category === "gate");
    const walkwaySegments = [
      [{ x: -28, z: -56 }, { x: -31, z: -37 }],
      [{ x: -53, z: -15 }, { x: -53, z: 19 }],
      [{ x: -19, z: 56 }, { x: -5, z: 58 }],
      [{ x: 11, z: 10 }, { x: 11, z: 22 }],
      [{ x: 11, z: 22 }, { x: 13, z: 40 }],
      [{ x: 13, z: 40 }, { x: 14, z: 58 }]
    ];

    const fenceAvoidance = [
      { x1: 15, z1: -66, x2: 61, z2: -20 },
      { x1: 61, z1: -20, x2: 81, z2: -14 },
      { x1: 81, z1: -14, x2: 86, z2: 79 },
      { x1: -74, z1: -54, x2: -39, z2: -84 },
      { x1: -39, z1: -84, x2: 15, z2: -66 }
    ];

    function distToSegment(px, pz, ax, az, bx, bz) {
      const l2 = (bx - ax) * (bx - ax) + (bz - az) * (bz - az);
      if (l2 === 0) return Math.hypot(px - ax, pz - az);
      let t = ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (ax + t * (bx - ax)), pz - (az + t * (bz - az)));
    }

    const safeTrees = treePositions.filter(pos => {
      // 1. 避開所有校門口
      for (let g of gates) {
        const threshold = (g.w / 2) + 3.0;
        if (Math.hypot(pos.x - g.x, pos.z - g.z) < threshold) return false;
      }
      // 2. 避開所有棟際走廊路段（寬度 2.4 米，保留 2.8 米淨空距離）
      for (let seg of walkwaySegments) {
        if (distToSegment(pos.x, pos.z, seg[0].x, seg[0].z, seg[1].x, seg[1].z) < 2.8) {
          return false;
        }
      }
      // 3. 避開外圍圍牆（圍牆 3.2 米內嚴格禁止長樹，杜絕穿透圍欄）
      for (let f of fenceAvoidance) {
        if (distToSegment(pos.x, pos.z, f.x1, f.z1, f.x2, f.z2) < 3.2) {
          return false;
        }
      }
      return true;
    });

    safeTrees.forEach((pos, idx) => {
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
