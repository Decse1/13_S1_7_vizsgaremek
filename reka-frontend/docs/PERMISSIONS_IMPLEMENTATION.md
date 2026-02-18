# User Permissions Implementation

## Overview
The user permission system has been updated from the old `kategoria` field to a more granular `jogkor` (permissions) object. This provides better control over what each user can do in the system.

## Backend Changes
The backend (`bejelent.js`) now sends user permissions in the `jogkor` object:

```javascript
felhasznalo: {
    id: felhasznalo.id,
    nev: felhasznalo.nev,
    jogkor: {
        rendeles_osszkesz: 1,  // TINYINT from MySQL (0 or 1)
        rendeles_lead: 1,       // TINYINT from MySQL (0 or 1)
        szamla_keszit: 1,       // TINYINT from MySQL (0 or 1)
        raktar_kezel: 1         // TINYINT from MySQL (0 or 1)
    },
    telephely_cim: felhasznalo.telephely_cim,
    telefon: felhasznalo.telefon
}
```

**Important Note:** MySQL BOOLEAN/TINYINT columns return numeric values (0 or 1), not JavaScript booleans. The helper functions handle both formats.

## Frontend Changes

### 1. Authentication Store (`auth.js`)
Added helper functions to check permissions:

```javascript
// Import helpers
import authStore, { hasPermission, isAdmin } from '../stores/auth.js';

// Check specific permission
hasPermission('raktar_kezel')  // Returns true/false

// Check if user is admin (has all permissions)
isAdmin()  // Returns true/false
```

### 2. Login Process (`Bejelentkezes.vue`)
Updated to log permissions on successful login:
- Permissions are automatically stored in `authStore.user.jogkor`
- Console logs the permissions for debugging

### 3. Permission Checks in Components

#### Old Way (DEPRECATED):
```javascript
// ❌ Don't use this anymore
if (authStore.user.kategoria == 1) {
  // Admin actions
}
```

#### New Way:
```javascript
// ✅ Check for admin (all permissions)
import { isAdmin } from '../stores/auth.js';
if (isAdmin()) {
  // Admin actions
}

// ✅ Check specific permission
import { hasPermission } from '../stores/auth.js';
if (hasPermission('szamla_keszit')) {
  // Invoice creation actions
}

// ✅ Direct access to permissions
if (authStore.user?.jogkor?.raktar_kezel) {
  // Warehouse management actions
}
```

## Available Permissions

| Permission | Description | Usage Example |
|------------|-------------|---------------|
| `rendeles_osszkesz` | Can assemble/complete orders | Order management pages |
| `rendeles_lead` | Can submit new orders | Order submission forms |
| `szamla_keszit` | Can create invoices | Invoice generation |
| `raktar_kezel` | Can manage warehouse | Inventory management |

## Migration Guide

### For Components Using `kategoria == 1`

1. **Import the helper functions:**
   ```javascript
   import { isAdmin, hasPermission } from '../stores/auth.js';
   ```

2. **Replace kategoria checks:**
   ```javascript
   // Before:
   v-if="authStore.user.kategoria == 1"
   
   // After (for admin checks):
   v-if="isAdmin()"
   
   // Or use specific permission:
   v-if="hasPermission('raktar_kezel')"
   ```

3. **In script setup or methods:**
   ```javascript
   // Before:
   if (authStore.user.kategoria == 1) {
     // do something
   }
   
   // After:
   if (isAdmin()) {
     // do something
   }
   ```

## Files That Need Migration

The following files still reference the old `kategoria` field and need to be updated:

1. **CegInfo.vue** - Multiple checks for company data editing
2. **Regisztracio.vue** - Sets kategoria on registration
3. **JWT_QUICK_REFERENCE.md** - ✅ Already updated

## Testing

After migration, verify:
1. Login stores permissions correctly (check browser console logs)
2. Permission-based UI elements show/hide correctly
3. Actions requiring permissions work as expected
4. Users without permissions are properly restricted

## Example: Complete Permission Check

```vue
<template>
  <!-- Show button only if user can manage warehouse -->
  <button 
    v-if="hasPermission('raktar_kezel')"
    @click="openWarehouse"
  >
    Manage Warehouse
  </button>
  
  <!-- Show admin panel only for users with all permissions -->
  <div v-if="isAdmin()" class="admin-panel">
    <h2>Admin Controls</h2>
    <!-- Admin-only content -->
  </div>
</template>

<script>
import authStore, { hasPermission, isAdmin } from '../stores/auth.js';

export default {
  setup() {
    return {
      authStore,
      hasPermission,
      isAdmin
    };
  }
};
</script>
```

## Notes

- The `jogkor` object is stored in localStorage along with other user data
- Permissions are checked on the frontend for UI/UX, but backend should also validate
- All four permissions set to `true` (or `1`) is equivalent to the old `kategoria == 1`
- Token expiry still applies (10 minutes from login/refresh)
- **MySQL stores BOOLEAN as TINYINT**, so permissions come as `0` or `1` instead of `true`/`false`. The helper functions (`hasPermission` and `isAdmin`) handle both formats automatically.
