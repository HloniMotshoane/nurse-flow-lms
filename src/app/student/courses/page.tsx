"use client"

import { useState } from "react"
import { CourseCatalog } from "@/components/student/course-catalog"
import { CourseViewer } from "@/components/student/course-viewer"
import { AssessmentMode } from "@/components/student/assessment-mode"
import { LiveClassroomLiveKit } from "@/components/student/live-classroom-livekit"
import type { Course, Quiz, LiveClass } from "@/types"

export default function StudentCoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [activeLiveClass, setActiveLiveClass] = useState<LiveClass | null>(null)

  if (activeQuiz) {
    return <AssessmentMode quiz={activeQuiz} onClose={() => setActiveQuiz(null)} />
  }

  if (activeLiveClass) {
    return <LiveClassroomLiveKit liveClass={activeLiveClass} onLeave={() => setActiveLiveClass(null)} />
  }

  return (
    <>
      {selectedCourse ? (
        <CourseViewer
          course={selectedCourse}
          onBack={() => setSelectedCourse(null)}
          onStartQuiz={setActiveQuiz}
          onJoinClass={setActiveLiveClass}
        />
      ) : (
        <CourseCatalog onViewCourse={setSelectedCourse} />
      )}
    </>
  )
}