/**
 * Monitoring Integration Guide
 * How to integrate monitoring into the Sass Store application
 */

/*
1. Environment Variables:
   Add these to your .env files:

   MONITORING_ENABLED=true
   LOG_LEVEL=info
   ERROR_REPORTING_ENABLED=true
   ERROR_REPORTING_ENDPOINT=https://your-logging-service.com/api/logs
   ERROR_REPORTING_TOKEN=your-token-here
   ERROR_SAMPLE_RATE=1.0
   METRICS_ENABLED=true
   METRICS_ENDPOINT=https://your-metrics-service.com/api/metrics
   METRICS_TOKEN=your-token-here
   METRICS_COLLECTION_INTERVAL=30000
   METRICS_REPORT_INTERVAL=300000
   PERFORMANCE_MONITORING_ENABLED=true
   SLOW_REQUEST_THRESHOLD=1000
   MONITORING_TOKEN=your-monitoring-token-here
*/

/*
2. Application Integration:
   To use monitoring in your components/route handlers:

   import { captureError, incrementMetric, recordHistogram } from '@sass-store/core';
   
   // Capture an error
   try {
     // some operation
   } catch (error) {
     await captureError(error, {
       user: { id: userId, tenantId },
       request: { url: req.url, method: req.method }
     });
   }
   
   // Record a metric
   incrementMetric('user.login', 1, { tenant: tenantId });
   
   // Record timing
   recordHistogram('api.response.time', responseTime, { endpoint: 'user/profile' });
*/

/*
3. Next.js Middleware Integration:
   To add monitoring to your middleware, you can create a wrapper like:

   import { withMonitoring } from '@sass-store/core';
   
   export async function middleware(request) {
     return withMonitoring(request, async (req) => {
       // Your existing middleware logic
       const response = NextResponse.next();
       return response;
     });
   }
*/

/*
4. API Route Integration:
   In your API routes, you can use error handling like:

   import { captureError } from '@sass-store/core';
   
   export default async function handler(req, res) {
     try {
       // Your API logic
     } catch (error) {
       const errorId = await captureError(error, {
         request: {
           url: req.url,
           method: req.method,
           headers: req.headers,
           body: req.body
         },
         metadata: { 
           route: req.url,
           tenant: req.headers['x-tenant']
         }
       });
       
       res.status(500).json({ 
         error: 'Internal server error',
         errorId // Provide error ID to client for support
       });
     }
   }
*/

/*
5. Monitoring Dashboard:
   The monitoring dashboard is available at:
   GET /api/monitoring/dashboard
   
   Requires authorization header:
   Authorization: Bearer {MONITORING_TOKEN}
*/

/*
6. Package Exports:
   The @sass-store/core package exports:
   - captureError: Function to capture and report errors
   - incrementMetric: Function to increment counter metrics
   - recordHistogram: Function to record histogram metrics
   - setGauge: Function to set gauge metrics
   - startTimer: Function to start timer metrics
   - monitoringMiddleware: Next.js middleware for automatic monitoring
   - ErrorTracker: Class for advanced error tracking
   - MetricsService: Class for advanced metrics
   - Logger: Structured logging utility
*/