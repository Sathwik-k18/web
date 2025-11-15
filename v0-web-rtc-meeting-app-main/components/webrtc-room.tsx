"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import VideoGrid from "@/components/video-grid"
import { MeetingControls } from "@/components/meeting-controls"
import { ConnectionStatus } from "@/components/connection-status"

interface RemoteStream {
  id: string
  stream: MediaStream
  username?: string
}

interface Props {
  meetingCode: string
  username: string
}

export default function WebRTCRoom({ meetingCode, username }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null)
  const [signalingConnected, setSignalingConnected] = useState(false)

  const channelRef = useRef<any>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const analyzersRef = useRef<Map<string, AnalyserNode>>(new Map())
  const userIdRef = useRef<string>("")

  const localVideoTracks = useRef<MediaStreamTrack[]>([])

  // STUN Servers
  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]

  // Get camera and mic
  const getMedia = async () => {
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
  }

  // -----------------------------
  // INITIAL JOIN
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/auth/login")
        return
      }

      userIdRef.current = data.user.id

      // Setup local stream
      const stream = await getMedia()
      setLocalStream(stream)
      localVideoTracks.current = stream.getVideoTracks()

      // Setup channel
      const channel = supabase.channel(`meeting:${meetingCode}`, {
        config: {
          broadcast: { self: false },
          presence: { key: userIdRef.current }
        }
      })

      channelRef.current = channel

      // Presence sync
      channel.on("presence", { event: "sync" }, () => {
        setSignalingConnected(true)

        const presence = channel.presenceState()
        const users = Object.values(presence).flat()

        users.forEach((u: any) => {
          if (u.user_id !== userIdRef.current && !peersRef.current.has(u.user_id)) {
            createPeer(u.user_id, u.username)
          }
        })
      })

      // presence join
      channel.on("presence", { event: "join" }, ({ newPresences }) => {
        const u = newPresences[0]
        if (u.user_id !== userIdRef.current) createPeer(u.user_id, u.username)
      })

      // presence leave
      channel.on("presence", { event: "leave" }, ({ key }) => {
        peersRef.current.get(key)?.close()
        peersRef.current.delete(key)
        analyzersRef.current.delete(key)
        setRemoteStreams((prev) => prev.filter((p) => p.id !== key))
      })

      // Signaling events
      channel.on("broadcast", { event: "offer" }, ({ payload }) => {
        if (payload.to === userIdRef.current) handleOffer(payload)
      })

      channel.on("broadcast", { event: "answer" }, ({ payload }) => {
        if (payload.to === userIdRef.current) handleAnswer(payload)
      })

      channel.on("broadcast", { event: "ice" }, ({ payload }) => {
        if (payload.to === userIdRef.current) handleIce(payload)
      })

      // Subscribe + announce presence
      await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userIdRef.current, username })
        }
      })
    }

    init()
  }, [])

  // -----------------------------
  // PEER CONNECTION CREATION
  // -----------------------------
  const createPeer = async (peerId: string, peerUsername?: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    // Add local tracks
    localStream?.getTracks().forEach((track) => {
      pc.addTrack(track, localStream!)
    })

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0]

      // Setup analyzer for active speaker detection
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(remoteStream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyzersRef.current.set(peerId, analyser)

      setRemoteStreams((prev) => {
        const exists = prev.find((p) => p.id === peerId)
        if (exists) return prev
        return [...prev, { id: peerId, stream: remoteStream, username: peerUsername }]
      })
    }

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice",
          payload: {
            from: userIdRef.current,
            to: peerId,
            candidate: event.candidate
          }
        })
      }
    }

    peersRef.current.set(peerId, pc)

    // Create and send offer
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    channelRef.current.send({
      type: "broadcast",
      event: "offer",
      payload: {
        from: userIdRef.current,
        to: peerId,
        offer,
        username
      }
    })
  }

  // -----------------------------
  // SIGNALING HANDLERS
  // -----------------------------
  const handleOffer = async ({ from, offer, username }: any) => {
    let pc = peersRef.current.get(from)
    if (!pc) createPeer(from, username)

    pc = peersRef.current.get(from)!
    await pc.setRemoteDescription(new RTCSessionDescription(offer))

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    channelRef.current.send({
      type: "broadcast",
      event: "answer",
      payload: { from: userIdRef.current, to: from, answer }
    })
  }

  const handleAnswer = async ({ from, answer }: any) => {
    const pc = peersRef.current.get(from)
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer))
  }

  const handleIce = async ({ from, candidate }: any) => {
    const pc = peersRef.current.get(from)
    if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate))
  }

  // -----------------------------
  // ACTIVE SPEAKER DETECTION
  // -----------------------------
  useEffect(() => {
    const detect = () => {
      let loudestId: string | null = null
      let maxVolume = 0

      analyzersRef.current.forEach((analyser, peerId) => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(dataArray)
        const volume = dataArray.reduce((a, b) => a + b, 0)

        if (volume > maxVolume) {
          maxVolume = volume
          loudestId = peerId
        }
      })

      if (maxVolume > 2000) setActiveSpeaker(loudestId)
      else setActiveSpeaker(null)

      requestAnimationFrame(detect)
    }

    detect()
  }, [])

  // -----------------------------
  // CONTROL BUTTONS
  // -----------------------------
  const toggleMute = () => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled))
    setIsMuted(!isMuted)
  }

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled))
    setIsVideoOff(!isVideoOff)
  }

  const toggleShare = async () => {
    if (!isSharing) {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const track = screen.getVideoTracks()[0]

      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video")
        if (sender) sender.replaceTrack(track)
      })

      setIsSharing(true)

      track.onended = () => toggleShare()
    } else {
      const track = localVideoTracks.current[0]

      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video")
        if (sender && track) sender.replaceTrack(track)
      })

      setIsSharing(false)
    }
  }

  const leave = () => {
    localStream?.getTracks().forEach((t) => t.stop())
    peersRef.current.forEach((pc) => pc.close())
    channelRef.current?.unsubscribe()
    router.push("/home")
  }

  return (
    <div className="w-full h-full relative">
      <ConnectionStatus
        signalingConnected={signalingConnected}
        remoteCount={remoteStreams.length}
      />

      <VideoGrid
        localStream={localStream}
        remoteStreams={remoteStreams}
        localUsername={username}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isSharing={isSharing}
        activeSpeaker={activeSpeaker}
      />

      <MeetingControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isSharing={isSharing}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleShare={toggleShare}
        onLeave={leave}
      />
    </div>
  )
}
