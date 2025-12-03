# Role Update Solution

## Problem
When an admin changes a user's role in the database (e.g., from student to faculty), the change is not immediately reflected in the user's portal because:
1. The user's JWT token contains the old role
2. The frontend caches user data in localStorage and Zustand store
3. The user would need to logout and login again to see the change

## Solution Implemented

### Backend (Already Working)
The authentication middleware already fetches fresh user data from the database on each request:
- `apps/api/src/middleware/auth.ts` - Calls `getEnhancedUserRole()` on every request
- `apps/api/src/services/roleService.ts` - Fetches current role from database
- `apps/api/src/routes/auth.ts` - `/me` endpoint returns current user info with updated role

### Frontend (New Implementation)

#### 1. Added `refreshUserData()` Function
**File**: `apps/web/src/stores/authStore.ts`

New function that:
- Calls `/api/v1/auth/me` endpoint
- Fetches current user data with updated role
- Updates all storage systems (localStorage, sessionStorage, persistent auth)
- Updates Zustand store state

```typescript
refreshUserData: async () => {
  const response = await apiClient.get('/auth/me');
  if (response.success && response.data?.user) {
    // Update user in all storage systems
    sessionManager.setUserData(updatedUser);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
    persistentAuth.saveSession(...);
    set({ user: updatedUser });
  }
}
```

#### 2. Created `useUserRefresh` Hook
**File**: `apps/web/src/hooks/useUserRefresh.ts`

Hook that:
- Refreshes user data immediately on mount
- Sets up periodic refresh (default: every 5 minutes)
- Only runs when user is authenticated
- Cleans up interval on unmount

```typescript
export function useUserRefresh(intervalMs: number = 5 * 60 * 1000) {
  // Refresh immediately
  refreshUserData();
  
  // Set up periodic refresh
  const interval = setInterval(() => {
    refreshUserData();
  }, intervalMs);
}
```

#### 3. Integrated into AppLayout
**File**: `apps/web/src/components/layout/AppLayout.tsx`

Added the hook to AppLayout so it runs for all authenticated users:
```typescript
// Refresh user data every 5 minutes to catch role changes
useUserRefresh(5 * 60 * 1000);
```

## How It Works

### Automatic Refresh
1. User logs in and navigates to any page
2. `AppLayout` component mounts
3. `useUserRefresh` hook triggers immediately
4. User data is fetched from `/api/v1/auth/me`
5. Updated role is stored in all caches
6. UI updates automatically (sidebar, navigation, permissions)
7. Process repeats every 5 minutes

### Manual Refresh
Users can also manually refresh by:
1. Navigating to a different page (triggers re-render)
2. Refreshing the browser page
3. Calling `refreshUserData()` from the auth store

## Timeline

### Immediate (< 1 second)
- When user navigates to a new page after role change
- When user manually refreshes browser

### Automatic (< 5 minutes)
- Background refresh every 5 minutes
- Catches role changes without user action

## Testing

### To Test Role Changes:

1. **As Admin**:
   - Login to admin portal
   - Change a user's role in the database
   - (e.g., update User collection: `{ email: "student@srmap.edu.in", role: "faculty" }`)

2. **As User (whose role was changed)**:
   - Wait up to 5 minutes OR
   - Navigate to a different page OR
   - Refresh the browser
   - Role should update automatically
   - Sidebar navigation should change
   - Permissions should update

### Verification:
```javascript
// In browser console
localStorage.getItem('srm_portal_user')
// Should show updated role
```

## Benefits

✅ **No Logout Required**: Users don't need to logout/login  
✅ **Automatic Updates**: Roles update within 5 minutes  
✅ **Immediate Option**: Navigate or refresh for instant update  
✅ **Secure**: Always fetches from server, never trusts cached data  
✅ **Efficient**: Only refreshes every 5 minutes, not on every request  
✅ **Transparent**: Users don't notice the refresh happening  

## Configuration

To change the refresh interval, modify the parameter in `AppLayout.tsx`:

```typescript
// Refresh every 2 minutes
useUserRefresh(2 * 60 * 1000);

// Refresh every 10 minutes
useUserRefresh(10 * 60 * 1000);

// Refresh every 30 seconds (for testing)
useUserRefresh(30 * 1000);
```

## API Endpoint

**GET** `/api/v1/auth/me`

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@srmap.edu.in",
      "name": "User Name",
      "role": "faculty",  // Updated role
      "isCoordinator": false,
      "isGroupLeader": false
    },
    "permissions": [...]
  }
}
```

## Notes

- The backend already supported this - it always checks the database for current role
- The frontend was caching old data - now it refreshes periodically
- JWT tokens still contain the old role, but the backend ignores it and checks the database
- This solution works for all user data changes, not just role updates

## Future Enhancements

Possible improvements:
1. WebSocket notifications for instant role updates
2. Admin action to force user session refresh
3. User notification when role changes
4. Audit log of role changes
