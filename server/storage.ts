import { 
  User, InsertUser, 
  LearningMaterial, InsertLearningMaterial,
  Assignment, InsertAssignment,
  AssignmentSubmission, InsertAssignmentSubmission,
  Award, InsertAward,
  UserAward, InsertUserAward,
  PageVisit, InsertPageVisit,
  UserSession, InsertUserSession
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { hashPassword } from "./utils/password";

// Memory store for sessions
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Learning materials
  createLearningMaterial(material: InsertLearningMaterial): Promise<LearningMaterial>;
  getLearningMaterial(id: number): Promise<LearningMaterial | undefined>;
  getLearningMaterials(): Promise<LearningMaterial[]>;
  updateLearningMaterial(id: number, material: Partial<InsertLearningMaterial>): Promise<LearningMaterial | undefined>;
  deleteLearningMaterial(id: number): Promise<boolean>;
  
  // Assignments
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignments(): Promise<Assignment[]>;
  updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;
  
  // Assignment submissions
  createAssignmentSubmission(submission: InsertAssignmentSubmission): Promise<AssignmentSubmission>;
  getAssignmentSubmission(id: number): Promise<AssignmentSubmission | undefined>;
  getAssignmentSubmissionsByUser(userId: number): Promise<AssignmentSubmission[]>;
  getAssignmentSubmissionsByAssignment(assignmentId: number): Promise<AssignmentSubmission[]>;
  updateAssignmentSubmission(id: number, submission: Partial<InsertAssignmentSubmission>): Promise<AssignmentSubmission | undefined>;
  
  // Awards
  createAward(award: InsertAward): Promise<Award>;
  getAward(id: number): Promise<Award | undefined>;
  getAwards(): Promise<Award[]>;
  updateAward(id: number, award: Partial<InsertAward>): Promise<Award | undefined>;
  deleteAward(id: number): Promise<boolean>;
  
  // User awards
  assignAwardToUser(userAward: InsertUserAward): Promise<UserAward>;
  getUserAwards(userId: number): Promise<(UserAward & { award: Award })[]>;
  
  // Page statistics
  recordPageVisit(visit: InsertPageVisit): Promise<PageVisit>;
  getPageVisits(): Promise<PageVisit[]>;
  getPageVisitsByUser(userId: number): Promise<PageVisit[]>;
  getMostVisitedPages(limit?: number): Promise<{page: string, count: number}[]>;
  
  // User sessions (online status)
  updateUserSession(session: InsertUserSession): Promise<UserSession>;
  getActiveUserSessions(timeThreshold: number): Promise<(UserSession & { user: User })[]>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private learningMaterials: Map<number, LearningMaterial>;
  private assignments: Map<number, Assignment>;
  private assignmentSubmissions: Map<number, AssignmentSubmission>;
  private awards: Map<number, Award>;
  private userAwards: Map<number, UserAward>;
  private pageVisits: PageVisit[];
  private userSessions: Map<number, UserSession>;
  sessionStore: session.SessionStore;
  
  currentUserId: number;
  currentMaterialId: number;
  currentAssignmentId: number;
  currentSubmissionId: number;
  currentAwardId: number;
  currentUserAwardId: number;
  currentPageVisitId: number;
  currentUserSessionId: number;

  constructor() {
    this.users = new Map();
    this.learningMaterials = new Map();
    this.assignments = new Map();
    this.assignmentSubmissions = new Map();
    this.awards = new Map();
    this.userAwards = new Map();
    this.pageVisits = [];
    this.userSessions = new Map();
    
    this.currentUserId = 1;
    this.currentMaterialId = 1;
    this.currentAssignmentId = 1;
    this.currentSubmissionId = 1;
    this.currentAwardId = 1;
    this.currentUserAwardId = 1;
    this.currentPageVisitId = 1;
    this.currentUserSessionId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create admin user with regular password (will be hashed by createUser)
    this.createUser({
      username: "Youra No AI",
      userId: "admin123",
      password: "Arya data 23",
      role: "admin"
    });
    
    // Create sample awards
    this.createAward({
      name: "JavaScript Master",
      description: "Mastered JavaScript concepts",
      badge: "JS"
    });
    
    this.createAward({
      name: "Perfect Attendance",
      description: "Never missed a class",
      badge: "PA"
    });
    
    this.createAward({
      name: "Top Performer",
      description: "Achieved top grades",
      badge: "TP"
    });

    // Create sample assignments
    this.createAssignment({
      title: "React Components",
      description: "Create reusable React components",
      course: "React Fundamentals",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    this.createAssignment({
      title: "Express API",
      description: "Build a RESTful API with Express",
      course: "Backend Development",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
    });

    // Create sample learning materials
    this.createLearningMaterial({
      title: "React Hooks: useState and useEffect",
      content: "Detailed explanation of React Hooks...",
      category: "React",
      authorId: 1,
      readTime: 15
    });
    
    this.createLearningMaterial({
      title: "Express.js Middleware",
      content: "Understanding and implementing middleware functions in Express...",
      category: "Express",
      authorId: 1,
      readTime: 20
    });
  }

  // User management implementations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByUserId(userId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.userId === userId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    
    // Hash password if it doesn't already contain a salt
    let password = insertUser.password;
    if (!password.includes('.')) {
      try {
        // Hash the password
        password = await hashPassword(password);
      } catch (error) {
        console.error("Error hashing password:", error);
        // Fallback to plain password in case of error (shouldn't happen)
      }
    }
    
    const user: User = { 
      ...insertUser, 
      password, // Use the potentially hashed password
      id, 
      createdAt: now,
      role: insertUser.role || "user" // Ensure role is defined
    };
    
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Learning materials implementations
  async createLearningMaterial(material: InsertLearningMaterial): Promise<LearningMaterial> {
    const id = this.currentMaterialId++;
    const now = new Date();
    const learningMaterial: LearningMaterial = { 
      ...material, 
      id, 
      createdAt: now,
      updatedAt: now 
    };
    this.learningMaterials.set(id, learningMaterial);
    return learningMaterial;
  }

  async getLearningMaterial(id: number): Promise<LearningMaterial | undefined> {
    return this.learningMaterials.get(id);
  }

  async getLearningMaterials(): Promise<LearningMaterial[]> {
    return Array.from(this.learningMaterials.values());
  }

  async updateLearningMaterial(id: number, material: Partial<InsertLearningMaterial>): Promise<LearningMaterial | undefined> {
    const existing = this.learningMaterials.get(id);
    if (!existing) return undefined;
    
    const updated: LearningMaterial = { 
      ...existing, 
      ...material, 
      updatedAt: new Date() 
    };
    
    this.learningMaterials.set(id, updated);
    return updated;
  }

  async deleteLearningMaterial(id: number): Promise<boolean> {
    return this.learningMaterials.delete(id);
  }

  // Assignments implementations
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const id = this.currentAssignmentId++;
    const now = new Date();
    const newAssignment: Assignment = { 
      ...assignment, 
      id, 
      createdAt: now
    };
    this.assignments.set(id, newAssignment);
    return newAssignment;
  }

  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async getAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignments.values());
  }

  async updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const existing = this.assignments.get(id);
    if (!existing) return undefined;
    
    const updated: Assignment = { 
      ...existing, 
      ...assignment
    };
    
    this.assignments.set(id, updated);
    return updated;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    return this.assignments.delete(id);
  }

  // Assignment submissions implementations
  async createAssignmentSubmission(submission: InsertAssignmentSubmission): Promise<AssignmentSubmission> {
    const id = this.currentSubmissionId++;
    const now = new Date();
    const newSubmission: AssignmentSubmission = { 
      ...submission, 
      id, 
      submittedAt: now
    };
    this.assignmentSubmissions.set(id, newSubmission);
    return newSubmission;
  }

  async getAssignmentSubmission(id: number): Promise<AssignmentSubmission | undefined> {
    return this.assignmentSubmissions.get(id);
  }

  async getAssignmentSubmissionsByUser(userId: number): Promise<AssignmentSubmission[]> {
    return Array.from(this.assignmentSubmissions.values())
      .filter(submission => submission.userId === userId);
  }

  async getAssignmentSubmissionsByAssignment(assignmentId: number): Promise<AssignmentSubmission[]> {
    return Array.from(this.assignmentSubmissions.values())
      .filter(submission => submission.assignmentId === assignmentId);
  }

  async updateAssignmentSubmission(id: number, submission: Partial<InsertAssignmentSubmission>): Promise<AssignmentSubmission | undefined> {
    const existing = this.assignmentSubmissions.get(id);
    if (!existing) return undefined;
    
    const updated: AssignmentSubmission = { 
      ...existing, 
      ...submission 
    };
    
    this.assignmentSubmissions.set(id, updated);
    return updated;
  }

  // Awards implementations
  async createAward(award: InsertAward): Promise<Award> {
    const id = this.currentAwardId++;
    const now = new Date();
    const newAward: Award = { 
      ...award, 
      id, 
      createdAt: now
    };
    this.awards.set(id, newAward);
    return newAward;
  }

  async getAward(id: number): Promise<Award | undefined> {
    return this.awards.get(id);
  }

  async getAwards(): Promise<Award[]> {
    return Array.from(this.awards.values());
  }

  async updateAward(id: number, award: Partial<InsertAward>): Promise<Award | undefined> {
    const existing = this.awards.get(id);
    if (!existing) return undefined;
    
    const updated: Award = { 
      ...existing, 
      ...award 
    };
    
    this.awards.set(id, updated);
    return updated;
  }

  async deleteAward(id: number): Promise<boolean> {
    return this.awards.delete(id);
  }

  // User awards implementations
  async assignAwardToUser(userAward: InsertUserAward): Promise<UserAward> {
    const id = this.currentUserAwardId++;
    const now = new Date();
    const newUserAward: UserAward = { 
      ...userAward, 
      id, 
      awardedAt: now
    };
    this.userAwards.set(id, newUserAward);
    return newUserAward;
  }

  async getUserAwards(userId: number): Promise<(UserAward & { award: Award })[]> {
    const userAwards = Array.from(this.userAwards.values())
      .filter(userAward => userAward.userId === userId);
    
    return userAwards.map(userAward => {
      const award = this.awards.get(userAward.awardId);
      if (!award) {
        throw new Error(`Award with id ${userAward.awardId} not found`);
      }
      return { ...userAward, award };
    });
  }

  // Page statistics implementations
  async recordPageVisit(visit: InsertPageVisit): Promise<PageVisit> {
    const id = this.currentPageVisitId++;
    const now = new Date();
    const newVisit: PageVisit = { 
      ...visit, 
      id, 
      visitedAt: now
    };
    this.pageVisits.push(newVisit);
    return newVisit;
  }

  async getPageVisits(): Promise<PageVisit[]> {
    return this.pageVisits;
  }

  async getPageVisitsByUser(userId: number): Promise<PageVisit[]> {
    return this.pageVisits.filter(visit => visit.userId === userId);
  }

  async getMostVisitedPages(limit: number = 5): Promise<{page: string, count: number}[]> {
    const pageCounts = this.pageVisits.reduce((acc, visit) => {
      acc[visit.page] = (acc[visit.page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // User sessions implementations
  async updateUserSession(session: InsertUserSession): Promise<UserSession> {
    let existingSession: UserSession | undefined;
    
    // Look for an existing session for this user
    for (const [id, sess] of this.userSessions.entries()) {
      if (sess.userId === session.userId) {
        existingSession = sess;
        break;
      }
    }
    
    if (existingSession) {
      // Update existing session
      const updated: UserSession = { 
        ...existingSession, 
        lastActive: new Date(),
        currentPage: session.currentPage || existingSession.currentPage
      };
      this.userSessions.set(existingSession.id, updated);
      return updated;
    } else {
      // Create new session
      const id = this.currentUserSessionId++;
      const newSession: UserSession = { 
        ...session, 
        id, 
        lastActive: new Date()
      };
      this.userSessions.set(id, newSession);
      return newSession;
    }
  }

  async getActiveUserSessions(timeThreshold: number): Promise<(UserSession & { user: User })[]> {
    const now = new Date();
    const thresholdTime = new Date(now.getTime() - timeThreshold);
    
    const activeSessions = Array.from(this.userSessions.values())
      .filter(session => session.lastActive > thresholdTime);
    
    return activeSessions.map(session => {
      const user = this.users.get(session.userId);
      if (!user) {
        throw new Error(`User with id ${session.userId} not found`);
      }
      return { ...session, user };
    });
  }
}

export const storage = new MemStorage();
