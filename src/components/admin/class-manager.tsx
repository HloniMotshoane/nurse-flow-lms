"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { LiveClass, Course, FirestoreDate } from "@/types"
import { Plus, Trash2, Play, StopCircle, Loader2, Video, Calendar, Clock, Users, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LiveClassroomLiveKit } from "@/components/student/live-classroom-livekit"

// Helper to safely format dates from Firestore
const formatDateTime = (date: FirestoreDate | undefined) => {
  if (!date) return "N/A";
  const d = date instanceof Date ? date : date.toDate();
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function ClassManager() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null)
  const [activeClass, setActiveClass] = useState<LiveClass | null>(null)
  const { userData } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [duration, setDuration] = useState("60")
  const [selectedCourseId, setSelectedCourseId] = useState("")

  useEffect(() => {
    fetchClasses()
    fetchCourses()
  }, [])

  const fetchClasses = async () => {
    try {
      const snapshot = await getDocs(collection(db, "liveClasses"))
      const classesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure we handle the Timestamp correctly immediately upon fetch
          scheduledAt: data.scheduledAt?.toDate ? data.scheduledAt.toDate() : new Date(data.scheduledAt),
        }
      }) as LiveClass[]

      // Sort by scheduled date (descending)
      classesData.sort((a, b) => {
        const dateA = a.scheduledAt instanceof Date ? a.scheduledAt : a.scheduledAt.toDate();
        const dateB = b.scheduledAt instanceof Date ? b.scheduledAt : b.scheduledAt.toDate();
        return dateB.getTime() - dateA.getTime();
      })

      setClasses(classesData)
    } catch (error) {
      console.error("Error fetching classes:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const snapshot = await getDocs(collection(db, "courses"))
      const coursesData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Course)
        .filter((course) => course.published)
      setCourses(coursesData)
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setScheduledDate("")
    setScheduledTime("")
    setDuration("60")
    setSelectedCourseId("")
    setEditingClass(null)
  }

  const handleOpenDialog = (classItem?: LiveClass) => {
    if (classItem) {
      setEditingClass(classItem)
      setTitle(classItem.title)
      setDescription(classItem.description || "")

      // Safely convert FirestoreDate to Date for form inputs
      const date = classItem.scheduledAt instanceof Date
        ? classItem.scheduledAt
        : classItem.scheduledAt.toDate();

      setScheduledDate(date.toISOString().split("T")[0])
      setScheduledTime(date.toTimeString().slice(0, 5))
      setDuration(classItem.duration.toString())
      setSelectedCourseId(classItem.courseId || "")
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return

    setSaving(true)

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`)
      const selectedCourse = courses.find((c) => c.id === selectedCourseId)

      // Strict type construction
      const classData: Partial<LiveClass> = {
        title,
        description,
        instructor: userData.displayName || userData.email,
        instructorId: userData.uid,
        // Cast date to unknown then FirestoreDate to satisfy type checker for now
        // In reality, we are passing a JS Date which Firestore accepts
        scheduledAt: scheduledAt as unknown as FirestoreDate,
        duration: Number.parseInt(duration),
        status: "upcoming",
        courseId: selectedCourseId,
        courseName: selectedCourse?.title || "",
        roomCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      }

      if (editingClass) {
        await updateDoc(doc(db, "liveClasses", editingClass.id), classData)
      } else {
        await addDoc(collection(db, "liveClasses"), {
          ...classData,
          participants: [],
          createdAt: serverTimestamp(),
        })
      }

      await fetchClasses()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving class:", error)
    } finally {
      setSaving(false)
    }
  }

  const toggleClassStatus = async (classItem: LiveClass) => {
    try {
      const newStatus = classItem.status === "live" ? "ended" : classItem.status === "upcoming" ? "live" : "upcoming"
      await updateDoc(doc(db, "liveClasses", classItem.id), { status: newStatus })

      await fetchClasses()

      if (newStatus === "live") {
        // Optimistic update for immediate UI response
        setActiveClass({ ...classItem, status: "live" })
      }
    } catch (error) {
      console.error("Error updating class status:", error)
    }
  }

  const deleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return

    try {
      await deleteDoc(doc(db, "liveClasses", classId))
      await fetchClasses()
    } catch (error) {
      console.error("Error deleting class:", error)
    }
  }

  if (activeClass) {
    return <LiveClassroomLiveKit liveClass={activeClass} onLeave={() => setActiveClass(null)} />
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Live Classes</h2>
          <p className="text-muted-foreground">Schedule and manage live learning sessions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Schedule Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingClass ? "Edit Class" : "Schedule New Class"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">Assign to Course</Label>
                <Select value={selectedCourseId} onValueChange={(val: string) => setSelectedCourseId(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course"} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Class Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Introduction to Anatomy"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will this class cover?"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={15}
                  max={180}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !selectedCourseId} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingClass ? "Update" : "Schedule"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {classes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Classes Scheduled</h3>
          <p className="text-muted-foreground mb-4">Schedule your first live class to get started.</p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Class
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Video className="w-7 h-7 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{classItem.title}</h3>
                    {classItem.status === "live" && (
                      <Badge className="bg-destructive text-destructive-foreground animate-pulse">LIVE</Badge>
                    )}
                    {classItem.status === "upcoming" && <Badge variant="secondary">Upcoming</Badge>}
                    {classItem.status === "ended" && <Badge variant="outline">Ended</Badge>}
                  </div>
                  {classItem.description && (
                    <p className="text-muted-foreground text-sm mb-2 line-clamp-1">{classItem.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {formatDateTime(classItem.scheduledAt)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {classItem.duration} min
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {classItem.participants?.length || 0} joined
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {classItem.status === "upcoming" && (
                    <Button size="sm" onClick={() => toggleClassStatus(classItem)} className="gap-2">
                      <Play className="w-4 h-4" />
                      Start Live
                    </Button>
                  )}
                  {classItem.status === "live" && (
                    <>
                      <Button size="sm" variant="default" onClick={() => setActiveClass(classItem)} className="gap-2">
                        <Video className="w-4 h-4" />
                        Join
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => toggleClassStatus(classItem)}
                        className="gap-2"
                      >
                        <StopCircle className="w-4 h-4" />
                        End
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleOpenDialog(classItem)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteClass(classItem.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}