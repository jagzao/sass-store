# Quick Actions Dock Design System

## Overview

The Quick Actions Dock is a floating, context-aware toolbar that provides 1-click access to the most common actions for each user role. It adapts its content based on the current page and user permissions.

## Design Specifications

### Visual Design

```
[Dock Container: Rounded pill shape, 60px height]
[Background: Semi-transparent white with backdrop blur]
[Border: 1px solid #e5e7eb with subtle shadow]
[Position: Fixed bottom center, 16px from edge]
[Animation: Slides up on page load, auto-hide on scroll]
```

### Layout Structure

- **Container**: Flexible width based on content (240px - 400px)
- **Padding**: 12px horizontal, 8px vertical
- **Item Spacing**: 8px between action buttons
- **Maximum Items**: 4-5 actions to prevent overcrowding

## Role-Based Configurations

### Customer Role

**Home Page Actions:**

```
[Book Now] [Reorder] [Favorites] [Help]
```

**Product Pages Actions:**

```
[Add to Cart] [Wishlist] [Compare] [Ask Question]
```

**Cart/Checkout Actions:**

```
[Continue Shopping] [Apply Coupon] [Save Cart] [Need Help]
```

**Booking Flow Actions:**

```
[First Available] [Change Service] [Reschedule] [Cancel]
```

### Staff Role

**Dashboard Actions:**

```
[Check In Customer] [New Booking] [View Schedule] [Break Time]
```

**Appointment Management:**

```
[Mark Complete] [Add Notes] [Process Payment] [Reschedule]
```

**Customer Interaction:**

```
[Check In] [Add Service] [Apply Discount] [Send Receipt]
```

### Admin/Manager Role

**Dashboard Actions:**

```
[New Booking] [Add Product] [View Reports] [Staff Schedule]
```

**Inventory Management:**

```
[Quick Add] [Scan Barcode] [Check Stock] [Reorder]
```

**Customer Management:**

```
[New Customer] [Send Message] [Apply Discount] [View History]
```

### Owner Role

**Multi-tenant Overview:**

```
[Cost Dashboard] [Performance] [New Tenant] [Support]
```

**Financial Management:**

```
[Revenue Report] [Cost Analysis] [Budget Alert] [Export Data]
```

## Interaction Design

### Button Specifications

**Primary Action Button:**

```
Size: 48px x 48px
Background: Primary color (#0ea5e9)
Text: White, 12px, semi-bold
Icon: 20px, white
Border Radius: 12px
Shadow: 0 2px 8px rgba(0,0,0,0.15)
```

**Secondary Action Button:**

```
Size: 44px x 44px
Background: White
Text: Gray-700, 11px, medium
Icon: 18px, gray-600
Border: 1px solid #e5e7eb
Border Radius: 10px
```

**Ghost Action Button:**

```
Size: 40px x 40px
Background: Transparent
Text: Gray-600, 10px, medium
Icon: 16px, gray-500
Border: None
Border Radius: 8px
```

### Interaction States

**Hover States:**

- **Primary**: Lift 2px, increase shadow, darken background 10%
- **Secondary**: Lift 1px, border color to primary
- **Ghost**: Background to gray-100

**Active States:**

- **Primary**: Scale down to 0.95, remove lift
- **Secondary**: Scale down to 0.97, increase border width
- **Ghost**: Background to gray-200

**Focus States:**

- **All Buttons**: 2px solid focus ring in primary color
- **Keyboard Navigation**: Tab order left to right
- **Screen Reader**: Clear button labels and descriptions

### Animation Specifications

**Dock Entrance:**

```
Initial: transform: translateY(100px), opacity: 0
Final: transform: translateY(0), opacity: 1
Duration: 300ms
Easing: cubic-bezier(0.34, 1.56, 0.64, 1)
Delay: 200ms after page load
```

**Auto-hide Behavior:**

```
Hide Trigger: Scroll down > 100px
Hide Animation: translateY(80px), opacity: 0.3
Show Trigger: Scroll up or stop scrolling
Show Animation: translateY(0), opacity: 1
Duration: 200ms, ease-out
```

**Button Interactions:**

```
Hover: transform: translateY(-2px), duration: 150ms
Active: transform: scale(0.95), duration: 100ms
Focus: outline animation, 200ms ease-in-out
```

## Context Awareness

### Page-Based Adaptation

**Homepage Context:**

- **Customer**: Focus on booking and shopping actions
- **Staff**: Emphasize schedule and customer check-in
- **Admin**: Quick access to daily management tasks

**Product Page Context:**

- **Customer**: Purchase-focused actions (add to cart, wishlist)
- **Staff**: Inventory and customer service actions
- **Admin**: Product management and analytics

**Booking Context:**

- **Customer**: Booking flow optimization and modifications
- **Staff**: Appointment management and customer service
- **Admin**: Schedule oversight and staff coordination

### Dynamic Content

**Notification Badges:**

- **Red Dot**: Urgent actions requiring attention
- **Number Badge**: Count of pending items (max 99+)
- **Pulse Animation**: Draw attention to time-sensitive actions

**Smart Suggestions:**

- **Machine Learning**: Suggest actions based on user behavior
- **Time-based**: Different actions for different times of day
- **Context-aware**: Adapt to current workflow and page state

## Accessibility Implementation

### Keyboard Navigation

- **Tab Order**: Logical left-to-right progression
- **Enter/Space**: Activate buttons
- **Escape**: Close any opened menus
- **Arrow Keys**: Navigate between buttons when focused

### Screen Reader Support

- **ARIA Labels**: Descriptive labels for all actions
- **Role Definitions**: Proper button and toolbar roles
- **State Announcements**: Active/pressed states communicated
- **Live Regions**: Announce dynamic content changes

### Visual Accessibility

- **High Contrast Mode**: Alternative styling for high contrast
- **Large Text**: Scale with user's text size preferences
- **Color Independence**: Don't rely solely on color for meaning
- **Focus Indicators**: High contrast focus rings (3:1 minimum)

## Responsive Behavior

### Mobile Adaptations (< 768px)

- **Full Width**: Extend to screen edges with safe area insets
- **Larger Targets**: Increase button size to 52px minimum
- **Reduce Actions**: Show only 3-4 most important actions
- **Gesture Support**: Swipe left/right to see more actions

### Tablet Adaptations (768px - 1024px)

- **Centered Position**: Maintain center alignment
- **Standard Sizing**: Use default button sizes
- **Extended Actions**: Show 4-5 actions comfortably
- **Touch Optimization**: Optimize for finger navigation

### Desktop Adaptations (> 1024px)

- **Hover Enhancements**: Rich hover states and tooltips
- **Keyboard Shortcuts**: Display shortcut keys in tooltips
- **Extended Functionality**: More detailed action options
- **Mouse Optimization**: Precise click targets and feedback

## Technical Implementation

### Performance Considerations

- **Lazy Loading**: Load dock after critical page content
- **Debounced Scroll**: Optimize scroll event handling
- **Hardware Acceleration**: Use CSS transforms for animations
- **Memory Management**: Clean up event listeners properly

### State Management

- **Context Provider**: React context for dock state
- **Action Registry**: Centralized action definitions
- **Permission Checks**: Real-time permission validation
- **Cache Strategy**: Cache action states for performance

### Integration Points

- **Authentication**: Role-based action filtering
- **Navigation**: Router-aware context switching
- **API Layer**: Optimistic updates for dock actions
- **Analytics**: Track dock usage and popular actions

## Testing Strategy

### Usability Testing

- **Task Completion**: Measure time to complete common tasks
- **Discovery**: How quickly users find relevant actions
- **Preference**: User preference for dock vs traditional navigation
- **Efficiency**: Reduction in clicks for common workflows

### Accessibility Testing

- **Screen Reader**: Full compatibility testing
- **Keyboard Only**: Complete functionality without mouse
- **High Contrast**: Visual accessibility verification
- **Voice Control**: Compatibility with voice navigation

### Performance Testing

- **Animation Performance**: 60fps on target devices
- **Load Impact**: Measure dock impact on page performance
- **Memory Usage**: Monitor memory consumption
- **Battery Impact**: Test on mobile devices for battery drain

## Success Metrics

### User Experience Metrics

- **Click Reduction**: 30% fewer clicks for common tasks
- **Task Completion Time**: 25% faster task completion
- **User Satisfaction**: 4.5+ star rating in user feedback
- **Adoption Rate**: 80%+ of users actively use dock

### Business Impact Metrics

- **Conversion Rate**: 15% increase in booking/purchase conversion
- **Staff Efficiency**: 20% reduction in task completion time
- **Customer Satisfaction**: Improved NPS scores
- **Revenue Impact**: Measurable increase in revenue per user
