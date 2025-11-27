"use client"

import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { Quiz } from "@/types"
import { ChevronLeft, ChevronRight, X, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface AssessmentModeProps {
  quiz: Quiz
  onClose: () => void
}

export function AssessmentMode({ quiz, onClose }: AssessmentModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)
  const { user } = useAuth()

  const currentQuestion = quiz.questions[currentIndex]

  // Calculate progress percentage
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100

  const handleAnswer = (optionIndex: number) => {
    if (!submitted) {
      setAnswers({ ...answers, [currentIndex]: optionIndex })
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    let score = 0
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctIndex) {
        score++
      }
    })

    const passed = score >= quiz.questions.length * 0.6 // 60% Pass mark

    try {
      if (user) {
        await addDoc(collection(db, "results"), {
          userId: user.uid,
          quizId: quiz.id,
          score,
          totalQuestions: quiz.questions.length,
          passed,
          completedAt: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error("Error saving result:", error)
    }

    setResult({ score, passed })
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted && result) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center shadow-2xl">
          <div
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
              result.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600",
            )}
          >
            {result.passed ? (
              <CheckCircle className="w-10 h-10" />
            ) : (
              <XCircle className="w-10 h-10" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            {result.passed ? "Congratulations!" : "Keep Practicing!"}
          </h2>

          <p className="text-muted-foreground mb-6">
            {result.passed
              ? "You've passed the assessment successfully."
              : "You need 60% to pass. Don't give up!"}
          </p>

          <div className="bg-muted/50 rounded-xl p-6 mb-6 border border-border">
            <div className="text-4xl font-bold text-foreground mb-2">
              {result.score} <span className="text-2xl text-muted-foreground">/ {quiz.questions.length}</span>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              {Math.round((result.score / quiz.questions.length) * 100)}% Score
            </div>
          </div>

          <Button onClick={onClose} className="w-full" size="lg">
            Back to Exams
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 h-16 flex items-center">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-foreground">{quiz.title}</h1>
            <p className="text-xs text-muted-foreground">
              Question {currentIndex + 1} of {quiz.questions.length}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Area */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto py-8">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-8 text-center leading-relaxed">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                  answers[currentIndex] === index
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors",
                      answers[currentIndex] === index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-base">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentIndex === quiz.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== quiz.questions.length || submitting}
              className="gap-2 min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          ) : (
            <Button onClick={() => setCurrentIndex((i) => i + 1)} className="gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}