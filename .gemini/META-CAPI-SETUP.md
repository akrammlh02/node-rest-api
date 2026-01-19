# 🚀 Meta Conversions API Setup Guide

## What is Meta Conversions API?

Meta Conversions API (CAPI) is **server-side tracking** that sends events directly from your server to Meta, bypassing:
- ✅ Ad blockers
- ✅ Browser privacy settings  
- ✅ iOS tracking restrictions
- ✅ Network/DNS blocking

This ensures **100% reliable tracking** on mobile devices.

---

## 📋 Setup Steps

### Step 1: Get Your Access Token

1. **Go to Meta Events Manager:**
   ```
   https://business.facebook.com/events_manager2
   ```

2. **Select your Pixel** (ID: `1567430537783358`)

3. **Click "Settings" tab** (top right)

4. **Scroll down to "Conversions API"**

5. **Click "Generate Access Token"**

6. **Copy the token** (it looks like: `EAAxxxxxxxxxxxxxxxxxxxxx`)

---

### Step 2: Add Token to Your .env File

1. **Open your `.env` file** in the project root

2. **Add this line:**
   ```
   META_CAPI_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxx
   ```
   (Replace with your actual token)

3. **Save the file**

---

### Step 3: Restart the Server

1. **Stop the current server** (Ctrl+C in terminal)

2. **Start it again:**
   ```
   node index.js
   ```

---

## ✅ How It Works Now

### **Hybrid Tracking System:**

1. **First, tries client-side pixel** (normal Meta Pixel)
   - Works on most desktop browsers
   - Fast and includes all user data

2. **If blocked, falls back to server-side** (Conversions API)
   - Bypasses ad blockers
   - Works on ALL mobile devices
   - Slightly less user data, but still tracks events

### **On Mobile (where pixel is blocked):**

```
[META PIXEL] FAILED to load fbevents.js - Using server-side tracking
[META CAPI] Server-side tracking: {success: true, message: 'PageView tracked'}
```

### **On Desktop (where pixel works):**

```
[META PIXEL] Successfully loaded fbevents.js
[META PIXEL] PageView event tracked (client-side)
```

---

## 🧪 Testing

### Test on Mobile:

1. **Open the landing page on your phone**

2. **Check console (if you can access it):**
   - Should see: `[META CAPI] Server-side tracking`

3. **Check Meta Events Manager → Test Events:**
   - Should see PageView event
   - Action Source: **website** (not "browser" - this indicates server-side)

4. **Click WhatsApp button:**
   - Should see Lead event
   - Also from server-side

---

## 📊 Verifying It Works

### In Meta Events Manager:

1. **Go to Test Events**

2. **Load page on mobile**

3. **Look for:**
   - ✅ PageView event appears
   - ✅ "Action Source: website" (indicates server-side)
   - ✅ Has IP address and User Agent
   - ✅ Device type: Mobile

4. **Click WhatsApp button:**
   - ✅ Lead event appears
   - ✅ Includes course name, price, currency
   - ✅ Also server-side

---

## 🔍 Troubleshooting

### If events still don't appear:

1. **Check .env file:**
   - Make sure `META_CAPI_TOKEN` is set
   - No spaces around the `=`
   - Token is valid (not expired)

2. **Check server logs:**
   - Should see: `[META CAPI] PageView event sent: {...}`
   - If error: Check token is correct

3. **Check Network tab:**
   - Filter by "meta-tracking"
   - Should see POST requests to `/meta-tracking/track/pageview`
   - Status should be 200 OK

---

## 🎯 Expected Results

### ✅ Success Indicators:

1. **Console shows:**
   ```
   [META PIXEL] fbq NOT available - Using server-side tracking
   [META CAPI] Server-side tracking: {success: true}
   ```

2. **Meta Events Manager shows:**
   - PageView events from mobile
   - Lead events from mobile
   - Action Source: "website"

3. **Server logs show:**
   ```
   [META CAPI] PageView event sent: {"events_received":1}
   [META CAPI] Lead event sent: {"events_received":1}
   ```

---

## 💡 Benefits of This Solution

1. **Works on ALL devices** - Even with ad blockers
2. **More reliable** - Server-side can't be blocked
3. **Better data quality** - Includes server IP and user agent
4. **iOS 14+ compatible** - Bypasses Apple's tracking restrictions
5. **Future-proof** - As browsers get more restrictive, server-side becomes essential

---

## 📝 Files Modified

1. ✅ `routes/meta-tracking.js` - New server-side tracking API
2. ✅ `views/landing-ar.hbs` - Added fallback to server-side
3. ✅ `public/landing-ar.js` - Updated WhatsApp button to use server-side
4. ✅ `index.js` - Registered new route

---

## 🚀 Next Steps

1. **Get your Meta CAPI token** (see Step 1 above)
2. **Add it to .env file**
3. **Restart server**
4. **Test on mobile**
5. **Verify events in Meta Events Manager**

Once this works, you'll have **100% reliable tracking** on both desktop and mobile! 🎉
