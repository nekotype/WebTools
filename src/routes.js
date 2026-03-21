import { renderBase64Tool } from "./tools/base64.js";
import { renderMarkdownTool } from "./tools/markdown.js";
import { renderNetworkTool } from "./tools/network.js";
import { renderStockTool } from "./tools/stock.js";
import { renderTalkTool } from "./tools/talk.js";

export const routes = {
  stock: {
    title: "株価取得",
    description:
      "証券コードを入力して、指定日の終値を一覧表示します。Excel に貼り付けやすい形式でまとめてコピーできます。",
    templateId: "stock-template",
    render: renderStockTool,
  },
  markdown: {
    title: "Excel→Markdown",
    description:
      "Excel から貼り付けた表を Markdown のテーブルへ変換します。GitHub やメモ用にそのままコピーできます。",
    templateId: "markdown-template",
    render: renderMarkdownTool,
  },
  network: {
    title: "接続情報",
    description:
      "グローバルIP、推定地域、ブラウザや画面情報をまとめて表示します。確認君のように、そのままコピーできます。",
    templateId: "network-template",
    render: renderNetworkTool,
  },
  talk: {
    title: "つぶやき",
    description:
      "自分だけのひとりメモを、LINE風の吹き出しで残せます。内容はこのブラウザの localStorage に保存されます。",
    templateId: "talk-template",
    render: renderTalkTool,
  },
  base64: {
    title: "Base64変換",
    description:
      "文字列の Base64 エンコードとデコードをすばやく行えます。UTF-8テキストにも対応します。",
    templateId: "base64-template",
    render: renderBase64Tool,
  },
};

export function getRoute(hashValue) {
  const requestedKey = hashValue.replace("#", "") || "stock";
  const key = routes[requestedKey] ? requestedKey : "stock";
  return { key, route: routes[key] };
}
