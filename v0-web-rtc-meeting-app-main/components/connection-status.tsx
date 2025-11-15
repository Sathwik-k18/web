"use client";

export default function ConnectionStatus({
  signalingConnected,
  remoteCount,
}: {
  signalingConnected: boolean;
  remoteCount: number;
}) {
  return (
    <div className="fixed top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-xs backdrop-blur-md">
      <div>
        Signaling:{" "}
        <span className={signalingConnected ? "text-green-400" : "text-red-400"}>
          {signalingConnected ? "Connected" : "Connecting..."}
        </span>
      </div>
      <div>Participants: {1 + remoteCount}</div>
    </div>
  );
}
