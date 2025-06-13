import { WebSocketServer } from 'ws';
import ffmpeg from 'fluent-ffmpeg';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '../.env' });

const WS_PORT = parseInt(process.env.STREAM_WS_PORT || '8080');
const CAMERA_IP = process.env.CAMERA_IP || '192.168.1.100';
const CAMERA_USERNAME = process.env.CAMERA_USERNAME || 'admin';
const CAMERA_PASSWORD = process.env.CAMERA_PASSWORD || 'password123';

// RTSPストリームURL
const RTSP_URL = `rtsp://${CAMERA_USERNAME}:${CAMERA_PASSWORD}@${CAMERA_IP}:554/ISAPI/Streaming/channels/101`;

console.log(`[STREAM] Starting WebSocket stream server on port ${WS_PORT}`);
console.log(`[STREAM] RTSP URL: ${RTSP_URL}`);

// WebSocketサーバーを作成
const wss = new WebSocketServer({ port: WS_PORT });

let ffmpegProcess: any = null;
let activeConnections = 0;

// FFmpegプロセスを開始
const startFFmpegStream = () => {
  if (ffmpegProcess) {
    console.log('[STREAM] FFmpeg process already running');
    return;
  }

  console.log('[STREAM] Starting FFmpeg process...');

  // FFmpegコマンドでRTSPをMJPEGストリームに変換
  ffmpegProcess = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-i', RTSP_URL,
    '-f', 'mjpeg',
    '-q:v', '3',
    '-r', '15', // 15fps
    '-s', '640x480', // 解像度
    '-'
  ], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  ffmpegProcess.stdout.on('data', (data: Buffer) => {
    // MJPEGデータをすべてのWebSocketクライアントに送信
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    });
  });

  ffmpegProcess.stderr.on('data', (data: Buffer) => {
    console.log(`[STREAM] FFmpeg stderr: ${data.toString()}`);
  });

  ffmpegProcess.on('close', (code: number) => {
    console.log(`[STREAM] FFmpeg process exited with code ${code}`);
    ffmpegProcess = null;
    
    // 接続があれば再起動を試行
    if (activeConnections > 0) {
      setTimeout(() => {
        console.log('[STREAM] Restarting FFmpeg process...');
        startFFmpegStream();
      }, 3000);
    }
  });

  ffmpegProcess.on('error', (error: Error) => {
    console.error('[STREAM] FFmpeg process error:', error);
    ffmpegProcess = null;
  });
};

// FFmpegプロセスを停止
const stopFFmpegStream = () => {
  if (ffmpegProcess) {
    console.log('[STREAM] Stopping FFmpeg process...');
    ffmpegProcess.kill('SIGTERM');
    ffmpegProcess = null;
  }
};

// WebSocket接続処理
wss.on('connection', (ws) => {
  activeConnections++;
  console.log(`[STREAM] Client connected. Active connections: ${activeConnections}`);

  // 最初の接続でFFmpegを開始
  if (activeConnections === 1) {
    startFFmpegStream();
  }

  ws.on('close', () => {
    activeConnections--;
    console.log(`[STREAM] Client disconnected. Active connections: ${activeConnections}`);

    // 接続がなくなったらFFmpegを停止
    if (activeConnections === 0) {
      setTimeout(() => {
        if (activeConnections === 0) {
          stopFFmpegStream();
        }
      }, 5000); // 5秒後に停止（再接続の猶予）
    }
  });

  ws.on('error', (error) => {
    console.error('[STREAM] WebSocket error:', error);
  });

  // 接続確認メッセージを送信
  ws.send(JSON.stringify({
    type: 'status',
    message: 'Connected to stream server',
    timestamp: new Date().toISOString()
  }));
});

// サーバー終了時のクリーンアップ
process.on('SIGINT', () => {
  console.log('[STREAM] Shutting down stream server...');
  stopFFmpegStream();
  wss.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[STREAM] Shutting down stream server...');
  stopFFmpegStream();
  wss.close();
  process.exit(0);
});

console.log(`[STREAM] WebSocket stream server is running on ws://localhost:${WS_PORT}`);
