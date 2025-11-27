"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { StaffApplication, FirestoreDate } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, CheckCircle, Loader2, Briefcase, AlertCircle } from "lucide-react"
import { CldUploadWidget } from "next-cloudinary"

// strict type for Cloudinary response
interface CloudinaryResult {
  info: {
    secure_url: string;
    [key: string]: unknown;
  };
}

export function StaffApplicationForm() {
  const { userData } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const hasCloudinary = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    dateOfBirth: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    position: "teacher" as "teacher" | "staff" | "administrator",
    yearsOfExperience: "",
    currentEmployer: "",
    qualifications: "",
    specializations: "",
  })

  const [documents, setDocuments] = useState({
    idDocument: "",
    cv: "",
    qualificationsCerts: "",
    references: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!documents.idDocument || !documents.cv) {
      setError("Please upload your ID document and CV")
      setLoading(false)
      return
    }

    try {
      // Clean object construction with strict types
      const application: Omit<StaffApplication, "id"> = {
        ...formData,
        ...documents,
        userId: userData?.uid || "",
        email: userData?.email || "",
        status: "pending",
        // Valid casting for Firestore ServerTimestamp
        appliedAt: serverTimestamp() as unknown as FirestoreDate,
      }

      await addDoc(collection(db, "staffApplications"), application)
      router.push("/dashboard")
    } catch (err) {
      console.error("Error submitting application:", err)
      setError("Failed to submit application. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const provinces = [
    "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
    "Free State", "Limpopo", "Mpumalanga", "Northern Cape", "North West",
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">{error}</div>
      )}

      {!hasCloudinary && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Document uploads unavailable</p>
            <p className="text-sm">
              Cloudinary is not configured. Please contact the administrator.
            </p>
          </div>
        </div>
      )}

      {/* Personal Details */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Personal Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idNumber">ID Number *</Label>
            <Input
              id="idNumber"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              placeholder="0000000000000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+27 00 000 0000"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Street Address *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">Province *</Label>
            {/* STRICT TYPING: (value: string) */}
            <Select
              value={formData.province}
              onValueChange={(value: string) => setFormData({ ...formData, province: value })}
            >
              <SelectTrigger id="province">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((prov) => (
                  <SelectItem key={prov} value={prov}>
                    {prov}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Professional Details */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          Professional Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="position">Position Applied For *</Label>
            {/* STRICT TYPING: (value: string) */}
            <Select
              value={formData.position}
              onValueChange={(value: string) => setFormData({
                ...formData,
                position: value as "teacher" | "staff" | "administrator"
              })}
            >
              <SelectTrigger id="position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher/Instructor</SelectItem>
                <SelectItem value="staff">Support Staff</SelectItem>
                <SelectItem value="administrator">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
            <Input
              id="yearsOfExperience"
              type="number"
              value={formData.yearsOfExperience}
              onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
              placeholder="5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentEmployer">Current Employer (Optional)</Label>
            <Input
              id="currentEmployer"
              value={formData.currentEmployer}
              onChange={(e) => setFormData({ ...formData, currentEmployer: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualifications">Qualifications *</Label>
          <Textarea
            id="qualifications"
            value={formData.qualifications}
            onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
            placeholder="List your academic qualifications and degrees"
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specializations">Specializations (Optional)</Label>
          <Textarea
            id="specializations"
            value={formData.specializations}
            onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
            placeholder="Any specific areas of expertise or specialization"
            rows={2}
          />
        </div>
      </div>

      {/* Documents */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Required Documents</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>ID Document *</Label>
            {hasCloudinary ? (
              <CldUploadWidget
                uploadPreset="ml_default"
                onSuccess={(result) => {
                  const res = result as unknown as CloudinaryResult;
                  if (res.info?.secure_url) {
                    setDocuments({ ...documents, idDocument: res.info.secure_url })
                  }
                }}
              >
                {({ open }) => (
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={() => open()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {documents.idDocument ? <CheckCircle className="w-4 h-4 mr-2 text-success" /> : null}
                    {documents.idDocument ? "ID Document Uploaded" : "Upload ID Document"}
                  </Button>
                )}
              </CldUploadWidget>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-muted-foreground">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Document upload unavailable</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>CV/Resume *</Label>
            {hasCloudinary ? (
              <CldUploadWidget
                uploadPreset="ml_default"
                onSuccess={(result) => {
                  const res = result as unknown as CloudinaryResult;
                  if (res.info?.secure_url) {
                    setDocuments({ ...documents, cv: res.info.secure_url })
                  }
                }}
              >
                {({ open }) => (
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={() => open()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {documents.cv ? <CheckCircle className="w-4 h-4 mr-2 text-success" /> : null}
                    {documents.cv ? "CV Uploaded" : "Upload CV/Resume"}
                  </Button>
                )}
              </CldUploadWidget>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-muted-foreground">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Document upload unavailable</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Qualification Certificates</Label>
            {hasCloudinary ? (
              <CldUploadWidget
                uploadPreset="ml_default"
                onSuccess={(result) => {
                  const res = result as unknown as CloudinaryResult;
                  if (res.info?.secure_url) {
                    setDocuments({ ...documents, qualificationsCerts: res.info.secure_url })
                  }
                }}
              >
                {({ open }) => (
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={() => open()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {documents.qualificationsCerts ? <CheckCircle className="w-4 h-4 mr-2 text-success" /> : null}
                    {documents.qualificationsCerts ? "Certificates Uploaded" : "Upload Certificates"}
                  </Button>
                )}
              </CldUploadWidget>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-muted-foreground">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Document upload unavailable</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>References</Label>
            {hasCloudinary ? (
              <CldUploadWidget
                uploadPreset="ml_default"
                onSuccess={(result) => {
                  const res = result as unknown as CloudinaryResult;
                  if (res.info?.secure_url) {
                    setDocuments({ ...documents, references: res.info.secure_url })
                  }
                }}
              >
                {({ open }) => (
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={() => open()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {documents.references ? <CheckCircle className="w-4 h-4 mr-2 text-success" /> : null}
                    {documents.references ? "References Uploaded" : "Upload References"}
                  </Button>
                )}
              </CldUploadWidget>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-muted-foreground">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Document upload unavailable</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || (!hasCloudinary && (!documents.idDocument || !documents.cv))}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </div>
    </form>
  )
}