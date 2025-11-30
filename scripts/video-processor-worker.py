#!/usr/bin/env python3
"""
Video Processing Worker with Luxury Golden Frame Composition
Handles multi-layer video composition with audio synchronization
"""

import sys
import os
import json
import logging
import tempfile
import shutil
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import time

# CRITICAL: Fix UTF-8 encoding at the very beginning of script execution
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

# Database imports (PostgreSQL)
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    logging.error("psycopg2 not available, database operations will fail")

# Storage imports (S3/Cloudflare R2)
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    logging.error("boto3 not available, storage operations will fail")

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
                logging.FileHandler('/tmp/video-processor.log', encoding='utf-8')
            ]
        )
        self.logger = logging.getLogger('VideoProcessor')
    
    def setup_connections(self):
        """Initialize database and storage connections"""
        # Database connection
        if PSYCOPG2_AVAILABLE:
            try:
                self.db_conn = psycopg2.connect(
                    host=self.config.get('db_host', 'localhost'),
                    database=self.config.get('db_name', 'sass_store'),
                    user=self.config.get('db_user', 'postgres'),
                    password=self.config.get('db_password', ''),
                    cursor_factory=RealDictCursor
                )
                self.logger.info("✅ Database connection established")
            except Exception as e:
                self.logger.error(f"❌ Database connection failed: {str(e)}")
                self.db_conn = None
        else:
            self.logger.error("❌ psycopg2 not available")
        
        # S3 client for asset storage
        if BOTO3_AVAILABLE:
            try:
                self.s3_client = boto3.client(
                    's3',
                    endpoint_url=self.config.get('s3_endpoint', ''),
                    aws_access_key_id=self.config.get('s3_access_key', ''),
                    aws_secret_access_key=self.config.get('s3_secret_key', '')
                )
                self.logger.info("✅ Storage client initialized")
            except Exception as e:
                self.logger.error(f"❌ Storage client failed: {str(e)}")
                self.s3_client = None
        else:
            self.logger.error("❌ boto3 not available")
    
    def process_job(self, job_id: str) -> bool:
        """Process a single video job with comprehensive error handling"""
        try:
            self.logger.info(f"🎬 Starting video processing job: {job_id} ✨")
            
            # Update job status to processing
            self.update_job_status(job_id, 'processing', started_at='NOW()')
            
            # Get job details
            job = self.get_job(job_id)
            if not job:
                self.logger.error(f"❌ Job {job_id} not found")
                return False
            
            # Download required assets
            assets = self.download_assets(job)
            if not assets:
                self.logger.error(f"❌ Failed to download assets for job {job_id}")
                self.update_job_status(job_id, 'failed', last_error='Asset download failed')
                return False
            
            # Process audio with beat detection
            audio_duration, beat_times = self.process_audio(job.get('audio_file'))
            
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
                last_error=str(e)
            )
            return False
        finally:
            # Cleanup temporary files
            self.cleanup_temp_files()
    
    def process_audio(self, audio_file: Optional[str]) -> Tuple[float, List[float]]:
        """Process audio with librosa beat detection or fallback"""
        if not audio_file:
            self.logger.warning("⚠️ No audio file provided, using default 30 seconds")
            return 30.0, []  # Default 30 seconds, no beats
        
        try:
            if LIBROSA_AVAILABLE:
                return self.process_audio_with_librosa(audio_file)
            else:
                return self.process_audio_fallback(audio_file)
        except Exception as e:
            self.logger.warning(f"⚠️ Audio processing failed, using fallback: {str(e)}")
            return self.process_audio_fallback(audio_file)
    
    def process_audio_with_librosa(self, audio_file: str) -> Tuple[float, List[float]]:
        """Advanced audio processing with librosa beat detection"""
        self.logger.info("🎵 Using librosa for beat detection")
        
        # Download audio file
        audio_path = self.download_audio_file(audio_file)
        if not audio_path:
            self.logger.error("❌ Failed to download audio file")
            return 30.0, []
        
        try:
            # Load audio and detect beats
            y, sr = librosa.load(audio_path)
            tempo, beats = librosa.beat.beat_track(y=y, sr=sr, trim=False)
            
            # Calculate duration
            duration = librosa.get_duration(y=y, sr=sr)
            
            # Convert beat frames to time stamps
            beat_times = librosa.frames_to_time(beats, sr=sr).tolist()
            
            self.logger.info(f"🎵 Detected {len(beat_times)} beats in {duration:.2f}s audio")
            return duration, beat_times
        except Exception as e:
            self.logger.error(f"❌ Librosa processing failed: {str(e)}")
            return 30.0, []
    
    def process_audio_fallback(self, audio_file: str) -> Tuple[float, List[float]]:
        """Fallback audio processing without librosa"""
        self.logger.warning("⚠️ Using fallback audio processing (no beat detection)")
        
        # Download audio file
        audio_path = self.download_audio_file(audio_file)
        if not audio_path:
            self.logger.error("❌ Failed to download audio file")
            return 30.0, []
        
        try:
            # Use MoviePy for basic audio analysis
            audio_clip = AudioFileClip(audio_path)
            duration = audio_clip.duration
            
            # Generate simple beat intervals (every 2 seconds)
            beat_times = [i * 2.0 for i in range(int(duration // 2))]
            
            self.logger.info(f"🎵 Fallback: {duration:.2f}s audio, {len(beat_times)} beat intervals")
            return duration, beat_times
        except Exception as e:
            self.logger.error(f"❌ Fallback audio processing failed: {str(e)}")
            return 30.0, []
    
    def create_composition(self, assets: Dict, audio_duration: float, beat_times: List[float], job: Dict) -> CompositeVideoClip:
        """Create 4-layer luxury golden frame composition"""
        
        # Layer Z=0: Background (Black #050505)
        self.logger.info("🎨 Creating background layer (Black #050505)")
        background = ColorClip((1080, 1920), color=(0x05, 0x05, 0x05)).set_duration(audio_duration)
        
        # Layer Z=1: Atmosphere/Rain overlay
        self.logger.info("🌧️ Creating atmosphere/rain overlay layer")
        atmosphere = self.create_atmosphere_layer(audio_duration, assets)
        
        # Layer Z=2: Content (Product images with Ken Burns)
        self.logger.info("🖼️ Creating content layers with Ken Burns effect")
        content_clips = self.create_content_layers(assets, audio_duration, beat_times)
        
        # Layer Z=3: Golden Frame
        self.logger.info("🏆 Creating golden frame overlay layer")
        frame = self.create_golden_frame_layer(audio_duration, assets, job)
        
        # Layer Z=4: Text Hook
        self.logger.info("📝 Creating text overlay layer")
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
        
        try:
            final_composition = CompositeVideoClip(clips, size=(1080, 1920))
            self.logger.info("🎨 Created 4-layer composition with luxury golden frame")
            return final_composition
        except Exception as e:
            self.logger.error(f"❌ Composition creation failed: {str(e)}")
            # Return background as fallback
            return background
    
    def create_atmosphere_layer(self, duration: float, assets: Dict) -> Optional[VideoClip]:
        """Create atmosphere/rain overlay layer"""
        try:
            # Look for glitter/rain overlay asset
            overlay_path = assets.get('glitter_overlay')
            if not overlay_path:
                overlay_path = self.get_default_asset('glitter-rain.mp4')
            
            if overlay_path and os.path.exists(overlay_path):
                self.logger.info(f"🌧️ Using atmosphere overlay: {overlay_path}")
                overlay = VideoFileClip(overlay_path)
                # Resize to 1080x1920 and loop if necessary
                if overlay.duration < duration:
                    overlay = overlay.loop(duration=duration)
                overlay = overlay.resize((1080, 1920))
                return overlay.set_opacity(0.7)  # 70% opacity
            else:
                self.logger.warning("⚠️ No atmosphere overlay found, skipping")
                return None
        except Exception as e:
            self.logger.warning(f"⚠️ Failed to create atmosphere layer: {str(e)}")
        return None
    
    def create_content_layers(self, assets: Dict, duration: float, beat_times: List[float]) -> List[VideoClip]:
        """Create content layers with Ken Burns effect"""
        content_clips = []
        
        # Get product images
        images = assets.get('product_images', [])
        if not images:
            self.logger.warning("⚠️ No product images found")
            return content_clips
        
        # Calculate clip duration based on beats or equal distribution
        if beat_times:
            clip_duration = self.calculate_beat_based_durations(beat_times, len(images))
        else:
            clip_duration = duration / len(images)
        
        for i, image_path in enumerate(images):
            try:
                self.logger.info(f"🖼️ Processing content image {i+1}/{len(images)}: {image_path}")
                
                # Load and resize image to fit inside frame (900x1600)
                img = ImageClip(image_path)
                if img.size[0] > 900 or img.size[1] > 1600:
                    img = img.resize((900, 1600))
                
                # Apply Ken Burns zoom effect (1.0 -> 1.05)
                zoom_clip = img.resize(lambda t: (
                    900 * (1 + 0.05 * t), 
                    1600 * (1 + 0.05 * t)
                ))
                
                # Set duration and position (centered)
                start_time = sum(clip_duration[:i]) if i > 0 else 0
                clip = zoom_clip.set_duration(clip_duration[i]).set_position(('center', 'center'))
                
                content_clips.append(clip.set_start(start_time))
                
            except Exception as e:
                self.logger.error(f"❌ Failed to process image {image_path}: {str(e)}")
        
        return content_clips
    
    def create_golden_frame_layer(self, duration: float, assets: Dict, job: Dict) -> Optional[VideoClip]:
        """Create golden frame overlay layer"""
        try:
            # Check for custom frame overlay
            frame_path = job.get('frame_overlay') or assets.get('frame_overlay')
            
            if frame_path and os.path.exists(frame_path):
                # Use custom frame overlay
                self.logger.info(f"🏆 Using custom frame overlay: {frame_path}")
                frame = ImageClip(frame_path).resize((1080, 1920))
                return frame.set_duration(duration)
            else:
                # Create procedural golden frame
                self.logger.info("🏆 Creating procedural golden frame")
                return self.create_procedural_golden_frame(duration)
                
        except Exception as e:
            self.logger.warning(f"⚠️ Failed to create golden frame: {str(e)}")
        return None
    
    def create_procedural_golden_frame(self, duration: float) -> VideoClip:
        """Create procedural golden frame with margin"""
        try:
            # Create transparent clip with golden border
            transparent = ColorClip((1080, 1920), color=(0, 0, 0, 0)).set_duration(duration)
            
            # Add 10px gold border (#D4AF37)
            gold_frame = margin(transparent, 10, color=(0xD4, 0xAF, 0x37))
            
            self.logger.info("🏆 Created procedural golden frame")
            return gold_frame
        except Exception as e:
            self.logger.error(f"❌ Failed to create procedural golden frame: {str(e)}")
            # Return transparent clip as fallback
            return ColorClip((1080, 1920), color=(0, 0, 0, 0)).set_duration(duration)
    
    def create_text_layer(self, text: str, duration: float) -> Optional[TextClip]:
        """Create viral text hook overlay"""
        if not text:
            self.logger.info("📝 No text overlay provided")
            return None
        
        try:
            self.logger.info(f"📝 Creating text overlay: {text[:50]}...")
            
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
            
            self.logger.info("✅ Text overlay created successfully")
            return txt_clip
            
        except Exception as e:
            self.logger.error(f"❌ Failed to create text layer: {str(e)}")
        return None
    
    def generate_output(self, video_clip: CompositeVideoClip, job_id: str, tenant_id: str) -> Tuple[str, str]:
        """Generate final video and thumbnail"""
        try:
            self.logger.info("📹 Generating output video and thumbnail")
            
            # Add audio if available
            if hasattr(video_clip, 'audio') and video_clip.audio is not None:
                final_video = video_clip
            else:
                # Add silent audio track for compatibility
                self.logger.info("🔇 Adding silent audio track for compatibility")
                silent_audio = AudioClip([[0, 0]], fps=44100, duration=video_clip.duration)
                final_video = video_clip.set_audio(silent_audio)
            
            # Generate output paths
            video_path = f"/tmp/video_{job_id}.mp4"
            thumbnail_path = f"/tmp/thumb_{job_id}.jpg"
            
            # Write video file with proper encoding
            self.logger.info(f"💾 Writing video to: {video_path}")
            final_video.write_videofile(
                video_path,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile='temp-audio.m4a',
                remove_temp=True,
                verbose=False,
                logger=None,  # Disable MoviePy's logging to avoid encoding issues
                threads=4  # Use multiple threads for faster processing
            )
            
            # Generate thumbnail
            self.logger.info(f"🖼️ Generating thumbnail: {thumbnail_path}")
            final_video.save_frame(thumbnail_path, t=1.0)  # Frame at 1 second
            
            # Upload to storage
            video_url = self.upload_to_storage(video_path, f"videos/{tenant_id}/{job_id}.mp4", tenant_id)
            thumbnail_url = self.upload_to_storage(thumbnail_path, f"thumbnails/{tenant_id}/{job_id}.jpg", tenant_id)
            
            self.logger.info(f"✅ Generated video: {video_url}")
            self.logger.info(f"✅ Generated thumbnail: {thumbnail_url}")
            
            return video_url, thumbnail_url
            
        except Exception as e:
            self.logger.error(f"❌ Failed to generate output: {str(e)}")
            raise
    
    def calculate_beat_based_durations(self, beat_times: List[float], num_images: int) -> List[float]:
        """Calculate clip durations based on beat times"""
        if not beat_times or num_images == 0:
            return [30.0]  # Default 30 seconds
        
        durations = []
        for i in range(num_images):
            if i < len(beat_times) - 1:
                # Duration between beats
                duration = beat_times[i + 1] - beat_times[i]
            else:
                # Last clip gets remaining time
                total_beat_time = beat_times[-1] if beat_times else 30.0
                duration = max(2.0, total_beat_time - sum(durations))
            durations.append(duration)
        
        return durations
    
    # Database methods
    def get_job(self, job_id: str) -> Optional[Dict]:
        """Get job details from database"""
        if not self.db_conn:
            self.logger.error("❌ Database connection not available")
            return None
            
        query = "SELECT * FROM video_processing_jobs WHERE id = %s"
        try:
            with self.db_conn.cursor() as cursor:
                cursor.execute(query, (job_id,))
                return cursor.fetchone()
        except Exception as e:
            self.logger.error(f"❌ Database query failed: {str(e)}")
            return None
    
    def update_job_status(self, job_id: str, status: str, **kwargs):
        """Update job status in database"""
        if not self.db_conn:
            self.logger.error("❌ Database connection not available")
            return
            
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
        
        try:
            with self.db_conn.cursor() as cursor:
                cursor.execute(query, values)
                self.db_conn.commit()
        except Exception as e:
            self.logger.error(f"❌ Database update failed: {str(e)}")
    
    # Asset management methods
    def download_assets(self, job: Dict) -> Dict:
        """Download required assets for job"""
        assets = {}
        
        # Download product images
        image_ids = job.get('image_ids', [])
        if image_ids:
            product_images = []
            for image_id in image_ids:
                image_path = self.download_media_asset(image_id)
                if image_path:
                    product_images.append(image_path)
            assets['product_images'] = product_images
        
        # Download audio file
        audio_file = job.get('audio_file')
        if audio_file:
            audio_path = self.download_audio_file(audio_file)
            if audio_path:
                assets['audio_path'] = audio_path
        
        # Download overlays
        overlay_type = job.get('overlay_type', 'golden-frame')
        if overlay_type == 'golden-frame':
            frame_path = self.download_frame_asset('golden-frame.png')
            if frame_path:
                assets['frame_overlay'] = frame_path
            
            glitter_path = self.download_overlay_asset('glitter-rain.mp4')
            if glitter_path:
                assets['glitter_overlay'] = glitter_path
        
        return assets
    
    def download_media_asset(self, asset_id: str) -> Optional[str]:
        """Download media asset from storage"""
        if not self.s3_client:
            self.logger.error("❌ Storage client not available")
            return None
            
        try:
            # Get asset info from database
            query = "SELECT filename, content_hash FROM media_assets WHERE id = %s"
            with self.db_conn.cursor() as cursor:
                cursor.execute(query, (asset_id,))
                asset = cursor.fetchone()
            
            if not asset:
                self.logger.error(f"❌ Asset {asset_id} not found in database")
                return None
            
            # Download from S3
            local_path = f"/tmp/asset_{asset_id}.jpg"
            self.s3_client.download_file(
                f"media/{asset['content_hash'][:2]}/{asset['content_hash']}/{asset['filename']}",
                local_path
            )
            
            self.logger.info(f"✅ Downloaded asset {asset_id} to {local_path}")
            return local_path
            
        except Exception as e:
            self.logger.error(f"❌ Failed to download asset {asset_id}: {str(e)}")
            return None
    
    def download_audio_file(self, audio_file: str) -> Optional[str]:
        """Download audio file from storage"""
        if not self.s3_client:
            self.logger.error("❌ Storage client not available")
            return None
            
        try:
            local_path = f"/tmp/audio_{int(time.time())}.mp3"
            self.s3_client.download_file(f"audio/{audio_file}", local_path)
            self.logger.info(f"✅ Downloaded audio {audio_file} to {local_path}")
            return local_path
        except Exception as e:
            self.logger.error(f"❌ Failed to download audio {audio_file}: {str(e)}")
            return None
    
    def download_frame_asset(self, frame_name: str) -> Optional[str]:
        """Download frame asset from storage"""
        if not self.s3_client:
            self.logger.error("❌ Storage client not available")
            return None
            
        try:
            local_path = f"/tmp/frame_{int(time.time())}.png"
            self.s3_client.download_file(f"frames/{frame_name}", local_path)
            self.logger.info(f"✅ Downloaded frame {frame_name} to {local_path}")
            return local_path
        except Exception as e:
            self.logger.error(f"❌ Failed to download frame {frame_name}: {str(e)}")
            return None
    
    def download_overlay_asset(self, overlay_name: str) -> Optional[str]:
        """Download overlay asset from storage"""
        if not self.s3_client:
            self.logger.error("❌ Storage client not available")
            return None
            
        try:
            local_path = f"/tmp/overlay_{int(time.time())}.mp4"
            self.s3_client.download_file(f"overlays/{overlay_name}", local_path)
            self.logger.info(f"✅ Downloaded overlay {overlay_name} to {local_path}")
            return local_path
        except Exception as e:
            self.logger.error(f"❌ Failed to download overlay {overlay_name}: {str(e)}")
            return None
    
    def get_default_asset(self, asset_name: str) -> Optional[str]:
        """Get default system asset path"""
        default_assets_path = "/opt/sass-store/public/video-assets"
        asset_path = os.path.join(default_assets_path, asset_name)
        
        if os.path.exists(asset_path):
            self.logger.info(f"✅ Using default asset: {asset_path}")
            return asset_path
        else:
            self.logger.warning(f"⚠️ Default asset not found: {asset_path}")
            return None
    
    def upload_to_storage(self, local_path: str, remote_path: str, tenant_id: str) -> str:
        """Upload file to storage and return URL"""
        if not self.s3_client:
            self.logger.error("❌ Storage client not available")
            return ""
            
        try:
            self.s3_client.upload_file(local_path, remote_path)
            # Generate URL (this would depend on your storage provider)
            url = f"https://your-storage-domain.com/{remote_path}"
            self.logger.info(f"✅ Uploaded {local_path} to {remote_path}")
            return url
        except Exception as e:
            self.logger.error(f"❌ Failed to upload {local_path}: {str(e)}")
            return ""
    
    def cleanup_temp_files(self):
        """Clean up temporary files"""
        try:
            temp_dir = "/tmp"
            for filename in os.listdir(temp_dir):
                if filename.startswith(('video_', 'thumb_', 'asset_', 'audio_', 'frame_', 'overlay_')):
                    file_path = os.path.join(temp_dir, filename)
                    try:
                        os.remove(file_path)
                        self.logger.debug(f"🧹 Cleaned up temp file: {file_path}")
                    except Exception as e:
                        self.logger.warning(f"⚠️ Failed to remove temp file {file_path}: {str(e)}")
        except Exception as e:
            self.logger.error(f"❌ Cleanup failed: {str(e)}")

def main():
    """Main worker loop"""
    # Configuration from environment variables
    config = {
        'db_host': os.getenv('DB_HOST', 'localhost'),
        'db_name': os.getenv('DB_NAME', 'sass_store'),
        'db_user': os.getenv('DB_USER', 'postgres'),
        'db_password': os.getenv('DB_PASSWORD', ''),
        's3_endpoint': os.getenv('S3_ENDPOINT', ''),
        's3_access_key': os.getenv('S3_ACCESS_KEY', ''),
        's3_secret_key': os.getenv('S3_SECRET_KEY', ''),
    }
    
    processor = VideoProcessor(config)
    
    # Main processing loop
    processor.logger.info("🚀 Video processor worker started")
    
    while True:
        try:
            # Get next pending job
            if not processor.db_conn:
                processor.logger.error("❌ No database connection, waiting...")
                time.sleep(10)
                continue
                
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
                    if job_details and job_details['attempts'] < job_details['max_attempts']:
                        processor.logger.info(f"🔄 Retrying job {job['id']} (attempt {job_details['attempts'] + 1})")
                        # Reset to pending for retry
                        processor.update_job_status(job['id'], 'pending')
                    else:
                        # Mark as failed after max attempts
                        processor.logger.error(f"❌ Job {job['id']} failed after max attempts")
                        processor.update_job_status(job['id'], 'failed')
            else:
                # No jobs available, wait
                processor.logger.debug("💤 No pending jobs, waiting...")
                time.sleep(5)
                
        except KeyboardInterrupt:
            processor.logger.info("👋 Worker stopped by user")
            break
        except Exception as e:
            processor.logger.error(f"❌ Worker error: {str(e)}")
            time.sleep(10)

if __name__ == "__main__":
    main()