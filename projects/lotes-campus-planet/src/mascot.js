// 羅東國小吉祥物：Q版大頭娃娃（比照基隆小行星 Canvas UV 貼圖臉蛋 + 2.5頭身萌系比例）
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.module.js';

// Canvas 動態繪製 Q 版超萌大眼臉蛋
function createCuteFaceTexture(type = 'luodong') {
  const isLuoDong = (type === 'luodong');
  const W = 512, H = 256;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');

  // 底色：溫暖萌白膚色
  const skin = '#ffe0b2';
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, W, H);

  // 正面中心 U 座標為 0.25 (即 x = 128)
  const cx = W * 0.25;

  // 1. 水汪汪萌系大黑眼（放大尺寸，帶高光亮點）
  const eyeColor = isLuoDong ? '#2a1a10' : '#331a00';
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 36;
    const ey = H * 0.54;

    // 眼白
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 20, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // 大眼珠
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 漫畫大高光 (主亮點)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex - 5, ey - 7, 7, 0, Math.PI * 2);
    ctx.fill();

    // 漫畫小高光 (副亮點)
    ctx.beginPath();
    ctx.arc(ex + 5, ey + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 蘿絲俏麗長睫毛
    if (!isLuoDong) {
      ctx.strokeStyle = '#221100';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex + sx * 12, ey - 18);
      ctx.lineTo(ex + sx * 22, ey - 26);
      ctx.stroke();
    }
  }

  // 2. 圓滾滾紅通通大腮紅
  ctx.fillStyle = isLuoDong ? '#ff6b81' : '#ff477e';
  ctx.globalAlpha = 0.85;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + sx * 62, H * 0.68, 22, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // 3. 彎彎親切微笑小嘴
  ctx.strokeStyle = '#8a3324';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, H * 0.69, 10, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // 4. 可愛小眉毛
  ctx.strokeStyle = isLuoDong ? '#5c1d0f' : '#4a2500';
  ctx.lineWidth = 4.5;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + sx * 36, H * 0.38, 14, 1.2 * Math.PI, 1.8 * Math.PI);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(cv);
  texture.needsUpdate = true;
  return texture;
}

export class MascotPlayer {
  constructor(scene, type = 'luodong') {
    this.scene = scene;
    this.type = type; // 'luodong' 或 'rose'
    this.group = new THREE.Group();
    this.group.name = 'player-mascot';

    this.walkCycle = 0;
    this.isMoving = false;

    this.buildCharacter();
    this.scene.add(this.group);
  }

  buildCharacter() {
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }

    const isLuoDong = (this.type === 'luodong');

    // 色彩常數
    const cSkin = '#ffe0b2';
    const cHair = isLuoDong ? '#7a1c14' : '#4d2600';
    const cShirt = isLuoDong ? '#00b0ff' : '#ff6584';
    const cPants = isLuoDong ? '#1544c7' : '#94294b';
    const cShoes = '#ffffff';

    const toon = (color, opt = {}) => new THREE.MeshToonMaterial({ color, ...opt });

    // 整體浮動搖擺根節點
    this.bob = new THREE.Group();
    this.group.add(this.bob);

    // ───────── 1. 超萌大頭 (半徑 0.52，佔全身體積近半，Q版精髓) ─────────
    this.head = new THREE.Group();
    this.head.position.y = 1.35;

    // 臉龐球體（材質設為白色，貼圖才能 100% 呈現膚色、大眼與腮紅）
    const faceTex = createCuteFaceTexture(this.type);
    const faceGeo = new THREE.SphereGeometry(0.52, 32, 24);
    const faceMesh = new THREE.Mesh(faceGeo, toon('#ffffff', { map: faceTex }));
    faceMesh.castShadow = true;
    this.head.add(faceMesh);

    // 可愛立體髮型與超萌帽子
    if (isLuoDong) {
      // 羅小東後腦勺圓潤短髮
      const hairGeo = new THREE.SphereGeometry(0.54, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.45);
      hairGeo.rotateX(-0.65);
      const hairMesh = new THREE.Mesh(hairGeo, toon(cHair, { side: THREE.DoubleSide }));
      hairMesh.position.set(0, 0.05, -0.06);
      hairMesh.castShadow = true;
      this.head.add(hairMesh);

      // 帥氣校園活力棒球帽 (微往後戴，露出水汪汪動漫大眼)
      const capColor = '#0055ff'; // 亮藍色棒球帽
      const capBrimColor = '#ffb300'; // 活潑黃色帽沿

      // 1. 帽子圓頂帽身 (反戴半球)
      const capGeo = new THREE.SphereGeometry(0.56, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.46);
      capGeo.rotateX(-0.55);
      const capMesh = new THREE.Mesh(capGeo, toon(capColor, { side: THREE.DoubleSide }));
      capMesh.position.set(0, 0.08, -0.04);
      capMesh.castShadow = true;
      this.head.add(capMesh);

      // 2. 俏皮鴨舌帽沿 (往斜前方伸出，不會擋到眼睛)
      const brimMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.035, 0.28), toon(capBrimColor));
      brimMesh.position.set(0, 0.38, 0.42);
      brimMesh.rotation.x = -0.32;
      brimMesh.castShadow = true;
      this.head.add(brimMesh);

      // 3. 帽頂小圓球扣
      const capButton = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), toon(capBrimColor));
      capButton.position.set(0, 0.62, -0.02);
      this.head.add(capButton);

      // 帽簷下方露出的可愛小瀏海
      const bang1 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 8), toon(cHair));
      bang1.position.set(0.06, 0.30, 0.42);
      bang1.rotation.set(0.7, 0, -0.2);
      const bang2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 8), toon(cHair));
      bang2.position.set(-0.12, 0.28, 0.40);
      bang2.rotation.set(0.65, 0, 0.25);
      this.head.add(bang1, bang2);
    } else {
      // 蘿絲甜美氣質遮陽草帽（帶草莓粉飾帶與玫瑰花）
      const strawColor = '#ffe082'; // 暖黃草編遮陽帽
      const ribbonColor = '#ff2a55'; // 桃紅緞帶

      // 1. 帽子平頂圓冠
      const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.28, 24), toon(strawColor));
      hatCrown.position.set(0, 0.52, -0.05);
      hatCrown.rotation.x = -0.15;
      hatCrown.castShadow = true;
      this.head.add(hatCrown);

      // 2. 寬帽沿 (微波浪遮陽圓盤)
      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.03, 32), toon(strawColor));
      hatBrim.position.set(0, 0.40, -0.03);
      hatBrim.rotation.x = -0.15;
      hatBrim.castShadow = true;
      this.head.add(hatBrim);

      // 3. 甜美緞帶環飾
      const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.45, 0.08, 24), toon(ribbonColor));
      ribbon.position.set(0, 0.43, -0.04);
      ribbon.rotation.x = -0.15;
      this.head.add(ribbon);

      // 4. 帽側立體玫瑰花
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14), toon('#ff1744'));
      flower.position.set(-0.48, 0.44, 0.06);
      this.head.add(flower);

      // 帽子兩側自然露出的深褐小雙馬尾
      for (const sx of [-1, 1]) {
        const bun = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), toon(cHair));
        bun.position.set(sx * 0.54, 0.16, -0.05);
        this.head.add(bun);
      }
    }

    this.bob.add(this.head);

    // ───────── 2. 圓滾滾小身軀 (圓柱上衣) ─────────
    this.torso = new THREE.Group();
    this.torso.position.y = 0.78;

    const bodyGeo = new THREE.CylinderGeometry(0.24, 0.34, 0.52, 20);
    const bodyMesh = new THREE.Mesh(bodyGeo, toon(cShirt));
    bodyMesh.castShadow = true;
    this.torso.add(bodyMesh);

    // 胸前立體小白鈕扣/校徽小太陽
    const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), toon('#ffffff'));
    badge.rotation.x = Math.PI / 2;
    badge.position.set(0, 0.04, 0.3);
    this.torso.add(badge);

    // 下擺短褲/百褶小短裙
    if (isLuoDong) {
      const pants = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.35, 0.22, 20), toon(cPants));
      pants.position.y = -0.32;
      pants.castShadow = true;
      this.torso.add(pants);
    } else {
      const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.32, 20), toon(cPants));
      skirt.position.y = -0.34;
      skirt.castShadow = true;
      this.torso.add(skirt);
    }

    // 萌系小手臂 (短小微彎，帶小圓手)
    this.arms = [];
    for (const sx of [-1, 1]) {
      const armGroup = new THREE.Group();
      armGroup.position.set(sx * 0.33, 0.15, 0);
      armGroup.rotation.z = sx * 0.18;

      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12), toon(cShirt));
      sleeve.position.y = -0.08;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), toon(cSkin));
      hand.position.y = -0.22;

      armGroup.add(sleeve, hand);
      this.torso.add(armGroup);
      this.arms.push(armGroup);
    }

    this.bob.add(this.torso);

    // ───────── 3. 萌萌小短腿與白球鞋 ─────────
    this.legs = [];
    for (const sx of [-1, 1]) {
      const legGroup = new THREE.Group();
      legGroup.position.set(sx * 0.15, 0.42, 0);

      // 小短腿
      const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.32, 12), toon(cSkin));
      legMesh.position.y = -0.16;
      legMesh.castShadow = true;

      // 圓滾滾白布鞋
      const shoeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.26), toon(cShoes));
      shoeMesh.position.set(0, -0.34, 0.05);
      shoeMesh.castShadow = true;

      legGroup.add(legMesh, shoeMesh);
      this.bob.add(legGroup);
      this.legs.push(legGroup);
    }

    // ───────── 4. 頭頂名牌（圓角貼紙風格） ─────────
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 256;
    tagCanvas.height = 96;
    const ctx = tagCanvas.getContext('2d');
    ctx.fillStyle = isLuoDong ? '#00b0ff' : '#ff477e';
    ctx.beginPath();
    ctx.roundRect(14, 14, 228, 68, 26);
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#2b3133';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "LXGW WenKai TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isLuoDong ? '羅小東' : '蘿絲', 128, 48);

    const tagTex = new THREE.CanvasTexture(tagCanvas);
    tagTex.needsUpdate = true;
    const tagSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex }));
    tagSprite.scale.set(1.5, 0.58, 1);
    tagSprite.position.set(0, 2.2, 0);
    this.bob.add(tagSprite);

    // 整體比例適配校園地面
    this.group.scale.set(1.3, 1.3, 1.3);
  }

  switchCharacter(type) {
    this.type = type;
    this.buildCharacter();
  }

  update(deltaTime, isMoving) {
    this.isMoving = isMoving;
    if (isMoving) {
      this.walkCycle += deltaTime * 10.0;
      const swing = Math.sin(this.walkCycle) * 0.6;

      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.arms[0].rotation.x = -swing * 0.75;
      this.arms[1].rotation.x = swing * 0.75;

      // 蹦蹦跳跳輕快感
      this.bob.position.y = Math.abs(Math.sin(this.walkCycle * 2)) * 0.08;
      this.head.rotation.z = Math.sin(this.walkCycle) * 0.08;
    } else {
      // 待機輕微呼吸律動
      this.walkCycle += deltaTime * 2.5;
      this.legs[0].rotation.x *= 0.8;
      this.legs[1].rotation.x *= 0.8;
      this.arms[0].rotation.x *= 0.8;
      this.arms[1].rotation.x *= 0.8;
      this.bob.position.y = Math.sin(this.walkCycle) * 0.02;
      this.head.rotation.z = 0;
    }
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  setRotationY(angle) {
    this.group.rotation.y = angle;
  }
}
