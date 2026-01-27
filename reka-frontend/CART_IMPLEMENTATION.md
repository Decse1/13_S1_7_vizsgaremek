# Cart Implementation Summary

## Overview
A complete shopping cart system has been implemented for the frontend application. The cart is tied to the logged-in user and stores data locally in the browser's localStorage.

## Features Implemented

### 1. Cart Store (`src/stores/cart.js`)
A reactive store that manages the cart state with the following features:

#### Stored Data:
- **companyId**: ID of the company from which products are being purchased
- **companyName**: Name of the company for display purposes
- **items**: Array of cart items with the following properties:
  - `id`: Product ID
  - `nev`: Product name
  - `ar`: Price (nettó)
  - `afa_kulcs`: VAT rate
  - `kiszereles`: Unit of measurement
  - `cikkszam`: Product code
  - `min_vas_menny`: Minimum purchase quantity
  - `quantity`: Current quantity in cart

#### Key Features:
- **User-specific cart**: Cart data is tied to the logged-in company (stored as `reka_cart_{companyId}` in localStorage)
- **Single company restriction**: Only products from one company can be in the cart at a time
- **Automatic conflict detection**: When adding products from a different company, user is prompted to clear the current cart
- **Persistent storage**: Cart data survives page refreshes and browser sessions
- **Auto-cleanup**: Cart is cleared when user logs out

#### Available Functions:
- `addToCart(item, quantity, companyId, companyName)` - Add item to cart
- `addToCartWithClear(item, quantity, companyId, companyName)` - Clear cart and add new item
- `removeFromCart(itemId)` - Remove specific item
- `updateQuantity(itemId, quantity)` - Update item quantity
- `clearCart()` - Clear entire cart
- `getItemCount()` - Get total number of items
- `getTotalPrice()` - Get total price (nettó)
- `getTotalPriceWithVAT()` - Get total price (bruttó)

### 2. StorePartner.vue Updates
Enhanced the partner store view with cart functionality:

#### New Features:
- **Add to Cart button**: Each product has a "Kosárba" button with quantity controls
- **Quantity management**: +/- buttons and manual input for each product
- **Minimum quantity enforcement**: Respects the `min_vas_menny` field
- **Conflict detection**: Shows confirmation modal when trying to add products from a different company
- **Success feedback**: Alerts user when products are added successfully

#### Confirmation Modal:
When adding products from a different company, a modal appears asking:
- Warns that current cart contents will be deleted
- Shows which company's products are currently in the cart
- Provides "Cancel" or "Yes, clear cart" options

### 3. Kosar.vue (Cart Page) Updates
Completely rebuilt the cart page with full functionality:

#### Display Features:
- **Company information**: Shows which company the order is for
- **Detailed product table** with columns:
  - Product name
  - Product code (cikkszám)
  - Unit price (nettó)
  - Quantity with unit
  - Total price per item (nettó)
  - Edit and Delete icons
- **Price summary**:
  - Total (nettó)
  - Total (bruttó) with VAT calculated
- **Empty state**: Friendly message when cart is empty

#### Actions:
- **Edit quantity**: Click pencil icon to open modal with +/- buttons and input field
- **Remove item**: Click trash icon to remove (with confirmation)
- **Clear cart**: Button to empty entire cart (with confirmation)
- **Place order**: Button to submit order (placeholder for future implementation)

#### Styling:
- Consistent table styling matching other views in the project
- Responsive design for mobile and desktop
- Modal dialogs for editing quantities
- Action icons with hover effects
- Teal theme buttons matching project design

## Technical Details

### Data Flow:
1. User adds product from `StorePartner.vue`
2. Cart store checks for conflicts and updates localStorage
3. Cart data is immediately available in `Kosar.vue`
4. All changes persist across page navigation and refreshes

### localStorage Structure:
```json
{
  "reka_cart_{companyId}": {
    "companyId": 123,
    "companyName": "Partner Company Ltd.",
    "items": [
      {
        "id": 1,
        "nev": "Product Name",
        "ar": 1000,
        "afa_kulcs": 27,
        "kiszereles": "db",
        "cikkszam": "ABC123",
        "min_vas_menny": 1,
        "quantity": 5
      }
    ]
  }
}
```

### Price Calculations:
- **Nettó (Net)**: Sum of (item.ar × item.quantity)
- **Bruttó (Gross)**: Sum of (item.ar × (1 + item.afa_kulcs/100) × item.quantity)

## Usage

### Adding Products to Cart:
1. Navigate to a partner's store page (`/store-partner/:id`)
2. Adjust quantity using +/- buttons or manual input
3. Click "Kosárba" button
4. If adding from different company, confirm or cancel in modal

### Viewing Cart:
1. Navigate to `/kosar` page
2. See all items, quantities, and prices
3. Edit quantities by clicking pencil icon
4. Remove items by clicking trash icon
5. Clear entire cart with "Kosár ürítése" button

### Placing Order:
1. Review cart contents in `/kosar`
2. Click "Rendelés leadása" button
3. (Future: This will integrate with backend order system)

## Future Enhancements
- Backend integration for order placement
- Order history tracking
- Email confirmations
- Saved carts functionality
- Bulk edit capabilities
- Export cart as PDF/Excel

## Notes
- Cart is client-side only (frontend localStorage)
- Cart is user-specific (tied to logged-in company ID)
- VAT calculations are automatic based on product VAT rate
- Minimum purchase quantities are enforced
- All prices are formatted in Hungarian Forint (Ft)
