import { Timestamp } from "firebase/firestore";

// Helper to handle Firestore's Timestamp vs JS Date
// This allows the UI to handle both seamlessly
export type FirestoreDate = Timestamp | Date;

// --- 1. User & Auth Models ---

export type UserRole = "admin" | "student" | "instructor";

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  approved: boolean; // Vital for Admin approval flows
  displayName?: string;
  photoURL?: string;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

// --- 2. Application Models (Onboarding) ---

export interface StudentApplication {
  id?: string;
  userId: string;
  email: string;
  status: "pending" | "approved" | "rejected";

  // Personal Details
  firstName: string;
  lastName: string;
  idNumber: string;
  dateOfBirth: string; // ISO String YYYY-MM-DD
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;

  // Academic History
  highestQualification: string;
  institutionName: string;
  yearCompleted: string;
  additionalQualifications?: string;

  // Documents (Cloudinary URLs)
  idDocument?: string;
  matric?: string;
  qualifications?: string;

  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  // Meta
  appliedAt: FirestoreDate;
  reviewedAt?: FirestoreDate;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface StaffApplication {
  id?: string;
  userId: string;
  email: string;
  status: "pending" | "approved" | "rejected";

  // Personal Details
  firstName: string;
  lastName: string;
  idNumber: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;

  // Professional Details
  position: "teacher" | "staff" | "administrator";
  yearsOfExperience: string;
  currentEmployer?: string;
  qualifications: string;
  specializations?: string;

  // Documents
  idDocument?: string;
  cv?: string;
  qualificationsCerts?: string;
  references?: string;

  // Meta
  appliedAt: FirestoreDate;
  reviewedAt?: FirestoreDate;
  reviewedBy?: string;
  reviewNotes?: string;
}

// --- 3. Course Content Models ---

export type ModuleType = "video" | "document" | "text" | "quiz";

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  type: ModuleType;
  content: string; // URL or Text content
  order: number;
  duration?: number; // Minutes
  cloudinaryId?: string; // For video management
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorId: string;
  thumbnail?: string;
  modules: CourseModule[];
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  published: boolean;
  price?: number; // Future proofing
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
  enrolledStudents?: string[]; // Array of User UIDs
}

export interface CourseProgress {
  id?: string;
  userId: string;
  courseId: string;
  completedModules: string[]; // Array of Module IDs
  lastAccessedModule?: string;
  progress: number; // 0-100
  enrolledAt: FirestoreDate;
  lastAccessedAt?: FirestoreDate;
}

// --- 4. Quiz Models ---

export interface Question {
  id: string; // Good to have IDs for questions if you want to edit them later
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  courseId: string;
  courseName?: string;
  moduleId?: string; // Links quiz to a specific module
  duration?: number; // Minutes
  passingScore?: number; // e.g. 70
  published: boolean;
  createdAt: FirestoreDate;
}

export interface QuizResult {
  id?: string;
  userId: string; // Fixed from 'oduserId'
  quizId: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: FirestoreDate;
}

// --- 5. Live Class Models ---

export interface LiveClass {
  id: string;
  title: string;
  description?: string;
  instructor: string;
  instructorId: string;
  scheduledAt: FirestoreDate;
  duration: number; // Minutes
  status: "upcoming" | "live" | "ended";
  courseId: string;
  courseName?: string;
  participants?: string[];
  roomCode?: string; // For Jitsi/Zoom/LiveKit
  createdAt: FirestoreDate;
}

export interface ChatMessage {
  id: string;
  classId: string; // Fixed from 'odclassId'
  senderId: string;
  senderName: string;
  senderEmail: string;
  message: string;
  timestamp: FirestoreDate;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  isHost?: boolean;
  joinedAt: FirestoreDate;
}