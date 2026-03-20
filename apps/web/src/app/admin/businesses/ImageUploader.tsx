'use client';
import { useState } from 'react';
import { ImagePickerModal } from '@/components/admin/ImagePickerModal';

interface Props {
  businessSlug: string;
  existingImages: string[];
}

export default function ImageUploader({ businessSlug, existingImages }: Props) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelect = (url: string) => {
    if (images.length >= 10) { alert('最多10张'); return; }
    setImages(prev => [...prev, url]);
  };

  const handleDelete = async (url: string) => {
    if (!confirm('确定删除？')) return;
    // Extract path and delete from storage
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/object\/public\/[^/]+\/(.+)/);
      if (pathMatch) {
        await fetch('/api/media/file', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: pathMatch[1] }),
        });
      }
    } catch {}
    setImages(prev => prev.filter(i => i !== url));
  };

  return (
    <div>
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-3">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => handleDelete(url)}
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100">
                删除
              </button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setPickerOpen(true)}
        className="h-9 px-4 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 inline-flex items-center gap-2">
        📷 选择图片
      </button>
      <span className="text-xs text-gray-400 ml-2">{images.length}/10</span>

      <ImagePickerModal
        open={pickerOpen}
        folder={`businesses/${businessSlug}`}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />
    </div>
  );
}
