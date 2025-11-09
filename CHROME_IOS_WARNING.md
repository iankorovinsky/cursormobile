# ⚠️ Chrome on iOS Limitation

## Important: Use Safari for iPhone PWAs

**Chrome on iOS has very limited PWA support** and notifications will likely not work properly.

### Why Chrome on iOS doesn't work well:

1. **Chrome on iOS is just a wrapper** - It uses Safari's WebKit engine underneath
2. **No proper Service Worker support** - Service Workers are required for background notifications
3. **Limited "Add to Home Screen"** - PWAs don't work the same way as in Safari
4. **No notification support** - iOS restricts notifications to Safari-based PWAs

### ✅ Solution: Use Safari

**Steps to get notifications working on iPhone:**

1. **Open the app in Safari** (not Chrome)
   - Copy the URL from Chrome
   - Paste it in Safari

2. **Add to Home Screen from Safari:**
   - Tap the Share button (square with arrow)
   - Tap "Add to Home Screen"
   - Tap "Add"

3. **Open the app from Home Screen** (not from Safari)

4. **Enable notifications:**
   - Tap the bell icon in the header
   - Tap "Allow" when prompted

5. **Test notifications:**
   - Tap the bell icon to test
   - Send a prompt that results in `[TASK COMPLETE]`

### How to tell if you're using Safari:

- ✅ Safari: URL bar at bottom, can add to home screen properly
- ❌ Chrome: Different UI, limited PWA features

### Debugging:

Check the browser console for:
- `✅ Service Worker registered` - Good!
- `⚠️ Chrome on iOS detected` - Switch to Safari
- `❌ Service Worker registration failed` - Expected on Chrome iOS

### Alternative: Use ngrok with HTTPS

If you need to test from Chrome, use ngrok with HTTPS:
```bash
ngrok http 3000
```

Then access via the HTTPS URL in Safari (not Chrome).

---

**TL;DR: For iPhone PWAs with notifications, you MUST use Safari, not Chrome.**

