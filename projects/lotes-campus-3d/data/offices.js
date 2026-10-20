// 羅東國小 115 學年度行政處室、專科教室與年級配置資料

export const SCHOOL_INFO = {
  name: "宜蘭縣羅東鎮羅東國民小學",
  englishName: "Luodong Elementary School, Yilan County",
  address: "宜蘭縣羅東鎮民族路 1 號",
  phone: "03-954-2342",
  fax: "03-954-7690",
  officialUrl: "https://www.lotes.ilc.edu.tw/",
  vision: "溫馨、創新、適性、卓越（百年薪傳，羅小展翅）",
  historySummary: "創立於民國前 14 年（1898 年），為宜蘭歷史悠久的百年名校，培育無數優秀社會棟樑。"
};

export const DEPARTMENTS = [
  {
    name: "校長室與行政核心",
    buildingId: "xiaoyou",
    buildingName: "校友館",
    location: "校友館 2 樓",
    items: [
      { name: "校長室", floor: "2F", desc: "校務統籌與校園領導核心" },
      { name: "校史室", floor: "2F", desc: "典藏百年建校文物、歷史老照片與歷屆校友回憶" },
      { name: "創意發想中心", floor: "3F", desc: "教師跨領域備課研發與創新教學基地" }
    ]
  },
  {
    name: "教務處",
    buildingId: "hanyu",
    buildingName: "涵育樓",
    location: "涵育樓 1 樓 (102)",
    items: [
      { name: "教務處辦公室 (102)", floor: "1F", desc: "教學組、註冊組、設備組、資訊組" },
      { name: "圖書館 (103)", floor: "1F", desc: "豐富館藏與學童優質閱讀書香環境" },
      { name: "電腦教室 (112)", floor: "4F", desc: "資訊科技教學、Scratch 與 AI 程式專題探索基地" },
      { name: "本土教室 (113)", floor: "4F", desc: "閩南語、本土語文與地方鄉土文化教學" },
      { name: "藝術教室 (108)", floor: "2F", desc: "視覺藝術與美感手作教學" }
    ]
  },
  {
    name: "學務處",
    buildingId: "xiaoyou",
    buildingName: "校友館",
    location: "校友館 1 樓",
    items: [
      { name: "學務處辦公室", floor: "1F", desc: "生教組、訓育組、體育組、衛生組" },
      { name: "教師辦公室", floor: "1F", desc: "全體教師交流備課與教學支援空間" },
      { name: "表演藝術教室", floor: "1F", desc: "表演藝術、肢體展演與音樂律動教室" }
    ]
  },
  {
    name: "總務處",
    buildingId: "bailing_main",
    buildingName: "百齡樓",
    location: "百齡樓 1 樓 (01)",
    items: [
      { name: "總務處／會計室／人事室 (01)", floor: "1F", desc: "事務組、文書組、出納組、會計與人事室" },
      { name: "健康中心 (02)", floor: "1F", desc: "校園護理與學童身心健康守護第一線" },
      { name: "學校中央廚房", floor: "1F", desc: "嚴選在地食材，每日熱騰騰供應全校營養午餐" },
      { name: "大型會議室 (15)", floor: "1F", desc: "全校主管會議、家長代表會議與教職員研習會場" }
    ]
  },
  {
    name: "輔導處",
    buildingId: "hanyu",
    buildingName: "涵育樓",
    location: "涵育樓 2 樓 (106)",
    items: [
      { name: "輔導處辦公室 (106)", floor: "2F", desc: "輔導組、資料組、個別諮商室" },
      { name: "潛力班教室 A/B/C", floor: "1F~2F", desc: "適性扶助教學與特教資源陪伴空間" },
      { name: "知動教室", floor: "1F", desc: "感覺統合與知覺動作發展訓練教室" }
    ]
  },
  {
    name: "音樂與雙語專科專區",
    buildingId: "bailing_main",
    buildingName: "百齡樓",
    location: "百齡樓 4 樓",
    items: [
      { name: "音樂專科教室 (25)", floor: "4F", desc: "音樂鑑賞、節奏與合唱教學" },
      { name: "弦樂團練習室 (26)", floor: "4F", desc: "全國學生音樂比賽常勝軍——羅小弦樂團練習基地" },
      { name: "雙語情境教室 (27)", floor: "4F", desc: "沉浸式外語情境對話與跨國文化交流體驗" }
    ]
  },
  {
    name: "科學與體育場館",
    buildingId: "science",
    buildingName: "科學館 & 體育館",
    location: "科學館與樹人館",
    items: [
      { name: "科學館大型視聽教室", floor: "1F~2F", desc: "大型多媒體演講、電影賞析與專案發表會" },
      { name: "自然實驗專科教室", floor: "2F~3F", desc: "動手做科學實驗與科學展覽探索空間" },
      { name: "樹人館（體育館）", floor: "1F~2F", desc: "全校室內大型體育運動、體操訓練與典禮空間" }
    ]
  }
];

export const GRADE_DISTRIBUTION = [
  { grade: "幼兒園", building: "百齡樓（幼兒專區）", classrooms: "幼兒班、彩虹班、太陽班、星星班" },
  { grade: "一年級", building: "涵育樓 2F~3F", classrooms: "一忠、一孝、一仁、一愛、一信" },
  { grade: "二年級", building: "迎曦樓 2F", classrooms: "二忠、二孝、二仁、二愛、二信" },
  { grade: "三年級", building: "迎曦樓（北側）3F~4F", classrooms: "三忠、三孝、三仁、三愛、三信" },
  { grade: "四年級", building: "迎曦樓 1F & 百齡樓 2F", classrooms: "四忠、四孝、四仁、四愛、四信" },
  { grade: "五年級", building: "百齡樓 3F", classrooms: "五忠、五孝、五仁、五愛、五信、五義" },
  { grade: "六年級", building: "百齡樓 2F~3F", classrooms: "六忠、六孝、六仁、六愛、六信" }
];
