# みらい議会＠愛知・名古屋 の技術スタック図を生成するスクリプト。
# 実行: python3 scripts/architecture-diagram.py
# 出力: docs/architecture.png

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users
from diagrams.programming.framework import React
from diagrams.programming.language import Typescript, Nodejs
from diagrams.gcp.ml import AIPlatform

FONT = "Hiragino Sans"

graph_attr = {
    "fontname": FONT,
    "fontsize": "20",
    "bgcolor": "white",
    "pad": "0.5",
    "nodesep": "0.8",
    "ranksep": "1.3",
}
node_attr = {"fontname": FONT, "fontsize": "12"}
edge_attr = {"fontname": FONT, "fontsize": "11", "color": "#555555"}
cluster_attr = {"fontname": FONT, "fontsize": "14", "margin": "18"}

with Diagram(
    "みらい議会 ＠愛知・名古屋 — 技術スタック",
    filename="docs/architecture",
    outformat="png",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    visitor = Users("閲覧者\nブラウザ")

    with Cluster("Vercel", graph_attr=cluster_attr):
        app = React("Next.js 16 App Router\nReact 19 / TypeScript\nTailwind CSS v4")
        api = Nodejs("/api/chat\nVercel AI SDK")
        data = Typescript("data/bills.ts\n静的データ(DBなし)")

        data >> Edge(style="dashed", label="import") >> app
        data >> Edge(style="dashed") >> api

    gemini = AIPlatform("Google Gemini\ngemini-3.6-flash")

    visitor >> app
    app >> Edge(label="AIチャット") >> api
    api >> Edge(label="議案全文を\nプロンプトに埋込") >> gemini
