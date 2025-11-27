"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User } from "@/types"
import { Search, UserCheck, UserX, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"))
      const usersData = usersSnapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id,
      })) as User[]
      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleApproval = async (user: User) => {
    setUpdating(user.uid)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        approved: !user.approved,
      })
      setUsers(users.map((u) => (u.uid === user.uid ? { ...u, approved: !u.approved } : u)))
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setUpdating(null)
    }
  }

  const filteredUsers = users.filter((user) =>
    user.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage student registrations and approvals</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-semibold text-foreground">User</th>
                <th className="text-left p-4 font-semibold text-foreground">Role</th>
                <th className="text-left p-4 font-semibold text-foreground">Status</th>
                <th className="text-right p-4 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.uid}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                          <span className="text-primary font-bold text-xs">
                            {(user.email?.charAt(0) || "U").toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground block">{user.email}</span>
                          <span className="text-xs text-muted-foreground">UID: {user.uid.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.approved ? (
                          <>
                            <UserCheck className="w-4 h-4 text-green-600" />
                            <span className="text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded-full text-xs">Approved</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4 text-yellow-600" />
                            <span className="text-yellow-700 font-medium bg-yellow-50 px-2 py-0.5 rounded-full text-xs">Pending</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {updating === user.uid ? (
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        ) : (
                          <Switch
                            checked={user.approved}
                            onCheckedChange={() => toggleApproval(user)}
                            disabled={user.role === "admin"} // Prevent locking out admins
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}