import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface LeadNote {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  budget: number;
  message: string;
  status: "new" | "contacted" | "converted" | "lost";
  createdAt: string;
  notes: LeadNote[];
  source: string;
  timeline: string;
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "leads.json");

// Default mock data to populate the CRM initially
const INITIAL_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "Siddharth Kumar",
    email: "siddharth@lunartech.io",
    phone: "+91 98765 43210",
    company: "LunarTech Labs",
    service: "Full Stack Web Development",
    budget: 8500,
    message: "We need a secure custom platform to manage our clients and run real-time telemetry pipelines. The system must support dashboard metrics & live updates.",
    status: "new",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    source: "Website Contact Form",
    timeline: "Immediate",
    notes: [
      {
        id: "note-1-1",
        text: "Inbound submission received via public contact form.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        author: "System Audit"
      }
    ]
  },
  {
    id: "lead-2",
    name: "John Doe",
    email: "john.doe@stripe-agency.com",
    phone: "+1 (555) 234-5678",
    company: "Stripe Agency",
    service: "SEO & Digital Marketing",
    budget: 3200,
    message: "Seeking a long-term partner to manage search engine optimization and online advertisements for three of our e-commerce clients brand pages.",
    status: "contacted",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: "LinkedIn Referral",
    timeline: "1-3 months",
    notes: [
      {
        id: "note-2-1",
        text: "Sent an introductory email with our service catalog. Waiting on a return call.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        author: "Admin Team"
      },
      {
        id: "note-2-2",
        text: "Siddharth replied, set up a Google Meet call for next Wednesday.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        author: "Admin Team"
      }
    ]
  },
  {
    id: "lead-3",
    name: "Aanya Verma",
    email: "aanya@biohealth-care.org",
    phone: "+91 87654 32109",
    company: "BioHealth Diagnostics",
    service: "Mobile App Development",
    budget: 15000,
    message: "We are developing a medical tracking app for patients undergoing therapy. It requires strict privacy, patient logs, and Bluetooth sync capabilities.",
    status: "converted",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    source: "Google Search",
    timeline: "Immediate",
    notes: [
      {
        id: "note-3-1",
        text: "Initial contact form filled. Extremely high intent client.",
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        author: "System"
      },
      {
        id: "note-3-2",
        text: "Contract structured and signed! Initial deposit of $5,000 received. Moving to active developer deployment phase.",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        author: "Sales Lead"
      }
    ]
  },
  {
    id: "lead-4",
    name: "Robert Stark",
    email: "tony@stark-energy.co",
    phone: "+1 (555) 999-0001",
    company: "Stark Energy Core",
    service: "UI/UX Design",
    budget: 25000,
    message: "Need a complete visual redesign for our energy-monitoring dashboards. Must look modern, premium, minimalist, and utilize crisp dark styles with motion feedback.",
    status: "new",
    createdAt: new Date(Date.now() - 6 * 45 * 60 * 1000).toISOString(), // 4.5 hours ago
    source: "Partner Referral",
    timeline: "Immediate",
    notes: [
      {
        id: "note-4-1",
        text: "Inbound partner referral. Tony wants a rapid 2-week turnaround for the initial design mockup prototypes.",
        createdAt: new Date(Date.now() - 6 * 45 * 60 * 1000).toISOString(),
        author: "System Audit"
      }
    ]
  },
  {
    id: "lead-5",
    name: "Meera Nair",
    email: "meera.nair@ecogrow-retail.in",
    phone: "+91 94432 11003",
    company: "EcoGrow Retailers",
    service: "Full Stack Web Development",
    budget: 4500,
    message: "Looking for an e-commerce storefront with local payment gateway integrations and custom admin order management panel.",
    status: "lost",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    source: "Website Contact Form",
    timeline: "3-6 months",
    notes: [
      {
        id: "note-5-1",
        text: "Contact form submitted.",
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        author: "System"
      },
      {
        id: "note-5-2",
        text: "Lead closed. Budget is too low for the extensive catalog system they are requesting as e-commerce platform.",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        author: "Admin Team"
      }
    ]
  }
];

// Helper to secure JSON db file actions
function loadDatabase(): { leads: Lead[] } {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ leads: INITIAL_LEADS }, null, 2), "utf8");
      return { leads: INITIAL_LEADS };
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to load leads database:", error);
    return { leads: INITIAL_LEADS };
  }
}

function saveDatabase(data: { leads: Lead[] }) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to save leads database:", error);
  }
}

// Simple Admin authentication mechanism (stateful session representation)
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "adminpassword" // Easy to remember and test
};
const SECURE_TOKEN = "crm-session-super-token-verified-4122";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Define API Endpoints FIRST (before Vite matches wildcard rules)

  // 1. Submit contact form lead from public landing page (Rate-limited simulation)
  app.post("/api/contact", (req, res) => {
    try {
      const { name, email, phone, company, service, budget, message, timeline, source } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and Email are required fields." });
      }

      const dbData = loadDatabase();
      const newLead: Lead = {
        id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: String(phone || "").trim(),
        company: String(company || "Independent/Freelance").trim(),
        service: String(service || "Full Stack Web Development").trim(),
        budget: Number(budget) || 0,
        message: String(message || "").trim(),
        status: "new",
        createdAt: new Date().toISOString(),
        timeline: String(timeline || "Immediate").trim(),
        source: String(source || "Website Contact Form").trim(),
        notes: [
          {
            id: `note-${Date.now()}`,
            text: "Form submitted successfully. Auto-entered inbound lead.",
            createdAt: new Date().toISOString(),
            author: "System Audit"
          }
        ]
      };

      dbData.leads.unshift(newLead);
      saveDatabase(dbData);

      console.log(`[CRM Backend] New Lead registered: ${newLead.name} (${newLead.company})`);
      res.status(201).json({ success: true, lead: newLead });
    } catch (err: any) {
      console.error("API error in contact form submission:", err);
      res.status(500).json({ error: "Internal server error saving lead." });
    }
  });

  // 2. Admin Authentication login flow
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (
      String(username).trim().toLowerCase() === ADMIN_CREDENTIALS.username &&
      String(password) === ADMIN_CREDENTIALS.password
    ) {
      return res.json({ success: true, token: SECURE_TOKEN });
    }
    return res.status(401).json({ error: "Invalid username or password. Please use 'admin' / 'adminpassword'." });
  });

  // Simple auth validation middleware
  const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader === `Bearer ${SECURE_TOKEN}`) {
      return next();
    }
    return res.status(401).json({ error: "Unauthorized access. Valid token required." });
  };

  // 3. Admin Check Session
  app.get("/api/admin/check-auth", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader === `Bearer ${SECURE_TOKEN}`) {
      return res.json({ authenticated: true });
    }
    return res.json({ authenticated: false });
  });

  // 4. Retrieve All Leads (Admin CRM Pipeline list)
  app.get("/api/admin/leads", authenticateAdmin, (req, res) => {
    try {
      const dbData = loadDatabase();
      res.json({ leads: dbData.leads });
    } catch (err) {
      res.status(500).json({ error: "Could not read database." });
    }
  });

  // 5. Update Lead properties (such as Status, Notes, Timeline, Values)
  app.put("/api/admin/leads/:id", authenticateAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const dbData = loadDatabase();

      const idx = dbData.leads.findIndex((l) => l.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Lead not found." });
      }

      const existingLead = dbData.leads[idx];

      // Update fields
      if (updates.status) existingLead.status = updates.status;
      if (updates.timeline) existingLead.timeline = updates.timeline;
      if (updates.budget !== undefined) existingLead.budget = Number(updates.budget) || 0;
      if (updates.service) existingLead.service = updates.service;
      if (updates.notes) existingLead.notes = updates.notes;

      dbData.leads[idx] = existingLead;
      saveDatabase(dbData);

      res.json({ success: true, lead: existingLead });
    } catch (err) {
      res.status(500).json({ error: "Error updating pipeline lead status." });
    }
  });

  // 6. Append secure note to lead conversation timeline
  app.post("/api/admin/leads/:id/notes", authenticateAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { text, author } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Note content cannot be empty." });
      }

      const dbData = loadDatabase();
      const idx = dbData.leads.findIndex((l) => l.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Lead not found." });
      }

      const newNote: LeadNote = {
        id: `note-${Date.now()}`,
        text: String(text).trim(),
        createdAt: new Date().toISOString(),
        author: String(author || "Admin User").trim()
      };

      dbData.leads[idx].notes.push(newNote);
      saveDatabase(dbData);

      res.status(201).json({ success: true, note: newNote, lead: dbData.leads[idx] });
    } catch (err) {
      res.status(500).json({ error: "Error appending follow-up note." });
    }
  });

  // 7. Delete Lead
  app.delete("/api/admin/leads/:id", authenticateAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const dbData = loadDatabase();
      const initialLength = dbData.leads.length;
      
      dbData.leads = dbData.leads.filter((l) => l.id !== id);
      if (dbData.leads.length === initialLength) {
        return res.status(404).json({ error: "Lead not found." });
      }

      saveDatabase(dbData);
      res.json({ success: true, message: "Lead removed from system." });
    } catch (err) {
      res.status(500).json({ error: "Error deleting lead record." });
    }
  });

  // 8. Re-bulk populate baseline mock data for easy demonstration and evaluation
  app.post("/api/admin/leads/reset", authenticateAdmin, (req, res) => {
    try {
      const dbData = { leads: INITIAL_LEADS };
      saveDatabase(dbData);
      res.json({ success: true, leads: INITIAL_LEADS });
    } catch (err) {
      res.status(500).json({ error: "Could not restore system baseline leads." });
    }
  });

  // Setup Vite Dev Server / Static Asset deployment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CRM Multi-Route Server] Live and listening on port ${PORT}`);
  });
}

startServer();
