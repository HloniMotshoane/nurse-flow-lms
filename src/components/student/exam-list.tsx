"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { Quiz, QuizResult } from "@/types"
import { FileText, Clock, CheckCircle, Play, Loader2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ExamListProps {
  onStartExam: (quiz: Quiz) => void
}

export function ExamList({ onStartExam }: ExamListProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [results, setResults] = useState<Record<string, QuizResult>>({})
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch quizzes
        const quizzesSnapshot = await getDocs(collection(db, "quizzes"))
        const quizzesData = quizzesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Quiz[]
        setQuizzes(quizzesData)

        // Fetch user's results
        if (user) {
          const resultsQuery = query(collection(db, "results"), where("userId", "==", user.uid))
          const resultsSnapshot = await getDocs(resultsQuery)
          const resultsMap: Record<string, QuizResult> = {}

          resultsSnapshot.docs.forEach((doc) => {
            const data = doc.data() as QuizResult
            resultsMap[data.quizId] = data
          })
          setResults(resultsMap)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

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
        <h2 className="text-2xl font-bold text-foreground">Exams</h2>
        <p className="text-muted-foreground">Complete assessments to track your progress</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Exams Available</h3>
          <p className="text-muted-foreground">Check back later for new assessments.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const result = results[quiz.id]
            const isCompleted = !!result
            const score = result ? Math.round((result.score / result.totalQuestions) * 100) : 0

            return (
              <div
                key={quiz.id}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all hover:border-primary/30 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  {isCompleted ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {score}%
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      Not Started
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">{quiz.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                  {quiz.description || "No description available"}
                </p>

                {quiz.courseName && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <BookOpen className="w-3 h-3" />
                    {quiz.courseName}
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">{quiz.questions.length} questions</span>
                  <Button size="sm" className="gap-2" onClick={() => onStartExam(quiz)}>
                    <Play className="w-4 h-4" />
                    {isCompleted ? "Retake" : "Start"}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}