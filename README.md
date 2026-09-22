# 湯気 - YUGE Sauna & Spa 神田 10周年記念LP

静的HTML/CSS/JavaScriptで実装したSP向けLPです。予約フォームはトップページ内に埋め込み、Google Apps Script（GAS）のWebアプリへ送信する構成です。

## 起動
`lp_yuge/index.html` をWebサーバー経由で開いてください。ZIPのまま開かず、必ず展開してから確認してください。

ローカルでは、例として `python -m http.server 8000` を `lp_yuge` ディレクトリで実行し、`http://localhost:8000/` を開きます。

## GAS設定
1. `gas/Code.gs` をGoogle Apps Scriptへ貼り付ける
2. Webアプリとしてデプロイ
3. 発行URLを `js/reservation.js` の `GAS_CONFIG.endpoint` に設定

予約フォームは現在、GAS Webアプリへの送信、Googleスプレッドシートへの予約内容保存、予約受付メール通知まで実装済みです。

## 本番公開URL・SEO設定
- 公開URL：`https://yuge-sauna.jp/10th/`
- canonical：`https://yuge-sauna.jp/10th/`
- OGP URL：`https://yuge-sauna.jp/10th/`
- OGP画像：`https://yuge-sauna.jp/10th/images/hero/exterior.jpg`
- キャンペーン予約可能期間：2025年11月1日〜12月15日


## v4 touch feedback
- Primary CTA buttons darken clearly on touch.
- Pressed state includes a subtle 0.98x compression and inset shadow.
- Secondary CTA buttons use a softer pressed state.
- Pointer events are used in addition to `:active` so mobile browsers receive reliable visual feedback.


### v5 readability / selection / headings
- Mobile information text was slightly enlarged for readability while keeping CTA hierarchy intact.
- Section headings are centered for clearer section boundaries.
- Reservation plan choices now show a clear selected state (background + border + bold label).

## 予約フォーム実装状況（2026-09-17更新）

- GASへの予約データ送信
- Googleスプレッドシートへの予約内容保存
- 予約受付メール通知
- 必須項目・電話番号・メールアドレスのバリデーション
- 項目ごとのエラーメッセージ表示
- プラン別の予約条件
  - 10周年パック：人数制限なし／07:00〜23:00
  - ペア割：2名固定／07:00〜23:00
  - 朝活ととのい：人数制限なし／07:00〜10:00
- 法務ページの共通CSSを `css/legal.css` に分離
- 予約フォームのエラーメッセージをARIA属性で関連付け
