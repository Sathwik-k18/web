import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import WebRTCRoom from "@/components/webrtc-room"

export default async function MeetingPage({ params }: { params: { code: string } }) {
  const supabase = await createClient()
  const { code } = params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle()

  const username = profile?.username || user.email?.split("@")[0] || "User"

  return <WebRTCRoom meetingCode={code} username={username} />
}
