# Utopia Uptime Page

Languages: [English](README_en.md) | [简体中文](README_zh_CN.md) | [繁體中文](README_zh_TW.md) | **日本語**

ウェブサイトの可用性を監視するダッシュボードのフロントエンドです。[Uptime Robot](https://uptimerobot.com/) と [Uptime Kuma](https://uptimekuma.org/) をサポートし、完全に静的なデプロイが可能です。  
[DEMO](https://status.utopiaxc.cn/) はデモサイトです。

## 1. 機能
- **複数ソースの統合**: 複数の Uptime Robot アカウントや Uptime Kuma インスタンスからの監視項目を1つのダッシュボードに集約します。
- **ビジュアル設定ジェネレーター**: コードを一切触らずに設定ファイルを作成できるビジュアルジェネレーター（`config-generator.html`）を内蔵しています。
- **Kuma 多機能データベーススクリプト**: Kuma の CORS 問題を解決し、Kuma のデータベースから直接長期間の履歴データを取得するための Python FastAPI ブリッジ（`Utopia Kuma Server`）がオプションとして付属しています。
- **i18n サポート**: 英語、簡体字中国語、繁体字中国語、および日本語をネイティブにサポートしています。

![Utopia Uptime Page Dashboard](./assets/demo.png)

## 2. デプロイ

### 2.1 フロントエンドのデプロイ
1. [Releases](https://github.com/UtopiaXC/UtopiaUptimePage/releases) ページから最新のコンパイル済みディストリビューションをダウンロードします。
2. 展開し、`/dist` フォルダを任意の静的Webサーバー (Nginx, Vercel, GitHub Pages) でホストします。

### 2.2 config の生成と設定
1. ブラウザで `<あなたのドメイン>/config-generator.html` を開きます。
2. 画面の指示に従って設定を生成します。
3. 生成された結果を `config.js` として保存し、ルートディレクトリに配置します。

### 2.3 Utopia Kuma Server (オプション)
このオプションサーバーは、Uptime Kuma インスタンスのブリッジとして機能するように設計されています。パブリック API へのリクエスト時の CORS 問題を解決し、データベースモードで実行されている場合は、Kuma のデータベースを直接読み取ります。これにより、デフォルトの 100 件のハートビート制限が回避され、ダッシュボードで長期間 (例: 7 日以上) の可用性データを表示できるようになります。

#### 2.3.1 直接実行
最初に `.env.example` を `.env` にコピーして、環境変数を設定してください。
```bash
cd server
pip install -r requirements.txt
python server.py
```

#### 2.3.2 docker 実行
ローカルでのビルドは不要です。事前にビルドされたイメージをプルして、Kuma のデータディレクトリをマウントするだけです：
```bash
docker run -d \
  --name utopia-server \
  -p 55520:55520 \
  -v /あなたの/uptime-kuma/data/ディレクトリ:/data \
  utopiaxc1025/utopia-kuma-server
```

## 3. 謝辞
優れた監視サービスを提供している [Uptime Robot](https://uptimerobot.com/) と [Uptime Kuma](https://uptimekuma.org/) に感謝いたします。
また、UI とコンセプトの一部を参考にさせていただいた [Kuma Mieru](https://github.com/alice39s/kuma-mieru) プロジェクトにも感謝の意を表します。

## 4. 免責事項
このプロジェクトは、MIT ライセンスの下でオープンソース化されています。
このプロジェクトは、Antigravity、Claude Opus、および Gemini Pro を使用して「vibe」コーディングで開発されました。

## 5. 寄付
いかなる手段や経路を通じても、このプロジェクトにお金を払わないでください。
もしこのプロジェクトに寄付をしたい場合は、慈善団体やオープンソース・イニシアティヴ（OSI）に寄付していただければ幸いです。

---
*このドキュメントは Gemini 3.1 Pro によって生成されました。*
