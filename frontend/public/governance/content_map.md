# Content Map v1.0.0

> Generated: 2026-03-02T09:15:02.144Z
> Build Hash: fd020cac9662

## Roles

### Technician / Partner (`technician`)
- Access Level: site-scoped
- Permissions: view_assigned_sites, complete_weekly_visits, complete_monthly_cleans, report_problems, access_ai_diagnostics, view_gamification, accept_refuse_deliveries, log_refills

### Driver (`driver`)
- Access Level: route-scoped
- Permissions: view_delivery_assignments, capture_pod, mark_deliveries_complete, view_delivery_history

### Operations Manager (`ops_manager`)
- Access Level: tenant-scoped
- Permissions: view_all_sites, fleet_dashboard, incident_management, shipment_management, user_management, photo_audit, generate_reports, packing_operations, manager_overrides, evidence_packets, feature_flags, system_health

### System Administrator (`admin`)
- Access Level: global
- Permissions: all_ops_manager_permissions, tenant_management, security_logs, session_management, smoke_tests, data_retention

## Screens

| Screen | Route | Roles | Required Proofs | Events |
|--------|-------|-------|-----------------|--------|
| login | / | * | - | - |
| technician_dashboard | / | technician | - | - |
| weekly_visit_wizard | modal | technician | PHOTO_SUPPLIES_INITIAL, PHOTO_SYRUPS | WORKFLOW_STARTED, WEEKLY_SUBMITTED, WORKFLOW_COMPLETED |
| monthly_deep_clean_wizard | modal | technician | CANISTER_DISASSEMBLY, GRINDER_DEEP_CLEAN | WORKFLOW_STARTED, WORKFLOW_COMPLETED |
| refill_wizard | modal | technician | CLOSET_BEFORE, CLOSET_AFTER | WORKFLOW_STARTED, WORKFLOW_COMPLETED |
| driver_dashboard | / | driver | - | - |
| delivery_pod_capture | modal | driver | POD_PHOTO | DELIVERY_POD_CREATED |
| delivery_acceptance | modal | technician | REFUSAL_PHOTO | DELIVERY_ACCEPTED, DELIVERY_REFUSED, BOX_ACCEPTED, BOX_REFUSED |
| ops_manager_console | / | ops_manager, admin | - | - |
| supply_closet_app | tab | technician | - | - |
| ai_chat_assistant | modal | technician | - | - |
| help_safety_center | modal | * | - | - |
| trophy_case | modal | technician | - | - |
| qr_verification | modal | technician, driver | - | BOX_ACCEPTED, BOX_REFUSED |

## Workflows

### Weekly Visit (`WEEKLY_VISIT`)
- Duration: 20 minutes
- Frequency: weekly
- Roles: technician

| Step | Title | Type | Required | Proof |
|------|-------|------|----------|-------|
| site_select | Select Site | selection | true | - |
| initial_photo | Take Initial Photo | photo | true | PHOTO_SUPPLIES_INITIAL |
| leak_check | Check for Leaks | checklist | true | - |
| machine_status | Machine Status | multiple_choice | true | - |
| cleaning_verify | Verify Cleaning | checklist | true | - |
| syrups_photo | Take Syrups Photo | photo | true | PHOTO_SYRUPS |
| problems | Report Problems | optional | false | - |
| summary | Review & Submit | confirmation | true | - |

### Monthly Deep Clean (`MONTHLY_DEEP_CLEAN`)
- Duration: 90 minutes
- Frequency: monthly
- Roles: technician

| Step | Title | Type | Required | Proof |
|------|-------|------|----------|-------|
| site_select | Select Site | selection | true | - |
| initial_inspect | Initial Inspection | photo_checklist | true | - |
| disassembly | Begin Disassembly | checklist | true | - |
| canister_clean | Canister Deep Clean | photo | true | CANISTER_DISASSEMBLY |
| grinder_clean | Grinder Deep Clean | photo | true | GRINDER_DEEP_CLEAN |
| sanitize | Sanitization | checklist | true | - |
| reassembly | Reassembly | checklist | true | - |
| test_run | Test Run | verification | true | - |
| final_photos | Final Photos | photo | true | - |
| summary | Review & Submit | confirmation | true | - |

### Refill (`REFILL`)
- Duration: 10 minutes
- Frequency: as needed
- Roles: technician

| Step | Title | Type | Required | Proof |
|------|-------|------|----------|-------|
| closet_select | Select Closet | selection | true | - |
| before_photo | Before Photo | photo | true | CLOSET_BEFORE |
| refill_checklist | Complete Refill | checklist | true | - |
| matcha_check | Matcha Condition | multiple_choice | true | - |
| after_photo | After Photo | photo | true | CLOSET_AFTER |
| issues | Report Issues | optional | false | - |
| submit | Submit | confirmation | true | - |

### Delivery Acceptance (`DELIVERY_ACCEPTANCE`)
- Duration: 5 minutes
- Frequency: per delivery
- Roles: technician

| Step | Title | Type | Required | Proof |
|------|-------|------|----------|-------|
| review_delivery | Review Delivery | display | true | - |
| inspect_boxes | Inspect Each Box | checklist | true | - |
| accept_refuse | Accept or Refuse | decision | true | - |
| refusal_reason | Refusal Reason | selection | conditional | - |
| refusal_photo | Refusal Evidence | photo | conditional | REFUSAL_PHOTO |
| confirm | Confirm Decision | confirmation | true | - |

### Proof of Delivery (`PROOF_OF_DELIVERY`)
- Duration: 2 minutes
- Frequency: per delivery
- Roles: driver

| Step | Title | Type | Required | Proof |
|------|-------|------|----------|-------|
| arrive_site | Arrive at Site | geofence | true | - |
| capture_pod | Capture POD Photo | photo | true | POD_PHOTO |
| notes | Add Notes | optional | false | - |
| submit | Submit POD | confirmation | true | - |

### Box Packing (`BOX_PACKING`)
- Duration: 5 minutes per box
- Frequency: per box
- Roles: ops_manager

| Step | Title | Type | Required | Proof |
|------|-------|------|----------|-------|
| select_box | Select Box | selection | true | - |
| pack_contents | Pack Contents | checklist | true | - |
| shake_test | Shake Test | verification | true | - |
| zero_rattle | Zero Rattle Confirm | confirmation | true | - |
| weight_check | Weight Check | input | true | - |
| seal_box | Seal Box | confirmation | true | - |
| generate_label | Generate Label | action | true | - |

## Proof Requirements

| Code | Context | Min Size | GPS | Timestamp |
|------|---------|----------|-----|----------|
| PHOTO_SUPPLIES_INITIAL | Weekly visit start | 1MB | ✅ | ✅ |
| PHOTO_SYRUPS | Weekly syrup check | 1MB | ✅ | ✅ |
| CANISTER_DISASSEMBLY | Monthly deep clean | 1MB | ✅ | ✅ |
| GRINDER_DEEP_CLEAN | Monthly deep clean | 1MB | ✅ | ✅ |
| POD_PHOTO | Proof of delivery | 1MB | ✅ | ✅ |
| REFUSAL_PHOTO | Delivery refusal | 1MB | ✅ | ✅ |
| CLOSET_BEFORE | Refill start | 1MB | ✅ | ✅ |
| CLOSET_AFTER | Refill complete | 1MB | ✅ | ✅ |

## Events

### user_management
- `USER_CREATED`
- `USER_SITE_ASSIGNED`
- `USER_SITE_REVOKED`
- `USER_REVOKED`
- `USER_PASSWORD_RESET_FORCED`
- `USER_UNLOCKED`
- `USER_REACTIVATED`
- `USER_SESSIONS_INVALIDATED`
- `SESSION_INVALIDATED`

### workflow
- `WORKFLOW_STARTED`
- `WORKFLOW_COMPLETED`
- `WEEKLY_SUBMITTED`

### delivery
- `DELIVERY_POD_CREATED`
- `DELIVERY_ACCEPTED`
- `DELIVERY_REFUSED`
- `BOX_ACCEPTED`
- `BOX_REFUSED`

### shipment
- `SHIPMENT_CREATED`
- `PACKING_LOG_CREATED`
- `PACKING_LOG_EDITED`
- `LABEL_GENERATED`
- `LABEL_REPRINTED`

### site
- `SITE_CREATED`
- `DAY1_COMPLETED`

### incident
- `INCIDENT_RESOLVED`
- `MANAGER_OVERRIDE`

### admin
- `QR_CODE_GENERATED`
- `QR_CODE_REVOKED`
- `TEST_TENANTS_SEEDED`
- `EVIDENCE_PACKET_GENERATED`
- `FEATURE_FLAG_CHANGED`

### correction
- `data_fix`
- `clarification`
- `void`

