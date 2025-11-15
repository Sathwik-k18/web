"use client";

import React, { useState } from "react";

export default function ChatPanel({
  messages,
  username,
  onSend,
  onClose,
}: {
  messages: any[];
  username: string;
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-black text-white p-4 shadow-xl z-50">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold">Chat</h2>
        <button onClick={onClose} className="text-red-400">
          Close
        </button>
      </div>

      <div className="h-[75vh] overflow-y-auto space-y-2 pr-2">
        {messages.map((m) => (
          <div key={m.id} className="bg-white/10 p-2 rounded">
            <div className="text-xs text-gray-300">{m.fromUsername}</div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-white/20 p-2 rounded text-white outline-none"
          placeholder="Type message..."
        />
        <button
          onClick={() => {
            if (text.trim().length > 0) {
              onSend(text);
              setText("");
            }
          }}
          className="bg-blue-500 px-3 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
