# Cart Page Wireframe

## Layout Structure

```
[Header: Persistent navigation with cart breadcrumb]
[Cart Items: List with images, details, quantity controls]
[Order Summary: Subtotal, shipping, tax, total]
[Checkout CTA: Primary button, full width]
[Related Products: "You might also like" carousel]
[Trust Signals: Security badges, return policy]
[Quick Actions Dock: Save for later, continue shopping]
```

## Key Components

### Cart Items List

**Item Card Structure:**

```
[Product Image: Thumbnail with link to PDP]
[Product Info: Name, variant details, price]
[Quantity Controls: -/+ buttons with input field]
[Remove Action: X button or "Remove" link]
[Move to Wishlist: "Save for later" option]
```

**Interactive Features:**

- **Quantity Update**: Debounced API calls, optimistic UI
- **Remove Confirmation**: "Are you sure?" for high-value items
- **Undo Remove**: 5-second undo option with toast
- **Bulk Actions**: Select multiple items for batch operations

### Smart Quantity Controls

- **Stock Awareness**: Disable + button when at max stock
- **Bulk Discounts**: Show savings at quantity thresholds
- **Input Validation**: Prevent invalid quantities (0, negative)
- **Loading States**: Spinner during quantity updates

### Order Summary

```
[Subtotal: Item count and price]
[Shipping: Free shipping threshold progress]
[Tax: Estimated based on location]
[Discounts: Coupon codes and promotions]
[Total: Bold, prominent display]
```

**Dynamic Calculations:**

- **Live Updates**: Recalculate on any quantity change
- **Shipping Calculator**: Estimate based on postal code
- **Coupon Application**: Real-time discount validation
- **Currency Display**: Format according to tenant locale

## Mobile Optimizations

### Swipe Gestures

- **Swipe to Remove**: Left swipe reveals remove button
- **Swipe to Save**: Right swipe moves to wishlist
- **Haptic Feedback**: Confirm actions with vibration

### Sticky Elements

- **Checkout Button**: Sticks to bottom of screen
- **Order Total**: Always visible during scroll
- **Item Counter**: "3 items" in header

### Touch-Friendly Design

- **Large Targets**: 44px minimum touch targets
- **Thumb Zone**: Important actions within thumb reach
- **Gesture Hints**: Visual cues for swipe actions

## Checkout Optimization

### One-Click Checkout (Returning Customers)

- **Saved Payment**: Use stored payment method
- **Default Address**: Pre-fill shipping address
- **Smart Defaults**: Remember preferences (gift wrap, delivery)

### Guest Checkout

- **No Account Required**: Option to checkout without registration
- **Account Creation**: "Create account to track order" option
- **Social Login**: Google, Apple, Facebook sign-in options

### Progress Indicators

- **Step Counter**: "Step 1 of 3" or progress bar
- **Completion Estimate**: "2 minutes to complete"
- **Save Progress**: "Cart saved" for returning users

## Conversion Optimization

### Free Shipping Progress

```
[Progress Bar: Visual indicator of shipping threshold]
[Message: "Add $15 more for free shipping"]
[Suggestions: Recommended products to hit threshold]
```

### Abandoned Cart Prevention

- **Exit Intent**: Show popup with discount offer
- **Save for Later**: Move items to wishlist
- **Email Reminder**: Schedule cart recovery emails

### Trust Building

- **Security Badges**: SSL, payment processor logos
- **Return Policy**: "30-day returns" prominently displayed
- **Customer Service**: Chat widget or phone number
- **Reviews**: Show ratings for cart items

## Error Handling

### Stock Issues

- **Out of Stock**: Clear messaging with alternatives
- **Quantity Reduced**: "We've updated your quantity to 2 (max available)"
- **Price Changes**: "Price has changed since adding to cart"

### Payment Issues

- **Declined Cards**: Clear error messages with retry options
- **Network Errors**: Offline indicator with retry capability
- **Server Errors**: Friendly messages, preserve cart state

### Validation Errors

- **Address Validation**: Real-time verification
- **Coupon Errors**: "This code has expired" with suggestions
- **Form Validation**: Inline error messages

## Accessibility Features

### Keyboard Navigation

- **Tab Order**: Logical flow through all interactive elements
- **Shortcuts**: Delete key to remove focused item
- **Focus Management**: Return focus after dynamic updates

### Screen Reader Support

- **Live Regions**: Announce total updates and changes
- **Button Labels**: Clear action descriptions
- **Table Structure**: Proper table headers for cart items

### Visual Accessibility

- **High Contrast**: Ensure all text meets WCAG standards
- **Large Text**: Support browser zoom up to 200%
- **Clear Focus**: High contrast focus indicators

## Performance Considerations

### Optimistic Updates

- **Instant Feedback**: UI updates before server confirmation
- **Rollback**: Revert changes if server request fails
- **Loading States**: Show progress without blocking interaction

### Data Management

- **Local Storage**: Cache cart state locally
- **Sync Strategy**: Merge local and server cart on login
- **Compression**: Minimize cart data payload

### Progressive Enhancement

- **Core Functionality**: Works without JavaScript
- **Enhanced Experience**: Rich interactions with JS enabled
- **Graceful Degradation**: Fallbacks for failed features

## Integration Points

### Inventory System

- **Real-time Stock**: Check availability on page load
- **Stock Warnings**: Alert when items become unavailable
- **Auto-remove**: Clear unavailable items with notification

### Recommendation Engine

- **Related Products**: Based on cart contents
- **Frequently Bought**: Statistical analysis
- **Personal Recommendations**: Based on user history

### Analytics Tracking

- **Conversion Funnel**: Track drop-off points
- **A/B Testing**: Test different layouts and CTAs
- **User Behavior**: Heat maps and interaction tracking

## Quick Actions Dock

### Customer Actions

- **Continue Shopping**: Return to last viewed category
- **Save Cart**: Move all items to wishlist
- **Share Cart**: Send cart link to friend
- **Clear Cart**: Remove all items with confirmation

### Staff Actions (Admin View)

- **Apply Discount**: Quick manual discount application
- **Customer Notes**: Add internal notes about order
- **Priority Processing**: Flag for expedited handling
- **Contact Customer**: Direct communication options
