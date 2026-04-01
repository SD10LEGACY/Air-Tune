import React from 'react';

export default function MusicPlayerApp() {
  return (
    <div className="w-full h-full min-w-[600px] min-h-[400px] bg-black flex flex-col font-sans">
      <div className="bg-gradient-to-b from-gray-700 to-gray-900 border-b-2 border-gray-600 p-1 flex items-center justify-between">
        <div className="text-[#00ff00] font-pixel text-[10px] tracking-widest ml-2">FREEFY AMP v1.0</div>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-gray-800 border border-gray-600 rounded-sm" />
          <div className="w-4 h-4 bg-gray-800 border border-gray-600 rounded-sm" />
        </div>
      </div>
      <iframe 
        src="https://freefy.app/" 
        className="w-full flex-1 border-none" 
        title="Freefy Music Player"
      />
    </div>
  );
}
