"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { LiveClass, ChatMessage, FirestoreDate } from "@/types"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Phone,
  MessageSquare,
  Users,
  Send,
  X,
  Hand,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

// HELPER: Safely convert Firestore Timestamp or Date to JS Date
const getValidDate = (date: FirestoreDate | undefined | null): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  // Check if it's a Firestore Timestamp (has toDate method)
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  return new Date();
}

interface LiveClassroomProps {
  liveClass: LiveClass
  onLeave: () => void
}

export function LiveClassroom({ liveClass, onLeave }: LiveClassroomProps) {
  const { user, userData } = useAuth()
  const [isMuted, setIsMuted] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [handRaised, setHandRaised] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [participants, setParticipants] = useState<string[]>([])

  useEffect(() => {
    const addParticipant = async () => {
      if (user && userData) {
        try {
          await updateDoc(doc(db, "liveClasses", liveClass.id), {
            participants: arrayUnion(userData.email),
          })
        } catch (error) {
          console.error("Error adding participant:", error)
        }
      }
    }
    addParticipant()
  }, [user, userData, liveClass.id])

  useEffect(() => {
    const messagesRef = collection(db, "liveClasses", liveClass.id, "messages")
    const q = query(messagesRef, orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: ChatMessage[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        newMessages.push({
          id: doc.id,
          classId: liveClass.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          message: data.message,
          // We store it as Date in state, but TS thinks it matches ChatMessage interface
          timestamp: getValidDate(data.timestamp),
        })
      })
      setMessages(newMessages)
    })

    return () => unsubscribe()
  }, [liveClass.id])

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "liveClasses", liveClass.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setParticipants(data.participants || [])
      }
    })

    return () => unsubscribe()
  }, [liveClass.id])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !userData) return

    try {
      await addDoc(collection(db, "liveClasses", liveClass.id, "messages"), {
        senderId: user.uid,
        senderName: userData.displayName || userData.email?.split("@")[0],
        senderEmail: userData.email,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  // FIX: Accept FirestoreDate here and convert it
  const formatTime = (date: FirestoreDate | undefined) => {
    const d = getValidDate(date);
    return d.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="fixed inset-0 bg-[#1a1a2e] z-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#16213e] border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <div>
              <h1 className="font-semibold text-white">{liveClass.title}</h1>
              <p className="text-sm text-white/60">{liveClass.instructor}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-white/70 hover:text-white hover:bg-white/10",
                isParticipantsOpen && "bg-white/10 text-white",
              )}
              onClick={() => {
                setIsParticipantsOpen(!isParticipantsOpen)
                if (!isParticipantsOpen) setIsChatOpen(false)
              }}
            >
              <Users className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("text-white/70 hover:text-white hover:bg-white/10", isChatOpen && "bg-white/10 text-white")}
              onClick={() => {
                setIsChatOpen(!isChatOpen)
                if (!isChatOpen) setIsParticipantsOpen(false)
              }}
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className={cn("flex-1 p-4 transition-all", (isChatOpen || isParticipantsOpen) && "lg:mr-80")}>
          {/* Main Video (Instructor) */}
          <div className="relative w-full h-full bg-[#0f0f23] rounded-2xl overflow-hidden">
            {/* Fallback image */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              {/* Ensure this image exists in public folder or remove src */}
              <div className="text-white/20 flex flex-col items-center">
                <Video className="w-16 h-16 mb-2" />
                <p>Instructor Feed</p>
              </div>
            </div>

            {/* Instructor Name */}
            <div className="absolute bottom-6 left-6 flex items-center gap-3 z-10">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{liveClass.instructor.charAt(0)}</span>
              </div>
              <div>
                <p className="text-white font-medium">{liveClass.instructor}</p>
                <p className="text-white/60 text-sm">Host</p>
              </div>
            </div>

            {/* Your Video (Picture-in-Picture) */}
            <div className="absolute bottom-6 right-6 w-48 h-36 bg-[#1a1a2e] rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-10">
              {isVideoOn ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  {/* Placeholder for local video stream */}
                  <span className="text-white/50 text-xs">Camera On</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#16213e]">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {userData?.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">You</span>
                {isMuted && <MicOff className="w-4 h-4 text-red-400" />}
              </div>
            </div>

            {/* Class Info Overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-4 z-10">
              <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
              <div className="bg-black/50 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-sm">
                {participants.length} watching
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Chat */}
        {isChatOpen && (
          <aside className="w-80 bg-[#16213e] border-l border-white/10 flex flex-col fixed right-0 top-[61px] bottom-[73px] lg:relative lg:top-0 lg:bottom-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">Live Chat</h3>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white lg:hidden"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-white/40 text-center text-sm py-8">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid
                    return (
                      <div key={msg.id} className={cn("space-y-1", isMe && "text-right")}>
                        <div
                          className="flex items-center gap-2"
                          style={{ justifyContent: isMe ? "flex-end" : "flex-start" }}
                        >
                          <p className="text-xs text-white/40">{msg.senderName}</p>
                          <p className="text-xs text-white/30">{formatTime(msg.timestamp)}</p>
                        </div>
                        <div
                          className={cn(
                            "inline-block px-4 py-2 rounded-2xl text-sm max-w-[85%]",
                            isMe ? "bg-primary text-white rounded-br-md" : "bg-white/10 text-white rounded-bl-md",
                          )}
                        >
                          {msg.message}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-primary"
                />
                <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </aside>
        )}

        {/* Sidebar - Participants */}
        {isParticipantsOpen && (
          <aside className="w-80 bg-[#16213e] border-l border-white/10 flex flex-col fixed right-0 top-[61px] bottom-[73px] lg:relative lg:top-0 lg:bottom-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">Participants ({participants.length})</h3>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white lg:hidden"
                onClick={() => setIsParticipantsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {/* Host */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">{liveClass.instructor.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{liveClass.instructor}</p>
                    <p className="text-white/40 text-xs">Host</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mic className="w-4 h-4 text-green-400" />
                    <Video className="w-4 h-4 text-green-400" />
                  </div>
                </div>

                {/* Other Participants */}
                {participants.map((email, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <span className="text-white/70 font-semibold">{email.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">
                        {email === userData?.email ? "You" : email.split("@")[0]}
                      </p>
                      <p className="text-white/40 text-xs">Student</p>
                    </div>
                    {email === userData?.email && (
                      <div className="flex items-center gap-1">
                        {isMuted ? (
                          <MicOff className="w-4 h-4 text-red-400" />
                        ) : (
                          <Mic className="w-4 h-4 text-green-400" />
                        )}
                        {isVideoOn ? (
                          <Video className="w-4 h-4 text-green-400" />
                        ) : (
                          <VideoOff className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}
      </div>

      {/* Controls */}
      <footer className="bg-[#16213e] border-t border-white/10 px-4 py-4">
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="lg"
            className={cn(
              "rounded-full w-14 h-14",
              isMuted ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-white/10 text-white hover:bg-white/20",
            )}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className={cn(
              "rounded-full w-14 h-14",
              !isVideoOn
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-white/10 text-white hover:bg-white/20",
            )}
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button variant="ghost" size="lg" className="rounded-full w-14 h-14 bg-white/10 text-white hover:bg-white/20">
            <Monitor className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className={cn(
              "rounded-full w-14 h-14",
              handRaised
                ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                : "bg-white/10 text-white hover:bg-white/20",
            )}
            onClick={() => setHandRaised(!handRaised)}
          >
            <Hand className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="rounded-full px-8 h-14 bg-red-500 text-white hover:bg-red-600"
            onClick={onLeave}
          >
            <Phone className="w-6 h-6 rotate-[135deg]" />
            <span className="ml-2 hidden sm:inline">Leave</span>
          </Button>
        </div>
      </footer>
    </div>
  )
}