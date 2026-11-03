export type OrgId = string;

export interface Organisation {
  id: OrgId;
  name: string;
  shortName: string;
  city: string;
  country: string;
  coordinates: { lat: number; lng: number };
  type: "Community Newsroom" | "Investigative Desk" | "Broadcast & Audio" | "Regional Wire";
  verified: boolean;
  memberCount: number;
  specialties: string[];
  badgeColor: string;
  description: string;
}

export type ResourceCategory =
  | "Camera & Optics"
  | "Audio & Podcast"
  | "Studio & Edit Bay"
  | "Field Vehicle & Power"
  | "Drone & Environmental Sensor";

export type ResourceStatus = "Available" | "Requested" | "Booked" | "In Maintenance";

export interface Resource {
  id: string;
  title: string;
  category: ResourceCategory;
  ownerOrgId: OrgId;
  city: string;
  coordinates: { lat: number; lng: number };
  status: ResourceStatus;
  condition: "Excellent" | "Good" | "Field-Tested";
  specs: string[];
  dailyTerms: string; // e.g., "Peer Exchange (0 USD / Deposit Waived for Verified Network)"
  collateralRequirement: string;
  availableWindow: string;
}

export type RequestStatus = "Pending Approval" | "Counter-Offer Sent" | "Approved" | "Checked Out" | "Returned";

export interface ResourceRequest {
  id: string;
  resourceId: string;
  requesterOrgId: OrgId;
  ownerOrgId: OrgId;
  investigationId?: string;
  purpose: string;
  requestedDates: string;
  proposedTerms: string;
  status: RequestStatus;
  handoverNote?: string;
  conditionOnCheckout?: string;
  conditionOnReturn?: string;
  createdAt: string;
}

export interface JournalistProfile {
  id: string;
  name: string;
  role: string;
  orgId: OrgId;
  city: string;
  coordinates: { lat: number; lng: number };
  skills: string[];
  beats: string[];
  languages: string[];
  availability: "Available for Collab" | "On Assignment" | "Mentorship Only";
  verifiedInvestigationsCount?: number;
  completedCollabs: number;
  bio: string;
}

export interface CollaborationRequest {
  id: string;
  expertId: string;
  fromOrgId: OrgId;
  toOrgId: OrgId;
  investigationId: string;
  roleRequested: string;
  scopeNote: string;
  status: "Pending" | "Accepted" | "Declined";
  createdAt: string;
}

export type KanbanColumnId =
  | "leads"
  | "verification"
  | "fieldwork"
  | "editorial_review"
  | "syndication_ready";

export interface KanbanTask {
  id: string;
  investigationId: string;
  title: string;
  description: string;
  column: KanbanColumnId;
  assigneeName: string;
  assigneeOrgId: OrgId;
  priority: "High" | "Medium" | "Standard";
  evidenceRef?: string;
  requiresHumanSignoff: boolean;
  signedOffBy?: string;
}

export interface Investigation {
  id: string;
  codeName: string;
  title: string;
  summary: string;
  leadOrgId: OrgId;
  partnerOrgIds: OrgId[];
  visibility: "Private (Encrypted Workspace)" | "Partner Network Only";
  status: "Active Reporting" | "Fact-Checking" | "Ready for Publication";
  createdAt: string;
  embargoUntil: string;
  editorialAgreement: string;
}

export type ClaimClassification =
  | "Documented Evidence"
  | "Unverified Allegation"
  | "Analytical Inference";

export interface DocumentPassage {
  id: string;
  pageNumber: number;
  sectionTitle: string;
  quote: string;
  classification: ClaimClassification;
  entities: string[];
  dates: string[];
}

export interface DocumentRecord {
  id: string;
  investigationId: string;
  title: string;
  sourceOrgId: OrgId;
  allowedOrgIds: OrgId[];
  documentType: "Public Audit Report" | "Procurement Ledger" | "Lab Water Sample" | "Interview Transcript";
  pageCount: number;
  uploadedAt: string;
  aiConsentStatus: "Approved for Cloud & Local AI" | "Local Inference Only (Confidential)";
  summary: string;
  extractedEntities: {
    people: string[];
    organisations: string[];
    locations: string[];
    keyDates: string[];
  };
  passages: DocumentPassage[];
}

export interface AICitation {
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  sectionTitle: string;
  exactQuote: string;
  classification: ClaimClassification;
}

export interface AIQueryResponse {
  id: string;
  query: string;
  modelUsed: string;
  inferenceMode: "Local Ollama (Private)" | "Gemini Server-Side API (Approved Public Doc)";
  answerSummary: string;
  evidenceFindings: string[];
  allegationsToVerify: string[];
  humanVerificationChecklist: string[];
  citations: AICitation[];
  timestamp: string;
}

export interface StoryPackage {
  id: string;
  title: string;
  subtitle: string;
  originOrgId: OrgId;
  coAuthorOrgIds: OrgId[];
  investigationId?: string;
  publishedAt: string;
  embargoLift: string;
  licenseType: "CC BY-NC-ND 4.0 (Network Attribution)" | "Co-Publish Syndicate" | "Request Permission Only";
  attributionRequirement: string;
  mediaIncluded: string[];
  wordCount: number;
  humanVerifiedBy: string;
  excerpt: string;
  republishCount: number;
}

export interface SyndicationRequest {
  id: string;
  storyId: string;
  requestingOrgId: OrgId;
  originOrgId: OrgId;
  status: "Approved" | "Pending";
  plannedPublishDate: string;
  agreedAttribution: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorOrgId: OrgId;
  category: "Resource Booking" | "Investigation ACL" | "AI Query" | "Human Verification" | "Story Syndication";
  action: string;
  resourceTarget: string;
}
