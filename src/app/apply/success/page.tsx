"use client"

import { CheckCircle, Home, Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Application Submitted!</h1>
          <p className="text-muted-foreground text-lg">
            Thank you for applying to NurseFlow. We have received your application and will review it shortly.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-3 text-left">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-foreground">What happens next?</p>
              <p className="text-sm text-muted-foreground mt-1">
                You will receive an email confirmation shortly. Our admissions team will review your application and
                contact you within 5-7 business days.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/login">
            <Button className="w-full sm:w-auto">Login to Your Account</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
