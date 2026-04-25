import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSiteContext } from '@/lib/admin-context';
import { getSiteSetting } from '@/lib/site-settings';
import { normalizeDiscoverMediaModerationConfig } from '@/lib/ai/moderate-media';
import { reconcilePendingDiscoverVideoModerationJobs } from '@/lib/ai/moderate-video';
import { DiscoverTable } from './DiscoverTable';

export const metadata = { title: '发现管理 · Admin · Baam' };

export default async function AdminDiscoverPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const ctx = await getAdminSiteContext(params);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const rawModerationSetting = await getSiteSetting(ctx.siteId, 'moderation').catch(() => null);
  const moderationConfig = normalizeDiscoverMediaModerationConfig(rawModerationSetting);
  await reconcilePendingDiscoverVideoModerationJobs({
    supabase,
    siteId: ctx.siteId,
    config: {
      enabled: moderationConfig.enabled,
      moderateFullVideo: moderationConfig.moderateFullVideo,
      minConfidence: moderationConfig.minConfidence,
      blockConfidence: moderationConfig.blockConfidence,
    },
    limit: 20,
  });

  const [{ data: pending }, { data: all }] = await Promise.all([
    supabase
      .from('voice_posts')
      .select('id, slug, title, content, status, post_type, cover_images, cover_image_url, video_url, ai_spam_score, moderation_reason, metadata, created_at, profiles:author_id(display_name)')
      .eq('site_id', ctx.siteId)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('voice_posts')
      .select('id, slug, title, content, status, post_type, cover_images, cover_image_url, video_url, ai_spam_score, moderation_reason, metadata, created_at, profiles:author_id(display_name)')
      .eq('site_id', ctx.siteId)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">发现管理</h1>
          <p className="text-sm text-gray-500 mt-1">审核用户发布的笔记内容</p>
        </div>
      </div>
      <DiscoverTable pendingPosts={pending || []} allPosts={all || []} />
    </div>
  );
}
