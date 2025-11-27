"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { QuizResult, Quiz } from "@/types"
import { BookOpen, Trophy, TrendingUp, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function MyLearning() {
  const { user } = useAuth()
  // Strict intersection type for joined data
  const [results, setResults] = useState<(QuizResult & { quiz?: Quiz })[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalPassed: 0,
    averageScore: 0,
  })

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return

      try {
        // 1. Fetch user's quiz results
        const resultsQuery = query(collection(db, "results"), where("userId", "==", user.uid))
        const resultsSnapshot = await getDocs(resultsQuery)
        const resultsData: QuizResult[] = []

        resultsSnapshot.forEach((doc) => {
          resultsData.push({ id: doc.id, ...doc.data() } as QuizResult)
        })

        // 2. Fetch all quizzes to get titles
        // (Optimization: In a huge app, you'd fetch only specific IDs, but this is fine for MVP)
        const quizzesSnapshot = await getDocs(collection(db, "quizzes"))
        const quizzesMap: Record<string, Quiz> = {}

        quizzesSnapshot.forEach((doc) => {
          quizzesMap[doc.id] = { id: doc.id, ...doc.data() } as Quiz
        })

        // 3. Combine results with quiz info
        const enrichedResults = resultsData.map((result) => ({
          ...result,
          quiz: quizzesMap[result.quizId],
        }))

        // Sort by most recent (assuming Firestore ID generation roughly correlates or add a timestamp field)
        setResults(enrichedResults)

        // 4. Calculate stats
        const totalCompleted = resultsData.length
        const totalPassed = resultsData.filter((r) => r.passed).length
        const averageScore =
          totalCompleted > 0
            ? Math.round(resultsData.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0) / totalCompleted)
            : 0

        setStats({ totalCompleted, totalPassed, averageScore })
      } catch (error) {
        console.error("Error fetching progress:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
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
        <h2 className="text-2xl font-bold text-foreground">My Learning</h2>
        <p className="text-muted-foreground">Track your progress and achievements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalCompleted}</p>
              <p className="text-sm text-muted-foreground">Quizzes Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalPassed}</p>
              <p className="text-sm text-muted-foreground">Quizzes Passed</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.averageScore}%</p>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {stats.totalCompleted > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Overall Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Pass Rate</span>
                <span className="font-medium text-foreground">
                  {Math.round((stats.totalPassed / stats.totalCompleted) * 100)}%
                </span>
              </div>
              <Progress value={(stats.totalPassed / stats.totalCompleted) * 100} className="h-3" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Recent Quiz Results</h3>

        {results.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No quizzes completed yet.</p>
            <p className="text-sm text-muted-foreground">Start taking exams to track your progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.slice(0, 10).map((result) => {
              const percentage = Math.round((result.score / result.totalQuestions) * 100)
              return (
                <div key={result.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${result.passed ? "bg-green-500/10" : "bg-red-500/10"
                      }`}
                  >
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{result.quiz?.title || "Unknown Quiz"}</p>
                    <p className="text-sm text-muted-foreground">
                      Score: {result.score}/{result.totalQuestions} ({percentage}%)
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${result.passed
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                      }`}
                  >
                    {result.passed ? "Passed" : "Failed"}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}