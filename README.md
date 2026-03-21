# Web Tools

GitHub Pages で動かせる、シンプルな業務用ツール集です。

## 含まれているツール

- 株価取得
  - 証券コードを入力して、指定日の終値を一覧表示
  - 各行コピーと一覧コピーに対応
- Excel→Markdown
  - Excel から貼り付けたタブ区切りデータを Markdown テーブルへ変換

## 配置

静的ファイルのみで構成しています。

- `index.html`
- `styles.css`
- `app.js`

このままリポジトリのルートに置いて GitHub Pages を有効化すれば公開できます。

## 株価取得について

株価取得は `Stooq` の日足データを参照しています。クライアントサイドのみで動かすため、`app.js` では `r.jina.ai` 経由でテキスト取得しています。

もし GitHub Pages 上で取得制限が出る場合は、`fetchStockHistory()` 内の取得先URLを別の取得元へ差し替えてください。
