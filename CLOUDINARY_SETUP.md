# Cloudinary Setup Guide

The application uses Cloudinary for image storage. If Cloudinary is not configured, images will be stored as base64 data URLs (not recommended for production).

## Free Tier Benefits
- 25GB storage
- 25GB bandwidth per month
- 7,500 transformations per month
- Perfect for small to medium applications

## Setup Instructions

### 1. Create a Free Cloudinary Account

Visit: https://cloudinary.com/users/register/free

### 2. Get Your Credentials

After signing up:
1. Go to your Dashboard
2. Find your credentials at the top:
   - Cloud Name
   - API Key
   - API Secret

### 3. Add to Environment Variables

**Local Development (.env):**
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Vercel Production:**
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add the three variables above for **both** the Web and API apps

### 4. Verify Setup

After adding the variables:
1. Redeploy your application (or restart locally)
2. Try uploading an image in Nuevo Servicio
3. Check your Cloudinary Media Library to see the uploaded image

## Image Organization

Images are automatically organized by folder:
- Services: `sass-store/services/`
- Visits: `sass-store/visits/`
- Products: `sass-store/products/`

## Fallback Behavior

If Cloudinary is not configured:
- ✅ Images will still work locally
- ⚠️ Base64 data URLs will be used (stored in database)
- ❌ Not recommended for production (database bloat)
- 💡 Set up Cloudinary for production use

## Troubleshooting

**Upload fails with 405 error:**
- Make sure the API app has the Cloudinary variables
- Verify the API URL is correct in web app environment

**Images not showing:**
- Check Cloudinary credentials are correct
- Verify account is active and not over quota
- Check browser console for CORS errors

**Base64 images in production:**
- This means Cloudinary is not configured
- Add the environment variables to Vercel
- Redeploy both apps
