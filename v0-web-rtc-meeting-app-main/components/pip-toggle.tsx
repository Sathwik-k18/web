"use client"

import { useCallback } from "react"

interface PiPToggleProps {
  videoRef: React.RefObject<HTMLVideoElement>
}

export function PiPToggle({ videoRef }: PiPToggleProps) {
  const togglePip = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        if (video.requestPictureInPicture) {
          await video.requestPictureInPicture()
        }
      }
    } catch (err) {
      console.error("Picture-in-Picture error:", err)
    }
  }, [videoRef])

  return (
    <button
      onClick={togglePip}
      className="px-3 py-1 rounded-md bg-gray-900/70 text-white text-xs hover:bg-gray-900/90"
    >
      PiP
    </button>
  )
}
