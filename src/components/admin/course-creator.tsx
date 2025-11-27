"use client"

import { useState } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { Plus, Trash2, Upload, FileText, Video, BookOpen, Loader2, CheckCircle2 } from "lucide-react"
import { CldUploadWidget } from "next-cloudinary"
import type { CourseModule, FirestoreDate } from "@/types"
import { useToast } from "@/hooks/use-toast"

// STRICT TYPE: Cloudinary Response
interface CloudinaryResult {
  info: {
    secure_url: string;
    public_id?: string;
    [key: string]: unknown;
  };
}

export function CourseCreator() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner")
  const [thumbnail, setThumbnail] = useState("")

  // STRICT TYPE: Module State
  const [modules, setModules] = useState<Omit<CourseModule, "id">[]>([])

  const [isCreating, setIsCreating] = useState(false)
  const { userData } = useAuth()
  const { toast } = useToast()

  const addModule = (type: "video" | "document" | "text") => {
    setModules([
      ...modules,
      {
        title: "",
        description: "",
        type,
        content: "",
        order: modules.length,
      },
    ])
  }

  const updateModule = (index: number, field: keyof Omit<CourseModule, "id">, value: string | number) => {
    const updated = [...modules]
    // Safe spread update
    updated[index] = { ...updated[index], [field]: value } as Omit<CourseModule, "id">
    setModules(updated)
  }

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!title || !description || !category || modules.length === 0) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields and add at least one module.",
        variant: "destructive",
      })
      return
    }

    const invalidModules = modules.some((m) => !m.title || !m.content)
    if (invalidModules) {
      toast({
        title: "Invalid modules",
        description: "Each module must have a title and content.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const modulesWithIds = modules.map((module, index) => ({
        ...module,
        id: `module_${Date.now()}_${index}`,
        order: index,
      }))

      await addDoc(collection(db, "courses"), {
        title,
        description,
        category,
        level,
        thumbnail: thumbnail || null,
        instructor: userData?.displayName || userData?.email || "Admin",
        instructorId: userData?.uid,
        modules: modulesWithIds,
        published: false,
        enrolledStudents: [],
        createdAt: serverTimestamp() as unknown as FirestoreDate,
        updatedAt: serverTimestamp() as unknown as FirestoreDate,
      })

      toast({
        title: "Course created",
        description: "Your course has been created successfully.",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setCategory("")
      setLevel("beginner")
      setThumbnail("")
      setModules([])
    } catch (error) {
      console.error("Error creating course:", error)
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Create New Course</h2>
          <p className="text-sm text-muted-foreground">
            Add a comprehensive course with modules, videos, and documents
          </p>
        </div>

        {/* Course Details */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Course Title</label>
            <Input
              placeholder="e.g., Fundamentals of Nursing Care"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
            <Textarea
              placeholder="Describe what students will learn in this course..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
              <Input
                placeholder="e.g., Clinical Skills"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Level</label>
              <Select
                value={level}
                onValueChange={(val: "beginner" | "intermediate" | "advanced") => setLevel(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Thumbnail (Optional)</label>
              <CldUploadWidget
                uploadPreset="nurseflow_courses"
                onSuccess={(result) => {
                  const res = result as unknown as CloudinaryResult;
                  if (res.info?.secure_url) {
                    setThumbnail(res.info.secure_url)
                    toast({
                      title: "Thumbnail uploaded",
                      description: "Course thumbnail has been uploaded successfully.",
                    })
                  }
                }}
              >
                {({ open }) => (
                  <Button type="button" variant="outline" onClick={() => open()} className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {thumbnail ? "Change" : "Upload"}
                  </Button>
                )}
              </CldUploadWidget>
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Course Modules</h3>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => addModule("text")}>
                <BookOpen className="w-4 h-4 mr-2" />
                Text
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addModule("video")}>
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addModule("document")}>
                <FileText className="w-4 h-4 mr-2" />
                Document
              </Button>
            </div>
          </div>

          {modules.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">No modules added yet. Click the buttons above to add modules.</p>
            </div>
          )}

          {modules.map((module, index) => (
            <Card key={index} className="p-4 space-y-4 bg-muted/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {module.type === "video" && <Video className="w-5 h-5 text-primary" />}
                  {module.type === "document" && <FileText className="w-5 h-5 text-primary" />}
                  {module.type === "text" && <BookOpen className="w-5 h-5 text-primary" />}
                  <span className="text-sm font-medium capitalize text-foreground">{module.type} Module</span>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeModule(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>

              <Input
                placeholder="Module Title"
                value={module.title}
                onChange={(e) => updateModule(index, "title", e.target.value)}
                className="bg-background"
              />

              <Textarea
                placeholder="Module Description"
                value={module.description}
                onChange={(e) => updateModule(index, "description", e.target.value)}
                rows={2}
                className="bg-background"
              />

              {module.type === "text" && (
                <Textarea
                  placeholder="Enter your lesson content here..."
                  value={module.content}
                  onChange={(e) => updateModule(index, "content", e.target.value)}
                  rows={6}
                  className="bg-background font-mono text-sm"
                />
              )}

              {(module.type === "video" || module.type === "document") && (
                <div className="space-y-2">
                  <CldUploadWidget
                    uploadPreset="nurseflow_courses"
                    options={{
                      resourceType: module.type === "video" ? "video" : "raw",
                    }}
                    onSuccess={(result) => {
                      const res = result as unknown as CloudinaryResult;
                      if (res.info?.secure_url) {
                        updateModule(index, "content", res.info.secure_url)
                        if (res.info.public_id) {
                          updateModule(index, "cloudinaryId", res.info.public_id as string)
                        }
                        toast({
                          title: `${module.type} uploaded`,
                          description: `Your ${module.type} has been uploaded successfully.`,
                        })
                      }
                    }}
                  >
                    {({ open }) => (
                      <Button type="button" variant="outline" onClick={() => open()} className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        {module.content ? `Change ${module.type}` : `Upload ${module.type}`}
                      </Button>
                    )}
                  </CldUploadWidget>
                  {module.content && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>File uploaded successfully</span>
                    </div>
                  )}
                </div>
              )}

              {(module.type === "video" || module.type === "document") && (
                <Input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={module.duration || ""}
                  onChange={(e) => updateModule(index, "duration", Number.parseInt(e.target.value) || 0)}
                  className="bg-background"
                />
              )}
            </Card>
          ))}
        </div>

        <Button onClick={handleCreate} disabled={isCreating} size="lg" className="w-full">
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating Course...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Create Course
            </>
          )}
        </Button>
      </Card>
    </div>
  )
}