import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { getHandLandmarker } from '../../services/handLandmarkerService';
import * as Tone from 'tone';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Camera as CameraIcon, Play, Volume2, Info, Disc, X, Minus, Square, ChevronUp, ChevronDown } from 'lucide-react';

const HARMONIUM_KEYS = [
  { note: 'C', type: 'white', label: 'Sa' },
  { note: 'C#', type: 'black', label: 're' },
  { note: 'D', type: 'white', label: 'Re' },
  { note: 'D#', type: 'black', label: 'ga' },
  { note: 'E', type: 'white', label: 'Ga' },
  { note: 'F', type: 'white', label: 'Ma' },
  { note: 'F#', type: 'black', label: 'ma' },
  { note: 'G', type: 'white', label: 'Pa' },
  { note: 'G#', type: 'black', label: 'dha' },
  { note: 'A', type: 'white', label: 'Dha' },
  { note: 'A#', type: 'black', label: 'ni' },
  { note: 'B', type: 'white', label: 'Ni' },
];

const OCTAVES = [
  { label: 'Mandra (Low)', value: 3, color: '#ef4444' },
  { label: 'Madhya (Mid)', value: 4, color: '#f59e0b' },
  { label: 'Taar (High)', value: 5, color: '#10b981' },
];

const GESTURE_KEYS = [
  { note: 'A', label: 'Dha', gesture: 1 },
  { note: 'B', label: 'Ni', gesture: 2 },
  { note: 'C', label: 'Sa', gesture: 3 },
  { note: 'D', label: 'Re', gesture: 4 },
  { note: 'E', label: 'Ga', gesture: 5 },
  { note: 'F', label: 'Ma', gesture: 6 },
  { note: 'G', label: 'Pa', gesture: 7 },
];

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

  // Thumb detection: compare distance to pinky base (more robust than fixed threshold)
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

export default function AirHarmonium({ isMinimized = false }: { isMinimized?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [activeOctave, setActiveOctave] = useState<number>(1); // Index 1 is Madhya (Octave 4)
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [volume, setVolume] = useState(75);
  const [showHelp, setShowHelp] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [lowLatency, setLowLatency] = useState(() => {
    const saved = localStorage.getItem('air-harmonium-low-latency');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('air-harmonium-low-latency', JSON.stringify(lowLatency));
  }, [lowLatency]);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);

  const activeOctaveRef = useRef(activeOctave);
  const activeNoteRef = useRef(activeNote);
  const isAudioStartedRef = useRef(isAudioStarted);
  const lastTriggeredNote = useRef<string | null>(null);
  const octaveBuffer = useRef<number[]>([]);
  const keyBuffer = useRef<number[]>([]);
  const lowLatencyRef = useRef(lowLatency);

  useEffect(() => { activeOctaveRef.current = activeOctave; }, [activeOctave]);
  useEffect(() => { activeNoteRef.current = activeNote; }, [activeNote]);
  useEffect(() => { isAudioStartedRef.current = isAudioStarted; }, [isAudioStarted]);
  useEffect(() => { lowLatencyRef.current = lowLatency; }, [lowLatency]);

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

      const filter = new Tone.Filter(2000, "lowpass").connect(volNode);
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.5 }
      }).connect(filter);
      
      synthRef.current = synth;
      setIsAudioStarted(true);
      setIsAudioLoading(false);
      setShowInstructions(false);
      
      // Startup Chime
      synth.triggerAttackRelease(["C4", "E4", "G4"], "2n", "+0.1");
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

    if (results.landmarks) {
      let leftHand = null;
      let rightHand = null;
      
      results.landmarks.forEach((landmarks, index) => {
        const classification = results.handednesses[index][0];
        const isRightHand = classification.categoryName === 'Left';
        if (isRightHand) rightHand = landmarks;
        else leftHand = landmarks;
      });

      let positionNote: string | null = null;

      if (leftHand) {
        canvasCtx.save();
        canvasCtx.translate(width, 0);
        canvasCtx.scale(-1, 1);
        leftHand.forEach(landmark => {
          canvasCtx.beginPath();
          canvasCtx.arc(landmark.x * width, landmark.y * height, 2, 0, 2 * Math.PI);
          canvasCtx.fillStyle = '#ff0000';
          canvasCtx.fill();
        });
        canvasCtx.restore();

        const gesture = getGesture(leftHand as any);
        if (gesture >= 1 && gesture <= 3) {
          octaveBuffer.current.push(gesture);
          if (octaveBuffer.current.length > 5) octaveBuffer.current.shift();
          const counts = octaveBuffer.current.reduce((acc, val) => { 
            acc[val] = (acc[val] || 0) + 1; 
            return acc; 
          }, {} as Record<number, number>);
          const sortedCounts = Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number));
          if (sortedCounts.length > 0) {
            const [bestOctave, count] = sortedCounts[0];
            if (typeof count === 'number' && count >= 3 && (parseInt(bestOctave) - 1) !== activeOctaveRef.current) {
              setActiveOctave(parseInt(bestOctave) - 1);
            }
          }
        }
      }

      if (rightHand) {
        canvasCtx.save();
        canvasCtx.translate(width, 0);
        canvasCtx.scale(-1, 1);
        rightHand.forEach(landmark => {
          canvasCtx.beginPath();
          canvasCtx.arc(landmark.x * width, landmark.y * height, 2, 0, 2 * Math.PI);
          canvasCtx.fillStyle = '#ffffff';
          canvasCtx.fill();
        });
        canvasCtx.restore();

        const gesture = getGesture(rightHand as any);
        if (gesture >= 1 && gesture <= 7) {
          keyBuffer.current.push(gesture);
          if (keyBuffer.current.length > 5) keyBuffer.current.shift();
          const counts = keyBuffer.current.reduce((acc, val) => { 
            acc[val] = (acc[val] || 0) + 1; 
            return acc; 
          }, {} as Record<number, number>);
          const sortedCounts = Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number));
          if (sortedCounts.length > 0) {
            const [bestGesture, count] = sortedCounts[0];
            if (typeof count === 'number' && count >= 3) {
              const key = GESTURE_KEYS.find(k => k.gesture === parseInt(bestGesture));
              if (key) positionNote = key.note;
            }
          }
        }
      }

      if (positionNote !== null) {
        const noteName = `${positionNote}${OCTAVES[activeOctaveRef.current].value}`;
        if (lastTriggeredNote.current !== noteName) {
          if (synthRef.current && isAudioStartedRef.current) {
            synthRef.current.triggerAttackRelease(noteName, "4n");
            lastTriggeredNote.current = noteName;
            setActiveNote(positionNote);
          }
        }
      } else {
        setActiveNote(null);
        lastTriggeredNote.current = null;
      }
    } else {
      setActiveNote(null);
      lastTriggeredNote.current = null;
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

    async function setupCamera(retries = 3) {
      const currentVideo = videoRef.current;
      if (!currentVideo) return;
      try {
        setCameraError(null);
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
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
          detect();
        };
      } catch (err: any) {
        console.error("Camera error:", err);
        if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
          setCameraError('CAMERA PERMISSION DENIED');
          setIsCameraActive(false);
          return;
        }
        if (retries > 0 && isMounted) {
          console.log(`Retrying camera access... (${retries} left)`);
          setTimeout(() => setupCamera(retries - 1), 500);
        } else {
          setCameraError('CAMERA INITIALIZATION FAILED');
        }
      }
    }

    function detect() {
      if (!isMounted) return;
      const currentVideo = videoRef.current;
      if (currentVideo && currentVideo.readyState >= 2 && landmarker) {
        if (Tone.getContext().state !== 'running' && isAudioStartedRef.current) {
          Tone.getContext().resume();
        }
        const results = landmarker.detectForVideo(currentVideo, performance.now());
        onResults(results);
      }
      animationFrameId = requestAnimationFrame(detect);
    }

    setupCamera();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
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

  const playNote = (note: string) => {
    if (synthRef.current && isAudioStarted) {
      synthRef.current.triggerAttackRelease(`${note}${OCTAVES[activeOctave].value}`, "4n");
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 bg-gray-300 h-full font-pixel select-none max-w-5xl mx-auto w-full">
      {/* Top Section */}
      <div className="flex gap-4 h-48">
        <div className="relative w-64 h-full win-border-inset bg-black overflow-hidden group">
          <video ref={videoRef} className="hidden" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="w-full h-full object-cover" width={320} height={240} />
          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs text-center p-2 bg-black/80">
              {cameraError}
            </div>
          ) : !isCameraActive ? (
            <div className="absolute inset-0 flex items-center justify-center text-green-500 text-xs animate-pulse">
              INITIALIZING CAMERA...
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

        <div className="flex-1 flex flex-col gap-2">
          <div className="lcd-display p-3 flex-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle,transparent_20%,black_100%)]" />
            <div className="flex justify-between text-[10px] z-10">
              <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> HARMONIUM_CORE.DLL</span>
              <span className={isAudioStarted ? 'text-green-400' : 'text-red-400'}>{isAudioStarted ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div className="text-3xl font-bold tracking-tighter z-10 flex items-baseline gap-2">
              {activeNote ? activeNote : '---'}
              <span className="text-sm opacity-50">{OCTAVES[activeOctave].label}</span>
            </div>
            <div className="flex justify-between items-end z-10">
              <div className="flex flex-col gap-1">
                <button onClick={startAudio} className={`win-button text-[10px] px-2 py-0.5 ${isAudioLoading ? 'animate-pulse' : ''}`}>
                  {isAudioLoading ? 'LOADING...' : isAudioStarted ? 'RESTART ENGINE' : 'START ENGINE'}
                </button>
              </div>
              <div className="flex flex-col gap-1 items-end z-10">
                <button 
                  onClick={() => {
                    const newLatency = !lowLatency;
                    setLowLatency(newLatency);
                    if (Tone.getContext()) {
                      Tone.getContext().lookAhead = newLatency ? 0.01 : 0.1;
                    }
                  }} 
                  className="win-button text-[8px] px-2 py-0.5"
                >
                  LATENCY: {lowLatency ? 'LOW' : 'HIGH'}
                </button>
                <div className="text-[10px] text-right">
                  <div>OCTAVE: {OCTAVES[activeOctave].value}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Volume Scroll */}
        <div className="w-12 h-full flex flex-col items-center gap-2">
          <button onClick={() => setVolume(Math.min(100, volume + 5))} className="win-button p-1"><ChevronUp className="w-4 h-4" /></button>
          <div className="flex-1 w-6 win-border-inset bg-gray-800 relative overflow-hidden">
            <motion.div 
              className="absolute bottom-0 left-0 right-0 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
              animate={{ height: `${volume}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
              {[...Array(10)].map((_, i) => <div key={i} className="h-[1px] w-full bg-white/20" />)}
            </div>
          </div>
          <button onClick={() => setVolume(Math.max(0, volume - 5))} className="win-button p-1"><ChevronDown className="w-4 h-4" /></button>
          <span className="text-[8px] font-bold">{volume}%</span>
        </div>
      </div>

      {/* Keyboard Section */}
      <div className="relative flex-1 win-border-inset bg-white p-1 flex gap-[1px] overflow-hidden">
        {HARMONIUM_KEYS.map((key, i) => (
          <div 
            key={`${key.note}-${i}`}
            onClick={() => playNote(key.note)}
            className={`
              relative flex-1 flex flex-col justify-end items-center pb-2 cursor-pointer transition-all
              ${key.type === 'white' ? 'bg-white h-full z-0 border-x border-gray-200' : 'bg-black h-[60%] z-10 -mx-[15%] win-border-outset border-none'}
              ${activeNote === key.note ? 'bg-yellow-200 shadow-inner translate-y-[2px]' : ''}
              hover:brightness-95 active:brightness-90
            `}
          >
            {key.type === 'white' && (
              <span className="text-[10px] font-bold text-gray-400 pointer-events-none">{key.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="win-border-inset bg-gray-200 p-2">
        <div className="flex justify-between items-center mb-1 border-b border-gray-300 pb-1">
          <span className="text-[10px] font-bold text-[#000080] flex items-center gap-1"><Info className="w-3 h-3" /> HARMONIUM_GUIDE</span>
          <button onClick={() => setShowHelp(!showHelp)} className="text-[10px] hover:underline">{showHelp ? 'HIDE' : 'SHOW'}</button>
        </div>
        <AnimatePresence>
          {showHelp && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden text-[8px] leading-tight space-y-1"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-bold text-[#000080]">LEFT (OCTAVE)</p>
                  <p>1: Index</p>
                  <p>2: Index+Middle</p>
                  <p>3: Index+Mid+Ring</p>
                  <p className="text-gray-500 italic">4-7: Not used</p>
                </div>
                <div>
                  <p className="font-bold text-green-700">RIGHT (KEY)</p>
                  <p>A (Dha): Index</p>
                  <p>B (Ni): Index+Middle</p>
                  <p>C (Sa): Index+Mid+Ring</p>
                  <p>D (Re): Four Fingers</p>
                  <p>E (Ga): Open Palm</p>
                  <p>F (Ma): Thumb Up</p>
                  <p>G (Pa): Index+Thumb</p>
                </div>
              </div>
              <p className="mt-2 text-gray-600 italic">• You can also click the keys directly.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Startup Instructions */}
      <AnimatePresence>
        {showInstructions && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md win-border-outset bg-gray-300 p-6 flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b-2 border-gray-400 pb-4">
                <div className="w-12 h-12 bg-[#000080] flex items-center justify-center win-border-inset">
                  <Wind className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold italic">Air Harmonium Setup</h2>
                  <p className="text-[10px] opacity-70">Version 2.0 - Gesture Edition</p>
                </div>
              </div>

              <div className="space-y-4 text-[11px] leading-relaxed">
                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-[#000080] mb-1">1. INITIALIZE ENGINE</p>
                  <p>Click the button below to start the audio engine.</p>
                </div>
                
                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-[#000080] mb-1">2. CAMERA ALIGNMENT</p>
                  <p>Ensure your hands are visible in the camera view.</p>
                </div>

                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-[#000080] mb-1">3. PLAY WITH GESTURES</p>
                  <p>Left Hand: 1-3 fingers for octave.<br/>Right Hand: 1-7 fingers for notes.</p>
                </div>
              </div>

              <button 
                onClick={startAudio}
                className="win-button w-full py-4 text-lg font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
              >
                <Play className="w-6 h-6" />
                <span>START ENGINE</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
