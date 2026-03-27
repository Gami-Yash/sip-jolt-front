# SIPJOLT Field Validation Guide v1.01

**Machine API Connectivity Check**

---

## Test Information

| Field | Value |
|-------|-------|
| Technician Name | __________________ |
| Date & Time | __________________ |
| Device ID | __________________ |
| Site Location | __________________ |

---

## PHASE 1: APP LOGIN & CONNECTIVITY (2 min)

### Test 1: App Launch & Login
**Navigation:** Open SIPJOLT App → Enter 4-digit Code → Ops Command Center

**Steps:**
1. Open the SIPJOLT app on your device
2. Enter Ops Manager code: **4782**
3. Wait for dashboard to load

**Expected Result:** Dashboard loads with dark theme, sidebar visible on left

| PASS | FAIL |
|:----:|:----:|
| [ ] | [ ] |

---

### Test 2: Diagnostics Health Check
**Navigation:** Sidebar → Diagnostics

**Steps:**
1. Click **Diagnostics** in the sidebar (bottom)
2. Check status indicators for: Yile API, Database
3. Run the test buttons if available

**Expected Result:** All indicators show GREEN / "healthy" status

**CRITICAL:** If Yile API shows RED, machine commands will not work!

| PASS | FAIL |
|:----:|:----:|
| [ ] | [ ] |

---

## PHASE 2: FLEET DASHBOARD & DEVICE (3 min)

### Test 3: Fleet Map Loading
**Navigation:** Sidebar → Fleet

**Steps:**
1. Click **Fleet** in the sidebar
2. Wait for map to load (may take a few seconds)
3. Look for machine markers on the map

**Expected Result:** Map displays with at least 1 device marker visible

Devices Found: __________

| PASS | FAIL |
|:----:|:----:|
| [ ] | [ ] |

---

### Test 4: Device Details Modal

**Steps:**
1. Tap/click the device marker for your machine
2. Click **"View Details"** in the popup
3. Verify all 4 tabs are present: Overview, Inventory, Recipes, Sales

**Expected Result:** Modal opens with 4 tabs, device status shows "Normal" or "Online"

| PASS | FAIL |
|:----:|:----:|
| [ ] | [ ] |

---

### Test 5: Inventory Tab Data

**Steps:**
1. Click the **Inventory** tab
2. Check that ingredient levels display with percentages
3. Compare app levels to physical machine display

**Expected Result:** Ingredient bars show % levels (e.g., Coffee Beans 75%)

**Note:** Levels should roughly match what's shown on the machine screen

| PASS | FAIL |
|:----:|:----:|
| [ ] | [ ] |

---

## PHASE 3: REPLENISHMENT CENTER (2 min)

### Test 6: Replenishment Sidebar Access
**Navigation:** Sidebar → Replenishment

**Steps:**
1. Click **Replenishment** in the sidebar
2. Select your device from the dropdown
3. Wait for inventory data to load

**Expected Result:** Inventory Levels panel displays with all ingredients listed

| PASS | FAIL |
|:----:|:----:|
| [ ] | [ ] |

---

### Test 7: Ingredient Mapping Check

**Steps:**
1. Verify these ingredients appear (if machine has them):
   - **Coffee Beans, Oat Milk, Matcha, Cocoa, Chai**
   - **Vanilla Syrup, Caramel Syrup, Hazelnut Syrup, Brown Sugar Syrup**
   - **Cups, Hot Water**

**Expected Result:** Ingredients show with correct names (not Chinese characters)

Missing ingredients: __________

| PASS | FAIL |
|:----:|:----:|
| [ ] | [ ] |

---

## PHASE 4: MACHINE CONTROL (5 min)

### Test 8: Machine Control Panel
**Navigation:** Sidebar → Machine Control

**Steps:**
1. Click **Machine Control** in the sidebar
2. Verify device dropdown shows your machine
3. Verify recipe dropdown populates with drinks
4. Check status badge shows ONLINE (green) or OFFLINE (red)

**Expected Result:** Both dropdowns have options, status shows ONLINE

| PASS | FAIL |
|:----:|:----:|
| [ ] | [ ] |

---

### Test 9: Test Brew Command

**Steps:**
1. Select a simple recipe (e.g., **Americano** or **Espresso**)
2. Click the green **Brew** button
3. Watch the machine - it should start brewing within 10 seconds
4. Check app shows success message: "Brew started!"

**Expected Result:** Machine begins brewing, app shows success message

**CRITICAL:** Have a cup ready! The machine will dispense the drink.

Recipe tested: __________

| PASS | FAIL |
|:----:|:----:|
| [ ] | [ ] |

---

### Test 10: Take Offline Toggle

**Steps:**
1. Click the red **Take Offline** button (WiFi-off icon)
2. Status badge should change to "OFFLINE" (red)
3. Brew button should become disabled (grayed out)
4. Click the button again to bring machine back online

**Expected Result:** Status toggles between ONLINE/OFFLINE, Brew button enables/disables

**Note:** This is for maintenance mode - use when servicing the machine

| PASS | FAIL |
|:----:|:----:|
| [ ] | [ ] |

---

## PHASE 5: FINAL VERIFICATION (1 min)

### Test 11: Physical Machine Check

**Steps:**
1. Check machine screen shows "Ready" or similar idle state
2. Verify machine WiFi indicator shows connected
3. Confirm no error messages on machine display

**Expected Result:** Machine is idle, connected, and error-free

| PASS | FAIL |
|:----:|:----:|
| [ ] | [ ] |

---

## TEST RESULTS SUMMARY

| Result | Count |
|--------|-------|
| PASSED | ____ / 11 |
| FAILED | ____ / 11 |

### VERDICT

- [ ] **ALL SYSTEMS GO** - Machine API Connected!
- [ ] **PARTIAL ISSUES** - Review failed tests
- [ ] **CRITICAL ISSUES** - Contact Support

---

## SIGN-OFF

| Technician Signature | Completion Time |
|---------------------|-----------------|
| __________________ | __________________ |

---

## TROUBLESHOOTING GUIDE

### Diagnostics shows RED for Yile API
1. Check machine is powered on and connected to WiFi
2. Wait 2 minutes and refresh the page
3. If still red, contact Michael immediately

### No devices appear on Fleet map
1. Refresh the page (pull down on mobile)
2. Check your internet connection
3. Try logging out and back in

### Recipe dropdown is empty
1. Select a different device, then select your device again
2. Wait 5 seconds for recipes to load
3. If still empty, the recipe catalog may need syncing

### Brew command sent but machine doesn't respond
1. Check machine isn't in cleaning or maintenance mode
2. Verify machine screen shows "Ready" state
3. Power cycle machine: OFF for 30 sec, then ON
4. Wait 2 minutes for reconnection, then retry

### Inventory shows 0% for all ingredients
1. This usually means API sync is delayed
2. Click the refresh button in Replenishment
3. Wait 30 seconds and check again

### Status shows "UNKNOWN"
1. Machine may have just come online
2. Refresh the page to get latest status
3. Check physical machine shows connected

---

**API Endpoints Tested:**
- `/api/v1.01/fleet/dashboard`
- `/api/v1.01/remote/devices`
- `/api/v1.01/remote/recipes/:id`
- `/api/v1.01/remote/brew`
- `/api/v1.01/replenishment/status/:id`
