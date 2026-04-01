import React, { useEffect, useRef } from 'react';

export default function Screensaver({ onWake }: { onWake: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleWake = () => onWake();
    window.addEventListener('mousemove', handleWake);
    window.addEventListener('keydown', handleWake);
    window.addEventListener('click', handleWake);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    
    const stars = Array(500).fill(null).map(() => ({
      x: Math.random() * w - w / 2,
      y: Math.random() * h - h / 2,
      z: Math.random() * w
    }));

    let animationId: number;
    const draw = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, w, h);
      
      const cx = w / 2;
      const cy = h / 2;
      
      stars.forEach(star => {
        star.z -= 5;
        if (star.z <= 0) {
          star.x = Math.random() * w - cx;
          star.y = Math.random() * h - cy;
          star.z = w;
        }
        
        const px = (star.x / star.z) * w + cx;
        const py = (star.y / star.z) * w + cy;
        const size = (1 - star.z / w) * 3;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(px, py, size, size);
      });
      
      animationId = requestAnimationFrame(draw);
    };
    
    draw();

    return () => {
      window.removeEventListener('mousemove', handleWake);
      window.removeEventListener('keydown', handleWake);
      window.removeEventListener('click', handleWake);
      cancelAnimationFrame(animationId);
    };
  }, [onWake]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-[9999] bg-black cursor-none"
    />
  );
}
