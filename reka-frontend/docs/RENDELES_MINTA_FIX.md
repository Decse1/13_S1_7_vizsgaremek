# Rendeles_Minta Backend Fix Required

## Issue
The `rendeles_minta` field is being sent from the frontend but appears as NULL in the database for new company registrations.

## Root Cause
In the backend file `backend_new/apik/regisztral.js`, the required fields validation for non-subscribing companies (`elofiz: false`) does NOT include `rendeles_minta`:

```javascript
if(fizet === 1){
    requiredFields = ['adoszam', 'nev', 'cim', 'szamla_minta', 'rendeles_minta', 'szamlaszam'];
}
else{
    requiredFields = ['adoszam', 'nev', 'cim', 'szamlaszam']; // <-- rendeles_minta is missing here!
}
```

## Solution
Update the backend `regisztral.js` file to include `rendeles_minta` in the required fields for non-subscribing companies:

```javascript
if(fizet === 1){
    requiredFields = ['adoszam', 'nev', 'cim', 'szamla_minta', 'rendeles_minta', 'szamlaszam'];
}
else{
    requiredFields = ['adoszam', 'nev', 'cim', 'szamlaszam', 'rendeles_minta']; // <-- ADD rendeles_minta here
}
```

## Frontend Changes Made
- Added fallback value `|| "-"` to ensure `rendeles_minta` is never empty
- Added console.log to debug the data being sent
- The form already has the required attribute on the input field

## Testing
After updating the backend:
1. Register a new company
2. Check the database to verify `rendeles_minta` is populated with the value from the form
3. Verify validation works (error message if field is empty)
