import React, { useState, useEffect, useRef } from 'react';

export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(-1);
  const sequenceStarted = useRef(false);

  useEffect(() => {
    if (step < 0 || step >= 4) return;
    
    console.log(`Boot step ${step} -> ${step + 1}`);
    const timer = setTimeout(() => {
      setStep(s => s + 1);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (step === 4) {
      console.log('Boot sequence final step, waiting to complete');
      const timer = setTimeout(() => {
        console.log('Calling onComplete');
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete]);

  const handleStart = async () => {
    console.log('User clicked to start boot');
    // Start the sequence immediately to avoid perceived lag
    setStep(0);
    
    try {
      const Tone = await import('tone');
      // Tone.start() should be called in response to a user gesture
      await Tone.start();
      console.log('Tone.js started');
    } catch (e) {
      console.warn('Tone.js failed to start:', e);
    }
  };

  if (step === -1) {
    return (
      <div 
        className="w-full h-screen bg-black text-[#c0c0c0] font-mono p-4 flex items-center justify-center cursor-pointer select-none"
        onClick={handleStart}
      >
        <div className="animate-pulse text-xl">Press anywhere to boot...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black text-[#c0c0c0] font-mono p-4 text-xs md:text-sm lg:text-base flex flex-col cursor-none select-none overflow-hidden">
      <pre className="leading-tight">
{`╔════════════════════════════════════════════════════════════════════════════╗
║ CPU Type          : Krait 400 CPU at 2500 MHz                              ║
║ Cache Memory      : 1048576K                                               ║
║ Memory Installed  : 1024M DRAM                                             ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Pri. Master  Disk : 2048MB, ROM                                            ║
║ Pri. Slave   Disk : 12582912MB                                             ║
║ Sec. Master  Disk : 16777216MB                                             ║
║                                                                            ║
║ Display Type      : True HD-IPS+LCD 2560x1440                              ║
║ Serial Port(s)    : A2DP                                                   ║
║ Parallel Port(s)  : 378                                                    ║
║ GPS On Module(s)  : Yes                                                    ║
╚════════════════════════════════════════════════════════════════════════════╝`}
      </pre>
      
      {step >= 1 && (
        <pre className="mt-4 leading-tight">
{`PCI device listing.....
Bus  Device  Device ID  Device Class
──────────────────────────────────────────────────────────────────────────────`}
        </pre>
      )}
      
      {step >= 2 && (
        <pre className="leading-tight">
{`  0      37       24C2      IEEE 802.11 Networking Controller
  0      23       24C4      IEEE 802.15.1 WPAN Controller
  0      22       24C7      Display Controller
  0      21       24CB      A-GPS Receiver Device
  1       8       4E44      Multi-Axis Accelerometer
  1       4       5F33      Proximity Sensor
  1       3       5F34      Ambient Light Sensor
  1       2       5F55      Digital Compass`}
        </pre>
      )}

      {step >= 3 && (
        <pre className="mt-8 leading-tight">
{`Initialization finished....`}
        </pre>
      )}
      
      <div className="animate-pulse mt-1">_</div>
      
      {step >= 0 && (
        <button 
          onClick={onComplete}
          className="mt-auto self-end text-[10px] opacity-30 hover:opacity-100 transition-opacity p-2 cursor-pointer"
        >
          [SKIP BOOT]
        </button>
      )}
    </div>
  );
}

