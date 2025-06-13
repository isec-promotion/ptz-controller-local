import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import DigestFetch from 'digest-fetch';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '../.env' });

const app = new Hono();

// CORS設定
app.use('/*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
}));

// カメラ設定
const CAMERA_IP = process.env.CAMERA_IP || '192.168.1.100';
const CAMERA_USERNAME = process.env.CAMERA_USERNAME || 'admin';
const CAMERA_PASSWORD = process.env.CAMERA_PASSWORD || 'password123';
const ISAPI_BASE_PATH = process.env.ISAPI_BASE_PATH || '/ISAPI';

// Digest認証クライアント
const digestClient = new DigestFetch(CAMERA_USERNAME, CAMERA_PASSWORD);

// PTZ制御用のXMLテンプレート
const createPTZXML = (pan: number, tilt: number, zoom: number = 0) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PTZData>
  <pan>${pan}</pan>
  <tilt>${tilt}</tilt>
  <zoom>${zoom}</zoom>
</PTZData>`;
};

// PTZ停止用のXMLテンプレート
const createStopXML = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PTZData>
  <pan>0</pan>
  <tilt>0</tilt>
  <zoom>0</zoom>
</PTZData>`;
};

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ 
    message: 'PTZ Control API',
    status: 'running',
    camera_ip: CAMERA_IP 
  });
});

// PTZ移動開始
app.post('/api/ptz/move', async (c) => {
  try {
    const { direction, speed = 50 } = await c.req.json();
    console.log(`[PTZ] Move request: direction=${direction}, speed=${speed}`);
    
    let pan = 0, tilt = 0;
    
    // 方向に応じてPan/Tilt値を設定
    switch (direction) {
      case 'up':
        tilt = speed;
        break;
      case 'down':
        tilt = -speed;
        break;
      case 'left':
        pan = -speed;
        break;
      case 'right':
        pan = speed;
        break;
      case 'up-left':
        pan = -speed;
        tilt = speed;
        break;
      case 'up-right':
        pan = speed;
        tilt = speed;
        break;
      case 'down-left':
        pan = -speed;
        tilt = -speed;
        break;
      case 'down-right':
        pan = speed;
        tilt = -speed;
        break;
      default:
        return c.json({ error: 'Invalid direction' }, 400);
    }

    const xmlPayload = createPTZXML(pan, tilt);
    const url = `http://${CAMERA_IP}${ISAPI_BASE_PATH}/PTZCtrl/channels/1/continuous`;
    
    console.log(`[PTZ] Sending move command: pan=${pan}, tilt=${tilt}`);
    console.log(`[PTZ] URL: ${url}`);
    console.log(`[PTZ] XML payload: ${xmlPayload}`);
    
    const response = await digestClient.fetch(url, {
      method: 'PUT',
      body: xmlPayload,
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    if (response.ok) {
      const responseText = await response.text();
      console.log(`[PTZ] Move command successful: ${direction} (pan=${pan}, tilt=${tilt})`);
      console.log(`[PTZ] Response XML: ${responseText}`);
      return c.json({ 
        success: true, 
        direction, 
        pan, 
        tilt,
        message: 'PTZ movement started',
        response: responseText
      });
    } else {
      const errorText = await response.text();
      console.error(`[PTZ] Move command failed: status=${response.status}, error=${errorText}`);
      return c.json({ 
        error: 'Failed to control PTZ', 
        details: errorText,
        status: response.status 
      }, 500);
    }

  } catch (error) {
    console.error('PTZ control error:', error);
    return c.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// PTZ停止
app.post('/api/ptz/stop', async (c) => {
  try {
    console.log('[PTZ] Stop request received');
    const xmlPayload = createStopXML();
    const url = `http://${CAMERA_IP}${ISAPI_BASE_PATH}/PTZCtrl/channels/1/continuous`;
    
    console.log(`[PTZ] Sending stop command`);
    console.log(`[PTZ] URL: ${url}`);
    console.log(`[PTZ] XML payload: ${xmlPayload}`);
    
    const response = await digestClient.fetch(url, {
      method: 'PUT',
      body: xmlPayload,
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    if (response.ok) {
      const responseText = await response.text();
      console.log('[PTZ] Stop command successful');
      console.log(`[PTZ] Response XML: ${responseText}`);
      return c.json({ 
        success: true, 
        message: 'PTZ movement stopped',
        response: responseText
      });
    } else {
      const errorText = await response.text();
      console.error(`[PTZ] Stop command failed: status=${response.status}, error=${errorText}`);
      return c.json({ 
        error: 'Failed to stop PTZ', 
        details: errorText,
        status: response.status 
      }, 500);
    }

  } catch (error) {
    console.error('PTZ stop error:', error);
    return c.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// プリセット位置に移動（中央リセット）
app.post('/api/ptz/preset', async (c) => {
  try {
    const { presetId = 34 } = await c.req.json(); // デフォルトを34（Back to origin）に変更
    console.log(`[PTZ] Preset request: presetId=${presetId}`);
    
    const url = `http://${CAMERA_IP}${ISAPI_BASE_PATH}/PTZCtrl/channels/1/presets/${presetId}/goto`;
    
    console.log(`[PTZ] Sending preset command: presetId=${presetId}`);
    console.log(`[PTZ] URL: ${url}`);
    
    const response = await digestClient.fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    if (response.ok) {
      const responseText = await response.text();
      console.log(`[PTZ] Preset command successful: moved to preset ${presetId}`);
      console.log(`[PTZ] Response XML: ${responseText}`);
      return c.json({ 
        success: true, 
        presetId,
        message: 'Moved to preset position',
        response: responseText
      });
    } else {
      const errorText = await response.text();
      console.error(`[PTZ] Preset command failed: status=${response.status}, error=${errorText}`);
      return c.json({ 
        error: 'Failed to move to preset', 
        details: errorText,
        status: response.status 
      }, 500);
    }

  } catch (error) {
    console.error('Preset movement error:', error);
    return c.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// プリセット一覧を取得
app.get('/api/ptz/presets', async (c) => {
  try {
    console.log('[PTZ] Getting preset list');
    const url = `http://${CAMERA_IP}${ISAPI_BASE_PATH}/PTZCtrl/channels/1/presets`;
    
    console.log(`[PTZ] URL: ${url}`);
    
    const response = await digestClient.fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    if (response.ok) {
      const responseText = await response.text();
      console.log('[PTZ] Preset list retrieved successfully');
      return c.json({ 
        success: true, 
        presets: responseText,
        message: 'Preset list retrieved'
      });
    } else {
      const errorText = await response.text();
      console.error(`[PTZ] Failed to get preset list: status=${response.status}, error=${errorText}`);
      return c.json({ 
        error: 'Failed to get preset list', 
        details: errorText,
        status: response.status 
      }, 500);
    }

  } catch (error) {
    console.error('Get preset list error:', error);
    return c.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// MJPEGストリームプロキシ
app.get('/api/stream', async (c) => {
  try {
    const streamPath = process.env.MJPEG_STREAM_PATH || '/Streaming/channels/101/httppreview';
    const streamUrl = `http://${CAMERA_IP}${streamPath}`;
    
    const response = await digestClient.fetch(streamUrl);
    
    if (response.ok) {
      // ストリームをそのまま転送
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:5173',
        },
      });
    } else {
      return c.json({ error: 'Failed to access camera stream' }, 500);
    }

  } catch (error) {
    console.error('Stream proxy error:', error);
    return c.json({ 
      error: 'Stream proxy error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

const port = parseInt(process.env.BACKEND_PORT || '3001');

console.log(`[SERVER] PTZ Control API server starting on port ${port}`);
console.log(`[CONFIG] Camera IP: ${CAMERA_IP}`);
console.log(`[CONFIG] Camera User: ${CAMERA_USERNAME}`);
console.log(`[CONFIG] ISAPI Base Path: ${ISAPI_BASE_PATH}`);

serve({
  fetch: app.fetch,
  port: port,
});

console.log(`[SERVER] Server is running on http://localhost:${port}`);
