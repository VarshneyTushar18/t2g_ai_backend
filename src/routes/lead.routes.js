import express from "express";
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
} from "../controllers/lead.controller.js";

import { verifyAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ======================================================
   PUBLIC ROUTE (MAIN WEBSITE)
====================================================== */
router.post("/contact", createLead);

/* ======================================================
   ADMIN ROUTES (PROTECTED)
====================================================== */
router.get("/leads", verifyAdmin, getLeads);          // Get all leads
router.get("/leads/:id", verifyAdmin, getLeadById);   // Get single lead
router.put("/leads/:id", verifyAdmin, updateLead);    // Update lead
router.delete("/leads/:id", verifyAdmin, deleteLead); // Delete lead

export default router;