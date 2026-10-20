// 羅東國小 115 學年度校舍、設施與特色動物校門 3D 空間資料
// 依據 Google 地圖與校史最新實地考證校正：
// - 北側（清潭路）：設有【新大門＋警衛室】、【白兔門】、【無尾熊門】（接開羅街）
// - 西側（民族路）：設有【民族路歷史側門（門牌1號）】、【孔雀門】、【開元市場側門】
// - 東側（操場東緣）：設有【海豚門】
// - 南側（南昌街）：設有【恐龍門】、【企鵝門】

export const CAMPUS_BOUNDS = {
  minX: -140,
  maxX: 140,
  minZ: -120,
  maxZ: 130
};

export const BUILDINGS = [
  // --- 核心教學與行政校舍 ---
  {
    id: "hanyu",
    name: "涵育樓",
    category: "teaching",
    categoryName: "教學行政",
    x: -55,
    z: -40,
    y: 0,
    w: 52,
    d: 22,
    h: 17,
    floors: 4,
    color: "#649479",
    roofColor: "#3d7355",
    description: "地上 4 層、地下 1 層。1F 設有教務處與圖書館，2F 為一年級班級教室與輔導處，4F 為現代化電腦教室與本土教室，B1 為桌球室與回收室。",
    tags: ["教務處", "輔導處", "圖書館", "電腦教室", "一年級"]
  },
  {
    id: "xiaoyou",
    name: "校友館",
    category: "admin",
    categoryName: "行政核心",
    x: -10,
    z: -18,
    y: 0,
    w: 36,
    d: 18,
    h: 13.5,
    floors: 3,
    color: "#cc9847",
    roofColor: "#7d1d12",
    description: "地上 3 層。1F 為學務處與教師辦公室、表演藝術教室；2F 為校長室與校史室；3F 為創意發想中心，是學校教學研發核心。",
    tags: ["學務處", "校長室", "校史室", "創意發想中心", "表演藝術教室"]
  },
  {
    id: "yingxi_north",
    name: "迎曦樓（北側）",
    category: "teaching",
    categoryName: "班級教學",
    x: -60,
    z: 5,
    y: 0,
    w: 22,
    d: 40,
    h: 16.5,
    floors: 4,
    color: "#aa8c61",
    roofColor: "#47728f",
    description: "地上 4 層。1F 為潛力與知動教室，2F 為二年級（二信、二愛、二仁），3F~4F 為三年級班級教室（三忠、三孝、三仁、三愛、三信）。",
    tags: ["二年級", "三年級", "潛力教室", "知動教室"]
  },
  {
    id: "yingxi_south",
    name: "迎曦樓（南側）",
    category: "teaching",
    categoryName: "班級教學",
    x: -34,
    z: 12,
    y: 0,
    w: 20,
    d: 36,
    h: 16.5,
    floors: 4,
    color: "#aa8c61",
    roofColor: "#47728f",
    description: "地上 4 層。1F 設有四年級教室，2F 為二年級（二孝、二忠），3F 設有原住民族大學與社會教室，4F 為自然科專科教室。",
    tags: ["四年級", "二年級", "原民大學", "自然教室"]
  },
  {
    id: "bailing_main",
    name: "百齡樓",
    category: "teaching",
    categoryName: "綜合教學",
    x: 12,
    z: 18,
    y: 0,
    w: 24,
    d: 58,
    h: 17,
    floors: 4,
    color: "#876d54",
    roofColor: "#1b2126",
    description: "學校量體最大的主要校舍。1F 設有總務處、會計、人事室與健康中心；2F~3F 為四、五、六年級主要教室；4F 設有音樂教室、弦樂團練習室與雙語情境教室。",
    tags: ["總務處", "健康中心", "音樂教室", "弦樂團", "雙語情境教室", "高年級教室"]
  },
  {
    id: "bailing_kindergarten",
    name: "百齡樓幼兒園與廚房",
    category: "life",
    categoryName: "幼教生活",
    x: 10,
    z: 56,
    y: 0,
    w: 20,
    d: 26,
    h: 8.5,
    floors: 2,
    color: "#e69a24",
    roofColor: "#7d1d12",
    description: "附設幼兒園專區（幼兒班、彩虹班、太陽班）與會議室，後棟為現代化標準校園中央廚房，供應全校營養午餐。",
    tags: ["附設幼兒園", "學校廚房", "會議室", "午餐中心"]
  },
  {
    id: "gymnasium",
    name: "體育館（樹人館）",
    category: "sports",
    categoryName: "運動展演",
    x: 62,
    z: -30,
    y: 0,
    w: 32,
    d: 30,
    h: 14,
    floors: 2,
    color: "#4f8562",
    roofColor: "#134226",
    description: "名為「樹人館」的挑高大型體育活動中心，設有室內綜合球場、羽球場與大型舞台，是全校雨天體育活動、畢業典禮與集會展演空間。",
    tags: ["室內球場", "活動中心", "樹人館", "體育展演"]
  },
  {
    id: "science",
    name: "科學館",
    category: "teaching",
    categoryName: "專科探索",
    x: 64,
    z: 8,
    y: 0,
    w: 26,
    d: 22,
    h: 11,
    floors: 3,
    color: "#416d8a",
    roofColor: "#1b2126",
    description: "專科教學核心，設有多功能大視聽教室、自然實驗專科教室與科展實驗室。",
    tags: ["視聽教室", "自然實驗室", "科展探索"]
  },
  {
    id: "guard_room",
    name: "清潭路新大門警衛室",
    category: "service",
    categoryName: "門禁安全",
    x: -74,
    z: -92,
    y: 0,
    w: 10,
    d: 8,
    h: 4.5,
    floors: 1,
    color: "#dfd2bb",
    roofColor: "#1b2126",
    description: "位於清潭路新大門入口旁的校園門禁警衛室，守護全校師生進出安全與家長接待。",
    tags: ["警衛室", "新大門", "安全守護"]
  },

  // --- 操場與中庭 ---
  {
    id: "track_field",
    name: "200M PU操場與綠茵足球場",
    category: "sports",
    categoryName: "戶外運動",
    x: 18,
    z: -68,
    y: 0.1,
    w: 88,
    d: 52,
    h: 0.2,
    description: "標準 200 公尺紅色 PU 跑道操場，內圈為茵茵綠草皮多功能球場與升旗司令台。",
    tags: ["PU跑道", "司令台", "足球場"]
  },
  {
    id: "courtyard",
    name: "迎曦百齡迎風中庭",
    category: "landscape",
    categoryName: "景觀綠帶",
    x: -12,
    z: 16,
    y: 0.1,
    w: 24,
    d: 38,
    h: 0.15,
    description: "迎曦樓、校友館與百齡樓環抱之綠意中庭，設有生態植栽與風雨走廊。",
    tags: ["風雨走廊", "中庭花園"]
  },

  // --- 羅東國小全校校門（精確嵌入圍籬線段上） ---
  {
    id: "gate_new",
    name: "清潭路新大門（正門）",
    category: "gate",
    categoryName: "校園大門",
    x: -58,
    z: -100, // 準確嵌在北界清潭路圍籬線上（位於警衛室東側）
    y: 0,
    w: 16,
    d: 3,
    h: 5.5,
    description: "羅東國小主要車輛與師生進出之新正門，面臨加蓋拓寬後的清潭路，緊鄰警衛室。",
    tags: ["新大門", "正門", "清潭路"]
  },
  {
    id: "gate_rabbit",
    name: "白兔門",
    category: "gate",
    categoryName: "特色校門",
    x: -36,
    z: -100, // 北界清潭路圍籬線上
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    description: "位於北側清潭路上，直通涵育樓後方與操場西側，門頂雕刻可愛小白兔。",
    tags: ["白兔門", "清潭路"]
  },
  {
    id: "gate_koala",
    name: "無尾熊門",
    category: "gate",
    categoryName: "特色校門",
    x: -4,
    z: -100, // 北界清潭路與開羅街轉角
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    description: "位於北側清潭路東端，直通操場北緣，門頂設有可愛無尾熊立體雕塑。",
    tags: ["無尾熊門", "開羅街"]
  },
  {
    id: "gate_minzu",
    name: "民族路歷史校門（門牌1號）",
    category: "gate",
    categoryName: "校園大門",
    x: -88,
    z: -70, // 西界民族路圍籬線上
    y: 0,
    w: 12,
    d: 3,
    h: 5.0,
    description: "羅東國小建校百年歷史正門（民族路 1 號），現為學童步行與歷史紀念側門。",
    tags: ["民族路大門", "民族路1號", "百年門牌"]
  },
  {
    id: "gate_peacock",
    name: "孔雀門",
    category: "gate",
    categoryName: "特色校門",
    x: -88,
    z: -52, // 西界民族路/清潭路西端圍籬線上
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    description: "位於西側圍籬上的動物意象校門，門頂有開屏孔雀立體造型。",
    tags: ["孔雀門", "民族路側"]
  },
  {
    id: "gate_market",
    name: "開元市場側門",
    category: "gate",
    categoryName: "特色校門",
    x: -88,
    z: 48, // 西界南端開元市場方向
    y: 0,
    w: 8,
    d: 3,
    h: 4.0,
    description: "鄰近開元市場與民族路南側生活圈，方便周邊學童與家長穿梭接送。",
    tags: ["開元市場側門", "民族路南端"]
  },
  {
    id: "gate_dolphin",
    name: "海豚門",
    category: "gate",
    categoryName: "特色校門",
    x: 96,
    z: -68, // 東界操場東緣圍籬線上
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    description: "位於操場東側開羅街與南昌街交會口旁，門頂有流線型躍水海豚雕塑。",
    tags: ["海豚門", "操場側門"]
  },
  {
    id: "gate_dinosaur",
    name: "恐龍門",
    category: "gate",
    categoryName: "特色校門",
    x: 48,
    z: 92, // 南界南昌街圍籬線上
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    description: "位於南昌街南側，緊鄰樹人館體育館後方，門頂有暴龍立體雕塑。",
    tags: ["恐龍門", "南昌街", "樹人館南側"]
  },
  {
    id: "gate_penguin",
    name: "企鵝門",
    category: "gate",
    categoryName: "特色校門",
    x: -12,
    z: 92, // 南界南昌街圍籬線上
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    description: "位於校園西南側南昌街上，鄰近中央廚房與幼兒園後門，門頂有黑白企鵝雕塑。",
    tags: ["企鵝門", "廚房通道"]
  }
];

export const TOUR_STATIONS = [
  "gate_new",         // 1. 清潭路新大門
  "guard_room",       // 2. 警衛室
  "hanyu",            // 3. 涵育樓 (教務/輔導/圖書館/電腦教室)
  "xiaoyou",          // 4. 校友館 (學務/校長室/創意發想)
  "courtyard",        // 5. 迎風中庭花園
  "yingxi_north",     // 6. 迎曦樓 (二三年級教室)
  "bailing_main",     // 7. 百齡樓 (總務/高年級/音樂/雙語教室)
  "bailing_kindergarten", // 8. 附設幼兒園與中央廚房
  "science",          // 9. 科學館 (視聽/自然實驗)
  "gymnasium",        // 10. 體育館（樹人館）
  "track_field",      // 11. 200M PU 操場
  "gate_rabbit",      // 12. 清潭路白兔門
  "gate_peacock"      // 13. 孔雀門
];
