# Deploying to Staging/Preview Environment

This guide provides step-by-step instructions for deploying the SASS Store application to a staging/preview environment using Vercel.

## Prerequisites

Before deploying to staging, ensure you have:

1. Completed all security updates as documented in `SECURITY_UPDATE_FINAL_REPORT.md`
2. Set up a Vercel account with appropriate permissions
3. Installed the Vercel CLI: `npm i -g vercel`
4. Configured all required environment variables in your Vercel project
5. Verified that your local development environment is working correctly

## Deployment Steps

### Option 1: Using Vercel CLI

1. **Login to Vercel**

   ```bash
   vercel login
   ```

2. **Link your project to Vercel**

   ```bash
   vercel
   ```

   - Follow the prompts to link your project
   - Choose to import an existing project if you've already set it up
   - Select the correct Vercel organization and project

3. **Deploy to Preview**

   ```bash
   vercel --prod
   ```

   - This will deploy to your production environment
   - For a preview deployment, use `vercel` without the `--prod` flag

4. **Verify Deployment**
   - Check the Vercel dashboard for deployment status
   - Visit the deployed URL to verify the application is working
   - Check the logs for any errors

### Option 2: Using Git Integration

1. **Push Changes to Git**

   ```bash
   git add .
   git commit -m "feat: Apply security updates and prepare for staging deployment"
   git push origin main
   ```

2. **Trigger Deployment**
   - If you have automatic deployments set up, pushing to your main branch will trigger a deployment
   - Otherwise, go to your Vercel dashboard and manually trigger a deployment

3. **Verify Deployment**
   - Check the deployment status in your Vercel dashboard
   - Visit the preview URL to verify the application is working
   - Check the logs for any errors

### Option 3: Using Vercel Dashboard

1. **Navigate to Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com) and log in
   - Select your project from the dashboard

2. **Deploy New Branch**
   - Click on "Deployments" tab
   - Click "New Deployment"
   - Select the branch you want to deploy
   - Click "Deploy"

3. **Verify Deployment**
   - Wait for the deployment to complete
   - Visit the preview URL to verify the application is working
   - Check the logs for any errors

## Post-Deployment Verification

After deploying to staging, perform the following checks:

### 1. Basic Functionality

- [ ] Home page loads correctly
- [ ] Authentication system works
- [ ] Tenant-specific pages load with correct branding
- [ ] All navigation links work
- [ ] Forms submit correctly

### 2. Security Verification

- [ ] Security headers are present
- [ ] Rate limiting is working
- [ ] No sensitive information is exposed in error messages
- [ ] Tenant isolation is working correctly
- [ ] API endpoints are properly secured

### 3. Performance Verification

- [ ] Page load times are acceptable
- [ ] Images are optimized and loading correctly
- [ ] No console errors in the browser
- [ ] API response times are acceptable
- [ ] Core Web Vitals scores are good

### 4. Testing Verification

- [ ] Run a subset of E2E tests against the staging environment
- [ ] Test critical user flows
- [ ] Verify payment processing (if applicable)
- [ ] Test error scenarios

## Troubleshooting

### 1. Deployment Fails

- Check the deployment logs in Vercel dashboard
- Verify all environment variables are set correctly
- Check for syntax errors in your code
- Ensure all dependencies are properly installed

### 2. Application Loads with Errors

- Check the browser console for errors
- Check the Vercel function logs for API errors
- Verify database connections are working
- Check environment variables are correctly set

### 3. Security Issues Detected

- Verify security headers are correctly configured
- Check rate limiting is working
- Ensure no hardcoded secrets in the code
- Verify tenant isolation is working

## Next Steps

After successfully deploying to staging and verifying everything is working:

1. **Install Playwright browsers** for complete E2E testing:

   ```bash
   npx playwright install
   ```

2. **Run E2E tests** against the staging environment:

   ```bash
   npm run test:e2e
   ```

3. **Fix any issues** discovered during testing

4. **Deploy to production** once all verification steps are complete:

   ```bash
   vercel --prod
   ```

5. **Implement monitoring** as outlined in `MONITORING_PLAN.md`

## Rolling Back

If you need to roll back to a previous deployment:

1. Go to your Vercel dashboard
2. Navigate to the "Deployments" tab
3. Find the previous deployment you want to roll back to
4. Click the three-dot menu and select "Promote to Production"
5. Verify the rollback was successful

## Documentation

For more detailed information about:

- Security updates applied: See `SECURITY_UPDATE_FINAL_REPORT.md`
- Deployment configuration: See `vercel.json`
- Monitoring plan: See `MONITORING_PLAN.md`
- Environment variables: See `DEPLOYMENT_GUIDE.md`

## Support

If you encounter any issues during deployment:

1. Check the Vercel documentation: https://vercel.com/docs
2. Check the deployment logs in your Vercel dashboard
3. Contact your development team for assistance
