import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { getHandLandmarker } from '../services/handLandmarkerService';
import * as Tone from 'tone';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Camera as CameraIcon, Play, Volume2, Info, Disc, DollarSign, X, Minus, Square, ChevronUp, ChevronDown } from 'lucide-react';

const CHORDS = [
  { label: 'C Major', value: ['C3', 'E3', 'G3', 'C4'], color: '#ef4444' },
  { label: 'D Major', value: ['D3', 'F#3', 'A3', 'D4'], color: '#f59e0b' },
  { label: 'E Major', value: ['E3', 'G#3', 'B3', 'E4'], color: '#10b981' },
  { label: 'F Major', value: ['F3', 'A3', 'C4', 'F4'], color: '#3b82f6' },
  { label: 'G Major', value: ['G3', 'B3', 'D4', 'G4'], color: '#8b5cf6' },
  { label: 'A Minor', value: ['A2', 'C3', 'E3', 'A3'], color: '#ec4899' },
];

const STRING_BASE_MIDI = [64, 59, 55, 50, 45, 40]; // E4, B3, G3, D3, A2, E2
const MIDI_TO_NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const getNoteFromMidi = (midi: number) => {
  const octave = Math.floor(midi / 12) - 1;
  const note = MIDI_TO_NOTE[midi % 12];
  return `${note}${octave}`;
};

export default function AirGuitar({ isMinimized = false }: { isMinimized?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [activeChord, setActiveChord] = useState<number>(0);
  const [isStrumming, setIsStrumming] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [volume, setVolume] = useState(75);
  const [lowLatency, setLowLatency] = useState(() => {
    const saved = localStorage.getItem('air-guitar-low-latency');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [playMode, setPlayMode] = useState<'strum' | 'fretboard'>(() => {
    const saved = localStorage.getItem('air-guitar-play-mode');
    return (saved as 'strum' | 'fretboard') || 'fretboard';
  });

  useEffect(() => {
    localStorage.setItem('air-guitar-low-latency', JSON.stringify(lowLatency));
  }, [lowLatency]);

  useEffect(() => {
    localStorage.setItem('air-guitar-play-mode', playMode);
  }, [playMode]);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);

  const activeChordRef = useRef(activeChord);
  const isAudioStartedRef = useRef(isAudioStarted);
  const lastStrumY = useRef<number | null>(null);
  const strumStartY = useRef<number | null>(null);
  const strumCooldown = useRef(false);
  const lowLatencyRef = useRef(lowLatency);
  const playModeRef = useRef(playMode);
  const lastPlayedFret = useRef<Record<string, string>>({});
  const lastRightHandY = useRef<number | null>(null);

  useEffect(() => { activeChordRef.current = activeChord; }, [activeChord]);
  useEffect(() => { isAudioStartedRef.current = isAudioStarted; }, [isAudioStarted]);
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

      const synth = new Tone.PolySynth(Tone.Synth).connect(volNode);
      synth.set({
        oscillator: { type: "triangle" } as any,
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 1.5 }
      });
      
      synthRef.current = synth;
      setIsAudioStarted(true);
      setIsAudioLoading(false);
      setShowInstructions(false);
      // Startup Chime
      const now = Tone.now();
      synth.triggerAttackRelease(["E2", "E3", "G3"], "2n", now + 0.1);
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

    if (playModeRef.current === 'fretboard') {
      // Draw Fretboard Grid
      canvasCtx.save();
      canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      canvasCtx.lineWidth = 1;
      
      const numStrings = 6;
      const numFrets = 15;
      const stringSpacing = height / numStrings;
      const fretSpacing = width / numFrets;

      // Draw strings (horizontal)
      for (let i = 0; i <= numStrings; i++) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, i * stringSpacing);
        canvasCtx.lineTo(width, i * stringSpacing);
        canvasCtx.stroke();
      }

      // Draw frets (vertical)
      for (let i = 0; i <= numFrets; i++) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(i * fretSpacing, 0);
        canvasCtx.lineTo(i * fretSpacing, height);
        canvasCtx.stroke();
      }

      // Fret markers
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      [3, 5, 7, 9, 12].forEach(fret => {
        if (fret < numFrets) {
          canvasCtx.beginPath();
          canvasCtx.arc((fret - 0.5) * fretSpacing, height / 2, 10, 0, Math.PI * 2);
          canvasCtx.fill();
        }
      });
      canvasCtx.restore();
    } else {
      // Draw Guitar Strings (Visual) for strum mode
      canvasCtx.save();
      canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      canvasCtx.lineWidth = 1;
      const strumLineY = height * 0.5;
      for (let i = 0; i < 6; i++) {
        const y = strumLineY - 20 + (i * 8);
        canvasCtx.beginPath();
        canvasCtx.moveTo(width * 0.3, y);
        canvasCtx.lineTo(width * 0.7, y);
        canvasCtx.stroke();
      }
      canvasCtx.restore();
    }

    if (results.landmarks) {
      let leftHand = null;
      let rightHand = null;
      results.landmarks.forEach((landmarks, index) => {
        const classification = results.handednesses[index][0];
        // MediaPipe's "Left" is actually the user's right hand in a mirrored view
        const isRightHand = classification.categoryName === 'Left';
        if (isRightHand) rightHand = landmarks;
        else leftHand = landmarks;
      });

      const HAND_CONNECTIONS = [
        [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
      ];

      const processFretboardMode = (leftHand: any, rightHand: any) => {
        if (playModeRef.current !== 'fretboard') return;

        const numStrings = 6;
        const numFrets = 15;
        const stringSpacing = height / numStrings;
        const fretSpacing = width / numFrets;

        let selectedStringIdx = -1;
        let selectedFretIdx = -1;

        if (leftHand) {
          const lIndexTip = leftHand[8];
          const ly = lIndexTip.y * height;
          selectedStringIdx = Math.floor(ly / stringSpacing);
          
          // Draw string highlight
          if (selectedStringIdx >= 0 && selectedStringIdx < numStrings) {
            canvasCtx.save();
            canvasCtx.fillStyle = 'rgba(0, 255, 255, 0.2)';
            canvasCtx.fillRect(0, selectedStringIdx * stringSpacing, width, stringSpacing);
            canvasCtx.restore();
          }
        }

        if (rightHand) {
          const rIndexTip = rightHand[8];
          const rx = (1 - rIndexTip.x) * width;
          const ry = rIndexTip.y * height;
          selectedFretIdx = Math.floor(rx / fretSpacing);

          // Draw fret highlight
          if (selectedFretIdx >= 0 && selectedFretIdx < numFrets) {
            canvasCtx.save();
            canvasCtx.fillStyle = 'rgba(255, 0, 255, 0.2)';
            canvasCtx.fillRect(selectedFretIdx * fretSpacing, 0, fretSpacing, height);
            canvasCtx.restore();
          }

          // Intersection highlight
          if (selectedStringIdx !== -1 && selectedFretIdx !== -1) {
            canvasCtx.save();
            canvasCtx.fillStyle = 'rgba(255, 255, 0, 0.6)';
            canvasCtx.fillRect(selectedFretIdx * fretSpacing, selectedStringIdx * stringSpacing, fretSpacing, stringSpacing);
            canvasCtx.restore();

            const cellId = `${selectedStringIdx}-${selectedFretIdx}`;
            
            // Trigger sound when right hand moves vertically (plucking) or enters a new fret
            const rVelocityY = Math.abs(ry - (lastRightHandY.current || ry));
            const isPlucking = rVelocityY > 15; // Threshold for pluck movement
            
            if ((isPlucking || lastPlayedFret.current['combined'] !== cellId) && synthRef.current && isAudioStartedRef.current) {
              const midiNote = STRING_BASE_MIDI[selectedStringIdx] + selectedFretIdx;
              const noteName = getNoteFromMidi(midiNote);
              synthRef.current.triggerAttackRelease(noteName, "4n");
              lastPlayedFret.current['combined'] = cellId;
            }
          }
          lastRightHandY.current = ry;
        } else {
          lastPlayedFret.current['combined'] = '';
          lastRightHandY.current = null;
        }
      };

      if (playModeRef.current === 'fretboard') {
        processFretboardMode(leftHand, rightHand);
      }

      if (leftHand) {
        if (playModeRef.current === 'strum') {
          const gesture = getGesture(leftHand as any);
          if (gesture >= 0 && gesture < CHORDS.length) setActiveChord(gesture);
        }
        
        canvasCtx.save();
        canvasCtx.translate(width, 0);
        canvasCtx.scale(-1, 1);
        
        canvasCtx.strokeStyle = '#ff00ff';
        canvasCtx.lineWidth = 2;
        HAND_CONNECTIONS.forEach(([start, end]) => {
          const startPt = leftHand[start];
          const endPt = leftHand[end];
          if (startPt && endPt) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(startPt.x * width, startPt.y * height);
            canvasCtx.lineTo(endPt.x * width, endPt.y * height);
            canvasCtx.stroke();
          }
        });

        canvasCtx.fillStyle = '#ffffff';
        leftHand.forEach(landmark => {
          canvasCtx.beginPath();
          canvasCtx.arc(landmark.x * width, landmark.y * height, 2, 0, Math.PI * 2);
          canvasCtx.fill();
        });
        canvasCtx.restore();
      } else {
        lastPlayedFret.current['left'] = '';
      }

      if (rightHand) {
        if (playModeRef.current === 'strum') {
          const wrist = rightHand[0];
          const currentY = wrist.y;
          
          const zone = currentY < 0.35 ? 0 : (currentY > 0.65 ? 2 : 1);
          
          if (strumStartY.current === null) {
            strumStartY.current = zone;
          } else if (zone === 0 || zone === 2) {
            if (strumStartY.current !== zone && !strumCooldown.current) {
              if (synthRef.current && isAudioStartedRef.current) {
                const chord = CHORDS[activeChordRef.current].value;
                synthRef.current.releaseAll();
                synthRef.current.triggerAttackRelease(chord, "2n");
                setIsStrumming(true);
                setTimeout(() => setIsStrumming(false), 200);
                strumCooldown.current = true;
                setTimeout(() => { strumCooldown.current = false; }, 150);
              }
              strumStartY.current = zone;
            }
          }
          lastStrumY.current = currentY;
        }

        canvasCtx.save();
        canvasCtx.translate(width, 0);
        canvasCtx.scale(-1, 1);
        
        canvasCtx.strokeStyle = '#00ffff';
        canvasCtx.lineWidth = 2;
        HAND_CONNECTIONS.forEach(([start, end]) => {
          const startPt = rightHand[start];
          const endPt = rightHand[end];
          if (startPt && endPt) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(startPt.x * width, startPt.y * height);
            canvasCtx.lineTo(endPt.x * width, endPt.y * height);
            canvasCtx.stroke();
          }
        });

        canvasCtx.fillStyle = '#ffffff';
        rightHand.forEach(landmark => {
          canvasCtx.beginPath();
          canvasCtx.arc(landmark.x * width, landmark.y * height, 2, 0, Math.PI * 2);
          canvasCtx.fill();
        });
        canvasCtx.restore();
      } else {
        lastPlayedFret.current['right'] = '';
      }
    } else {
      lastPlayedFret.current['left'] = '';
      lastPlayedFret.current['right'] = '';
    }
  }, []);

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
    
    return 0;
  };

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
              INITIALIZING AMP...
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
          <AnimatePresence>
            {isStrumming && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.1, 1] }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 border-[8px] border-yellow-400/50 pointer-events-none z-10"
              />
            )}
          </AnimatePresence>
        </div>

        <div className="w-56 flex flex-col gap-2">
          <div className="lcd-display p-3 flex-1 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle,transparent_20%,black_100%)]" />
            <div className="flex justify-between text-[8px] z-10">
              <span className="flex items-center gap-1"><Disc className={`w-3 h-3 ${isStrumming ? 'animate-spin' : ''}`} /> GUITAR_AMP.SYS</span>
              <span className={isAudioStarted ? 'text-green-400' : 'text-red-400'}>{isAudioStarted ? 'LOCKED' : 'NO_SIG'}</span>
            </div>
            <div className="text-2xl font-bold tracking-tighter z-10 text-center">
              {CHORDS[activeChord].label.toUpperCase()}
            </div>
            <div className="flex flex-col gap-1 z-10">
              <button onClick={startAudio} className={`win-button text-[8px] py-1 ${isAudioLoading ? 'animate-pulse' : ''}`}>
                {isAudioLoading ? 'LOADING...' : isAudioStarted ? 'RE-INIT' : 'INIT AMP'}
              </button>
              <div className="flex justify-between items-end text-[8px] opacity-70">
                <button 
                  onClick={() => {
                    const newLatency = !lowLatency;
                    setLowLatency(newLatency);
                    if (Tone.getContext()) {
                      Tone.getContext().lookAhead = newLatency ? 0.01 : 0.1;
                    }
                  }} 
                  className="win-button text-[8px] px-1 py-0.5"
                >
                  LATENCY: {lowLatency ? 'LOW' : 'HIGH'}
                </button>
                <button 
                  onClick={() => setPlayMode(playMode === 'strum' ? 'fretboard' : 'strum')} 
                  className="win-button text-[8px] px-1 py-0.5"
                >
                  MODE: {playMode.toUpperCase()}
                </button>
              </div>
            </div>
          </div>

          {/* Volume Control */}
          <div className="win-border-inset bg-gray-200 p-2 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[8px] font-bold">
              <span>AMP_GAIN</span>
              <span>{volume}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setVolume(Math.max(0, volume - 5))} className="win-button p-0.5"><ChevronDown className="w-3 h-3" /></button>
              <div className="flex-1 h-3 win-border-inset bg-gray-800 relative overflow-hidden">
                <motion.div 
                  className="absolute left-0 top-0 bottom-0 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  animate={{ width: `${volume}%` }}
                />
              </div>
              <button onClick={() => setVolume(Math.min(100, volume + 5))} className="win-button p-0.5"><ChevronUp className="w-3 h-3" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Chords Section */}
      <div className="grid grid-cols-3 gap-2">
        {CHORDS.map((chord, i) => (
          <div 
            key={chord.label}
            className={`win-border-inset p-2 flex flex-col gap-1 transition-all ${activeChord === i ? 'bg-white translate-y-[1px]' : 'bg-gray-200 opacity-60'}`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold">{chord.label}</span>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chord.color }} />
            </div>
            <div className="flex gap-1">
              {chord.value.map(note => <span key={note} className="text-[7px] bg-gray-100 px-1 border border-gray-300">{note}</span>)}
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="win-border-inset bg-blue-50 p-2">
        <div className="flex justify-between items-center mb-1 border-b border-blue-200 pb-1">
          <span className="text-[10px] font-bold text-blue-800 flex items-center gap-1"><Info className="w-3 h-3" /> GUITAR_GUIDE</span>
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
              <p>• <span className="font-bold">STRUM MODE:</span> Left hand gestures select chords, Right hand strums up/down.</p>
              <p>• <span className="font-bold">FRETBOARD MODE:</span> Use index fingers to press strings (1-6) and frets (1-15) on the grid.</p>
              <p className="opacity-70 italic">* Tip: Switch modes using the MODE button on the amp.</p>
            </motion.div>
          )}
        </AnimatePresence>
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
                <div className="w-12 h-12 bg-red-800 flex items-center justify-center win-border-inset">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold italic">Air Guitar Setup</h2>
                  <p className="text-[10px] opacity-70">Version 2.2.0 - Fretboard Edition</p>
                </div>
              </div>

              <div className="space-y-4 text-[11px] leading-relaxed">
                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-red-800 mb-1">1. PLUG IN AMP</p>
                  <p>Click the button below to initialize the virtual amplifier and load acoustic guitar samples.</p>
                </div>
                
                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-green-800 mb-1">2. CAMERA CHECK</p>
                  <p>Position yourself so your upper body is visible. Tracking will start once the camera is active.</p>
                </div>

                <div className="bg-white/50 p-3 win-border-inset">
                  <p className="font-bold text-blue-800 mb-1">3. HOW TO PLAY</p>
                  <p>Use <span className="font-bold underline">Strum Mode</span> for chords, or <span className="font-bold underline">Fretboard Mode</span> to play individual notes on the grid.</p>
                </div>
              </div>

              <button 
                onClick={startAudio}
                className="win-button w-full py-4 text-lg font-bold flex items-center justify-center gap-3 hover:bg-red-100 transition-colors"
              >
                <Play className="w-6 h-6" />
                <span>START AMP</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
