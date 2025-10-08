# Product Detail Page (PDP) Wireframe

## Layout Structure

```
[Header: Persistent navigation with back button]
[Product Gallery: Swipeable images with thumbnails]
[Product Info: Title, price, rating, description]
[Variant Selection: Size, color, quantity]
[Add to Cart CTA: Primary button, full width mobile]
[Product Tabs: Details, Reviews, Related]
[Related Products: Horizontal scroll carousel]
[Quick Actions Dock: Context-aware options]
```

## Key Components

### Product Gallery

**Mobile Layout:**

- **Main Image**: Full-width, pinch-to-zoom enabled
- **Thumbnail Strip**: Horizontal scroll below main image
- **Swipe Gestures**: Left/right to navigate images
- **Image Counter**: "2 of 5" indicator

**Desktop Layout:**

- **Thumbnail Column**: Left side, vertical stack
- **Main Image**: Large center display with zoom hover
- **Fullscreen Mode**: Click to open lightbox gallery

### Product Information

```
[Brand Badge: Small pill with brand name]
[Product Title: H1, 2-3 lines max]
[Price Display: Current price + crossed-out original if on sale]
[Rating: Star display + "(24 reviews)" link]
[Key Features: Bullet points, max 3-4 items]
[Stock Status: "In Stock" green or "2 left" warning]
```

### Variant Selection (If Applicable)

**Size Selector:**

- **Button Group**: Visual size options (S, M, L, XL)
- **Size Guide**: Link to popup size chart
- **Out of Stock**: Disabled states with strikethrough

**Color Selector:**

- **Color Swatches**: Visual color circles with names
- **Color Names**: Shown on hover/selection
- **Stock Indication**: Gray overlay on unavailable colors

**Quantity Selector:**

- **Stepper Control**: -/+ buttons with number input
- **Stock Limit**: Max quantity based on availability
- **Bulk Discount**: "Buy 3, save 15%" messaging

### Add to Cart Section

```
[Quantity Selector: -/+ controls]
[Add to Cart Button: Primary, full width mobile]
[Wishlist Button: Heart icon, secondary style]
[Share Button: Share icon with native share API]
```

**Smart Features:**

- **Price Calculation**: Live total update based on quantity
- **Shipping Info**: "Free shipping on orders over $50"
- **Delivery Estimate**: "Arrives by Tuesday, March 15"

### Product Tabs

**Details Tab:**

- **Ingredients/Materials**: Expandable list
- **Usage Instructions**: Step-by-step guide
- **Care Instructions**: Maintenance information
- **Specifications**: Technical details table

**Reviews Tab:**

- **Rating Summary**: Star breakdown chart
- **Review List**: Most helpful reviews first
- **Write Review**: Modal form for authenticated users
- **Photo Reviews**: Customer uploaded images

**Related Tab:**

- **You May Like**: Algorithm-based suggestions
- **Frequently Bought Together**: Bundle suggestions
- **Recently Viewed**: User's browsing history

## Mobile-First Optimizations

### Touch Interactions

- **Swipe Gallery**: Smooth image transitions
- **Tap to Zoom**: Double-tap or pinch gestures
- **Sticky CTA**: Add to cart button sticks to bottom
- **Pull to Refresh**: Refresh product data

### Progressive Disclosure

- **Essential Info First**: Price, availability, add to cart above fold
- **Expandable Sections**: Details collapse to save space
- **Load on Demand**: Reviews and related products lazy load

### Performance

- **Image Optimization**: Progressive JPEG, WebP with fallback
- **Critical Path**: Above-fold content loads first
- **Preload**: Next/previous product images on hover

## Accessibility Features

### Keyboard Navigation

- **Tab Order**: Logical flow through interactive elements
- **Arrow Keys**: Navigate through image gallery
- **Enter/Space**: Activate buttons and controls

### Screen Reader Support

- **Alt Text**: Descriptive text for all product images
- **ARIA Labels**: Clear labels for variant selectors
- **Live Regions**: Announce price changes and cart updates

### Visual Accessibility

- **High Contrast**: Text meets WCAG AA standards
- **Focus Indicators**: Clear focus rings on interactive elements
- **Reduced Motion**: Respect prefers-reduced-motion setting

## Quick Actions Integration

### Context-Aware Dock

**Customer Actions:**

- **Quick Reorder**: If previously purchased
- **Add to Wishlist**: Heart icon with save state
- **Ask Question**: Direct message to store
- **Size Guide**: Quick access to sizing information

**Staff Actions (If Admin View):**

- **Edit Product**: Direct link to admin panel
- **Check Inventory**: Real-time stock levels
- **Update Price**: Quick price adjustment
- **View Analytics**: Product performance data

## Conversion Optimization

### Trust Signals

- **Customer Photos**: Real usage images in reviews
- **Badge Display**: "Best Seller", "New Arrival", etc.
- **Return Policy**: "30-day returns" messaging
- **Secure Checkout**: Security badges near add to cart

### Urgency & Scarcity

- **Stock Level**: "Only 3 left" when low inventory
- **Recent Activity**: "5 people viewed this in the last hour"
- **Time-Limited Offers**: Countdown timer for sales

### Social Proof

- **Review Highlights**: Pull quotes from positive reviews
- **Rating in Title**: Include star rating in page title
- **Share Count**: Social sharing statistics

## Error & Edge Cases

### Out of Stock

- **Clear Messaging**: "Currently unavailable"
- **Notify When Back**: Email signup for restock alerts
- **Alternatives**: Suggest similar available products

### Variant Conflicts

- **Smart Disable**: Disable incompatible options
- **Clear Messaging**: "This size not available in red"
- **Alternative Suggestions**: "Available in blue and green"

### Network Issues

- **Offline Indicator**: Show when offline
- **Cached Content**: Display last loaded state
- **Retry Options**: Manual refresh button
