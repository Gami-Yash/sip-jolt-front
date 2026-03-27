import { useState, useEffect } from 'react';
import { Book, Shield, AlertTriangle, ChevronDown, ChevronRight, Users, Monitor, Workflow, Camera, Bell, Lock, X } from 'lucide-react';

const CONTENT_VERSION = '1.0.0';

const CONTENT_MAP = {
  version: CONTENT_VERSION,
  roles: {
    partner_technician: {
      displayName: 'Partner/Technician',
      description: 'Field workers responsible for machine maintenance, refills, site operations, and delivery acceptance. The primary on-site role for the SIPJOLT system.',
      permissions: ['View assigned sites', 'Complete weekly visits', 'Complete monthly deep cleans', 'Report problems', 'Access AI diagnostics', 'Accept/refuse deliveries', 'Log refills', 'Exit SAFE_MODE via 2-Point Recovery']
    },
    driver: {
      displayName: 'Driver',
      description: 'Delivery personnel responsible for transporting supplies and capturing proof of delivery',
      permissions: ['View delivery assignments', 'Capture proof of delivery', 'Mark deliveries complete', 'View delivery history']
    },
    ops_manager: {
      displayName: 'Operations Manager',
      description: 'Supervisors with fleet visibility, incident management, and administrative capabilities',
      permissions: ['View all sites', 'Fleet dashboard', 'Incident management', 'Shipment management', 'User management', 'Photo audit', 'Generate reports']
    }
  },
  workflows: {
    weekly_visit: {
      displayName: 'Weekly Visit',
      duration: '~20 minutes',
      description: 'Routine maintenance check performed weekly at each site',
      steps: [
        { title: 'Select Site', description: 'Choose your assigned location' },
        { title: 'Take Initial Photo', description: 'Capture the supplies area before starting', required: true, proofType: 'photo' },
        { title: 'Check for Leaks', description: 'Inspect machine for any water or product leaks' },
        { title: 'Machine Status', description: 'Report the current machine condition' },
        { title: 'Verify Cleaning', description: 'Confirm cleaning tasks are complete' },
        { title: 'Take Syrups Photo', description: 'Capture the syrup levels and condition', required: true, proofType: 'photo' },
        { title: 'Report Problems', description: 'Log any issues found (optional)' },
        { title: 'Review & Submit', description: 'Confirm all information and submit' }
      ]
    },
    monthly_deep_clean: {
      displayName: 'Monthly Deep Clean',
      duration: '~90 minutes',
      description: 'Comprehensive cleaning including machine disassembly',
      steps: [
        { title: 'Select Site', description: 'Choose your assigned location' },
        { title: 'Initial Inspection', description: 'Document starting condition', required: true, proofType: 'photo' },
        { title: 'Begin Disassembly', description: 'Carefully remove components' },
        { title: 'Canister Deep Clean', description: 'Clean and sanitize canisters', required: true, proofType: 'photo' },
        { title: 'Grinder Deep Clean', description: 'Clean the grinder mechanism', required: true, proofType: 'photo' },
        { title: 'Sanitization', description: 'Apply sanitizing solution' },
        { title: 'Reassembly', description: 'Put components back together' },
        { title: 'Test Run', description: 'Verify machine works properly' },
        { title: 'Final Photos', description: 'Document completed state', required: true, proofType: 'photo' },
        { title: 'Review & Submit', description: 'Confirm and submit' }
      ]
    },
    refill: {
      displayName: 'Refill (v1.00.1 Streamlined)',
      duration: '~10 minutes',
      description: 'Restock supplies in the closet. Simplified workflow with before/after photo proof.',
      steps: [
        { title: 'Select Closet', description: 'Choose which closet to refill' },
        { title: 'Before Photo', description: 'Capture current state before refilling', required: true, proofType: 'photo' },
        { title: 'Complete Refill', description: 'Restock all items on the checklist' },
        { title: 'Matcha Condition', description: 'Check matcha quality' },
        { title: 'After Photo', description: 'Capture completed state', required: true, proofType: 'photo' },
        { title: 'Report Issues', description: 'Log any problems (optional)' },
        { title: 'Submit', description: 'Confirm and submit' }
      ]
    },
    delivery_acceptance: {
      displayName: 'Delivery Acceptance',
      duration: '~5 minutes',
      description: 'Accept or refuse incoming deliveries',
      steps: [
        { title: 'Review Delivery', description: 'See what was delivered' },
        { title: 'Inspect Boxes', description: 'Check each box for damage' },
        { title: 'Accept or Refuse', description: 'Make your decision for each box' },
        { title: 'Refusal Reason', description: 'If refusing, select why', conditional: true },
        { title: 'Refusal Photo', description: 'Take photo of any damage', required: true, proofType: 'photo', conditional: true },
        { title: 'Confirm', description: 'Finalize your decision' }
      ]
    }
  },
  proofRequirements: {
    title: 'Photo Requirements',
    rules: [
      { icon: 'camera', rule: 'Photos should be clear and well-lit' },
      { icon: 'location', rule: 'Location is automatically captured' },
      { icon: 'clock', rule: 'Timestamp is automatically added' },
      { icon: 'warning', rule: 'Refusal photos are mandatory' }
    ]
  },
  securityInfo: {
    title: 'Security & Privacy',
    items: [
      'Your session is protected and encrypted',
      'Photos are stored securely in the cloud',
      'All actions are logged for accountability',
      'Your data is only visible to authorized managers'
    ]
  }
};

function Section({ title, icon: Icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

function WorkflowSteps({ steps }) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${step.conditional ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.required ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
            {index + 1}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{step.title}</span>
              {step.required && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Required</span>}
              {step.proofType === 'photo' && <Camera className="w-4 h-4 text-gray-500" />}
              {step.conditional && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">If refusing</span>}
            </div>
            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HelpCenter({ onClose, userRole = 'technician' }) {
  const [activeTab, setActiveTab] = useState('workflows');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <Book className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white">Help Center</h2>
              <p className="text-xs text-blue-100">Content v{CONTENT_VERSION}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('workflows')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'workflows' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Workflow className="w-4 h-4 inline mr-2" />
            Workflows
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'roles' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Roles
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Security
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'workflows' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                These are the guided workflows you can complete. Each step must be done in order.
              </p>
              
              {Object.entries(CONTENT_MAP.workflows).map(([id, workflow]) => (
                <Section key={id} title={workflow.displayName} icon={Workflow}>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">{workflow.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Duration: {workflow.duration}</p>
                  </div>
                  <WorkflowSteps steps={workflow.steps} />
                </Section>
              ))}

              <Section title="Photo Requirements" icon={Camera}>
                <div className="space-y-3">
                  {CONTENT_MAP.proofRequirements.rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700">{rule.rule}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Different users have different access levels based on their role.
              </p>
              
              {Object.entries(CONTENT_MAP.roles).map(([id, role]) => (
                <Section key={id} title={role.displayName} icon={Users} defaultOpen={id === userRole}>
                  <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((perm, i) => (
                        <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </Section>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <Section title="Security & Privacy" icon={Lock} defaultOpen>
                <div className="space-y-3">
                  {CONTENT_MAP.securityInfo.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Important Rules" icon={AlertTriangle}>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-800">Refusal Photo Required</p>
                    <p className="text-xs text-red-600 mt-1">You must take a photo when refusing any delivery</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-800">Complete All Steps</p>
                    <p className="text-xs text-yellow-600 mt-1">Workflows must be completed in order - no skipping</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">Actions Are Logged</p>
                    <p className="text-xs text-blue-600 mt-1">All your actions are recorded for accountability</p>
                  </div>
                </div>
              </Section>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Content is locked and versioned. Contact your manager for questions.
          </p>
        </div>
      </div>
    </div>
  );
}
