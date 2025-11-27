"use client"

import { useState, useEffect } from "react"
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Course, FirestoreDate } from "@/types"
import { BookOpen, Users, Trash2, Eye, EyeOff, Loader2, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Helper to safely get time from FirestoreDate
const getTime = (date: FirestoreDate | undefined): number => {
  if (!date) return 0;
  if (date instanceof Date) return date.getTime();
  if ('toDate' in date) return date.toDate().getTime();
  return 0;
}

export function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const q = query(collection(db, "courses"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[]

      // Safe sorting using helper
      setCourses(
        coursesData.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
      )
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const togglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "courses", courseId), {
        published: !currentStatus,
      })
      toast({
        title: !currentStatus ? "Course published" : "Course unpublished",
        description: `The course is now ${!currentStatus ? "visible" : "hidden"} to students.`,
      })
    } catch (error) {
      console.error("Error toggling publish:", error)
      toast({
        title: "Error",
        description: "Failed to update course status.",
        variant: "destructive",
      })
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }

    try {
      await deleteDoc(doc(db, "courses", courseId))
      toast({
        title: "Course deleted",
        description: "The course has been removed successfully.",
      })
    } catch (error) {
      console.error("Error deleting course:", error)
      toast({
        title: "Error",
        description: "Failed to delete course.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-foreground">Manage Courses</h2>

      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No courses created yet</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="p-6 transition-all hover:shadow-md">
              <div className="flex items-start gap-4">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-24 h-24 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border border-border">
                    <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={course.published ? "outline" : "default"}
                        onClick={() => togglePublish(course.id, course.published)}
                      >
                        {course.published ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Publish
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => deleteCourse(course.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="secondary" className="font-normal">{course.category}</Badge>
                    <Badge variant="outline" className="capitalize font-normal">
                      {course.level}
                    </Badge>
                    <Badge
                      variant={course.published ? "default" : "secondary"}
                      className={!course.published ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200" : ""}
                    >
                      {course.published ? "Published" : "Draft"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      {course.modules?.length || 0} modules
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {course.enrolledStudents?.length || 0} enrolled
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {course.modules?.reduce((acc, m) => acc + (m.duration || 0), 0)} min
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}