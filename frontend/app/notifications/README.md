# iPhone PWA Notifications

This folder contains all notification-related functionality for the iPhone PWA.

## Quick Start

### 1. Show a Notification

```typescript
import { notifyMessageReady } from '@/app/notifications/utils';

// When a message is complete
await notifyMessageReady('Your code changes are ready!');
```

### 2. Using the Hook

```typescript
import { useNotifications } from '@/app/notifications/hooks';

function MyComponent() {
  const { notify, requestPermission, canNotify } = useNotifications();

  const handleMessageComplete = async () => {
    if (canNotify) {
      await notify({
        title: 'New Message',
        body: 'Your response is ready!',
        tag: 'message',
      });
    }
  };

  return (
    <button onClick={requestPermission}>
      Enable Notifications
    </button>
  );
}
```

### 3. Direct API Usage

```typescript
import { showNotification, requestNotificationPermission } from '@/app/notifications/utils';

// Request permission (must be from user interaction)
const granted = await requestNotificationPermission();

if (granted) {
  await showNotification({
    title: 'New Message',
    body: 'Your code is ready!',
    icon: '/icon-192.png',
    tag: 'new-message',
  });
}
```

## iPhone Requirements

For notifications to work on iPhone:

1. **Add to Home Screen**: The app must be added to the home screen
   - Open Safari on iPhone
   - Tap the Share button
   - Tap "Add to Home Screen"

2. **Request Permission**: Permission must be requested from a user interaction (button click)
   - Use the `NotificationPermissionButton` component
   - Or call `requestNotificationPermission()` from a button handler

3. **HTTPS Required**: App must be served over HTTPS (or localhost for development)

4. **Service Worker**: Already registered automatically via `ServiceWorkerRegistration` component

## Files Structure

```
app/notifications/
├── utils.ts                          # Core notification utilities
├── hooks.ts                          # React hook for notifications
├── components/
│   ├── NotificationPermissionButton.tsx  # UI component for requesting permission
│   └── ServiceWorkerRegistration.tsx      # Service worker registration
└── README.md                         # This file

public/
├── sw.js                             # Service worker (must be in public)
└── manifest.json                     # PWA manifest (must be in public)
```

## Icon Files Needed

You need to create these icon files in `public/`:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

These will be used as notification icons.

## Usage Example

```typescript
// In your chat component when message is complete
import { notifyMessageReady } from '@/app/notifications/utils';

useEffect(() => {
  if (messageComplete && !isAppInForeground()) {
    notifyMessageReady('Your AI response is ready!');
  }
}, [messageComplete]);
```

## Testing

1. Build and serve the app over HTTPS (or use localhost)
2. Open on iPhone Safari
3. Add to Home Screen
4. Open the app from home screen
5. Click "Enable Notifications" button
6. Test by calling `notifyMessageReady()` from your code

## Notes

- Notifications only show when app is in background or closed
- When app is in foreground, use in-app UI instead
- Service worker handles notifications when app is closed
- Each notification with the same `tag` replaces the previous one

