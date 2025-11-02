import { useState } from "react";
import TopBar from "../components/TopBar";
import { useAuth } from "../hooks/useAuth";

export default function DeveloperDocumentation() {
  const { user, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");

  // Enable "Back to 3D View" button in TopBar
  const showBackTo3D = true;

  const sections = [
    { id: "overview", title: "Overview" },
    { id: "architecture", title: "Architecture" },
    { id: "tech-stack", title: "Tech Stack" },
    { id: "getting-started", title: "Getting Started" },
    { id: "code-structure", title: "Code Structure" },
    { id: "database", title: "Database Schema" },
    { id: "api", title: "API Endpoints" },
    { id: "features", title: "Key Features" },
    { id: "ui-components", title: "UI Components" },
    { id: "deployment", title: "Deployment" },
    { id: "best-practices", title: "Best Practices" },
  ];

  return (
    <div className="docs-page">
      <TopBar showBackTo3D={showBackTo3D} />
      
      <div className="docs-container">
        {/* Sidebar Navigation */}
        <nav className="docs-sidebar">
          <h2>Developer Docs</h2>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  className={activeSection === section.id ? "active" : ""}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="docs-content">
          {activeSection === "overview" && (
            <section>
              <h1>TWX Developer Documentation</h1>
              <p className="lead">
                Welcome to the TWX (Digital Temporary Works Inspection) developer documentation. 
                This guide will help you understand the codebase and continue development.
              </p>

              <h2>What is TWX?</h2>
              <p>
                TWX is a web application for managing digital temporary works inspections integrated 
                with BIM (Building Information Modeling) data through Speckle. The core purpose is to 
                track the reuse of temporary works materials (props, scaffolding, formwork, etc.) from 
                one construction project to another.
              </p>

              <h3>Key Capabilities</h3>
              <ul>
                <li>3D visualization of BIM models using Speckle</li>
                <li>Interactive inspection recording directly on 3D elements</li>
                <li>Material lifecycle tracking across multiple construction projects</li>
                <li>QR code-based asset identification and linking</li>
                <li>Dual-approval transfer workflow for element reuse</li>
                <li>Complete inspection history preservation across projects</li>
                <li>User authentication and audit trails</li>
              </ul>

              <h3>Project Goals</h3>
              <ul>
                <li>Enable circular construction practices</li>
                <li>Provide full material lifecycle tracking</li>
                <li>Maintain inspection history as materials move between projects</li>
                <li>Ensure only one project can actively inspect each element at a time</li>
                <li>Support multi-stakeholder workflows with proper approvals</li>
              </ul>
            </section>
          )}

          {activeSection === "architecture" && (
            <section>
              <h1>Architecture</h1>

              <h2>System Overview</h2>
              <p>
                TWX uses a hybrid architecture combining Express.js for backend services with 
                Next.js for frontend rendering and routing.
              </p>

              <div className="architecture-diagram">
                <pre>{`
┌─────────────────────────────────────────────────┐
│              Client Browser                      │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Next.js    │  │   Speckle    │            │
│  │   Frontend   │  │   3D Viewer  │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────┐
│           Express.js Server (port 5000)         │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  Auth        │  │   Next.js    │            │
│  │  Middleware  │  │   Handler    │            │
│  └──────────────┘  └──────────────┘            │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   API        │  │   Session    │            │
│  │   Routes     │  │   Store      │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────┐
│         PostgreSQL Database (Neon)              │
│  • Users & Sessions                              │
│  • Projects & Inspections                        │
│  • Elements & Transfer History                   │
└─────────────────────────────────────────────────┘
                `}</pre>
              </div>

              <h2>Frontend Architecture</h2>
              <ul>
                <li><strong>Framework:</strong> Next.js 15 with React 18</li>
                <li><strong>Rendering:</strong> Hybrid SSR/CSR with dynamic imports for WebGL components</li>
                <li><strong>State Management:</strong> React hooks (useState, useEffect, useRef)</li>
                <li><strong>3D Viewer:</strong> Speckle Viewer (@speckle/viewer) - dynamically imported client-side</li>
                <li><strong>Routing:</strong> File-based routing via Next.js pages directory</li>
              </ul>

              <h2>Backend Architecture</h2>
              <ul>
                <li><strong>Server:</strong> Express.js 5.x with Next.js integration</li>
                <li><strong>Authentication:</strong> Passport.js with OpenID Connect (Replit Auth)</li>
                <li><strong>Database:</strong> PostgreSQL with Drizzle ORM</li>
                <li><strong>Session Storage:</strong> PostgreSQL-backed via connect-pg-simple</li>
                <li><strong>API:</strong> RESTful endpoints with TypeScript type safety</li>
              </ul>

              <h2>Key Design Decisions</h2>
              <h3>Why Express + Next.js Hybrid?</h3>
              <p>
                This approach allows fine-grained control over authentication middleware while 
                leveraging Next.js's excellent rendering capabilities and developer experience.
              </p>

              <h3>Why Drizzle ORM?</h3>
              <p>
                Drizzle provides excellent TypeScript integration and type safety while maintaining 
                SQL-like query syntax. It's lighter than alternatives like Prisma and offers better 
                performance.
              </p>

              <h3>Why Dynamic Imports for 3D Viewer?</h3>
              <p>
                The Speckle viewer uses WebGL which cannot run during server-side rendering. 
                Dynamic imports with SSR disabled prevent hydration issues and reduce initial bundle size.
              </p>
            </section>
          )}

          {activeSection === "tech-stack" && (
            <section>
              <h1>Tech Stack</h1>

              <h2>Frontend</h2>
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>Technology</th>
                    <th>Version</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Next.js</td>
                    <td>15.3.5</td>
                    <td>React framework with SSR/SSG</td>
                  </tr>
                  <tr>
                    <td>React</td>
                    <td>18.x</td>
                    <td>UI library</td>
                  </tr>
                  <tr>
                    <td>@speckle/viewer</td>
                    <td>2.25.4</td>
                    <td>3D BIM model visualization</td>
                  </tr>
                  <tr>
                    <td>html5-qrcode</td>
                    <td>2.3.8</td>
                    <td>QR code scanning with camera</td>
                  </tr>
                  <tr>
                    <td>TypeScript</td>
                    <td>5.8.3</td>
                    <td>Type safety</td>
                  </tr>
                </tbody>
              </table>

              <h2>Backend</h2>
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>Technology</th>
                    <th>Version</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Express.js</td>
                    <td>5.1.0</td>
                    <td>Web server framework</td>
                  </tr>
                  <tr>
                    <td>Passport.js</td>
                    <td>0.7.0</td>
                    <td>Authentication middleware</td>
                  </tr>
                  <tr>
                    <td>openid-client</td>
                    <td>6.8.1</td>
                    <td>OpenID Connect authentication</td>
                  </tr>
                  <tr>
                    <td>drizzle-orm</td>
                    <td>0.44.6</td>
                    <td>TypeScript ORM</td>
                  </tr>
                  <tr>
                    <td>pg</td>
                    <td>8.16.3</td>
                    <td>PostgreSQL driver</td>
                  </tr>
                  <tr>
                    <td>express-session</td>
                    <td>1.18.2</td>
                    <td>Session management</td>
                  </tr>
                  <tr>
                    <td>connect-pg-simple</td>
                    <td>10.0.0</td>
                    <td>PostgreSQL session store</td>
                  </tr>
                  <tr>
                    <td>qrcode</td>
                    <td>1.5.4</td>
                    <td>QR code generation</td>
                  </tr>
                </tbody>
              </table>

              <h2>Database</h2>
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>Technology</th>
                    <th>Provider</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>PostgreSQL</td>
                    <td>Neon (Replit integration)</td>
                    <td>Relational database for all data</td>
                  </tr>
                  <tr>
                    <td>Drizzle Kit</td>
                    <td>0.31.5</td>
                    <td>Database migrations</td>
                  </tr>
                </tbody>
              </table>

              <h2>Development Tools</h2>
              <ul>
                <li><strong>tsx:</strong> TypeScript execution for development</li>
                <li><strong>concurrently:</strong> Run multiple processes during development</li>
                <li><strong>drizzle-kit:</strong> Database migration tooling</li>
              </ul>
            </section>
          )}

          {activeSection === "getting-started" && (
            <section>
              <h1>Getting Started</h1>

              <h2>Prerequisites</h2>
              <ul>
                <li>Node.js 20.x or later</li>
                <li>PostgreSQL database (provided by Replit)</li>
                <li>Basic understanding of React, Next.js, and TypeScript</li>
              </ul>

              <h2>Environment Setup</h2>
              <p>The following environment variables are automatically provided by Replit:</p>
              <pre className="code-block">{`DATABASE_URL=postgresql://...
REPLIT_DOMAINS=your-repl-domain.replit.dev
REPL_ID=your-repl-id
SESSION_SECRET=auto-generated`}</pre>

              <h2>Installation</h2>
              <pre className="code-block">{`# Dependencies are automatically installed by Replit
# If you need to reinstall:
npm install`}</pre>

              <h2>Database Setup</h2>
              <pre className="code-block">{`# Push schema changes to database
npm run db:push

# If you get warnings about data loss, force the push:
npm run db:push --force`}</pre>

              <h2>Running the Application</h2>
              <pre className="code-block">{`# Start development server (runs automatically in Replit)
npm run dev

# Server will be available at http://0.0.0.0:5000`}</pre>

              <h2>First Steps for New Developers</h2>
              <ol>
                <li><strong>Read this documentation thoroughly</strong> - Understanding the architecture is crucial</li>
                <li><strong>Explore the codebase structure</strong> - See "Code Structure" section</li>
                <li><strong>Review the database schema</strong> - Located in <code>shared/schema.ts</code></li>
                <li><strong>Study key components</strong> - Start with ViewerCore.tsx and InspectionPanel.tsx</li>
                <li><strong>Test the features</strong> - Create a test project and try all workflows</li>
                <li><strong>Review the changelog</strong> - See "What's New" to understand recent changes</li>
              </ol>

              <h2>Development Workflow</h2>
              <ol>
                <li>Make changes to code</li>
                <li>Hot Module Replacement (HMR) updates the browser automatically</li>
                <li>Test your changes in the preview window</li>
                <li>Update database schema in <code>shared/schema.ts</code> if needed</li>
                <li>Run <code>npm run db:push</code> to apply schema changes</li>
                <li>Update <code>data/changelog.json</code> to document your changes</li>
                <li>Update this documentation if you add new features or change architecture</li>
              </ol>
            </section>
          )}

          {activeSection === "code-structure" && (
            <section>
              <h1>Code Structure</h1>

              <h2>Directory Layout</h2>
              <pre className="code-block">{`twx/
├── app/                    # Next.js app-specific components
│   └── viewer/
│       └── ViewerCore.tsx  # Main 3D viewer component
├── components/             # Reusable React components
│   ├── TopBar.tsx         # Navigation header
│   ├── InspectionPanel.tsx # Inspection form sidebar
│   ├── AccountSettingsModal.tsx
│   ├── ChangelogModal.tsx
│   ├── HelpModal.tsx
│   └── ...
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts         # Authentication state management
│   └── useDraggable.ts    # Draggable panel functionality
├── lib/                    # Utility libraries
│   └── api.ts             # API client for frontend
├── pages/                  # Next.js pages (routes)
│   ├── index.tsx          # Landing page
│   ├── assets.tsx         # Asset inventory page
│   ├── docs.tsx           # This documentation page
│   ├── viewer/
│   │   └── [project].tsx  # Dynamic project viewer
│   └── api/               # API endpoints
│       ├── auth/          # Authentication endpoints
│       ├── projects.ts    # Project CRUD
│       ├── inspections.ts # Inspection CRUD
│       ├── elements/      # Element & transfer endpoints
│       ├── stats.ts       # Statistics
│       ├── export.ts      # Data export
│       └── changelog.ts   # Changelog
├── server/                 # Express.js backend
│   ├── index.ts           # Main server entry point
│   ├── auth.ts            # Passport.js authentication setup
│   ├── apiAuth.ts         # API authentication helpers
│   └── storage.ts         # Database connection & helpers
├── shared/                 # Shared code between client/server
│   ├── schema.ts          # Drizzle database schema
│   └── constants.ts       # Shared constants
├── data/                   # Data files
│   ├── changelog.json     # Application changelog
│   └── backups/           # Database backups
├── public/                 # Static assets
│   ├── logo-orange.png
│   └── ...
└── drizzle.config.ts      # Drizzle ORM configuration`}</pre>

              <h2>Key Files Explained</h2>

              <h3>Frontend Core</h3>
              <ul>
                <li><code>app/viewer/ViewerCore.tsx</code> - Main 3D viewer with Speckle integration</li>
                <li><code>components/InspectionPanel.tsx</code> - Inspection form and data entry</li>
                <li><code>components/TopBar.tsx</code> - Navigation header with user menu</li>
                <li><code>hooks/useAuth.ts</code> - Authentication state and user data</li>
                <li><code>hooks/useDraggable.ts</code> - Reusable drag-and-drop functionality</li>
              </ul>

              <h3>Backend Core</h3>
              <ul>
                <li><code>server/index.ts</code> - Express server setup and Next.js integration</li>
                <li><code>server/auth.ts</code> - Passport.js OpenID Connect configuration</li>
                <li><code>server/storage.ts</code> - Database connection and helper functions</li>
                <li><code>shared/schema.ts</code> - Complete database schema definition</li>
              </ul>

              <h3>API Endpoints</h3>
              <ul>
                <li><code>pages/api/auth/</code> - Login, logout, user info</li>
                <li><code>pages/api/projects.ts</code> - Project management</li>
                <li><code>pages/api/inspections.ts</code> - Inspection CRUD operations</li>
                <li><code>pages/api/elements/</code> - Element registry and transfers</li>
                <li><code>pages/api/stats.ts</code> - Project statistics</li>
                <li><code>pages/api/export.ts</code> - Data export functionality</li>
              </ul>
            </section>
          )}

          {activeSection === "database" && (
            <section>
              <h1>Database Schema</h1>

              <h2>Entity Relationship Overview</h2>
              <pre className="code-block">{`
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    Users    │───┐   │   Projects   │───┐   │  Elements   │
└─────────────┘   │   └──────────────┘   │   └─────────────┘
                  │                       │          │
                  │   ┌──────────────┐   │          │
                  └───│ Inspections  │◄──┘          │
                      └──────────────┘              │
                              │                     │
                      ┌───────┴────────┐           │
                      │                │           │
              ┌───────▼────────┐  ┌────▼──────────▼────┐
              │ Element_Project│  │ Element_Speckle_    │
              │    _History    │  │    Mappings         │
              └────────────────┘  └─────────────────────┘`}</pre>

              <h2>Core Tables</h2>

              <h3>users</h3>
              <p>Stores user accounts managed by Replit Auth.</p>
              <pre className="code-block">{`id: serial (PK)
email: varchar (unique)
firstName: varchar
lastName: varchar
profileImageUrl: varchar
displayName: varchar (user's custom display name)
company: varchar
title: varchar (job title)
createdAt: timestamp
updatedAt: timestamp`}</pre>

              <h3>sessions</h3>
              <p>PostgreSQL-backed session storage with automatic cleanup.</p>
              <pre className="code-block">{`sid: varchar (PK)
sess: json (session data)
expire: timestamp (TTL: 7 days)`}</pre>

              <h3>projects</h3>
              <p>Construction projects with BIM models.</p>
              <pre className="code-block">{`id: varchar (PK) - e.g., "proj_1234567890123_abcdef"
name: varchar
status: varchar (active, completed, archived)
speckleUrl: varchar (link to Speckle BIM model)
createdAt: timestamp
lastModified: timestamp`}</pre>

              <h3>inspections</h3>
              <p>Inspection records for temporary works elements.</p>
              <pre className="code-block">{`id: serial (PK)
projectId: varchar (FK → projects.id) NOT NULL
elementId: varchar (Speckle element ID)
globalElementId: varchar (FK → elements.id, for material reuse)
inspectionType: varchar (receipt, periodic, transfer, final, maintenance)
status: varchar (pending, passed, failed, with_issues)
inspectorName: varchar
inspectionDate: date
twPackageNumber: varchar
... (30+ additional fields for comprehensive inspection data)
createdByUserId: integer (FK → users.id)
lastModifiedByUserId: integer (FK → users.id)
createdAt: timestamp
updatedAt: timestamp`}</pre>

              <h3>elements</h3>
              <p>Global registry of physical temporary works elements.</p>
              <pre className="code-block">{`id: varchar (PK) - Asset number: "IfcType-YYYY-NNNNNN"
ifcType: varchar (IfcColumn, IfcMember, IfcBeam, etc.)
description: text
manufacturer: varchar
serialNumber: varchar
specifications: text
condition: varchar (excellent, good, fair, poor, damaged)
status: varchar (active, in_transit, in_storage, retired, scrapped)
currentProjectId: varchar (FK → projects.id, nullable)
qrCode: text (base64 encoded QR code image)
createdAt: timestamp
updatedAt: timestamp`}</pre>

              <h3>element_project_history</h3>
              <p>Complete lifecycle history of elements across projects.</p>
              <pre className="code-block">{`id: serial (PK)
elementId: varchar (FK → elements.id)
projectId: varchar (FK → projects.id)
transferDate: timestamp
conditionAtReceipt: varchar
conditionAtTransfer: varchar
approvedBySourcePM: boolean
approvedByDestinationPM: boolean
status: varchar (active, transferred_out, pending_approval, completed)
notes: text
createdAt: timestamp
updatedAt: timestamp`}</pre>

              <h3>element_speckle_mappings</h3>
              <p>Links physical elements to their BIM representations.</p>
              <pre className="code-block">{`id: serial (PK)
elementId: varchar (FK → elements.id)
projectId: varchar (FK → projects.id)
speckleElementId: varchar (ID in Speckle model)
isActive: boolean (only one active mapping per element)
createdAt: timestamp
updatedAt: timestamp`}</pre>

              <h2>Database Management</h2>

              <h3>Schema Updates</h3>
              <p>Always update the schema in <code>shared/schema.ts</code> using Drizzle ORM syntax:</p>
              <pre className="code-block">{`// Example: Adding a new field
export const inspections = pgTable('inspections', {
  // ... existing fields ...
  newField: varchar('new_field'),
});`}</pre>

              <h3>Applying Changes</h3>
              <pre className="code-block">{`# Push schema to database
npm run db:push

# If data loss warning appears, force push
npm run db:push --force`}</pre>

              <h3>⚠️ Critical Database Rules</h3>
              <ul className="warning-list">
                <li><strong>NEVER change primary key types</strong> - Breaks existing data</li>
                <li><strong>Keep serial IDs as serial</strong> - Don't convert to varchar</li>
                <li><strong>Keep varchar IDs as varchar</strong> - Don't convert to serial</li>
                <li><strong>Use db:push, not manual migrations</strong> - Safer and automatic</li>
              </ul>
            </section>
          )}

          {activeSection === "api" && (
            <section>
              <h1>API Endpoints</h1>

              <h2>Authentication</h2>
              <table className="api-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>/api/login</code></td>
                    <td>GET</td>
                    <td>Initiates OpenID Connect login flow</td>
                  </tr>
                  <tr>
                    <td><code>/api/logout</code></td>
                    <td>GET</td>
                    <td>Logs out user and destroys session</td>
                  </tr>
                  <tr>
                    <td><code>/api/auth/user</code></td>
                    <td>GET</td>
                    <td>Returns current authenticated user</td>
                  </tr>
                  <tr>
                    <td><code>/api/user/profile</code></td>
                    <td>GET/PUT</td>
                    <td>Get or update user profile (displayName, company, title)</td>
                  </tr>
                </tbody>
              </table>

              <h2>Projects</h2>
              <table className="api-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>/api/projects</code></td>
                    <td>GET</td>
                    <td>List all projects or get single project by ID</td>
                  </tr>
                  <tr>
                    <td><code>/api/projects</code></td>
                    <td>POST</td>
                    <td>Create new project</td>
                  </tr>
                </tbody>
              </table>

              <h2>Inspections</h2>
              <table className="api-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>/api/inspections</code></td>
                    <td>GET</td>
                    <td>List inspections (filter by projectId)</td>
                  </tr>
                  <tr>
                    <td><code>/api/inspections</code></td>
                    <td>POST</td>
                    <td>Create new inspection (auto-tracks user)</td>
                  </tr>
                  <tr>
                    <td><code>/api/inspections/element/[id]</code></td>
                    <td>GET</td>
                    <td>Get inspection by Speckle element ID</td>
                  </tr>
                </tbody>
              </table>

              <h2>Elements (Material Reuse)</h2>
              <table className="api-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>/api/elements</code></td>
                    <td>GET</td>
                    <td>List all elements (with filters)</td>
                  </tr>
                  <tr>
                    <td><code>/api/elements</code></td>
                    <td>POST</td>
                    <td>Register new element with QR code</td>
                  </tr>
                  <tr>
                    <td><code>/api/elements/[id]</code></td>
                    <td>GET</td>
                    <td>Get element details</td>
                  </tr>
                  <tr>
                    <td><code>/api/elements/[id]</code></td>
                    <td>PUT</td>
                    <td>Update element</td>
                  </tr>
                  <tr>
                    <td><code>/api/elements/qr/[code]</code></td>
                    <td>GET</td>
                    <td>Lookup element by QR code (mobile scanning)</td>
                  </tr>
                  <tr>
                    <td><code>/api/elements/[id]/transfer</code></td>
                    <td>POST</td>
                    <td>Initiate element transfer to another project</td>
                  </tr>
                  <tr>
                    <td><code>/api/elements/[id]/approve</code></td>
                    <td>POST</td>
                    <td>Approve transfer (project manager action)</td>
                  </tr>
                  <tr>
                    <td><code>/api/elements/[id]/receive</code></td>
                    <td>POST</td>
                    <td>Receive element in destination project</td>
                  </tr>
                  <tr>
                    <td><code>/api/elements/[id]/history</code></td>
                    <td>GET</td>
                    <td>Get complete project history timeline</td>
                  </tr>
                  <tr>
                    <td><code>/api/elements/[id]/inspections</code></td>
                    <td>GET</td>
                    <td>Get all inspections across all projects</td>
                  </tr>
                  <tr>
                    <td><code>/api/elements/[id]/link</code></td>
                    <td>POST</td>
                    <td>Link element to Speckle BIM element</td>
                  </tr>
                </tbody>
              </table>

              <h2>Other Endpoints</h2>
              <table className="api-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>/api/stats</code></td>
                    <td>GET</td>
                    <td>Get project statistics</td>
                  </tr>
                  <tr>
                    <td><code>/api/export</code></td>
                    <td>GET</td>
                    <td>Export inspection data (CSV/JSON)</td>
                  </tr>
                  <tr>
                    <td><code>/api/changelog</code></td>
                    <td>GET</td>
                    <td>Get application changelog</td>
                  </tr>
                </tbody>
              </table>

              <h2>API Authentication</h2>
              <p>
                Most API endpoints require authentication. Use the <code>isAuthenticated</code> middleware:
              </p>
              <pre className="code-block">{`import { isAuthenticated } from '../../server/auth';

export default function handler(req, res) {
  // Check authentication
  if (!isAuthenticated(req, res)) return;
  
  // Your endpoint logic here
}`}</pre>

              <p>To get the current user in API routes:</p>
              <pre className="code-block">{`import { getCurrentUser } from '../../server/apiAuth';

const user = getCurrentUser(req);
if (!user) {
  return res.status(401).json({ error: 'Unauthorized' });
}`}</pre>
            </section>
          )}

          {activeSection === "features" && (
            <section>
              <h1>Key Features</h1>

              <h2>1. Material Reuse Tracking</h2>
              <p>
                The core feature that tracks temporary works elements as they move between construction projects.
              </p>

              <h3>How It Works</h3>
              <ol>
                <li><strong>Registration:</strong> Elements are registered with unique asset numbers (e.g., "IfcColumn-2024-000123")</li>
                <li><strong>QR Codes:</strong> Each element gets a QR code for mobile scanning and identification</li>
                <li><strong>Project Linking:</strong> Elements are linked to BIM models in specific projects</li>
                <li><strong>Inspection History:</strong> All inspections are preserved as elements move</li>
                <li><strong>Transfer Workflow:</strong> Dual-approval process ensures proper handover</li>
                <li><strong>Lifecycle Tracking:</strong> Complete timeline of element usage across projects</li>
              </ol>

              <h3>Key Components</h3>
              <ul>
                <li><code>pages/assets.tsx</code> - Asset inventory and management</li>
                <li><code>pages/api/elements/</code> - Element APIs</li>
                <li><code>shared/schema.ts</code> - Elements, history, and mappings tables</li>
              </ul>

              <h2>2. 3D BIM Viewer Integration</h2>
              <p>Interactive 3D visualization using Speckle.</p>

              <h3>Key Features</h3>
              <ul>
                <li>Load and display BIM models from Speckle URLs</li>
                <li>Select elements interactively in 3D space</li>
                <li>Color-coding based on inspection status (passed, failed, pending)</li>
                <li>Element property extraction and normalization</li>
                <li>Multi-element selection for batch operations</li>
              </ul>

              <h3>Implementation</h3>
              <p>Located in <code>app/viewer/ViewerCore.tsx</code> with:</p>
              <ul>
                <li>Dynamic import to avoid SSR issues</li>
                <li>Speckle viewer initialization and configuration</li>
                <li>Selection and filtering extensions</li>
                <li>Material color management for status visualization</li>
              </ul>

              <h2>3. Inspection Management</h2>
              <p>Comprehensive inspection recording with 30+ fields.</p>

              <h3>Inspection Types</h3>
              <ul>
                <li><strong>Receipt:</strong> When element arrives at project site</li>
                <li><strong>Periodic:</strong> Regular safety checks during use</li>
                <li><strong>Transfer:</strong> Before moving to another project</li>
                <li><strong>Final:</strong> End-of-life assessment</li>
                <li><strong>Maintenance:</strong> Repair or servicing records</li>
              </ul>

              <h3>Data Categories</h3>
              <ul>
                <li>Basic Info (inspector, date, status)</li>
                <li>TW Package Details</li>
                <li>Planning & Scheduling</li>
                <li>Location</li>
                <li>Technical Requirements</li>
                <li>Quality & Compliance</li>
                <li>Commercial</li>
                <li>Maintenance</li>
                <li>Safety</li>
              </ul>

              <h2>4. User Authentication & Audit Trails</h2>
              <p>Secure authentication with complete audit tracking.</p>

              <h3>Features</h3>
              <ul>
                <li>OpenID Connect via Replit Auth (Google, GitHub, email)</li>
                <li>PostgreSQL-backed sessions (7-day TTL)</li>
                <li>Automatic user tracking on inspection creation/modification</li>
                <li>Tamper-proof audit trails</li>
                <li>User profile management (display name, company, title)</li>
              </ul>

              <h2>5. Draggable UI Panels</h2>
              <p>Flexible workspace with customizable panel positions.</p>

              <h3>Features</h3>
              <ul>
                <li>Drag Element Details and Project Statistics panels</li>
                <li>Positions saved to localStorage</li>
                <li>Viewport boundary constraints</li>
                <li>Reset to default position</li>
                <li>Toggle visibility with always-visible buttons</li>
                <li>Active state indicators</li>
              </ul>

              <h3>Implementation</h3>
              <p>
                Uses custom <code>useDraggable</code> hook with localStorage persistence 
                and SSR-safe initialization.
              </p>
            </section>
          )}

          {activeSection === "ui-components" && (
            <section>
              <h1>UI Components</h1>

              <h2>Reusable Components</h2>

              <h3>TopBar</h3>
              <p><code>components/TopBar.tsx</code></p>
              <ul>
                <li>Navigation header with project info</li>
                <li>User menu with profile picture/initials</li>
                <li>Hamburger menu for app-wide navigation</li>
                <li>Authentication status display</li>
              </ul>

              <h3>InspectionPanel</h3>
              <p><code>components/InspectionPanel.tsx</code></p>
              <ul>
                <li>Sidebar form for recording inspections</li>
                <li>30+ fields organized into collapsible sections</li>
                <li>Auto-saves inspection data</li>
                <li>Displays inspection history</li>
                <li>Supports multi-element selection</li>
              </ul>

              <h3>ViewerCore</h3>
              <p><code>app/viewer/ViewerCore.tsx</code></p>
              <ul>
                <li>Main 3D BIM viewer component</li>
                <li>Speckle integration with dynamic import</li>
                <li>Element selection handling</li>
                <li>Color-coding by inspection status</li>
                <li>Project statistics display</li>
                <li>Element details panel</li>
              </ul>

              <h3>Modals</h3>
              <ul>
                <li><code>AccountSettingsModal.tsx</code> - User profile editing</li>
                <li><code>ChangelogModal.tsx</code> - Version history and updates</li>
                <li><code>HelpModal.tsx</code> - Application help documentation</li>
                <li><code>SettingsModal.tsx</code> - Application settings</li>
                <li><code>CreditsModal.tsx</code> - Academic credits and acknowledgments</li>
              </ul>

              <h2>Custom Hooks</h2>

              <h3>useAuth</h3>
              <p><code>hooks/useAuth.ts</code></p>
              <pre className="code-block">{`const { user, isLoading, isAuthenticated, refreshUser } = useAuth();

// user: User object or null
// isLoading: boolean (true while fetching)
// isAuthenticated: boolean (true if user logged in)
// refreshUser: function to reload user data`}</pre>

              <h3>useDraggable</h3>
              <p><code>hooks/useDraggable.ts</code></p>
              <pre className="code-block">{`const panel = useDraggable({
  storageKey: 'panel-position',
  defaultPosition: { x: 100, y: 100 }
});

// Returns:
// - position: current {x, y}
// - handleRef: ref for drag handle
// - panelRef: ref for panel element
// - isDragging: boolean
// - resetPosition: reset function`}</pre>

              <h2>Styling Conventions</h2>
              <ul>
                <li><strong>CSS-in-JS:</strong> Using Next.js styled-jsx for scoped styles</li>
                <li><strong>CSS Variables:</strong> Defined in global CSS for theming</li>
                <li><strong>Naming:</strong> BEM-like naming (e.g., <code>panel-header</code>, <code>btn-primary</code>)</li>
                <li><strong>Responsive:</strong> Mobile-first approach with media queries</li>
              </ul>

              <h2>Design System</h2>
              <h3>Colors</h3>
              <ul>
                <li><strong>Primary:</strong> Orange (#f77f00)</li>
                <li><strong>Success:</strong> Green (#38b000)</li>
                <li><strong>Warning:</strong> Yellow (#ffd60a)</li>
                <li><strong>Error:</strong> Red (#d62828)</li>
                <li><strong>Gray scale:</strong> 100-900</li>
              </ul>

              <h3>Typography</h3>
              <ul>
                <li><strong>Font:</strong> System font stack</li>
                <li><strong>Sizes:</strong> xs, sm, base, lg, xl, 2xl, 3xl</li>
                <li><strong>Weights:</strong> normal (400), medium (500), semibold (600), bold (700)</li>
              </ul>

              <h3>Spacing</h3>
              <ul>
                <li>xs: 4px</li>
                <li>sm: 8px</li>
                <li>md: 16px</li>
                <li>lg: 24px</li>
                <li>xl: 32px</li>
                <li>2xl: 48px</li>
              </ul>
            </section>
          )}

          {activeSection === "deployment" && (
            <section>
              <h1>Deployment</h1>

              <h2>Replit Deployment</h2>
              <p>
                TWX is designed to run on Replit with automatic deployment configuration.
              </p>

              <h3>Automatic Setup</h3>
              <ul>
                <li>PostgreSQL database automatically provisioned</li>
                <li>Environment variables auto-configured</li>
                <li>HTTPS and custom domains supported</li>
                <li>Automatic server restart on code changes</li>
              </ul>

              <h3>Deployment Workflow</h3>
              <ol>
                <li>Code is automatically deployed when you click "Run"</li>
                <li>Server starts on port 5000</li>
                <li>Next.js builds pages on-demand</li>
                <li>Database migrations run automatically if needed</li>
              </ol>

              <h2>Environment Configuration</h2>
              <p>Required environment variables (auto-provided by Replit):</p>
              <pre className="code-block">{`DATABASE_URL - PostgreSQL connection string
REPLIT_DOMAINS - Your repl's domain
REPL_ID - Unique repl identifier
SESSION_SECRET - Session encryption key`}</pre>

              <h2>Production Checklist</h2>
              <ul className="checklist">
                <li>✓ Database schema is up to date</li>
                <li>✓ All migrations have been applied</li>
                <li>✓ Environment variables are set</li>
                <li>✓ Authentication is working</li>
                <li>✓ Sessions are persisting correctly</li>
                <li>✓ Speckle models load properly</li>
                <li>✓ All API endpoints respond correctly</li>
                <li>✓ Error handling is in place</li>
              </ul>

              <h2>Performance Optimization</h2>
              <h3>Frontend</h3>
              <ul>
                <li>Dynamic imports for heavy components (Speckle viewer)</li>
                <li>Next.js automatic code splitting</li>
                <li>Image optimization with Next.js Image component</li>
                <li>CSS-in-JS for component-scoped styles</li>
              </ul>

              <h3>Backend</h3>
              <ul>
                <li>PostgreSQL connection pooling</li>
                <li>Session store with automatic cleanup</li>
                <li>Efficient database queries with Drizzle ORM</li>
                <li>API response caching where appropriate</li>
              </ul>

              <h3>Database</h3>
              <ul>
                <li>Proper indexing on frequently queried columns</li>
                <li>Foreign key constraints for data integrity</li>
                <li>Efficient query patterns (avoid N+1 queries)</li>
              </ul>
            </section>
          )}

          {activeSection === "best-practices" && (
            <section>
              <h1>Best Practices</h1>

              <h2>Code Quality</h2>

              <h3>TypeScript</h3>
              <ul>
                <li>Use strict type checking</li>
                <li>Define interfaces for all data structures</li>
                <li>Import types from <code>shared/schema.ts</code> for database entities</li>
                <li>Avoid <code>any</code> type - use <code>unknown</code> or proper types</li>
              </ul>

              <h3>React Components</h3>
              <ul>
                <li>Use functional components with hooks</li>
                <li>Keep components focused and single-purpose</li>
                <li>Extract reusable logic into custom hooks</li>
                <li>Use useCallback and useMemo for performance optimization</li>
                <li>Avoid prop drilling - use context or state management when needed</li>
              </ul>

              <h3>API Development</h3>
              <ul>
                <li>Always validate user input</li>
                <li>Use TypeScript types for request/response data</li>
                <li>Return consistent error formats</li>
                <li>Include proper HTTP status codes</li>
                <li>Add authentication checks to protected endpoints</li>
                <li>Track user actions with createdByUserId/lastModifiedByUserId</li>
              </ul>

              <h2>Database Best Practices</h2>

              <h3>Schema Updates</h3>
              <ul>
                <li>Always update <code>shared/schema.ts</code> first</li>
                <li>Never manually write SQL migrations</li>
                <li>Use <code>npm run db:push</code> to apply changes</li>
                <li>NEVER change primary key types (serial vs varchar)</li>
                <li>Add proper foreign key constraints</li>
              </ul>

              <h3>Queries</h3>
              <ul>
                <li>Use Drizzle ORM for type-safe queries</li>
                <li>Avoid N+1 queries - use joins or batch loading</li>
                <li>Add indexes for frequently queried columns</li>
                <li>Use transactions for multi-step operations</li>
              </ul>

              <h2>Security</h2>

              <h3>Authentication</h3>
              <ul>
                <li>Always check authentication before accessing protected routes</li>
                <li>Use <code>isAuthenticated</code> middleware consistently</li>
                <li>Never trust client-supplied user IDs</li>
                <li>Get user data from session on the server side</li>
              </ul>

              <h3>Data Validation</h3>
              <ul>
                <li>Validate all user input on the server</li>
                <li>Sanitize data before storing in database</li>
                <li>Use parameterized queries (Drizzle handles this)</li>
                <li>Check authorization - can this user access this resource?</li>
              </ul>

              <h3>Audit Trails</h3>
              <ul>
                <li>Strip client-supplied user tracking fields from requests</li>
                <li>Set createdByUserId only on creation, never allow updates</li>
                <li>Update lastModifiedByUserId server-side on every update</li>
                <li>Preserve original creator when updating records</li>
              </ul>

              <h2>Documentation</h2>

              <h3>Keep Updated</h3>
              <p>Whenever you make changes, update:</p>
              <ol>
                <li><strong>data/changelog.json</strong> - Add entry with version, date, and details</li>
                <li><strong>This documentation</strong> - Update relevant sections</li>
                <li><strong>replit.md</strong> - Update architecture notes if needed</li>
                <li><strong>Code comments</strong> - Add comments for complex logic</li>
              </ol>

              <h3>Changelog Format</h3>
              <pre className="code-block">{`{
  "id": "change_YYYYMMDD_NNN",
  "version": "X.Y.Z",
  "date": "YYYY-MM-DD",
  "title": "Clear, descriptive title",
  "category": "feature|enhancement|fix|security",
  "description": "Brief summary",
  "details": [
    "Specific change 1",
    "Specific change 2"
  ]
}`}</pre>

              <h2>Testing</h2>
              <ul>
                <li>Test all new features manually before committing</li>
                <li>Test authentication flows thoroughly</li>
                <li>Verify database operations don't corrupt data</li>
                <li>Test on different screen sizes</li>
                <li>Check browser console for errors</li>
                <li>Test with different user roles/permissions</li>
              </ul>

              <h2>Git Workflow</h2>
              <ul>
                <li>Write clear, descriptive commit messages</li>
                <li>Commit related changes together</li>
                <li>Don't commit sensitive data or secrets</li>
                <li>Keep commits focused and atomic</li>
                <li>Test before committing</li>
              </ul>
            </section>
          )}
        </main>
      </div>

      <style jsx>{`
        .docs-page {
          background: var(--color-gray-50);
        }

        .docs-container {
          display: grid;
          grid-template-columns: 250px 1fr;
          max-width: 1400px;
          margin: 0 auto;
          padding: calc(var(--header-height) + var(--space-lg)) var(--space-lg) var(--space-2xl) var(--space-lg);
          gap: var(--space-xl);
          align-items: start;
        }

        .docs-sidebar {
          position: sticky;
          top: calc(var(--header-height) + var(--space-lg));
          max-height: calc(100vh - var(--header-height) - var(--space-xl));
          overflow-y: auto;
          background: var(--color-white);
          border-radius: 8px;
          padding: var(--space-lg);
          box-shadow: var(--shadow-sm);
        }

        .docs-sidebar h2 {
          margin: 0 0 var(--space-md) 0;
          font-size: var(--font-size-lg);
          color: var(--color-gray-900);
        }

        .docs-sidebar ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .docs-sidebar li {
          margin-bottom: var(--space-xs);
        }

        .docs-sidebar button {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          padding: var(--space-sm);
          border-radius: 4px;
          cursor: pointer;
          color: var(--color-gray-700);
          font-size: var(--font-size-sm);
          transition: all 0.15s ease;
        }

        .docs-sidebar button:hover {
          background: var(--color-gray-100);
          color: var(--color-primary);
        }

        .docs-sidebar button.active {
          background: var(--color-primary);
          color: var(--color-white);
          font-weight: 600;
        }

        .docs-content {
          background: var(--color-white);
          border-radius: 8px;
          padding: var(--space-2xl);
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--space-2xl);
        }

        .docs-content h1 {
          margin: 0 0 var(--space-lg) 0;
          font-size: var(--font-size-3xl);
          color: var(--color-gray-900);
          border-bottom: 2px solid var(--color-gray-200);
          padding-bottom: var(--space-md);
        }

        .docs-content h2 {
          margin: var(--space-xl) 0 var(--space-md) 0;
          font-size: var(--font-size-2xl);
          color: var(--color-gray-800);
        }

        .docs-content h3 {
          margin: var(--space-lg) 0 var(--space-sm) 0;
          font-size: var(--font-size-lg);
          color: var(--color-gray-700);
        }

        .docs-content p {
          line-height: 1.6;
          color: var(--color-gray-700);
          margin-bottom: var(--space-md);
        }

        .docs-content .lead {
          font-size: var(--font-size-lg);
          color: var(--color-gray-600);
          margin-bottom: var(--space-xl);
        }

        .docs-content ul,
        .docs-content ol {
          margin: var(--space-md) 0;
          padding-left: var(--space-xl);
          color: var(--color-gray-700);
        }

        .docs-content li {
          margin-bottom: var(--space-sm);
          line-height: 1.6;
        }

        .docs-content code {
          background: var(--color-gray-100);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.9em;
          color: var(--color-primary);
        }

        .code-block {
          background: var(--color-gray-900);
          color: var(--color-gray-100);
          padding: var(--space-lg);
          border-radius: 6px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: var(--font-size-sm);
          line-height: 1.5;
          margin: var(--space-md) 0;
        }

        .architecture-diagram {
          margin: var(--space-lg) 0;
        }

        .architecture-diagram pre {
          background: var(--color-gray-50);
          color: var(--color-gray-800);
          padding: var(--space-lg);
          border-radius: 6px;
          border: 1px solid var(--color-gray-200);
          overflow-x: auto;
          font-size: var(--font-size-sm);
        }

        .tech-table,
        .api-table {
          width: 100%;
          border-collapse: collapse;
          margin: var(--space-md) 0;
        }

        .tech-table th,
        .api-table th,
        .tech-table td,
        .api-table td {
          padding: var(--space-sm) var(--space-md);
          text-align: left;
          border-bottom: 1px solid var(--color-gray-200);
        }

        .tech-table th,
        .api-table th {
          background: var(--color-gray-100);
          font-weight: 600;
          color: var(--color-gray-900);
        }

        .tech-table td,
        .api-table td {
          color: var(--color-gray-700);
        }

        .warning-list {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: var(--space-md);
          margin: var(--space-md) 0;
          list-style-position: inside;
        }

        .checklist {
          list-style: none;
          padding: 0;
        }

        .checklist li {
          padding-left: var(--space-lg);
          position: relative;
        }

        .checklist li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--color-success);
          font-weight: bold;
        }

        @media (max-width: 1024px) {
          .docs-container {
            grid-template-columns: 1fr;
          }

          .docs-sidebar {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .docs-content {
            padding: var(--space-lg);
          }

          .docs-content h1 {
            font-size: var(--font-size-2xl);
          }
        }
      `}</style>
    </div>
  );
}
