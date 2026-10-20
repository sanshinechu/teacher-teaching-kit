// 羅東國小 115 學年度校舍、設施與特色動物校門 3D 空間資料
// 依據 Google 衛星空照真實形狀與方位精確校正：
// - 東南象限：標準 200M 湛藍色 PU 操場、內圈跳球區球場、西側司令台
// - 南界（南昌街）：大型挑高雙斜坡光電屋頂「樹人館（體育館）」、科學館、南昌街企鵝門
// - 西南側：百齡樓附設幼兒園、中央廚房、教職員停車場、開元市場側門
// - 中央核心：百齡樓綠色波浪圓拱綜合大樓、百齡樓東側高年級教室棟、圓形戶外展演涼亭、迎風中庭
// - 西界（清潭路西段／民族路）：迎曦樓北棟、迎曦樓南棟、孔雀門、民族路門牌1號歷史大門
// - 北界（斜向清潭路）：涵育樓、校友館、新大門迎賓停車廣場、新大門＋警衛室、白兔門、無尾熊門

export const CAMPUS_BOUNDS = {
  minX: -95,
  maxX: 95,
  minZ: -95,
  maxZ: 95
};

export const BUILDINGS = [
  // --- 核心教學與行政校舍（依真實空照方位與建築特徵對齊） ---
  {
    id: "hanyu",
    name: "涵育樓",
    category: "teaching",
    categoryName: "教學行政",
    x: -4,
    z: -66,
    y: 0,
    w: 32,
    d: 16,
    h: 17,
    floors: 4,
    rotationY: -0.56, // -32度，完美契合清潭路走向
    color: "#649479",
    roofColor: "#3d7355",
    description: "地上 4 層、地下 1 層。1F 設有教務處與圖書館，2F 為一年級教室與輔導處，4F 為現代化電腦教室與本土教室，B1 為桌球室。正面朝向清潭路迎賓停車廣場。",
    tags: ["教務處", "輔導處", "圖書館", "電腦教室", "一年級"]
  },
  {
    id: "xiaoyou",
    name: "校友館",
    category: "admin",
    categoryName: "行政核心",
    x: -32,
    z: -70,
    y: 0,
    w: 24,
    d: 18,
    h: 13.5,
    floors: 3,
    rotationY: -0.56,
    color: "#cc9847",
    roofColor: "#7d1d12",
    description: "地上 3 層。1F 為學務處、教師辦公室與表演藝術教室；2F 為校長室與百年校史室；3F 為創意發想中心，頂部設有古典紅瓦鐘樓造型。",
    tags: ["學務處", "校長室", "校史室", "創意發想中心", "表演藝術教室"]
  },
  {
    id: "yingxi_north",
    name: "迎曦樓（北棟）",
    category: "teaching",
    categoryName: "班級教學",
    x: -58,
    z: -45,
    y: 0,
    w: 18,
    d: 38,
    h: 16.5,
    floors: 4,
    rotationY: -0.26, // -15度微傾斜，貼合格局
    color: "#aa8c61",
    roofColor: "#47728f",
    description: "地上 4 層。1F 為潛力與知動教室，2F 為二年級班級，3F~4F 為三年級教室（三忠、三孝、三仁、三愛、三信）。",
    tags: ["二年級", "三年級", "潛力教室", "知動教室"]
  },
  {
    id: "yingxi_south",
    name: "迎曦樓（南棟）",
    category: "teaching",
    categoryName: "班級教學",
    x: -61,
    z: -18,
    y: 0,
    w: 18,
    d: 38,
    h: 16.5,
    floors: 4,
    rotationY: 0,
    color: "#aa8c61",
    roofColor: "#47728f",
    description: "地上 4 層。1F 設有四年級教室，2F 為二年級班級，3F 設有原民大學與社會教室，4F 為自然科專科教室。",
    tags: ["四年級", "二年級", "原民大學", "自然教室"]
  },
  {
    id: "bailing_wave",
    name: "百齡樓（迎風綠波浪大樓）",
    category: "teaching",
    categoryName: "綜合教學",
    x: -23,
    z: -5,
    y: 0,
    w: 29,
    d: 20,
    h: 16,
    floors: 4,
    rotationY: 0,
    color: "#876d54",
    roofColor: "#2a7345",
    description: "校園正中央最醒目的地標建築，頂部擁有 6 連棟翠綠圓拱波浪造型屋頂，兼具美感與通風，設有中高年級多功能教室與展示廊道。",
    tags: ["波浪綠屋頂", "中庭地標", "多功能教室"]
  },
  {
    id: "bailing_main",
    name: "百齡樓（高年級教學棟）",
    category: "teaching",
    categoryName: "綜合教學",
    x: -5,
    z: 13,
    y: 0,
    w: 18,
    d: 42,
    h: 17,
    floors: 4,
    rotationY: -0.15,
    color: "#876d54",
    roofColor: "#1b2126",
    description: "量體大氣的主要校舍，屋頂鋪設現代化深色太陽能光電板。1F 為總務處、人事會計與健康中心；2F~3F 為五、六年級教室；4F 為音樂教室、弦樂團練習室與雙語情境教室。",
    tags: ["總務處", "健康中心", "音樂教室", "弦樂團", "雙語情境教室", "高年級教室"]
  },
  {
    id: "bailing_kindergarten",
    name: "百齡樓幼兒園與中央廚房",
    category: "life",
    categoryName: "幼教生活",
    x: -32,
    z: 48,
    y: 0,
    w: 32,
    d: 24,
    h: 9,
    floors: 2,
    rotationY: 0,
    color: "#e69a24",
    roofColor: "#7d1d12",
    description: "附設幼兒園專區（幼兒班、彩虹班、太陽班），後棟為全校中央廚房，每日供應營養午餐。西臨教職員停車場，南通企鵝門。",
    tags: ["附設幼兒園", "中央廚房", "會議室", "午餐中心"]
  },
  {
    id: "gymnasium",
    name: "體育館（樹人館）",
    category: "sports",
    categoryName: "運動展演",
    x: 13,
    z: 71,
    y: 0,
    w: 40,
    d: 28,
    h: 14,
    floors: 2,
    rotationY: -0.12,
    color: "#4f8562",
    roofColor: "#101924",
    description: "學校歷史悠久的「樹人館」大型挑高體育館，設有室內綜合球場、羽球場與大型舞台，雙斜坡大跨度鋼構屋頂北坡全面鋪設太陽能板，南臨南昌街，東接 200M 操場。",
    tags: ["室內球場", "活動中心", "樹人館", "太陽能屋頂", "體育展演"]
  },
  {
    id: "science",
    name: "科學館",
    category: "teaching",
    categoryName: "專科探索",
    x: -22,
    z: 72,
    y: 0,
    w: 22,
    d: 22,
    h: 11,
    floors: 3,
    rotationY: 0,
    color: "#416d8a",
    roofColor: "#1b2126",
    description: "專科探索基地，設有多功能大視聽教室、自然實驗教室與頂樓天文台圓頂，坐落於體育館西側綠地，鄰近企鵝門。",
    tags: ["視聽教室", "自然實驗室", "天文台", "科展探索"]
  },
  {
    id: "guard_room",
    name: "清潭路新大門警衛室",
    category: "service",
    categoryName: "門禁安全",
    x: 13,
    z: -58,
    y: 0,
    w: 8,
    d: 6,
    h: 4.2,
    floors: 1,
    rotationY: -0.56,
    color: "#dfd2bb",
    roofColor: "#1b2126",
    description: "守衛校園安全第一線，位於清潭路新大門西側，嚴密管控車輛與訪客進出。",
    tags: ["警衛室", "新大門", "安全守護"]
  },

  // --- 操場、中庭、景觀設施與停車廣場 ---
  {
    id: "track_field",
    name: "200M PU操場與多功能球場",
    category: "sports",
    categoryName: "戶外運動",
    x: 54,
    z: 34,
    y: 0.1,
    w: 48,
    d: 86,
    h: 0.2,
    description: "真實空照規格之標準 200 公尺湛藍色 PU 跑道操場，長軸呈南北向，位於校園東南開闊區；內圈為多功能排球與籃球場，西側直道外緣設有司令台。",
    tags: ["湛藍PU跑道", "司令台", "籃球場", "排球場"]
  },
  {
    id: "circular_pavilion",
    name: "迎風圓形展演涼亭",
    category: "landscape",
    categoryName: "景觀綠帶",
    x: 23,
    z: 38,
    y: 0.1,
    w: 13,
    d: 13,
    h: 5.5,
    description: "位於操場與百齡樓綠帶間的圓形遮陽涼亭與戶外展演台，空照可見醒目的紅白同心環條紋屋頂，是學童課後休閒與表演的最佳去處。",
    tags: ["圓形展演亭", "戶外舞台", "景觀地標"]
  },
  {
    id: "courtyard",
    name: "迎曦百齡迎風中庭花園",
    category: "landscape",
    categoryName: "景觀綠帶",
    x: -36,
    z: -20,
    y: 0.1,
    w: 24,
    d: 50,
    h: 0.15,
    description: "由迎曦樓、涵育樓與百齡樓環抱之綠意中庭，設有生態植栽、風雨連通走廊與休閒座椅。",
    tags: ["風雨走廊", "中庭花園", "生態綠帶"]
  },
  {
    id: "parking_north",
    name: "清潭路新大門迎賓停車廣場",
    category: "service",
    categoryName: "校園動線",
    x: 18,
    z: -54,
    y: 0.08,
    w: 22,
    d: 18,
    h: 0.05,
    description: "位於涵育樓前庭東北開闊區，面臨清潭路新大門，供來賓與公務車輛停放。",
    tags: ["迎賓廣場", "新大門停車場"]
  },
  {
    id: "parking_southwest",
    name: "西南教職員停車場",
    category: "service",
    categoryName: "校園動線",
    x: -62,
    z: 52,
    y: 0.08,
    w: 24,
    d: 22,
    h: 0.05,
    description: "鄰近幼兒園與中央廚房的教職員專用停車場，設有通暢進出車道與綠蔭造景。",
    tags: ["教職員停車場", "停車空間"]
  },

  // --- 羅東國小全校校門（精確嵌入真實多邊形圍籬線段上） ---
  {
    id: "gate_new",
    name: "清潭路新大門（正門）",
    category: "gate",
    categoryName: "校園大門",
    x: 22,
    z: -62, // 嵌於北側清潭路斜向圍籬上
    y: 0,
    w: 16,
    d: 3,
    h: 5.5,
    rotationY: -0.56,
    description: "羅東國小主要車輛與師生進出之新正門，面臨清潭路，緊鄰警衛室與迎賓停車廣場。",
    tags: ["新大門", "正門", "清潭路"]
  },
  {
    id: "gate_rabbit",
    name: "白兔門",
    category: "gate",
    categoryName: "特色校門",
    x: -15,
    z: -80, // 清潭路北段圍籬
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    rotationY: -0.56,
    description: "位於北側清潭路上，直通校友館與涵育樓後方，門頂雕刻可愛小白兔立體塑像。",
    tags: ["白兔門", "清潭路"]
  },
  {
    id: "gate_koala",
    name: "無尾熊門",
    category: "gate",
    categoryName: "特色校門",
    x: 45,
    z: -25, // 清潭路轉角、操場北緣
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    rotationY: -1.0,
    description: "位於清潭路東轉向操場北緣轉角處，門頂設有可愛無尾熊立體雕塑。",
    tags: ["無尾熊門", "開羅街"]
  },
  {
    id: "gate_dolphin",
    name: "海豚門",
    category: "gate",
    categoryName: "特色校門",
    x: 83,
    z: 20, // 東界操場東緣圍籬線上
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    rotationY: 1.57,
    description: "位於操場東側開羅街旁，門頂有流線型躍水海豚雕塑，是操場晨運與學童進出的主要側門。",
    tags: ["海豚門", "操場側門"]
  },
  {
    id: "gate_dinosaur",
    name: "恐龍門",
    category: "gate",
    categoryName: "特色校門",
    x: 84,
    z: 68, // 東界開羅街圍籬線上（鄰近體育館東側）
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    rotationY: 1.57,
    description: "位於東界開羅街南端，鄰近樹人館體育館東側，門頂有暴龍立體雕塑。",
    tags: ["恐龍門", "開羅街", "體育館東側"]
  },
  {
    id: "gate_penguin",
    name: "企鵝門",
    category: "gate",
    categoryName: "特色校門",
    x: -10,
    z: 86, // 南界南昌街圍籬線上
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    rotationY: 0,
    description: "位於校園南界南昌街上，鄰近科學館與中央廚房通道，門頂有黑白企鵝雕塑。",
    tags: ["企鵝門", "廚房通道", "南昌街"]
  },
  {
    id: "gate_market",
    name: "開元市場側門",
    category: "gate",
    categoryName: "特色校門",
    x: -75,
    z: 55, // 西南界開元市場方向
    y: 0,
    w: 8,
    d: 3,
    h: 4.0,
    rotationY: -0.6,
    description: "鄰近開元市場與民族路南側生活圈，方便周邊學童與家長穿梭接送。",
    tags: ["開元市場側門", "民族路南端"]
  },
  {
    id: "gate_peacock",
    name: "孔雀門",
    category: "gate",
    categoryName: "特色校門",
    x: -84,
    z: 5, // 西界清潭路西段圍籬線上
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    rotationY: -1.57,
    description: "位於西側弧形圍籬上的動物意象校門，門頂有開屏孔雀立體造型。",
    tags: ["孔雀門", "清潭路西段"]
  },
  {
    id: "gate_minzu",
    name: "民族路歷史校門（門牌1號）",
    category: "gate",
    categoryName: "校園大門",
    x: -70,
    z: -55, // 西北界民族路圍籬線上
    y: 0,
    w: 12,
    d: 3,
    h: 5.0,
    rotationY: -1.1,
    description: "羅東國小建校百年歷史正門（民族路 1 號），現為學童步行與歷史紀念側門。",
    tags: ["民族路大門", "民族路1號", "百年門牌"]
  }
];

export const TOUR_STATIONS = [
  "gate_new",             // 1. 清潭路新大門
  "guard_room",           // 2. 警衛室
  "hanyu",                // 3. 涵育樓 (教務/輔導/圖書館/電腦教室)
  "xiaoyou",              // 4. 校友館 (學務/校長室/創意發想)
  "courtyard",            // 5. 迎風中庭花園
  "yingxi_north",         // 6. 迎曦樓 (二三年級教室)
  "bailing_wave",         // 7. 百齡樓（迎風綠波浪大樓）
  "bailing_main",         // 8. 百齡樓（高年級教室/音樂/雙語教室）
  "bailing_kindergarten", // 9. 附設幼兒園與中央廚房
  "science",              // 10. 科學館 (視聽/自然實驗)
  "gymnasium",            // 11. 體育館（樹人館）
  "track_field",          // 12. 200M 湛藍 PU 操場
  "circular_pavilion",    // 13. 迎風圓形展演涼亭
  "gate_rabbit",          // 14. 清潭路白兔門
  "gate_peacock"          // 15. 孔雀門
];
