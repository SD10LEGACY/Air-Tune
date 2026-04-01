import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Monitor, Music, Disc, Image as ImageIcon, 
  X, Minus, Square, Volume2, Clock, 
  Layout, Search, Settings, Power,
  ChevronRight, Disc as DiscIcon, Wind,
  Keyboard, GripHorizontal, FileText,
  Trash2, Activity, AlertTriangle,
  PlayCircle, Bomb, Mic, Palette
} from 'lucide-react';
import Window from './Window';
import AirPianoApp from '../instruments/AirPianoApp';
import AirGuitar from '../instruments/AirGuitar';
import AirDrums from '../instruments/AirDrums';
import AirHarmonium from '../instruments/AirHarmonium';
import AirXylophone from '../instruments/AirXylophone';
import WallpaperApp from '../system/WallpaperApp';
import MyComputerApp from '../apps/MyComputerApp';
import NotepadApp from '../apps/NotepadApp';
import TaskManagerApp from '../system/TaskManagerApp';
import BSOD from '../system/BSOD';
import MusicPlayerApp from '../apps/MusicPlayerApp';
import MinesweeperApp from '../apps/MinesweeperApp';
import SoundRecorderApp from '../apps/SoundRecorderApp';
import ThemePropertiesApp from '../system/ThemePropertiesApp';
import Screensaver from '../system/Screensaver';

interface OpenWindow {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  props?: any;
  isMinimized: boolean;
  zIndex: number;
}

interface ContextMenu {
  x: number;
  y: number;
  windowId: string;
}

export default function Desktop() {
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [pinnedApps, setPinnedApps] = useState<string[]>([]);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [showVolumeFlyout, setShowVolumeFlyout] = useState(false);
  const [globalVolume, setGlobalVolume] = useState(75);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{x: number, y: number} | null>(null);
  const [showBSOD, setShowBSOD] = useState(false);
  const [theme, setTheme] = useState('default');
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let idleTimer: any;
    const resetIdle = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIsIdle(true), 180000); // 3 minutes
    };
    
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('click', resetIdle);
    resetIdle();

    // Startup sound
    try {
      const audio = new Audio('https://www.myinstants.com/media/sounds/windows-95-startup-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => {
        console.log("Audio play failed, falling back to synth", e);
        import('tone').then(Tone => {
          const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "square" },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 1 }
          }).toDestination();
          const now = Tone.now();
          synth.triggerAttackRelease("C4", "16n", now);
          synth.triggerAttackRelease(["C5", "E5", "G5"], "4n", now + 0.1);
        });
      });
    } catch (e) {
      console.error("Failed to play startup sound", e);
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleClick = () => {
      setContextMenu(null);
      setShowVolumeFlyout(false);
      if (!showStartMenu) setActiveSubMenu(null);
    };
    window.addEventListener('click', handleClick);
    return () => {
      clearInterval(timer);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('click', resetIdle);
      clearTimeout(idleTimer);
    };
  }, []);

  useEffect(() => {
    import('tone').then(Tone => {
      if (Tone.getDestination()) {
        const db = globalVolume === 0 ? -100 : (globalVolume / 100) * 40 - 40;
        Tone.getDestination().volume.rampTo(db, 0.1);
      }
    });
  }, [globalVolume]);

  const openApp = (id: string, title: string, icon: React.ReactNode, component: React.ComponentType<any>, props?: any) => {
    // Click sound
    import('tone').then(Tone => {
      const synth = new Tone.MembraneSynth().toDestination();
      synth.triggerAttackRelease("C2", "32n");
    });

    setOpenWindows(prev => {
      const existing = prev.find(w => w.id === id);
      
      // Minimize all other windows
      const updatedWindows = prev.map(w => ({
        ...w,
        isMinimized: w.id !== id
      }));

      if (existing) {
        return updatedWindows.map(w => 
          w.id === id ? { ...w, isMinimized: false, zIndex: nextZIndex } : w
        );
      }

      const newWindow: OpenWindow = {
        id,
        title,
        icon,
        component,
        props,
        isMinimized: false,
        zIndex: nextZIndex
      };

      return [...updatedWindows, newWindow];
    });

    setActiveWindowId(id);
    setNextZIndex(prev => prev + 1);
    setShowStartMenu(false);
  };

  const closeWindow = (id: string) => {
    setOpenWindows(prev => prev.filter(w => w.id !== id));
    setActiveWindowId(prev => prev === id ? null : prev);
  };

  const toggleMinimize = (id: string) => {
    setOpenWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
    ));
    setActiveWindowId(prev => prev === id ? null : id);
  };

  const focusWindow = (id: string) => {
    setOpenWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: nextZIndex, isMinimized: false } : w
    ));
    setActiveWindowId(id);
    setNextZIndex(prev => prev + 1);
  };

  const apps = [
    { 
      id: 'piano', 
      title: 'Air Tune', 
      icon: <Keyboard className="w-8 h-8 text-blue-800" />, 
      component: AirPianoApp 
    },
    { 
      id: 'guitar', 
      title: 'Air Guitar', 
      icon: <Music className="w-8 h-8 text-red-800" />, 
      component: AirGuitar 
    },
    { 
      id: 'drums', 
      title: 'Air Drums', 
      icon: <Disc className="w-8 h-8 text-green-800" />, 
      component: AirDrums 
    },
    { 
      id: 'harmonium', 
      title: 'Air Harmonium', 
      icon: <Wind className="w-8 h-8 text-orange-600" />, 
      component: AirHarmonium 
    },
    { 
      id: 'xylophone', 
      title: 'Air Xylophone', 
      icon: <GripHorizontal className="w-8 h-8 text-pink-600" />, 
      component: AirXylophone 
    },
    { 
      id: 'wallpaper', 
      title: 'Wallpaper Settings', 
      icon: <ImageIcon className="w-8 h-8 text-orange-800" />, 
      component: WallpaperApp
    },
    { 
      id: 'computer', 
      title: 'My Computer', 
      icon: <Monitor className="w-8 h-8 text-blue-800" />, 
      component: MyComputerApp 
    },
    { 
      id: 'notepad', 
      title: 'Notepad', 
      icon: <FileText className="w-8 h-8 text-blue-600" />, 
      component: NotepadApp 
    },
    { 
      id: 'taskmgr', 
      title: 'Task Manager', 
      icon: <Activity className="w-8 h-8 text-green-600" />, 
      component: TaskManagerApp,
      props: { openWindows, closeWindow }
    },
    { 
      id: 'recycle', 
      title: 'Recycle Bin', 
      icon: <Trash2 className="w-8 h-8 text-gray-500" />, 
      component: () => <div className="p-4 text-center font-sans">The Recycle Bin is empty.</div> 
    },
    { 
      id: 'musicplayer', 
      title: 'Freefy Player', 
      icon: <PlayCircle className="w-8 h-8 text-purple-600" />, 
      component: MusicPlayerApp 
    },
    { 
      id: 'minesweeper', 
      title: 'Minesweeper', 
      icon: <Bomb className="w-8 h-8 text-black" />, 
      component: MinesweeperApp 
    },
    { 
      id: 'soundrecorder', 
      title: 'Sound Recorder', 
      icon: <Mic className="w-8 h-8 text-red-600" />, 
      component: SoundRecorderApp 
    },
    { 
      id: 'themes', 
      title: 'Display Properties', 
      icon: <Palette className="w-8 h-8 text-blue-500" />, 
      component: ThemePropertiesApp
    },
  ];

  const handleTaskbarContextMenu = (e: React.MouseEvent, windowId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY - 100, // Show above taskbar
      windowId
    });
  };

  const togglePin = (id: string) => {
    setPinnedApps(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
    setContextMenu(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectionStart({ x: e.clientX, y: e.clientY });
      setSelectionCurrent({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectionStart) {
      setSelectionCurrent({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setSelectionStart(null);
    setSelectionCurrent(null);
  };

  if (showBSOD) {
    return <BSOD onRecover={() => setShowBSOD(false)} />;
  }

  if (isIdle) {
    return <Screensaver onWake={() => setIsIdle(false)} />;
  }

  return (
    <div 
      className="relative w-full h-screen overflow-hidden font-pixel select-none win-theme-desktop"
      data-theme={theme}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Wallpaper */}
      {wallpaper ? (
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            backgroundImage: `url(${wallpaper})`,
            backgroundRepeat: wallpaper.startsWith('data:image') ? 'repeat' : 'no-repeat',
            backgroundSize: wallpaper.startsWith('data:image') ? 'auto' : 'cover',
            backgroundPosition: 'center'
          }}
        />
      ) : (
        <div className="absolute inset-0 z-0 win-theme-desktop-bg" />
      )}

      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-8 z-10">
        {apps.map(app => (
          <motion.div 
            key={app.id}
            drag
            dragMomentum={false}
            className="flex flex-col items-center gap-1 group cursor-pointer" 
            onDoubleClick={() => openApp(app.id, app.title, app.icon, app.component, app.props)}
          >
            <div className="w-12 h-12 bg-gray-300 border-2 border-white border-r-gray-600 border-b-gray-600 flex items-center justify-center group-active:border-inset">
              {app.icon}
            </div>
            <span className="text-[10px] text-white bg-blue-900 px-1">{app.title}</span>
          </motion.div>
        ))}
      </div>

      {/* Selection Box */}
      {selectionStart && selectionCurrent && (
        <div 
          className="absolute border border-dotted border-white bg-blue-900/30 z-10 pointer-events-none"
          style={{
            left: Math.min(selectionStart.x, selectionCurrent.x),
            top: Math.min(selectionStart.y, selectionCurrent.y),
            width: Math.abs(selectionCurrent.x - selectionStart.x),
            height: Math.abs(selectionCurrent.y - selectionStart.y),
          }}
        />
      )}

      {/* Windows Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {openWindows.map(window => (
          <div 
            key={window.id} 
            className={`pointer-events-auto ${window.isMinimized ? 'hidden' : 'block'}`}
          >
            <Window
              id={window.id}
              title={window.title}
              icon={window.icon}
              zIndex={window.zIndex}
              isActive={activeWindowId === window.id}
              onClose={() => closeWindow(window.id)}
              onMinimize={() => toggleMinimize(window.id)}
              onFocus={() => focusWindow(window.id)}
            >
              <window.component 
                isMinimized={window.isMinimized} 
                {...(window.props || {})} 
                currentTheme={theme}
                setTheme={setTheme}
                currentWallpaper={wallpaper}
                onSetWallpaper={setWallpaper}
                setShowBSOD={setShowBSOD}
              />
            </Window>
          </div>
        ))}
      </div>

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gray-300 border-t-2 border-white flex items-center px-1 gap-1 z-50">
        <button 
          onClick={() => setShowStartMenu(!showStartMenu)}
          className={`win-button h-8 px-2 flex items-center gap-1 font-bold italic ${showStartMenu ? 'win-border-inset' : ''}`}
        >
          <Layout className="w-4 h-4" />
          <span>Start</span>
        </button>

        <div className="w-[2px] h-6 bg-gray-400 mx-1 border-r border-white" />

        {/* Taskbar Items */}
        <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar">
          {/* Show all pinned apps first, then any other open windows */}
          {Array.from(new Set([...pinnedApps, ...openWindows.map(w => w.id)])).map(id => {
            const window = openWindows.find(w => w.id === id);
            const app = apps.find(a => a.id === id);
            if (!app) return null;

            return (
              <div 
                key={id}
                className="relative flex"
                onMouseEnter={() => setHoveredApp(id)}
                onMouseLeave={() => setHoveredApp(null)}
              >
                {/* Preview Tooltip */}
                {hoveredApp === id && window && (
                  <div className="absolute bottom-full left-0 pb-2 z-[100]">
                    <div className="w-48 bg-gray-200 border border-gray-400 p-1 shadow-xl rounded-sm flex flex-col">
                      <div className="px-2 py-1 text-xs flex items-center gap-2 bg-gray-200">
                        <div className="w-4 h-4">{app.icon}</div>
                        <span className="truncate text-black font-sans">{app.title}</span>
                        <button 
                          className="ml-auto hover:bg-red-500 hover:text-white rounded-sm p-0.5 text-black" 
                          onClick={(e) => { e.stopPropagation(); closeWindow(id); setHoveredApp(null); }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div 
                        className="h-28 bg-white mt-1 flex items-center justify-center border border-gray-300 cursor-pointer hover:border-blue-400" 
                        onClick={(e) => { 
                          e.stopPropagation();
                          if (window.isMinimized) toggleMinimize(id); 
                          focusWindow(id); 
                          setHoveredApp(null);
                        }}
                      >
                        <div className="flex flex-col items-center gap-2 opacity-50">
                          <div className="w-10 h-10">{app.icon}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (window) {
                      if (activeWindowId === id && !window.isMinimized) {
                        toggleMinimize(id);
                      } else {
                        focusWindow(id);
                      }
                    } else {
                      openApp(app.id, app.title, app.icon, app.component, app.props);
                    }
                  }}
                  onContextMenu={(e) => handleTaskbarContextMenu(e, id)}
                  className={`win-button h-8 px-2 flex items-center gap-2 min-w-[100px] max-w-[150px] truncate ${
                    window && activeWindowId === id && !window.isMinimized ? 'win-border-inset font-bold' : ''
                  } ${!window ? 'opacity-70' : ''}`}
                >
                  <div className="w-4 h-4 flex-shrink-0">{app.icon}</div>
                  <span className="text-[10px] truncate">{app.title}</span>
                  {window && !window.isMinimized && (
                    <div className="w-1 h-1 bg-blue-600 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* System Tray */}
        <div className="win-border-inset h-8 px-2 flex items-center gap-2 bg-gray-300 ml-auto relative">
          <button 
            className={`p-1 hover:bg-gray-400 active:translate-y-[1px] ${showVolumeFlyout ? 'bg-gray-400 win-border-inset' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowVolumeFlyout(!showVolumeFlyout);
              setShowStartMenu(false);
            }}
          >
            <Volume2 className="w-4 h-4" />
          </button>
          
          <AnimatePresence>
            {showVolumeFlyout && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="absolute bottom-10 right-0 w-64 win-border-outset bg-gray-300 p-4 shadow-xl z-[100] flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-blue-800" />
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={globalVolume}
                    onChange={(e) => setGlobalVolume(parseInt(e.target.value))}
                    className="win-slider flex-1 h-4"
                  />
                  <span className="text-[10px] w-6 text-right font-bold">{globalVolume}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-[1px] h-4 bg-gray-400" />
          <div className="flex items-center gap-1 text-[10px]">
            <Clock className="w-3 h-3" />
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Taskbar Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute win-border-outset bg-gray-300 z-[100] w-48 p-1 shadow-xl"
            style={{ left: contextMenu.x, bottom: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="p-2 hover:bg-[#000080] hover:text-white text-[10px] cursor-pointer flex items-center gap-2"
              onClick={() => togglePin(contextMenu.windowId)}
            >
              <DiscIcon className="w-3 h-3" />
              <span>{pinnedApps.includes(contextMenu.windowId) ? 'Unpin from taskbar' : 'Pin to taskbar'}</span>
            </div>
            
            {openWindows.find(w => w.id === contextMenu.windowId) ? (
              <>
                <div className="h-[1px] bg-gray-400 my-1" />
                <div 
                  className="p-2 hover:bg-[#000080] hover:text-white text-[10px] cursor-pointer flex items-center gap-2"
                  onClick={() => { closeWindow(contextMenu.windowId); setContextMenu(null); }}
                >
                  <X className="w-3 h-3" />
                  <span>Close window</span>
                </div>
                <div 
                  className="p-2 hover:bg-[#000080] hover:text-white text-[10px] cursor-pointer flex items-center gap-2 font-bold"
                  onClick={() => { closeWindow(contextMenu.windowId); setContextMenu(null); }}
                >
                  <Power className="w-3 h-3" />
                  <span>End</span>
                </div>
              </>
            ) : (
              <>
                <div className="h-[1px] bg-gray-400 my-1" />
                <div 
                  className="p-2 hover:bg-[#000080] hover:text-white text-[10px] cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    const app = apps.find(a => a.id === contextMenu.windowId);
                    if (app) openApp(app.id, app.title, app.icon, app.component, app.props);
                    setContextMenu(null);
                  }}
                >
                  <Monitor className="w-3 h-3" />
                  <span>Open</span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Menu */}
      <AnimatePresence>
        {showStartMenu && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-10 left-0 w-64 win-border-outset z-[60] flex"
          >
            {/* Left Sidebar */}
            <div className="w-8 bg-[#808080] flex items-end justify-center pb-4">
              <span className="rotate-[-90deg] text-white font-bold text-xl tracking-widest opacity-50">AIR_TUNE</span>
            </div>
            
            {/* Menu Items */}
            <div className="flex-1 bg-gray-300 p-1 flex flex-col">
              <div 
                className="relative flex items-center gap-3 p-2 hover:bg-[#000080] hover:text-white group cursor-pointer"
                onMouseEnter={() => setActiveSubMenu('programs')}
                onMouseLeave={() => setActiveSubMenu(null)}
              >
                <div className="w-8 h-8 bg-gray-400 flex items-center justify-center"><Monitor className="w-6 h-6" /></div>
                <span className="flex-1">Programs</span>
                <ChevronRight className="w-4 h-4" />
                
                {/* Cascading Menu */}
                {activeSubMenu === 'programs' && (
                  <div className="absolute left-full bottom-0 w-64 win-border-outset bg-gray-300 p-1 flex flex-col z-[70] text-black">
                    {apps.map(app => (
                      <div 
                        key={app.id}
                        className="flex items-center gap-3 p-2 hover:bg-[#000080] hover:text-white cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          openApp(app.id, app.title, app.icon, app.component, app.props);
                        }}
                      >
                        <div className="w-6 h-6 flex items-center justify-center">{app.icon}</div>
                        <span className="flex-1">{app.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 p-2 hover:bg-[#000080] hover:text-white group cursor-pointer">
                <div className="w-8 h-8 bg-gray-400 flex items-center justify-center"><ImageIcon className="w-6 h-6" /></div>
                <span className="flex-1">Documents</span>
                <ChevronRight className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-3 p-2 hover:bg-[#000080] hover:text-white group cursor-pointer" onClick={() => openApp('wallpaper', 'Wallpaper Settings', <ImageIcon className="w-8 h-8 text-orange-800" />, WallpaperApp)}>
                <div className="w-8 h-8 bg-gray-400 flex items-center justify-center"><ImageIcon className="w-6 h-6" /></div>
                <span className="flex-1">Wallpaper Settings</span>
                <ChevronRight className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-3 p-2 hover:bg-[#000080] hover:text-white group cursor-pointer">
                <div className="w-8 h-8 bg-gray-400 flex items-center justify-center"><Search className="w-6 h-6" /></div>
                <span className="flex-1">Find</span>
                <ChevronRight className="w-4 h-4" />
              </div>
              
              <div className="h-[2px] bg-gray-400 my-1 border-b border-white" />

              <div className="flex items-center gap-3 p-2 hover:bg-[#000080] hover:text-white group cursor-pointer" onClick={() => setShowBSOD(true)}>
                <div className="w-8 h-8 bg-gray-400 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
                <span className="flex-1">Crash System...</span>
              </div>
              
              <div className="flex items-center gap-3 p-2 hover:bg-[#000080] hover:text-white group cursor-pointer" onClick={() => window.location.reload()}>
                <div className="w-8 h-8 bg-gray-400 flex items-center justify-center"><Power className="w-6 h-6" /></div>
                <span className="flex-1">Shut Down...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        :root {
          --desktop-bg: #008080;
          --window-bg: #c0c0c0;
          --titlebar-active: #000080;
          --titlebar-inactive: #808080;
          --titletext-active: #ffffff;
          --titletext-inactive: #c0c0c0;
        }
        [data-theme="hotdog"] {
          --desktop-bg: #ff0000;
          --window-bg: #ffff00;
          --titlebar-active: #ff0000;
          --titlebar-inactive: #ff8800;
          --titletext-active: #ffffff;
          --titletext-inactive: #000000;
        }
        [data-theme="highcontrast"] {
          --desktop-bg: #000000;
          --window-bg: #000000;
          --titlebar-active: #ffffff;
          --titlebar-inactive: #808080;
          --titletext-active: #000000;
          --titletext-inactive: #ffffff;
        }

        body {
          cursor: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZ0lEQVQ4T2NkoBAwUqifYdQAhoEwMDIwMv7//8/AwMDAwMjIyIgk/B8k/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8m/B8mAABc8wQ1nQ2+gAAAABJRU5ErkJggg=='), auto !important;
        }
        
        .cursor-wait, .cursor-wait * {
          cursor: wait !important;
        }

        .win-theme-desktop-bg {
          background-color: var(--desktop-bg);
        }
        .win-theme-window {
          background-color: var(--window-bg);
        }
        .win-theme-titlebar.active {
          background-color: var(--titlebar-active);
        }
        .win-theme-titlebar.inactive {
          background-color: var(--titlebar-inactive);
        }
        .win-theme-titlebar.active .win-theme-titletext {
          color: var(--titletext-active);
        }
        .win-theme-titlebar.inactive .win-theme-titletext {
          color: var(--titletext-inactive);
        }

        .win-border-outset {
          border: 2px solid;
          border-color: #ffffff #808080 #808080 #ffffff;
        }
        .win-border-inset {
          border: 2px solid;
          border-color: #808080 #ffffff #ffffff #808080;
        }
        .win-button {
          background: #c0c0c0;
          border: 2px solid;
          border-color: #ffffff #808080 #808080 #ffffff;
          outline: none;
        }
        .win-button:active {
          border-color: #808080 #ffffff #ffffff #808080;
          padding-top: 3px;
          padding-left: 3px;
        }
        .lcd-display {
          background: #004000;
          color: #00ff00;
          font-family: 'Courier New', Courier, monospace;
          border: 2px inset #ffffff;
          text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
        }
        .win-slider {
          -webkit-appearance: none;
          background: #c0c0c0;
          border: 2px inset #ffffff;
          outline: none;
        }
        .win-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 20px;
          background: #c0c0c0;
          border: 2px outset #ffffff;
          cursor: pointer;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
