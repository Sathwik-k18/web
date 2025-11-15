"use client"

import React, { useEffect, useRef } from "react"

interface RemoteStream {
  id: string
  stream: MediaStream
  username?: string
}

interface Props {
  localStream: MediaStream | null
  remoteStreams: RemoteStream[]
  localUsername: string
  isMuted: boolean
  isVideoOff: boolean
  isSharing: boolean
  activeSpeaker: string | null
}

export default function VideoGrid({
  localStream,
  remoteStreams,
  localUsername,
  isMuted,
  isVideoOff,
  activeSpeaker
}: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteRefs = useRef<Record<string, HTMLVideoElement>>({})

  // Attach Local Stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Attach Remote Streams
  useEffect(() => {
    remoteStreams.forEach((peer) => {
      if (remoteRefs.current[peer.id]) {
        remoteRefs.current[peer.id].srcObject = peer.stream
      }
    })
  }, [remoteStreams])

  // Dynamic Grid Layout
  const totalUsers = 1 + remoteStreams.length

  let gridStyle = "grid-cols-1"

  if (totalUsers === 2) gridStyle = "grid-cols-2"
  if (totalUsers === 3) gridStyle = "grid-cols-3"
  if (totalUsers >= 4) gridStyle = "grid-cols-2 sm:grid-cols-3"

  const isSpeaker = (id: string) => id === activeSpeaker

  const speakerClass = (id: string) =>
    isSpeaker(id)
      ? "ring-4 ring-blue-500 scale-[1.05] shadow-xl shadow-blue-500/40 z-10"
      : "scale-100 opacity-90"

  return (
    <div className="w-full h-full p-4">
      <div
        className={`grid ${gridStyle} gap-4 h-full`}
        style={{ gridAutoRows: "1fr" }}
      >
        {/* ---- LOCAL VIDEO ---- */}
        <div
          className={`relative rounded-xl overflow-hidden transition-all duration-300 ${speakerClass(
            "local"
          )}`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Username Label */}
          <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 text-xs rounded">
            {localUsername} (You)
          </div>

          {/* Mute / Camera badges */}
          {isMuted && (
            <div className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-1 rounded">
              Muted
            </div>
          )}
          {isVideoOff && (
            <div className="absolute top-2 right-12 text-xs bg-gray-700 text-white px-2 py-1 rounded">
              Camera Off
            </div>
          )}
        </div>

        {/* ---- REMOTE USERS ---- */}
        {remoteStreams.map((peer) => (
          <div
            key={peer.id}
            className={`relative rounded-xl overflow-hidden transition-all duration-300 ${speakerClass(
              peer.id
            )}`}
          >
            <video
              ref={(el) => {
                if (el) remoteRefs.current[peer.id] = el
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Username */}
            <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 text-xs rounded">
              {peer.username || "Guest"}
            </div>

            {/* Active Speaker Indicator */}
            {isSpeaker(peer.id) && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Speaking
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
