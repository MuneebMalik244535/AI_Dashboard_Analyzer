"""
StorageManager — Universal Production Cloud & Local Storage Adapter.

Supports:
  1. AWS S3 Storage (via boto3 if S3_BUCKET_NAME environment variable is set).
  2. Google Cloud Storage (via google-cloud-storage if GCS_BUCKET_NAME is set).
  3. Automatic Local Filesystem Fallback ('uploads/' directory) for local dev.
"""

import os
import io
import logging
from typing import Optional, Union

logger = logging.getLogger(__name__)


class StorageManager:
    """
    Unified Storage Adapter providing seamless file persistence across local disk and cloud storage.
    """

    def __init__(self, local_dir: str = "uploads"):
        self.local_dir = local_dir
        os.makedirs(self.local_dir, exist_ok=True)

        self.s3_bucket = os.getenv("S3_BUCKET_NAME")
        self.gcs_bucket = os.getenv("GCS_BUCKET_NAME")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")

        self.s3_client = None
        self.gcs_client = None

        # Try initializing AWS S3 client if bucket configured
        if self.s3_bucket:
            try:
                import boto3
                self.s3_client = boto3.client("s3", region_name=self.aws_region)
                logger.info("StorageManager initialized with AWS S3 bucket: %s", self.s3_bucket)
            except Exception as e:
                logger.warning("AWS S3 client initialization failed (%s). Falling back to local storage.", e)

        # Try initializing GCS client if bucket configured
        if self.gcs_bucket and not self.s3_client:
            try:
                from google.cloud import storage
                self.gcs_client = storage.Client()
                logger.info("StorageManager initialized with Google Cloud Storage bucket: %s", self.gcs_bucket)
            except Exception as e:
                logger.warning("GCS client initialization failed (%s). Falling back to local storage.", e)

    def save_file(self, content: Union[bytes, str], filename: str) -> str:
        """Save file bytes or text string to cloud storage or local disk."""
        if isinstance(content, str):
            content_bytes = content.encode("utf-8")
        else:
            content_bytes = content

        # 1. AWS S3 Upload
        if self.s3_client and self.s3_bucket:
            try:
                self.s3_client.put_object(
                    Bucket=self.s3_bucket,
                    Key=filename,
                    Body=content_bytes
                )
                logger.info("File '%s' uploaded to AWS S3 bucket '%s'", filename, self.s3_bucket)
                return f"s3://{self.s3_bucket}/{filename}"
            except Exception as e:
                logger.error("AWS S3 upload error (%s) — falling back to local file save.", e)

        # 2. GCS Upload
        if self.gcs_client and self.gcs_bucket:
            try:
                bucket = self.gcs_client.bucket(self.gcs_bucket)
                blob = bucket.blob(filename)
                blob.upload_from_string(content_bytes)
                logger.info("File '%s' uploaded to GCS bucket '%s'", filename, self.gcs_bucket)
                return f"gs://{self.gcs_bucket}/{filename}"
            except Exception as e:
                logger.error("GCS upload error (%s) — falling back to local file save.", e)

        # 3. Local Disk Save (Default Fallback)
        local_path = os.path.join(self.local_dir, filename)
        with open(local_path, "wb") as f:
            f.write(content_bytes)
        logger.info("File '%s' saved to local disk: %s", filename, local_path)
        return local_path

    def get_local_path(self, filename: str) -> str:
        """Returns valid absolute local path for dataframe reading or processing."""
        local_path = os.path.join(self.local_dir, filename)

        # If stored in S3/GCS but not locally present, download to local path
        if not os.path.exists(local_path):
            if self.s3_client and self.s3_bucket:
                try:
                    self.s3_client.download_file(self.s3_bucket, filename, local_path)
                except Exception as e:
                    logger.error("Failed to download '%s' from S3: %s", filename, e)
            elif self.gcs_client and self.gcs_bucket:
                try:
                    bucket = self.gcs_client.bucket(self.gcs_bucket)
                    blob = bucket.blob(filename)
                    blob.download_to_filename(local_path)
                except Exception as e:
                    logger.error("Failed to download '%s' from GCS: %s", filename, e)

        return local_path

    def read_file_bytes(self, filename: str) -> Optional[bytes]:
        """Read raw bytes of file."""
        local_path = self.get_local_path(filename)
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return f.read()
        return None

    def delete_file(self, filename: str) -> bool:
        """Remove file from storage."""
        success = True
        local_path = os.path.join(self.local_dir, filename)
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception as e:
                logger.error("Failed to delete local file %s: %s", local_path, e)
                success = False

        if self.s3_client and self.s3_bucket:
            try:
                self.s3_client.delete_object(Bucket=self.s3_bucket, Key=filename)
            except Exception as e:
                logger.error("Failed to delete S3 file %s: %s", filename, e)
                success = False

        return success
