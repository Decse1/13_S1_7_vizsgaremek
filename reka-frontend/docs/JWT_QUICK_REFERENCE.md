# Quick Reference - JWT Authentication

## For New API Endpoints

When adding a new API endpoint or component:

### 1. Import the configured axios
```javascript
import axios from '../axios.js';  // Adjust path as needed
```

### 2. Make API calls with relative paths
```javascript
// ✅ Correct
const response = await axios.post('/YourEndpoint', { data });

// ❌ Wrong
const response = await axios.post('http://localhost:3000/api/YourEndpoint', { data });
```

### 3. No need to manually add token
The axios interceptor automatically adds the `Authorization` header:
```javascript
// This happens automatically:
headers: {
  'Authorization': 'Bearer <your-jwt-token>'
}
```

## Auth Store Functions

### Get current token
```javascript
import { getToken } from '../stores/auth.js';
const token = getToken();
```

### Check if user is authenticated
```javascript
import authStore from '../stores/auth.js';
if (authStore.isAuthenticated) {
  // User is logged in
}
```

### Get current user info
```javascript
import authStore from '../stores/auth.js';
const userId = authStore.user?.id;
const userName = authStore.user?.nev;
const userPermissions = authStore.user?.jogkor;
```

### Check user permissions
```javascript
import authStore, { hasPermission, isAdmin } from '../stores/auth.js';

// Check specific permission
if (hasPermission('raktar_kezel')) {
  // User can manage warehouse
}

// Check if user has all permissions (admin)
if (isAdmin()) {
  // User is admin (has all permissions)
}

// Available permissions:
// - rendeles_osszkesz (order assembly)
// - rendeles_lead (order submission)
// - szamla_keszit (invoice creation)
// - raktar_kezel (warehouse management)
```

### Get company info
```javascript
import authStore from '../stores/auth.js';
const companyId = authStore.ceg?.id;
const companyName = authStore.ceg?.nev;
```

### Manual logout
```javascript
import { clearAuthState } from '../stores/auth.js';
import { useRouter } from 'vue-router';

const router = useRouter();

function logout() {
  clearAuthState();
  router.push('/bejelentkezes');
}
```

## Backend Endpoint Protection

To protect a backend endpoint with JWT authentication:

```javascript
const authenticateToken = require('./middleware/auth');

// Protected route
router.post('/YourProtectedEndpoint', authenticateToken, async (req, res) => {
  // req.user contains the decoded token data
  const userId = req.user.id;
  const userName = req.user.nev;
  const userRole = req.user.role;
  
  // Your endpoint logic here
});
```

## Error Handling

Axios interceptor automatically handles authentication errors:

- **401 Unauthorized**: Token invalid/expired → Auto logout
- **403 Forbidden**: Insufficient permissions → Auto logout

For custom error handling in components:
```javascript
try {
  const response = await axios.post('/YourEndpoint', { data });
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data.uzenet);
  } else {
    // Network error
    console.error('Network error');
  }
}
```

## Token Refresh

Token refresh happens automatically! The backend sends a new token in the `x-new-token` header on each authenticated request, and the axios interceptor updates it automatically.

No action needed in your components.

## Debugging Tips

### Check if token exists
```javascript
// In browser console
localStorage.getItem('reka_token')
```

### Check token in Network tab
1. Open DevTools → Network tab
2. Make an API request
3. Check request headers for: `Authorization: Bearer <token>`
4. Check response headers for: `x-new-token` (if refreshed)

### Clear token manually (for testing)
```javascript
// In browser console
localStorage.removeItem('reka_token')
localStorage.removeItem('reka_user')
localStorage.removeItem('reka_ceg')
```

## Common Patterns

### Protected Page Component
```javascript
<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from '../axios.js';
import authStore from '../stores/auth.js';

const router = useRouter();

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/bejelentkezes');
  }
});

// Your component logic with axios calls
const fetchData = async () => {
  const response = await axios.post('/YourEndpoint', {
    id: authStore.ceg.id
  });
  // Handle response
};
</script>
```

### Login Component Pattern
```javascript
<script setup>
import axios from '../axios.js';
import { setAuthState } from '../stores/auth.js';
import { useRouter } from 'vue-router';

const router = useRouter();

const login = async () => {
  try {
    const response = await axios.post('/Bejelent', {
      username: username.value,
      password: password.value
    });
    
    if (response.data.ok) {
      setAuthState(
        response.data.felhasznalo,
        response.data.ceg,
        response.data.token
      );
      router.push('/kezdolap');
    }
  } catch (error) {
    // Handle error
  }
};
</script>
```

---

**Need Help?** Check `JWT_IMPLEMENTATION_SUMMARY.md` for detailed documentation.
