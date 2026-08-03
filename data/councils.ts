export type CouncilKey = "nagoya_city" | "aichi_pref";

export type Council = {
  key: CouncilKey;
  name: string;
  shortName: string;
};

export const councils: Council[] = [
  {
    key: "aichi_pref",
    name: "愛知県議会",
    shortName: "愛知県",
  },
  {
    key: "nagoya_city",
    name: "名古屋市会",
    shortName: "名古屋市",
  },
];

export function getCouncil(key: CouncilKey): Council {
  const council = councils.find((c) => c.key === key);
  if (!council) {
    throw new Error(`Unknown council key: ${key}`);
  }
  return council;
}
