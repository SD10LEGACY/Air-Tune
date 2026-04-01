import React, { useState } from 'react';

export default function NotepadApp() {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col h-full bg-white font-sans text-sm">
      <div className="flex gap-4 px-2 py-1 bg-gray-200 border-b border-gray-400 text-xs select-none">
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">File</span>
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">Edit</span>
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">Format</span>
        <span className="hover:bg-blue-800 hover:text-white px-1 cursor-pointer">Help</span>
      </div>
      <textarea 
        className="flex-1 p-1 outline-none resize-none font-mono text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
