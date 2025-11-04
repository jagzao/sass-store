# Manual Cart Testing Guide

## Cart Bug Fix - Verification Steps

### What Was Fixed:
1. **cart-store.ts** - `addItem()` now accepts `quantity` parameter and adds the exact amount
2. **page.tsx & products/page.tsx** - Removed inefficient loops, now pass quantity directly
3. **ProductCard.tsx** - Already correctly passing quantity (line 56)

### Testing Instructions:

1. **Clear Browser Storage First**
   - Open DevTools (F12)
   - Go to Application tab
   - Clear Storage → Clear site data
   - This removes old corrupted cart data

2. **Navigate to tenant**
   - Go to http://localhost:3001/t/nom-nom
   - Wait for page to load completely

3. **Test "Productos Destacados"**
   - Find first product (e.g., "Tacos de Pastor")
   - Use + button to set quantity to **3**
   - Click "Comprar ahora"
   - **Expected**: Cart should show 3 items

4. **Navigate back and add more**
   - Go back to /t/nom-nom
   - Find different product (e.g., "Tacos de Carnitas")
   - Set quantity to **2**
   - Click "Comprar ahora"
   - **Expected**: Cart should now show both products with correct quantities

5. **Verify Cart Page**
   - Cart should display:
     - Tacos de Pastor: quantity 3
     - Tacos de Carnitas: quantity 2
   - Total items: 5
   - Subtotal should be correct

### Code Flow:
```
ProductCard (quantity=3)
  → onAddToCart(id, 3)
    → handleAddToCart(id, 3)
      → addItem({...}, 3)
        → Zustand store: quantity: item.quantity + 3
          → localStorage persist
            → Cart page reads from store
              → Filters by tenant
                → Displays items
```

### If Still Broken:

Check these potential issues:

1. **Browser cache not cleared**
   - Old JavaScript bundle still loaded
   - Solution: Hard refresh (Ctrl+Shift+R)

2. **localStorage corrupted**
   - Old cart data with wrong schema
   - Solution: Clear Application → Local Storage → sass-store-cart

3. **Dev server not restarted**
   - Changes not compiled
   - Solution: Kill server, delete .next, restart

4. **Tenant filtering issue**
   - Cart page filters by variant.tenant
   - Verify items have correct tenant in variant

### Debug in Console:

```javascript
// Check cart store state
const store = JSON.parse(localStorage.getItem('sass-store-cart'))
console.log(store.state.items)

// Should show:
// [
//   { sku: "...", name: "Tacos de Pastor", quantity: 3, variant: { tenant: "nom-nom" } },
//   { sku: "...", name: "Tacos de Carnitas", quantity: 2, variant: { tenant: "nom-nom" } }
// ]
```

### Key Fix Details:

**BEFORE (BROKEN):**
```typescript
addItem: (newItem) => {
  // Always added +1 regardless of quantity needed
  updatedItems = [...state.items, { ...newItem, quantity: 1 }];
}
```

**AFTER (FIXED):**
```typescript
addItem: (newItem, quantity = 1) => {
  if (existingItem) {
    // ADD the specified quantity
    updatedItems = state.items.map(item =>
      item.sku === newItem.sku
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  } else {
    // Create with exact quantity
    updatedItems = [...state.items, { ...newItem, quantity }];
  }
}
```

**Integration (FIXED):**
```typescript
// No more inefficient loop
addItem({ sku, name, price, image, variant }, quantity); // Single atomic call
```
