import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User related tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  userId: text("user_id").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Learning material related tables
export const learningMaterials = pgTable("learning_materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
  readTime: integer("read_time").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertLearningMaterialSchema = createInsertSchema(learningMaterials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Assignment related tables
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  course: text("course").notNull(),
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  fileUrl: text("file_url").notNull(),
  comment: text("comment"),
  status: text("status").notNull().default("submitted"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  grade: integer("grade")
});

export const insertAssignmentSubmissionSchema = createInsertSchema(assignmentSubmissions).omit({
  id: true,
  submittedAt: true,
});

// Award related tables
export const awards = pgTable("awards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  badge: text("badge").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertAwardSchema = createInsertSchema(awards).omit({
  id: true,
  createdAt: true,
});

export const userAwards = pgTable("user_awards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  awardId: integer("award_id").notNull().references(() => awards.id),
  awardedAt: timestamp("awarded_at").notNull().defaultNow()
});

export const insertUserAwardSchema = createInsertSchema(userAwards).omit({
  id: true,
  awardedAt: true,
});

// Page statistics related tables
export const pageVisits = pgTable("page_visits", {
  id: serial("id").primaryKey(),
  page: text("page").notNull(),
  userId: integer("user_id").references(() => users.id),
  visitedAt: timestamp("visited_at").notNull().defaultNow()
});

export const insertPageVisitSchema = createInsertSchema(pageVisits).omit({
  id: true,
  visitedAt: true,
});

// Session tracking for online users
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  lastActive: timestamp("last_active").notNull().defaultNow(),
  currentPage: text("current_page")
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
});

// Types for our schema
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type LearningMaterial = typeof learningMaterials.$inferSelect;
export type InsertLearningMaterial = z.infer<typeof insertLearningMaterialSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission = z.infer<typeof insertAssignmentSubmissionSchema>;

export type Award = typeof awards.$inferSelect;
export type InsertAward = z.infer<typeof insertAwardSchema>;

export type UserAward = typeof userAwards.$inferSelect;
export type InsertUserAward = z.infer<typeof insertUserAwardSchema>;

export type PageVisit = typeof pageVisits.$inferSelect;
export type InsertPageVisit = z.infer<typeof insertPageVisitSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
