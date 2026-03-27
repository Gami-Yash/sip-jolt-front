// v1.01 - Updated role system with Barista Specialist rebrand
export const USER_ROLES = {
  BARISTA_SPECIALIST: 'barista_specialist',
  DELIVERY_SPECIALIST: 'delivery_specialist',
  OPS_MANAGER: 'ops_manager',
  ADMIN: 'admin',
  LANDLORD_VIEWER: 'landlord_viewer'
};

export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.BARISTA_SPECIALIST]: 'SIPJOLT Barista Specialist',
  [USER_ROLES.DELIVERY_SPECIALIST]: 'Delivery Specialist',
  [USER_ROLES.OPS_MANAGER]: 'Operations Manager',
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.LANDLORD_VIEWER]: 'Landlord Viewer',
  'partner_technician': 'SIPJOLT Barista Specialist',
  'driver': 'Delivery Specialist'
};

export const ROLE_DESCRIPTIONS = {
  [USER_ROLES.BARISTA_SPECIALIST]: 'Maintains and refills SIPJOLT machines, ensures quality and freshness',
  [USER_ROLES.DELIVERY_SPECIALIST]: 'Delivers ingredients and supplies to site locations',
  [USER_ROLES.OPS_MANAGER]: 'Oversees operations, manages alerts and escalations',
  [USER_ROLES.ADMIN]: 'Full system access and configuration',
  [USER_ROLES.LANDLORD_VIEWER]: 'Read-only access to site performance dashboards'
};

export const LEGACY_ROLE_MAP = {
  'partner_technician': USER_ROLES.BARISTA_SPECIALIST,
  'driver': USER_ROLES.DELIVERY_SPECIALIST,
  'PARTNER_TECHNICIAN': USER_ROLES.BARISTA_SPECIALIST,
  'DRIVER': USER_ROLES.DELIVERY_SPECIALIST
};

export function normalizeRole(role) {
  if (!role) return USER_ROLES.BARISTA_SPECIALIST;
  const normalized = role.toLowerCase();
  return LEGACY_ROLE_MAP[role] || LEGACY_ROLE_MAP[normalized] || normalized;
}

export function getDisplayName(role) {
  if (!role) return 'SIPJOLT Barista Specialist';
  return ROLE_DISPLAY_NAMES[role] || ROLE_DISPLAY_NAMES[normalizeRole(role)] || role;
}

export default {
  USER_ROLES,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  LEGACY_ROLE_MAP,
  normalizeRole,
  getDisplayName
};
