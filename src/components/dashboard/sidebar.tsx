"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Heart,
  LayoutDashboard,
  Users,
  FileText,
  Video,
  ClipboardList,
  LogOut,
  Menu,
  X,
  BookOpen,
  Settings,
  GraduationCap,
  ChevronRight,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

// --- Configuration ---

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const adminNavItems: NavItem[] = [
  { label: "Overview", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
  { label: "Applications", href: "/admin/applications", icon: <FileText className="w-4 h-4" /> },
  { label: "Courses", href: "/admin/courses", icon: <BookOpen className="w-4 h-4" /> },
  { label: "Quiz Creator", href: "/admin/quizzes", icon: <ClipboardList className="w-4 h-4" /> },
  { label: "Live Classes", href: "/admin/classes", icon: <Video className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
]

const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My Learning", href: "/student/learning", icon: <GraduationCap className="w-4 h-4" /> },
  { label: "Live Classes", href: "/student/classes", icon: <Video className="w-4 h-4" /> },
  { label: "Exams", href: "/student/exams", icon: <ClipboardList className="w-4 h-4" /> },
  { label: "Browse Courses", href: "/student/courses", icon: <BookOpen className="w-4 h-4" /> },
]

interface SidebarProps {
  role: "admin" | "student"
}

export function Sidebar({ role }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { signOut, userData } = useAuth()

  const navItems = role === "admin" ? adminNavItems : studentNavItems

  return (
    <>
      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-background/80 backdrop-blur-md border-b px-4 h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold">NurseFlow</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-card border-r border-border/50 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* 1. Header Area */}
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5" fill="currentColor" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground block leading-none">
                NurseFlow
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                LMS Platform
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Navigation Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-1">
            <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Menu
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Role Badge (Visual Flair) */}
          <div className="mt-8 mx-2 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-background rounded-lg border shadow-sm">
                {role === "admin" ? <Shield className="w-4 h-4 text-primary" /> : <GraduationCap className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-0.5">Current Role</p>
                <p className="text-sm font-semibold capitalize text-foreground">{role} Workspace</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. User Footer (Fixed at bottom) */}
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
              {userData?.displayName?.charAt(0).toUpperCase() || userData?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userData?.displayName || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userData?.email}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
            onClick={() => {
              signOut()
              setIsOpen(false)
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  )
}