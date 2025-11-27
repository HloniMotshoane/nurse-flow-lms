"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Loader2, Heart, GraduationCap, Video, BookOpen, Users, ArrowRight, FileText } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Intelligent Redirect Logic
    if (!loading && user && userData) {
      if (!userData.approved && userData.role !== "admin") {
        router.push("/pending")
      } else if (userData.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/student")
      }
    }
  }, [user, userData, loading, router])

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary/60 mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground font-medium">Initializing NurseFlow...</p>
        </div>
      </div>
    )
  }

  // 2. Redirecting State (Prevent Flash)
  if (user && userData) {
    return null
  }

  // 3. Public Landing Page
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center space-y-8">
            {/* Logo Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 backdrop-blur-sm">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary tracking-wide">NURSEFLOW PLATFORM</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight text-balance">
              Empowering the Next Generation
              <br />
              <span className="text-primary">of Nursing Professionals</span>
            </h1>

            {/* Description */}
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground text-pretty leading-relaxed">
              A modern learning management system built for nursing education with real-time video conferencing,
              interactive assessments, and comprehensive student tracking.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/login">
                <Button size="lg" className="gap-2 text-base px-8 w-full sm:w-auto font-semibold shadow-lg shadow-primary/20">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="text-base px-8 w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Section */}
      <div className="bg-muted/30 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Start Your Journey</h2>
            <p className="text-lg text-muted-foreground">
              Select your path to join the NurseFlow ecosystem
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 max-w-4xl mx-auto">
            {/* Student Application */}
            <div className="bg-card rounded-2xl border border-border p-8 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Student Portal</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Apply to become a nursing student and gain access to our comprehensive learning programs, live
                classes, and expert instructors.
              </p>
              <Link href="/register">
                <Button className="w-full gap-2">
                  <FileText className="w-4 h-4" />
                  Apply as Student
                </Button>
              </Link>
            </div>

            {/* Staff Application */}
            <div className="bg-card rounded-2xl border border-border p-8 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Instructor Portal</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Join our team as a teacher, administrator, or support staff. Help shape the future of nursing
                education in South Africa.
              </p>
              <Link href="/apply/staff">
                <Button className="w-full gap-2" variant="outline">
                  <FileText className="w-4 h-4" />
                  Apply as Staff
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-foreground">NurseFlow LMS</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            © 2024 South African Nursing Institute. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}