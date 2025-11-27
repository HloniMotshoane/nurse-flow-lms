"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Loader2 } from "lucide-react"

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { userData, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // Redirect if not authenticated or not approved
        if (!loading) {
            if (!userData) {
                router.push("/login")
            } else if (!userData.approved) {
                router.push("/pending")
            } else if (userData.role !== "student") {
                router.push("/admin") // Block admin access attempts
            }
        }
    }, [userData, loading, router])

    // Show loading spinner while checking auth or redirecting unapproved/non-students
    if (loading || !userData || !userData.approved || userData.role !== "student") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Render the Student Shell
    return (
        <div className="min-h-screen bg-muted/20 flex">
            <Sidebar role="student" />
            <main className="flex-1 lg:pl-[280px] pt-16 lg:pt-0">
                <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {children}
                </div>
            </main>
        </div>
    )
}