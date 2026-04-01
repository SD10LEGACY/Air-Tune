import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { getHandLandmarker } from '../services/handLandmarkerService';
import * as Tone from 'tone';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Volume2, Info, Play, Camera as CameraIcon, Disc, ChevronUp, ChevronDown } from 'lucide-react';

const OCTAVES = [1, 2, 3, 4, 5, 6, 7];

const getGesture = (landmarks: any[]) => {
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const indexBase = landmarks[5];
  const middleBase = landmarks[9];
  const ringBase = landmarks[13];
  const pinkyBase = landmarks[17];

  const isExtended = (tip: any, base: any) => {
    const distTip = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
    const distBase = Math.sqrt(Math.pow(base.x - wrist.x, 2) + Math.pow(base.y - wrist.y, 2));
    return distTip > distBase * 1.25;
  };

  const index = isExtended(indexTip, indexBase);
  const middle = isExtended(middleTip, middleBase);
  const ring = isExtended(ringTip, ringBase);
  const pinky = isExtended(pinkyTip, pinkyBase);

  const thumbBase = landmarks[2];
  const thumbDistTip = Math.sqrt(Math.pow(thumbTip.x - pinkyBase.x, 2) + Math.pow(thumbTip.y - pinkyBase.y, 2));
  const thumbDistBase = Math.sqrt(Math.pow(thumbBase.x - pinkyBase.x, 2) + Math.pow(thumbBase.y - pinkyBase.y, 2));
  const thumb = thumbDistTip > thumbDistBase * 1.2;

  if (index && !middle && !ring && !pinky && !thumb) return 1;
  if (index && middle && !ring && !pinky && !thumb) return 2;
  if (index && middle && ring && !pinky && !thumb) return 3;
  if (index && middle && ring && pinky && !thumb) return 4;
  if (index && middle && ring && pinky && thumb) return 5;
  if (!index && !middle && !ring && !pinky && thumb) return 6;
  if (index && !middle && !ring && !pinky && thumb) return 7;

  return 0;
};

const BARS = [
  { id: 'C', label: 'C', color: '#ef4444' },
  { id: 'D', label: 'D', color: '#f59e0b' },
  { id: 'E', label: 'E', color: '#10b981' },
  { id: 'F', label: 'F', color: '#3b82f6' },
  { id: 'G', label: 'G', color: '#8b5cf6' },
  { id: 'A', label: 'A', color: '#ec4899' },
  { id: 'B', label: 'B', color: '#f43f5e' },
  { id: 'C^', label: 'C^', color: '#ef4444' },
];

export default function AirXylophone({ isMinimized = false }: { isMinimized?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [activeBar, setActiveBar] = useState<string | null>(null);
  const [activeOctave, setActiveOctave] = useState<number>(3);
  const [volume, setVolume] = useState(75);
  const [showHelp, setShowHelp] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [lowLatency, setLowLatency] = useState(() => {
    const saved = localStorage.getItem('air-xylophone-low-latency');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [playMode, setPlayMode] = useState<'touch' | 'fingers'>(() => {
    const saved = localStorage.getItem('air-xylophone-play-mode');
    return (saved as 'touch' | 'fingers') || 'touch';
  });

  useEffect(() => {
    localStorage.setItem('air-xylophone-low-latency', JSON.stringify(lowLatency));
  }, [lowLatency]);

  useEffect(() => {
    localStorage.setItem('air-xylophone-play-mode', playMode);
  }, [playMode]);

  const isAudioStartedRef = useRef(false);
  const activeBarRef = useRef<string | null>(activeBar);
  const activeOctaveRef = useRef(activeOctave);
  const octaveBuffer = useRef<number[]>([]);
  const barCooldowns = useRef<Record<string, boolean>>({});
  const lowLatencyRef = useRef(lowLatency);
  const playModeRef = useRef(playMode);
  const prevFingerY = useRef<Record<string, number>>({});

  useEffect(() => { isAudioStartedRef.current = isAudioStarted; }, [isAudioStarted]);
  useEffect(() => { activeBarRef.current = activeBar; }, [activeBar]);
  useEffect(() => { activeOctaveRef.current = activeOctave; }, [activeOctave]);
  useEffect(() => { lowLatencyRef.current = lowLatency; }, [lowLatency]);
  useEffect(() => { playModeRef.current = playMode; }, [playMode]);

  const synthRef = useRef<Tone.PolySynth | null>(null);
  const volumeNodeRef = useRef<Tone.Volume | null>(null);

  const startAudio = async () => {
    if (isAudioStarted || isAudioLoading) return;
    setIsAudioLoading(true);
    try {
      await Tone.start();
      if (Tone.getContext()) {
        Tone.getContext().lookAhead = lowLatency ? 0.01 : 0.1;
      }
      const volNode = new Tone.Volume(0).toDestination();
      volumeNodeRef.current = volNode;

      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.2 }
      }).connect(volNode);
      
      synthRef.current = synth;
      setIsAudioStarted(true);
      setIsAudioLoading(false);
      setShowInstructions(false);
      // Startup Chime
      synth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "4n", "+0.1");
    } catch (err) {
      console.error("Failed to start audio:", err);
      setIsAudioLoading(false);
    }
  };

  useEffect(() => {
    if (volumeNodeRef.current) {
      const db = volume === 0 ? -100 : (volume / 100) * 40 - 40;
      volumeNodeRef.current.volume.rampTo(db, 0.1);
    }
  }, [volume]);

  const onResults = useCallback((results: HandLandmarkerResult) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;
    
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.translate(width, 0);
    canvasCtx.scale(-1, 1);
    if (lowLatencyRef.current) {
      canvasCtx.fillStyle = '#000000';
      canvasCtx.fillRect(0, 0, width, height);
    } else {
      canvasCtx.drawImage(videoRef.current, 0, 0, width, height);
    }
    canvasCtx.restore();

    // Draw Xylophone Bars Visualization
    const barWidth = width / BARS.length;
    const barHeight = height * 0.4;
    const barY = height * 0.3;

    BARS.forEach((bar, i) => {
      const isHit = activeBarRef.current === bar.id;
      canvasCtx.save();
      canvasCtx.globalAlpha = isHit ? 0.9 : 0.4;
      canvasCtx.fillStyle = bar.color;
      canvasCtx.fillRect(i * barWidth + 5, barY, barWidth - 10, barHeight);
      canvasCtx.strokeStyle = '#ffffff';
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeRect(i * barWidth + 5, barY, barWidth - 10, barHeight);
      
      canvasCtx.globalAlpha = 1;
      canvasCtx.fillStyle = '#ffffff';
      canvasCtx.font = 'bold 10px "Press Start 2P", cursive';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(bar.label, i * barWidth + barWidth / 2, barY + barHeight / 2);
      canvasCtx.restore();
    });

    if (results.landmarks) {
      if (playModeRef.current === 'touch') {
        let leftHand = null;
        let rightHand = null;
        results.landmarks.forEach((landmarks, index) => {
          const classification = results.handednesses[index][0];
          if (classification.categoryName === 'Right') leftHand = landmarks;
          else rightHand = landmarks;
        });

        if (leftHand) {
          const gesture = getGesture(leftHand as any);
          if (gesture >= 1 && gesture <= 7) {
            const detectedOctave = gesture - 1;
            octaveBuffer.current.push(detectedOctave);
            if (octaveBuffer.current.length > 5) octaveBuffer.current.shift();
            const counts = octaveBuffer.current.reduce((acc, val) => { 
              acc[val] = (acc[val] || 0) + 1; 
              return acc; 
            }, {} as Record<number, number>);
            const mostFrequent = Object.keys(counts).reduce((a, b) => counts[parseInt(a)] > counts[parseInt(b)] ? a : b);
            setActiveOctave(parseInt(mostFrequent));
          }
        }

        if (rightHand) {
          const indexTip = rightHand[8];
          const tx = (1 - indexTip.x) * width;
          const ty = indexTip.y * height;

          let hitBar: string | null = null;
          BARS.forEach((bar, i) => {
            const bx = i * barWidth + 5;
            const bw = barWidth - 10;
            const by = barY;
            const bh = barHeight;
            
            if (tx > bx && tx < bx + bw && ty > by && ty < by + bh) {
              hitBar = bar.id;
            }
          });

          if (hitBar && hitBar !== activeBarRef.current) {
            const bar = BARS.find(b => b.id === hitBar);
            if (bar && synthRef.current && isAudioStartedRef.current) {
              const currentOctave = OCTAVES[activeOctaveRef.current] || 4;
              const noteOctave = bar.id === 'C^' ? currentOctave + 1 : currentOctave;
              const noteName = `${bar.id.replace('^', '')}${noteOctave}`;
              synthRef.current.triggerAttackRelease(noteName, "8n");
              setActiveBar(bar.id);
              activeBarRef.current = bar.id;
            }
          } else if (!hitBar && activeBarRef.current) {
            setActiveBar(null);
            activeBarRef.current = null;
          }
        } else {
          setActiveBar(null);
          activeBarRef.current = null;
        }
      } else {
        // Fingers mode
        results.landmarks.forEach((landmarks, index) => {
          const classification = results.handednesses[index][0];
          const handedness = classification.categoryName === 'Right' ? 'Left' : 'Right'; // MediaPipe mirrors
          
          const fingers = [
            { name: 'index', tip: 8, bar: handedness === 'Left' ? 'F' : 'G' },
            { name: 'middle', tip: 12, bar: handedness === 'Left' ? 'E' : 'A' },
            { name: 'ring', tip: 16, bar: handedness === 'Left' ? 'D' : 'B' },
            { name: 'pinky', tip: 20, bar: handedness === 'Left' ? 'C' : 'C^' }
          ];

          fingers.forEach(finger => {
            const stateKey = `${handedness}-${finger.name}`;
            const currentRelY = landmarks[finger.tip].y - landmarks[0].y;
            const prevRelY = prevFingerY.current[stateKey] ?? currentRelY;
            
            if (currentRelY - prevRelY > 0.03) {
              if (!barCooldowns.current[stateKey]) {
                const bar = BARS.find(b => b.id === finger.bar);
                if (bar && synthRef.current && isAudioStartedRef.current) {
                  const currentOctave = OCTAVES[activeOctaveRef.current] || 4;
                  const noteOctave = bar.id === 'C^' ? currentOctave + 1 : currentOctave;
                  const noteName = `${bar.id.replace('^', '')}${noteOctave}`;
                  synthRef.current.triggerAttackRelease(noteName, "8n");
                  
                  setActiveBar(bar.id);
                  setTimeout(() => setActiveBar(null), 150);
                  
                  barCooldowns.current[stateKey] = true;
                  setTimeout(() => { barCooldowns.current[stateKey] = false; }, 200);
                }
              }
            }
            prevFingerY.current[stateKey] = currentRelY;
          });
        });
      }

      results.landmarks.forEach((landmarks) => {
        // Draw landmarks manually
        canvasCtx.save();
        canvasCtx.translate(width, 0);
        canvasCtx.scale(-1, 1);
        
        const HAND_CONNECTIONS = [
          [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
          [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
          [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
        ];

        canvasCtx.strokeStyle = '#ffffff';
        canvasCtx.lineWidth = 1;
        HAND_CONNECTIONS.forEach(([start, end]) => {
          const startPt = landmarks[start];
          const endPt = landmarks[end];
          if (startPt && endPt) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(startPt.x * width, startPt.y * height);
            canvasCtx.lineTo(endPt.x * width, endPt.y * height);
            canvasCtx.stroke();
          }
        });

        canvasCtx.fillStyle = '#00ffff';
        landmarks.forEach(landmark => {
          canvasCtx.beginPath();
          canvasCtx.arc(landmark.x * width, landmark.y * height, 2, 0, Math.PI * 2);
          canvasCtx.fill();
        });
        canvasCtx.restore();
      });
    }
  }, []);

  useEffect(() => {
    async function initLandmarker() {
      try {
        const handLandmarker = await getHandLandmarker();
        setLandmarker(handLandmarker);
      } catch (err) {
        console.error("Failed to initialize landmarker:", err);
      }
    }
    initLandmarker();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let animationFrameId: number;
    let stream: MediaStream | null = null;
    const video = videoRef.current;

    if (isMinimized || !cameraEnabled || !landmarker) {
      if (video && video.srcObject) {
        const currentStream = video.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        setIsCameraActive(false);
      }
      return;
    }

    const startCamera = async (retries = 3) => {
      const currentVideo = videoRef.current;
      if (!currentVideo) return;
      try {
        setCameraError(null);
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 }
        });
        if (!isMounted) {
          newStream.getTracks().forEach(track => track.stop());
          return;
        }
        stream = newStream;
        currentVideo.srcObject = stream;
        currentVideo.onloadedmetadata = () => {
          if (!isMounted) return;
          currentVideo.play();
          setIsCameraActive(true);
          detectHands();
        };
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
          setCameraError('CAMERA PERMISSION DENIED');
          setIsCameraActive(false);
          return;
        }
        if (retries > 0 && isMounted) {
          console.log(`Retrying camera access... (${retries} left)`);
          setTimeout(() => startCamera(retries - 1), 500);
        } else {
          setCameraError('CAMERA INITIALIZATION FAILED');
        }
      }
    };

    const detectHands = () => {
      if (!isMounted) return;
      const currentVideo = videoRef.current;
      if (currentVideo && landmarker && currentVideo.readyState >= 2) {
        if (Tone.getContext().state !== 'running' && isAudioStartedRef.current) {
          Tone.getContext().resume();
        }
        const results = landmarker.detectForVideo(currentVideo, performance.now());
        onResults(results);
      }
      animationFrameId = requestAnimationFrame(detectHands);
    };

    startCamera();

    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const currentVideo = videoRef.current;
      if (currentVideo && currentVideo.srcObject) {
        const currentStream = currentVideo.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        currentVideo.srcObject = null;
      }
    };
  }, [cameraEnabled, landmarker, onResults, isMinimized]);

  return (
    <div className="p-4 flex flex-col gap-4 bg-[#c0c0c0] h-full font-pixel select-none max-w-5xl mx-auto w-full">
      {/* Top Section: Camera & Display */}
      <div className="flex gap-4 h-56">
        {/* Camera View */}
        <div className="relative w-56 h-full win-border-inset bg-black overflow-hidden group">
          <video ref={videoRef} className="hidden" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="w-full h-full object-cover" width={320} height={240} />
          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs text-center p-2 bg-black/80 z-20">
              {cameraError}
            </div>
          ) : !isCameraActive ? (
            <div className="absolute inset-0 flex items-center justify-center text-green-500 text-xs animate-pulse z-20">
              INITIALIZING CAMERA...
            </div>
          ) : !landmarker && (
            <div className="absolute inset-0 flex items-center justify-center text-yellow-500 text-xs animate-pulse z-20">
              LOADING TRACKING MODEL...
            </div>
          )}
          
          <div className="absolute bottom-2 right-2 group-hover:opacity-100 transition-opacity z-30">
            <button 
              onClick={() => setCameraEnabled(!cameraEnabled)} 
              className={`win-button p-1 flex items-center gap-1 ${!cameraEnabled ? 'bg-red-200' : ''}`}
            >
              <CameraIcon className="w-3 h-3" />
              <span className="text-[8px] font-bold">{cameraEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Display & Controls */}
        <div className="flex-1 flex flex-col gap-3">
          {/* LCD Display */}
          <div className="lcd-display p-3 flex-1 flex flex-col justify-between relative overflow-hidden border-pink-500/30 text-pink-400">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,100,200,0.03),rgba(255,150,200,0.01),rgba(255,200,200,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
            
            <div className="flex justify-between text-[10px] tracking-widest opacity-80">
              <div className="flex items-center gap-1">
                <Disc className="w-3 h-3" />
                <span>XYLO_SYNTH.V3</span>
              </div>
              <span>{isAudioStarted ? 'OSC_ACTIVE' : 'MUTED'}</span>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold tracking-widest text-center">
                {activeBar !== null ? BARS.find(b => b.id === activeBar)?.label : 'READY'}
              </div>
              <div className="text-[8px] opacity-50 mt-1 uppercase">Material: Rosewood / Octave: {OCTAVES[activeOctave]}</div>
            </div>

            <div className="flex justify-between items-end text-[10px]">
              <div className="flex flex-col gap-1">
                <button 
                  onClick={startAudio} 
                  className="hover:text-white transition-colors border-b border-pink-500/30"
                >
                  {isAudioLoading ? 'LOADING...' : isAudioStarted ? 'RE-SYNC' : 'START SYNTH'}
                </button>
                <button 
                  onClick={() => {
                    const newLatency = !lowLatency;
                    setLowLatency(newLatency);
                    if (Tone.getContext()) {
                      Tone.getContext().lookAhead = newLatency ? 0.01 : 0.1;
                    }
                  }} 
                  className="hover:text-white transition-colors text-left"
                >
                  LATENCY: {lowLatency ? 'LOW' : 'HIGH'}
                </button>
                <button 
                  onClick={() => setPlayMode(playMode === 'touch' ? 'fingers' : 'touch')} 
                  className="hover:text-white transition-colors text-left"
                >
                  MODE: {playMode === 'touch' ? 'STICKS' : 'FINGERS'}
                </button>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] opacity-50">OUTPUT_LEVEL</span>
                <span className="font-bold">{volume}%</span>
              </div>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="win-border-inset p-2 bg-[#d4d4d4] flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-gray-600" />
            <div className="flex-1 flex flex-col gap-1">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume} 
                onChange={(e) => setVolume(parseInt(e.target.value))} 
                className="win-slider w-full" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Xylophone Bars Visualizer */}
      <div className="flex-1 win-border-inset bg-[#2a1a1a] p-6 flex items-center justify-center gap-2 relative overflow-hidden">
        {/* Wood Texture Overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
        
        {BARS.map((bar, i) => {
          const isActive = activeBar === bar.id;
          // Calculate height based on note index (lower notes are longer)
          const heightPercent = 100 - (i * 5);
          
          return (
            <motion.div
              key={bar.id}
              animate={isActive ? { scaleY: 0.95, filter: 'brightness(1.2)' } : { scaleY: 1, filter: 'brightness(1)' }}
              className={`relative win-border-inset transition-all duration-75 flex flex-col items-center justify-end pb-4
                ${isActive ? 'shadow-[0_0_15px_rgba(255,255,255,0.3)]' : ''}`}
              style={{ 
                backgroundColor: bar.color,
                height: `${heightPercent}%`,
                width: '12%',
                borderRadius: '4px'
              }}
            >
              {/* Bar Screws */}
              <div className="absolute top-4 w-2 h-2 rounded-full bg-black/20 border border-white/10" />
              <div className="absolute bottom-12 w-2 h-2 rounded-full bg-black/20 border border-white/10" />
              
              <span className="text-[10px] font-bold text-white drop-shadow-md">
                {bar.label}
              </span>

              {isActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], y: [-20, -40, -60] }}
                  className="absolute -top-8 text-white font-bold text-xs pointer-events-none"
                >
                  ✨
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Instructions Footer */}
      <div className="win-border-inset p-3 bg-[#fdf2f8] text-[10px] leading-tight border-l-4 border-l-pink-600">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-3 h-3 text-pink-600" />
          <span className="font-bold text-pink-900 uppercase tracking-wider">Musician's Guide</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-bold text-pink-800">1. STICKS MODE</p>
            <p className="opacity-70">Left Hand (1-7 fingers) sets Octave. Right Hand Index strikes bars.</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-bold text-pink-800">2. FINGERS MODE</p>
            <p className="opacity-70">Tap 8 fingers (excluding thumbs) in the air to play the 8 bars.</p>
          </div>
        </div>
      </div>
      {/* Startup Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md win-border-outset bg-gray-300 p-6 flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b-2 border-gray-400 pb-4">
                <div className="w-12 h-12 bg-pink-600 flex items-center justify-center win-border-inset">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold italic">Air Xylophone Setup</h2>
                  <p className="text-[10px] opacity-70">Version 1.3.1 - Rosewood Engine Edition</p>
                </div>
              </div>

              <div className="space-y-4 text-[11px] leading-relaxed">
                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-pink-800 mb-1">1. LOAD SAMPLES</p>
                  <p>Click the button below to initialize the xylophone engine and load high-quality rosewood samples.</p>
                </div>
                
                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-blue-800 mb-1">2. CAMERA CALIBRATION</p>
                  <p>Make sure your hands are visible in the camera view. Tracking will start once the engine is active.</p>
                </div>

                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-purple-800 mb-1">3. PLAYING TECHNIQUE</p>
                  <p><span className="font-bold underline">STICKS MODE:</span> Use Left Hand (1-7 fingers) for Octave, Right Hand Index to strike.</p>
                  <p><span className="font-bold underline">FINGERS MODE:</span> Tap 8 fingers in the air to play 8 bars.</p>
                </div>
              </div>

              <button 
                onClick={startAudio}
                className="win-button w-full py-4 text-lg font-bold flex items-center justify-center gap-3 hover:bg-pink-100 transition-colors"
              >
                <Play className="w-6 h-6" />
                <span>START XYLOPHONE</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
