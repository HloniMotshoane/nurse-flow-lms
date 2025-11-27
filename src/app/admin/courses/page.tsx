"use client"

import { useState } from "react"
import { CourseCreator } from "@/components/admin/course-creator"
import { CourseManager } from "@/components/admin/course-manager"
import { Button } from "@/components/ui/button"
import { Plus, List } from "lucide-react"

export default function AdminCoursesPage() {
  const [activeView, setActiveView] = useState<"manage" | "create">("manage")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Course Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage your courses</p>
        </div>
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
          <Button
            variant={activeView === "manage" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("manage")}
          >
            <List className="w-4 h-4 mr-2" />
            Manage
          </Button>
          <Button
            variant={activeView === "create" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("create")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>
      </div>

      {activeView === "manage" && <CourseManager />}
      {activeView === "create" && <CourseCreator />}
    </div>
  )
}