"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { Sidebar } from "@/components/dashboard/sidebar"
import { ExamList } from "@/components/student/exam-list"
import { AssessmentMode } from "@/components/student/assessment-mode"
import { LiveClasses } from "@/components/student/live-classes"
import type { Quiz } from "@/types"
import { cn } from "@/lib/utils"
import { Loader2, Video, ClipboardList } from "lucide-react"

function StudentDashboardContent() {
  const [activeTab, setActiveTab] = useState<"classes" | "exams">("classes")
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const { userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!userData) {
        router.push("/login")
      } else if (!userData.approved) {
        router.push("/pending")
      } else if (userData.role !== "student") {
        router.push("/admin")
      }
    }
  }, [userData, loading, router])

  if (loading || !userData || !userData.approved || userData.role !== "student") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const tabs = [
    { id: "classes" as const, label: "Live Classes", icon: Video },
    { id: "exams" as const, label: "Exams", icon: ClipboardList },
  ]

  if (activeQuiz) {
    return <AssessmentMode quiz={activeQuiz} onClose={() => setActiveQuiz(null)} />
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role="student" />

      <main className="lg:pl-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
            <p className="text-muted-foreground mt-1">
              Continue your learning journey, {userData.displayName || userData.email?.split("@")[0]}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === "classes" && <LiveClasses />}
          {activeTab === "exams" && <ExamList onStartExam={setActiveQuiz} />}
        </div>
      </main>
    </div>
  )
}

export default function StudentDashboard() {
  return (
    <AuthProvider>
      <StudentDashboardContent />
    </AuthProvider>
  )
}
