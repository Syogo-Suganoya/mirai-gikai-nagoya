# みらい議会＠愛知・名古屋 のアーキテクチャ図を生成するスクリプト。
# 実行: /Library/Developer/CommandLineTools/usr/bin/python3 scripts/architecture-diagram.py
# 出力: docs/architecture.png

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users
from diagrams.onprem.network import Internet
from diagrams.programming.framework import React
from diagrams.programming.language import Typescript, Nodejs
from diagrams.gcp.ml import AIPlatform
from diagrams.generic.storage import Storage
from diagrams.generic.blank import Blank

FONT = "Hiragino Sans"

graph_attr = {
    "fontname": FONT,
    "fontsize": "20",
    "bgcolor": "white",
    "splines": "ortho",
    "pad": "0.6",
    "nodesep": "0.5",
    "ranksep": "1.1",
    "compound": "true",
}
node_attr = {"fontname": FONT, "fontsize": "11"}
edge_attr = {"fontname": FONT, "fontsize": "10", "color": "#555555"}
cluster_attr = {"fontname": FONT, "fontsize": "13", "margin": "16"}

with Diagram(
    "みらい議会 ＠愛知・名古屋 — アーキテクチャ",
    filename="docs/architecture",
    outformat="png",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    # ── ① データ整備(オフライン・手作業) ────────────────────────────
    with Cluster("① データ整備(オフライン / 手作業・自動収集なし)", graph_attr=cluster_attr):
        sources = Internet("議案一覧ページ / 会議録検索\nkaigiroku.net・pref.aichi.dbsr.jp")
        furigana_script = Nodejs("npm run generate:furigana\nkuromoji 形態素解析")
        sources >> Edge(label="件名で検索しヒットした\n議案だけを手で執筆") >> furigana_script

    # ── ② 静的データ(DBなし) ────────────────────────────────────
    with Cluster("② 静的データ(DBなし・ビルド時 import)", graph_attr=cluster_attr):
        bills_data = Typescript("data/bills.ts\n議案10件(愛知5 / 名古屋5)\n解説・会議録・詳細セクション")
        councils_data = Typescript("data/councils.ts")
        furigana_data = Storage("explanation-furigana\n.generated.ts")

    furigana_script >> Edge(label="生成") >> furigana_data
    sources >> Edge(style="dashed", label="転記") >> bills_data

    # ── ③ Next.js アプリ ────────────────────────────────────────
    with Cluster("③ Vercel / Next.js 16 App Router(単一アプリ)", graph_attr=cluster_attr):
        with Cluster("Server Components", graph_attr=cluster_attr):
            top_page = React("app/page.tsx\n議案一覧")
            detail_page = React("app/bills/[id]/page.tsx\n議案詳細\n🎯ポイント ✏️理由 👀論点 🙋影響")

        with Cluster("Client Components", graph_attr=cluster_attr):
            providers = React("layout.tsx + Context\nかんたん/くわしい・ふりがな切替")
            chat_widget = React("chat-widget.tsx\nAIチャットUI")

        chat_api = Nodejs("POST /api/chat\nVercel AI SDK\n議案全文をシステムプロンプトに埋込\n(ベクトルRAGなし)")

    bills_data >> Edge(style="dashed") >> top_page
    bills_data >> Edge(style="dashed") >> detail_page
    councils_data >> Edge(style="dashed") >> detail_page
    furigana_data >> Edge(style="dashed", label="ルビ") >> detail_page
    bills_data >> Edge(style="dashed", label="全文") >> chat_api

    top_page >> Edge(style="dotted") >> providers
    detail_page >> Edge(style="dotted") >> providers
    providers >> Edge(style="dotted") >> chat_widget
    chat_widget >> Edge(label="fetch { billId?, messages }") >> chat_api

    # ── ④ 外部サービス・利用者 ──────────────────────────────────
    with Cluster("④ 外部サービス", graph_attr=cluster_attr):
        gemini = AIPlatform("Google Gemini\ngemini-2.5-flash")
        photos = Storage("loremflickr.com\n愛知県議案のサムネ写真")

    visitor = Users("閲覧者(ブラウザ)")

    chat_api >> Edge(label="generateText") >> gemini
    detail_page >> Edge(style="dotted", label="img src") >> photos
    gemini >> Edge(style="dotted", label="回答") >> visitor
    providers >> Edge(label="HTML / RSC") >> visitor
