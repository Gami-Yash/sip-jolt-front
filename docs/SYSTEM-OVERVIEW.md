# SIPJOLT v1.01 - HOW THE SYSTEM WORKS (ONE PAGE)

## The Point
SIPJOLT runs a deterministic shipping + refill loop across buildings, using objective proof to eliminate disputes. The system is strict but shifted from punishment to rewards in v1.01.

**v1.01 Gate5 Shipping Framework**: Split delivery system optimized for landlord relationship management. 60-day ingredient cycle (6 boxes) + 90-day cup cycle (4 boxes, 30-day offset) ensures never more than 6 boxes per delivery except 2 collision days per year.

**Soft Warning System**: The system rewards performance. Technicians earn rewards for fast delivery acceptance and a daily "Coffee Perk" for staying current on tasks. App lockdowns are removed; instead, non-compliance triggers "Soft Warnings" which are logged for Ops Manager review.

## The Building Blocks (Objects)

| Object | What It Is |
|--------|------------|
| **Tenant** | A landlord or portfolio (data boundary) |
| **Site** | One building or location |
| **Shipment** | One delivery to one site |
| **Boxes** | The physical units inside a shipment |
| **Proof** | Photos + GPS (50m) + timestamps + scans |
| **Acceptance** | Accept or refuse per box (Bonus tiers for speed) |
| **Coffee Perk** | Daily reward for keeping the site current |
| **Lucky Spins** | Gamified rewards for high-performance technicians |
| **Points** | Engagement currency (500 pts = 1 Spin) |
| **Incidents/Tasks** | Exceptions + required actions to resolve |
| **Soft Warnings** | Dismissible alerts for non-compliance (logged to Ops) |

## The End-to-End Loop (Start to Finish)

### 1. Pack (Hub / Ops)
- Build shipment for a single site
- Assign boxes "1 of X"
- Record QC gate evidence (shake test, weight check, movement test)
- Seal and lock label (contents become fixed)

### 2. Deliver (Driver)
- Scan every box (custody proof)
- Capture POD photo proof at the site (GPS within 50m)
- Submit POD (Zero-Weight Rule)

### 3. Accept or Refuse (PARTNER_TECHNICIAN)
- Technician sees delivery in Action Rail with **v1.00 Bonus Tiers**
- **Incentive Windows**: 
  - ≤ 2h = +2 Spins (Tier 1)
  - ≤ 6h = +1 Spin (Tier 2)
- **Soft Warnings**: If acceptance is >24h, a warning appears but does NOT lock the app.

### 4. Refill (PARTNER_TECHNICIAN)
- Before photo -> refill checklist -> matcha check -> after photo
- Submit refill proof

### 5. Perfection & Vacation
- **Monthly Perfection**: Hit all targets (volume, speed, quality) for +3 Bonus Spins.
- **Vacation Race**: Annual competition. The top cumulative score wins an ALL EXPENSES PAID BEACH GETAWAY.

---

### 6. Exceptions (Automatic)
- Late acceptance (>24h) -> Soft Warning + Ops Notification
- Wet leak -> Incident creation + Technician Alert
- Sync SLA breach (>1h) -> Workflow Airlock (Hard Lock for data integrity)

### 7. Watchdog Automation (v1.00)
- Runs every **60 minutes** checking performance and compliance.
- Logs all "Soft Warning" dismissals for Ops Manager review.

## Responsibility Map

| Role | Responsibilities |
|------|------------------|
| **Ops / Hub** | Packing, QC gates, label lock, shipment creation, monitoring warnings, user management |
| **DRIVER** | Scan boxes, POD proof (GPS + photo only), delivery completion |
| **PARTNER_TECHNICIAN** | Accept/refuse (Speed Bonus), refill execution, daily coffee perk, maintaining performance score |
| **LANDLORD_VIEWER** | Read-only outcomes and open issues |

## The v1.00 Pull-Based Rules

1. **If it's not in the app as evidence, it didn't happen.**
2. **Evidence is immutable.** No edits or deletes.
3. **Speed is rewarded.** Accept within 2 hours for maximum Lucky Spins.
4. **Soft Warnings.** The app won't stop you, but Ops will know if you ignore rules.
5. **Zero-Weight Rule.** Drivers don't enter weights.
6. **50-Meter Geofence.** POD photos must be taken within 50 meters of the site.
7. **1-Hour Sync SLA.** Workflow Airlock triggers if sync is late.

*Version: 7.0.0 (v1.01 Gate5 OS) | Last Updated: January 2026*
