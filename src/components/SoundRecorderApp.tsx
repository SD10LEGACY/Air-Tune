import React, { useState, useEffect } from 'react';
import { Play, Square, Circle, Rewind, FastForward } from 'lucide-react';

export default function SoundRecorderApp() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording || isPlaying) {
      interval = setInterval(() => {
        setTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPlaying]);

  return (
    <div className="flex flex-col bg-[#c0c0c0] font-sans text-xs p-2 w-80">
      <div className="flex gap-2 mb-2">
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">File</span>
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">Edit</span>
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">Effects</span>
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">Help</span>
      </div>
      
      <div className="flex flex-col gap-4 p-2">
        <div className="flex justify-between items-center">
          <div className="text-gray-600">Position:<br/>{time.toFixed(2)} sec.</div>
          <div className="flex-1 mx-4 h-16 bg-black win-border-inset relative overflow-hidden flex items-center justify-center">
            {/* Fake Waveform */}
            <div className="w-full h-[2px] bg-[#00ff00] relative">
              {(isRecording || isPlaying) && (
                <div className="absolute inset-0 bg-[#00ff00] animate-pulse" style={{ height: Math.random() * 20 + 2, top: -Math.random() * 10 }} />
              )}
            </div>
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white opacity-50" />
          </div>
          <div className="text-gray-600 text-right">Length:<br/>{isRecording ? time.toFixed(2) : '0.00'} sec.</div>
        </div>

        <div className="flex justify-center gap-2">
          <button className="win-button p-2" onClick={() => setTime(0)}><Rewind className="w-4 h-4" /></button>
          <button className="win-button p-2"><FastForward className="w-4 h-4" /></button>
          <button 
            className={`win-button p-2 ${isPlaying ? 'win-border-inset' : ''}`}
            onClick={() => { setIsPlaying(!isPlaying); setIsRecording(false); }}
          >
            <Play className="w-4 h-4" />
          </button>
          <button 
            className="win-button p-2"
            onClick={() => { setIsPlaying(false); setIsRecording(false); }}
          >
            <Square className="w-4 h-4" />
          </button>
          <button 
            className={`win-button p-2 ${isRecording ? 'win-border-inset' : ''}`}
            onClick={() => { setIsRecording(!isRecording); setIsPlaying(false); }}
          >
            <Circle className="w-4 h-4 text-red-600 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
