"use client";

import { memo } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  LogOut,
  MessageSquare,
  Hand
} from "lucide-react";

interface Props {
  isMuted: boolean;
  isVideoOff: boolean;
  isSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleShare: () => void;
  onTogglePip: () => void;
  onToggleChat: () => void;
  onToggleRaiseHand: () => void;
  onLeave: () => void;
}

export default memo(function MeetingControls({
  isMuted,
  isVideoOff,
  isSharing,
  onToggleMute,
  onToggleVideo,
  onToggleShare,
  onTogglePip,
  onToggleChat,
  onToggleRaiseHand,
  onLeave,
}: Props) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 p-3 rounded-xl backdrop-blur-md z-50">
      <button onClick={onToggleMute} className="p-2 rounded bg-white/10">
        {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      <button onClick={onToggleVideo} className="p-2 rounded bg-white/10">
        {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
      </button>

      <button onClick={onToggleShare} className="p-2 rounded bg-white/10">
        <MonitorUp size={18} />
      </button>

      <button onClick={onTogglePip} className="p-2 rounded bg-white/10">
        PIP
      </button>

      <button onClick={onToggleRaiseHand} className="p-2 rounded bg-white/10">
        <Hand size={18} />
      </button>

      <button onClick={onToggleChat} className="p-2 rounded bg-white/10">
        <MessageSquare size={18} />
      </button>

      <button onClick={onLeave} className="p-2 rounded bg-red-600 text-white">
        <LogOut size={18} />
      </button>
    </div>
  );
});
