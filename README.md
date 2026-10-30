# Web Tools

GitHub Pages で動かせる、シンプルな業務用ツール集です。

## 含まれているツール

- 接続情報
  - グローバルIP(IPv4/IPv6)、推定地域、ネットワーク情報、ブラウザ情報を表示
  - 確認君のような接続確認用途を想定
- Excel→MarkDown
  - Excel から貼り付けたタブ区切りデータを Markdown テーブルへ変換
- Base64変換
  - 文字列を Base64 へエンコード、または Base64 からデコードできる
  - UTF-8の日本語テキストや改行を含む入力に対応
- コピペ帳
  - よく使う文字列を `localStorage` に保存して一覧化できる
  - 一覧からワンクリックでコピー可能
  - ドラッグ＆ドロップによる並び替えと削除に対応
- つぶやき
  - シンプルな吹き出しで、自分だけのメッセージを残せる
  - 内容は `localStorage` に保存され、リロード後も残る
  - 個別削除と全クリアに対応

## 関連リンク

ツールメニューの下を区切り、次のリンクを表示します。スマホでもドロップダウンの下に表示します。

- [フラッシュ画像記憶](https://nekotype.github.io/AfterImage)
- [フラッシュ暗算](https://nekotype.github.io/MentalMath)

## 配置

静的ファイルのみで構成しています。

- `index.html`
- `styles.css`
- `app.js`
- `src/`
  - ルーティング、メニュー制御、各ツール処理を分割

このままリポジトリのルートに置いて GitHub Pages を有効化すれば公開できます。

画面は白・グレー・黒を基調としたシンプルな配色です。初期表示は「Excel→MarkDown」で、旧株価取得ページへのリンクもこの画面に切り替わります。

スマホではメニューをドロップダウン表示に切り替え、PCでは従来の縦並びメニューを表示します。

公開URL:

- `https://nekotype.github.io/WebTools/`

## 接続情報について

接続情報ページは GitHub Pages 上で動作するよう、外部APIからグローバルIPと地域情報を取得しています。

- IPv4: `ipv4.icanhazip.com`
- 地域情報とIPv6: `get.geojs.io`

取得先の応答状況によっては、一部項目だけ表示されることがあります。

## Google Analytics 4

- 測定ID: `G-LGYK0YFJ6L`
- `src/analytics.js` で Google タグを非同期に一度だけ読み込みます。別の場所に同じタグや GTM の GA4 タグを追加しないでください。
- 全5画面の初期表示・直接アクセス・画面切り替え・戻る／進むで、描画後に `page_view` を送信します。同じ解決済みルートの連続表示は送信しません。
- `page_location` は `#markdown` などの解決済みルートを含むURL、`page_title` はツール名、`page_referrer` は直前の画面URL（初回はブラウザの参照元）です。未指定・不明・旧 `#stock` は `#markdown` として集計します。
- 自動の初回送信は `send_page_view: false` で停止し、手動送信に統一しています。ツールの入力内容や保存データをイベントに追加しません。

### 公開時に必要なGA4側の設定

GA4 の「管理 → データ ストリーム → 対象のウェブストリーム → 拡張計測機能の歯車 → ページビュー → 詳細設定」で、**「ブラウザの履歴イベントに基づくページの変更」をオフ**にして保存してください。`send_page_view: false` だけでは拡張計測機能の履歴による自動送信は止まらないため、二重計測を防ぐために必要です。この管理画面の設定はリポジトリから変更できません。

GitHub Pages への公開後、GA4 のリアルタイムまたは DebugView（Tag Assistant 接続時）で、初回表示・各メニュー・戻る／進むの各画面表示につき `page_view` が1件であることを確認してください。同じメニューの再選択では増えません。ブラウザの開発者ツールでは `g/collect` リクエストの `tid=G-LGYK0YFJ6L`、`en=page_view`、`dl` のルートも確認できます。広告ブロッカーなどで Google タグが遮断される環境では計測されませんが、ツールは引き続き利用できます。

参照: [Google公式のページビュー計測](https://developers.google.com/analytics/devguides/collection/ga4/views)、[SPA計測](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications)。
