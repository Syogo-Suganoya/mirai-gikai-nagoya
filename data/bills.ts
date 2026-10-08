import type { CouncilKey } from "./councils";

export type BillStatus =
  | "introduced"
  | "in_deliberation"
  | "enacted"
  | "rejected";

// ふりがな表示用に議案名を分割したもの。text を順番に連結すると name と一致する。
// reading が無いセグメント(ひらがな・カタカナ・数字・記号など)はふりがなを付けない。
export type FuriganaSegment = {
  text: string;
  reading?: string;
};

// サムネイル方式: illustration=自作SVGイラスト / photo=キーワード連動の外部写真(loremflickr)
// photo は外部サービス側の都合(ボット判定など)で読み込めないことがあるため、
// 読み込みに失敗したときに表示するイラストを fallback に必ず指定する。
export type BillIllustration =
  | "budget"
  | "childcare"
  | "education"
  | "community"
  | "organization"
  | "industry"
  | "labor";

export type BillThumbnail =
  | { type: "illustration"; illustration: BillIllustration }
  | { type: "photo"; keyword: string; fallback: BillIllustration };

// みらい議会の詳細画面を参考にした追加セクション。
export type BillKeyPoint = { title: string; body: string };
export type BillReason = { title: string; body: string };
export type BillDebatePoint = { topic: string; benefit: string; caution: string };
export type BillAffectedGroup = { who: string; effect: string };

export type Bill = {
  id: string;
  council: CouncilKey;
  sessionName: string;
  billNumber: string;
  name: string;
  nameFurigana: FuriganaSegment[];
  tags: string[];
  status: BillStatus;
  submittedDate: string;
  decidedDate?: string;
  sourceUrl: string;
  minutesText: string;
  summaryEasy: string;
  summaryDetailed: string;
  thumbnail?: BillThumbnail;
  keyPoints: BillKeyPoint[];
  reasons: BillReason[];
  debatePoints: BillDebatePoint[];
  affectedGroups: BillAffectedGroup[];
};

export const billStatusLabels: Record<BillStatus, string> = {
  introduced: "提出済み",
  in_deliberation: "審議中",
  enacted: "可決・成立",
  rejected: "否決",
};

// 愛知県議会・名古屋市会それぞれ5件、実際の議案一覧・会議録検索で内容を確認したうえで記載。
// 会議録検索で実際にヒットする(≒個別に審査・議決された)議案を選定している。
// 予算の詳細な内訳や条例の細かい運用ルールなど、公式資料でしか確認できない部分は
// 断定を避け、出典を見るよう案内する書き方にしている。
export const bills: Bill[] = [
  {
    id: "nagoya-1",
    council: "nagoya_city",
    sessionName: "令和8年2月定例会",
    billNumber: "第1号",
    name: "令和8年度名古屋市一般会計予算",
    nameFurigana: [
      { text: "令和", reading: "れいわ" },
      { text: "8" },
      { text: "年度", reading: "ねんど" },
      { text: "名古屋市", reading: "なごやし" },
      { text: "一般会計", reading: "いっぱんかいけい" },
      { text: "予算", reading: "よさん" },
    ],
    tags: ["予算💰", "財政"],
    thumbnail: { type: "illustration", illustration: "budget" },
    status: "enacted",
    submittedDate: "2026-02-18",
    decidedDate: "2026-03-19",
    sourceUrl:
      "https://www.city.nagoya.jp/shikai/shingi/1030858/1030859/1046530.html",
    minutesText:
      "令和8年2月定例会で2月18日に上程され、財政福祉委員会をはじめとする各常任委員会で審査。3月19日の本会議で、委員長報告のとおり「附帯決議を付して修正可決」という形で成立した。同じ本会議では、第2号議案(国民健康保険特別会計予算)以降の関連予算議案も続けて審議されている。",
    summaryEasy:
      "名古屋市が来年度(令和8年度)に使うお金の使いみち全体をまとめた予算案です。教育・福祉・道路・ごみ処理など、市が行うさまざまな仕事にかかる費用がここに含まれます。令和8年2月定例会に提出され、市会からの修正を経て3月19日に可決・成立しました。",
    summaryDetailed:
      "名古屋市会には「一般会計」「特別会計」など複数の予算議案が同時に提出されますが、この第1号議案は市の基本的な行政サービス全般をまかなう「一般会計」の予算です。財政福祉委員会をはじめ複数の常任委員会で審査され、本会議では「附帯決議を付して修正可決」という形で成立しました。附帯決議とは、予算そのものは認めつつ、実際に予算を執行する際に配慮してほしい事項を議会側から付け加えるものです。修正の具体的な内容や附帯決議の詳細は、名古屋市会公式サイトで公開されている審議資料で確認できます。",
    keyPoints: [
      {
        title: "教育・福祉・道路・ごみ処理など市の仕事すべての財源を1年分まとめて定める",
        body: "予算は市があらゆる行政サービスを行うための元手です。この議案では、来年度(令和8年度)に名古屋市が使うお金の使いみち全体が決められています。",
      },
      {
        title: "本会議では「附帯決議」を付けて修正可決された",
        body: "原案どおりではなく、議会側から予算の執行にあたって配慮してほしい事項(附帯決議)を付けたうえで可決されました。どこにどのような注文が付いたかは公式資料で確認できます。",
      },
    ],
    reasons: [
      {
        title: "市の行政サービスを止めないために毎年度の議決が必要",
        body: "教育・福祉・道路整備・ごみ処理など、市民の暮らしに関わるサービスは、あらかじめ議会が予算を認めないと実施できません。",
      },
      {
        title: "多くの常任委員会にまたがる大きな予算だから",
        body: "財政福祉委員会をはじめ複数の委員会で分野ごとに審査が行われ、内容を細かくチェックしたうえで本会議に諮られています。",
      },
    ],
    debatePoints: [
      {
        topic: "原案のまま可決されず「修正可決」となった点をどう見るか",
        benefit: "議会が予算案を精査し、実情に合わない部分を見直すことができました。",
        caution: "どの部分がどう修正されたかは会議録や審議資料でしか確認できず、この解説だけでは詳細はわかりません。",
      },
    ],
    affectedGroups: [
      { who: "名古屋市民全体", effect: "教育・福祉・道路・ごみ処理など、日常生活に関わる行政サービスの水準に影響します。" },
      { who: "市の各局・区役所", effect: "この予算に基づいて1年間の事業計画を実行します。" },
    ],
  },
  {
    id: "nagoya-2",
    council: "nagoya_city",
    sessionName: "令和8年2月定例会",
    billNumber: "第2号",
    name: "令和8年度名古屋市国民健康保険特別会計予算",
    nameFurigana: [
      { text: "令和", reading: "れいわ" },
      { text: "8" },
      { text: "年度", reading: "ねんど" },
      { text: "名古屋市", reading: "なごやし" },
      { text: "国民健康保険", reading: "こくみんけんこうほけん" },
      { text: "特別会計", reading: "とくべつかいけい" },
      { text: "予算", reading: "よさん" },
    ],
    tags: ["予算💰", "医療福祉🏥"],
    thumbnail: { type: "illustration", illustration: "budget" },
    status: "enacted",
    submittedDate: "2026-02-18",
    decidedDate: "2026-03-19",
    sourceUrl:
      "https://www.city.nagoya.jp/shikai/shingi/1030858/1030859/1046530.html",
    minutesText:
      "令和8年2月定例会で2月18日に上程され、財政福祉委員会で審査。3月19日の本会議で、一般会計予算(第1号議案)に続けて審議され、可決・成立した。",
    summaryEasy:
      "名古屋市が運営する国民健康保険(自営業者や年金生活者などが加入する公的医療保険)にかかるお金の使いみちをまとめた予算です。令和8年2月定例会に提出され、3月19日に可決・成立しました。",
    summaryDetailed:
      "一般会計とは別に管理される「特別会計」のひとつで、国民健康保険に加入する市民から集める保険料と、医療費として支払うお金の出入りをまとめたものです。財政福祉委員会で審査され、本会議で可決・成立しました。保険料の水準や医療費の見込みなど詳しい内容は、名古屋市会公式サイトで公開されている審議資料で確認できます。",
    keyPoints: [
      {
        title: "国民健康保険にかかるお金の出入りだけをまとめた予算",
        body: "一般会計とは別に管理される特別会計のひとつで、保険料収入と医療費支出のバランスを扱います。",
      },
      {
        title: "一般会計予算に続けて審議・可決された",
        body: "第1号議案(一般会計予算)と同じ本会議の中で審議され、可決・成立しています。",
      },
    ],
    reasons: [
      {
        title: "国民健康保険を安定的に運営するため",
        body: "自営業者や年金生活者など多くの市民が加入する公的医療保険であり、保険料と給付のバランスを毎年度議会が確認する必要があります。",
      },
    ],
    debatePoints: [
      {
        topic: "保険料の水準が今後の医療費見込みに見合っているか",
        benefit: "医療費の見込みに応じた保険料設定により、制度を安定的に維持できます。",
        caution: "保険料負担の重さについては加入者の生活状況によって受け止め方が分かれる可能性があります。具体的な保険料水準は公式資料で確認が必要です。",
      },
    ],
    affectedGroups: [
      { who: "国民健康保険の加入者(自営業者・年金生活者など)", effect: "保険料や医療費の給付水準に直接関わります。" },
      { who: "名古屋市の国保担当部局", effect: "この予算に基づき制度を運営します。" },
    ],
  },
  {
    id: "nagoya-3",
    council: "nagoya_city",
    sessionName: "令和8年2月定例会",
    billNumber: "第39号",
    name: "名古屋市特定乳児等通園支援事業の運営に関する基準を定める条例の制定について",
    nameFurigana: [
      { text: "名古屋市", reading: "なごやし" },
      { text: "特定", reading: "とくてい" },
      { text: "乳児", reading: "にゅうじ" },
      { text: "等", reading: "とう" },
      { text: "通園", reading: "つうえん" },
      { text: "支援", reading: "しえん" },
      { text: "事業", reading: "じぎょう" },
      { text: "の" },
      { text: "運営", reading: "うんえい" },
      { text: "に" },
      { text: "関", reading: "かん" },
      { text: "する" },
      { text: "基準", reading: "きじゅん" },
      { text: "を" },
      { text: "定", reading: "さだ" },
      { text: "める" },
      { text: "条例", reading: "じょうれい" },
      { text: "の" },
      { text: "制定", reading: "せいてい" },
      { text: "について" },
    ],
    tags: ["新設条例", "子育て"],
    thumbnail: { type: "photo", keyword: "baby,nursery,japan", fallback: "childcare" },
    status: "enacted",
    submittedDate: "2026-02-18",
    decidedDate: "2026-03-19",
    sourceUrl:
      "https://www.city.nagoya.jp/shikai/shingi/1030858/1030859/1046530.html",
    minutesText:
      "令和8年2月定例会で2月18日に上程され、教育子ども委員会で審査。3月19日の本会議で可決・成立した新設条例。",
    summaryEasy:
      "保育園に通っていない0〜2歳の子ども(特定乳児等)を、一時的に預かって面倒を見る事業(通園支援事業)を市が運営していくための、新しいルール(基準)を定める条例です。令和8年2月定例会に提出され、3月19日に可決・成立しました。",
    summaryDetailed:
      "国の「こども誰でも通園制度」等の枠組みに合わせて、保育園などに在籍していない子どもを対象にした通園支援事業を市内で行うにあたり、事業者が守るべき運営基準(職員の配置数や設備など)を条例として新しく定めるものです。教育子ども委員会で審査され、本会議で可決・成立しました。基準の詳細項目は、名古屋市会公式サイトで公開されている審議資料で確認できます。",
    keyPoints: [
      {
        title: "保育園に通っていない0〜2歳児を一時的に預かる事業の運営基準を新しく定める",
        body: "国の「こども誰でも通園制度」等の枠組みに合わせて、市内で事業を行う際に事業者が守るべきルールを条例化します。",
      },
      {
        title: "職員配置や設備など運営の基準を明確化",
        body: "新しい事業だからこそ、安全・安心に子どもを預かれる基準が必要になります。",
      },
    ],
    reasons: [
      {
        title: "在宅で子育てをする家庭の負担を軽減するため",
        body: "保育園に在籍していなくても、一時的に子どもを預けられる場をつくることで、子育て家庭を支援します。",
      },
      {
        title: "国の制度開始にあわせて市独自のルールが必要",
        body: "国の枠組みだけでは自治体ごとの運営の詳細が定まらないため、市が基準を条例で定める必要があります。",
      },
    ],
    debatePoints: [
      {
        topic: "新しい事業の質をどう担保するか",
        benefit: "基準を条例で明確にすることで、事業者による質のばらつきを防げます。",
        caution: "基準の水準が実際の現場(職員確保など)に見合っているかは、運用開始後の状況を見る必要があります。",
      },
    ],
    affectedGroups: [
      { who: "0〜2歳の子どもがいる家庭(特に保育園未利用)", effect: "新しく一時預かりサービスを利用できるようになります。" },
      { who: "通園支援事業を行う事業者", effect: "条例で定める運営基準を守る義務を負います。" },
    ],
  },
  {
    id: "nagoya-4",
    council: "nagoya_city",
    sessionName: "令和8年2月定例会",
    billNumber: "第49号",
    name: "名古屋市生涯学習センター条例の一部改正について",
    nameFurigana: [
      { text: "名古屋市", reading: "なごやし" },
      { text: "生涯学習", reading: "しょうがいがくしゅう" },
      { text: "センター" },
      { text: "条例", reading: "じょうれい" },
      { text: "の" },
      { text: "一部改正", reading: "いちぶかいせい" },
      { text: "について" },
    ],
    tags: ["条例改正", "教育🏫"],
    thumbnail: { type: "photo", keyword: "library,books,japan", fallback: "education" },
    status: "enacted",
    submittedDate: "2026-02-18",
    decidedDate: "2026-03-19",
    sourceUrl:
      "https://www.city.nagoya.jp/shikai/shingi/1030858/1030859/1046530.html",
    minutesText:
      "令和8年2月定例会で2月18日に上程され、教育子ども委員会で審査。他の一部改正案とは異なり、3月19日の本会議で委員会報告のとおりではなく「修正可決」という形で成立しており、審議の中で内容の見直しがあったことがうかがえる。",
    summaryEasy:
      "名古屋市の生涯学習センター(市民が学習・交流活動をする施設)についてのルールを一部変更する条例です。令和8年2月定例会に提出され、市会での修正を経て3月19日に可決・成立しました。",
    summaryDetailed:
      "既存の条例の一部を改正するものですが、他の多くの一部改正案が原案どおり「可決」だったのに対し、この議案は「修正可決」となっており、委員会や本会議での審議の過程で当初案から内容が見直されたと考えられます。教育子ども委員会で審査されました。どの部分がどう修正されたかは、名古屋市会公式サイトで公開されている審議資料・議事録で確認できます。",
    keyPoints: [
      {
        title: "生涯学習センターの運営に関するルールを一部変更",
        body: "市民が学習・交流活動をするための施設に関する条例の一部が改正されます。",
      },
      {
        title: "他の一部改正案と異なり「修正可決」となった",
        body: "原案のまま可決された多くの一部改正案とは違い、審議の過程で内容が見直されています。",
      },
    ],
    reasons: [
      {
        title: "施設の実情にあわせて運営ルールを更新するため",
        body: "条例は一度定めたら終わりではなく、利用状況や社会の変化にあわせて随時見直す必要があります。",
      },
    ],
    debatePoints: [
      {
        topic: "原案から何が修正されたのか",
        benefit: "議会の審議を経て、より実情に即した内容に近づいた可能性があります。",
        caution: "この解説の時点では具体的な修正内容までは確認できておらず、公式の審議資料・議事録の確認が必要です。",
      },
    ],
    affectedGroups: [
      { who: "生涯学習センターの利用者", effect: "施設の利用ルールが変わる可能性があります。" },
      { who: "施設を運営する市の担当部局", effect: "改正後の条例に基づいて運営を行います。" },
    ],
  },
  {
    id: "nagoya-5",
    council: "nagoya_city",
    sessionName: "令和8年2月定例会",
    billNumber: "第50号",
    name: "名古屋市女性会館条例の一部改正について",
    nameFurigana: [
      { text: "名古屋市", reading: "なごやし" },
      { text: "女性会館", reading: "じょせいかいかん" },
      { text: "条例", reading: "じょうれい" },
      { text: "の" },
      { text: "一部改正", reading: "いちぶかいせい" },
      { text: "について" },
    ],
    tags: ["条例改正", "男女共同参画"],
    thumbnail: { type: "photo", keyword: "community,center,japan", fallback: "community" },
    status: "enacted",
    submittedDate: "2026-02-18",
    decidedDate: "2026-03-19",
    sourceUrl:
      "https://www.city.nagoya.jp/shikai/shingi/1030858/1030859/1046530.html",
    minutesText:
      "令和8年2月定例会で2月18日に上程され、教育子ども委員会で審査。第49号議案と同様に、3月19日の本会議で「修正可決」という形で成立している。",
    summaryEasy:
      "名古屋市の女性会館(女性の活動を支援する施設)についてのルールを一部変更する条例です。令和8年2月定例会に提出され、市会での修正を経て3月19日に可決・成立しました。",
    summaryDetailed:
      "既存の条例の一部を改正するものですが、第49号議案(生涯学習センター条例)と同じく「修正可決」となっており、審議の過程で当初案から内容が見直されたことがうかがえます。教育子ども委員会で審査されました。具体的な修正内容は、名古屋市会公式サイトで公開されている審議資料・議事録で確認できます。",
    keyPoints: [
      {
        title: "女性会館(女性の活動支援施設)の運営ルールを一部変更",
        body: "女性の社会参画や活動を支援する施設に関する条例の一部が改正されます。",
      },
      {
        title: "第49号議案と同じく「修正可決」",
        body: "生涯学習センター条例と同じ会議で審議され、同様に修正を経て可決されています。",
      },
    ],
    reasons: [
      {
        title: "施設の役割にあわせて運営ルールを見直すため",
        body: "男女共同参画を支援する施設として、時代の変化にあわせた運営体制の見直しが必要です。",
      },
    ],
    debatePoints: [
      {
        topic: "原案からどのように修正されたのか",
        benefit: "審議を通じてより実情に合った内容になった可能性があります。",
        caution: "具体的な修正点はこの解説では確認できておらず、公式資料での確認が必要です。",
      },
    ],
    affectedGroups: [
      { who: "女性会館の利用者", effect: "施設の利用ルールが変わる可能性があります。" },
      { who: "施設を運営する市の担当部局", effect: "改正後の条例に基づいて運営を行います。" },
    ],
  },
  {
    id: "aichi-1",
    council: "aichi_pref",
    sessionName: "令和7年6月定例議会",
    billNumber: "第105号",
    name: "ソーシャルイノベーション創出基金条例の制定について",
    nameFurigana: [
      { text: "ソーシャルイノベーション" },
      { text: "創出基金", reading: "そうしゅつききん" },
      { text: "条例", reading: "じょうれい" },
      { text: "の" },
      { text: "制定", reading: "せいてい" },
      { text: "について" },
    ],
    tags: ["新設条例", "産業振興💡"],
    thumbnail: { type: "photo", keyword: "startup,technology,office", fallback: "industry" },
    status: "enacted",
    submittedDate: "2025-06-01",
    decidedDate: "2025-07-08",
    sourceUrl: "https://www.pref.aichi.jp/site/gikai/nittei-0706.html#gian",
    minutesText:
      "令和7年6月定例議会に提出され、経済労働委員会で審査。委員会審査結果報告書(令和7年6月定例会 第5号資料)で審査結果が報告され、7月8日の本会議で可決・成立した。",
    summaryEasy:
      "愛知県内で、社会の課題を解決するような新しい技術やアイデアを事業として育てようとする人たちを応援するために、新しい基金(お金を積み立てて活用する仕組み)をつくる条例です。令和7年6月定例議会に提出され、7月8日に可決・成立しました。",
    summaryDetailed:
      "この条例は、愛知県が「ソーシャルイノベーション創出基金」という新しい基金を設置するための条例です。経済労働委員会で審査され、7月8日の本会議で可決されました。基金の対象となる事業の具体的な要件や運用ルールなど、より詳しい内容は愛知県議会公式サイトで公開されている委員会審査結果報告書等の資料で確認できます。",
    keyPoints: [
      {
        title: "新しい技術やアイデアを事業として育てる人を支援する基金を新設",
        body: "社会課題の解決につながる事業に取り組む人たちを支援するため、お金を積み立てて活用する「基金」の仕組みをつくります。",
      },
      {
        title: "経済労働委員会で審査され、原案どおり可決された",
        body: "委員会審査結果報告書を経て、7月8日の本会議で可決・成立しています。",
      },
    ],
    reasons: [
      {
        title: "社会課題を解決する新しい事業の育成を後押しするため",
        body: "先進的な技術やアイデアを持つ人が資金面で挑戦しやすくなるよう、県として継続的に支援できる仕組みが必要です。",
      },
    ],
    debatePoints: [
      {
        topic: "基金の対象事業の選定基準をどう考えるか",
        benefit: "基金があることで、新しい事業に挑戦する人たちの資金調達がしやすくなります。",
        caution: "対象事業の具体的な要件や審査基準は公式資料でしか確認できず、この解説だけでは詳細はわかりません。",
      },
    ],
    affectedGroups: [
      { who: "新しい技術・アイデアで事業を始めようとする人・企業", effect: "基金を通じた支援を受けられる可能性があります。" },
      { who: "愛知県民全体", effect: "県内での新産業育成を通じて間接的に影響を受けます。" },
    ],
  },
  {
    id: "aichi-2",
    council: "aichi_pref",
    sessionName: "令和7年6月定例議会",
    billNumber: "第106号",
    name: "愛知県カスタマーハラスメント防止条例の制定について",
    nameFurigana: [
      { text: "愛知県", reading: "あいちけん" },
      { text: "カスタマーハラスメント" },
      { text: "防止", reading: "ぼうし" },
      { text: "条例", reading: "じょうれい" },
      { text: "の" },
      { text: "制定", reading: "せいてい" },
      { text: "について" },
    ],
    tags: ["新設条例", "労働"],
    thumbnail: { type: "photo", keyword: "customer,shop,japan", fallback: "labor" },
    status: "enacted",
    submittedDate: "2025-06-01",
    decidedDate: "2025-07-08",
    sourceUrl: "https://www.pref.aichi.jp/site/gikai/nittei-0706.html#gian",
    minutesText:
      "経済労働委員会で審査され、7月8日の本会議で採決。討論では、賛成会派からは自動車産業をはじめとしたモノづくり産業の就業者を守る条例として意義が述べられた一方、反対の立場から討論を行った議員もおり、賛否が分かれる審議となった。委員長報告のとおり原案どおり可決され、令和7年10月1日に施行されている。",
    summaryEasy:
      "お客さんから店員や職員へのひどい迷惑行為(カスタマーハラスメント)を防ぐためのルールを愛知県として新しく作る条例です。令和7年6月定例議会に提出され、7月8日に可決・成立、同年10月1日から施行されました。",
    summaryDetailed:
      "カスタマーハラスメントが働く人の尊厳を傷つけ、企業の生産性を低下させているという問題意識のもと、県・事業者・働く人・お客さんがそれぞれの立場で防止に取り組む仕組みを定める条例です。経済労働委員会で審査され、本会議では可決に賛成する討論だけでなく反対の立場からの討論も行われるなど、賛否が分かれる審議になりました。具体的にどのような行為が対象になるかなど詳しい内容は、愛知県議会公式サイトで公開されている会議録・審査結果報告書で確認できます。",
    keyPoints: [
      {
        title: "お客さんから店員・職員への迷惑行為(カスタマーハラスメント)を防ぐルールを新設",
        body: "県・事業者・働く人・お客さんそれぞれの立場で防止に取り組む仕組みを定めています。",
      },
      {
        title: "令和7年10月1日から施行",
        body: "可決・成立から一定の準備期間を経て施行されています。",
      },
    ],
    reasons: [
      {
        title: "働く人の尊厳を守り、企業の生産性低下を防ぐため",
        body: "カスタマーハラスメントが働く人の尊厳を傷つけ、企業の生産性を低下させているという問題意識が背景にあります。",
      },
      {
        title: "自動車産業などモノづくり産業の就業者を守るため",
        body: "賛成討論では、自動車産業をはじめとしたモノづくり産業の就業者を守る条例としての意義が述べられました。",
      },
    ],
    debatePoints: [
      {
        topic: "条例で迷惑行為を規制することの是非",
        benefit: "働く人を迷惑行為から守り、安心して働ける環境をつくれます。",
        caution: "本会議では反対の立場から討論を行った議員もおり、規制の範囲や実効性について賛否が分かれました。具体的にどのような行為が対象になるかは公式資料で確認する必要があります。",
      },
    ],
    affectedGroups: [
      { who: "店員・窓口職員など接客・対応業務を行う働く人", effect: "迷惑行為から守られる立場になります。" },
      { who: "事業者", effect: "従業員を守るための対応を求められる可能性があります。" },
      { who: "利用客・消費者", effect: "何が迷惑行為にあたるか、行動の見直しを求められる場合があります。" },
    ],
  },
  {
    id: "aichi-3",
    council: "aichi_pref",
    sessionName: "令和7年6月定例議会",
    billNumber: "第104号",
    name: "令和7年度愛知県一般会計補正予算(第2号)",
    nameFurigana: [
      { text: "令和", reading: "れいわ" },
      { text: "7" },
      { text: "年度", reading: "ねんど" },
      { text: "愛知県", reading: "あいちけん" },
      { text: "一般会計", reading: "いっぱんかいけい" },
      { text: "補正予算", reading: "ほせいよさん" },
      { text: "(" },
      { text: "第", reading: "だい" },
      { text: "2" },
      { text: "号", reading: "ごう" },
      { text: ")" },
    ],
    tags: ["補正予算💰", "財政"],
    thumbnail: { type: "photo", keyword: "finance,office,japan", fallback: "budget" },
    status: "enacted",
    submittedDate: "2025-06-01",
    decidedDate: "2025-07-08",
    sourceUrl: "https://www.pref.aichi.jp/site/gikai/nittei-0706.html#gian",
    minutesText:
      "総務企画・県民環境・福祉医療・経済労働・建設・教育スポーツ・警察の各委員会にまたがって審査され、7月8日の本会議で可決・成立した。",
    summaryEasy:
      "令和7年度の愛知県の予算に、年度の途中で追加のお金の出し入れを加える予算案(補正予算)です。複数の分野にまたがる内容で、令和7年6月定例議会に提出され、7月8日に可決・成立しました。",
    summaryDetailed:
      "当初予算を組んだ後に生じた新しい必要性(国の制度変更や緊急の対応など)に応じて、年度途中で予算を追加・修正するのが補正予算です。この第104号議案は総務企画・県民環境・福祉医療・経済労働・建設・教育スポーツ・警察と、非常に多くの委員会にまたがって審査されており、県政の幅広い分野に関わる内容であることがうかがえます。具体的な追加事業の内容は、愛知県議会公式サイトで公開されている審議資料で確認できます。",
    keyPoints: [
      {
        title: "年度途中で生じた新たな必要性に対応する追加予算",
        body: "当初予算を組んだ後に生じた事情に応じて、年度の途中でお金の出し入れを追加・修正します。",
      },
      {
        title: "非常に多くの委員会にまたがって審査された",
        body: "総務企画・県民環境・福祉医療・経済労働・建設・教育スポーツ・警察と、県政の幅広い分野に関わる内容です。",
      },
    ],
    reasons: [
      {
        title: "当初予算だけでは対応しきれない新しい事情に対応するため",
        body: "国の制度変更や緊急の対応など、年度途中で判明した必要性に応じて予算を追加する必要があります。",
      },
    ],
    debatePoints: [
      {
        topic: "追加予算の使いみちが適切か",
        benefit: "新たに必要になった事業に、年度内に迅速に対応できます。",
        caution: "具体的にどの事業にいくら追加されたかは、この解説だけではわからず、公式の審議資料で確認する必要があります。",
      },
    ],
    affectedGroups: [
      { who: "愛知県民全体", effect: "追加される事業を通じて幅広い分野で影響を受けます。" },
      { who: "関係する多数の県の部局", effect: "追加予算に基づいて新たな事業を実施します。" },
    ],
  },
  {
    id: "aichi-4",
    council: "aichi_pref",
    sessionName: "令和7年6月定例議会",
    billNumber: "第121号",
    name: "愛知県公立大学法人定款の変更について",
    nameFurigana: [
      { text: "愛知県", reading: "あいちけん" },
      { text: "公立大学法人", reading: "こうりつだいがくほうじん" },
      { text: "定款", reading: "ていかん" },
      { text: "の" },
      { text: "変更", reading: "へんこう" },
      { text: "について" },
    ],
    tags: ["組織改革", "教育🏫"],
    thumbnail: { type: "illustration", illustration: "organization" },
    status: "enacted",
    submittedDate: "2025-06-01",
    decidedDate: "2025-07-08",
    sourceUrl: "https://www.pref.aichi.jp/site/gikai/nittei-0706.html#gian",
    minutesText:
      "県民環境委員会に付託され、財産の出資に関する議案(第112号)などとあわせて審査。全員一致で原案どおり可決すべきものと決定され、7月8日の本会議で可決・成立した。",
    summaryEasy:
      "愛知県が設置している公立大学法人(県立大学などを運営する組織)の基本ルール(定款)を変更する議案です。令和7年6月定例議会に提出され、7月8日に可決・成立しました。",
    summaryDetailed:
      "公立大学法人の組織運営の基本を定める「定款」を変更する議案です。県民環境委員会で他の議案とあわせて審査され、全員一致で原案どおり可決すべきものと判断されました。定款のどの部分がどう変わったのかなど詳しい内容は、愛知県議会公式サイトで公開されている委員会審査結果報告書で確認できます。",
    keyPoints: [
      {
        title: "県立大学などを運営する公立大学法人の基本ルール(定款)を変更",
        body: "組織運営の基本を定める定款を見直す議案です。",
      },
      {
        title: "県民環境委員会で全員一致により可決すべきものと判断",
        body: "他の議案とあわせて審査され、委員会では全会一致という結果でした。",
      },
    ],
    reasons: [
      {
        title: "大学法人の運営実態にあわせて定款を見直す必要があるため",
        body: "組織運営のルールは、実態や制度変更にあわせて随時見直す必要があります。",
      },
    ],
    debatePoints: [
      {
        topic: "定款のどの部分がどう変わるのか",
        benefit: "全会一致で可決されており、大きな異論はなかったと考えられます。",
        caution: "定款変更の具体的な内容はこの解説だけではわからず、委員会審査結果報告書などの公式資料で確認する必要があります。",
      },
    ],
    affectedGroups: [
      { who: "公立大学法人が運営する大学の学生・教職員", effect: "組織運営の変更が大学運営に影響する可能性があります。" },
      { who: "愛知県(設置者)", effect: "法人の統治構造の変更に関わります。" },
    ],
  },
  {
    id: "aichi-5",
    council: "aichi_pref",
    sessionName: "令和7年6月定例議会",
    billNumber: "第131号",
    name: "令和7年度愛知県一般会計補正予算(第3号)",
    nameFurigana: [
      { text: "令和", reading: "れいわ" },
      { text: "7" },
      { text: "年度", reading: "ねんど" },
      { text: "愛知県", reading: "あいちけん" },
      { text: "一般会計", reading: "いっぱんかいけい" },
      { text: "補正予算", reading: "ほせいよさん" },
      { text: "(" },
      { text: "第", reading: "だい" },
      { text: "3" },
      { text: "号", reading: "ごう" },
      { text: ")" },
    ],
    tags: ["補正予算💰", "財政"],
    thumbnail: { type: "photo", keyword: "yen,money,japan", fallback: "budget" },
    status: "enacted",
    submittedDate: "2025-06-01",
    decidedDate: "2025-07-08",
    sourceUrl: "https://www.pref.aichi.jp/site/gikai/nittei-0706.html#gian",
    minutesText:
      "総務企画・県民環境・福祉医療・経済労働・農林水産・教育スポーツの各委員会にまたがって審査され、7月8日の本会議で可決・成立した。同じ定例会で第104号議案(補正予算第2号)に続く、2本目の補正予算。",
    summaryEasy:
      "同じ令和7年6月定例議会で提出された、令和7年度愛知県予算に対する2本目の追加予算(補正予算第3号)です。7月8日に可決・成立しました。",
    summaryDetailed:
      "同一の定例会内で第104号議案(補正予算第2号)に続いて提出された、もう一つの補正予算です。総務企画・県民環境・福祉医療・経済労働・農林水産・教育スポーツと複数の委員会にまたがって審査されました。1つの定例会で複数回の補正予算が提出されるのは、審議の過程で追加の対応が必要になった事業が判明した場合などによるものです。具体的な内容は、愛知県議会公式サイトで公開されている審議資料で確認できます。",
    keyPoints: [
      {
        title: "同じ定例会で2本目となる追加予算",
        body: "第104号議案(補正予算第2号)に続き、同じ定例会でもう一つの補正予算が提出されました。",
      },
      {
        title: "総務企画・県民環境・福祉医療・経済労働・農林水産・教育スポーツにまたがる",
        body: "複数の委員会で審査され、7月8日の本会議で可決・成立しました。",
      },
    ],
    reasons: [
      {
        title: "1つの定例会で複数回の補正が必要になったため",
        body: "審議の過程で追加の対応が必要になった事業が判明した場合などに、同じ定例会内でも複数の補正予算が提出されることがあります。",
      },
    ],
    debatePoints: [
      {
        topic: "なぜ同じ定例会で2本目の補正予算が必要だったのか",
        benefit: "年度内に生じた新たな必要性に、迅速に対応できます。",
        caution: "具体的にどの事業が追加されたのかは、この解説だけではわからず、公式の審議資料で確認する必要があります。",
      },
    ],
    affectedGroups: [
      { who: "愛知県民全体", effect: "追加される事業を通じて幅広い分野で影響を受けます。" },
      { who: "関係する県の部局", effect: "追加予算に基づいて事業を実施します。" },
    ],
  },
];

export function getBillsByCouncil(council: CouncilKey): Bill[] {
  return bills.filter((b) => b.council === council);
}

export function getBillById(id: string): Bill | undefined {
  return bills.find((b) => b.id === id);
}
