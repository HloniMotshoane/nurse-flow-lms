"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Course, CourseProgress, Quiz, LiveClass, FirestoreDate } from "@/types"
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileText,
  BookOpen,
  Video,
  ChevronRight,
  Loader2,
  Calendar,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

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

interface CourseViewerProps {
  course: Course
  onBack: () => void
  onStartQuiz?: (quiz: Quiz) => void
  onJoinClass?: (liveClass: LiveClass) => void
}

export function CourseViewer({ course, onBack, onStartQuiz, onJoinClass }: CourseViewerProps) {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([])
  const { userData } = useAuth()

  // Safe check for modules array
  const activeModule = course.modules?.[activeModuleIndex]

  useEffect(() => {
    if (course.id && userData?.uid) {
      loadProgress()
      loadCourseQuizzes()
      loadCourseLiveClasses()
    }
  }, [course.id, userData?.uid])

  const loadCourseQuizzes = async () => {
    try {
      const q = query(collection(db, "quizzes"), where("courseId", "==", course.id))
      const snapshot = await getDocs(q)
      const quizzesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Quiz)
      setQuizzes(quizzesData)
    } catch (error) {
      console.error("Error loading quizzes:", error)
    }
  }

  const loadCourseLiveClasses = async () => {
    try {
      const q = query(collection(db, "liveClasses"), where("courseId", "==", course.id))
      const snapshot = await getDocs(q)
      const classesData = snapshot.docs.map((doc) => {
        // We cast to LiveClass, but we handle the date conversion logic in the UI helper
        return { id: doc.id, ...doc.data() } as LiveClass
      })

      // Safe sorting logic using the helper
      classesData.sort((a, b) => {
        const statusOrder: Record<string, number> = { live: 0, upcoming: 1, ended: 2 }
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status]
        }
        return getValidDate(a.scheduledAt).getTime() - getValidDate(b.scheduledAt).getTime();
      })
      setLiveClasses(classesData)
    } catch (error) {
      console.error("Error loading live classes:", error)
    }
  }

  const loadProgress = async () => {
    if (!userData?.uid) return

    try {
      const progressDoc = await getDoc(doc(db, "courseProgress", `${userData.uid}_${course.id}`))
      if (progressDoc.exists()) {
        setProgress({ id: progressDoc.id, ...progressDoc.data() } as CourseProgress)
        const lastModule = progressDoc.data().lastAccessedModule
        if (lastModule) {
          const index = course.modules.findIndex((m) => m.id === lastModule)
          if (index !== -1) setActiveModuleIndex(index)
        }
      } else {
        // Initialize progress
        const newProgress: CourseProgress = {
          userId: userData.uid,
          courseId: course.id,
          completedModules: [],
          progress: 0,
          // FIX: Use FirestoreDate compatible type
          enrolledAt: serverTimestamp() as unknown as FirestoreDate,
          lastAccessedAt: serverTimestamp() as unknown as FirestoreDate,
        }
        await setDoc(doc(db, "courseProgress", `${userData.uid}_${course.id}`), newProgress)
        setProgress(newProgress)
      }
    } catch (error) {
      console.error("Error loading progress:", error)
    } finally {
      setLoading(false)
    }
  }

  const markModuleComplete = async (moduleId: string) => {
    if (!userData?.uid || !progress) return

    const alreadyCompleted = progress.completedModules.includes(moduleId)
    if (alreadyCompleted) return

    const newCompletedModules = [...progress.completedModules, moduleId]
    const newProgress = Math.round((newCompletedModules.length / course.modules.length) * 100)

    try {
      await updateDoc(doc(db, "courseProgress", `${userData.uid}_${course.id}`), {
        completedModules: arrayUnion(moduleId),
        progress: newProgress,
        lastAccessedModule: moduleId,
        lastAccessedAt: serverTimestamp(),
      })

      setProgress({
        ...progress,
        completedModules: newCompletedModules,
        progress: newProgress,
      })
    } catch (error) {
      console.error("Error marking complete:", error)
    }
  }

  const goToNextModule = () => {
    if (activeModuleIndex < course.modules.length - 1) {
      setActiveModuleIndex(activeModuleIndex + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!activeModule) {
    return <div className="p-8 text-center">No modules found for this course.</div>
  }

  const isModuleComplete = progress?.completedModules.includes(activeModule.id) || false

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground mb-2">{course.title}</h1>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">{course.category}</Badge>
            <span className="text-sm text-muted-foreground">{progress?.progress || 0}% Complete</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Module List */}
        <div className="lg:col-span-1">
          <Card className="p-4 space-y-4 sticky top-6 max-h-[80vh] overflow-y-auto">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Course Content</h3>
              <div className="space-y-2">
                {course.modules.map((module, index) => {
                  const isComplete = progress?.completedModules.includes(module.id)
                  const isActive = index === activeModuleIndex

                  return (
                    <button
                      key={module.id}
                      onClick={() => setActiveModuleIndex(index)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3",
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted",
                      )}
                    >
                      <div className="mt-0.5">
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {module.type === "video" && <Video className="w-3 h-3 opacity-70" />}
                          {module.type === "document" && <FileText className="w-3 h-3 opacity-70" />}
                          {module.type === "text" && <BookOpen className="w-3 h-3 opacity-70" />}
                          <span className="text-xs capitalize font-medium opacity-70">{module.type}</span>
                        </div>
                        <p className={cn("text-sm font-medium line-clamp-2", isActive ? "text-primary" : "text-foreground")}>
                          {module.title}
                        </p>
                        {module.duration && <p className="text-xs opacity-75 mt-1">{module.duration} min</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quizzes List */}
            {quizzes.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-foreground mb-2">Quizzes</h3>
                <div className="space-y-2">
                  {quizzes.map((quiz) => (
                    <button
                      key={quiz.id}
                      onClick={() => onStartQuiz?.(quiz)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3 group"
                    >
                      <FileText className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">{quiz.questions.length} questions</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live Classes List */}
            {liveClasses.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-foreground mb-2">Live Classes</h3>
                <div className="space-y-2">
                  {liveClasses.map((liveClass) => (
                    <button
                      key={liveClass.id}
                      onClick={() => onJoinClass?.(liveClass)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="w-4 h-4 text-primary" />
                        {liveClass.status === "live" && (
                          <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-1.5 py-0 h-5">
                            LIVE
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium line-clamp-1 mb-1">{liveClass.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {/* FIX: Use the helper to render the date */}
                        {getValidDate(liveClass.scheduledAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6 shadow-md border-border/60">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">{activeModule.title}</h2>
                  <p className="text-sm text-muted-foreground">{activeModule.description}</p>
                </div>
                {isModuleComplete && (
                  <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>

            {/* Module Content */}
            <div className="space-y-4">
              {activeModule.type === "text" && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">{activeModule.content}</div>
                </div>
              )}

              {activeModule.type === "video" && activeModule.content && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                  <video
                    src={activeModule.content}
                    controls
                    className="w-full h-full"
                    onEnded={() => markModuleComplete(activeModule.id)}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              {activeModule.type === "document" && activeModule.content && (
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full justify-start gap-2 h-12"
                  >
                    <a
                      href={activeModule.content}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="w-5 h-5 text-primary" />
                      Open Document in New Tab
                    </a>
                  </Button>
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(activeModule.content)}&embedded=true`}
                    className="w-full h-[600px] border border-border rounded-lg bg-muted/20"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              {!isModuleComplete && (
                <Button onClick={() => markModuleComplete(activeModule.id)} variant="outline">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
              {activeModuleIndex < course.modules.length - 1 ? (
                <Button onClick={goToNextModule} className="ml-auto gap-2">
                  Next Module
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <div className="ml-auto">
                  <Badge variant="default" className="bg-green-500 text-white px-4 py-2 text-sm">
                    Course Complete!
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}