import React, { useState, useRef, useCallback } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';

const PTZControls: React.FC = () => {
  const [isMoving, setIsMoving] = useState<Direction | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const moveIntervalRef = useRef<number | null>(null);

  const API_BASE_URL = 'http://localhost:3001';

  // PTZ制御API呼び出し
  const callPTZAPI = useCallback(async (endpoint: string, data?: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ptz/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`PTZ API error (${endpoint}):`, error);
      throw error;
    }
  }, []);

  // PTZ移動開始
  const startMovement = useCallback(async (direction: Direction) => {
    if (isMoving) return;

    setIsMoving(direction);
    setConnectionStatus('connecting');

    try {
      await callPTZAPI('move', { direction, speed: 50 });
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('disconnected');
      setIsMoving(null);
    }
  }, [isMoving, callPTZAPI]);

  // PTZ移動停止
  const stopMovement = useCallback(async () => {
    if (!isMoving) return;

    try {
      await callPTZAPI('stop');
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('disconnected');
    } finally {
      setIsMoving(null);
    }
  }, [isMoving, callPTZAPI]);

  // プリセット位置に移動（中央リセット）
  const moveToPreset = useCallback(async () => {
    setConnectionStatus('connecting');
    try {
      await callPTZAPI('preset', { presetId: 34 }); // ID 34 (Back to origin) を使用
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  }, [callPTZAPI]);

  // ボタンのスタイル設定
  const getButtonClass = (direction?: Direction) => {
    const baseClass = "w-12 h-12 rounded-lg font-bold text-white transition-all duration-150 select-none";
    const isActive = direction && isMoving === direction;
    
    if (isActive) {
      return `${baseClass} bg-blue-600 shadow-lg transform scale-95`;
    }
    
    return `${baseClass} bg-gray-600 hover:bg-gray-500 active:bg-blue-600 active:transform active:scale-95 shadow-md`;
  };

  const getCenterButtonClass = () => {
    const baseClass = "w-16 h-16 rounded-full font-bold text-white transition-all duration-150 select-none";
    return `${baseClass} bg-red-600 hover:bg-red-500 active:bg-red-700 active:transform active:scale-95 shadow-md`;
  };

  // 接続状態のインジケーター
  const getConnectionIndicator = () => {
    switch (connectionStatus) {
      case 'connected':
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      case 'connecting':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>;
      case 'disconnected':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">PTZ制御</h2>
        <div className="flex items-center gap-2">
          {getConnectionIndicator()}
          <span className="text-sm text-gray-600">
            {connectionStatus === 'connected' ? '接続中' : 
             connectionStatus === 'connecting' ? '接続試行中' : '未接続'}
          </span>
        </div>
      </div>

      {/* PTZ制御ボタン（3x3グリッド） */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {/* 上段 */}
        <button
          className={getButtonClass('up-left')}
          onMouseDown={() => startMovement('up-left')}
          onMouseUp={stopMovement}
          onMouseLeave={stopMovement}
          onTouchStart={() => startMovement('up-left')}
          onTouchEnd={stopMovement}
        >
          ↖
        </button>
        <button
          className={getButtonClass('up')}
          onMouseDown={() => startMovement('up')}
          onMouseUp={stopMovement}
          onMouseLeave={stopMovement}
          onTouchStart={() => startMovement('up')}
          onTouchEnd={stopMovement}
        >
          ↑
        </button>
        <button
          className={getButtonClass('up-right')}
          onMouseDown={() => startMovement('up-right')}
          onMouseUp={stopMovement}
          onMouseLeave={stopMovement}
          onTouchStart={() => startMovement('up-right')}
          onTouchEnd={stopMovement}
        >
          ↗
        </button>

        {/* 中段 */}
        <button
          className={getButtonClass('left')}
          onMouseDown={() => startMovement('left')}
          onMouseUp={stopMovement}
          onMouseLeave={stopMovement}
          onTouchStart={() => startMovement('left')}
          onTouchEnd={stopMovement}
        >
          ←
        </button>
        
        {/* 中央リセットボタン */}
        <button
          className={getCenterButtonClass()}
          onClick={moveToPreset}
        >
          ⌂
        </button>
        
        <button
          className={getButtonClass('right')}
          onMouseDown={() => startMovement('right')}
          onMouseUp={stopMovement}
          onMouseLeave={stopMovement}
          onTouchStart={() => startMovement('right')}
          onTouchEnd={stopMovement}
        >
          →
        </button>

        {/* 下段 */}
        <button
          className={getButtonClass('down-left')}
          onMouseDown={() => startMovement('down-left')}
          onMouseUp={stopMovement}
          onMouseLeave={stopMovement}
          onTouchStart={() => startMovement('down-left')}
          onTouchEnd={stopMovement}
        >
          ↙
        </button>
        <button
          className={getButtonClass('down')}
          onMouseDown={() => startMovement('down')}
          onMouseUp={stopMovement}
          onMouseLeave={stopMovement}
          onTouchStart={() => startMovement('down')}
          onTouchEnd={stopMovement}
        >
          ↓
        </button>
        <button
          className={getButtonClass('down-right')}
          onMouseDown={() => startMovement('down-right')}
          onMouseUp={stopMovement}
          onMouseLeave={stopMovement}
          onTouchStart={() => startMovement('down-right')}
          onTouchEnd={stopMovement}
        >
          ↘
        </button>
      </div>

      {/* 状態表示 */}
      <div className="text-center">
        {isMoving ? (
          <p className="text-sm text-blue-600 font-medium">
            移動中: {isMoving}
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            ボタンを押し続けてカメラを操作
          </p>
        )}
      </div>

      {/* 操作説明 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">操作方法</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 方向ボタン: 押し続けている間カメラが移動</li>
          <li>• 中央ボタン（⌂）: プリセット位置に戻る</li>
          <li>• スマートフォンではタッチ操作対応</li>
        </ul>
      </div>
    </div>
  );
};

export default PTZControls;
