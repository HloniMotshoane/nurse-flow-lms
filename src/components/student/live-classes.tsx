"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { LiveClass, FirestoreDate } from "@/types"
import { Video, Users, Clock, Play, Calendar, Loader2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LiveClassroomLiveKit } from "@/components/student/live-classroom-livekit"

// HELPER: Safely convert Firestore Timestamp or Date to JS Date
const getValidDate = (date: FirestoreDate | undefined): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  // Check if it's a Firestore Timestamp (has toDate method)
  if ('toDate' in date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  return new Date();
}

export function LiveClasses() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<LiveClass | null>(null)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "liveClasses"))
        const classesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert to Date immediately so the UI is safe
            scheduledAt: getValidDate(data.scheduledAt as FirestoreDate),
          }
        }) as LiveClass[]

        // Sort by status (live first, then upcoming, then ended) and date
        classesData.sort((a, b) => {
          const statusOrder: Record<string, number> = { live: 0, upcoming: 1, ended: 2 }
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status]
          }

          const dateA = getValidDate(a.scheduledAt);
          const dateB = getValidDate(b.scheduledAt);
          return dateA.getTime() - dateB.getTime();
        })

        setClasses(classesData)
      } catch (error) {
        console.error("Error fetching classes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

  if (selectedClass) {
    return <LiveClassroomLiveKit liveClass={selectedClass} onLeave={() => setSelectedClass(null)} />
  }

  const formatTime = (date: Date | FirestoreDate) => {
    const d = getValidDate(date);
    return d.toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date | FirestoreDate) => {
    const d = getValidDate(date);
    return d.toLocaleDateString("en-ZA", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Live Classes</h2>
        <p className="text-muted-foreground">Join interactive learning sessions with your instructors</p>
      </div>

      {classes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Classes Available</h3>
          <p className="text-muted-foreground">Check back later for scheduled classes.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {classes.map((liveClass) => (
            <div
              key={liveClass.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all hover:border-primary/30 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Video className="w-8 h-8 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{liveClass.title}</h3>
                    {liveClass.status === "live" && (
                      <Badge className="bg-red-500 hover:bg-red-600 text-white animate-pulse border-none">LIVE</Badge>
                    )}
                    {liveClass.status === "upcoming" && <Badge variant="secondary">Upcoming</Badge>}
                    {liveClass.status === "ended" && <Badge variant="outline">Ended</Badge>}
                  </div>

                  <p className="text-muted-foreground mb-3">{liveClass.instructor}</p>

                  {liveClass.courseName && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                      <BookOpen className="w-4 h-4" />
                      {liveClass.courseName}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {formatDate(liveClass.scheduledAt)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {formatTime(liveClass.scheduledAt)} ({liveClass.duration} min)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {liveClass.participants?.length || 0} participants
                    </div>
                  </div>
                </div>

                <Button
                  className="gap-2 flex-shrink-0 min-w-[140px]"
                  disabled={liveClass.status === "ended"}
                  variant={liveClass.status === "live" ? "default" : "outline"}
                  onClick={() => setSelectedClass(liveClass)}
                >
                  <Play className="w-4 h-4" />
                  {liveClass.status === "live"
                    ? "Join Now"
                    : liveClass.status === "upcoming"
                      ? "Join When Live"
                      : "Ended"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}