export const forms = [
  {
    name: "Agumon",
    rank: "Rookie",
    hp: 260,
    attack: 22,
    skill: "Chama bebê",
    width: 61,
    height: 73,
    size: 170,
  },
  {
    name: "Greymon",
    rank: "Champion",
    hp: 460,
    attack: 42,
    skill: "Mega chama",
    width: 104,
    height: 120,
    size: 238,
  },
  {
    name: "MetalGreymon",
    rank: "Ultimate",
    hp: 760,
    attack: 70,
    skill: "Giga Destroyer",
    width: 132,
    height: 142,
    size: 254,
  },
  {
    name: "WarGreymon",
    rank: "Mega",
    hp: 1150,
    attack: 110,
    skill: "Terra Force",
    width: 128,
    height: 192,
    size: 202,
  },
] as const;
export const betamon = { name: "Betamon", width: 76, height: 67, size: 180 };
export interface Area {
  id: number;
  chapter: number;
  step: number;
  enemy: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  bits: number;
  xp: number;
  boss: boolean;
}
const rows: [string, number, number, number, number, number, number][] = [
  ["Betamon", 1, 140, 12, 0, 80, 40],
  ["Agumon", 2, 170, 14, 1, 90, 45],
  ["Betamon", 3, 205, 16, 1, 100, 50],
  ["Agumon", 4, 245, 18, 2, 110, 55],
  ["Greymon", 5, 310, 20, 3, 150, 75],
  ["Betamon", 6, 335, 21, 3, 130, 65],
  ["Agumon", 7, 360, 22, 4, 140, 70],
  ["Betamon", 8, 390, 24, 4, 150, 75],
  ["Agumon", 9, 425, 25, 5, 160, 80],
  ["Greymon", 10, 480, 27, 6, 220, 110],
  ["Greymon", 11, 540, 30, 7, 240, 120],
  ["Betamon", 12, 590, 33, 8, 260, 130],
  ["Agumon", 13, 645, 36, 9, 280, 140],
  ["Greymon", 14, 700, 39, 10, 300, 150],
  ["MetalGreymon", 15, 780, 42, 12, 380, 190],
  ["Greymon", 16, 825, 45, 13, 340, 170],
  ["Agumon", 17, 875, 48, 14, 360, 180],
  ["Greymon", 18, 930, 51, 15, 380, 190],
  ["MetalGreymon", 19, 990, 54, 16, 400, 200],
  ["MetalGreymon", 20, 1100, 58, 18, 500, 250],
  ["MetalGreymon", 21, 1180, 62, 19, 540, 270],
  ["Greymon", 22, 1270, 66, 20, 580, 290],
  ["MetalGreymon", 23, 1370, 70, 21, 620, 310],
  ["Greymon", 24, 1470, 75, 22, 660, 330],
  ["WarGreymon", 25, 1600, 80, 24, 800, 400],
  ["MetalGreymon", 26, 1710, 85, 25, 740, 370],
  ["Greymon", 27, 1830, 90, 26, 780, 390],
  ["MetalGreymon", 28, 1960, 96, 27, 820, 410],
  ["WarGreymon", 29, 2100, 102, 28, 860, 430],
  ["WarGreymon", 30, 2300, 110, 30, 1100, 550],
];
export const areas: Area[] = rows.map(
  ([enemy, level, hp, attack, defense, bits, xp], i) => ({
    id: i + 1,
    chapter: Math.floor(i / 10) + 1,
    step: (i % 10) + 1,
    enemy,
    level,
    hp,
    attack,
    defense,
    bits,
    xp,
    boss: i % 10 === 4 || i % 10 === 9,
  }),
);
export const areaLabel = (id: number) =>
  `${Math.floor((id - 1) / 10) + 1}-${((id - 1) % 10) + 1}`;
export const evolutionRules = [
  { level: 5, bits: 300, boss: 0 },
  { level: 10, bits: 800, boss: 5 },
  { level: 15, bits: 1500, boss: 10 },
];
