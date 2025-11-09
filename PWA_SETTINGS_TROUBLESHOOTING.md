# PWA Not Showing in iOS Settings - Troubleshooting

If your PWA is on your home screen but doesn't appear in iOS Settings, try these steps:

## Why PWAs Don't Always Appear in Settings

iOS sometimes doesn't register a PWA as a "real app" until it:
1. Requests a permission (like notifications, camera, etc.)
2. Is opened from the home screen (not Safari)
3. Has been used for a while

## Solution Steps

### Step 1: Remove and Re-add to Home Screen

1. **Delete the current home screen icon:**
   - Long press the icon on your home screen
   - Tap "Remove App" or the X
   - Confirm deletion

2. **Re-add it properly:**
   - Open Safari (not Chrome)
   - Go to your app URL
   - Tap the Share button (square with arrow)
   - Tap "Add to Home Screen"
   - Make sure the name is "Cursor Mobile" or "Cursor"
   - Tap "Add"

### Step 2: Open from Home Screen

**Important:** Open the app by tapping the home screen icon, NOT by opening Safari and going to the URL.

### Step 3: Request Notification Permission

1. **Open the app from home screen**
2. **Navigate to the chat page** (`/chat`)
3. **Click the bell icon** in the header
4. **Tap "Allow"** when the permission prompt appears

This permission request should make iOS recognize it as an app and it should appear in Settings.

### Step 4: Check Settings Again

After requesting notification permission:
1. Open iOS Settings app
2. Scroll down - your app should now appear
3. It might be listed as "Cursor Mobile" or "Cursor" (depending on what you named it)

## Alternative: Check Safari Website Settings

If it still doesn't appear in main Settings:

1. Go to **Settings > Safari**
2. Scroll down to **"Website Settings"** or **"Advanced"**
3. Look for your website URL
4. Check notification settings there

## Force iOS to Recognize the PWA

Sometimes you need to "activate" the PWA:

1. **Open from home screen** (not Safari)
2. **Request notification permission** (click bell icon)
3. **Use the app for a minute** (navigate around)
4. **Close the app completely**
5. **Reopen from home screen**
6. **Check Settings again**

## Verify It's Actually a PWA

In Safari, you can check if it's running as a PWA:

1. Open the app from home screen
2. Open Safari's developer console (if you have a Mac connected)
3. Check `window.navigator.standalone` - should be `true`
4. Or check the URL bar - should be minimal/not visible in standalone mode

## Still Not Working?

If it still doesn't appear after all these steps:

1. **Make sure you're using Safari** (not Chrome)
2. **Make sure you added it from Safari** (not Chrome)
3. **Try a different name** when adding to home screen
4. **Restart your iPhone** after adding to home screen
5. **Check iOS version** - PWAs work best on iOS 16.4+

## Quick Test

To verify the PWA is working:
- Open from home screen
- The URL bar should be minimal or hidden
- It should feel like a native app
- Check console for `window.navigator.standalone === true`

Once it appears in Settings, you can enable notifications there!

