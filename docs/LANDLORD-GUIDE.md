# LANDLORD_VIEWER Guide (v1.00 Sovereign OS)

## Your Role

As a landlord or property manager, you get visibility into what's happening at your buildings without needing to manage day-to-day operations. You can see:
- How your machines are being maintained
- Delivery and supply status
- Any open problems
- Weekly summary reports
- SAFE_MODE status for any sites

**Important**: Your access is read-only. You can view information but cannot change anything in the system.

---

## Part 1: What You Can See

### Your Dashboard

When you log in, you'll see an overview of your properties:

| Section | What It Shows |
|---------|---------------|
| Site Summary | All your buildings and their current status |
| SAFE_MODE Sites | Any machines with disabled powder dispensing |
| Recent Activity | Latest visits, deliveries, and events |
| Open Issues | Any problems that need attention |
| Weekly Digest | Summary of the past week |

### Site Status Colors

| Color | What It Means |
|-------|---------------|
| Green (ACTIVE) | Everything good, maintenance current |
| Yellow | Minor attention needed |
| Red (SAFE_MODE) | Machine powder disabled, recovery in progress |
| Gray (LOCKED) | Manually locked by operations |

---

## Part 2: Understanding SAFE_MODE

### What is SAFE_MODE?

When a site enters SAFE_MODE:
- The machine's powder dispensing is automatically disabled
- This protects the machine from damage
- A PARTNER_TECHNICIAN must complete recovery steps to unlock it

### What Triggers SAFE_MODE?

| Trigger | Explanation |
|---------|-------------|
| Acceptance Overdue | Building staff didn't confirm a delivery within 24 hours |
| Wet Leak | A moisture/leak problem was reported with supplies |
| Sync SLA Violation | Site hasn't synced data in over 1 hour |
| System Violation | Other automated safety triggers |

### How SAFE_MODE Gets Fixed (v1.00 Updated)

1. The system automatically notifies operations
2. A PARTNER_TECHNICIAN is assigned to the site
3. They complete "2-Point Recovery":
   - Photo of the machine's daily 3-digit code
   - Video of the powder squeeze test (3 seconds)
4. Once both are verified, the site unlocks

**v1.00 Change:** The Zonal Wide-Shot was removed for pilot simplification. Recovery now requires only 2 steps.

---

## Part 3: Viewing Your Sites

### Site List
You see all buildings under your portfolio. For each site:
- Building name and address
- Current status (ACTIVE, SAFE_MODE, LOCKED)
- Last visit date
- Any open issues

### Site Details
Click on any building to see:
- Full maintenance history
- Recent deliveries and their status
- Photos from visits
- SAFE_MODE history
- Any notes from the operations team

---

## Part 4: Understanding Maintenance

### Weekly Visits
PARTNER_TECHNICIANs check on each machine weekly. After each visit, you can see:
- Date and time of the visit
- What was checked
- Photos taken during the visit
- Any problems found

### Refill Workflow (v1.00 Simplified)
When supplies are restocked, PARTNER_TECHNICIANs must:
- Take before/after photos
- Complete a checklist
- Submit all proof to the system

**v1.00 Note:** Squeeze video removed from regular refill workflow for simplification.

---

## Part 5: Tracking Deliveries

### Delivery Status
Supplies are delivered regularly. For each delivery, you see:

| Status | What It Means |
|--------|---------------|
| Shipped | Supplies are on the way |
| Delivered | Driver confirmed drop-off (GPS verified within 50m) |
| Accepted | Building staff confirmed receipt |
| Refused | Problem reported (ops is handling it) |

---

## Part 6: Open Issues

The Open Issues section shows any problems being worked on.

### Issue Types You Might See

| Issue | What It Means |
|-------|---------------|
| Acceptance Overdue | Staff hasn't confirmed a delivery (triggers SAFE_MODE) |
| Wet/Leak Issue | Moisture problem with supplies (triggers SAFE_MODE) |
| Damaged Delivery | Something arrived damaged |
| Missing Items | Something expected didn't arrive |
| Machine Problem | Issue reported with the machine |
| Sync SLA Breach | Device didn't sync data within 1 hour |
| Clock Anomaly | Device clock was off by more than 30 minutes (v1.00) |

---

## Part 7: Weekly Digests

### What's in the Digest

| Section | Information |
|---------|-------------|
| Visits Completed | Which buildings were visited |
| Visits Missed | If any were skipped (with reason) |
| Deliveries | What was delivered where |
| Issues | Any problems and their status |
| SAFE_MODE Events | Sites that entered/exited SAFE_MODE |
| Overall Health | Summary score for your portfolio |

---

*Version: 4.0.0 (v1.00 Sovereign OS) | Last Updated: January 2026*
