"use client"

import { LogOut, Clock, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

export function PendingApproval() {
  const { signOut, userData } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header Status */}
        <div className="bg-amber-50 p-6 flex flex-col items-center text-center border-b border-amber-100">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-amber-900">Application Pending</h2>
          <p className="text-amber-700 mt-2">
            Your account is currently under review by the administration.
          </p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Why am I seeing this?</p>
                To ensure the quality of our medical education platform, all new student accounts must be verified manually.
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Account Details
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium text-gray-900">{userData?.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Role:</span>
                <span className="font-medium text-gray-900 capitalize">{userData?.role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Submitted:</span>
                <span className="font-medium text-gray-900">
                  {userData?.createdAt ? (() => {
                    const d: unknown = userData.createdAt
                    if (typeof (d as { seconds?: number }).seconds === "number") {
                      return new Date((d as { seconds: number }).seconds * 1000).toLocaleDateString()
                    }
                    if (d instanceof Date) {
                      return d.toLocaleDateString()
                    }
                    if (typeof d === "string") {
                      const parsed = new Date(d)
                      return isNaN(parsed.getTime()) ? 'Just now' : parsed.toLocaleDateString()
                    }
                    if (typeof (d as { toDate?: () => Date }).toDate === "function") {
                      const parsed = (d as { toDate: () => Date }).toDate()
                      return parsed instanceof Date ? parsed.toLocaleDateString() : 'Just now'
                    }
                    return 'Just now'
                  })() : 'Just now'}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}