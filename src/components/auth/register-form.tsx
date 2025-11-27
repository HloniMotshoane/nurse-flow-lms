"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Heart, CheckCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types"

// Helper interface for Firebase Errors
interface FirebaseError {
  code: string;
  message: string;
}

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [role, setRole] = useState<UserRole>("student")
  const [adminCode, setAdminCode] = useState("")

  const { signUp } = useAuth()
  const router = useRouter()

  const ADMIN_SECRET_CODE = "NURSEFLOW2024"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (role === "admin" && adminCode !== ADMIN_SECRET_CODE) {
      setError("Invalid admin code")
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, role)
      router.push("/dashboard")
    } catch (err: unknown) {
      // STRICT TYPE GUARD: Safely check if 'err' has a 'code' property
      if (typeof err === "object" && err !== null && "code" in err) {
        const firebaseErr = err as FirebaseError;

        if (firebaseErr.code === "auth/email-already-in-use") {
          setError("This email is already registered.");
        } else if (firebaseErr.code === "auth/weak-password") {
          setError("Password is too weak.");
        } else {
          setError("Registration failed. Please try again.");
        }
      } else {
        // Fallback for non-standard errors
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false)
    }
  }

  // ... (The rest of the UI JSX remains identical)
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Heart className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">NurseFlow</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Start your nursing career</h1>
          <div className="space-y-4 mt-8">
            {["Access to all courses", "Live interactive classes", "Practice assessments"].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Create your account</h2>
            <p className="text-muted-foreground mt-2">Start learning today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    role === "student" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Heart className={cn("w-5 h-5", role === "student" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-medium">Student</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    role === "admin" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Shield className={cn("w-5 h-5", role === "admin" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-medium">Admin</span>
                  </div>
                </button>
              </div>
            </div>

            {role === "admin" && (
              <div className="space-y-2">
                <Label>Admin Access Code</Label>
                <Input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Enter code (NURSEFLOW2024)"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}