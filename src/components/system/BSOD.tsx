import React, { useEffect } from 'react';

export default function BSOD({ onRecover }: { onRecover: () => void }) {
  useEffect(() => {
    const handleKeyDown = () => onRecover();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRecover]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0000AA] text-white font-mono p-8 flex flex-col items-center justify-center cursor-none select-none text-sm md:text-xl">
      <div className="max-w-3xl w-full flex flex-col gap-6">
        <div className="bg-white text-[#0000AA] px-2 py-1 font-bold w-fit mx-auto">
          Windows
        </div>
        
        <p>
          A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) + 
          00010E36. The current application will be terminated.
        </p>
        
        <ul className="list-none space-y-2 ml-4">
          <li>*  Press any key to terminate the current application.</li>
          <li>*  Press CTRL+ALT+DEL again to restart your computer. You will<br/>
             &nbsp;&nbsp;&nbsp;lose any unsaved information in all applications.</li>
        </ul>
        
        <p className="text-center mt-8">
          Press any key to continue <span className="animate-pulse">_</span>
        </p>
      </div>
    </div>
  );
}
