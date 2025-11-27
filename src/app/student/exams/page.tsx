"use client"

import { useState } from "react"
import { ExamList } from "@/components/student/exam-list"
import { AssessmentMode } from "@/components/student/assessment-mode"
import type { Quiz } from "@/types"

export default function ExamsPage() {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)

  if (activeQuiz) {
    return <AssessmentMode quiz={activeQuiz} onClose={() => setActiveQuiz(null)} />
  }

  return <ExamList onStartExam={setActiveQuiz} />
}