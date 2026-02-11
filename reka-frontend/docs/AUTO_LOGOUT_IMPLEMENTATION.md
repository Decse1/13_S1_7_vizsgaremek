# Auto Logout Implementation

## Overview
Implemented automatic logout functionality that logs users out after 30 seconds of inactivity (for testing purposes). In production, this should be changed to 10 minutes (600,000ms).

## Changes Made

### 1. auth.js - Authentication Store
Added automatic logout timer functionality:

- **`tokenExpiry`**: Added to authStore to track when the session will expire
- **`autoLogoutTimer`**: Timer variable to manage the logout timeout
- **`setupAutoLogout()`**: Function that sets up a 30-second timer and stores the expiry time
- **`clearAutoLogout()`**: Function to clear the timer when user logs out
- **`resetActivityTimer()`**: New exported function to reset the timer on user activity

### 2. Modified Functions

#### `loadAuthState()`
- Now checks if stored token has expired on page load/refresh
- Calculates remaining time and sets up timer accordingly
- Automatically logs out if token is expired

#### `setAuthState(user, ceg, token)`
- Sets up auto logout timer when user logs in
- Stores expiry time in localStorage

#### `updateToken(newToken)`
- Resets auto logout timer when token is refreshed by backend
- Updates expiry time in localStorage

#### `clearAuthState()`
- Clears the auto logout timer
- Removes token expiry from localStorage

### 3. axios.js - HTTP Interceptor
- Import `resetActivityTimer` from auth store
- Call `resetActivityTimer()` on every successful API response
- This resets the 30-second timer whenever user makes an API call (activity detected)

## How It Works

1. **On Login**: 30-second timer starts
2. **On API Call**: Timer resets to 30 seconds
3. **On Token Refresh**: Timer resets to 30 seconds
4. **On Page Reload**: Checks if stored token expired, if not continues with remaining time
5. **After 30 Seconds of Inactivity**: User is automatically logged out and redirected to login page

## Configuration

To change the timeout duration, modify `TIMEOUT_DURATION` in `auth.js`:

```javascript
// Current setting (30 seconds for testing)
const TIMEOUT_DURATION = 30000;

// Production setting (10 minutes)
const TIMEOUT_DURATION = 600000;
```

## Testing

1. Log in to the application
2. Wait 30 seconds without making any API calls
3. You should be automatically logged out and redirected to the login page
4. Try logging in again and make an API call - the timer should reset

## Storage

The following items are stored in localStorage:
- `reka_token`: JWT token
- `reka_user`: User information
- `reka_ceg`: Company information
- `reka_token_expiry`: Timestamp when token will expire (NEW)
