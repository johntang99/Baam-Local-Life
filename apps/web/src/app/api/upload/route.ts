import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'media';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string | null; // e.g. 'businesses/wang-family-medical'

    // Validate — accept images and videos
    const isImage = file?.type.startsWith('image/');
    const isVideo = file?.type.startsWith('video/');
    if (!file || (!isImage && !isVideo)) {
      return NextResponse.json({ error: 'Invalid file type. Accepts images and videos.' }, { status: 400 });
    }

    // Supabase Pro plan: bucket set to 200MB
    if (isVideo && file.size > 200 * 1024 * 1024) {
      return NextResponse.json({ error: '视频不能超过 200MB' }, { status: 400 });
    }
    if (isImage && file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '图片不能超过 10MB' }, { status: 400 });
    }

    if (!folder) {
      return NextResponse.json({ error: 'Folder is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    const path = `${folder}/${timestamp}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl, path });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error';
    const bodyTooLarge = /body|payload|size|too large|limit/i.test(message);
    return NextResponse.json(
      {
        error: bodyTooLarge
          ? '上传失败：请求体过大（服务器限制）。请重启服务并确认上传体积限制配置。'
          : `上传失败：${message}`,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
