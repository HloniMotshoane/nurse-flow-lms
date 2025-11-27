"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { StudentApplication, StaffApplication, FirestoreDate } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Eye, Loader2, Download } from "lucide-react"

// Helper: Safely convert Firestore Timestamp to String
const formatDate = (date: FirestoreDate | undefined | null) => {
  if (!date) return "N/A";
  // Check if it has a toDate method (Firestore Timestamp)
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate().toLocaleDateString();
  }
  // Check if it is a standard Date object
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  return "N/A";
}

export function ApplicationReview() {
  const { userData } = useAuth()

  // Strict State Typing
  const [studentApplications, setStudentApplications] = useState<StudentApplication[]>([])
  const [staffApplications, setStaffApplications] = useState<StaffApplication[]>([])

  // NO 'any': Union type for the selected modal state
  const [selectedApp, setSelectedApp] = useState<StudentApplication | StaffApplication | null>(null)

  const [loading, setLoading] = useState(true)
  const [reviewNotes, setReviewNotes] = useState("")
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const [studentSnap, staffSnap] = await Promise.all([
        getDocs(collection(db, "studentApplications")),
        getDocs(collection(db, "staffApplications")),
      ])

      // Strict casting from Firestore DocumentData to our Types
      const students = studentSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      })) as unknown as StudentApplication[];

      const staff = staffSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      })) as unknown as StaffApplication[];

      setStudentApplications(students)
      setStaffApplications(staff)
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (appId: string, status: "approved" | "rejected", type: "student" | "staff") => {
    setReviewing(true)
    try {
      const collectionName = type === "student" ? "studentApplications" : "staffApplications"

      await updateDoc(doc(db, collectionName, appId), {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: userData?.email,
        reviewNotes,
      })

      // Optimistic UI Update
      if (type === "student") {
        setStudentApplications(prev =>
          prev.map((app) => (app.id === appId ? { ...app, status, reviewNotes } : app))
        )
      } else {
        setStaffApplications(prev =>
          prev.map((app) => (app.id === appId ? { ...app, status, reviewNotes } : app))
        )
      }

      setSelectedApp(null)
      setReviewNotes("")
    } catch (error) {
      console.error("Error reviewing application:", error)
    } finally {
      setReviewing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Application Review</h2>
        <p className="text-muted-foreground">Review and process student and staff applications</p>
      </div>

      <Tabs defaultValue="student" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="student">
            Student Applications ({studentApplications.filter((a) => a.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="staff">
            Staff Applications ({staffApplications.filter((a) => a.status === "pending").length})
          </TabsTrigger>
        </TabsList>

        {/* STUDENT TAB */}
        <TabsContent value="student" className="space-y-4">
          {studentApplications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No student applications yet</div>
          ) : (
            studentApplications.map((app) => (
              <div key={app.id} className="bg-card rounded-xl border border-border p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {app.firstName} {app.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{app.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Applied: {formatDate(app.appliedAt)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      app.status === "approved" ? "default" : app.status === "rejected" ? "destructive" : "secondary"
                    }
                  >
                    {app.status}
                  </Badge>
                </div>

                {selectedApp?.id === app.id ? (
                  <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">ID Number</p>
                        <p className="font-medium">{app.idNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{app.phone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Highest Qualification</p>
                        <p className="font-medium">{app.highestQualification}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Institution</p>
                        <p className="font-medium">{app.institutionName}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Documents</p>
                      <div className="flex gap-2">
                        {app.idDocument && (
                          <a href={app.idDocument} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              ID Document
                            </Button>
                          </a>
                        )}
                        {app.matric && (
                          <a href={app.matric} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              Matric
                            </Button>
                          </a>
                        )}
                        {app.qualifications && (
                          <a href={app.qualifications} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              Qualifications
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>

                    {app.status === "pending" && (
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Add review notes..."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={3}
                        />

                        <div className="flex gap-2">
                          <Button
                            onClick={() => app.id && handleReview(app.id, "approved", "student")}
                            disabled={reviewing}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => app.id && handleReview(app.id, "rejected", "student")}
                            disabled={reviewing}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button variant="ghost" onClick={() => setSelectedApp(null)} className="w-full">
                      Close Details
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setSelectedApp(app)} className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* STAFF TAB */}
        <TabsContent value="staff" className="space-y-4">
          {staffApplications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No staff applications yet</div>
          ) : (
            staffApplications.map((app) => (
              <div key={app.id} className="bg-card rounded-xl border border-border p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {app.firstName} {app.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{app.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Position: {app.position} • {app.yearsOfExperience} years experience
                    </p>
                  </div>
                  <Badge
                    variant={
                      app.status === "approved" ? "default" : app.status === "rejected" ? "destructive" : "secondary"
                    }
                  >
                    {app.status}
                  </Badge>
                </div>

                {selectedApp?.id === app.id ? (
                  <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">ID Number</p>
                        <p className="font-medium">{app.idNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{app.phone}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Qualifications</p>
                      <p className="text-sm mt-1">{app.qualifications}</p>
                    </div>

                    {app.specializations && (
                      <div>
                        <p className="text-sm text-muted-foreground">Specializations</p>
                        <p className="text-sm mt-1">{app.specializations}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Documents</p>
                      <div className="flex gap-2 flex-wrap">
                        {app.idDocument && (
                          <a href={app.idDocument} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              ID
                            </Button>
                          </a>
                        )}
                        {app.cv && (
                          <a href={app.cv} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              CV
                            </Button>
                          </a>
                        )}
                        {app.qualificationsCerts && (
                          <a href={app.qualificationsCerts} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              Certificates
                            </Button>
                          </a>
                        )}
                        {app.references && (
                          <a href={app.references} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              References
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>

                    {app.status === "pending" && (
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Add review notes..."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={3}
                        />

                        <div className="flex gap-2">
                          <Button
                            onClick={() => app.id && handleReview(app.id, "approved", "staff")}
                            disabled={reviewing}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => app.id && handleReview(app.id, "rejected", "staff")}
                            disabled={reviewing}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button variant="ghost" onClick={() => setSelectedApp(null)} className="w-full">
                      Close Details
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setSelectedApp(app)} className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}