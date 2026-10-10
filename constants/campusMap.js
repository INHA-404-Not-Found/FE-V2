// 캠퍼스 지도 공용 데이터: 지도 이미지, 건물 구역 좌표, 좌표 계산 유틸
// 건물 구역 좌표 (id는 서버 /locations의 장소 id와 같아야 한다)
export const CAMPUS_ZONES = [
  {
    id: 1,
    name: "1호관(본관)",
    d: "M694.5 276.5L754 279.5V271.5L759 262H802.5L809.5 268V279.5H870.5L876 304.5L872.5 334.5L692 331.5L687.5 302.5L694.5 276.5Z",
  },
  {
    id: 2,
    name: "2호관",
    d: "M704.5 139L711.5 122.5H769.5V114L853 115.5L851 154.5H841V160L782.5 157.5L781 169.5H729.5L728 179.5H702V170.5L704.5 162.5V139Z",
  },
  {
    id: 3,
    name: "60주년기념관",
    d: "M633 257L627.5 233L636.5 210.5L640.5 139L642.5 129L660 87.5H668.5L671.5 89.5V98H681L690 73L695.5 68H710L713.5 73L710 113L688 230.5H676.5L668.5 257H633Z",
  },
  {
    id: 4,
    name: "4호관",
    d: "",
  },
  {
    id: 5,
    name: "5호관",
    d: "M358.5 212.5L432.5 117H611L615 107.5L623 101.5H633L640.5 107.5L643.5 132.5L640.5 138.5V174L615 250L372.5 242.5L358.5 212.5Z",
  },
  {
    id: 6,
    name: "6호관",
    d: "",
  },
  {
    id: 7,
    name: "7호관(학생회관)",
    d: "",
  },
  {
    id: 8,
    name: "정석학술정보관",
    d: "",
  },
  {
    id: 9,
    name: "9호관",
    d: "",
  },
  {
    id: 10,
    name: "서호관",
    d: "M224 212.5L241.5 192L281 194L285 190.5H294.5L300 194H308.5V186.5H334L341.5 178.5H372L377.5 189L358 212.5L366.5 230L360 239.5H350.5L344.5 248.5L300 247L293.5 237L236.5 234L224 212.5Z",
  },
  {
    id: 11,
    name: "나빌레관",
    d: "M170 214.5L178 207L220 209.5L230 228L212.5 253L195.5 251.5L191 239.5L172.5 258.5L154 256L147 242L156 232H125V214.5H170Z",
  },
  {
    id: 12,
    name: "하이테크센터",
    d: "M911 132.5L908.5 106L911 74H977.5V66H1013V74H1041L1056.5 20H1101L1120.5 46.5L1077 155.5H1041L1037 148H1029L1023 132.5H949.5V135.5H932L930.5 132.5H911Z",
  },
  {
    id: 13,
    name: "로스쿨관",
    d: "",
  },
  {
    id: 14,
    name: "학군단",
    d: "",
  },
  {
    id: 15,
    name: "평생교육관/미래융합대학",
    d: "",
  },
  {
    id: 16,
    name: "김현태 인하드림센터",
    d: "",
  },
  {
    id: 17,
    name: "체육관",
    d: "",
  },
  {
    id: 18,
    name: "인하드림센터 2,3관",
    d: "",
  },
  {
    id: 19,
    name: "대운동장",
    d: "",
  },
  {
    id: 20,
    name: "농구장",
    d: "",
  },
  {
    id: 21,
    name: "테니스장",
    d: "",
  },
  {
    id: 22,
    name: "C호관",
    d: "",
  },
  {
    id: 23,
    name: "비룡주차장",
    d: "",
  },
  {
    id: 24,
    name: "제1생활관",
    d: "M894 753L923 726L1107 736.5L1133.5 883.5L1117.5 906H946.5L896 883.5L894 753Z",
  },
  {
    id: 25,
    name: "제2,3생활관",
    d: "",
  },
];
// map 이미지
export const MAP_IMAGE = require("../assets/inhaMap.png");
// 원본 PNG의 실제 크기(px)
export const ORIGINAL_WIDTH = 1520;
export const ORIGINAL_HEIGHT = 918;

// "M x y L x y H x V y Z" 형태의 path를 꼭짓점 배열로 변환
export const parsePolygon = (d) => {
  const points = [];
  let x = 0;
  let y = 0;
  for (const [, cmd, args] of d.matchAll(/([MLHVZ])([^MLHVZ]*)/g)) {
    const n = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (cmd === "M" || cmd === "L") [x, y] = n;
    else if (cmd === "H") x = n[0];
    else if (cmd === "V") y = n[0];
    else continue;
    points.push([x, y]);
  }
  return points;
};

export const isInside = (px, py, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};
