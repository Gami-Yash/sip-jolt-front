# DRIVER Field Guide (v1.01 Gate5 OS)

## Your Role

You deliver supplies to buildings with Jolt Automated Barista machines. Your main jobs are:
- Scan every box you pick up (proves you have it)
- Deliver boxes to the right building
- Take a Proof of Delivery (POD) photo at each stop
- Complete the delivery in the app

**Zero-Weight Rule** - You do NOT enter weights. The Hub is the sole source of mass-balance truth via the 5-Gate QC system.

---

## Part 1: Understanding the Delivery Chain

1. **Ops packs the boxes** -> 5-Gate QC verification
2. **You scan each box** -> Proves you received custody
3. **You deliver to the site** -> GPS tracks your location
4. **You take a POD photo** -> Proves you were there (must be within 50m)
5. **PARTNER_TECHNICIAN accepts** -> Starts the speed bonus window

---

## Part 2: POD Requirements

### The 50-Meter Rule
Your GPS must show you're within 50 meters of the delivery site to submit. overrides are logged as LOCATION_ANOMALY events for Ops Manager review.

### Photo Quality
The app uses **ProofAssist** to ensure photos are:
- Not blurry
- Well-lit
- Correct size (>1MB)
- Contain all boxes

---

## Part 3: Ghost Delivery (v1.00)

In some sites, you will perform **Ghost Deliveries** (unattended drop-offs).
- Use the site-specific closet access code provided in the app.
- Ensure the POD photo clearly shows the boxes inside the secure area.
- Ghost deliveries still require the 50-meter GPS validation.

---

*Version: 7.0.0 (v1.01 Gate5 OS) | Last Updated: January 2026*
