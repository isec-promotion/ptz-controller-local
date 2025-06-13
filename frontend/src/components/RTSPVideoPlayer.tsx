import React, { useEffect, useRef, useState } from 'react';

interface RTSPVideoPlayerProps {
  className?: string;
}

const RTSPVideoPlayer: React.FC<RTSPVideoPlayerProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetriesReached, setMaxRetriesReached] = useState(false);

  const WS_URL = 'ws://localhost:8080';
  const MAX_RETRIES = 5;

  const connectToStream = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // 最大再試行回数に達している場合は接続しない
    if (maxRetriesReached && retryCount >= MAX_RETRIES) {
      console.log('[VIDEO] Max retries reached, not attempting connection');
      setConnectionStatus('error');
      return;
    }

    setConnectionStatus('connecting');
    console.log('[VIDEO] Connecting to WebSocket stream:', WS_URL);

    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('[VIDEO] WebSocket connected');
        setConnectionStatus('connected');
        setRetryCount(0);
        setMaxRetriesReached(false);
      };

      wsRef.current.onmessage = (event) => {
        if (event.data instanceof Blob) {
          // MJPEGフレームを受信してCanvasに描画
          const blob = event.data;
          const url = URL.createObjectURL(blob);
          const img = new Image();
          
          img.onload = () => {
            if (canvasRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // キャンバスサイズを画像に合わせて調整
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
              }
            }
            URL.revokeObjectURL(url);
          };
          
          img.src = url;
        } else if (typeof event.data === 'string') {
          // ステータスメッセージを処理
          try {
            const message = JSON.parse(event.data);
            console.log('[VIDEO] Status message:', message);
          } catch (e) {
            console.log('[VIDEO] Text message:', event.data);
          }
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('[VIDEO] WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // 自動再接続（最大5回まで）
        if (retryCount < MAX_RETRIES && !maxRetriesReached) {
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);
          
          if (newRetryCount >= MAX_RETRIES) {
            setMaxRetriesReached(true);
            setConnectionStatus('error');
            console.log('[VIDEO] Max retries reached, stopping automatic reconnection');
          } else {
            setTimeout(() => {
              connectToStream();
            }, 2000 * newRetryCount); // 段階的な遅延
          }
        } else {
          setConnectionStatus('error');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('[VIDEO] WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('[VIDEO] WebSocket connection failed:', error);
      setConnectionStatus('error');
    }
  };

  useEffect(() => {
    connectToStream();

    return () => {
      // クリーンアップ
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleManualReconnect = () => {
    console.log('[VIDEO] Manual reconnect triggered');
    setRetryCount(0);
    setMaxRetriesReached(false);
    connectToStream();
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'ライブ配信中';
      case 'connecting': return '接続中...';
      case 'error': return '接続エラー';
      default: return '未接続';
    }
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* ステータス表示 */}
      <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
        <span className={getStatusColor()}>{getStatusText()}</span>
        {retryCount > 0 && (
          <span className="ml-2 text-gray-300">
            (再接続: {retryCount}/5)
          </span>
        )}
      </div>

      {/* 再接続ボタン */}
      {(connectionStatus === 'error' || (connectionStatus === 'disconnected' && maxRetriesReached)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="text-center text-white">
            <p className="mb-4">映像ストリームに接続できません</p>
            <p className="mb-4 text-sm text-gray-300">
              {maxRetriesReached ? `自動再接続を${MAX_RETRIES}回試行しました` : '接続エラーが発生しました'}
            </p>
            <button
              onClick={handleManualReconnect}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              再接続
            </button>
          </div>
        </div>
      )}

      {/* ビデオストリーム */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        style={{ aspectRatio: '4/3' }}
      />

      {/* ローディング状態 */}
      {connectionStatus === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
          <div className="animate-pulse text-white">
            📹 ストリームに接続中...
          </div>
        </div>
      )}
    </div>
  );
};

export default RTSPVideoPlayer;
