"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Question, Course, FirestoreDate } from "@/types"
import { Plus, Trash2, Save, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function QuizCreator() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  // STRICT TYPE: Initialize with an ID to match the Question interface
  const [questions, setQuestions] = useState<Question[]>([
    { id: `q-${Date.now()}`, text: "", options: ["", "", "", ""], correctIndex: 0 }
  ])

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [loadingCourses, setLoadingCourses] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "courses"))
        const coursesData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as unknown as Course)
          .filter((course) => course.published)
        setCourses(coursesData)
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setLoadingCourses(false)
      }
    }
    fetchCourses()
  }, [])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: `q-${Date.now()}`, text: "", options: ["", "", "", ""], correctIndex: 0 }
    ])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  // Strictly typed update function
  const updateQuestion = (index: number, field: keyof Question, value: string | number | string[]) => {
    const updated = [...questions]
    // We use a type assertion here because we know the field matches the value type by logic
    if (field === "options") {
      updated[index].options = value as string[]
    } else if (field === "correctIndex") {
      updated[index].correctIndex = value as number
    } else if (field === "text") {
      updated[index].text = value as string
    }
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions]
    updated[questionIndex].options[optionIndex] = value
    setQuestions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)

    try {
      const selectedCourse = courses.find((c) => c.id === selectedCourseId)

      await addDoc(collection(db, "quizzes"), {
        title,
        description,
        questions,
        courseId: selectedCourseId,
        courseName: selectedCourse?.title || "",
        // Valid casting for Firestore Timestamp
        createdAt: serverTimestamp() as unknown as FirestoreDate,
        published: true, // Default to published or add a toggle
      })

      setSuccess(true)
      setTitle("")
      setDescription("")
      setQuestions([{ id: `q-${Date.now()}`, text: "", options: ["", "", "", ""], correctIndex: 0 }])
      setSelectedCourseId("")

      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Error creating quiz:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Quiz Creator</h2>
        <p className="text-muted-foreground">Create new assessments for students</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          Quiz created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Quiz Details</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="course">Assign to Course</Label>
              <Select
                value={selectedCourseId}
                onValueChange={(val: string) => setSelectedCourseId(val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Anatomy Basics"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this quiz covers..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Questions</h3>
            <Button type="button" variant="outline" onClick={addQuestion} className="gap-2 bg-transparent">
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>

          {questions.map((question, qIndex) => (
            <div key={question.id || qIndex} className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Question {qIndex + 1}</Label>
                  <Textarea
                    value={question.text}
                    onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                    placeholder="Enter your question..."
                    required
                  />
                </div>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <Label>Options (select the correct answer)</Label>
                <RadioGroup
                  value={question.correctIndex.toString()}
                  onValueChange={(value: string) => updateQuestion(qIndex, "correctIndex", parseInt(value))}
                >
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-3">
                      <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                      <Input
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className="flex-1"
                        required
                      />
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full sm:w-auto gap-2" disabled={saving || !selectedCourseId}>
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Quiz
            </>
          )}
        </Button>
      </form>
    </div>
  )
}