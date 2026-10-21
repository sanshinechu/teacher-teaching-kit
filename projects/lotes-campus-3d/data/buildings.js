// 羅東國小 115 學年度校舍、設施與特色動物校門 3D 空間資料
// 依據組長最新紅框實景標註與空照真實幾何嚴格校正：
// - 【涵育樓】：北側迎賓大樓（斜向清潭路，4層綠磚大樓）
// - 【迎曦樓】：西北側教學大樓（4層樓，附深色光電屋頂）
// - 【風雨操場】：校園正中心 6 連棟翠綠圓拱波浪拱頂半戶外球場
// - 【百齡樓】：西南側建築群（含北翼高年級教室棟、南翼行政／幼兒園／中央廚房）
// - 【體育館（樹人館）】：南側大跨度挑高雙斜坡光電屋頂體育展演館
// - 【科學館】：南昌街側、體育館西側之專科探索館（附天文台圓頂）
// - 【200M PU 操場】：東南象限標準 200 公尺湛藍跑道與內圈多功能球場

export const CAMPUS_BOUNDS = {
  minX: -95,
  maxX: 95,
  minZ: -95,
  maxZ: 95
};

export const BUILDINGS = [
  // --- 核心教學與行政校舍（嚴格依紅框標籤與空照位置對齊） ---
  {
    id: "hanyu",
    name: "涵育樓",
    category: "teaching",
    categoryName: "教學行政核心",
    x: -3,
    z: -56,
    y: 0,
    w: 36,
    d: 18,
    h: 17,
    floors: 4,
    rotationY: -0.56, // -32度，正面朝向清潭路迎賓廣場
    color: "#649479",
    roofColor: "#3d7355",
    description: "羅東國小主要教學與行政核心大樓。1F 設有教務處、學務處與優質書香圖書館；2F 為校長室、一年級教室與輔導處；3F 為創意發想中心與校史展示；4F 為現代化電腦教室與本土教室；地下室為桌球室。正面朝向清潭路新大門與迎賓停車廣場。",
    tags: ["教務處", "學務處", "校長室", "圖書館", "電腦教室", "一年級"]
  },
  {
    id: "yingxi",
    name: "迎曦樓",
    category: "teaching",
    categoryName: "班級教學",
    x: -56,
    z: -30,
    y: 0,
    w: 22,
    d: 38,
    h: 16.5,
    floors: 4,
    rotationY: -0.26, // -15度微傾斜，貼合格局
    color: "#aa8c61",
    roofColor: "#47728f",
    description: "地上 4 層教學大樓，頂部鋪設現代化太陽能光電板。1F 為潛力班與知動教室；2F 為二年級班級教室（二忠、二孝、二仁、二愛、二信）；3F~4F 為三年級班級教室；並設有原住民族大學與自然科專科教室。",
    tags: ["二年級", "三年級", "潛力教室", "知動教室", "太陽能板"]
  },
  {
    id: "wind_rain_court",
    name: "風雨操場（光電開放式多功能球場）",
    category: "sports",
    categoryName: "半戶外運動",
    x: -25,
    z: -9,
    y: 0,
    w: 28,
    d: 22,
    h: 11,
    floors: 1,
    rotationY: 0,
    color: "#876d54",
    roofColor: "#257343",
    description: "校園正中央最醒目的光電風雨球場，屋頂設置 6 連棟太陽能光電板陣列，兼具綠能發電與遮陽避雨功能；四周挑高鋼構柱列完全開闊通透無外牆。內部設有標準多功能湛藍壓克力球場（含全套籃球場、排球場標線與東西雙向 3D 立體籃球架），提供全校師生風雨無阻的體育教學、球類運動與大型集會空間。",
    tags: ["風雨操場", "太陽能板", "光電風雨球場", "開放式球場", "多功能球場", "籃球場"]
  },
  {
    id: "xiaoyou",
    name: "校友館",
    category: "facility",
    categoryName: "校史與校友交流",
    x: 13,
    z: 5,
    y: 0,
    w: 11,
    d: 26,
    h: 7.5,
    floors: 2,
    rotationY: -0.12,
    color: "#e6ede9",
    roofColor: "#141c26",
    description: "羅東國小校友館，坐落於中庭東側（風雨操場與操場跑道之間）。館舍二層樓挑高設計，屋頂全面架設太陽能光電發電板系統。南端設有專屬連通風雨走廊直達百齡樓，鄰近圓形涼亭生態花園與 200M 湛藍操場，為校友聯誼、校史文創特展及多元教學研習的優質交流場域。",
    tags: ["校友館", "太陽能板", "校友聯誼", "連通道", "綠能建築", "校史展覽"]
  },
  {
    id: "bailing",
    name: "百齡樓",
    category: "teaching",
    categoryName: "綜合教學生活",
    x: -42,
    z: 42,
    y: 0,
    w: 42,
    d: 46,
    h: 17,
    floors: 4,
    rotationY: 0,
    color: "#876d54",
    roofColor: "#1b2126",
    description: "學校量體龐大的多功能校舍建築群（含北翼高年級教學棟與南翼行政生活棟，屋頂鋪設大面積光電板）。1F 設有總務處、人事會計、健康中心、附設幼兒園與供應全校營養午餐的現代化標準中央廚房；2F~3F 為四、五、六年級主要教室；4F 設有音樂專科教室、弦樂團練習室與雙語情境教室。",
    tags: ["總務處", "健康中心", "音樂教室", "弦樂團", "雙語教室", "高年級", "附設幼兒園", "中央廚房"]
  },
  {
    id: "gymnasium",
    name: "體育館（樹人館）",
    category: "sports",
    categoryName: "運動展演",
    x: 14,
    z: 72,
    y: 0,
    w: 40,
    d: 28,
    h: 14,
    floors: 2,
    rotationY: -0.12,
    color: "#4f8562",
    roofColor: "#101924",
    description: "學校歷史悠久的「樹人館」大型挑高體育館，設有室內綜合球場、羽球場與大型舞台。雙斜坡大跨度鋼構屋頂北坡全面鋪設太陽能光電板陣列，南坡以紅瓦修邊，南臨南昌街，東接 200M 湛藍操場。",
    tags: ["室內球場", "活動中心", "樹人館", "太陽能光電板", "體育展演"]
  },
  {
    id: "science",
    name: "科學館",
    category: "teaching",
    categoryName: "專科探索",
    x: -28,
    z: 81,
    y: 0,
    w: 18,
    d: 20,
    h: 11,
    floors: 3,
    rotationY: 0,
    color: "#416d8a",
    roofColor: "#1b2126",
    description: "專科教學探索基地，座落於體育館西側、南昌街圍籬旁。設有多功能大視聽教室、自然實驗專科教室與頂樓白色天文台圓頂，鄰近企鵝門。",
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
    name: "200M PU操場與人工草皮球場",
    category: "sports",
    categoryName: "戶外運動",
    x: 54,
    z: 34,
    y: 0.1,
    w: 48,
    d: 86,
    h: 0.2,
    description: "標準 200 公尺湛藍色 PU 跑道操場，長軸呈南北向，位於校園東南開闊區；內圈換裝為綠意盎然的現代化人工草皮多功能運動場（附深淺相間割草斑紋、開球中圈、禁區標線與白色立體足球門），西側直道外緣設有司令台。",
    tags: ["湛藍PU跑道", "人工草皮", "足球場", "司令台"]
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
    description: "位於操場與中央綠帶間的圓形遮陽涼亭與戶外展演台，空照可見醒目的紅白同心環條紋屋頂，是學童課後休閒與表演的最佳去處。",
    tags: ["圓形展演亭", "戶外舞台", "景觀地標"]
  },
  {
    id: "courtyard",
    name: "迎風中庭花園",
    category: "landscape",
    categoryName: "景觀綠帶",
    x: -36,
    z: -18,
    y: 0.1,
    w: 24,
    d: 36,
    h: 0.15,
    description: "由迎曦樓、涵育樓、風雨操場與百齡樓環抱之綠意中庭，設有植栽花圃、休閒石磚步道與戶外座椅。",
    tags: ["中庭花園", "生態綠帶", "休閒步道"]
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
    x: -65,
    z: 55,
    y: 0.08,
    w: 20,
    d: 22,
    h: 0.05,
    description: "百齡樓西南側教職員專用停車場，設有通暢進出車道與綠蔭造景。",
    tags: ["教職員停車場", "停車空間"]
  },

  // --- 羅東國小全校校門（精確嵌入真實多邊形圍籬線段上） ---
  {
    id: "gate_new",
    name: "清潭路新大門（正門）",
    category: "gate",
    categoryName: "校園大門",
    x: 22,
    z: -62,
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
    z: -80,
    y: 0,
    w: 8,
    d: 3,
    h: 4.5,
    rotationY: -0.56,
    description: "位於北側清潭路上，直通涵育樓後方，門頂雕刻可愛小白兔立體塑像。",
    tags: ["白兔門", "清潭路"]
  },
  {
    id: "gate_koala",
    name: "無尾熊門",
    category: "gate",
    categoryName: "特色校門",
    x: 45,
    z: -25,
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
    z: 20,
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
    z: 68,
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
    z: 86,
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
    z: 55,
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
    z: 5,
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
    z: -55,
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
  "hanyu",                // 3. 涵育樓 (教學行政核心/教務/學務/校長室/圖書館/電腦教室)
  "yingxi",               // 4. 迎曦樓 (二三年級教室/光電屋頂)
  "wind_rain_court",      // 5. 風雨操場 (6連棟波浪綠屋頂半戶外球場)
  "xiaoyou",              // 6. 校友館 (校史校友中心/全棟太陽能光電)
  "bailing",              // 7. 百齡樓 (總務/健康中心/高年級教室/音樂/幼兒園/中央廚房)
  "science",              // 8. 科學館 (視聽/自然實驗/天文台)
  "gymnasium",            // 9. 體育館（樹人館）
  "track_field",          // 10. 200M 湛藍 PU 操場
  "circular_pavilion",    // 11. 迎風圓形展演涼亭
  "gate_rabbit",          // 12. 清潭路白兔門
  "gate_peacock"          // 13. 孔雀門
];
