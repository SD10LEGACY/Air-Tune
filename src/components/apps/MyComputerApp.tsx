import React from 'react';
import { Monitor, Cpu, HardDrive, Database, Activity } from 'lucide-react';

export default function MyComputerApp() {
  const specs = [
    { label: 'Processor', value: 'AIR_CPU v2.5 @ 4.2GHz', icon: <Cpu className="w-4 h-4" /> },
    { label: 'Memory', value: '128MB RAM (EDO)', icon: <Database className="w-4 h-4" /> },
    { label: 'Storage', value: '2.1GB HDD (SCSI)', icon: <HardDrive className="w-4 h-4" /> },
    { label: 'Graphics', value: 'S3 ViRGE/DX 4MB', icon: <Monitor className="w-4 h-4" /> },
    { label: 'OS', value: 'AIR_TUNE 98 SE', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 flex flex-col gap-4 bg-gray-300 h-full font-pixel">
      <div className="win-border-inset bg-white p-4 flex flex-col gap-4">
        <div className="flex items-center gap-4 border-b border-gray-300 pb-4">
          <Monitor className="w-12 h-12 text-blue-800" />
          <div>
            <h2 className="text-lg font-bold">SYSTEM PROPERTIES</h2>
            <p className="text-[10px] text-gray-500">Version 1.0.29032026</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          {specs.map(spec => (
            <div key={spec.label} className="flex items-center gap-3">
              <div className="w-8 h-8 win-border-outset bg-gray-200 flex items-center justify-center">
                {spec.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-gray-600 uppercase">{spec.label}</span>
                <span className="text-[10px] font-bold">{spec.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto win-border-inset p-2 bg-blue-100 text-[8px] text-blue-800">
        * All systems operational. Hand tracking drivers loaded successfully.
      </div>
    </div>
  );
}
