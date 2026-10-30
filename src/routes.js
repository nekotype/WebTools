import { renderBase64Tool } from "./tools/base64.js";
import { renderClipboardTool } from "./tools/clipboard.js";
import { renderMarkdownTool } from "./tools/markdown.js";
import { renderNetworkTool } from "./tools/network.js";
import { renderTalkTool } from "./tools/talk.js";

export const routes = {
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
      "自分だけのひとりメモを、シンプルな吹き出しで残せます。内容はこのブラウザの localStorage に保存されます。",
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
  clipboard: {
    title: "コピペ帳",
    description:
      "よく使う文字列を localStorage に保存し、一覧からワンクリックでコピーできます。並び替えと削除にも対応します。",
    templateId: "clipboard-template",
    render: renderClipboardTool,
  },
};

export function getRoute(hashValue) {
  const requestedKey = hashValue.replace("#", "") || "markdown";
  const key = routes[requestedKey] ? requestedKey : "markdown";
  return { key, route: routes[key] };
}
