"use client"

import { useState } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { User, Bell, Shield, Save, Loader2, CheckCircle, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SettingsPanel() {
  const { userData, refreshUserData } = useAuth()
  const [displayName, setDisplayName] = useState(userData?.displayName || "")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSaveProfile = async () => {
    if (!userData) return

    setSaving(true)
    try {
      await updateDoc(doc(db, "users", userData.uid), {
        displayName,
      })
      await refreshUserData()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your account and platform settings</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          Settings saved successfully!
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <div className="bg-card rounded-xl border border-border p-6 space-y-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Profile Information</h3>

            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                <span className="text-3xl font-bold text-primary">
                  {(displayName || userData?.email || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground text-lg">{userData?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground capitalize">{userData?.role}</p>
                  {userData?.approved && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={userData?.email || ""} disabled className="bg-muted opacity-70" />
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications">
          <div className="bg-card rounded-xl border border-border p-6 space-y-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates about new students</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div>
                  <p className="font-medium text-foreground">Class Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified before scheduled classes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div>
                  <p className="font-medium text-foreground">Quiz Submissions</p>
                  <p className="text-sm text-muted-foreground">Alert when students complete quizzes</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security">
          <div className="bg-card rounded-xl border border-border p-6 space-y-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Security Settings</h3>

            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <p className="font-medium text-foreground mb-2">Admin Access Code</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Share this code with new administrators to allow them to register.
                </p>
                <div className="flex gap-2 max-w-sm">
                  <Input value="NURSEFLOW2024" readOnly className="font-mono bg-background" />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard("NURSEFLOW2024")}
                    className="gap-2"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 mb-1">Two-Factor Authentication</p>
                    <p className="text-sm text-yellow-700">
                      Add an extra layer of security to your account. Coming soon.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}