'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  businessSlug: string;
  existingImages: string[];
}

export default function ImageUploader({ businessSlug, existingImages }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 10;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      alert(`最多上传 ${MAX_IMAGES} 张图片`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.set('file', file);
        formData.set('folder', `businesses/${businessSlug}`);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          console.error('Upload failed:', data.error);
          continue;
        }

        const data = await res.json();
        if (data.url) {
          setImages((prev) => [...prev, data.url]);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (imageUrl: string) => {
    if (!confirm('确定删除这张图片吗？')) return;

    try {
      // Extract path from URL — the path is after /object/public/{bucket}/
      const urlObj = new URL(imageUrl);
      const pathMatch = urlObj.pathname.match(/\/object\/public\/[^/]+\/(.+)/);
      const path = pathMatch ? pathMatch[1] : null;

      if (path) {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path }),
        });
      }

      setImages((prev) => prev.filter((img) => img !== imageUrl));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div>
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-3">
          {images.map((url, idx) => (
            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              <img
                src={url}
                alt={`Business image ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(url)}
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {images.length < MAX_IMAGES && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-9 px-4 text-sm font-medium rounded-lg border border-border bg-bg-card hover:bg-bg-page disabled:opacity-50 inline-flex items-center gap-2"
          >
            {uploading ? '上传中...' : '添加图片'}
          </button>
          <p className="text-xs text-text-muted mt-1">
            已上传 {images.length} / {MAX_IMAGES} 张
          </p>
        </div>
      )}
    </div>
  );
}
