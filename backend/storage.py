"""
Storage Settings and File Upload Module for iDrive E2 (S3-compatible)
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import uuid
from datetime import datetime, timezone
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

# Models
class StorageSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider: str = "idrive_e2"
    endpoint_url: str = ""
    access_key: str = ""
    secret_key: str = ""
    bucket_name: str = ""
    region: str = "us-east-1"
    public_url: str = ""  # Custom public URL from iDrive dashboard
    is_configured: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StorageSettingsUpdate(BaseModel):
    endpoint_url: Optional[str] = None
    access_key: Optional[str] = None
    secret_key: Optional[str] = None
    bucket_name: Optional[str] = None
    region: Optional[str] = None
    public_url: Optional[str] = None  # Custom public URL

class StorageSettingsResponse(BaseModel):
    id: str
    provider: str
    endpoint_url: str
    access_key_masked: str  # Only show last 4 chars
    bucket_name: str
    region: str
    public_url: str = ""  # Custom public URL
    is_configured: bool
    created_at: str
    updated_at: str

class UploadResponse(BaseModel):
    url: str
    key: str
    filename: str
    content_type: str
    size: int


def _build_public_url(settings: dict, key: str) -> str:
    """Build best-effort direct public URL for S3-compatible object."""
    public_url_base = settings.get("public_url")
    if public_url_base:
        return f"{public_url_base.rstrip('/')}/{key}"

    bucket = settings.get("bucket_name", "").strip()
    region = settings.get("region", "us-central-1").strip() or "us-central-1"
    return f"https://{bucket}.{region}.e2.idrivee2.com/{key}"

def get_storage_router(db, require_admin, require_super_admin):
    router = APIRouter(prefix="/api/storage", tags=["Storage"])
    
    def get_s3_client(settings: dict):
        """Create S3 client from settings"""
        if not settings.get("endpoint_url") or not settings.get("access_key") or not settings.get("secret_key"):
            return None
        
        return boto3.client(
            's3',
            endpoint_url=settings["endpoint_url"],
            aws_access_key_id=settings["access_key"],
            aws_secret_access_key=settings["secret_key"],
            region_name=settings.get("region", "us-east-1"),
            config=Config(signature_version='s3v4')
        )

    async def _store_upload_content(*, content: bytes, filename: Optional[str], content_type: str, folder: str) -> UploadResponse:
        settings = await db.storage_settings.find_one({}, {"_id": 0})
        file_ext = os.path.splitext(filename)[1] if filename else ""
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        key = f"{folder}/{unique_filename}"
        file_size = len(content)

        if settings and settings.get("is_configured"):
            try:
                s3_client = get_s3_client(settings)
                if not s3_client:
                    raise HTTPException(status_code=400, detail="Invalid storage configuration")

                s3_client.put_object(
                    Bucket=settings["bucket_name"],
                    Key=key,
                    Body=content,
                    ContentType=content_type or "application/octet-stream",
                    ACL="public-read"
                )
                s3_client.head_object(Bucket=settings["bucket_name"], Key=key)
                return UploadResponse(
                    url=f"/api/storage/public/{key}",
                    key=key,
                    filename=filename or unique_filename,
                    content_type=content_type or "application/octet-stream",
                    size=file_size
                )
            except ClientError as e:
                error_message = e.response.get("Error", {}).get("Message", str(e))
                raise HTTPException(status_code=400, detail=f"Upload failed: {error_message}")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Upload failed: {str(e)}")

        from pathlib import Path

        upload_dir = Path(f"/app/uploads/{folder}")
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / unique_filename
        with open(file_path, "wb") as f:
            f.write(content)

        return UploadResponse(
            url=f"/api/uploads/{folder}/{unique_filename}",
            key=key,
            filename=filename or unique_filename,
            content_type=content_type or "application/octet-stream",
            size=file_size
        )
    
    @router.get("/settings", response_model=StorageSettingsResponse)
    async def get_storage_settings(current_user = Depends(require_admin)):
        """Get current storage settings (admin only)"""
        settings = await db.storage_settings.find_one({}, {"_id": 0})
        
        if not settings:
            # Return default empty settings
            return StorageSettingsResponse(
                id="",
                provider="idrive_e2",
                endpoint_url="",
                access_key_masked="",
                bucket_name="",
                region="us-east-1",
                public_url="",
                is_configured=False,
                created_at=datetime.now(timezone.utc).isoformat(),
                updated_at=datetime.now(timezone.utc).isoformat()
            )
        
        # Mask the access key
        access_key = settings.get("access_key", "")
        masked_key = f"****{access_key[-4:]}" if len(access_key) > 4 else "****"
        
        return StorageSettingsResponse(
            id=settings.get("id", ""),
            provider=settings.get("provider", "idrive_e2"),
            endpoint_url=settings.get("endpoint_url", ""),
            access_key_masked=masked_key,
            bucket_name=settings.get("bucket_name", ""),
            region=settings.get("region", "us-east-1"),
            public_url=settings.get("public_url", ""),
            is_configured=settings.get("is_configured", False),
            created_at=settings.get("created_at", ""),
            updated_at=settings.get("updated_at", "")
        )
    
    @router.put("/settings", response_model=StorageSettingsResponse)
    async def update_storage_settings(settings_update: StorageSettingsUpdate, current_user = Depends(require_super_admin)):
        """Update storage settings (super admin only)"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Get existing settings
        existing = await db.storage_settings.find_one({}, {"_id": 0})
        
        if existing:
            # Update existing
            update_data = {k: v for k, v in settings_update.model_dump().items() if v is not None}
            update_data["updated_at"] = now
            
            # Check if all required fields are present to mark as configured
            merged = {**existing, **update_data}
            is_configured = all([
                merged.get("endpoint_url"),
                merged.get("access_key"),
                merged.get("secret_key"),
                merged.get("bucket_name")
            ])
            update_data["is_configured"] = is_configured
            
            await db.storage_settings.update_one({}, {"$set": update_data})
            updated = await db.storage_settings.find_one({}, {"_id": 0})
        else:
            # Create new
            new_settings = StorageSettings(
                endpoint_url=settings_update.endpoint_url or "",
                access_key=settings_update.access_key or "",
                secret_key=settings_update.secret_key or "",
                bucket_name=settings_update.bucket_name or "",
                region=settings_update.region or "us-east-1",
                public_url=(settings_update.public_url or "").strip(),
            )
            
            is_configured = all([
                new_settings.endpoint_url,
                new_settings.access_key,
                new_settings.secret_key,
                new_settings.bucket_name
            ])
            
            settings_dict = new_settings.model_dump()
            settings_dict["is_configured"] = is_configured
            await db.storage_settings.insert_one(settings_dict)
            updated = settings_dict
        
        # Mask the access key
        access_key = updated.get("access_key", "")
        masked_key = f"****{access_key[-4:]}" if len(access_key) > 4 else "****"
        
        return StorageSettingsResponse(
            id=updated.get("id", ""),
            provider=updated.get("provider", "idrive_e2"),
            endpoint_url=updated.get("endpoint_url", ""),
            access_key_masked=masked_key,
            bucket_name=updated.get("bucket_name", ""),
            region=updated.get("region", "us-east-1"),
            public_url=updated.get("public_url", ""),
            is_configured=updated.get("is_configured", False),
            created_at=updated.get("created_at", ""),
            updated_at=updated.get("updated_at", "")
        )
    
    @router.post("/test-connection")
    async def test_storage_connection(current_user = Depends(require_admin)):
        """Test storage connection"""
        settings = await db.storage_settings.find_one({}, {"_id": 0})
        
        if not settings or not settings.get("is_configured"):
            raise HTTPException(status_code=400, detail="Storage not configured")
        
        try:
            s3_client = get_s3_client(settings)
            if not s3_client:
                raise HTTPException(status_code=400, detail="Invalid storage configuration")
            
            # Try to list objects (limited to 1) to test connection
            s3_client.list_objects_v2(Bucket=settings["bucket_name"], MaxKeys=1)
            
            return {"status": "success", "message": "Connection successful"}
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            error_message = e.response.get("Error", {}).get("Message", str(e))
            raise HTTPException(status_code=400, detail=f"Connection failed: {error_code} - {error_message}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")
    
    @router.post("/upload", response_model=UploadResponse)
    async def upload_file(
        file: UploadFile = File(...),
        folder: str = Form(default="products"),
        current_user = Depends(require_admin)
    ):
        """Upload a file to storage (S3 or local fallback)"""
        content = await file.read()
        return await _store_upload_content(
            content=content,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream",
            folder=folder,
        )

    @router.post("/upload-customization", response_model=UploadResponse)
    async def upload_customization_file(
        file: UploadFile = File(...),
        folder: str = Form(default="customer-customizations"),
    ):
        """Upload a customer-provided customization image."""
        if not (file.content_type or "").startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image uploads are allowed")

        content = await file.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Customization image must be 10MB or smaller")

        safe_folder = (folder or "customer-customizations").strip().replace("..", "")
        return await _store_upload_content(
            content=content,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream",
            folder=safe_folder or "customer-customizations",
        )
    
    @router.delete("/files/{key:path}")
    async def delete_file(key: str, current_user = Depends(require_admin)):
        """Delete a file from storage"""
        settings = await db.storage_settings.find_one({}, {"_id": 0})
        
        if not settings or not settings.get("is_configured"):
            raise HTTPException(status_code=400, detail="Storage not configured")
        
        try:
            s3_client = get_s3_client(settings)
            if not s3_client:
                raise HTTPException(status_code=400, detail="Invalid storage configuration")
            
            s3_client.delete_object(Bucket=settings["bucket_name"], Key=key)
            
            return {"status": "success", "message": "File deleted"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Delete failed: {str(e)}")
    
    @router.get("/list/{folder:path}")
    async def list_folder_files(folder: str, current_user = Depends(require_admin)):
        """List all files in a folder"""
        settings = await db.storage_settings.find_one({}, {"_id": 0})
        
        if not settings or not settings.get("is_configured"):
            raise HTTPException(status_code=400, detail="Storage not configured")
        
        try:
            s3_client = get_s3_client(settings)
            if not s3_client:
                raise HTTPException(status_code=400, detail="Invalid storage configuration")
            
            # List objects in the folder
            response = s3_client.list_objects_v2(
                Bucket=settings["bucket_name"],
                Prefix=f"{folder}/"
            )
            
            files = []
            
            for obj in response.get("Contents", []):
                key = obj["Key"]
                filename = key.split("/")[-1] if "/" in key else key
                if filename:  # Skip the folder itself
                    url = f"/api/storage/public/{key}"
                    files.append({
                        "key": key,
                        "filename": filename,
                        "url": url,
                        "size": obj.get("Size", 0),
                        "last_modified": obj.get("LastModified").isoformat() if obj.get("LastModified") else None
                    })
            
            return {"files": files, "folder": folder}
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code == "NoSuchKey" or "not found" in str(e).lower():
                return {"files": [], "folder": folder}
            raise HTTPException(status_code=400, detail=f"List failed: {str(e)}")
        except Exception:
            return {"files": [], "folder": folder}
    
    class DeleteRequest(BaseModel):
        folder: str
        filename: str
    
    @router.delete("/delete")
    async def delete_file_by_folder(request: DeleteRequest, current_user = Depends(require_super_admin)):
        """Delete a file from storage (super admin only)"""
        settings = await db.storage_settings.find_one({}, {"_id": 0})
        
        if not settings or not settings.get("is_configured"):
            raise HTTPException(status_code=400, detail="Storage not configured")
        
        try:
            s3_client = get_s3_client(settings)
            if not s3_client:
                raise HTTPException(status_code=400, detail="Invalid storage configuration")
            
            key = f"{request.folder}/{request.filename}"
            s3_client.delete_object(Bucket=settings["bucket_name"], Key=key)
            
            return {"status": "success", "message": "File deleted"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Delete failed: {str(e)}")

    @router.get("/public/{key:path}")
    async def serve_storage_public_file(key: str):
        """Serve uploaded files through backend proxy so product images always render."""
        if ".." in key:
            raise HTTPException(status_code=400, detail="Invalid path")

        settings = await db.storage_settings.find_one({}, {"_id": 0})
        if settings and settings.get("is_configured"):
            try:
                s3_client = get_s3_client(settings)
                if not s3_client:
                    raise HTTPException(status_code=400, detail="Invalid storage configuration")

                obj = s3_client.get_object(Bucket=settings["bucket_name"], Key=key)
                content_type = obj.get("ContentType") or "application/octet-stream"
                body = obj["Body"]

                return StreamingResponse(
                    body,
                    media_type=content_type,
                    headers={"Cache-Control": "public, max-age=31536000"}
                )
            except ClientError as e:
                error_code = e.response.get("Error", {}).get("Code", "")
                if error_code in {"NoSuchKey", "NotFound"}:
                    raise HTTPException(status_code=404, detail="File not found")
                logger.error(f"Failed to proxy S3 file {key}: {str(e)}")
                raise HTTPException(status_code=404, detail="File not found")
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Failed to proxy S3 file {key}: {str(e)}")
                raise HTTPException(status_code=404, detail="File not found")

        local_file = os.path.join("/app/uploads", key)
        if not os.path.exists(local_file):
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(local_file)
    
    @router.post("/upload-site-asset", response_model=UploadResponse)
    async def upload_site_asset(
        file: UploadFile = File(...),
        folder: str = Form(default="site"),
        resize: str = Form(default=""),
        square: str = Form(default=""),
        current_user = Depends(require_admin)
    ):
        """Upload and optionally resize site assets (logo, favicon) to storage"""
        from PIL import Image
        import io
        
        settings = await db.storage_settings.find_one({}, {"_id": 0})
        
        # Read file content
        content = await file.read()
        original_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".png"
        content_type = file.content_type or "image/png"
        
        # Handle ICO files - keep as-is for favicons
        is_ico = original_ext == '.ico' or content_type in ['image/x-icon', 'image/vnd.microsoft.icon']
        
        # Resize if requested and not an ICO
        if resize and not is_ico:
            try:
                max_size = int(resize)
                want_square = square.lower() in ('1', 'true', 'yes')
                img = Image.open(io.BytesIO(content))

                # Convert to RGBA if needed (for transparency support)
                if img.mode not in ('RGBA', 'RGB'):
                    img = img.convert('RGBA')

                width, height = img.size
                if want_square:
                    # App icons (e.g. PWA) must be a true square matching the
                    # declared manifest size, or browsers refuse to treat the
                    # site as installable - scale to fit, then pad to a
                    # centered max_size x max_size canvas.
                    scale = min(max_size / width, max_size / height)
                    fit_width = max(1, round(width * scale))
                    fit_height = max(1, round(height * scale))
                    fitted = img.convert('RGBA').resize((fit_width, fit_height), Image.Resampling.LANCZOS)
                    canvas = Image.new('RGBA', (max_size, max_size), (0, 0, 0, 0))
                    canvas.paste(fitted, ((max_size - fit_width) // 2, (max_size - fit_height) // 2), fitted)
                    img = canvas
                elif width > max_size or height > max_size:
                    # Calculate new dimensions maintaining aspect ratio
                    if width > height:
                        new_width = max_size
                        new_height = int(height * (max_size / width))
                    else:
                        new_height = max_size
                        new_width = int(width * (max_size / height))

                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

                # Save to bytes
                output = io.BytesIO()
                # Save as PNG for transparency support
                img.save(output, format='PNG', optimize=True)
                content = output.getvalue()
                original_ext = '.png'
                content_type = 'image/png'

                logger.info(f"Resized image to {img.size}")
            except Exception as e:
                logger.warning(f"Could not resize image: {e}, using original")
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{original_ext}"
        key = f"{folder}/{unique_filename}"
        file_size = len(content)
        
        # If S3 is configured, use it
        if settings and settings.get("is_configured"):
            try:
                s3_client = get_s3_client(settings)
                if not s3_client:
                    raise HTTPException(status_code=400, detail="Invalid storage configuration")
                
                # Upload to S3
                s3_client.put_object(
                    Bucket=settings["bucket_name"],
                    Key=key,
                    Body=content,
                    ContentType=content_type,
                    ACL="public-read"
                )
                
                # Return proxy URL
                url = f"/api/storage/public/{key}"
                logger.info(f"Site asset uploaded to S3: {url}")
                
                return UploadResponse(
                    url=url,
                    key=key,
                    filename=unique_filename,
                    content_type=content_type,
                    size=file_size
                )
                
            except ClientError as e:
                error_message = e.response.get("Error", {}).get("Message", str(e))
                logger.error(f"S3 upload failed: {error_message}")
                raise HTTPException(status_code=400, detail=f"Upload failed: {error_message}")
            except Exception as e:
                logger.error(f"S3 upload failed: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Upload failed: {str(e)}")
        
        # Fallback to local storage
        try:
            from pathlib import Path
            
            upload_dir = Path(f"/app/uploads/{folder}")
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            file_path = upload_dir / unique_filename
            with open(file_path, "wb") as f:
                f.write(content)
            
            url = f"/api/storage/public/{key}"
            logger.info(f"Site asset saved locally: {url}")
            
            return UploadResponse(
                url=url,
                key=key,
                filename=unique_filename,
                content_type=content_type,
                size=file_size
            )
        except Exception as e:
            logger.error(f"Local storage failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    return router
