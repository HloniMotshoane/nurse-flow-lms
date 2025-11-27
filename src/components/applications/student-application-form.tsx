"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { StudentApplication, FirestoreDate } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { CldUploadWidget } from "next-cloudinary"

// Strict type for Cloudinary response
interface CloudinaryResult {
  info: {
    secure_url: string;
    [key: string]: unknown;
  };
}

export function StudentApplicationForm() {
  const { userData } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const hasCloudinary = !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "", // Added email field since user might not be logged in
    idNumber: "",
    dateOfBirth: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    highestQualification: "",
    institutionName: "",
    yearCompleted: "",
    additionalQualifications: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  })

  const [documents, setDocuments] = useState({
    idDocument: "",
    matric: "",
    qualifications: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!documents.idDocument) {
      setError("Please upload your ID document")
      setLoading(false)
      return
    }

    if (!userData && !formData.email) {
      setError("Please provide your email address")
      setLoading(false)
      return
    }

    try {
      // Clean object construction with strict types
      const application: Omit<StudentApplication, "id"> = {
        ...formData,
        ...documents,
        email: userData?.email || formData.email,
        userId: userData?.uid || "",
        status: "pending",
        // Valid casting for Firestore ServerTimestamp
        appliedAt: serverTimestamp() as unknown as FirestoreDate,
      }

      await addDoc(collection(db, "studentApplications"), application)

      router.push("/dashboard?application=submitted")
    } catch (err) {
      console.error("Error submitting application:", err)
      setError("Failed to submit application. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const provinces = [
    "Gauteng",
    "Western Cape",
    "KwaZulu-Natal",
    "Eastern Cape",
    "Free State",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
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

          {!userData && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                required
              />
            </div>
          )}

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

      {/* Academic History */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Academic History</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="highestQualification">Highest Qualification *</Label>
            <Input
              id="highestQualification"
              value={formData.highestQualification}
              onChange={(e) => setFormData({ ...formData, highestQualification: e.target.value })}
              placeholder="e.g., Matric, Diploma, Degree"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institutionName">Institution Name *</Label>
            <Input
              id="institutionName"
              value={formData.institutionName}
              onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearCompleted">Year Completed *</Label>
            <Input
              id="yearCompleted"
              type="number"
              value={formData.yearCompleted}
              onChange={(e) => setFormData({ ...formData, yearCompleted: e.target.value })}
              placeholder="2020"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalQualifications">Additional Qualifications (Optional)</Label>
          <Textarea
            id="additionalQualifications"
            value={formData.additionalQualifications}
            onChange={(e) => setFormData({ ...formData, additionalQualifications: e.target.value })}
            placeholder="List any additional certifications or qualifications"
            rows={3}
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
                <p className="text-xs mt-1">Cloudinary not configured</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Matric Certificate</Label>
            {hasCloudinary ? (
              <CldUploadWidget
                uploadPreset="ml_default"
                onSuccess={(result) => {
                  const res = result as unknown as CloudinaryResult;
                  if (res.info?.secure_url) {
                    setDocuments({ ...documents, matric: res.info.secure_url })
                  }
                }}
              >
                {({ open }) => (
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={() => open()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {documents.matric ? <CheckCircle className="w-4 h-4 mr-2 text-success" /> : null}
                    {documents.matric ? "Matric Certificate Uploaded" : "Upload Matric Certificate"}
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
            <Label>Other Qualifications</Label>
            {hasCloudinary ? (
              <CldUploadWidget
                uploadPreset="ml_default"
                onSuccess={(result) => {
                  const res = result as unknown as CloudinaryResult;
                  if (res.info?.secure_url) {
                    setDocuments({ ...documents, qualifications: res.info.secure_url })
                  }
                }}
              >
                {({ open }) => (
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={() => open()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {documents.qualifications ? <CheckCircle className="w-4 h-4 mr-2 text-success" /> : null}
                    {documents.qualifications ? "Qualifications Uploaded" : "Upload Qualifications"}
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

      {/* Emergency Contact */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Emergency Contact</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Contact Name *</Label>
            <Input
              id="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
            <Input
              id="emergencyContactPhone"
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactRelation">Relationship *</Label>
            <Input
              id="emergencyContactRelation"
              value={formData.emergencyContactRelation}
              onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
              placeholder="e.g., Mother, Father, Spouse"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || (!hasCloudinary && !documents.idDocument)}>
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