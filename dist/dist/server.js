var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/index.ts
var import_express = __toESM(require("express"));
var import_next = __toESM(require("next"));

// server/replitAuth.ts
var client = __toESM(require("openid-client"));
var import_passport = require("openid-client/passport");
var import_passport2 = __toESM(require("passport"));
var import_express_session = __toESM(require("express-session"));
var import_memoizee = __toESM(require("memoizee"));
var import_connect_pg_simple = __toESM(require("connect-pg-simple"));

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  elementProjectHistory: () => elementProjectHistory,
  elementSpeckleMappings: () => elementSpeckleMappings,
  elements: () => elements,
  inspections: () => inspections,
  projects: () => projects,
  sessions: () => sessions,
  users: () => users
});
var import_drizzle_orm = require("drizzle-orm");
var import_pg_core = require("drizzle-orm/pg-core");
var sessions = (0, import_pg_core.pgTable)(
  "sessions",
  {
    sid: (0, import_pg_core.varchar)("sid").primaryKey(),
    sess: (0, import_pg_core.jsonb)("sess").notNull(),
    expire: (0, import_pg_core.timestamp)("expire").notNull()
  },
  (table) => [(0, import_pg_core.index)("IDX_session_expire").on(table.expire)]
);
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  email: (0, import_pg_core.varchar)("email").unique(),
  firstName: (0, import_pg_core.varchar)("first_name"),
  lastName: (0, import_pg_core.varchar)("last_name"),
  profileImageUrl: (0, import_pg_core.varchar)("profile_image_url"),
  displayName: (0, import_pg_core.varchar)("display_name"),
  company: (0, import_pg_core.varchar)("company"),
  title: (0, import_pg_core.varchar)("title"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var projects = (0, import_pg_core.pgTable)(
  "projects",
  {
    id: (0, import_pg_core.varchar)("id").primaryKey(),
    name: (0, import_pg_core.varchar)("name", { length: 255 }).notNull(),
    status: (0, import_pg_core.varchar)("status", { length: 50 }).notNull(),
    speckleUrl: (0, import_pg_core.text)("speckle_url"),
    createdAt: (0, import_pg_core.timestamp)("created_at").notNull(),
    lastModified: (0, import_pg_core.timestamp)("last_modified").notNull()
  },
  (table) => [
    (0, import_pg_core.index)("idx_projects_status").on(table.status),
    (0, import_pg_core.index)("idx_projects_last_modified").on(table.lastModified)
  ]
);
var inspections = (0, import_pg_core.pgTable)(
  "inspections",
  {
    id: (0, import_pg_core.varchar)("id").primaryKey(),
    elementId: (0, import_pg_core.varchar)("element_id", { length: 255 }).notNull(),
    projectId: (0, import_pg_core.varchar)("project_id", { length: 255 }).notNull(),
    inspector: (0, import_pg_core.varchar)("inspector", { length: 255 }).notNull(),
    status: (0, import_pg_core.varchar)("status", { length: 20 }).notNull(),
    notes: (0, import_pg_core.text)("notes"),
    date: (0, import_pg_core.varchar)("date", { length: 50 }).notNull(),
    lastModifiedBy: (0, import_pg_core.varchar)("last_modified_by", { length: 255 }).notNull(),
    timestamp: (0, import_pg_core.timestamp)("timestamp").notNull(),
    version: (0, import_pg_core.integer)("version").notNull().default(1),
    // User tracking
    createdByUserId: (0, import_pg_core.varchar)("created_by_user_id", { length: 255 }),
    lastModifiedByUserId: (0, import_pg_core.varchar)("last_modified_by_user_id", { length: 255 }),
    // Material reuse tracking
    globalElementId: (0, import_pg_core.varchar)("global_element_id", { length: 255 }),
    inspectionType: (0, import_pg_core.varchar)("inspection_type", { length: 50 }),
    // TW Package Info
    designPackageNumber: (0, import_pg_core.text)("design_package_number"),
    designPackageDescription: (0, import_pg_core.text)("design_package_description"),
    riskCategories: (0, import_pg_core.text)("risk_categories"),
    // Planning & Scheduling
    plannedErectionDate: (0, import_pg_core.varchar)("planned_erection_date", { length: 50 }),
    plannedDismantleDate: (0, import_pg_core.varchar)("planned_dismantle_date", { length: 50 }),
    actualErectionDate: (0, import_pg_core.varchar)("actual_erection_date", { length: 50 }),
    actualDismantleDate: (0, import_pg_core.varchar)("actual_dismantle_date", { length: 50 }),
    // Location & Environment
    plannedLocation: (0, import_pg_core.text)("planned_location"),
    actualLocation: (0, import_pg_core.text)("actual_location"),
    environmentalConditions: (0, import_pg_core.text)("environmental_conditions"),
    // Technical Requirements
    loadingCriteria: (0, import_pg_core.text)("loading_criteria"),
    surveyData: (0, import_pg_core.text)("survey_data"),
    materialRequirements: (0, import_pg_core.text)("material_requirements"),
    installationMethodStatement: (0, import_pg_core.text)("installation_method_statement"),
    removalMethodStatement: (0, import_pg_core.text)("removal_method_statement"),
    // Commercial
    estimatedQuantities: (0, import_pg_core.text)("estimated_quantities"),
    estimatedCostDesign: (0, import_pg_core.text)("estimated_cost_design"),
    estimatedCostConstruction: (0, import_pg_core.text)("estimated_cost_construction"),
    procurementReference: (0, import_pg_core.text)("procurement_reference"),
    budgetComparison: (0, import_pg_core.text)("budget_comparison"),
    materialCostCodes: (0, import_pg_core.text)("material_cost_codes"),
    // Quality & Compliance
    twcCheckingRemarks: (0, import_pg_core.text)("twc_checking_remarks"),
    iceCheckingRemarks: (0, import_pg_core.text)("ice_checking_remarks"),
    materialCertificates: (0, import_pg_core.text)("material_certificates"),
    labTestResults: (0, import_pg_core.text)("lab_test_results"),
    usageHistory: (0, import_pg_core.text)("usage_history"),
    overstressingRecord: (0, import_pg_core.text)("overstressing_record"),
    // Stakeholders
    responsibleSitePerson: (0, import_pg_core.text)("responsible_site_person"),
    temporaryWorksCoordinator: (0, import_pg_core.text)("temporary_works_coordinator"),
    temporaryWorksDesigner: (0, import_pg_core.text)("temporary_works_designer"),
    independentCheckingEngineer: (0, import_pg_core.text)("independent_checking_engineer"),
    // Documentation
    designDocumentationRef: (0, import_pg_core.text)("design_documentation_ref"),
    approvalDate: (0, import_pg_core.varchar)("approval_date", { length: 50 }),
    constructionCompletionDate: (0, import_pg_core.varchar)("construction_completion_date", { length: 50 }),
    permitToLoadDate: (0, import_pg_core.varchar)("permit_to_load_date", { length: 50 }),
    permitToRemoveDate: (0, import_pg_core.varchar)("permit_to_remove_date", { length: 50 })
  },
  (table) => [
    (0, import_pg_core.index)("idx_inspections_project_id").on(table.projectId),
    (0, import_pg_core.index)("idx_inspections_element_id").on(table.elementId),
    (0, import_pg_core.index)("idx_inspections_status").on(table.status),
    (0, import_pg_core.index)("idx_inspections_date").on(table.date),
    (0, import_pg_core.index)("idx_inspections_timestamp").on(table.timestamp),
    (0, import_pg_core.index)("idx_inspections_element_project").on(table.elementId, table.projectId)
  ]
);
var elements = (0, import_pg_core.pgTable)(
  "elements",
  {
    id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
    assetNumber: (0, import_pg_core.varchar)("asset_number", { length: 100 }).notNull().unique(),
    ifcType: (0, import_pg_core.varchar)("ifc_type", { length: 100 }).notNull(),
    assetType: (0, import_pg_core.varchar)("asset_type", { length: 100 }),
    category: (0, import_pg_core.varchar)("category", { length: 100 }),
    description: (0, import_pg_core.text)("description"),
    manufacturer: (0, import_pg_core.varchar)("manufacturer", { length: 255 }),
    serialNumber: (0, import_pg_core.varchar)("serial_number", { length: 255 }),
    qrCode: (0, import_pg_core.varchar)("qr_code", { length: 255 }).unique(),
    rfidTag: (0, import_pg_core.varchar)("rfid_tag", { length: 255 }),
    specifications: (0, import_pg_core.jsonb)("specifications"),
    purchaseDate: (0, import_pg_core.date)("purchase_date"),
    purchaseValue: (0, import_pg_core.decimal)("purchase_value", { precision: 12, scale: 2 }),
    currentCondition: (0, import_pg_core.varchar)("current_condition", { length: 50 }),
    currentProjectId: (0, import_pg_core.varchar)("current_project_id", { length: 255 }),
    status: (0, import_pg_core.varchar)("status", { length: 50 }).notNull(),
    remarks: (0, import_pg_core.text)("remarks"),
    createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
    createdByUserId: (0, import_pg_core.varchar)("created_by_user_id", { length: 255 }),
    updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
  },
  (table) => [
    (0, import_pg_core.index)("idx_elements_asset_number").on(table.assetNumber),
    (0, import_pg_core.index)("idx_elements_qr_code").on(table.qrCode),
    (0, import_pg_core.index)("idx_elements_current_project").on(table.currentProjectId),
    (0, import_pg_core.index)("idx_elements_status").on(table.status),
    (0, import_pg_core.index)("idx_elements_ifc_type").on(table.ifcType)
  ]
);
var elementProjectHistory = (0, import_pg_core.pgTable)(
  "element_project_history",
  {
    id: (0, import_pg_core.serial)("id").primaryKey(),
    elementId: (0, import_pg_core.varchar)("element_id", { length: 255 }).notNull(),
    projectId: (0, import_pg_core.varchar)("project_id", { length: 255 }).notNull(),
    transferredFromProjectId: (0, import_pg_core.varchar)("transferred_from_project_id", { length: 255 }),
    transferDate: (0, import_pg_core.timestamp)("transfer_date"),
    transferredByUserId: (0, import_pg_core.varchar)("transferred_by_user_id", { length: 255 }),
    status: (0, import_pg_core.varchar)("status", { length: 50 }).notNull(),
    activatedDate: (0, import_pg_core.timestamp)("activated_date"),
    deactivatedDate: (0, import_pg_core.timestamp)("deactivated_date"),
    receivedCondition: (0, import_pg_core.varchar)("received_condition", { length: 50 }),
    transferredCondition: (0, import_pg_core.varchar)("transferred_condition", { length: 50 }),
    conditionNotes: (0, import_pg_core.text)("condition_notes"),
    plannedLocation: (0, import_pg_core.text)("planned_location"),
    actualLocation: (0, import_pg_core.text)("actual_location"),
    receiptInspectionId: (0, import_pg_core.varchar)("receipt_inspection_id", { length: 255 }),
    transferInspectionId: (0, import_pg_core.varchar)("transfer_inspection_id", { length: 255 }),
    // Transfer approval workflow
    transferRequestedByUserId: (0, import_pg_core.varchar)("transfer_requested_by_user_id", { length: 255 }),
    transferRequestDate: (0, import_pg_core.timestamp)("transfer_request_date"),
    sourceProjectManagerApproval: (0, import_pg_core.boolean)("source_project_manager_approval"),
    sourceProjectManagerApprovedByUserId: (0, import_pg_core.varchar)("source_pm_approved_by_user_id", { length: 255 }),
    sourceProjectManagerApprovalDate: (0, import_pg_core.timestamp)("source_pm_approval_date"),
    destinationProjectManagerApproval: (0, import_pg_core.boolean)("dest_project_manager_approval"),
    destinationProjectManagerApprovedByUserId: (0, import_pg_core.varchar)("dest_pm_approved_by_user_id", { length: 255 }),
    destinationProjectManagerApprovalDate: (0, import_pg_core.timestamp)("dest_pm_approval_date"),
    createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
  },
  (table) => [
    (0, import_pg_core.index)("idx_eph_element_id").on(table.elementId),
    (0, import_pg_core.index)("idx_eph_project_id").on(table.projectId),
    (0, import_pg_core.index)("idx_eph_element_project").on(table.elementId, table.projectId),
    (0, import_pg_core.index)("idx_eph_status").on(table.status)
  ]
);
var elementSpeckleMappings = (0, import_pg_core.pgTable)(
  "element_speckle_mappings",
  {
    id: (0, import_pg_core.serial)("id").primaryKey(),
    elementId: (0, import_pg_core.varchar)("element_id", { length: 255 }).notNull(),
    projectId: (0, import_pg_core.varchar)("project_id", { length: 255 }).notNull(),
    speckleElementId: (0, import_pg_core.varchar)("speckle_element_id", { length: 255 }).notNull(),
    speckleObjectUrl: (0, import_pg_core.text)("speckle_object_url"),
    mappedDate: (0, import_pg_core.timestamp)("mapped_date").defaultNow().notNull(),
    mappedByUserId: (0, import_pg_core.varchar)("mapped_by_user_id", { length: 255 }),
    isActive: (0, import_pg_core.boolean)("is_active").default(true).notNull(),
    notes: (0, import_pg_core.text)("notes")
  },
  (table) => [
    (0, import_pg_core.index)("idx_esm_element_id").on(table.elementId),
    (0, import_pg_core.index)("idx_esm_project_id").on(table.projectId),
    (0, import_pg_core.index)("idx_esm_speckle_element_id").on(table.speckleElementId),
    (0, import_pg_core.index)("idx_esm_element_project").on(table.elementId, table.projectId),
    (0, import_pg_core.index)("idx_esm_active").on(table.isActive)
  ]
);

// server/db.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = __toESM(require("pg"));
var { Pool } = import_pg.default;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });

// server/storage.ts
var import_drizzle_orm2 = require("drizzle-orm");
var DatabaseStorage = class {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id) {
    const [user] = await db.select().from(users).where((0, import_drizzle_orm2.eq)(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = (0, import_memoizee.default)(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = (0, import_connect_pg_simple.default)(import_express_session.default);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return (0, import_express_session.default)({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(import_passport2.default.initialize());
  app2.use(import_passport2.default.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new import_passport.Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    import_passport2.default.use(strategy);
  }
  import_passport2.default.serializeUser((user, cb) => cb(null, user));
  import_passport2.default.deserializeUser((user, cb) => cb(null, user));
  const getStrategyName = (hostname) => {
    const domains = process.env.REPLIT_DOMAINS.split(",");
    if (domains.includes(hostname)) {
      return `replitauth:${hostname}`;
    }
    return `replitauth:${domains[0]}`;
  };
  app2.get("/api/login", (req, res, next2) => {
    const strategy = getStrategyName(req.hostname);
    import_passport2.default.authenticate(strategy, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next2);
  });
  app2.get("/api/callback", (req, res, next2) => {
    const strategy = getStrategyName(req.hostname);
    import_passport2.default.authenticate(strategy, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next2);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next2) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    next2();
    return;
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    next2();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// server/index.ts
var dev = process.env.NODE_ENV !== "production";
var app = (0, import_next.default)({ dev });
var handle = app.getRequestHandler();
var PORT = parseInt(process.env.PORT || "3000", 10);
process.on("uncaughtException", (error) => {
  console.error("[UNCAUGHT EXCEPTION]", error);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[UNHANDLED REJECTION]", reason);
});
async function main() {
  const server = (0, import_express.default)();
  server.use(import_express.default.json());
  server.use(import_express.default.urlencoded({ extended: true }));
  server.use((req, res, next2) => {
    const originalQuery = req.query;
    try {
      delete req.query;
      Object.defineProperty(req, "query", {
        value: originalQuery,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } catch (error) {
      console.warn("Could not fix query property:", error);
    }
    next2();
  });
  server.get("/api/health", (req, res) => {
    try {
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
      console.log(`[${timestamp2}] Health check received at /api/health`);
      res.status(200).json({ status: "ok", timestamp: timestamp2 });
      console.log(`[${timestamp2}] Health check responded with 200 OK`);
    } catch (error) {
      console.error("Health check error:", error);
      res.status(200).send("OK");
    }
  });
  let nextReady = false;
  server.get("/", (req, res) => {
    try {
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
      console.log(`[${timestamp2}] Root path request received, Next.js ready: ${nextReady}`);
      if (!nextReady) {
        console.log(`[${timestamp2}] Responding with immediate OK (Next.js still preparing)`);
        res.status(200).send("OK");
        return;
      }
      console.log(`[${timestamp2}] Routing to Next.js handler`);
      handle(req, res);
    } catch (error) {
      console.error("Root path error:", error);
      res.status(200).send("OK");
    }
  });
  const startTime = Date.now();
  server.listen(PORT, "0.0.0.0", () => {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    console.log(`[${timestamp2}] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[${timestamp2}] Health check endpoints ready: /api/health and /`);
  });
  const prepareStart = Date.now();
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Preparing Next.js...`);
  await app.prepare();
  nextReady = true;
  const prepareTime = Date.now() - prepareStart;
  const totalTime = Date.now() - startTime;
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Next.js ready! (prepare: ${prepareTime}ms, total: ${totalTime}ms)`);
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Setting up authentication...`);
  await setupAuth(server);
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Authentication configured`);
  server.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  server.all("/{*splat}", (req, res) => {
    try {
      return handle(req, res);
    } catch (error) {
      console.error("Route handler error:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  server.use((err, req, res, next2) => {
    console.error("Express error handler:", err);
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error");
    }
  });
}
main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
