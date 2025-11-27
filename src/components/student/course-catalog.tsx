"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Course } from "@/types"
import { BookOpen, Clock, Play, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

interface CourseCardProps {
  course: Course
  onEnroll: (courseId: string) => void
  onViewCourse: (course: Course) => void
  isEnrolled: boolean
}

function CourseCard({ course, onEnroll, onViewCourse, isEnrolled }: CourseCardProps) {
  // Safe calculation with fallback for undefined modules
  const totalDuration = course.modules?.reduce((acc, m) => acc + (m.duration || 0), 0) || 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/50 group">
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/30">
            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">{course.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{course.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="font-normal">{course.category}</Badge>
          <Badge variant="outline" className="capitalize font-normal">
            {course.level}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            {course.modules?.length || 0} modules
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {totalDuration} min
          </span>
        </div>

        <div className="pt-2">
          {isEnrolled ? (
            <Button onClick={() => onViewCourse(course)} className="w-full gap-2">
              <Play className="w-4 h-4" />
              Continue Learning
            </Button>
          ) : (
            <Button onClick={() => onEnroll(course.id)} variant="outline" className="w-full">
              Enroll Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

interface CourseCatalogProps {
  onViewCourse: (course: Course) => void
}

export function CourseCatalog({ onViewCourse }: CourseCatalogProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const { userData } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Only fetch courses that are published
    const q = query(collection(db, "courses"), where("published", "==", true))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[] // Strict type assertion
      setCourses(coursesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleEnroll = async (courseId: string) => {
    if (!userData?.uid) return

    try {
      await updateDoc(doc(db, "courses", courseId), {
        enrolledStudents: arrayUnion(userData.uid),
      })
      toast({
        title: "Enrolled successfully",
        description: "You've been enrolled in the course.",
      })
    } catch (error) {
      console.error("Error enrolling:", error)
      toast({
        title: "Error",
        description: "Failed to enroll in course.",
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Available Courses</h2>
        <p className="text-muted-foreground">Explore and enroll in courses to enhance your nursing skills</p>
      </div>

      {courses.length === 0 ? (
        <Card className="p-12 text-center bg-muted/20 border-dashed">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">No courses available yet</h3>
          <p className="text-muted-foreground">Check back later for new content.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={handleEnroll}
              onViewCourse={onViewCourse}
              // Safe check for enrollment status using optional chaining
              isEnrolled={course.enrolledStudents?.includes(userData?.uid || "") || false}
            />
          ))}
        </div>
      )}
    </div>
  )
}