# Product List Page (PLP) Wireframe

## Layout Structure

```
[Header: Persistent navigation]
[Breadcrumb: Home > Products > Category]
[Filters Sidebar (desktop) | Filter Chip Bar (mobile)]
[Product Grid: 2x3 mobile, 3x4 tablet, 4x5 desktop]
[Mini-Cart Overlay: Slides in from right when items added]
[Quick Actions Dock: Fixed bottom position]
```

## Key Components

### Filter System

**Desktop Sidebar:**

- **Price Range**: Dual slider with live updates
- **Categories**: Collapsible tree structure
- **Brand**: Checkbox list with search
- **Rating**: Star rating filter
- **Availability**: In stock toggle

**Mobile Chip Bar:**

- **Horizontal Scroll**: Filter chips with active states
- **Sort Dropdown**: Price, popularity, rating, newest
- **Filter Modal**: Tap "Filters" to open full-screen overlay

### Product Grid

**Product Cards (Mobile-First):**

```
[Product Image: Aspect ratio 1:1]
[Brand Name: Small text, muted color]
[Product Title: 2 lines max, ellipsis overflow]
[Price: Bold, primary color]
[Rating: Stars + review count]
[Add Button: Full width, primary style]
```

**1-Click Add to Cart:**

- **Button State**: "Add to Cart" → Loading spinner → Success checkmark
- **Animation**: Card briefly scales up, success feedback
- **Mini-Cart**: Auto-opens after first add, shows running total
- **Undo Option**: "Undo" link in mini-cart for 5 seconds

### Mini-Cart Overlay

```
[Header: "Cart (3 items)" with close X]
[Item List: Image, name, quantity controls, remove]
[Subtotal: Running calculation]
[CTA: "Checkout" button (full width, primary)]
[Continue Shopping: Ghost button]
```

**Smart Features:**

- **Auto-collapse**: Closes after 3 seconds of inactivity
- **Persistent**: Reopens on subsequent adds
- **Quick Quantity**: +/- buttons with haptic feedback
- **Related Items**: "Customers also bought" suggestions

### Instant Filters (No Page Reload)

- **URL Sync**: Filter state preserved in URL
- **Debounced Search**: 300ms delay on text input
- **Loading States**: Skeleton cards during filter application
- **Result Count**: "Showing 24 of 156 products"
- **Clear All**: Reset filters button when active

## Performance Features

### Optimistic UI

- **Instant Feedback**: Filter changes show immediately
- **Background Sync**: Actual results load in background
- **Error Handling**: Rollback on failure with toast message

### Progressive Loading

- **Initial Load**: First 12 products
- **Infinite Scroll**: Load more on scroll (desktop)
- **Load More Button**: Mobile "Show More" button
- **Image Optimization**: WebP with JPEG fallback

### Virtual Scrolling (Desktop)

- **Large Catalogs**: Render only visible items
- **Scroll Position**: Maintain position on filter changes
- **Memory Management**: Cleanup off-screen items

## Accessibility & Mobile UX

### Touch Optimization

- **Target Size**: Minimum 44px touch targets
- **Gesture Support**: Swipe to dismiss mini-cart
- **Haptic Feedback**: Success vibration on add to cart

### Keyboard Navigation

- **Tab Order**: Logical flow through filters and products
- **Shortcuts**: Arrow keys for grid navigation
- **Search Focus**: Cmd+K from anywhere

### Screen Reader Support

- **Live Regions**: Announce filter results and cart updates
- **Product Labels**: Complete product information read aloud
- **Status Updates**: Loading and success states announced

## Error States

### Network Issues

- **Offline Mode**: Show cached products with "offline" indicator
- **Failed Loads**: Retry button with error message
- **Slow Connection**: Progressive loading with skeleton UI

### Empty States

- **No Results**: Helpful suggestions and filter reset option
- **No Products**: Encourage browsing other categories
- **Search Results**: "Did you mean..." suggestions

## Click Optimization

### Purchase Flow (≤3 clicks)

1. **Click 1**: Add to cart from PLP (opens mini-cart)
2. **Click 2**: "Checkout" from mini-cart overlay
3. **Click 3**: "Complete Order" (with saved payment)

### Quick Actions

- **Wishlist**: Heart icon on product cards
- **Quick View**: Product modal without leaving PLP
- **Compare**: Select multiple products for side-by-side view
