import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Square } from 'lucide-react';

interface WindowProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  zIndex: number;
}

export default function Window({ 
  id, 
  title, 
  icon, 
  children, 
  onClose, 
  onMinimize, 
  isActive, 
  onFocus,
  zIndex 
}: WindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [snapState, setSnapState] = useState<'none' | 'left' | 'right'>('none');
  const [position, setPosition] = useState({ x: 50 + ((zIndex % 10) * 20), y: 50 + ((zIndex % 10) * 20) });
  
  const handleDragEnd = (e: any, info: any) => {
    const threshold = 20;
    if (info.point.x < threshold) {
      setSnapState('left');
      setIsMaximized(false);
    } else if (info.point.x > window.innerWidth - threshold) {
      setSnapState('right');
      setIsMaximized(false);
    } else {
      setSnapState('none');
    }
  };

  const getSnapStyles = () => {
    if (isMaximized) return { x: 0, y: 0, width: '100%', height: 'calc(100% - 40px)' };
    if (snapState === 'left') return { x: 0, y: 0, width: '50%', height: 'calc(100% - 40px)' };
    if (snapState === 'right') return { x: '50%', y: 0, width: '50%', height: 'calc(100% - 40px)' };
    return { x: position.x, y: position.y, width: 'auto', height: 'auto' };
  };

  return (
    <motion.div
      drag={!isMaximized && snapState === 'none'}
      dragMomentum={false}
      onDragStart={() => { onFocus(); setSnapState('none'); }}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.9, x: position.x, y: position.y }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        zIndex: zIndex,
        ...getSnapStyles()
      }}
      className={`absolute flex flex-col shadow-2xl overflow-hidden win-theme-window ${
        isMaximized || snapState !== 'none' ? 'inset-0' : 'min-w-[400px] win-border-outset'
      } ${isActive ? 'ring-1 ring-blue-400' : ''}`}
      onClick={onFocus}
    >
      {/* Title Bar */}
      <div 
        className={`win-theme-titlebar p-1 flex items-center justify-between cursor-default ${isActive ? 'active' : 'inactive'}`}
        onDoubleClick={() => setIsMaximized(!isMaximized)}
      >
        <div className="flex items-center gap-2 px-1">
          <div className="w-4 h-4 flex items-center justify-center win-theme-titletext">
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' }) : icon}
          </div>
          <span className="win-theme-titletext font-pixel text-sm tracking-tight uppercase">{title}</span>
        </div>
        <div className="flex gap-1 no-drag">
          <button 
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="win-button p-0 w-5 h-5 flex items-center justify-center"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); setSnapState('none'); }}
            className="win-button p-0 w-5 h-5 flex items-center justify-center"
          >
            <Square className="w-3 h-3" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="win-button p-0 w-5 h-5 flex items-center justify-center ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-300 overflow-auto relative">
        {children}
      </div>
    </motion.div>
  );
}
