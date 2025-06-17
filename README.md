# PTZカメラ制御システム

ISAPI対応のPTZカメラをWebブラウザから制御するためのシステムです。リアルタイムでライブ映像を表示し、直感的なボタン操作でカメラのPan/Tilt/Zoom制御が可能です。

## 機能

- **ライブ映像表示**: RTSPストリームをWebブラウザで表示
- **PTZ制御**: 8方向の移動制御（上下左右、斜め移動）
- **プリセット機能**: ワンクリックで原点位置に復帰
- **リアルタイム制御**: ボタンを押している間だけカメラが移動
- **レスポンシブデザイン**: PC・タブレット・スマートフォン対応
- **接続状態表示**: カメラとの接続状況をリアルタイム表示

## システム構成

```
ptz-controller/
├── backend/          # Node.js + TypeScript APIサーバー
│   ├── index.ts      # PTZ制御API（Hono）
│   ├── stream-server.ts  # RTSPストリーミングサーバー
│   └── package.json
├── frontend/         # React + TypeScript Webアプリ
│   ├── src/
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── PTZControls.tsx      # PTZ制御パネル
│   │       └── RTSPVideoPlayer.tsx  # 映像表示コンポーネント
│   └── package.json
└── .env             # 環境設定ファイル
```

## 技術スタック

### Backend
- **Node.js** + **TypeScript**
- **Hono** - 高速なWebフレームワーク
- **WebSocket** - リアルタイム映像配信
- **FFmpeg** - RTSPストリーム変換
- **Digest認証** - ISAPIカメラ認証

### Frontend
- **React** + **TypeScript**
- **Vite** - 高速ビルドツール
- **Tailwind CSS** - ユーティリティファーストCSS
- **Canvas API** - 映像描画

## セットアップ

### 前提条件

- Node.js 18以上
- FFmpeg（システムにインストール済み）
- ISAPI対応のPTZカメラ

### 1. リポジトリのクローン

```bash
git clone https://github.com/isec-promotion/ptz-controller-local.git
cd ptz-controller-local
```

### 2. 環境設定

プロジェクトルートに `.env` ファイルを作成：

```env
# カメラ設定
CAMERA_IP=192.168.1.100
CAMERA_USERNAME=admin
CAMERA_PASSWORD=your_password

# サーバー設定
BACKEND_PORT=3001
STREAM_WS_PORT=8080
CORS_ORIGIN=http://localhost:5173

# ISAPI設定
ISAPI_BASE_PATH=/ISAPI
MJPEG_STREAM_PATH=/Streaming/channels/101/httppreview
```

### 3. 依存関係のインストール

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. アプリケーションの起動

#### 開発環境

```bash
# Backend（2つのサーバーを同時起動）
cd backend
npm run dev:all

# Frontend（別ターミナル）
cd frontend
npm run dev
```

#### 本番環境

```bash
# Backend ビルド
cd backend
npm run build
npm start

# Frontend ビルド
cd frontend
npm run build
npm run preview
```

## 使用方法

1. ブラウザで `http://localhost:5173` にアクセス
2. ライブ映像が表示されることを確認
3. PTZ制御パネルの方向ボタンでカメラを操作
4. 中央の「⌂」ボタンでプリセット位置に復帰

### 操作方法

- **方向ボタン**: マウスダウン/タッチで移動開始、リリースで停止
- **中央ボタン**: クリックでプリセット位置（原点）に移動
- **接続状態**: 緑（接続中）、黄（接続試行中）、赤（未接続）

## API仕様

### PTZ制御API

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/ptz/move` | POST | PTZ移動開始 |
| `/api/ptz/stop` | POST | PTZ移動停止 |
| `/api/ptz/preset` | POST | プリセット位置に移動 |
| `/api/ptz/presets` | GET | プリセット一覧取得 |
| `/api/stream` | GET | MJPEGストリーム |

### リクエスト例

```javascript
// PTZ移動
POST /api/ptz/move
{
  "direction": "up",
  "speed": 50
}

// プリセット移動
POST /api/ptz/preset
{
  "presetId": 34
}
```

## 対応カメラ

ISAPI（Internet Server Application Programming Interface）に対応したPTZカメラ：

- Hikvision製PTZカメラ
- Dahua製PTZカメラ（ISAPI互換）
- その他ISAPI対応カメラ

## トラブルシューティング

### 映像が表示されない

1. カメラのIPアドレス、認証情報を確認
2. RTSPストリームが有効か確認
3. FFmpegがインストールされているか確認
4. ファイアウォール設定を確認

### PTZ制御が効かない

1. カメラのISAPI機能が有効か確認
2. 認証情報が正しいか確認
3. カメラのPTZ機能が有効か確認
4. ネットワーク接続を確認

### パフォーマンス問題

1. FFmpegの解像度・フレームレート設定を調整
2. ネットワーク帯域幅を確認
3. ブラウザのハードウェアアクセラレーションを有効化

## 開発

### 開発サーバーの起動

```bash
# Backend開発サーバー
cd backend
npm run dev

# ストリーミングサーバー
npm run stream

# Frontend開発サーバー
cd frontend
npm run dev
```

### ビルド

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。

## 作者

- GitHub: [@isec-promotion](https://github.com/isec-promotion/)
