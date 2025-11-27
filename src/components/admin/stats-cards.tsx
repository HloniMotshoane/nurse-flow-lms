"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Users, FileText, TrendingUp, Video } from "lucide-react"

export function StatsCards() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    approvedStudents: 0,
    totalQuizzes: 0,
    totalClasses: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"))
        const users = usersSnapshot.docs.map((doc) => doc.data())
        const students = users.filter((u) => u.role === "student")
        const approvedStudents = students.filter((s) => s.approved)

        const quizzesSnapshot = await getDocs(collection(db, "quizzes"))
        const classesSnapshot = await getDocs(collection(db, "liveClasses"))

        setStats({
          totalStudents: students.length,
          approvedStudents: approvedStudents.length,
          totalQuizzes: quizzesSnapshot.size,
          totalClasses: classesSnapshot.size,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statsData = [
    {
      label: "Total Students",
      value: stats.totalStudents.toString(),
      subValue: `${stats.approvedStudents} approved`,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Active Classes",
      value: stats.totalClasses.toString(),
      subValue: "Live & upcoming",
      icon: Video,
      color: "bg-success/10 text-success",
    },
    {
      label: "Quizzes Created",
      value: stats.totalQuizzes.toString(),
      subValue: "Available for students",
      icon: FileText,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Approval Rate",
      value: stats.totalStudents > 0 ? `${Math.round((stats.approvedStudents / stats.totalStudents) * 100)}%` : "0%",
      subValue: "Students approved",
      icon: TrendingUp,
      color: "bg-secondary text-secondary-foreground",
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-muted rounded-xl" />
            </div>
            <div className="h-8 bg-muted rounded mb-2 w-20" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <div
          key={stat.label}
          className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all hover:border-primary/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
          <div className="text-xs text-muted-foreground mt-1">{stat.subValue}</div>
        </div>
      ))}
    </div>
  )
}
