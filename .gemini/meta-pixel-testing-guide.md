# 🔧 Meta Pixel Mobile Fix - Testing Guide

## ✅ Changes Applied

### 1. **Disabled CSP Temporarily** (`index.js`)
The Content Security Policy has been **temporarily disabled** to test if it was blocking Meta Pixel on mobile.

**Location:** Lines 62-76 in `index.js`

```javascript
// TEMPORARILY DISABLED FOR TESTING - Remove comments after confirming Meta Pixel works
/*
app.use((req, res, next) => {
  // CSP code commented out
});
*/
```

### 2. **Simplified Meta Pixel Code** (`landing-ar.hbs`)
Replaced custom implementation with the **official Facebook Pixel code** (standard, unmodified).

**Location:** Lines 24-40 in `landing-ar.hbs`

### 3. **WhatsApp Button Delay** (`landing-ar.js`)
Already fixed - 600ms delay before redirect to allow Lead event to fire.

---

## 📱 **TESTING INSTRUCTIONS**

### **Step 1: Test on Mobile Phone**

1. **Clear your phone's browser cache:**
   - Android Chrome: Settings → Privacy → Clear browsing data
   - iOS Safari: Settings → Safari → Clear History and Website Data

2. **Open the landing page on your phone:**
   ```
   http://[YOUR_IP]:3000/course/landing-ar?id=14
   ```
   Replace `[YOUR_IP]` with your computer's local IP address (e.g., `192.168.1.100`)

3. **Check if the page loads:**
   - ✅ Page should load completely
   - ✅ YouTube video should now play (CSP disabled)
   - ✅ No errors visible

### **Step 2: Check Meta Events Manager**

1. **Go to Meta Events Manager:**
   ```
   https://business.facebook.com/events_manager2
   ```

2. **Select your Pixel:** ID `1567430537783358`

3. **Click "Test Events"** in the left sidebar

4. **Open the landing page on your phone** (from Step 1)

5. **Look for events in real-time:**
   - ✅ **PageView** event should appear immediately
   - Device: Mobile
   - Browser: Chrome/Safari
   
6. **Click the WhatsApp button** on your phone

7. **Look for Lead event:**
   - ✅ **Lead** event should appear after ~600ms
   - Should include course name, price, currency

---

## 🔍 **Debugging Steps**

### If PageView Still Doesn't Fire on Mobile:

1. **Enable Remote Debugging:**

   **For Android:**
   - Connect phone via USB
   - Enable USB debugging on phone
   - Open Chrome on PC → `chrome://inspect`
   - Click "Inspect" on your phone's page
   - Check Console for errors

   **For iOS:**
   - Connect iPhone via USB to Mac
   - Enable Web Inspector (Settings → Safari → Advanced)
   - Open Safari on Mac → Develop → [Your iPhone]
   - Check Console for errors

2. **Check Console for:**
   - ❌ `fbq is not defined` → Script didn't load
   - ❌ `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT` → Ad blocker
   - ❌ Any red errors related to Facebook

3. **Check Network Tab:**
   - Filter by "facebook"
   - Look for: `fbevents.js` (should be 200 OK)
   - Look for: `tr/?id=1567430537783358` (should be 200 OK)

4. **Test manually in Console:**
   ```javascript
   // Type this in mobile browser console:
   window.fbq
   // Should return: function() { ... }
   
   // If it works, try:
   fbq('track', 'Lead')
   // Check Meta Events Manager for event
   ```

---

## 🎯 **Expected Results**

### ✅ **Success Indicators:**

1. **On Mobile:**
   - Page loads without errors
   - YouTube video plays
   - WhatsApp button works with 600ms delay
   - No console errors

2. **In Meta Events Manager (Test Events):**
   - PageView appears when page loads
   - Lead appears when WhatsApp button clicked
   - Events show "Mobile" as device type

3. **In Meta Events Manager (Overview - after 15-30 min):**
   - Events appear in dashboard
   - Mobile traffic is tracked
   - Conversion data is available

---

## 🚨 **If It Still Doesn't Work**

### Possible Issues:

1. **Ad Blocker on Phone:**
   - Disable any ad blockers
   - Try in Incognito/Private mode

2. **DNS/Network Issues:**
   - Try on mobile data instead of WiFi
   - Try different network

3. **Browser Issues:**
   - Try different browser (Chrome vs Safari)
   - Update browser to latest version

4. **Meta Pixel ID Wrong:**
   - Verify Pixel ID: `1567430537783358`
   - Check in Meta Events Manager if this ID is correct

5. **Facebook Blocked in Region:**
   - Some networks block Facebook
   - Try VPN or mobile data

---

## 📊 **Next Steps After Testing**

### If Meta Pixel Works Now:

1. **Re-enable CSP with correct settings:**
   - Uncomment the CSP code in `index.js`
   - Ensure it includes all necessary domains
   - Test again to confirm it still works

2. **Monitor for 24-48 hours:**
   - Check Meta Events Manager daily
   - Verify mobile events are being tracked
   - Check campaign performance

### If Meta Pixel Still Doesn't Work:

1. **Check Meta Pixel Helper:**
   - Install "Meta Pixel Helper" Chrome extension
   - Test on desktop first
   - See what events are firing

2. **Contact Meta Support:**
   - If pixel works on desktop but not mobile
   - Provide Pixel ID and error details

3. **Alternative: Use Meta Conversions API:**
   - Server-side tracking (more reliable)
   - Not affected by ad blockers or CSP

---

## 📝 **Files Modified**

1. ✅ `index.js` - CSP temporarily disabled
2. ✅ `landing-ar.hbs` - Simplified Meta Pixel code
3. ✅ `landing-ar.js` - WhatsApp button delay (already done)

---

## ⚠️ **IMPORTANT NOTES**

- **CSP is currently DISABLED** - This is for testing only
- **Security risk** - Re-enable CSP after confirming Meta Pixel works
- **Test on real mobile device** - Emulators may not show real behavior
- **Clear cache** - Always clear browser cache when testing
- **Wait for events** - Test Events is real-time, Overview takes 15-30 min

---

## 🎉 **Success Criteria**

✅ PageView fires on mobile (visible in Test Events)
✅ Lead fires on WhatsApp button click (visible in Test Events)
✅ YouTube video plays on mobile
✅ No console errors on mobile
✅ Events appear in Overview after 15-30 minutes
✅ Mobile attribution works for ad campaigns

---

## 🔄 **Re-enabling CSP (After Testing)**

Once Meta Pixel works, uncomment the CSP in `index.js` and use this configuration:

```javascript
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "connect-src 'self' https://*.facebook.com https://*.facebook.net https://www.facebook.com https://*.doubleclick.net; " +
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://connect.facebook.net https://*.facebook.com; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://*.facebook.com https://www.facebook.com; " +
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.facebook.com;"
  );
  next();
});
```

This allows:
- ✅ Meta Pixel scripts
- ✅ Meta Pixel connections
- ✅ YouTube embeds
- ✅ Google Fonts
- ✅ All necessary resources
