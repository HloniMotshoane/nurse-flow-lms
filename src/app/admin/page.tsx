"use client"

import { useAuth } from "@/hooks/use-auth"
import { StatsCards } from "@/components/admin/stats-cards"
import { UserManagement } from "@/components/admin/user-management"

export default function AdminDashboard() {
  const { userData } = useAuth()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {userData?.displayName || userData?.email}
        </p>
      </div>

      <StatsCards />
      <UserManagement />
    </div>
  )
}