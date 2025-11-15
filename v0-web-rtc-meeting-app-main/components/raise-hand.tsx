"use client"

import { useState, useEffect } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function RaiseHand({
  channel,
  userId,
  username
}: {
  channel: RealtimeChannel | null
  userId: string
  username: string
}) {
  const [raised, setRaised] = useState(false)
  const [raisedList, setRaisedList] = useState<{ id: string; username: string }[]>([])

  useEffect(() => {
    if (!channel) return
    channel.on("broadcast", { event: "raise-hand" }, ({ payload }) => {
      // payload: { userId, username, action } where action = "raise" | "lower"
      setRaisedList((prev) => {
        if (payload.action === "raise") {
          if (prev.find((p) => p.id === payload.userId)) return prev
          return [...prev, { id: payload.userId, username: payload.username }]
        } else {
          return prev.filter((p) => p.id !== payload.userId)
        }
      })
    })
  }, [channel])

  const toggleRaise = () => {
    if (!channel) return
    const action = raised ? "lower" : "raise"
    const payload = { userId, username, action }
    channel.send({ type: "broadcast", event: "raise-hand", payload })
    setRaised(!raised)
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={toggleRaise} className={`px-3 py-1 rounded ${raised ? "bg-yellow-400 text-black" : "bg-white/10"}`}>
        {raised ? "Lower hand" : "Raise hand"}
      </button>

      {/* small dropdown showing who raised */}
      <div className="text-xs text-white/80">
        {raisedList.length > 0 ? `${raisedList.length} hand${raisedList.length>1?"s":""}` : "No hands"}
      </div>
    </div>
  )
}
