# Material Reuse Tracking System - Implementation Proposal

## Executive Summary

This proposal outlines a system for tracking physical temporary works elements (props, scaffolds, formwork, etc.) as they are reused across multiple construction projects, maintaining a complete inspection history while ensuring each element is only "active and inspectable" in one project at a time.

---

## 1. Core Challenge

**Current Situation:**
- Inspections are tied to Speckle `elementId` values (BIM model identifiers)
- When physical materials move to a new project, they appear as "new" elements in the BIM model
- No way to link the same physical asset across different projects
- Inspection history is lost when materials are reused

**Required Solution:**
- Global registry of physical assets independent of BIM models
- Link physical assets to their BIM representations in each project
- Carry inspection history when elements transfer between projects
- Prevent inspection of elements in non-active projects

---

## 2. Proposed Data Model

### 2.1 New Table: `elements` (Global Asset Registry)

```typescript
elements {
  id: varchar (UUID) - Globally unique identifier
  assetNumber: varchar - Human-readable reference (e.g., "PROP-2024-001")
  assetType: varchar - Type: scaffold_tower, prop, formwork_panel, etc.
  category: varchar - Category: props, scaffolding, formwork, shoring
  description: text - Physical description
  manufacturer: varchar - Manufacturer/supplier
  serialNumber: varchar - Physical serial number (if available)
  qrCode: varchar - QR code for mobile scanning
  rfidTag: varchar - RFID tag for automated tracking
  specifications: jsonb - Technical specs (capacity, dimensions, material grade)
  purchaseDate: date - When acquired
  purchaseValue: decimal - Original cost
  currentCondition: varchar - excellent, good, fair, poor, retired
  currentProjectId: varchar -> projects.id - Which project it's currently in
  status: varchar - active, in_transit, in_storage, retired, scrapped
  createdAt: timestamp
  createdByUserId: varchar -> users.id
  updatedAt: timestamp
}
```

**Indexes:**
- `idx_elements_asset_number` (unique)
- `idx_elements_qr_code` (unique, for scanning)
- `idx_elements_current_project`
- `idx_elements_status`
- `idx_elements_asset_type`

### 2.2 New Table: `element_project_history` (Lifecycle Tracking)

```typescript
elementProjectHistory {
  id: serial - Auto-incrementing ID
  elementId: varchar -> elements.id
  projectId: varchar -> projects.id
  
  // Transfer tracking
  transferredFromProjectId: varchar -> projects.id (nullable)
  transferDate: timestamp
  transferredByUserId: varchar -> users.id
  
  // Status in this project
  status: varchar - active, transferred_out, completed, retired
  activatedDate: timestamp - When element became active in this project
  deactivatedDate: timestamp - When element left this project
  
  // Condition tracking
  receivedCondition: varchar - Condition when received
  transferredCondition: varchar - Condition when transferred out
  conditionNotes: text
  
  // Location in project
  plannedLocation: text
  actualLocation: text
  
  // Quality assurance
  receiptInspectionId: varchar - Inspection when element arrived
  transferInspectionId: varchar - Inspection before transfer
  
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes:**
- `idx_eph_element_id`
- `idx_eph_project_id`
- `idx_eph_element_project` (compound)
- `idx_eph_status`

### 2.3 New Table: `element_speckle_mappings` (BIM Linking)

```typescript
elementSpeckleMappings {
  id: serial
  elementId: varchar -> elements.id
  projectId: varchar -> projects.id
  speckleElementId: varchar - The Speckle/BIM element ID
  speckleObjectUrl: text - Direct link to Speckle object
  mappedDate: timestamp
  mappedByUserId: varchar -> users.id
  isActive: boolean - Only one mapping active per element
  notes: text - Mapping notes
}
```

**Purpose:** Links physical assets to their BIM representations, which may change between projects.

### 2.4 Updated Table: `inspections`

**New Fields:**
```typescript
// Add to existing inspections table
globalElementId: varchar -> elements.id (nullable for backward compatibility)
inspectionType: varchar - receipt, periodic, transfer, final, maintenance
```

**Relationship:** 
- Inspections remain linked to `elementId` (Speckle ID) for BIM visualization
- NEW: Also linked to `globalElementId` for cross-project history
- Filter inspections by project for current view
- Show all inspections (any project) in element history view

---

## 3. Key Features & User Workflows

### 3.1 Element Registration

**When:** First time a physical element enters the system

**Process:**
1. Inspector opens "Register New Asset" dialog
2. Fills in asset details (type, serial number, specs)
3. System generates QR code and asset number
4. Element is linked to current project as "active"
5. Optional: Scan/link to BIM element in Speckle viewer

**UI Location:** Button in project sidebar: "+ Register Asset"

### 3.2 Element Discovery & Linking

**When:** Physical element already registered, now appears in a new project

**Process:**
1. Inspector selects element in BIM viewer (new project)
2. System prompts: "Is this a reused element? Scan QR code or enter asset number"
3. Inspector scans QR code or enters asset number
4. System validates element exists and shows:
   - Current status and location
   - Previous project history
   - Last inspection summary
5. Inspector confirms transfer
6. System creates transfer record and updates status

**UI:** Modal dialog with QR scanner integration

### 3.3 Element Transfer Workflow

**Process:**
1. **In Source Project:**
   - Inspector marks element for transfer
   - Conducts transfer inspection (condition check)
   - Status changes from "active" to "in_transit"
   - Element becomes read-only in source project

2. **In Destination Project:**
   - Inspector receives element
   - Conducts receipt inspection
   - Links to BIM element in new project
   - Status changes to "active"
   - Element becomes inspectable in new project

**Validation:**
- Only one project can have element as "active"
- Source project must deactivate before destination can activate
- Both transfer and receipt inspections required

### 3.4 Inspection History View

**Unified Timeline:**
```
Element: PROP-2024-001 (Steel Prop, 3.5m)
Current Project: Marina Bay Tower Extension
Status: Active

Timeline:
├─ Project A: Downtown Excavation (2023-01 to 2023-08)
│  ├─ Receipt Inspection (2023-01-15) - Condition: Excellent
│  ├─ Periodic Inspection (2023-03-20) - Status: Approved
│  ├─ Periodic Inspection (2023-06-10) - Status: Approved
│  └─ Transfer Inspection (2023-08-01) - Condition: Good
│
├─ [Transfer Period: In Storage] (2023-08 to 2023-11)
│
└─ Project B: Marina Bay Tower (2023-11 to Present)
   ├─ Receipt Inspection (2023-11-12) - Condition: Good
   ├─ Periodic Inspection (2024-01-18) - Status: Approved
   └─ [Currently Active]
```

**Features:**
- Color-coded by project
- Clearly mark current vs. historical projects
- Show project transitions
- One-click drill-down to inspection details
- Export complete history to PDF

---

## 4. Technical Implementation Plan

### Phase 1: Database Schema (Week 1)

**Tasks:**
- [ ] Create `elements` table with indexes
- [ ] Create `element_project_history` table
- [ ] Create `element_speckle_mappings` table
- [ ] Add `globalElementId` and `inspectionType` to `inspections`
- [ ] Create migration scripts
- [ ] Update Drizzle schema definitions

### Phase 2: Backend API (Week 2)

**New Endpoints:**
```
POST   /api/elements              - Register new element
GET    /api/elements/:id          - Get element details
PUT    /api/elements/:id          - Update element
GET    /api/elements/qr/:code     - Lookup by QR code
POST   /api/elements/:id/transfer - Initiate transfer
POST   /api/elements/:id/receive  - Receive element
GET    /api/elements/:id/history  - Complete history
GET    /api/elements/:id/inspections - All inspections
POST   /api/elements/:id/link     - Link to Speckle element
```

**Update Existing:**
- `POST /api/inspections` - Add globalElementId validation
- `GET /api/inspections` - Filter by globalElementId option

### Phase 3: UI Components (Week 3-4)

**New Components:**
1. **ElementRegistrationModal**
   - Form for asset details
   - QR code generation
   - Initial condition assessment

2. **ElementLinkingModal**
   - QR code scanner (mobile camera)
   - Manual asset number entry
   - Transfer confirmation dialog

3. **ElementHistoryPanel**
   - Timeline visualization
   - Project transitions
   - Inspection summary cards
   - Export to PDF

4. **ElementTransferWorkflow**
   - Transfer inspection form
   - Receipt inspection form
   - Condition comparison
   - Photo upload support

5. **AssetInventory**
   - List all elements
   - Filter by project, status, type
   - Quick search by asset number
   - Bulk operations (transfer multiple)

### Phase 4: Integration (Week 4)

**Updates:**
- Modify InspectionModal to show element reuse status
- Add element history button to inspection view
- Update Speckle viewer to show asset tags on elements
- Add visual indicators for reused vs. new elements

---

## 5. User Interface Mockups

### 5.1 Element Registration

```
┌─────────────────────────────────────────┐
│ Register New Asset                    × │
├─────────────────────────────────────────┤
│                                         │
│ Asset Type:  [Prop ▼]                  │
│ Category:    [Temporary Works ▼]       │
│                                         │
│ Description: __________________________ │
│              __________________________ │
│                                         │
│ Physical Identifiers:                   │
│ Serial Number: ___________________      │
│ Manufacturer:  ___________________      │
│                                         │
│ Specifications:                         │
│ Capacity (kN):  [____]                 │
│ Height (m):     [____]                 │
│ Material Grade: [____]                 │
│                                         │
│ Initial Condition: [Excellent ▼]       │
│                                         │
│ [Generate QR Code]  [📷 Add Photo]     │
│                                         │
│         [Cancel]  [Register Asset]      │
└─────────────────────────────────────────┘
```

### 5.2 Element Discovery (Linking)

```
┌─────────────────────────────────────────┐
│ Link Existing Asset                  × │
├─────────────────────────────────────────┤
│                                         │
│ Selected BIM Element:                   │
│ Name: Steel Prop - Grid A3             │
│ Speckle ID: abc123xyz                   │
│                                         │
│ Is this a reused element?               │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │     [Scan QR Code]                  │ │
│ │                                     │ │
│ │  Or enter asset number manually:   │ │
│ │  PROP-2024-___                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ○ No, this is a new element            │
│                                         │
│         [Cancel]  [Continue]            │
└─────────────────────────────────────────┘
```

### 5.3 Element History View

```
┌─────────────────────────────────────────────────────┐
│ Asset History: PROP-2024-001                      × │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Steel Adjustable Prop, 3.5m                        │
│ Serial: SP-78234 | Capacity: 60kN                  │
│ Current Status: Active in Marina Bay Project       │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Project Timeline                                │ │
│ │                                                 │ │
│ │ ● Downtown Excavation (Completed)              │ │
│ │   Jan 2023 - Aug 2023                          │ │
│ │   4 inspections | Condition: Good              │ │
│ │   [View Details]                               │ │
│ │                                                 │ │
│ │ ⬇ Transferred Aug 2023                         │ │
│ │                                                 │ │
│ │ ● Marina Bay Tower (Active) ⭐                 │ │
│ │   Nov 2023 - Present                           │ │
│ │   2 inspections | Condition: Good              │ │
│ │   [View Details] [Add Inspection]              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Total Usage: 456 days | 6 inspections              │
│ Total Projects: 2                                   │
│                                                     │
│ [Export PDF] [Transfer Element] [Edit Details]     │
└─────────────────────────────────────────────────────┘
```

---

## 6. Business Rules

### 6.1 Element Status Rules

| Status | Can Inspect? | Can Transfer? | Can Edit? |
|--------|-------------|---------------|-----------|
| Active | ✅ Yes | ✅ Yes | ✅ Yes |
| In Transit | ❌ No | ✅ Yes (receive) | ⚠️ Limited |
| In Storage | ❌ No | ✅ Yes | ⚠️ Limited |
| Retired | ❌ No | ❌ No | ⚠️ View only |
| Scrapped | ❌ No | ❌ No | ❌ Read only |

### 6.2 Transfer Validation Rules

1. **Pre-Transfer:**
   - Element must be "active" in source project
   - Transfer inspection required
   - Cannot transfer if recent inspection shows issues

2. **During Transfer:**
   - Element marked "in_transit"
   - Not inspectable in any project
   - Destination project identified

3. **Post-Receipt:**
   - Receipt inspection required
   - Condition comparison mandatory
   - Only then becomes "active" in new project

### 6.3 Inspection Rules

- **Active elements only:** Can only create new inspections for elements with status="active" in current project
- **Historical view:** Can view all historical inspections from any project (read-only)
- **Inspection types:** Receipt, periodic, transfer, final, maintenance
- **Required fields:** globalElementId mandatory for all new inspections

---

## 7. Benefits & Impact

### 7.1 Operational Benefits

✅ **Complete Material History:** Track every use of every asset
✅ **Cost Tracking:** Calculate total cost per use, depreciation
✅ **Quality Assurance:** Identify overused or damaged elements
✅ **Compliance:** Demonstrate due diligence for safety
✅ **Inventory Management:** Know exact location of all assets
✅ **Sustainability:** Quantify reuse rates and carbon savings

### 7.2 Data Insights Enabled

- **Asset utilization rates:** How often each element is reused
- **Average lifespan:** How long elements last before retirement
- **Cost per project:** Amortized cost of reused vs. new elements
- **Transfer frequency:** How often elements move between projects
- **Condition degradation:** Track wear and tear over time
- **Carbon footprint reduction:** Quantify environmental impact of reuse

---

## 8. Migration Strategy

### 8.1 Backward Compatibility

**Existing Inspections:**
- Keep current `elementId` (Speckle ID) intact
- `globalElementId` is nullable
- Gradual migration: new inspections use global IDs
- Legacy inspections remain project-specific

**Data Migration Options:**

**Option A: Minimal (Recommended for MVP)**
- Create new tables
- New features only apply to newly registered elements
- Existing inspections continue as before
- No data migration needed

**Option B: Full Migration**
- Analyze existing inspections for patterns
- Attempt to match elementIds across projects
- Create retroactive global element records
- Link historical inspections
- Risk: May create incorrect links

**Recommendation:** Start with Option A, add migration tool later if needed

---

## 9. QR Code & Mobile Scanning

### 9.1 QR Code Format

```json
{
  "type": "TWX_ASSET",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "assetNumber": "PROP-2024-001",
  "version": "1.0"
}
```

Encoded as: `https://twx.app/asset/PROP-2024-001`

### 9.2 Mobile Scanner Integration

**Technology Options:**
1. **html5-qrcode** (Recommended) - Browser-based, no app needed
2. **Native camera API** - Modern browsers support
3. **RFID integration** - Future enhancement for automated tracking

**User Flow:**
1. Click "Scan QR Code" button
2. Browser requests camera permission
3. Point camera at QR code on physical element
4. System automatically looks up element
5. Shows element history and transfer options

---

## 10. Security & Permissions

### 10.1 Role-Based Access

| Role | Register Elements | Transfer Elements | View History | Edit Element Details |
|------|------------------|-------------------|--------------|---------------------|
| Inspector | ✅ Yes | ⚠️ Initiate only | ✅ Yes | ❌ No |
| Site Manager | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| TWC | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Admin | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

### 10.2 Audit Trail

**All operations logged:**
- Element registration (who, when, where)
- Transfer initiation and completion
- Status changes
- Element detail edits
- QR code scans (track mobile usage)

---

## 11. Future Enhancements

### 11.1 Phase 2 Features

- **Predictive maintenance:** ML-based alerts for elements needing inspection
- **Bulk transfers:** Move multiple elements at once
- **Photo comparison:** Side-by-side condition photos across time
- **Cost analytics dashboard:** ROI on reused materials
- **RFID integration:** Automated check-in/check-out
- **Mobile app:** Dedicated iOS/Android app for field use

### 11.2 Advanced Analytics

- **Carbon calculator:** CO2 savings from material reuse
- **Depreciation tracking:** Asset value over time
- **Optimization algorithms:** Suggest which elements to reuse
- **Supplier performance:** Track quality by manufacturer

---

## 12. Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| 1. Database Schema | 1 week | New tables, migrations, schema updates |
| 2. Backend API | 1 week | All endpoints, validation, business logic |
| 3. Core UI | 2 weeks | Registration, linking, transfer workflows |
| 4. History & Reporting | 1 week | Timeline view, PDF export, analytics |
| 5. Testing & QA | 1 week | Integration testing, UAT |
| 6. Documentation | 3 days | User guide, API docs, training materials |

**Total: 6-7 weeks**

---

## 13. Questions for Discussion

1. **QR Code Implementation:** Should we print physical QR code stickers now or later?
2. **Asset Numbering:** Preferred format for asset numbers? (e.g., PROP-YYYY-NNN)
3. **Transfer Approval:** Should transfers require approval from both source and destination project managers?
4. **Condition Grading:** Use simple (Excellent/Good/Fair/Poor) or detailed scale (1-10)?
5. **Mobile Priority:** How important is mobile-first design vs. desktop for field use?
6. **RFID Future:** Is RFID integration a priority or "nice to have"?

---

## 14. Recommendation

**Start with MVP approach:**

✅ **Phase 1 (Month 1):**
- Implement core database schema
- Basic element registration
- Simple linking to BIM elements
- Transfer workflow (manual)
- Basic history view

✅ **Phase 2 (Month 2):**
- QR code generation and scanning
- Enhanced history timeline
- PDF export
- Basic analytics

✅ **Phase 3 (Month 3+):**
- Advanced features based on user feedback
- Mobile optimization
- Predictive analytics
- RFID if needed

This phased approach delivers value quickly while allowing for user feedback and iteration.

---

**Document Version:** 1.0  
**Date:** October 18, 2025  
**Author:** TWX Development Team
