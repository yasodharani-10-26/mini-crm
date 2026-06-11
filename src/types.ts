export interface LeadNote {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

export type LeadStatus = "new" | "contacted" | "converted" | "lost";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  budget: number;
  message: string;
  status: LeadStatus;
  createdAt: string;
  notes: LeadNote[];
  source: string;
  timeline: string;
}
