import React, { useState, useEffect } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  DollarSign, 
  CalendarRange, 
  Lock, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  ClipboardList, 
  CheckCircle, 
  TrendingUp, 
  X, 
  Clock, 
  ArrowUpRight, 
  Grid, 
  FileText, 
  RefreshCw, 
  SlidersHorizontal, 
  AlertCircle, 
  ArrowRight, 
  ChevronRight,
  ShieldAlert,
  Send,
  Zap,
  Layers,
  Sparkles,
  BarChart4
} from "lucide-react";
import { Lead, LeadStatus, LeadNote } from "./types";

export default function App() {
  const [viewMode, setViewMode] = useState<"public" | "admin">("public");
  
  // Public site form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "Full Stack Web Development",
    budget: 5000,
    timeline: "Immediate",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<Lead | null>(null);
  const [submitError, setSubmitError] = useState("");

  // Admin authentication state
  const [credentials, setCredentials] = useState({ username: "admin", password: "" });
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem("crm_token"));
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // CRM Leads pipeline state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [crmError, setCrmError] = useState("");

  // CRM Search, filters & UX layouts
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "budget-desc" | "budget-asc">("date");
  const [dashboardTab, setDashboardTab] = useState<"kanban" | "registry">("kanban");

  // New Note composition
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Load and refresh leads when authenticated or when view turns to admin
  useEffect(() => {
    if (authToken && viewMode === "admin") {
      fetchLeads();
    }
  }, [authToken, viewMode]);

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setSubmitError("Name and Email are required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "Website Contact Form"
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit form.");
      }

      setSubmitSuccess(result.lead);
      // Reset form variables
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        service: "Full Stack Web Development",
        budget: 5000,
        timeline: "Immediate",
        message: ""
      });
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong during submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Authenticate admin user
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Invalid login credentials.");
      }

      setAuthToken(result.token);
      localStorage.setItem("crm_token", result.token);
    } catch (err: any) {
      setLoginError(err.message || "Network error. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fetch leads from backend
  const fetchLeads = async () => {
    if (!authToken) return;
    setIsLoadingLeads(true);
    setCrmError("");
    try {
      const response = await fetch("/api/admin/leads", {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(data.error || "Failed to retrieve CRM leads.");
      }
      setLeads(data.leads);
      
      // Update selected lead to stay synced if open
      if (selectedLead) {
        const updated = data.leads.find((l: Lead) => l.id === selectedLead.id);
        if (updated) setSelectedLead(updated);
      }
    } catch (err: any) {
      setCrmError(err.message || "An error occurred fetching records.");
    } finally {
      setIsLoadingLeads(false);
    }
  };

  // Update lead status
  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    if (!authToken) return;
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update status.");
      }
      
      // Update local state without full reload for instant visual snappy-nest
      setLeads(prev => prev.map(l => l.id === leadId ? result.lead : l));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(result.lead);
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  // Append new note to a Lead
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !noteText.trim() || !authToken) return;

    setIsAddingNote(true);
    try {
      const response = await fetch(`/api/admin/leads/${selectedLead.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          text: noteText,
          author: "Admin Coordinator"
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not append note.");
      }

      setNoteText("");
      // Update lead with new notes locally
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? result.lead : l));
      setSelectedLead(result.lead);
    } catch (err: any) {
      alert(err.message || "Failed to add note.");
    } finally {
      setIsAddingNote(false);
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to permanently delete this client lead?")) return;
    if (!authToken) return;

    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete lead from system.");
      }

      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
    } catch (err: any) {
      alert(err.message || "Could not delete lead.");
    }
  };

  // Inbound Lead Injector (Mock generator)
  const handleAddMockLead = async () => {
    if (!authToken) return;
    const firstNames = ["Sai", "Rohit", "Anjali", "Pooja", "Vikram", "Shanti", "Chris", "Emma", "Pranav", "David"];
    const lastNames = ["Reddy", "Sharma", "Devi", "Patel", "Nair", "Taylor", "Gomez", "Sen", "Rao", "Smith"];
    const services = ["Full Stack Web Development", "Mobile App Development", "UI/UX Design", "SEO & Marketing"];
    const budgets = [3500, 5000, 7500, 12000, 20000, 35000];
    const timelines = ["Immediate", "1-3 months", "3-6 months"];
    const sources = ["LinkedIn Ad", "Google Search", "Partner Referral", "Direct Inbound"];
    const Companies = ["PixelSpark Solutions", "Vortex Digital", "Helix Labs", "Sovereign Health", "Apex Retail", "Agile Corp"];
    const messages = [
      "We require an immersive dashboard system with rich SVG components and customizable status trackers for our sales personnel.",
      "Looking to optimize our core brand search ranking. Require local SEO setup and continuous weekly reporting pipeline.",
      "Mobile tracking utility for delivery partners. Need to support geographic triggers, push updates, and clean offline modes.",
      "Redesigning our agency interface to feature sophisticated dark styling layouts and seamless route transition feedback."
    ];

    const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const cleanEmail = `${randomName.toLowerCase().replace(" ", ".")}@${Companies[Math.floor(Math.random() * Companies.length)].toLowerCase().replace(" ", "")}.com`;
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: randomName,
          email: cleanEmail,
          phone: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
          company: Companies[Math.floor(Math.random() * Companies.length)],
          service: services[Math.floor(Math.random() * services.length)],
          budget: budgets[Math.floor(Math.random() * budgets.length)],
          timeline: timelines[Math.floor(Math.random() * timelines.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          source: sources[Math.floor(Math.random() * sources.length)]
        })
      });

      if (response.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Restore database to fresh baseline (Default mockup)
  const handleResetBaseline = async () => {
    if (!authToken || !confirm("Are you sure you want to restore the system leads to the baseline starting records?")) return;
    try {
      const response = await fetch("/api/admin/leads/reset", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        fetchLeads();
        setSelectedLead(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Log out admin
  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem("crm_token");
    setLeads([]);
    setSelectedLead(null);
  };

  // Filter and sort computation
  const filteredAndSortedLeads = leads
    .filter(lead => {
      // Search Box filter
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status dropdown filter
      const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
      
      // Service dropdown filter
      const matchesService = filterService === "all" || lead.service === filterService;

      return matchesSearch && matchesStatus && matchesService;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "budget-desc") {
        return b.budget - a.budget;
      } else if (sortBy === "budget-asc") {
        return a.budget - b.budget;
      }
      return 0;
    });

  // Simple stats calculation
  const totalLeads = leads.length;
  const newLeadsCount = leads.filter(l => l.status === "new").length;
  const contactedLeadsCount = leads.filter(l => l.status === "contacted").length;
  const convertedLeadsCount = leads.filter(l => l.status === "converted").length;
  const lostLeadsCount = leads.filter(l => l.status === "lost").length;
  
  const pipelineValue = leads
    .filter(l => l.status !== "lost")
    .reduce((sum, current) => sum + current.budget, 0);

  const closedLeadsCount = convertedLeadsCount + lostLeadsCount;
  const conversionRate = closedLeadsCount > 0 
    ? Math.round((convertedLeadsCount / closedLeadsCount) * 100)
    : 0;

  // Distribution of leads by Service (for mini analytics lists)
  const serviceStats = leads.reduce((acc: { [key: string]: number }, lead) => {
    acc[lead.service] = (acc[lead.service] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Top Universal Demonstration Bar & Sticky Switcher */}
      <div className="bg-slate-900 text-white text-xs px-4 py-2.5 flex flex-wrap gap-y-2 justify-between items-center border-b border-slate-800 z-50">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-slate-300">
            <strong>Future Interns Pipeline Service</strong> &bull; Task 2 (2026 Edition)
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Toggle Interface Mode:</span>
          <div className="bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-700">
            <button
              onClick={() => setViewMode("public")}
              className={`px-3 py-1 rounded-md font-medium transition-all duration-200 flex items-center gap-1.5 ${
                viewMode === "public" 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="h-3 w-3" />
              Public Enterprise Form
            </button>
            <button
              onClick={() => setViewMode("admin")}
              className={`px-3 py-1 rounded-md font-medium transition-all duration-200 flex items-center gap-1.5 ${
                viewMode === "admin" 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              Admin CRM Dashboard
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {viewMode === "public" ? (
            /* ========================================================================= */
            /* 1. PUBLIC LANDING PAGE & CONTACT FORM                                     */
            /* ========================================================================= */
            <motion.div
              key="public-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                {/* Left side text segment */}
                <div className="lg:col-span-5 space-y-8 select-none">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100/50 rounded-full text-indigo-700 font-medium text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    Elite Digital Engineering Agency
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                    Software that triggers <span className="text-indigo-600 underline decoration-indigo-300 underline-offset-8">real business growth</span>.
                  </h1>

                  <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                    We help innovative companies plan, launch, and scale customized web and mobile applications. Turn your service scope into modern web portals that serve clients flawlessly.
                  </p>

                  <div className="pt-2 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-200">
                    <div className="space-y-1">
                      <span className="block text-2xl font-bold text-slate-900">100% Real-Time</span>
                      <span className="text-sm text-slate-500">Pipeline Synchronization</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-2xl font-bold text-slate-900">Custom CRM</span>
                      <span className="text-sm text-slate-500">Instant Admin Tracking</span>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                    <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm border border-indigo-50">
                      <BarChart4 className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Interactive Sandbox Demo Mode</h4>
                      <p className="text-xs text-slate-600">
                        Submit a trial request in the contact form on the right, toggle the Admin interface above, and watch your record arrive in real-time in the Kanban pipeline!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side interactive Contact Form card */}
                <div id="contact-panel" className="lg:col-span-7 bg-white p-7 sm:p-10 rounded-3xl border border-slate-200/85 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600" />
                  
                  {submitSuccess ? (
                    /* Form Submission Success Screen */
                    <motion.div 
                      initial={{ scale: 0.94, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="py-8 text-center space-y-6"
                    >
                      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">
                        <CheckCircle className="h-9 w-9" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-900">Thank you, {submitSuccess.name}!</h3>
                        <p className="text-slate-600 max-w-md mx-auto">
                          Our agency team has received your inquiry. A customized service quote has been dispatched to <strong>{submitSuccess.email}</strong>.
                        </p>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-2xl inline-block text-left border border-slate-100 w-full max-w-md">
                        <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 border-b pb-1.5 flex items-center justify-between">
                          <span>Recorded Submission shape</span>
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px]">Status: INBOUND NEW</span>
                        </div>
                        <ul className="space-y-2 text-xs font-mono">
                          <li className="grid grid-cols-3 text-slate-500"><span className="font-semibold text-slate-800">Lead ID:</span> {submitSuccess.id}</li>
                          <li className="grid grid-cols-3 text-slate-500"><span className="font-semibold text-slate-800">Company:</span> {submitSuccess.company}</li>
                          <li className="grid grid-cols-3 text-slate-500"><span className="font-semibold text-slate-800">Service:</span> {submitSuccess.service}</li>
                          <li className="grid grid-cols-3 text-slate-500"><span className="font-semibold text-slate-800">Budget:</span> ${submitSuccess.budget.toLocaleString()}</li>
                          <li className="grid grid-cols-3 text-slate-500"><span className="font-semibold text-slate-800">Timeline:</span> {submitSuccess.timeline}</li>
                        </ul>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => {
                            setSubmitSuccess(null);
                            setSubmitError("");
                          }}
                          className="px-6 py-2.5 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 font-medium transition text-slate-700 text-sm"
                        >
                          Submit Another Proposal
                        </button>
                        <button
                          onClick={() => setViewMode("admin")}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow font-semibold transition text-sm flex items-center justify-center gap-1.5"
                        >
                          Check Admin CRM Dashboard
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* The Contact Form */
                    <form onSubmit={handleContactSubmit} className="space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900">Request a Service Quote</h2>
                        <p className="text-sm text-slate-500">Provide details about your venture and receive a project design plan.</p>
                      </div>

                      {submitError && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Full Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Full Name *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                              <User className="h-4 w-4" />
                            </span>
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              placeholder="e.g. Ramesh Patel"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                            />
                          </div>
                        </div>

                        {/* Professional Email */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Email Address *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                              <Mail className="h-4 w-4" />
                            </span>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={e => setFormData({ ...formData, email: e.target.value })}
                              placeholder="e.g. ramesh@company.com"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Company / Brand */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Company Name</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                              <Building className="h-4 w-4" />
                            </span>
                            <input
                              type="text"
                              value={formData.company}
                              onChange={e => setFormData({ ...formData, company: e.target.value })}
                              placeholder="e.g. Acme Corp"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                            />
                          </div>
                        </div>

                        {/* Telephone */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Phone Number</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                              <Phone className="h-4 w-4" />
                            </span>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={e => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="e.g. +91 98765 00000"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Service Required */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Service Requested</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                              <Briefcase className="h-4 w-4" />
                            </span>
                            <select
                              value={formData.service}
                              onChange={e => setFormData({ ...formData, service: e.target.value })}
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 appearance-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                            >
                              <option>Full Stack Web Development</option>
                              <option>Mobile App Development</option>
                              <option>UI/UX Design</option>
                              <option>SEO & Marketing</option>
                            </select>
                          </div>
                        </div>

                        {/* Implementation Timeline */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Desired Timeline</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                              <CalendarRange className="h-4 w-4" />
                            </span>
                            <select
                              value={formData.timeline}
                              onChange={e => setFormData({ ...formData, timeline: e.target.value })}
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 appearance-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                            >
                              <option>Immediate</option>
                              <option>1-3 months</option>
                              <option>3-6 months</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Estimated Budget slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <span>Project Budget Limit</span>
                          <span className="text-indigo-600 font-mono text-sm leading-none font-bold">
                            ${formData.budget.toLocaleString()}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1000}
                          max={50000}
                          step={500}
                          value={formData.budget}
                          onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <div className="flex justify-between text-[11px] font-mono text-slate-400 font-medium px-0.5">
                          <span>$1,000</span>
                          <span>$10,000</span>
                          <span>$25,000</span>
                          <span>$50,000+</span>
                        </div>
                      </div>

                      {/* Message details */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Brief Message / Requirements</label>
                        <textarea
                          rows={3}
                          value={formData.message}
                          onChange={e => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Tell us about the scope, features, and target audience for your product/service..."
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl shadow-md font-semibold transition flex items-center justify-center gap-2 text-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Sending inquiry details...
                          </>
                        ) : (
                          <>
                            <span>Submit Inbound Request</span>
                            <Send className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* public Footer */}
              <footer className="bg-slate-50 border-t border-slate-200/60 py-6 text-center select-none">
                <p className="text-xs text-slate-400 font-mono">
                  Future Interns Hub &copy; 2026. Custom CRM Application Showcase.
                </p>
              </footer>
            </motion.div>
          ) : (
            /* ========================================================================= */
            /* 2. ADMIN CRM PANEL                                                         */
            /* ========================================================================= */
            <motion.div
              key="admin-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {!authToken ? (
                /* ==================== Login Modal View ==================== */
                <div className="flex-1 max-w-md mx-auto py-16 px-4 w-full flex flex-col justify-center">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 items-center justify-center">
                        <Lock className="h-6 w-6" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-950">Admin Authenticator</h2>
                      <p className="text-sm text-slate-500">Access lead repositories and follow-up activities pipeline.</p>
                    </div>

                    <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Credentials Checklist
                      </span>
                      <p className="text-xs text-amber-700 leading-relaxed font-medium">
                        Username: <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200 font-bold select-all">admin</code> &bull; Password: <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200 font-bold select-all">adminpassword</code>
                      </p>
                    </div>

                    {loginError && (
                      <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      {/* Username */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Username</label>
                        <input
                          type="text"
                          required
                          value={credentials.username}
                          onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Passcode</label>
                        <input
                          type="password"
                          required
                          value={credentials.password}
                          onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                          placeholder="••••••••••••••"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl shadow-lg font-semibold transition text-sm flex items-center justify-center gap-2"
                      >
                        {isLoggingIn ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Establishing Secure Session...
                          </>
                        ) : (
                          <>
                            <span>Authenticate Access</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                </div>
              ) : (
                /* ==================== Logged In CRM Dashboard ==================== */
                <div className="flex-1 flex flex-col">
                  {/* Dashboard Header Bar */}
                  <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap gap-y-3 justify-between items-center shadow-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">Prospect Pipeline Hub</h2>
                        <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Control Center
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Track and follow-up incoming inquiries from your landing website forms.</p>
                    </div>

                    {/* Developer Demo Sandbox Tools */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleAddMockLead}
                        className="px-3.5 py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        title="Simulate a new potential lead submitting the public form instantly."
                      >
                        <Plus className="h-4 w-4" />
                        Inject Mock Lead
                      </button>

                      <button
                        onClick={handleResetBaseline}
                        className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                        title="Delete modifications and restore original baseline leads for a clean slate."
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reset Baseline
                      </button>

                      <div className="h-6 w-px bg-slate-200 mx-1" />

                      <button
                        onClick={handleLogout}
                        className="px-3.5 py-1.5 border border-transparent bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>

                  {/* Operational Metrics Cards Row */}
                  <div className="max-w-7xl mx-auto px-6 py-6 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat CARD 1 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Leads Inbound</span>
                        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><ClipboardList className="h-4.5 w-4.5" /></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-900">{totalLeads}</span>
                        <span className="text-xs font-mono text-indigo-600 font-semibold">Active Prospects</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${totalLeads > 0 ? 100 : 0}%` }} />
                      </div>
                    </div>

                    {/* Stat CARD 2 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Pipeline Value</span>
                        <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="h-4.5 w-4.5" /></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-900">${pipelineValue.toLocaleString()}</span>
                        <span className="text-xs font-mono text-emerald-600 font-semibold">In Scope</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden text-[0px]">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (pipelineValue / 100000) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Stat CARD 3 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lead Conversion Rate</span>
                        <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><TrendingUp className="h-4.5 w-4.5" /></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-900">{conversionRate}%</span>
                        <span className="text-xs font-mono text-amber-700 font-semibold">Win Rate</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${conversionRate}%` }} />
                      </div>
                    </div>

                    {/* Stat CARD 4 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Action Item</span>
                        <span className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg"><Clock className="h-4.5 w-4.5" /></span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-900">{newLeadsCount}</span>
                        <span className="text-xs font-mono text-cyan-600 font-semibold">New Uncontacted</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-cyan-500 rounded-full" 
                          style={{ width: `${totalLeads > 0 ? (newLeadsCount / totalLeads) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Main Work Area: Pipeline filter toolbar + Board/Registry view */}
                  <div className="max-w-7xl mx-auto px-6 pb-12 w-full flex-1 flex flex-col lg:flex-row gap-6">
                    {/* Left Column: List/Kanban Pipeline controls */}
                    <div className="flex-1 space-y-4">
                      {/* Toolbar controls */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
                        {/* Search & filters */}
                        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                          {/* Search bar */}
                          <div className="relative flex-1 max-w-sm">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                              <Search className="h-4 w-4" />
                            </span>
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              placeholder="Search prospects title/email/company..."
                              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                            />
                            {searchQuery && (
                              <button
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Filter by Status (Mainly useful for list view, but updates both) */}
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Status</span>
                            <select
                              value={filterStatus}
                              onChange={e => setFilterStatus(e.target.value)}
                              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                            >
                              <option value="all">All Statuses</option>
                              <option value="new">New Inbound</option>
                              <option value="contacted">Contacted</option>
                              <option value="converted">Converted (Won)</option>
                              <option value="lost">Lost</option>
                            </select>
                          </div>

                          {/* Filter by Service */}
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Service</span>
                            <select
                              value={filterService}
                              onChange={e => setFilterService(e.target.value)}
                              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1 max-w-[150px]"
                            >
                              <option value="all">All Services</option>
                              <option>Full Stack Web Development</option>
                              <option>Mobile App Development</option>
                              <option>UI/UX Design</option>
                              <option>SEO & Marketing</option>
                            </select>
                          </div>

                          {/* Sorting */}
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sort</span>
                            <select
                              value={sortBy}
                              onChange={e => setSortBy(e.target.value as any)}
                              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                            >
                              <option value="date">Newest First</option>
                              <option value="budget-desc">Budget (High → Low)</option>
                              <option value="budget-asc">Budget (Low → High)</option>
                            </select>
                          </div>
                        </div>

                        {/* View Swapper (Kanban Board vsRegistry List) */}
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                          <button
                            onClick={() => setDashboardTab("kanban")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                              dashboardTab === "kanban"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-400 hover:text-slate-700"
                            }`}
                          >
                            <Grid className="h-3.5 w-3.5" />
                            Kanban Board
                          </button>
                          <button
                            onClick={() => setDashboardTab("registry")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                              dashboardTab === "registry"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-400 hover:text-slate-700"
                            }`}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Dense Registry({filteredAndSortedLeads.length})
                          </button>
                        </div>
                      </div>

                      {crmError && (
                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-rose-500" />
                            <span>{crmError}</span>
                          </div>
                          <button onClick={fetchLeads} className="text-rose-900 font-extrabold hover:underline">
                            Retry
                          </button>
                        </div>
                      )}

                      {/* Display Data block */}
                      {isLoadingLeads ? (
                        <div className="bg-white/80 p-20 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
                          <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
                          <p className="text-sm font-semibold text-slate-500">Querying transaction log records...</p>
                        </div>
                      ) : filteredAndSortedLeads.length === 0 ? (
                        <div className="p-16 text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                          <span className="inline-flex h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 items-center justify-center text-slate-400">
                            <SlidersHorizontal className="h-6 w-6" />
                          </span>
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-slate-900">No prospect leads matched filters</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                              Try adjusting your keywords, switching the custom Service dropdown value, or click "Inject Mock Lead" above to create random inputs.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setFilterStatus("all");
                              setFilterService("all");
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/80 transition"
                          >
                            Clear active filters
                          </button>
                        </div>
                      ) : dashboardTab === "kanban" ? (
                        /* ==================== KANBAN BOARD VIEW ==================== */
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start select-none">
                          
                          {/* COLUMN 1: NEW */}
                          <div className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200 space-y-3">
                            <div className="flex justify-between items-center px-1.5">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                New Inbound
                              </span>
                              <span className="bg-slate-200 text-slate-600 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                                {filteredAndSortedLeads.filter(l => l.status === "new").length}
                              </span>
                            </div>
                            
                            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
                              {filteredAndSortedLeads
                                .filter(l => l.status === "new")
                                .map(lead => (
                                  <KanbanCard 
                                    key={lead.id} 
                                    lead={lead} 
                                    onSelect={setSelectedLead} 
                                    isActive={selectedLead?.id === lead.id}
                                    onAdvance={() => updateLeadStatus(lead.id, "contacted")}
                                    advanceLabel="Contact"
                                  />
                                ))}
                            </div>
                          </div>

                          {/* COLUMN 2: CONTACTED */}
                          <div className="bg-amber-50/40 rounded-2xl p-3 border border-slate-200 space-y-3">
                            <div className="flex justify-between items-center px-1.5">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-600">
                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                Contacted
                              </span>
                              <span className="bg-amber-100/60 text-amber-700 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                                {filteredAndSortedLeads.filter(l => l.status === "contacted").length}
                              </span>
                            </div>

                            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
                              {filteredAndSortedLeads
                                .filter(l => l.status === "contacted")
                                .map(lead => (
                                  <KanbanCard 
                                    key={lead.id} 
                                    lead={lead} 
                                    onSelect={setSelectedLead} 
                                    isActive={selectedLead?.id === lead.id}
                                    onAdvance={() => updateLeadStatus(lead.id, "converted")}
                                    advanceLabel="Convert!"
                                    onRegress={() => updateLeadStatus(lead.id, "lost")}
                                    regressLabel="Lost"
                                  />
                                ))}
                            </div>
                          </div>

                          {/* COLUMN 3: CONVERTED */}
                          <div className="bg-emerald-50/40 rounded-2xl p-3 border border-slate-200 space-y-3">
                            <div className="flex justify-between items-center px-1.5">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Converted
                              </span>
                              <span className="bg-emerald-100/60 text-emerald-700 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                                {filteredAndSortedLeads.filter(l => l.status === "converted").length}
                              </span>
                            </div>

                            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
                              {filteredAndSortedLeads
                                .filter(l => l.status === "converted")
                                .map(lead => (
                                  <KanbanCard 
                                    key={lead.id} 
                                    lead={lead} 
                                    onSelect={setSelectedLead} 
                                    isActive={selectedLead?.id === lead.id}
                                    onRegress={() => updateLeadStatus(lead.id, "contacted")}
                                    regressLabel="Rollback"
                                  />
                                ))}
                            </div>
                          </div>

                          {/* COLUMN 4: LOST */}
                          <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 space-y-3">
                            <div className="flex justify-between items-center px-1.5">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-slate-400" />
                                Closed / Lost
                              </span>
                              <span className="bg-slate-200 text-slate-600 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                                {filteredAndSortedLeads.filter(l => l.status === "lost").length}
                              </span>
                            </div>

                            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
                              {filteredAndSortedLeads
                                .filter(l => l.status === "lost")
                                .map(lead => (
                                  <KanbanCard 
                                    key={lead.id} 
                                    lead={lead} 
                                    onSelect={setSelectedLead} 
                                    isActive={selectedLead?.id === lead.id}
                                    onAdvance={() => updateLeadStatus(lead.id, "contacted")}
                                    advanceLabel="Reopen"
                                  />
                                ))}
                            </div>
                          </div>

                        </div>
                      ) : (
                        /* ==================== REGISTRY GRID LIST TABLE ==================== */
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-extrabold select-none">
                                  <th className="py-3 px-4">Prospect Client</th>
                                  <th className="py-3 px-4">Contact Info</th>
                                  <th className="py-3 px-4">Requested Service</th>
                                  <th className="py-3 px-4">Budget</th>
                                  <th className="py-3 px-4">Submit Date</th>
                                  <th className="py-3 px-4">Workflow Progress</th>
                                  <th className="py-3 px-4 text-right">Operation</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredAndSortedLeads.map(lead => (
                                  <tr 
                                    key={lead.id}
                                    onClick={() => setSelectedLead(lead)}
                                    className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${
                                      selectedLead?.id === lead.id ? "bg-indigo-50/40" : ""
                                    }`}
                                  >
                                    {/* Name / Company */}
                                    <td className="py-3 px-4">
                                      <div className="font-semibold text-slate-900">{lead.name}</div>
                                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{lead.company}</div>
                                    </td>
                                    {/* Email / Phone */}
                                    <td className="py-3 px-4">
                                      <div className="font-mono text-slate-600">{lead.email}</div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">{lead.phone || "No phone logged"}</div>
                                    </td>
                                    {/* service */}
                                    <td className="py-3 px-4">
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px]">
                                        {lead.service}
                                      </span>
                                    </td>
                                    {/* Budget */}
                                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                      ${lead.budget.toLocaleString()}
                                    </td>
                                    {/* Submit Date */}
                                    <td className="py-3 px-4 font-mono text-slate-500">
                                      {new Date(lead.createdAt).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}
                                    </td>
                                    {/* status badge */}
                                    <td className="py-3 px-4">
                                      <StatusBadge status={lead.status} />
                                    </td>
                                    {/* CTA View item */}
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedLead(lead);
                                        }}
                                        className="inline-flex items-center justify-center p-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg bg-white transition shadow-2xs"
                                      >
                                        <ChevronRight className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-between select-none items-center text-[11px] text-slate-500 font-mono">
                            <span>Displaying {filteredAndSortedLeads.length} leads</span>
                            <span>Secure Storage Database API Status: Verified</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column / Panel: Lead details panel (flyout simulation in grid pane) */}
                    <div className="w-full lg:w-[380px] shrink-0">
                      {selectedLead ? (
                        /* ==================== ACTIVE PROSPECT DETAIL VIEW ==================== */
                        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-md p-5 space-y-6 sticky top-6">
                          
                          {/* detail header */}
                          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-mono bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                                Lead Detail Info
                              </span>
                              <h3 className="text-lg font-extrabold text-slate-950 tracking-tight leading-tight">
                                {selectedLead.name}
                              </h3>
                              <p className="text-xs text-indigo-600 font-mono">{selectedLead.company}</p>
                            </div>

                            <button
                              onClick={() => setSelectedLead(null)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-50 hover:bg-slate-100"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Contact core details matrix */}
                          <div className="grid grid-cols-1 gap-3.5 text-xs text-slate-600">
                            
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono text-slate-800 break-all select-all">{selectedLead.email}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono text-slate-800 select-all">{selectedLead.phone || "No phone logged"}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>Requested: <strong>{selectedLead.service}</strong></span>
                            </div>

                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>Stipulated Budget: <strong className="font-mono text-indigo-700">${selectedLead.budget.toLocaleString()}</strong></span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>Project Timeline: <strong>{selectedLead.timeline}</strong></span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Zap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>Inbound Source: <strong>{selectedLead.source}</strong></span>
                            </div>
                          </div>

                          {/* Customer message requirements */}
                          <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Prospect Requirements Message</h4>
                            <p className="text-xs text-slate-700 leading-relaxed italic pr-1">
                              "{selectedLead.message || "No custom message requirements attached."}"
                            </p>
                          </div>

                          {/* status Progression controls */}
                          <div className="space-y-2 border-t border-b border-slate-100 py-4">
                            <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Pipeline Progression Node</h4>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => updateLeadStatus(selectedLead.id, "new")}
                                className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                                  selectedLead.status === "new"
                                    ? "bg-blue-50 border-blue-200 text-blue-700 font-extrabold"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                New Inbound
                              </button>
                              <button 
                                onClick={() => updateLeadStatus(selectedLead.id, "contacted")}
                                className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                                  selectedLead.status === "contacted"
                                    ? "bg-amber-50 border-amber-200 text-amber-700 font-extrabold"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                Contact / Nurture
                              </button>
                              <button 
                                onClick={() => updateLeadStatus(selectedLead.id, "converted")}
                                className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                                  selectedLead.status === "converted"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-extrabold"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                Converted (Won)
                              </button>
                              <button 
                                onClick={() => updateLeadStatus(selectedLead.id, "lost")}
                                className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                                  selectedLead.status === "lost"
                                    ? "bg-rose-50 border-rose-200 text-rose-700 font-extrabold"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                Closed / Lost
                              </button>
                            </div>
                          </div>

                          {/* Notes/Activities Timeline logging */}
                          <div className="space-y-3.5">
                            <div className="flex justify-between items-center select-none">
                              <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Call Logs & Follow-up Timeline</h4>
                              <span className="text-[10px] font-mono text-slate-400 font-medium">({selectedLead.notes.length} history nodes)</span>
                            </div>

                            {/* Scrollable list of notes */}
                            <div className="space-y-2 max-h-[22vh] overflow-y-auto pr-1">
                              {selectedLead.notes.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center italic py-2">No follow-up notes registered for this prospect lead.</p>
                              ) : (
                                selectedLead.notes.map((note) => (
                                  <div key={note.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
                                    <div className="flex justify-between items-center text-[9px] font-mono font-medium text-slate-400">
                                      <span>By: {note.author}</span>
                                      <span>
                                        {new Date(note.createdAt).toLocaleDateString(undefined, {
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit"
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-normal">{note.text}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Composition box */}
                            <form onSubmit={handleAddNote} className="pt-2 flex gap-1.5">
                              <input
                                type="text"
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="Add follow-up call notes, next actions..."
                                className="flex-1 px-3 py-1.5 border border-slate-200 text-xs rounded-lg placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                                disabled={isAddingNote}
                              />
                              <button
                                type="submit"
                                disabled={isAddingNote || !noteText.trim()}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition flex items-center justify-center shrink-0"
                              >
                                {isAddingNote ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Log Note"
                                )}
                              </button>
                            </form>
                          </div>

                          {/* Delete operation */}
                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">UUID: {selectedLead.id.slice(0, 10)}...</span>
                            <button
                              onClick={() => handleDeleteLead(selectedLead.id)}
                              className="text-xs hover:bg-rose-50 border border-slate-100 hover:border-rose-100 hover:text-rose-600 text-slate-400 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 font-semibold"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Dismiss Lead
                            </button>
                          </div>

                        </div>
                      ) : (
                        /* ==================== NO LEAD SELECTED PLACEHOLDER ==================== */
                        <div className="bg-white/70 border border-slate-200 rounded-2xl p-8 py-14 text-center space-y-4 select-none sticky top-6">
                          <span className="inline-flex h-14 w-14 rounded-full bg-slate-50 border border-slate-200 text-slate-400 items-center justify-center shadow-xs mx-auto">
                            <Layers className="h-6 w-6" />
                          </span>
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-slate-900 leading-snug">Prospect Focus Pane</h4>
                            <p className="text-xs text-slate-500 max-w-[220px] mx-auto">
                              Select a prospect lead from the board or registry list to view requirements, manage statuses, and log detailed follow-up notes.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ========================================================================= */
/* SUB-COMPONENTS                                                            */
/* ========================================================================= */

// Status helper badge Component
function StatusBadge({ status }: { status: LeadStatus }) {
  switch (status) {
    case "new":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold text-[10px] rounded-full border border-blue-100">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          NEW
        </span>
      );
    case "contacted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 font-extrabold text-[10px] rounded-full border border-amber-100">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          NURTURING
        </span>
      );
    case "converted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] rounded-full border border-emerald-100">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          CONVERTED
        </span>
      );
    case "lost":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 text-slate-500 font-extrabold text-[10px] rounded-full border border-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          LOST
        </span>
      );
    default:
      return null;
  }
}

// Kanban Lead Card component
interface KanbanCardProps {
  key?: string | number;
  lead: Lead;
  onSelect: (lead: Lead) => void;
  isActive: boolean;
  onAdvance?: () => void | Promise<void>;
  advanceLabel?: string;
  onRegress?: () => void | Promise<void>;
  regressLabel?: string;
}

function KanbanCard({ 
  lead, 
  onSelect, 
  isActive, 
  onAdvance, 
  advanceLabel, 
  onRegress, 
  regressLabel 
}: KanbanCardProps) {
  return (
    <div
      onClick={() => onSelect(lead)}
      className={`p-3.5 bg-white border rounded-xl shadow-2xs hover:shadow-xs transition-all duration-200 text-left cursor-pointer flex flex-col gap-3 relative ${
        isActive 
          ? "border-indigo-600 ring-2 ring-indigo-500/10" 
          : "border-slate-200/90 hover:border-slate-300"
      }`}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between">
          <h5 className="font-bold text-[13px] text-slate-900 tracking-tight leading-tight select-none">
            {lead.name}
          </h5>
          <span className="text-[10px] font-mono text-slate-400 font-semibold align-top shrink-0 select-none">
            ${lead.budget.toLocaleString()}
          </span>
        </div>
        <p className="text-[11px] font-mono text-indigo-600 font-semibold leading-none select-all">{lead.company}</p>
      </div>

      <div className="space-y-1.5 pb-1">
        <span className="inline-block px-1.5 py-0.5 bg-slate-50 text-slate-500 font-medium text-[9px] rounded-md border border-slate-100 select-none max-w-full truncate">
          {lead.service}
        </span>
        <p className="text-[11px] text-slate-500 select-none line-clamp-2 leading-relaxed">
          {lead.message || "No project description logged."}
        </p>
      </div>

      {/* Card action node bottom */}
      <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1 select-none">
          <Clock className="h-3 w-3" />
          {new Date(lead.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
        
        {/* Row actions */}
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {onRegress && (
            <button
              onClick={onRegress}
              className="px-2 py-0.5 border border-slate-100 hover:bg-slate-50 text-[9px] font-semibold text-slate-500 rounded transition"
            >
              {regressLabel}
            </button>
          )}
          {onAdvance && (
            <button
              onClick={onAdvance}
              className="px-2 py-0.5 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-[9px] font-bold text-indigo-700 rounded transition"
            >
              {advanceLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
