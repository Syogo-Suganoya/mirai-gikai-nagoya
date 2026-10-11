export type CouncilKey = "nagoya_city" | "aichi_pref";

export type Council = {
  key: CouncilKey;
  name: string;
  shortName: string;
  // 会議録検索サービス(自動取得は robots.txt で禁止されているため、リンクで案内する)
  minutesSearchUrl: string;
};

export const councils: Council[] = [
  {
    key: "aichi_pref",
    name: "愛知県議会",
    shortName: "愛知県",
    minutesSearchUrl: "https://www.pref.aichi.dbsr.jp/",
  },
  {
    key: "nagoya_city",
    name: "名古屋市会",
    shortName: "名古屋市",
    minutesSearchUrl: "https://ssp.kaigiroku.net/tenant/nagoya/SpTop.html",
  },
];

export function getCouncil(key: CouncilKey): Council {
  const council = councils.find((c) => c.key === key);
  if (!council) {
    throw new Error(`Unknown council key: ${key}`);
  }
  return council;
}
