// Replit Auth integration: Database schema for users and sessions
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// Username/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  displayName: varchar("display_name"),
  company: varchar("company"),
  title: varchar("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Projects table - stores BIM project metadata
export const projects = pgTable(
  "projects",
  {
    id: varchar("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(),
    speckleUrl: text("speckle_url"),
    createdAt: timestamp("created_at").notNull(),
    lastModified: timestamp("last_modified").notNull(),
  },
  (table) => [
    index("idx_projects_status").on(table.status),
    index("idx_projects_last_modified").on(table.lastModified),
  ]
);

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// Inspections table - stores inspection records with full detail
export const inspections = pgTable(
  "inspections",
  {
    id: varchar("id").primaryKey(),
    elementId: varchar("element_id", { length: 255 }).notNull(),
    projectId: varchar("project_id", { length: 255 }).notNull(),
    inspector: varchar("inspector", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    notes: text("notes"),
    date: varchar("date", { length: 50 }).notNull(),
    lastModifiedBy: varchar("last_modified_by", { length: 255 }).notNull(),
    timestamp: timestamp("timestamp").notNull(),
    version: integer("version").notNull().default(1),
    
    // User tracking
    createdByUserId: varchar("created_by_user_id", { length: 255 }),
    lastModifiedByUserId: varchar("last_modified_by_user_id", { length: 255 }),
    
    // Material reuse tracking
    globalElementId: varchar("global_element_id", { length: 255 }),
    inspectionType: varchar("inspection_type", { length: 50 }),
    
    // TW Package Info
    designPackageNumber: text("design_package_number"),
    designPackageDescription: text("design_package_description"),
    riskCategories: text("risk_categories"),
    
    // Planning & Scheduling
    plannedErectionDate: varchar("planned_erection_date", { length: 50 }),
    plannedDismantleDate: varchar("planned_dismantle_date", { length: 50 }),
    actualErectionDate: varchar("actual_erection_date", { length: 50 }),
    actualDismantleDate: varchar("actual_dismantle_date", { length: 50 }),
    
    // Location & Environment
    plannedLocation: text("planned_location"),
    actualLocation: text("actual_location"),
    environmentalConditions: text("environmental_conditions"),
    
    // Technical Requirements
    loadingCriteria: text("loading_criteria"),
    surveyData: text("survey_data"),
    materialRequirements: text("material_requirements"),
    installationMethodStatement: text("installation_method_statement"),
    removalMethodStatement: text("removal_method_statement"),
    
    // Commercial
    estimatedQuantities: text("estimated_quantities"),
    estimatedCostDesign: text("estimated_cost_design"),
    estimatedCostConstruction: text("estimated_cost_construction"),
    procurementReference: text("procurement_reference"),
    budgetComparison: text("budget_comparison"),
    materialCostCodes: text("material_cost_codes"),
    
    // Quality & Compliance
    twcCheckingRemarks: text("twc_checking_remarks"),
    iceCheckingRemarks: text("ice_checking_remarks"),
    materialCertificates: text("material_certificates"),
    labTestResults: text("lab_test_results"),
    usageHistory: text("usage_history"),
    overstressingRecord: text("overstressing_record"),
    
    // Stakeholders
    responsibleSitePerson: text("responsible_site_person"),
    temporaryWorksCoordinator: text("temporary_works_coordinator"),
    temporaryWorksDesigner: text("temporary_works_designer"),
    independentCheckingEngineer: text("independent_checking_engineer"),
    
    // Documentation
    designDocumentationRef: text("design_documentation_ref"),
    approvalDate: varchar("approval_date", { length: 50 }),
    constructionCompletionDate: varchar("construction_completion_date", { length: 50 }),
    permitToLoadDate: varchar("permit_to_load_date", { length: 50 }),
    permitToRemoveDate: varchar("permit_to_remove_date", { length: 50 }),
  },
  (table) => [
    index("idx_inspections_project_id").on(table.projectId),
    index("idx_inspections_element_id").on(table.elementId),
    index("idx_inspections_status").on(table.status),
    index("idx_inspections_date").on(table.date),
    index("idx_inspections_timestamp").on(table.timestamp),
    index("idx_inspections_element_project").on(table.elementId, table.projectId),
  ]
);

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

// Elements table - Global asset registry for tracking physical elements across projects
export const elements = pgTable(
  "elements",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    assetNumber: varchar("asset_number", { length: 100 }).notNull().unique(),
    ifcType: varchar("ifc_type", { length: 100 }).notNull(),
    assetType: varchar("asset_type", { length: 100 }),
    category: varchar("category", { length: 100 }),
    description: text("description"),
    manufacturer: varchar("manufacturer", { length: 255 }),
    serialNumber: varchar("serial_number", { length: 255 }),
    qrCode: varchar("qr_code", { length: 255 }).unique(),
    rfidTag: varchar("rfid_tag", { length: 255 }),
    specifications: jsonb("specifications"),
    purchaseDate: date("purchase_date"),
    purchaseValue: decimal("purchase_value", { precision: 12, scale: 2 }),
    currentCondition: varchar("current_condition", { length: 50 }),
    currentProjectId: varchar("current_project_id", { length: 255 }),
    status: varchar("status", { length: 50 }).notNull(),
    remarks: text("remarks"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdByUserId: varchar("created_by_user_id", { length: 255 }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_elements_asset_number").on(table.assetNumber),
    index("idx_elements_qr_code").on(table.qrCode),
    index("idx_elements_current_project").on(table.currentProjectId),
    index("idx_elements_status").on(table.status),
    index("idx_elements_ifc_type").on(table.ifcType),
  ]
);

export type Element = typeof elements.$inferSelect;
export type InsertElement = typeof elements.$inferInsert;

// Element project history - Tracks lifecycle of elements across projects
export const elementProjectHistory = pgTable(
  "element_project_history",
  {
    id: serial("id").primaryKey(),
    elementId: varchar("element_id", { length: 255 }).notNull(),
    projectId: varchar("project_id", { length: 255 }).notNull(),
    transferredFromProjectId: varchar("transferred_from_project_id", { length: 255 }),
    transferDate: timestamp("transfer_date"),
    transferredByUserId: varchar("transferred_by_user_id", { length: 255 }),
    status: varchar("status", { length: 50 }).notNull(),
    activatedDate: timestamp("activated_date"),
    deactivatedDate: timestamp("deactivated_date"),
    receivedCondition: varchar("received_condition", { length: 50 }),
    transferredCondition: varchar("transferred_condition", { length: 50 }),
    conditionNotes: text("condition_notes"),
    plannedLocation: text("planned_location"),
    actualLocation: text("actual_location"),
    receiptInspectionId: varchar("receipt_inspection_id", { length: 255 }),
    transferInspectionId: varchar("transfer_inspection_id", { length: 255 }),
    
    // Transfer approval workflow
    transferRequestedByUserId: varchar("transfer_requested_by_user_id", { length: 255 }),
    transferRequestDate: timestamp("transfer_request_date"),
    sourceProjectManagerApproval: boolean("source_project_manager_approval"),
    sourceProjectManagerApprovedByUserId: varchar("source_pm_approved_by_user_id", { length: 255 }),
    sourceProjectManagerApprovalDate: timestamp("source_pm_approval_date"),
    destinationProjectManagerApproval: boolean("dest_project_manager_approval"),
    destinationProjectManagerApprovedByUserId: varchar("dest_pm_approved_by_user_id", { length: 255 }),
    destinationProjectManagerApprovalDate: timestamp("dest_pm_approval_date"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_eph_element_id").on(table.elementId),
    index("idx_eph_project_id").on(table.projectId),
    index("idx_eph_element_project").on(table.elementId, table.projectId),
    index("idx_eph_status").on(table.status),
  ]
);

export type ElementProjectHistory = typeof elementProjectHistory.$inferSelect;
export type InsertElementProjectHistory = typeof elementProjectHistory.$inferInsert;

// Element Speckle mappings - Links physical assets to BIM representations
export const elementSpeckleMappings = pgTable(
  "element_speckle_mappings",
  {
    id: serial("id").primaryKey(),
    elementId: varchar("element_id", { length: 255 }).notNull(),
    projectId: varchar("project_id", { length: 255 }).notNull(),
    speckleElementId: varchar("speckle_element_id", { length: 255 }).notNull(),
    speckleObjectUrl: text("speckle_object_url"),
    mappedDate: timestamp("mapped_date").defaultNow().notNull(),
    mappedByUserId: varchar("mapped_by_user_id", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("idx_esm_element_id").on(table.elementId),
    index("idx_esm_project_id").on(table.projectId),
    index("idx_esm_speckle_element_id").on(table.speckleElementId),
    index("idx_esm_element_project").on(table.elementId, table.projectId),
    index("idx_esm_active").on(table.isActive),
  ]
);

export type ElementSpeckleMapping = typeof elementSpeckleMappings.$inferSelect;
export type InsertElementSpeckleMapping = typeof elementSpeckleMappings.$inferInsert;
