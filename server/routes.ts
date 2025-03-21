import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertLearningMaterialSchema, insertAssignmentSchema, insertAssignmentSubmissionSchema, insertAwardSchema, insertUserAwardSchema, insertPageVisitSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  const httpServer = createServer(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).send("Unauthorized");
  };

  // Middleware to check if user is an admin
  const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).send("Forbidden");
  };

  // Record page visit
  app.post("/api/page-visits", isAuthenticated, async (req, res) => {
    try {
      const { page } = req.body;
      if (!page) {
        return res.status(400).send("Page is required");
      }
      
      const visit = await storage.recordPageVisit({
        page,
        userId: req.user.id
      });
      
      res.status(201).json(visit);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  // Get most visited pages
  app.get("/api/page-visits/stats", isAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const stats = await storage.getMostVisitedPages(limit);
      res.json(stats);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  // Update user session (for tracking online users)
  app.post("/api/sessions", isAuthenticated, async (req, res) => {
    try {
      const { currentPage } = req.body;
      const session = await storage.updateUserSession({
        userId: req.user.id,
        currentPage,
        lastActive: new Date()
      });
      res.status(200).json(session);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  // Get active user sessions
  app.get("/api/sessions/active", isAdmin, async (req, res) => {
    try {
      // Default to 15 minutes
      const timeThreshold = req.query.threshold ? parseInt(req.query.threshold as string) : 15 * 60 * 1000;
      const sessions = await storage.getActiveUserSessions(timeThreshold);
      res.json(sessions);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  // Learning Materials API
  app.get("/api/materials", isAuthenticated, async (req, res) => {
    try {
      const materials = await storage.getLearningMaterials();
      res.json(materials);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  app.get("/api/materials/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.getLearningMaterial(id);
      
      if (!material) {
        return res.status(404).send("Material not found");
      }
      
      res.json(material);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  app.post("/api/materials", isAdmin, async (req, res) => {
    try {
      const material = insertLearningMaterialSchema.parse(req.body);
      const createdMaterial = await storage.createLearningMaterial(material);
      res.status(201).json(createdMaterial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).send("Server error");
      }
    }
  });

  app.put("/api/materials/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const material = insertLearningMaterialSchema.partial().parse(req.body);
      const updatedMaterial = await storage.updateLearningMaterial(id, material);
      
      if (!updatedMaterial) {
        return res.status(404).send("Material not found");
      }
      
      res.json(updatedMaterial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).send("Server error");
      }
    }
  });

  app.delete("/api/materials/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLearningMaterial(id);
      
      if (!success) {
        return res.status(404).send("Material not found");
      }
      
      res.status(200).send("Material deleted");
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  // Assignments API
  app.get("/api/assignments", isAuthenticated, async (req, res) => {
    try {
      const assignments = await storage.getAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  app.get("/api/assignments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.getAssignment(id);
      
      if (!assignment) {
        return res.status(404).send("Assignment not found");
      }
      
      res.json(assignment);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  app.post("/api/assignments", isAdmin, async (req, res) => {
    try {
      const assignment = insertAssignmentSchema.parse(req.body);
      const createdAssignment = await storage.createAssignment(assignment);
      res.status(201).json(createdAssignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).send("Server error");
      }
    }
  });

  app.put("/api/assignments/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = insertAssignmentSchema.partial().parse(req.body);
      const updatedAssignment = await storage.updateAssignment(id, assignment);
      
      if (!updatedAssignment) {
        return res.status(404).send("Assignment not found");
      }
      
      res.json(updatedAssignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).send("Server error");
      }
    }
  });

  app.delete("/api/assignments/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAssignment(id);
      
      if (!success) {
        return res.status(404).send("Assignment not found");
      }
      
      res.status(200).send("Assignment deleted");
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  // Assignment Submissions API
  app.get("/api/submissions", isAuthenticated, async (req, res) => {
    try {
      let submissions;
      
      if (req.user.role === "admin") {
        // Admins can get all submissions or filter by assignment
        if (req.query.assignmentId) {
          submissions = await storage.getAssignmentSubmissionsByAssignment(parseInt(req.query.assignmentId as string));
        } else {
          // We would need to implement a method to get all submissions
          // For now, let's just return an empty array
          submissions = [];
        }
      } else {
        // Regular users can only see their own submissions
        submissions = await storage.getAssignmentSubmissionsByUser(req.user.id);
      }
      
      res.json(submissions);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  app.post("/api/submissions", isAuthenticated, async (req, res) => {
    try {
      const submission = {
        ...req.body,
        userId: req.user.id
      };
      
      const validatedSubmission = insertAssignmentSubmissionSchema.parse(submission);
      const createdSubmission = await storage.createAssignmentSubmission(validatedSubmission);
      
      res.status(201).json(createdSubmission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).send("Server error");
      }
    }
  });

  app.put("/api/submissions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const submission = insertAssignmentSubmissionSchema.partial().parse(req.body);
      const updatedSubmission = await storage.updateAssignmentSubmission(id, submission);
      
      if (!updatedSubmission) {
        return res.status(404).send("Submission not found");
      }
      
      res.json(updatedSubmission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).send("Server error");
      }
    }
  });

  // Awards API
  app.get("/api/awards", isAuthenticated, async (req, res) => {
    try {
      const awards = await storage.getAwards();
      res.json(awards);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  app.post("/api/awards", isAdmin, async (req, res) => {
    try {
      const award = insertAwardSchema.parse(req.body);
      const createdAward = await storage.createAward(award);
      res.status(201).json(createdAward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).send("Server error");
      }
    }
  });

  app.put("/api/awards/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const award = insertAwardSchema.partial().parse(req.body);
      const updatedAward = await storage.updateAward(id, award);
      
      if (!updatedAward) {
        return res.status(404).send("Award not found");
      }
      
      res.json(updatedAward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).send("Server error");
      }
    }
  });

  app.delete("/api/awards/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAward(id);
      
      if (!success) {
        return res.status(404).send("Award not found");
      }
      
      res.status(200).send("Award deleted");
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  // User Awards API
  app.get("/api/user-awards", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user.id;
      
      // Only admins can view other users' awards
      if (userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).send("Forbidden");
      }
      
      const userAwards = await storage.getUserAwards(userId);
      res.json(userAwards);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });

  app.post("/api/user-awards", isAdmin, async (req, res) => {
    try {
      const userAward = insertUserAwardSchema.parse(req.body);
      const createdUserAward = await storage.assignAwardToUser(userAward);
      res.status(201).json(createdUserAward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).send("Server error");
      }
    }
  });

  // Users API
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from the response
      const usersWithoutPasswords = users.map(user => ({
        ...user,
        password: undefined
      }));
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });
  
  // Database overview (untuk inspeksi database)
  app.get("/api/db-status", async (req, res) => {
    try {
      const users = await storage.getUsers();
      const materials = await storage.getLearningMaterials();
      const assignments = await storage.getAssignments();
      const awards = await storage.getAwards();
      const pageVisits = await storage.getPageVisits();
      
      // Hapus informasi sensitif seperti password
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        userId: user.userId,
        role: user.role,
        createdAt: user.createdAt
      }));
      
      res.json({
        users: sanitizedUsers,
        materials,
        assignments,
        awards,
        pageVisits
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch database status" });
    }
  });

  return httpServer;
}
