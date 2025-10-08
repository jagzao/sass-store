# Admin Dashboard Wireframe

## Layout Structure

```
[Header: Logo | Tenant Selector | Quick Actions | Profile]
[Sidebar: Role-based navigation menu]
[Main Content: Dashboard widgets and data tables]
[Quick Stats: KPI cards with real-time data]
[Action Center: Recent activities and pending tasks]
[Quick Actions Dock: Context-aware admin tools]
```

## Key Components

### Header (Admin Specific)

**Tenant Selector (Multi-tenant Owners):**

- **Dropdown**: List of owned/managed salons
- **Quick Switch**: Recently accessed tenants
- **Add Tenant**: Link to create new salon
- **Global View**: "All Tenants" overview option

**Quick Actions Menu:**

- **New Booking**: Quick appointment creation
- **Add Product**: Fast inventory addition
- **Export Data**: Common report downloads
- **Support**: Help and documentation

### Sidebar Navigation (Role-Based)

**Admin/Manager Level:**

```
[Dashboard: Overview and analytics]
[Bookings: Calendar and appointment management]
[Products: Inventory and catalog management]
[Customers: Client database and profiles]
[Staff: Employee management and scheduling]
[Reports: Analytics and business intelligence]
[Settings: Salon configuration and preferences]
```

**Owner Level (Additional):**

```
[Tenants: Multi-location management]
[Billing: Subscription and cost monitoring]
[Users: Access control and permissions]
[API: Integration management]
```

### Dashboard Widgets

**KPI Cards (Top Row):**

```
[Today's Revenue: $1,247 (+12% vs yesterday)]
[Appointments: 23 (3 pending, 2 cancellations)]
[New Customers: 7 (conversion rate 15%)]
[Inventory Alerts: 3 items low stock]
```

**Real-time Features:**

- **Live Updates**: WebSocket connection for real-time data
- **Comparison Metrics**: Previous period comparisons
- **Trend Indicators**: Up/down arrows with percentages
- **Drill-down**: Click cards to view detailed reports

### Calendar Overview

**Today's Schedule:**

- **Timeline View**: Hourly slots with appointments
- **Staff Columns**: Side-by-side staff schedules
- **Color Coding**: Services by type/duration
- **Quick Actions**: Drag to reschedule, click to edit

**Appointment Cards:**

```
[Time: 2:30 PM - 3:15 PM]
[Customer: Sarah Johnson (returning)]
[Service: Hair Cut & Style ($85)]
[Staff: Maria Rodriguez]
[Status: Confirmed / Checked In / In Progress]
[Actions: Edit, Cancel, Check In]
```

### Inventory Management

**Low Stock Alerts:**

- **Critical Items**: Red indicators for out-of-stock
- **Reorder Suggestions**: Smart reorder quantities
- **Supplier Links**: Quick reorder buttons
- **Usage Tracking**: Consumption patterns

**Quick Add Product:**

- **Scan Barcode**: Mobile camera integration
- **Template System**: Common product templates
- **Bulk Upload**: CSV import functionality
- **Image Upload**: Drag-and-drop photo addition

### Customer Management

**Recent Customers Table:**

```
[Name | Last Visit | Total Spent | Status | Actions]
[Sarah J. | 2 days ago | $1,247 | VIP | View Profile]
[Mike T. | 1 week ago | $89 | Regular | Book Again]
[Lisa K. | 2 weeks ago | $156 | New | Send Offer]
```

**Quick Actions:**

- **Send Message**: SMS/email communication
- **Book Appointment**: Quick booking for existing customers
- **View History**: Complete service and purchase history
- **Apply Discount**: Loyalty rewards and promotions

### Analytics Dashboard

**Revenue Charts:**

- **Daily Revenue**: 30-day trend line
- **Service Breakdown**: Pie chart of service types
- **Staff Performance**: Bar chart of individual metrics
- **Customer Acquisition**: New vs returning ratios

**Booking Analytics:**

- **Peak Hours**: Heat map of busy times
- **Cancellation Rates**: Trend analysis with reasons
- **Popular Services**: Ranking by frequency and revenue
- **Seasonal Trends**: Year-over-year comparisons

## Mobile Admin Experience

### Responsive Design

- **Collapsible Sidebar**: Hamburger menu on mobile
- **Card Layout**: Stacked widgets on small screens
- **Touch Optimized**: Large buttons and touch targets
- **Swipe Actions**: Swipe to approve/decline bookings

### Mobile-Specific Features

- **Push Notifications**: New bookings and cancellations
- **Quick Approval**: Approve requests without full app
- **Camera Integration**: Product photos and barcode scanning
- **Offline Mode**: Critical functions work offline

### Progressive Web App

- **Install Prompt**: Add to home screen functionality
- **Background Sync**: Sync data when connection restored
- **Cached Interface**: Fast loading of dashboard shell
- **Native Feel**: App-like navigation and animations

## Role-Based Permissions

### Staff Level Access

**Limited Dashboard:**

- **Personal Schedule**: Only their appointments
- **Customer Check-in**: Mark arrivals and completions
- **Inventory Usage**: Log product consumption
- **Basic Reports**: Personal performance metrics

### Manager Level Access

**Full Salon Management:**

- **All Staff Schedules**: Complete salon overview
- **Inventory Management**: Full CRUD operations
- **Customer Database**: Complete client management
- **Financial Reports**: Revenue and expense tracking

### Owner Level Access

**Multi-tenant Features:**

- **Tenant Comparison**: Cross-location analytics
- **Cost Management**: Budget and expense monitoring
- **Global Settings**: Default configurations
- **API Management**: Integration controls

## Quick Actions Dock (Admin Context)

### Manager Quick Actions

- **New Booking**: Fast appointment creation
- **Check Inventory**: Quick stock level check
- **Today's Revenue**: Current day performance
- **Staff Status**: Who's working today

### Owner Quick Actions

- **Cost Dashboard**: Real-time expense monitoring
- **Performance Summary**: All locations overview
- **New Tenant**: Add location wizard
- **Support**: Priority technical support

## Data Visualization

### Interactive Charts

- **Drill-down Capability**: Click charts to see details
- **Filter Controls**: Date ranges and category filters
- **Export Options**: PDF, Excel, CSV downloads
- **Real-time Updates**: Live data streaming

### Custom Dashboards

- **Widget Arrangement**: Drag-and-drop customization
- **Saved Views**: Personal dashboard configurations
- **Shared Dashboards**: Team-wide custom views
- **Notification Rules**: Alert thresholds and triggers

## Integration Management

### POS Integration

- **Transaction Sync**: Real-time payment processing
- **Inventory Updates**: Automatic stock adjustments
- **Receipt Management**: Digital receipt storage
- **Refund Processing**: Easy return handling

### Marketing Tools

- **Email Campaigns**: Customer communication
- **SMS Notifications**: Appointment reminders
- **Social Media**: Review management and posting
- **Loyalty Programs**: Points and rewards tracking

### Third-party Connections

- **Calendar Sync**: Google Calendar, Outlook integration
- **Accounting**: QuickBooks, Xero connectivity
- **Review Platforms**: Google, Yelp review monitoring
- **Booking Platforms**: Multi-channel appointment sync

## Error Handling & Support

### Error States

- **Network Issues**: Offline indicators and retry options
- **Permission Errors**: Clear access denied messages
- **Data Conflicts**: Conflict resolution interfaces
- **System Maintenance**: Planned downtime notifications

### Help & Support

- **Contextual Help**: In-app guidance and tooltips
- **Video Tutorials**: Embedded help videos
- **Live Chat**: Real-time support during business hours
- **Knowledge Base**: Searchable documentation

### Audit Trail

- **Action Logging**: Track all admin actions
- **User History**: Login and activity tracking
- **Data Changes**: Detailed modification logs
- **Compliance**: Regulatory requirement compliance

## Performance Monitoring

### Real-time Metrics

- **Page Load Times**: Dashboard performance tracking
- **User Activity**: Concurrent admin users
- **System Health**: Server and database status
- **Error Rates**: Application error monitoring

### Optimization Features

- **Lazy Loading**: Load widgets as needed
- **Caching Strategy**: Smart data caching
- **Progressive Enhancement**: Core features load first
- **Resource Management**: Optimal asset loading
