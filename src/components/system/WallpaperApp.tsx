import React, { useState } from 'react';
import { Image, Upload, Trash2, Check } from 'lucide-react';

interface WallpaperAppProps {
  onSetWallpaper: (url: string | null) => void;
  currentWallpaper: string | null;
}

export default function WallpaperApp({ onSetWallpaper, currentWallpaper }: WallpaperAppProps) {
  const [preview, setPreview] = useState<string | null>(currentWallpaper);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyWallpaper = () => {
    onSetWallpaper(preview);
  };

  const resetWallpaper = () => {
    setPreview(null);
    onSetWallpaper(null);
  };

  return (
    <div className="p-4 flex flex-col gap-4 bg-gray-300 h-full font-pixel">
      <div className="win-border-inset bg-white p-4 flex flex-col gap-4">
        <h2 className="text-sm font-bold border-b border-gray-300 pb-2">Desktop Wallpaper Settings</h2>
        
        <div className="flex gap-4">
          <div className="w-40 h-24 win-border-inset bg-black overflow-hidden flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-500 text-[10px]">NO WALLPAPER</div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <label className="win-button flex items-center justify-center gap-2 py-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>UPLOAD IMAGE</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
            
            <button 
              onClick={applyWallpaper}
              className="win-button flex items-center justify-center gap-2 py-2 bg-green-200"
            >
              <Check className="w-4 h-4" />
              <span>APPLY</span>
            </button>
            
            <button 
              onClick={resetWallpaper}
              className="win-button flex items-center justify-center gap-2 py-2 bg-red-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>RESET</span>
            </button>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-gray-600 mt-auto">
        <p>* Supported formats: JPG, PNG, GIF</p>
        <p>* Recommended size: 1920x1080</p>
      </div>
    </div>
  );
}
