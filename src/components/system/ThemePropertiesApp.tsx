import React, { useState } from 'react';

export default function ThemePropertiesApp({ 
  currentTheme, 
  setTheme, 
  currentWallpaper, 
  onSetWallpaper 
}: { 
  currentTheme: string, 
  setTheme: (t: string) => void,
  currentWallpaper: string | null,
  onSetWallpaper: (w: string | null) => void
}) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [tempTheme, setTempTheme] = useState(currentTheme);
  const [tempWallpaper, setTempWallpaper] = useState<string | null>(currentWallpaper);

  const themes = [
    { id: 'default', name: 'Windows Standard' },
    { id: 'hotdog', name: 'Hot Dog Stand' },
    { id: 'highcontrast', name: 'High Contrast' }
  ];

  const wallpapers = [
    { id: '', name: '(None)' },
    { id: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80', name: 'Clouds' },
    { id: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rV7928GBgYGWEEQAAgwADcQAw3bA1kOAAAAAElFTkSuQmCC', name: 'Tiles' },
    { id: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80', name: 'Forest' }
  ];

  const handleApply = () => {
    setTheme(tempTheme);
    onSetWallpaper(tempWallpaper);
  };

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0] font-sans text-xs p-4 gap-4 w-80">
      <div className="flex gap-1 border-b-2 border-white relative z-10 pl-2">
        <button 
          className={`px-3 py-1 bg-[#c0c0c0] border-2 border-b-0 ${activeTab === 'background' ? 'border-t-white border-l-white border-r-[#404040] pb-2 -mb-1 z-20' : 'border-t-white border-l-white border-r-[#404040] mt-1'}`}
          onClick={() => setActiveTab('background')}
        >
          Background
        </button>
        <button 
          className={`px-3 py-1 bg-[#c0c0c0] border-2 border-b-0 ${activeTab === 'screensaver' ? 'border-t-white border-l-white border-r-[#404040] pb-2 -mb-1 z-20' : 'border-t-white border-l-white border-r-[#404040] mt-1'}`}
          onClick={() => setActiveTab('screensaver')}
        >
          Screen Saver
        </button>
        <button 
          className={`px-3 py-1 bg-[#c0c0c0] border-2 border-b-0 ${activeTab === 'appearance' ? 'border-t-white border-l-white border-r-[#404040] pb-2 -mb-1 z-20' : 'border-t-white border-l-white border-r-[#404040] mt-1'}`}
          onClick={() => setActiveTab('appearance')}
        >
          Appearance
        </button>
      </div>
      
      <div className="win-border-outset border-t-0 p-4 -mt-4 pt-6 flex-1 flex flex-col gap-4 relative z-0">
        {activeTab === 'appearance' && (
        <>
          <div className="win-border-inset p-4 bg-white flex flex-col gap-2">
            <div className="win-border-outset p-2 bg-[#008080] h-32 relative" style={{ backgroundColor: tempTheme === 'hotdog' ? '#ff0000' : tempTheme === 'highcontrast' ? '#000000' : '#008080' }}>
              <div className="absolute top-4 left-4 right-4 bg-[#c0c0c0] win-border-outset shadow-xl">
                <div className="bg-[#000080] text-white p-1 font-bold flex justify-between" style={{ backgroundColor: tempTheme === 'hotdog' ? '#ff0000' : tempTheme === 'highcontrast' ? '#ffffff' : '#000080', color: tempTheme === 'highcontrast' ? '#000000' : '#ffffff' }}>
                  <span>Active Window</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-[#c0c0c0] win-border-outset" />
                    <div className="w-3 h-3 bg-[#c0c0c0] win-border-outset" />
                    <div className="w-3 h-3 bg-[#c0c0c0] win-border-outset" />
                  </div>
                </div>
                <div className="p-2 text-black">Window Text</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <label>Scheme:</label>
            <select 
              className="win-border-inset p-1 bg-white w-full"
              value={tempTheme}
              onChange={(e) => setTempTheme(e.target.value)}
            >
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {activeTab === 'background' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            <div className="w-32 h-24 win-border-inset bg-[#008080] relative overflow-hidden flex items-center justify-center">
              {tempWallpaper && (
                <div 
                  className="absolute inset-0 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: `url(${tempWallpaper})`,
                    backgroundRepeat: tempWallpaper.startsWith('data:image') ? 'repeat' : 'no-repeat',
                    backgroundSize: tempWallpaper.startsWith('data:image') ? 'auto' : 'cover'
                  }} 
                />
              )}
              <div className="w-16 h-12 win-border-outset bg-[#c0c0c0] flex items-center justify-center text-[8px] z-10">
                Preview
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label>Wallpaper:</label>
            <select 
              className="win-border-inset p-1 bg-white w-full"
              value={wallpapers.find(w => w.id === (tempWallpaper || '')) ? (tempWallpaper || '') : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setTempWallpaper(e.target.value || null);
                }
              }}
            >
              {wallpapers.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
              {!wallpapers.find(w => w.id === (tempWallpaper || '')) && (
                <option value="custom">Custom (Uploaded)</option>
              )}
            </select>
          </div>
        </div>
      )}

      {activeTab === 'screensaver' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            <div className="w-32 h-24 win-border-inset bg-black relative overflow-hidden flex items-center justify-center">
              <div className="text-white text-[8px] animate-pulse">Starfield...</div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label>Screen Saver:</label>
            <select className="win-border-inset p-1 bg-white w-full">
              <option>Starfield</option>
              <option>3D Pipes (Coming Soon)</option>
              <option>Flying Windows (Coming Soon)</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <label>Wait:</label>
            <input type="number" className="win-border-inset w-12 p-1" defaultValue="3" />
            <span>minutes</span>
          </div>
        </div>
      )}
      
      </div>
      
      <div className="flex justify-end gap-2 mt-auto pt-4">
        <button className="win-button px-4 py-1" onClick={handleApply}>OK</button>
        <button className="win-button px-4 py-1" onClick={() => {
          setTempTheme(currentTheme);
          setTempWallpaper(currentWallpaper);
        }}>Cancel</button>
        <button className="win-button px-4 py-1" onClick={handleApply}>Apply</button>
      </div>
    </div>
  );
}
