import React, { useState, useEffect } from 'react';

export default function TaskManagerApp({ openWindows, closeWindow }: any) {
  const [cpu, setCpu] = useState(12);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(Math.floor(Math.random() * 15) + 5 + (openWindows?.length || 0) * 5);
    }, 1000);
    return () => clearInterval(interval);
  }, [openWindows]);

  return (
    <div className="flex flex-col h-full bg-gray-200 font-sans text-xs p-2 gap-2">
      <div className="flex gap-2 mb-2">
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">File</span>
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">Options</span>
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">View</span>
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">Help</span>
      </div>
      
      <div className="bg-white border-2 border-gray-400 border-t-gray-800 border-l-gray-800 flex-1 overflow-auto p-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200 border-b border-gray-400">
              <th className="font-normal p-1 border-r border-gray-400">Task</th>
              <th className="font-normal p-1 border-r border-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {openWindows?.map((w: any) => (
              <tr key={w.id} className="hover:bg-blue-800 hover:text-white cursor-pointer">
                <td className="p-1 border-r border-gray-300">{w.title}</td>
                <td className="p-1">Running</td>
              </tr>
            ))}
            {(!openWindows || openWindows.length === 0) && (
              <tr><td colSpan={2} className="p-1 text-gray-500">No tasks running</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex gap-4">
          <div className="border-2 border-gray-400 border-t-gray-800 border-l-gray-800 p-1 bg-black text-[#00ff00] font-mono w-24 text-center">
            CPU: {cpu}%
          </div>
          <div className="border-2 border-gray-400 border-t-gray-800 border-l-gray-800 p-1 bg-black text-[#00ff00] font-mono w-24 text-center">
            MEM: {Math.floor(cpu * 1.5)}MB
          </div>
        </div>
        <button className="win-button px-4 py-1">End Task</button>
      </div>
    </div>
  );
}
