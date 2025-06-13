import React from 'react';
import PTZControls from './components/PTZControls';
import RTSPVideoPlayer from './components/RTSPVideoPlayer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">PTZカメラ制御システム</h1>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ライブ映像表示エリア */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">ライブ映像 (RTSP)</h2>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <RTSPVideoPlayer className="w-full h-full" />
              </div>
            </div>
          </div>

          {/* PTZ制御パネル */}
          <div className="lg:w-80">
            <PTZControls />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;