import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { getHandLandmarker } from '../services/handLandmarkerService';
import * as Tone from 'tone';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Camera as CameraIcon, Play, Volume2, Info, Disc, DollarSign, X, Minus, Square, ChevronUp, ChevronDown } from 'lucide-react';

const DRUM_PADS = [
  { id: 'kick', label: 'KICK', note: 'C1', x: 0.5, y: 0.8, color: '#ef4444' },
  { id: 'snare', label: 'SNARE', note: 'D1', x: 0.3, y: 0.6, color: '#f59e0b' },
  { id: 'hihat', label: 'HI-HAT', note: 'E1', x: 0.7, y: 0.6, color: '#10b981' },
  { id: 'tom1', label: 'TOM 1', note: 'F1', x: 0.4, y: 0.4, color: '#3b82f6' },
  { id: 'tom2', label: 'TOM 2', note: 'G1', x: 0.6, y: 0.4, color: '#8b5cf6' },
  { id: 'crash', label: 'CRASH', note: 'A1', x: 0.5, y: 0.2, color: '#ec4899' },
];

export default function AirDrums({ isMinimized = false }: { isMinimized?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [activePad, setActivePad] = useState<string | null>(null);
  const [volume, setVolume] = useState(75);
  const [showHelp, setShowHelp] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [lowLatency, setLowLatency] = useState(() => {
    const saved = localStorage.getItem('air-drums-low-latency');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [playMode, setPlayMode] = useState<'touch' | 'fingers'>(() => {
    const saved = localStorage.getItem('air-drums-play-mode');
    return (saved as 'touch' | 'fingers') || 'touch';
  });

  useEffect(() => {
    localStorage.setItem('air-drums-low-latency', JSON.stringify(lowLatency));
  }, [lowLatency]);

  useEffect(() => {
    localStorage.setItem('air-drums-play-mode', playMode);
  }, [playMode]);

  const isAudioStartedRef = useRef(isAudioStarted);
  const activePadRef = useRef<string | null>(activePad);
  const padCooldowns = useRef<Record<string, boolean>>({});
  const lowLatencyRef = useRef(lowLatency);
  const playModeRef = useRef(playMode);
  const prevFingerY = useRef<Record<string, number>>({});

  useEffect(() => { isAudioStartedRef.current = isAudioStarted; }, [isAudioStarted]);
  useEffect(() => { activePadRef.current = activePad; }, [activePad]);
  useEffect(() => { lowLatencyRef.current = lowLatency; }, [lowLatency]);
  useEffect(() => { playModeRef.current = playMode; }, [playMode]);

  const drumKitRef = useRef<{ [key: string]: any }>({});
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

      // Create synthesized drum kit
      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: "sine" }
      }).connect(volNode);

      const snare = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
      }).connect(volNode);

      const hihat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).connect(volNode);
      hihat.frequency.value = 200;

      const tom = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: "sine" }
      }).connect(volNode);

      const crash = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 1, release: 1 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).connect(volNode);
      crash.frequency.value = 300;

      drumKitRef.current = {
        C1: kick,
        D1: snare,
        E1: hihat,
        F1: tom,
        G1: tom,
        A1: crash
      };

      setIsAudioStarted(true);
      setIsAudioLoading(false);
      setShowInstructions(false);

      // Startup Chime
      const now = Tone.now();
      kick.triggerAttackRelease("C1", "8n", now + 0.1);
      hihat.triggerAttackRelease("16n", now + 0.2);
      hihat.triggerAttackRelease("16n", now + 0.3);
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

    // Draw Drum Pads with Glow
    DRUM_PADS.forEach(pad => {
      const px = pad.x * width;
      const py = pad.y * height;
      const radius = 30;
      const isActive = activePadRef.current === pad.id;
      
      canvasCtx.save();
      if (isActive) {
        canvasCtx.shadowBlur = 20;
        canvasCtx.shadowColor = pad.color;
      }
      canvasCtx.globalAlpha = isActive ? 0.9 : 0.4;
      canvasCtx.fillStyle = pad.color;
      canvasCtx.beginPath();
      canvasCtx.arc(px, py, radius, 0, Math.PI * 2);
      canvasCtx.fill();
      canvasCtx.strokeStyle = '#ffffff';
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
      
      canvasCtx.globalAlpha = 1;
      canvasCtx.fillStyle = '#ffffff';
      canvasCtx.font = 'bold 8px "Press Start 2P", cursive';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText(pad.label, px, py + 4);
      canvasCtx.restore();
    });

    if (results.landmarks) {
      results.landmarks.forEach((landmarks, index) => {
        const handedness = results.handednesses[index][0].categoryName; // 'Left' or 'Right'
        
        if (playModeRef.current === 'touch') {
          const indexTip = landmarks[8];
          // Only use index finger tip as requested
          const tips = [indexTip];

          tips.forEach((tip, tipIndex) => {
            const tx = (1 - tip.x) * width;
            const ty = tip.y * height;

            DRUM_PADS.forEach(pad => {
              const px = pad.x * width;
              const py = pad.y * height;
              const dist = Math.sqrt(Math.pow(tx - px, 2) + Math.pow(ty - py, 2));
              
              const cooldownKey = `${pad.id}-${handedness}-${tipIndex}`;
              
              // Increased hit radius from 35 to 70 for better playability
              if (dist < 70 && !padCooldowns.current[cooldownKey]) {
                if (drumKitRef.current && isAudioStartedRef.current) {
                  const instrument = drumKitRef.current[pad.note];
                  if (instrument) {
                    if (pad.id === 'hihat' || pad.id === 'crash') {
                      instrument.triggerAttackRelease("16n");
                    } else if (pad.id === 'snare') {
                      instrument.triggerAttack();
                    } else {
                      instrument.triggerAttackRelease(pad.note, "4n");
                    }
                  }
                  setActivePad(pad.id);
                  setTimeout(() => setActivePad(null), 150);
                  
                  padCooldowns.current[cooldownKey] = true;
                  setTimeout(() => { padCooldowns.current[cooldownKey] = false; }, 200);
                }
              }
            });
          });
        } else {
          // Fingers mode
          const fingers = [
            { name: 'thumb', tip: 4, drum: 'kick' },
            { name: 'index', tip: 8, drum: 'snare' },
            { name: 'middle', tip: 12, drum: handedness === 'Left' ? 'hihat' : 'crash' },
            { name: 'ring', tip: 16, drum: 'tom1' },
            { name: 'pinky', tip: 20, drum: 'tom2' }
          ];

          fingers.forEach(finger => {
            const stateKey = `${handedness}-${finger.name}`;
            const currentRelY = landmarks[finger.tip].y - landmarks[0].y;
            const prevRelY = prevFingerY.current[stateKey] ?? currentRelY;
            
            // If finger tip moves down relative to wrist rapidly
            if (currentRelY - prevRelY > 0.03) {
              if (!padCooldowns.current[stateKey]) {
                const pad = DRUM_PADS.find(p => p.id === finger.drum);
                if (pad && drumKitRef.current && isAudioStartedRef.current) {
                  const instrument = drumKitRef.current[pad.note];
                  if (instrument) {
                    if (pad.id === 'hihat' || pad.id === 'crash') {
                      instrument.triggerAttackRelease("16n");
                    } else if (pad.id === 'snare') {
                      instrument.triggerAttack();
                    } else {
                      instrument.triggerAttackRelease(pad.note, "4n");
                    }
                  }
                  setActivePad(pad.id);
                  setTimeout(() => setActivePad(null), 150);
                  
                  padCooldowns.current[stateKey] = true;
                  setTimeout(() => { padCooldowns.current[stateKey] = false; }, 200);
                }
              }
            }
            prevFingerY.current[stateKey] = currentRelY;
          });
        }

        // Draw landmarks manually
        canvasCtx.save();
        canvasCtx.translate(width, 0);
        canvasCtx.scale(-1, 1);
        
        // Draw connections
        const HAND_CONNECTIONS = [
          [0, 1], [1, 2], [2, 3], [3, 4], // thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // index
          [5, 9], [9, 10], [10, 11], [11, 12], // middle
          [9, 13], [13, 14], [14, 15], [15, 16], // ring
          [13, 17], [17, 18], [18, 19], [19, 20], // pinky
          [0, 17] // palm base
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

        canvasCtx.fillStyle = '#00ff00';
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

    if (isMinimized || !cameraEnabled || !landmarker) {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        setIsCameraActive(false);
      }
      return;
    }

    const startCamera = async (retries = 3) => {
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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (!isMounted) return;
            videoRef.current?.play();
            setIsCameraActive(true);
            detectHands();
          };
        }
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
      if (videoRef.current && landmarker && videoRef.current.readyState >= 2) {
        if (Tone.getContext().state !== 'running' && isAudioStartedRef.current) {
          Tone.getContext().resume();
        }
        const results = landmarker.detectForVideo(videoRef.current, performance.now());
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
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraEnabled, landmarker, onResults, isMinimized]);

  return (
    <div className="p-4 flex flex-col gap-4 bg-gray-300 h-full font-pixel select-none max-w-5xl mx-auto w-full">
      {/* Top Section */}
      <div className="flex gap-4 h-64">
        <div className="relative flex-1 h-full win-border-inset bg-black overflow-hidden group">
          <video ref={videoRef} className="hidden" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="w-full h-full object-cover" width={320} height={240} />
          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs text-center p-2 bg-black/80">
              {cameraError}
            </div>
          ) : !isCameraActive ? (
            <div className="absolute inset-0 flex items-center justify-center text-green-500 text-xs animate-pulse">
              INITIALIZING DRUM_KIT...
            </div>
          ) : !landmarker && (
            <div className="absolute inset-0 flex items-center justify-center text-yellow-500 text-xs animate-pulse">
              LOADING TRACKING MODEL...
            </div>
          )}
          <div className="absolute bottom-2 right-2 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setCameraEnabled(!cameraEnabled)} 
              className={`win-button p-1 flex items-center gap-1 ${!cameraEnabled ? 'bg-red-200' : ''}`}
            >
              <CameraIcon className="w-3 h-3" />
              <span className="text-[8px] font-bold">{cameraEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        <div className="w-48 flex flex-col gap-2">
          <div className="lcd-display p-3 flex-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle,transparent_20%,black_100%)]" />
            <div className="flex justify-between text-[8px] z-10">
              <span className="flex items-center gap-1"><Disc className="w-3 h-3 animate-spin" /> CR78_DRUMS.SYS</span>
            </div>
            <div className="text-xl font-bold tracking-tighter z-10 text-center">
              {activePad ? activePad.toUpperCase() : 'READY'}
            </div>
            <div className="flex flex-col gap-1 z-10">
              <button onClick={startAudio} className={`win-button text-[8px] py-1 ${isAudioLoading ? 'animate-pulse' : ''}`}>
                {isAudioLoading ? 'LOADING...' : isAudioStarted ? 'RE-INIT' : 'INIT AUDIO'}
              </button>
              <button 
                onClick={() => {
                  const newLatency = !lowLatency;
                  setLowLatency(newLatency);
                  if (Tone.getContext()) {
                    Tone.getContext().lookAhead = newLatency ? 0.01 : 0.1;
                  }
                }} 
                className="win-button text-[8px] py-1"
              >
                LATENCY: {lowLatency ? 'LOW' : 'HIGH'}
              </button>
              <button 
                onClick={() => setPlayMode(playMode === 'touch' ? 'fingers' : 'touch')} 
                className="win-button text-[8px] py-1"
              >
                MODE: {playMode === 'touch' ? 'STICKS' : 'FINGERS'}
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div className="win-border-inset bg-gray-200 p-2 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[8px] font-bold">
              <span>VOL</span>
              <span>{volume}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setVolume(Math.max(0, volume - 5))} className="win-button p-0.5"><ChevronDown className="w-3 h-3" /></button>
              <div className="flex-1 h-3 win-border-inset bg-gray-800 relative overflow-hidden">
                <motion.div 
                  className="absolute left-0 top-0 bottom-0 bg-green-500"
                  animate={{ width: `${volume}%` }}
                />
              </div>
              <button onClick={() => setVolume(Math.min(100, volume + 5))} className="win-button p-0.5"><ChevronUp className="w-3 h-3" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 win-border-inset bg-white p-3 flex flex-wrap gap-2 justify-center">
          {DRUM_PADS.map(pad => (
            <div 
              key={pad.id}
              className={`px-3 py-1 text-[10px] font-bold border-2 transition-all ${activePad === pad.id ? 'scale-110 shadow-lg' : 'opacity-60'}`}
              style={{ borderColor: pad.color, color: pad.color, backgroundColor: activePad === pad.id ? `${pad.color}22` : 'transparent' }}
            >
              {pad.label}
            </div>
          ))}
        </div>

        <div className="w-64 win-border-inset bg-blue-50 p-2">
          <div className="flex justify-between items-center mb-1 border-b border-blue-200 pb-1">
            <span className="text-[10px] font-bold text-blue-800 flex items-center gap-1"><Info className="w-3 h-3" /> DRUMMER_GUIDE</span>
            <button onClick={() => setShowHelp(!showHelp)} className="text-[10px] hover:underline">{showHelp ? 'HIDE' : 'SHOW'}</button>
          </div>
          <AnimatePresence>
            {showHelp && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden text-[8px] leading-tight space-y-1 text-blue-900"
              >
                <p>• <span className="font-bold">STICKS MODE:</span> Use your index finger tip to hit pads.</p>
                <p>• <span className="font-bold">FINGERS MODE:</span> Tap fingers in the air to play drums.</p>
                <p>• Each pad/finger triggers a unique CR78 sample.</p>
                <p className="opacity-60 italic">* Ensure good lighting for best tracking.</p>
              </motion.div>
            )}
          </AnimatePresence>
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
                <div className="w-12 h-12 bg-green-800 flex items-center justify-center win-border-inset">
                  <Disc className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold italic">Air Drums Setup</h2>
                  <p className="text-[10px] opacity-70">Version 1.5.2 - CR78 Module Edition</p>
                </div>
              </div>

              <div className="space-y-4 text-[11px] leading-relaxed">
                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-green-800 mb-1">1. POWER ON KIT</p>
                  <p>Click the button below to initialize the drum module and load classic CR78 samples.</p>
                </div>
                
                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-blue-800 mb-1">2. CAMERA CALIBRATION</p>
                  <p>Make sure your hands are visible in the camera view. Tracking will start once the module is active.</p>
                </div>

                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-purple-800 mb-1">3. PLAYING TECHNIQUE</p>
                  <p><span className="font-bold underline">STICKS MODE:</span> Use your <span className="font-bold">Index Finger</span> as a drumstick to "strike" the colored pads in the air.</p>
                  <p><span className="font-bold underline">FINGERS MODE:</span> Tap individual fingers in the air to trigger specific drums.</p>
                </div>
              </div>

              <button 
                onClick={startAudio}
                className="win-button w-full py-4 text-lg font-bold flex items-center justify-center gap-3 hover:bg-green-100 transition-colors"
              >
                <Play className="w-6 h-6" />
                <span>START DRUM KIT</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
