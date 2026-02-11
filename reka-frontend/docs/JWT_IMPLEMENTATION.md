# JWT Token Authentication Implementation Guide

## Overview
This project now uses JWT (JSON Web Token) for authentication. All API requests automatically include the authentication token.

## What Was Changed

### 1. Auth Store (`src/stores/auth.js`)
- Added `token` property to store the JWT token
- Updated `setAuthState()` to accept and store the token
- Added `updateToken()` function for token refresh
- Added `getToken()` function to retrieve the current token
- Token is persisted in localStorage as `reka_token`

### 2. Axios Configuration (`src/axios.js`) - NEW FILE
Created a centralized axios instance with:
- **Base URL**: `http://localhost:3000/api`
- **Request Interceptor**: Automatically adds `Authorization: Bearer <token>` header to all requests
- **Response Interceptor**: 
  - Handles token refresh from `x-new-token` header
  - Automatically logs out and redirects to login on 401/403 errors

### 3. Login Page (`src/pages/Bejelentkezes.vue`)
- Updated to use the configured axios instance
- Now stores the JWT token received from backend
- Changed import from `axios` to `../axios.js`
- Changed URL from full path to relative path (e.g., `/Bejelent`)

### 4. Sample Update (`src/pages/Raktar.vue`)
Updated as an example - other pages need similar updates.

## How to Update Other Components

For each Vue component that uses axios, make these changes:

### Step 1: Update the import
**Before:**
```javascript
import axios from 'axios'
```

**After:**
```javascript
import axios from '../axios.js'  // or '../../axios.js' depending on folder depth
```

### Step 2: Update API calls
**Before:**
```javascript
const response = await axios.post('http://localhost:3000/api/Partnerek_en_vevo', {
  id: authStore.ceg.id
})
```

**After:**
```javascript
const response = await axios.post('/Partnerek_en_vevo', {
  id: authStore.ceg.id
})
```

**Note:** Remove `http://localhost:3000/api` and keep only the endpoint path starting with `/`

## Files That Need Updating

Based on the project structure, these files need to be updated:

1. ✅ `src/pages/Bejelentkezes.vue` - DONE
2. ✅ `src/pages/Raktar.vue` - DONE
3. ⚠️ `src/pages/StorePartner.vue` - TODO
4. ⚠️ `src/pages/StoreMain.vue` - TODO
5. ⚠️ `src/pages/Regisztracio.vue` - TODO
6. ⚠️ `src/pages/Partnersegek.vue` - TODO
7. ⚠️ `src/pages/CegInfo.vue` - TODO

## Benefits

1. **Automatic Token Management**: Token is automatically added to all requests
2. **Token Refresh**: Backend can send refreshed tokens via `x-new-token` header
3. **Auto Logout**: Invalid/expired tokens automatically trigger logout
4. **Centralized Configuration**: Easy to change base URL or add global headers
5. **Better Security**: Token stored securely and managed consistently

## Backend Configuration

Your backend (`backend/middleware/auth.js`) already supports:
- Token verification with `authenticateToken` middleware
- Token refresh via `x-new-token` header
- Proper CORS headers with `Access-Control-Expose-Headers`

## Token Expiry

Current configuration:
- Login token: 10 minutes (as set in `backend/apik/bejelent.js`)
- Refresh token: 8 hours (as set in `backend/middleware/auth.js`)

The frontend will automatically:
- Send the token with every request
- Update the token when backend sends a refreshed one
- Logout and redirect to login when token expires

## Testing

1. Login to the application
2. Check browser DevTools > Application > Local Storage
3. You should see `reka_token` stored
4. Check Network tab - all API requests should have `Authorization: Bearer <token>` header
5. Token will be automatically refreshed on each authenticated request

## Security Notes

- Tokens are stored in localStorage (consider using httpOnly cookies for production)
- All authenticated endpoints should use the `authenticateToken` middleware
- Token expiry times can be adjusted in backend configuration
- Always use HTTPS in production to protect tokens in transit
