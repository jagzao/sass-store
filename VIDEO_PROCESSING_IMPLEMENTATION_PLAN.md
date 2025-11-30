# Video Processing Implementation Plan

## Database Schema Extensions

### 1. Video Processing Jobs Table

Add to `packages/database/schema.ts`:

```typescript
// Video Processing Jobs table
export const videoProcessingJobs = pgTable(
  "video_processing_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'processing' | 'completed' | 'failed'
    priority: integer("priority").notNull().default(0),

    // Input parameters
    imageIds: uuid("image_ids").array().notNull(),
    audioFile: text("audio_file"),
    textOverlay: text("text_overlay"),
    overlayType: varchar("overlay_type", { length: 50 }).default(
      "golden-frame"
    ),

    // Processing configuration
    durationTarget: decimal("duration_target", { precision: 10, scale: 2 }),
    qualityMode: varchar("quality_mode", { length: 20 }).default("normal"), // 'normal' | 'eco' | 'freeze'

    // Processing metadata
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    processingTimeMs: integer("processing_time_ms"),
    attempts: integer("attempts").default(0),
    maxAttempts: integer("max_attempts").default(3),
    lastError: text("last_error"),

    // Output
    outputVideoUrl: text("output_video_url"),
    outputThumbnailUrl: text("output_thumbnail_url"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("video_jobs_tenant_idx").on(table.tenantId),
    statusIdx: index("video_jobs_status_idx").on(table.status),
    priorityIdx: index("video_jobs_priority_idx").on(table.priority),
    createdIdx: index("video_jobs_created_idx").on(table.createdAt),
  })
);

// Video Processing Assets table
export const videoProcessingAssets = pgTable(
  "video_processing_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    assetType: varchar("asset_type", { length: 50 }).notNull(), // 'overlay' | 'frame' | 'audio'
    name: varchar("name", { length: 100 }).notNull(),
    filePath: text("file_path").notNull(),
    metadata: jsonb("metadata").default("{}"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("video_assets_tenant_idx").on(table.tenantId),
    assetTypeIdx: index("video_assets_asset_type_idx").on(table.assetType),
  })
);
```

### 2. Relations

Add to existing relations:

```typescript
export const videoProcessingJobsRelations = relations(
  videoProcessingJobs,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [videoProcessingJobs.tenantId],
      references: [tenants.id],
    }),
  })
);

export const videoProcessingAssetsRelations = relations(
  videoProcessingAssets,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [videoProcessingAssets.tenantId],
      references: [tenants.id],
    }),
  })
);

// Add to tenantsRelations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  // ... existing relations
  videoProcessingJobs: many(videoProcessingJobs),
  videoProcessingAssets: many(videoProcessingAssets),
}));
```

## Python Video Worker Script

### Location: `scripts/video-processor-worker.py`

```python
#!/usr/bin/env python3
"""
Video Processing Worker with Luxury Golden Frame Composition
Handles multi-layer video composition with audio synchronization
"""

import sys
import os
import json
import logging
from typing import List, Dict, Optional, Tuple
from pathlib import Path

# CRITICAL: Fix UTF-8 encoding at the very beginning
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# MoviePy imports
from moviepy.editor import *
from moviepy.audio.io import AudioFileClip
from moviepy.video.fx.all import resize, margin

# Audio processing with fallback
try:
    import librosa
    LIBROSA_AVAILABLE = True
    logging.info("Librosa available for advanced audio processing")
except ImportError:
    LIBROSA_AVAILABLE = False
    logging.warning("Librosa not available, using fallback audio processing")

# Database and storage imports (to be implemented)
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3
from botocore.exceptions import ClientError

class VideoProcessor:
    """Main video processing class with luxury golden frame composition"""

    def __init__(self, config: Dict):
        self.config = config
        self.db_conn = None
        self.s3_client = None
        self.setup_logging()
        self.setup_connections()

    def setup_logging(self):
        """Configure structured logging with UTF-8 support"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler('/var/log/video-processor.log', encoding='utf-8')
            ]
        )
        self.logger = logging.getLogger('VideoProcessor')

    def setup_connections(self):
        """Initialize database and storage connections"""
        # Database connection
        self.db_conn = psycopg2.connect(
            host=self.config['db_host'],
            database=self.config['db_name'],
            user=self.config['db_user'],
            password=self.config['db_password'],
            cursor_factory=RealDictCursor
        )

        # S3 client for asset storage
        self.s3_client = boto3.client(
            's3',
            endpoint_url=self.config['s3_endpoint'],
            aws_access_key_id=self.config['s3_access_key'],
            aws_secret_access_key=self.config['s3_secret_key']
        )

    def process_job(self, job_id: str) -> bool:
        """Process a single video job with comprehensive error handling"""
        try:
            self.logger.info(f"Starting video processing job: {job_id} ✨")

            # Update job status to processing
            self.update_job_status(job_id, 'processing', started_at='NOW()')

            # Get job details
            job = self.get_job(job_id)
            if not job:
                self.logger.error(f"Job {job_id} not found")
                return False

            # Download required assets
            assets = self.download_assets(job)

            # Process audio with beat detection
            audio_duration, beat_times = self.process_audio(job['audio_file'])

            # Create 4-layer composition
            video_clip = self.create_composition(assets, audio_duration, beat_times, job)

            # Generate output video and thumbnail
            output_url, thumbnail_url = self.generate_output(video_clip, job_id, job['tenant_id'])

            # Update job with results
            self.update_job_status(
                job_id,
                'completed',
                output_video_url=output_url,
                output_thumbnail_url=thumbnail_url,
                completed_at='NOW()'
            )

            self.logger.info(f"✅ Successfully completed job {job_id}")
            return True

        except Exception as e:
            self.logger.error(f"❌ Error processing job {job_id}: {str(e)}", exc_info=True)
            self.update_job_status(
                job_id,
                'failed',
                last_error=str(e),
                attempts=f"attempts + 1"
            )
            return False
        finally:
            # Cleanup temporary files
            self.cleanup_temp_files()

    def process_audio(self, audio_file: Optional[str]) -> Tuple[float, List[float]]:
        """Process audio with librosa beat detection or fallback"""
        if not audio_file:
            return 30.0, []  # Default 30 seconds, no beats

        try:
            if LIBROSA_AVAILABLE:
                return self.process_audio_with_librosa(audio_file)
            else:
                return self.process_audio_fallback(audio_file)
        except Exception as e:
            self.logger.warning(f"Audio processing failed, using fallback: {str(e)}")
            return self.process_audio_fallback(audio_file)

    def process_audio_with_librosa(self, audio_file: str) -> Tuple[float, List[float]]:
        """Advanced audio processing with librosa beat detection"""
        self.logger.info("🎵 Using librosa for beat detection")

        # Download audio file
        audio_path = self.download_audio_file(audio_file)

        # Load audio and detect beats
        y, sr = librosa.load(audio_path)
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr, trim=False)

        # Calculate duration
        duration = librosa.get_duration(y=y, sr=sr)

        # Convert beat frames to time stamps
        beat_times = librosa.frames_to_time(beats, sr=sr).tolist()

        self.logger.info(f"Detected {len(beat_times)} beats in {duration:.2f}s audio")
        return duration, beat_times

    def process_audio_fallback(self, audio_file: str) -> Tuple[float, List[float]]:
        """Fallback audio processing without librosa"""
        self.logger.warning("⚠️ Using fallback audio processing (no beat detection)")

        # Download audio file
        audio_path = self.download_audio_file(audio_file)

        # Use MoviePy for basic audio analysis
        audio_clip = AudioFileClip(audio_path)
        duration = audio_clip.duration

        # Generate simple beat intervals (every 2 seconds)
        beat_times = [i * 2.0 for i in range(int(duration // 2))]

        return duration, beat_times

    def create_composition(self, assets: Dict, audio_duration: float, beat_times: List[float], job: Dict) -> CompositeVideoClip:
        """Create 4-layer luxury golden frame composition"""

        # Layer Z=0: Background (Black #050505)
        background = ColorClip((1080, 1920), color=(0x05, 0x05, 0x05)).set_duration(audio_duration)

        # Layer Z=1: Atmosphere/Rain overlay
        atmosphere = self.create_atmosphere_layer(audio_duration, assets)

        # Layer Z=2: Content (Product images with Ken Burns)
        content_clips = self.create_content_layers(assets, audio_duration, beat_times)

        # Layer Z=3: Golden Frame
        frame = self.create_golden_frame_layer(audio_duration, assets, job)

        # Layer Z=4: Text Hook
        text = self.create_text_layer(job.get('text_overlay', ''), audio_duration)

        # Composite all layers
        clips = [background]
        if atmosphere:
            clips.append(atmosphere)
        clips.extend(content_clips)
        if frame:
            clips.append(frame)
        if text:
            clips.append(text)

        final_composition = CompositeVideoClip(clips, size=(1080, 1920))
        self.logger.info("🎨 Created 4-layer composition with luxury golden frame")

        return final_composition

    def create_atmosphere_layer(self, duration: float, assets: Dict) -> Optional[VideoClip]:
        """Create atmosphere/rain overlay layer"""
        try:
            # Look for glitter/rain overlay asset
            overlay_path = assets.get('glitter_overlay')
            if not overlay_path:
                overlay_path = self.get_default_asset('glitter-rain.mp4')

            if overlay_path and os.path.exists(overlay_path):
                overlay = VideoFileClip(overlay_path)
                # Resize to 1080x1920 and loop if necessary
                if overlay.duration < duration:
                    overlay = overlay.loop(duration=duration)
                overlay = overlay.resize((1080, 1920))
                return overlay.set_opacity(0.7)  # 70% opacity
        except Exception as e:
            self.logger.warning(f"Failed to create atmosphere layer: {str(e)}")
        return None

    def create_content_layers(self, assets: Dict, duration: float, beat_times: List[float]) -> List[VideoClip]:
        """Create content layers with Ken Burns effect"""
        content_clips = []

        # Get product images
        images = assets.get('product_images', [])

        if not images:
            return content_clips

        # Calculate clip duration based on beats or equal distribution
        if beat_times:
            clip_duration = self.calculate_beat_based_durations(beat_times, len(images))
        else:
            clip_duration = duration / len(images)

        for i, image_path in enumerate(images):
            try:
                # Load and resize image to fit inside frame (900x1600)
                img = ImageClip(image_path).resize((900, 1600))

                # Apply Ken Burns zoom effect (1.0 -> 1.05)
                zoom_clip = img.resize(lambda t: (900 * (1 + 0.05 * t), 1600 * (1 + 0.05 * t)))

                # Set duration and position (centered)
                start_time = sum(clip_duration[:i]) if i > 0 else 0
                clip = zoom_clip.set_duration(clip_duration[i]).set_position(('center', 'center'))

                content_clips.append(clip.set_start(start_time))

            except Exception as e:
                self.logger.error(f"Failed to process image {image_path}: {str(e)}")

        return content_clips

    def create_golden_frame_layer(self, duration: float, assets: Dict, job: Dict) -> Optional[VideoClip]:
        """Create golden frame overlay layer"""
        try:
            # Check for custom frame overlay
            frame_path = job.get('frame_overlay') or assets.get('frame_overlay')

            if frame_path and os.path.exists(frame_path):
                # Use custom frame overlay
                frame = ImageClip(frame_path).resize((1080, 1920))
                return frame.set_duration(duration)
            else:
                # Create procedural golden frame
                return self.create_procedural_golden_frame(duration)

        except Exception as e:
            self.logger.warning(f"Failed to create golden frame: {str(e)}")
        return None

    def create_procedural_golden_frame(self, duration: float) -> VideoClip:
        """Create procedural golden frame with margin"""
        # Create transparent clip with golden border
        transparent = ColorClip((1080, 1920), color=(0, 0, 0, 0)).set_duration(duration)

        # Add 10px gold border (#D4AF37)
        gold_frame = margin(transparent, 10, color=(0xD4, 0xAF, 0x37))

        self.logger.info("🏆 Created procedural golden frame")
        return gold_frame

    def create_text_layer(self, text: str, duration: float) -> Optional[TextClip]:
        """Create viral text hook overlay"""
        if not text:
            return None

        try:
            # Create text with ImageMagick compatibility
            txt_clip = TextClip(
                text,
                fontsize=60,
                color='white',
                font='Arial-Bold',
                stroke_color='black',
                stroke_width=2,
                method='caption',  # Compatible with ImageMagick
                size=(1080, 200)  # Top banner area
            ).set_duration(duration).set_position(('center', 100))

            self.logger.info(f"📝 Created text overlay: {text[:50]}...")
            return txt_clip

        except Exception as e:
            self.logger.error(f"Failed to create text layer: {str(e)}")
        return None

    def generate_output(self, video_clip: CompositeVideoClip, job_id: str, tenant_id: str) -> Tuple[str, str]:
        """Generate final video and thumbnail"""
        try:
            # Add audio if available
            if hasattr(video_clip, 'audio') and video_clip.audio is not None:
                final_video = video_clip
            else:
                # Add silent audio track for compatibility
                silent_audio = AudioClip([[0, 0]], fps=44100, duration=video_clip.duration)
                final_video = video_clip.set_audio(silent_audio)

            # Generate output paths
            video_path = f"/tmp/video_{job_id}.mp4"
            thumbnail_path = f"/tmp/thumb_{job_id}.jpg"

            # Write video file with encoding='utf-8' for metadata
            final_video.write_videofile(
                video_path,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile='temp-audio.m4a',
                remove_temp=True,
                verbose=False,
                logger=None  # Disable MoviePy's logging to avoid encoding issues
            )

            # Generate thumbnail
            final_video.save_frame(thumbnail_path, t=1.0)  # Frame at 1 second

            # Upload to storage
            video_url = self.upload_to_storage(video_path, f"videos/{tenant_id}/{job_id}.mp4", tenant_id)
            thumbnail_url = self.upload_to_storage(thumbnail_path, f"thumbnails/{tenant_id}/{job_id}.jpg", tenant_id)

            self.logger.info(f"📹 Generated video: {video_url}")
            self.logger.info(f"🖼️ Generated thumbnail: {thumbnail_url}")

            return video_url, thumbnail_url

        except Exception as e:
            self.logger.error(f"Failed to generate output: {str(e)}")
            raise

    # Database methods (to be implemented)
    def get_job(self, job_id: str) -> Optional[Dict]:
        """Get job details from database"""
        query = "SELECT * FROM video_processing_jobs WHERE id = %s"
        with self.db_conn.cursor() as cursor:
            cursor.execute(query, (job_id,))
            return cursor.fetchone()

    def update_job_status(self, job_id: str, status: str, **kwargs):
        """Update job status in database"""
        set_clauses = ["status = %s"]
        values = [status]

        for key, value in kwargs.items():
            if key == 'started_at':
                set_clauses.append("started_at = NOW()")
            elif key == 'completed_at':
                set_clauses.append("completed_at = NOW()")
            elif key == 'last_error':
                set_clauses.append("last_error = %s")
                values.append(value)
            elif key == 'attempts':
                set_clauses.append("attempts = attempts + 1")
            elif key == 'output_video_url':
                set_clauses.append("output_video_url = %s")
                values.append(value)
            elif key == 'output_thumbnail_url':
                set_clauses.append("output_thumbnail_url = %s")
                values.append(value)

        query = f"UPDATE video_processing_jobs SET {', '.join(set_clauses)} WHERE id = %s"
        values.append(job_id)

        with self.db_conn.cursor() as cursor:
            cursor.execute(query, values)
            self.db_conn.commit()

    # Asset management methods (to be implemented)
    def download_assets(self, job: Dict) -> Dict:
        """Download required assets for job"""
        # Implementation needed for downloading from S3/storage
        pass

    def download_audio_file(self, audio_file: str) -> str:
        """Download audio file to temporary location"""
        # Implementation needed
        pass

    def get_default_asset(self, asset_name: str) -> Optional[str]:
        """Get default system asset"""
        # Implementation needed for default overlays
        pass

    def upload_to_storage(self, local_path: str, remote_path: str, tenant_id: str) -> str:
        """Upload file to storage and return URL"""
        # Implementation needed for S3/Cloudflare R2 upload
        pass

    def cleanup_temp_files(self):
        """Clean up temporary files"""
        # Implementation needed
        pass

def main():
    """Main worker loop"""
    config = {
        'db_host': os.getenv('DB_HOST', 'localhost'),
        'db_name': os.getenv('DB_NAME', 'sass_store'),
        'db_user': os.getenv('DB_USER', 'postgres'),
        'db_password': os.getenv('DB_PASSWORD'),
        's3_endpoint': os.getenv('S3_ENDPOINT'),
        's3_access_key': os.getenv('S3_ACCESS_KEY'),
        's3_secret_key': os.getenv('S3_SECRET_KEY'),
    }

    processor = VideoProcessor(config)

    # Main processing loop
    while True:
        try:
            # Get next pending job
            query = """
                SELECT id FROM video_processing_jobs
                WHERE status = 'pending'
                ORDER BY priority DESC, created_at ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            """

            with processor.db_conn.cursor() as cursor:
                cursor.execute(query)
                job = cursor.fetchone()

            if job:
                success = processor.process_job(job['id'])
                if not success:
                    # Check if should retry
                    job_details = processor.get_job(job['id'])
                    if job_details['attempts'] < job_details['max_attempts']:
                        # Reset to pending for retry
                        processor.update_job_status(job['id'], 'pending')
                    else:
                        # Mark as failed after max attempts
                        processor.update_job_status(job['id'], 'failed')
            else:
                # No jobs available, wait
                import time
                time.sleep(5)

        except KeyboardInterrupt:
            processor.logger.info("👋 Worker stopped by user")
            break
        except Exception as e:
            processor.logger.error(f"Worker error: {str(e)}")
            import time
            time.sleep(10)

if __name__ == "__main__":
    main()
```

## API Endpoints

### Location: `apps/api/app/api/v1/video/process/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { videoProcessingJobs } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imageIds,
      audioFile,
      textOverlay,
      overlayType = "golden-frame",
      qualityMode = "normal",
    } = body;

    // Validate tenant (from auth middleware)
    const tenantId = request.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID required" },
        { status: 401 }
      );
    }

    // Create video processing job
    const [job] = await db
      .insert(videoProcessingJobs)
      .values({
        tenantId,
        status: "pending",
        priority: 0,
        imageIds,
        audioFile,
        textOverlay,
        overlayType,
        qualityMode,
        durationTarget: 30.0, // Default 30 seconds
      })
      .returning();

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: "pending",
      estimatedDuration: 30,
    });
  } catch (error) {
    console.error("Video processing request error:", error);
    return NextResponse.json(
      { error: "Failed to create video processing job" },
      { status: 500 }
    );
  }
}
```

### Location: `apps/api/app/api/v1/video/jobs/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { videoProcessingJobs } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID required" },
        { status: 401 }
      );
    }

    const [job] = await db
      .select()
      .from(videoProcessingJobs)
      .where(eq(videoProcessingJobs.id, params.id))
      .limit(1);

    if (!job || job.tenantId !== tenantId) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress:
          job.status === "processing"
            ? 50
            : job.status === "completed"
              ? 100
              : 0,
        outputVideoUrl: job.outputVideoUrl,
        outputThumbnailUrl: job.outputThumbnailUrl,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        processingTimeMs: job.processingTimeMs,
        lastError: job.lastError,
      },
    });
  } catch (error) {
    console.error("Get job status error:", error);
    return NextResponse.json(
      { error: "Failed to get job status" },
      { status: 500 }
    );
  }
}
```

## Asset Management Structure

### Default Assets Directory: `public/video-assets/`

```
public/video-assets/
├── overlays/
│   ├── glitter-rain.mp4
│   └── sparkles.mp4
├── frames/
│   ├── golden-frame.png
│   ├── luxury-frame-1.png
│   └── luxury-frame-2.png
└── audio/
    ├── ambient-1.mp3
    ├── ambient-2.mp3
    └── upbeat-1.mp3
```

## Deployment and Monitoring

### 1. Worker Service

Create `scripts/video-worker.service` for systemd:

```ini
[Unit]
Description=Video Processing Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/sass-store
ExecStart=/usr/bin/python3 /opt/sass-store/scripts/video-processor-worker.py
Restart=always
RestartSec=10
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

### 2. Package Dependencies

Add to `apps/api/package.json`:

```json
{
  "dependencies": {
    "moviepy": "^1.0.3",
    "librosa": "^0.10.0",
    "opencv-python": "^4.8.0",
    "pillow": "^10.0.0",
    "numpy": "^1.24.0"
  }
}
```

### 3. Environment Variables

Add to `.env.example`:

```bash
# Video Processing
VIDEO_WORKER_CONCURRENCY=2
VIDEO_TEMP_DIR=/tmp/video-processing
VIDEO_MAX_DURATION=60
VIDEO_MAX_FILE_SIZE=100MB
```

## Testing Strategy

### 1. Unit Tests

Location: `tests/unit/video-processor.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { VideoProcessor } from "../../scripts/video-processor-worker";

describe("VideoProcessor", () => {
  it("should create 4-layer composition", async () => {
    const processor = new VideoProcessor(testConfig);
    const composition = await processor.create_composition(
      testAssets,
      30.0,
      [1.0, 2.0, 3.0],
      testJob
    );

    expect(composition).toBeDefined();
    expect(composition.size).toEqual([1080, 1920]);
  });

  it("should handle audio beat detection", async () => {
    const processor = new VideoProcessor(testConfig);
    const [duration, beats] = await processor.process_audio("test-audio.mp3");

    expect(duration).toBeGreaterThan(0);
    expect(Array.isArray(beats)).toBe(true);
  });
});
```

### 2. Integration Tests

Location: `tests/integration/video-processing.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { POST } from "../helpers/api";

describe("Video Processing API", () => {
  it("should create video processing job", async () => {
    const response = await POST("/api/v1/video/process", {
      imageIds: ["test-image-1", "test-image-2"],
      audioFile: "test-audio.mp3",
      textOverlay: "✨ Test Video",
      overlayType: "golden-frame",
    });

    expect(response.success).toBe(true);
    expect(response.jobId).toBeDefined();
  });

  it("should track job progress", async () => {
    const createResponse = await POST("/api/v1/video/process", testJobData);
    const jobId = createResponse.jobId;

    // Poll for completion
    let jobStatus = await GET(`/api/v1/video/jobs/${jobId}`);

    expect(jobStatus.status).toBe("pending");

    // Wait for processing (mock worker)
    await waitForWorker();

    jobStatus = await GET(`/api/v1/video/jobs/${jobId}`);
    expect(jobStatus.status).toBe("completed");
    expect(jobStatus.outputVideoUrl).toBeDefined();
  });
});
```

## Security Considerations

### 1. Input Validation

```typescript
const videoProcessingSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1).max(10),
  audioFile: z.string().optional(),
  textOverlay: z.string().max(500).optional(),
  overlayType: z
    .enum(["golden-frame", "silver-frame", "no-frame"])
    .default("golden-frame"),
  qualityMode: z.enum(["normal", "eco", "freeze"]).default("normal"),
});
```

### 2. Tenant Isolation

All database queries must include tenant filtering:

```typescript
.where(eq(videoProcessingJobs.tenantId, tenantId))
```

### 3. Asset Security

- Signed URLs for asset access
- Tenant-scoped storage paths
- File type and size validation
- Malware scanning for uploads

## Performance Optimization

### 1. Resource Management

- Limit concurrent jobs per tenant
- Memory-efficient processing with streaming
- GPU acceleration if available
- Temporary file cleanup

### 2. Caching Strategy

- Cache overlay assets in memory
- Reuse processed audio beat detection
- Thumbnail generation caching
- Database query optimization

### 3. Monitoring Metrics

- Job processing time (P50, P95, P99)
- Success/failure rates per tenant
- Resource utilization (CPU, memory, storage)
- Queue depth and wait times

## Next Steps

1. **Immediate**: Create database migration for new tables
2. **Priority**: Implement basic Python worker with UTF-8 fix
3. **Core**: Implement 4-layer composition engine
4. **Integration**: Add API endpoints and job queue
5. **Polish**: Add error handling, monitoring, and tests
6. **Production**: Deploy worker service and configure monitoring

This implementation plan provides a comprehensive foundation for the luxury golden frame video processing system with robust error handling, audio synchronization, and multi-layer composition capabilities.
