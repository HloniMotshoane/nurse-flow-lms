"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react"
import "@livekit/components-styles"
import type { LiveClass } from "@/types"
import { useAuth } from "@/hooks/use-auth"
import { X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LiveClassroomLiveKitProps {
  liveClass: LiveClass
  onLeave: () => void
}

export function LiveClassroomLiveKit({ liveClass, onLeave }: LiveClassroomLiveKitProps) {
  const { userData } = useAuth()
  const router = useRouter()
  const [token, setToken] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  // Strict check for host status
  const isHost = Boolean(userData?.uid && liveClass.instructorId === userData.uid)

  // Safe username fallback
  const username = userData?.displayName || userData?.email?.split("@")[0] || `Guest-${Math.floor(Math.random() * 1000)}`

  // Consistent room naming convention
  const roomName = `class-${liveClass.id}`

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const params = new URLSearchParams({
          room: roomName,
          username: username,
          isHost: isHost.toString(), // Pass as string for query param
        })

        const response = await fetch(`/api/livekit-token?${params.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to get access token")
        }

        const data = await response.json()
        setToken(data.token)
      } catch (err) {
        console.error("Error fetching token:", err)
        setError("Failed to connect to classroom. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (liveClass.id && userData) {
      fetchToken()
    }
  }, [roomName, username, isHost, liveClass.id, userData])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#111111] z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white/80 mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Connecting to secure classroom...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#111111] z-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-[#1a1a1a] p-8 rounded-2xl border border-white/10">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Connection Failed</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <Button onClick={onLeave} variant="secondary" className="w-full">
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (!process.env.NEXT_PUBLIC_LIVEKIT_URL) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        Error: NEXT_PUBLIC_LIVEKIT_URL is missing in environment variables.
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#111111]">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        style={{ height: "100vh" }}
        onDisconnected={onLeave}
      >
        {/* Custom Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-[60] p-4 pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              <div>
                <h1 className="font-semibold text-white text-sm">{liveClass.title}</h1>
              </div>
              {isHost && (
                <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/30">
                  HOST
                </span>
              )}
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={onLeave}
              className="rounded-full px-6 shadow-lg hover:bg-red-600"
            >
              <X className="w-4 h-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>

        {/* The LiveKit Conference UI */}
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}