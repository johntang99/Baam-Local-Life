import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { fileName, folder, contentType } = await request.json();

    if (!fileName || !folder) {
      return NextResponse.json({ error: 'Missing fileName or folder' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    const filePath = `${folder}/${Date.now()}-${safeName}`;

    // Create a signed URL that allows the client to upload directly to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUploadUrl(filePath);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get the public URL for after upload
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      publicUrl: urlData.publicUrl,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
  }
}
