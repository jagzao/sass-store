# Video Processing System Setup Guide

This guide explains how to set up and run the video processing system that creates "Luxury Golden Frame" aesthetic videos.

## 🎯 Overview

The video processing system consists of:

- Python worker script with 4-layer composition engine
- Database schema for job tracking
- API endpoints for submitting and monitoring jobs
- Asset management for overlays, frames, and audio
- Background job queue with retry logic

## 📋 Prerequisites

### System Dependencies

- Python 3.8+ with pip
- PostgreSQL database
- Node.js 18+ (for the API)
- ImageMagick (installed as mentioned in your task)

### Python Packages

```bash
pip install moviepy librosa psycopg2-binary boto3 python-dotenv
```

## 🗂️ File Structure

```
├── packages/database/video-processing-schema.ts    # Database schema
├── scripts/
│   ├── video-processor-worker.py                  # Main Python worker
│   ├── migrate-video-processing.ts               # Database migration
│   └── test-video-processing.ts                  # Test script
├── apps/api/app/api/v1/video/
│   ├── process/route.ts                          # Submit job endpoint
│   ├── jobs/[id]/route.ts                        # Job status endpoint
│   └── jobs/route.ts                             # List jobs endpoint
└── public/video-assets/                          # Sample assets
    ├── overlays/
    ├── frames/
    ├── audio/
    └── samples/
```

## 🚀 Setup Instructions

### 1. Database Setup

First, run the migration to create the video processing tables:

```bash
cd apps/api
npm run db:generate
npm run db:push
npm run ts-node -- scripts/migrate-video-processing.ts
```

### 2. Environment Configuration

Add these environment variables to your `.env.local`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/sass_store

# Storage (for video outputs)
STORAGE_ACCESS_KEY_ID=your_access_key
STORAGE_SECRET_ACCESS_KEY=your_secret_key
STORAGE_BUCKET_NAME=your_bucket_name
STORAGE_REGION=us-east-1

# Video Processing
VIDEO_PROCESSING_QUEUE_URL=postgresql://username:password@localhost:5432/sass_store
VIDEO_OUTPUT_URL=https://your-cdn-domain.com/videos
THUMBNAIL_OUTPUT_URL=https://your-cdn-domain.com/thumbnails
```

### 3. Asset Preparation

The system uses these asset types:

1. **Overlays** (`public/video-assets/overlays/`)
   - `glitter-rain.mp4` - Atmospheric rain effect
   - `sparkle-overlay.mp4` - Sparkle effect
   - `golden-particles.mp4` - Golden particle effect

2. **Frames** (`public/video-assets/frames/`)
   - `golden-frame.png` - Luxury golden frame
   - `silver-frame.png` - Alternative silver frame

3. **Audio** (`public/video-assets/audio/`)
   - `ambient-1.mp3` - Ambient background music
   - `upbeat-1.mp3` - Upbeat background music

4. **Sample Images** (`public/video-assets/samples/`)
   - `product-sample-1.jpg` - Sample product image
   - `product-sample-2.jpg` - Another sample image

### 4. Running the Python Worker

The worker can be run in two modes:

#### Development Mode (Direct Processing)

```bash
cd scripts
python video-processor-worker.py --job-id <job-id> --direct
```

#### Production Mode (Queue Processing)

```bash
cd scripts
python video-processor-worker.py
```

For production, consider running as a systemd service:

```ini
# /etc/systemd/system/video-processor.service
[Unit]
Description=Video Processor Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/sass-store/scripts
ExecStart=/usr/bin/python3 video-processor-worker.py
Restart=always
RestartSec=10
Environment=PYTHONPATH=/path/to/sass-store

[Install]
WantedBy=multi-user.target
```

### 5. Testing the System

Run the test script to verify everything works:

```bash
cd apps/api
npm run ts-node -- scripts/test-video-processing.ts
```

## 🎬 Video Processing Workflow

### 1. Submit a Job

```typescript
const response = await fetch("/api/v1/video/process", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    imageIds: ["product-image-1"],
    audioFile: "ambient-1.mp3",
    textOverlay: "✨ Luxury Product Showcase",
    overlayType: "golden-frame",
    qualityMode: "high",
    durationTarget: 15.0,
  }),
});

const { jobId } = await response.json();
```

### 2. Monitor Job Status

```typescript
const response = await fetch(`/api/v1/video/jobs/${jobId}`);
const job = await response.json();

console.log(job.status); // pending, processing, completed, failed
console.log(job.progress); // 0-100
```

### 3. Get Results

When `job.status === 'completed'`:

```typescript
console.log(job.outputVideoUrl); // Final video URL
console.log(job.outputThumbnailUrl); // Thumbnail URL
```

## 🎨 4-Layer Composition Architecture

The video processor creates videos with these layers (bottom to top):

### Z=0: Background Layer

- Solid color: Black (#050505)
- Size: 1080x1920 (vertical video)

### Z=1: Atmosphere Layer

- Glitter/rain overlay video
- Resized to 1080x1920
- Opacity: 70%
- Blend mode: Normal (over black background)

### Z=2: Content Layer

- Product image
- Resized to 900x1600 (leaving 90px border)
- Ken Burns zoom effect: 1.0 → 1.05 over duration
- Centered positioning

### Z=3: Golden Frame Layer

- Priority: Custom `frame_overlay.png` if provided
- Fallback: Procedural 10px gold border (#D4AF37)
- Applied to content layer only

### Z=4: Text Overlay Layer

- Viral text hook with emoji support
- Font: Arial Bold
- Size: 48px
- Color: White with black stroke
- Position: Top third of video

## 🔧 Configuration Options

### Quality Modes

- `low`: 720p output, faster processing
- `normal`: 1080p output (default)
- `high`: 1080p with enhanced effects

### Overlay Types

- `golden-frame`: Luxury golden frame aesthetic
- `silver-frame`: Silver frame alternative
- `minimal`: Clean, minimal frame
- `none`: No frame overlay

### Audio Sync Options

- `librosa`: Automatic beat detection (if librosa installed)
- `fixed`: Fixed duration based on `durationTarget`
- `auto`: Try librosa, fallback to fixed

## 🐛 Troubleshooting

### Common Issues

1. **UTF-8 Encoding Errors**
   - Ensure `sys.stdout.reconfigure(encoding='utf-8')` is at the top of the script
   - Check all file operations use `encoding='utf-8'`

2. **Librosa Import Errors**
   - Install with: `pip install librosa`
   - System will fallback to fixed duration if librosa is missing

3. **MoviePy/ImageMagick Issues**
   - Verify ImageMagick is installed: `convert -version`
   - Check MoviePy can find ImageMagick: `python -c "from moviepy.config import check; check()"`

4. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check database user has required permissions
   - Ensure migration was run successfully

5. **Asset Not Found Errors**
   - Verify asset files exist in correct paths
   - Check file permissions
   - Ensure storage configuration is correct

### Debug Mode

Run the worker with debug logging:

```bash
DEBUG=1 python video-processor-worker.py
```

### Performance Tuning

1. **Memory Usage**
   - Limit concurrent jobs: Set `MAX_CONCURRENT_JOBS=2` in environment
   - Reduce quality mode for faster processing

2. **Processing Speed**
   - Use SSD storage for temporary files
   - Increase CPU allocation for the worker
   - Consider GPU acceleration for MoviePy

## 📊 Monitoring

### Job Metrics

Track these metrics in your monitoring system:

- Job completion rate
- Average processing time
- Error rates by type
- Queue depth over time

### Health Checks

```bash
# Check worker health
curl http://localhost:3001/api/v1/video/health

# Check job queue status
curl http://localhost:3001/api/v1/video/jobs/stats
```

## 🔒 Security Considerations

1. **Tenant Isolation**
   - All jobs are scoped to tenant_id
   - Storage paths include tenant isolation
   - API endpoints verify tenant access

2. **Input Validation**
   - File type validation for uploads
   - Text overlay sanitization
   - Duration limits to prevent abuse

3. **Resource Limits**
   - Maximum file sizes enforced
   - Job rate limiting per tenant
   - Processing timeouts

## 🚀 Production Deployment

### Docker Setup

```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    imagemagick \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy worker script
COPY video-processor-worker.py /app/
WORKDIR /app

# Run worker
CMD ["python", "video-processor-worker.py"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: video-processor-worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: video-processor-worker
  template:
    metadata:
      labels:
        app: video-processor-worker
    spec:
      containers:
        - name: worker
          image: video-processor:latest
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: url
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2000m
              memory: 4Gi
```

## 📝 API Reference

### POST /api/v1/video/process

Submit a new video processing job.

**Request Body:**

```typescript
{
  imageIds: string[],           // Required: Array of image IDs
  audioFile?: string,           // Optional: Audio filename
  textOverlay?: string,         // Optional: Text to overlay
  overlayType?: string,         // Optional: Frame type
  qualityMode?: string,         // Optional: Quality setting
  durationTarget?: number,      // Optional: Target duration in seconds
  priority?: number            // Optional: Job priority (1-10)
}
```

**Response:**

```typescript
{
  success: true,
  jobId: string,                // Job ID for tracking
  estimatedTime: number         // Estimated processing time (seconds)
}
```

### GET /api/v1/video/jobs/[id]

Get job status and details.

**Response:**

```typescript
{
  id: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: number,             // 0-100
  outputVideoUrl?: string,      // Available when completed
  outputThumbnailUrl?: string,  // Available when completed
  error?: string,               // Available when failed
  createdAt: string,
  completedAt?: string,
  processingTimeMs?: number
}
```

### GET /api/v1/video/jobs

List jobs with pagination.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status
- `tenantId`: Filter by tenant

**Response:**

```typescript
{
  jobs: Job[],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}
```

## 🎉 Success Metrics

A successful video processing system should achieve:

- 95%+ job completion rate
- < 30 second average processing time for 15-second videos
- < 5% error rate
- 99.9% uptime for the worker service
- Sub-second API response times

## 📞 Support

For issues with the video processing system:

1. Check the troubleshooting section above
2. Review worker logs for detailed error messages
3. Verify database schema is up to date
4. Ensure all assets are properly uploaded

---

This system is now ready for production use with the "Luxury Golden Frame" aesthetic as requested! 🏆✨
