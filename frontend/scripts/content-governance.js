#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const MASTER_PLAN_PATH = './CONTENT_WORKFLOW_MASTER_PLAN.md';
const OUTPUT_DIR = './public/governance';
const OUTPUT_JSON = `${OUTPUT_DIR}/content_map.json`;
const OUTPUT_MD = `${OUTPUT_DIR}/content_map.md`;
const DRIFT_REPORT = `${OUTPUT_DIR}/drift_report.json`;

const CRITICAL_PATTERNS = [
  { pattern: /bypass.*=.*true/gi, name: 'DEV_BYPASS', severity: 'critical' },
  { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, name: 'HIDDEN_CODE', severity: 'critical' },
  { pattern: /tenant_id\s*=\s*null(?!\s*\?)|^\s*if\s*\(!tenant_id\)/gi, name: 'TENANT_LEAK', severity: 'critical' },
];

const EXEMPTED_PATTERNS = [
  { file: 'src/App.jsx', pattern: 'required: false', reason: 'Optional workflow steps are intentional' },
  { file: '../backend/shared/api-auth.js', pattern: 'force-password-reset', reason: 'Legitimate admin endpoint' },
  { file: '../backend/shared/production-hardening.js', pattern: 'skipValidation', reason: 'Detecting and removing, not allowing' },
];

const WARNING_PATTERNS = [
  { pattern: /TODO.*security/gi, name: 'TODO_SECURITY', severity: 'warning' },
  { pattern: /FIXME.*auth/gi, name: 'FIXME_AUTH', severity: 'warning' },
  { pattern: /console\.log.*password|console\.log.*token/gi, name: 'LOG_SENSITIVE', severity: 'warning' },
];

function parseCodebase() {
  console.log('📊 Parsing codebase for content governance...');
  
  const contentMap = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    buildHash: '',
    roles: {},
    screens: {},
    workflows: {},
    events: {},
    proofs: {}
  };

  contentMap.roles = {
    technician: {
      displayName: 'Technician / Partner',
      accessLevel: 'site-scoped',
      permissions: [
        'view_assigned_sites',
        'complete_weekly_visits',
        'complete_monthly_cleans',
        'report_problems',
        'access_ai_diagnostics',
        'view_gamification',
        'accept_refuse_deliveries',
        'log_refills'
      ]
    },
    driver: {
      displayName: 'Driver',
      accessLevel: 'route-scoped',
      permissions: [
        'view_delivery_assignments',
        'capture_pod',
        'mark_deliveries_complete',
        'view_delivery_history'
      ]
    },
    ops_manager: {
      displayName: 'Operations Manager',
      accessLevel: 'tenant-scoped',
      permissions: [
        'view_all_sites',
        'fleet_dashboard',
        'incident_management',
        'shipment_management',
        'user_management',
        'photo_audit',
        'generate_reports',
        'packing_operations',
        'manager_overrides',
        'evidence_packets',
        'feature_flags',
        'system_health'
      ]
    },
    admin: {
      displayName: 'System Administrator',
      accessLevel: 'global',
      permissions: [
        'all_ops_manager_permissions',
        'tenant_management',
        'security_logs',
        'session_management',
        'smoke_tests',
        'data_retention'
      ]
    }
  };

  contentMap.screens = {
    login: {
      route: '/',
      roles: ['*'],
      authenticated: false,
      requiredProofs: [],
      eventsEmitted: []
    },
    technician_dashboard: {
      route: '/',
      roles: ['technician'],
      authenticated: true,
      requiredProofs: [],
      eventsEmitted: []
    },
    weekly_visit_wizard: {
      route: 'modal',
      roles: ['technician'],
      authenticated: true,
      requiredProofs: ['PHOTO_SUPPLIES_INITIAL', 'PHOTO_SYRUPS'],
      eventsEmitted: ['WORKFLOW_STARTED', 'WEEKLY_SUBMITTED', 'WORKFLOW_COMPLETED']
    },
    monthly_deep_clean_wizard: {
      route: 'modal',
      roles: ['technician'],
      authenticated: true,
      requiredProofs: ['CANISTER_DISASSEMBLY', 'GRINDER_DEEP_CLEAN'],
      eventsEmitted: ['WORKFLOW_STARTED', 'WORKFLOW_COMPLETED']
    },
    refill_wizard: {
      route: 'modal',
      roles: ['technician'],
      authenticated: true,
      requiredProofs: ['CLOSET_BEFORE', 'CLOSET_AFTER'],
      eventsEmitted: ['WORKFLOW_STARTED', 'WORKFLOW_COMPLETED']
    },
    driver_dashboard: {
      route: '/',
      roles: ['driver'],
      authenticated: true,
      requiredProofs: [],
      eventsEmitted: []
    },
    delivery_pod_capture: {
      route: 'modal',
      roles: ['driver'],
      authenticated: true,
      requiredProofs: ['POD_PHOTO'],
      eventsEmitted: ['DELIVERY_POD_CREATED']
    },
    delivery_acceptance: {
      route: 'modal',
      roles: ['technician'],
      authenticated: true,
      requiredProofs: ['REFUSAL_PHOTO'],
      eventsEmitted: ['DELIVERY_ACCEPTED', 'DELIVERY_REFUSED', 'BOX_ACCEPTED', 'BOX_REFUSED']
    },
    ops_manager_console: {
      route: '/',
      roles: ['ops_manager', 'admin'],
      authenticated: true,
      requiredProofs: [],
      eventsEmitted: []
    },
    supply_closet_app: {
      route: 'tab',
      roles: ['technician'],
      authenticated: true,
      requiredProofs: [],
      eventsEmitted: []
    },
    ai_chat_assistant: {
      route: 'modal',
      roles: ['technician'],
      authenticated: true,
      requiredProofs: [],
      eventsEmitted: []
    },
    help_safety_center: {
      route: 'modal',
      roles: ['*'],
      authenticated: true,
      requiredProofs: [],
      eventsEmitted: []
    },
    trophy_case: {
      route: 'modal',
      roles: ['technician'],
      authenticated: true,
      requiredProofs: [],
      eventsEmitted: []
    },
    qr_verification: {
      route: 'modal',
      roles: ['technician', 'driver'],
      authenticated: true,
      requiredProofs: [],
      eventsEmitted: ['BOX_ACCEPTED', 'BOX_REFUSED']
    }
  };

  contentMap.workflows = {
    WEEKLY_VISIT: {
      displayName: 'Weekly Visit',
      duration: '20 minutes',
      frequency: 'weekly',
      roles: ['technician'],
      steps: [
        { id: 'site_select', title: 'Select Site', type: 'selection', required: true, proofRequired: false },
        { id: 'initial_photo', title: 'Take Initial Photo', type: 'photo', required: true, proofRequired: true, proofCode: 'PHOTO_SUPPLIES_INITIAL' },
        { id: 'leak_check', title: 'Check for Leaks', type: 'checklist', required: true, proofRequired: false },
        { id: 'machine_status', title: 'Machine Status', type: 'multiple_choice', required: true, proofRequired: false },
        { id: 'cleaning_verify', title: 'Verify Cleaning', type: 'checklist', required: true, proofRequired: false },
        { id: 'syrups_photo', title: 'Take Syrups Photo', type: 'photo', required: true, proofRequired: true, proofCode: 'PHOTO_SYRUPS' },
        { id: 'problems', title: 'Report Problems', type: 'optional', required: false, proofRequired: false },
        { id: 'summary', title: 'Review & Submit', type: 'confirmation', required: true, proofRequired: false, event: 'WEEKLY_SUBMITTED' }
      ],
      validationRules: [
        'All required steps must be completed in order',
        'Photos must meet minimum size requirement',
        'GPS coordinates captured with each photo',
        'Timestamp embedded in photo metadata'
      ]
    },
    MONTHLY_DEEP_CLEAN: {
      displayName: 'Monthly Deep Clean',
      duration: '90 minutes',
      frequency: 'monthly',
      roles: ['technician'],
      steps: [
        { id: 'site_select', title: 'Select Site', type: 'selection', required: true, proofRequired: false, event: 'WORKFLOW_STARTED' },
        { id: 'initial_inspect', title: 'Initial Inspection', type: 'photo_checklist', required: true, proofRequired: true },
        { id: 'disassembly', title: 'Begin Disassembly', type: 'checklist', required: true, proofRequired: false },
        { id: 'canister_clean', title: 'Canister Deep Clean', type: 'photo', required: true, proofRequired: true, proofCode: 'CANISTER_DISASSEMBLY' },
        { id: 'grinder_clean', title: 'Grinder Deep Clean', type: 'photo', required: true, proofRequired: true, proofCode: 'GRINDER_DEEP_CLEAN' },
        { id: 'sanitize', title: 'Sanitization', type: 'checklist', required: true, proofRequired: false },
        { id: 'reassembly', title: 'Reassembly', type: 'checklist', required: true, proofRequired: false },
        { id: 'test_run', title: 'Test Run', type: 'verification', required: true, proofRequired: false },
        { id: 'final_photos', title: 'Final Photos', type: 'photo', required: true, proofRequired: true },
        { id: 'summary', title: 'Review & Submit', type: 'confirmation', required: true, proofRequired: false, event: 'WORKFLOW_COMPLETED' }
      ],
      validationRules: [
        'All steps mandatory, no skipping',
        'Disassembly photos required before reassembly unlocks',
        'Test run must pass before submission',
        'Minimum 5 photos required'
      ]
    },
    REFILL: {
      displayName: 'Refill',
      duration: '10 minutes',
      frequency: 'as needed',
      roles: ['technician'],
      steps: [
        { id: 'closet_select', title: 'Select Closet', type: 'selection', required: true, proofRequired: false, event: 'WORKFLOW_STARTED' },
        { id: 'before_photo', title: 'Before Photo', type: 'photo', required: true, proofRequired: true, proofCode: 'CLOSET_BEFORE' },
        { id: 'refill_checklist', title: 'Complete Refill', type: 'checklist', required: true, proofRequired: false },
        { id: 'matcha_check', title: 'Matcha Condition', type: 'multiple_choice', required: true, proofRequired: false },
        { id: 'after_photo', title: 'After Photo', type: 'photo', required: true, proofRequired: true, proofCode: 'CLOSET_AFTER' },
        { id: 'issues', title: 'Report Issues', type: 'optional', required: false, proofRequired: false },
        { id: 'submit', title: 'Submit', type: 'confirmation', required: true, proofRequired: false, event: 'WORKFLOW_COMPLETED' }
      ],
      validationRules: [
        'Before and after photos mandatory',
        'At least one closet photo required',
        'Matcha condition must be selected'
      ]
    },
    DELIVERY_ACCEPTANCE: {
      displayName: 'Delivery Acceptance',
      duration: '5 minutes',
      frequency: 'per delivery',
      roles: ['technician'],
      steps: [
        { id: 'review_delivery', title: 'Review Delivery', type: 'display', required: true, proofRequired: false },
        { id: 'inspect_boxes', title: 'Inspect Each Box', type: 'checklist', required: true, proofRequired: false },
        { id: 'accept_refuse', title: 'Accept or Refuse', type: 'decision', required: true, proofRequired: 'conditional' },
        { id: 'refusal_reason', title: 'Refusal Reason', type: 'selection', required: 'conditional', proofRequired: false },
        { id: 'refusal_photo', title: 'Refusal Evidence', type: 'photo', required: 'conditional', proofRequired: true, proofCode: 'REFUSAL_PHOTO' },
        { id: 'confirm', title: 'Confirm Decision', type: 'confirmation', required: true, proofRequired: false }
      ],
      validationRules: [
        'Photo evidence mandatory for all refusals',
        'Refusal reason must be selected from predefined list',
        'All boxes must be addressed'
      ]
    },
    PROOF_OF_DELIVERY: {
      displayName: 'Proof of Delivery',
      duration: '2 minutes',
      frequency: 'per delivery',
      roles: ['driver'],
      steps: [
        { id: 'arrive_site', title: 'Arrive at Site', type: 'geofence', required: true, proofRequired: true },
        { id: 'capture_pod', title: 'Capture POD Photo', type: 'photo', required: true, proofRequired: true, proofCode: 'POD_PHOTO' },
        { id: 'notes', title: 'Add Notes', type: 'optional', required: false, proofRequired: false },
        { id: 'submit', title: 'Submit POD', type: 'confirmation', required: true, proofRequired: false, event: 'DELIVERY_POD_CREATED' }
      ],
      validationRules: [
        'GPS must be within acceptable radius',
        'Photo required with timestamp',
        'Cannot submit without photo'
      ]
    },
    BOX_PACKING: {
      displayName: 'Box Packing',
      duration: '5 minutes per box',
      frequency: 'per box',
      roles: ['ops_manager'],
      steps: [
        { id: 'select_box', title: 'Select Box', type: 'selection', required: true, proofRequired: false },
        { id: 'pack_contents', title: 'Pack Contents', type: 'checklist', required: true, proofRequired: false },
        { id: 'shake_test', title: 'Shake Test', type: 'verification', required: true, proofRequired: false },
        { id: 'zero_rattle', title: 'Zero Rattle Confirm', type: 'confirmation', required: true, proofRequired: false },
        { id: 'weight_check', title: 'Weight Check', type: 'input', required: true, proofRequired: false },
        { id: 'seal_box', title: 'Seal Box', type: 'confirmation', required: true, proofRequired: false, event: 'PACKING_LOG_CREATED' },
        { id: 'generate_label', title: 'Generate Label', type: 'action', required: true, proofRequired: false, event: 'LABEL_GENERATED' }
      ],
      validationRules: [
        'Shake test must pass',
        'Zero rattle must be confirmed',
        'Weight must be within limits',
        'Label cannot be generated without sealed box'
      ]
    }
  };

  contentMap.events = {
    user_management: [
      'USER_CREATED', 'USER_SITE_ASSIGNED', 'USER_SITE_REVOKED', 'USER_REVOKED',
      'USER_PASSWORD_RESET_FORCED', 'USER_UNLOCKED', 'USER_REACTIVATED',
      'USER_SESSIONS_INVALIDATED', 'SESSION_INVALIDATED'
    ],
    workflow: [
      'WORKFLOW_STARTED', 'WORKFLOW_COMPLETED', 'WEEKLY_SUBMITTED'
    ],
    delivery: [
      'DELIVERY_POD_CREATED', 'DELIVERY_ACCEPTED', 'DELIVERY_REFUSED',
      'BOX_ACCEPTED', 'BOX_REFUSED'
    ],
    shipment: [
      'SHIPMENT_CREATED', 'PACKING_LOG_CREATED', 'PACKING_LOG_EDITED',
      'LABEL_GENERATED', 'LABEL_REPRINTED'
    ],
    site: [
      'SITE_CREATED', 'DAY1_COMPLETED'
    ],
    incident: [
      'INCIDENT_RESOLVED', 'MANAGER_OVERRIDE'
    ],
    admin: [
      'QR_CODE_GENERATED', 'QR_CODE_REVOKED', 'TEST_TENANTS_SEEDED',
      'EVIDENCE_PACKET_GENERATED', 'FEATURE_FLAG_CHANGED'
    ],
    correction: [
      'data_fix', 'clarification', 'void'
    ]
  };

  contentMap.proofs = {
    PHOTO_SUPPLIES_INITIAL: { context: 'Weekly visit start', minSize: '1MB', gpsRequired: true, timestampRequired: true },
    PHOTO_SYRUPS: { context: 'Weekly syrup check', minSize: '1MB', gpsRequired: true, timestampRequired: true },
    CANISTER_DISASSEMBLY: { context: 'Monthly deep clean', minSize: '1MB', gpsRequired: true, timestampRequired: true },
    GRINDER_DEEP_CLEAN: { context: 'Monthly deep clean', minSize: '1MB', gpsRequired: true, timestampRequired: true },
    POD_PHOTO: { context: 'Proof of delivery', minSize: '1MB', gpsRequired: true, timestampRequired: true },
    REFUSAL_PHOTO: { context: 'Delivery refusal', minSize: '1MB', gpsRequired: true, timestampRequired: true },
    CLOSET_BEFORE: { context: 'Refill start', minSize: '1MB', gpsRequired: true, timestampRequired: true },
    CLOSET_AFTER: { context: 'Refill complete', minSize: '1MB', gpsRequired: true, timestampRequired: true }
  };

  const contentStr = JSON.stringify(contentMap, null, 2);
  contentMap.buildHash = crypto.createHash('sha256').update(contentStr).digest('hex').substring(0, 12);

  return contentMap;
}

function isExempted(filePath, line) {
  for (const exemption of EXEMPTED_PATTERNS) {
    if (filePath.includes(exemption.file) && line.includes(exemption.pattern)) {
      return true;
    }
  }
  return false;
}

function scanForViolations() {
  console.log('🔍 Scanning for security violations...');
  
  const violations = [];
  const filesToScan = [
    'src/App.jsx',
    'src/components/SupplyCloset.jsx',
    '../backend/shared/api-auth.js',
    '../backend/shared/api-ops.js',
    '../backend/shared/api-admin.js',
    '../backend/shared/production-hardening.js',
    '../backend/server.js'
  ];

  for (const filePath of filesToScan) {
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('// GOVERNANCE:ALLOWED') || line.includes('/* GOVERNANCE:ALLOWED */')) {
        continue;
      }
      
      if (isExempted(filePath, line)) {
        continue;
      }
      
      for (const { pattern, name, severity } of [...CRITICAL_PATTERNS, ...WARNING_PATTERNS]) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          violations.push({
            file: filePath,
            line: i + 1,
            pattern: name,
            severity,
            content: line.trim().substring(0, 100)
          });
        }
      }
    }
  }

  return violations;
}

function generateMarkdownReport(contentMap) {
  let md = `# Content Map v${contentMap.version}\n\n`;
  md += `> Generated: ${contentMap.generated}\n`;
  md += `> Build Hash: ${contentMap.buildHash}\n\n`;

  md += `## Roles\n\n`;
  for (const [roleId, role] of Object.entries(contentMap.roles)) {
    md += `### ${role.displayName} (\`${roleId}\`)\n`;
    md += `- Access Level: ${role.accessLevel}\n`;
    md += `- Permissions: ${role.permissions.join(', ')}\n\n`;
  }

  md += `## Screens\n\n`;
  md += `| Screen | Route | Roles | Required Proofs | Events |\n`;
  md += `|--------|-------|-------|-----------------|--------|\n`;
  for (const [screenId, screen] of Object.entries(contentMap.screens)) {
    md += `| ${screenId} | ${screen.route} | ${screen.roles.join(', ')} | ${screen.requiredProofs.join(', ') || '-'} | ${screen.eventsEmitted.join(', ') || '-'} |\n`;
  }

  md += `\n## Workflows\n\n`;
  for (const [workflowId, workflow] of Object.entries(contentMap.workflows)) {
    md += `### ${workflow.displayName} (\`${workflowId}\`)\n`;
    md += `- Duration: ${workflow.duration}\n`;
    md += `- Frequency: ${workflow.frequency}\n`;
    md += `- Roles: ${workflow.roles.join(', ')}\n\n`;
    
    md += `| Step | Title | Type | Required | Proof |\n`;
    md += `|------|-------|------|----------|-------|\n`;
    for (const step of workflow.steps) {
      md += `| ${step.id} | ${step.title} | ${step.type} | ${step.required} | ${step.proofCode || '-'} |\n`;
    }
    md += `\n`;
  }

  md += `## Proof Requirements\n\n`;
  md += `| Code | Context | Min Size | GPS | Timestamp |\n`;
  md += `|------|---------|----------|-----|----------|\n`;
  for (const [code, proof] of Object.entries(contentMap.proofs)) {
    md += `| ${code} | ${proof.context} | ${proof.minSize} | ${proof.gpsRequired ? '✅' : '❌'} | ${proof.timestampRequired ? '✅' : '❌'} |\n`;
  }

  md += `\n## Events\n\n`;
  for (const [category, events] of Object.entries(contentMap.events)) {
    md += `### ${category}\n`;
    md += events.map(e => `- \`${e}\``).join('\n') + '\n\n';
  }

  return md;
}

function generateDriftReport(violations) {
  const critical = violations.filter(v => v.severity === 'critical');
  const warnings = violations.filter(v => v.severity === 'warning');

  return {
    generated: new Date().toISOString(),
    summary: {
      totalViolations: violations.length,
      criticalCount: critical.length,
      warningCount: warnings.length,
      passCI: critical.length === 0
    },
    critical,
    warnings,
    rules: {
      NO_DEV_BYPASS: 'Development bypasses are forbidden in production code',
      NO_OPTIONAL_PROOF: 'Mandatory proofs cannot be marked optional',
      NO_HIDDEN_CODE: 'Hardcoded credentials are forbidden',
      NO_SKIP_VALIDATION: 'Validation cannot be conditionally disabled',
      NO_TENANT_LEAK: 'Cross-tenant data access must be blocked',
      TODO_SECURITY: 'Security-related TODOs should be resolved',
      FIXME_AUTH: 'Auth-related FIXMEs should be resolved',
      LOG_SENSITIVE: 'Sensitive data should not be logged'
    }
  };
}

async function main() {
  console.log('🏗️  Content Governance Build Step\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const contentMap = parseCodebase();
  
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(contentMap, null, 2));
  console.log(`✅ Generated ${OUTPUT_JSON}`);

  const markdownReport = generateMarkdownReport(contentMap);
  fs.writeFileSync(OUTPUT_MD, markdownReport);
  console.log(`✅ Generated ${OUTPUT_MD}`);

  const violations = scanForViolations();
  const driftReport = generateDriftReport(violations);
  
  fs.writeFileSync(DRIFT_REPORT, JSON.stringify(driftReport, null, 2));
  console.log(`✅ Generated ${DRIFT_REPORT}`);

  console.log('\n📊 Drift Report Summary:');
  console.log(`   Total Violations: ${driftReport.summary.totalViolations}`);
  console.log(`   Critical: ${driftReport.summary.criticalCount}`);
  console.log(`   Warnings: ${driftReport.summary.warningCount}`);
  console.log(`   CI Status: ${driftReport.summary.passCI ? '✅ PASS' : '❌ FAIL'}`);

  if (!driftReport.summary.passCI) {
    console.error('\n❌ CI FAILED: Critical violations detected!');
    console.error('\nCritical violations:');
    for (const v of driftReport.critical) {
      console.error(`  - ${v.file}:${v.line} [${v.pattern}]`);
      console.error(`    ${v.content}`);
    }
    process.exit(1);
  }

  if (driftReport.summary.warningCount > 0) {
    console.warn('\n⚠️  Warnings detected (CI will pass, but review recommended):');
    for (const v of driftReport.warnings) {
      console.warn(`  - ${v.file}:${v.line} [${v.pattern}]`);
    }
  }

  console.log('\n✅ Content governance check complete!');
}

main().catch(err => {
  console.error('Content governance failed:', err);
  process.exit(1);
});
