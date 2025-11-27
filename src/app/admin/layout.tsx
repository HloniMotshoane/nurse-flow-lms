"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Loader2 } from "lucide-react"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { userData, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // If not loading and not authorized, kick them out
        if (!loading) {
            if (!userData) {
                router.push("/login")
            } else if (userData.role !== "admin") {
                router.push("/student") // Redirect students trying to access admin
            }
        }
    }, [userData, loading, router])

    // Show loading spinner while checking auth
    if (loading || !userData || userData.role !== "admin") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Render the Admin Shell
    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar is fixed on desktop */}
            <Sidebar role="admin" />

            {/* Main Content Area */}
            <main className="flex-1 lg:pl-[280px] pt-16 lg:pt-0">
                <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                    {children}
                </div>
            </main>
        </div>
    )
}