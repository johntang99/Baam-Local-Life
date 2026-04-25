import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  GetContentModerationCommand,
  RekognitionClient,
  StartContentModerationCommand,
} from '@aws-sdk/client-rekognition';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

interface VideoModerationConfig {
  enabled: boolean;
  moderateFullVideo: boolean;
  minConfidence: number;
  blockConfidence: number;
}

interface StartVideoModerationInput {
  postId: string;
  siteId: string;
  videoUrl: string;
  config: VideoModerationConfig;
}

interface StartVideoModerationResult {
  started: boolean;
  reason: string | null;
  provider: 'rekognition';
  jobId: string | null;
  bucket: string | null;
  objectKey: string | null;
  startedAt: string | null;
}

interface PollVideoModerationResult {
  jobStatus: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  pass: boolean | null;
  score: number;
  reason: string | null;
  checkedAt: string | null;
  checkedTargets: number;
}

const VIDEO_UNSAFE_KEYWORDS = [
  'nudity',
  'explicit',
  'sexual',
  'violence',
  'graphic',
  'gore',
  'blood',
  'weapon',
  'self harm',
  'self-harm',
  'hate symbol',
  'drugs',
];

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function getAwsRegion(): string {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
}

function getRekognitionClient(): RekognitionClient | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;
  return new RekognitionClient({
    region: getAwsRegion(),
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getS3Client(): S3Client | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: getAwsRegion(),
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getModerationBucket(): string {
  return (
    process.env.AWS_VIDEO_MODERATION_BUCKET ||
    process.env.AWS_REKOGNITION_VIDEO_BUCKET ||
    process.env.AWS_S3_MODERATION_BUCKET ||
    ''
  ).trim();
}

function isUnsafeLabel(name?: string, parentName?: string): boolean {
  const joined = `${name || ''} ${parentName || ''}`.toLowerCase();
  return VIDEO_UNSAFE_KEYWORDS.some((kw) => joined.includes(kw));
}

function getExtFromContentType(contentType: string | null): string {
  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('mp4')) return 'mp4';
  if (ct.includes('quicktime')) return 'mov';
  if (ct.includes('webm')) return 'webm';
  if (ct.includes('x-matroska') || ct.includes('mkv')) return 'mkv';
  return 'mp4';
}

async function uploadVideoToS3(input: {
  s3: S3Client;
  bucket: string;
  objectKey: string;
  videoUrl: string;
}): Promise<void> {
  const response = await fetch(input.videoUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`video_fetch_failed:${response.status}`);
  }
  const contentType = response.headers.get('content-type') || 'video/mp4';
  const body = Buffer.from(await response.arrayBuffer());
  await input.s3.send(
    new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.objectKey,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function startDiscoverVideoModerationJob(
  input: StartVideoModerationInput,
): Promise<StartVideoModerationResult> {
  const startedAt = new Date().toISOString();
  if (!input.config.enabled || !input.config.moderateFullVideo) {
    return {
      started: false,
      reason: 'full_video_moderation_disabled',
      provider: 'rekognition',
      jobId: null,
      bucket: null,
      objectKey: null,
      startedAt: null,
    };
  }
  const bucket = getModerationBucket();
  if (!bucket) {
    return {
      started: false,
      reason: '视频审核未启动：缺少 AWS_VIDEO_MODERATION_BUCKET',
      provider: 'rekognition',
      jobId: null,
      bucket: null,
      objectKey: null,
      startedAt: null,
    };
  }
  const rekognition = getRekognitionClient();
  const s3 = getS3Client();
  if (!rekognition || !s3) {
    return {
      started: false,
      reason: '视频审核未启动：缺少 AWS 凭据',
      provider: 'rekognition',
      jobId: null,
      bucket: null,
      objectKey: null,
      startedAt: null,
    };
  }

  try {
    const head = await fetch(input.videoUrl, { method: 'HEAD', cache: 'no-store' }).catch(() => null);
    const ext = getExtFromContentType(head?.headers.get('content-type') || null);
    const objectKey = `discover-video-moderation/${input.siteId}/${input.postId}-${Date.now()}.${ext}`;

    await uploadVideoToS3({
      s3,
      bucket,
      objectKey,
      videoUrl: input.videoUrl,
    });

    const out = await rekognition.send(
      new StartContentModerationCommand({
        Video: { S3Object: { Bucket: bucket, Name: objectKey } },
        MinConfidence: input.config.minConfidence,
        JobTag: `discover:${input.siteId}:${input.postId}`,
      }),
    );

    if (!out.JobId) {
      return {
        started: false,
        reason: '视频审核未启动：AWS 未返回 JobId',
        provider: 'rekognition',
        jobId: null,
        bucket,
        objectKey,
        startedAt: null,
      };
    }
    return {
      started: true,
      reason: null,
      provider: 'rekognition',
      jobId: out.JobId,
      bucket,
      objectKey,
      startedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return {
      started: false,
      reason: `视频审核未启动：${message}`,
      provider: 'rekognition',
      jobId: null,
      bucket,
      objectKey: null,
      startedAt: null,
    };
  }
}

export async function pollDiscoverVideoModerationJob(input: {
  jobId: string;
  config: VideoModerationConfig;
}): Promise<PollVideoModerationResult> {
  const rekognition = getRekognitionClient();
  if (!rekognition) {
    return {
      jobStatus: 'FAILED',
      pass: false,
      score: 1,
      reason: '视频审核失败：缺少 AWS 凭据',
      checkedAt: null,
      checkedTargets: 0,
    };
  }

  try {
    let nextToken: string | undefined;
    let status: 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' = 'IN_PROGRESS';
    let statusMessage = '';
    const allLabels: AnyRow[] = [];

    do {
      const out = await rekognition.send(
        new GetContentModerationCommand({
          JobId: input.jobId,
          NextToken: nextToken,
          SortBy: 'TIMESTAMP',
        }),
      );
      const outStatus = String(out.JobStatus || 'IN_PROGRESS').toUpperCase();
      if (outStatus === 'SUCCEEDED') status = 'SUCCEEDED';
      else if (outStatus === 'FAILED') status = 'FAILED';
      else status = 'IN_PROGRESS';
      statusMessage = out.StatusMessage || '';
      if (Array.isArray(out.ModerationLabels)) {
        allLabels.push(...(out.ModerationLabels as unknown as AnyRow[]));
      }
      nextToken = out.NextToken;
      if (status !== 'SUCCEEDED') break;
    } while (nextToken);

    if (status === 'IN_PROGRESS') {
      return {
        jobStatus: 'IN_PROGRESS',
        pass: null,
        score: 0,
        reason: null,
        checkedAt: null,
        checkedTargets: 0,
      };
    }
    if (status === 'FAILED') {
      return {
        jobStatus: 'FAILED',
        pass: false,
        score: 1,
        reason: statusMessage ? `视频审核失败：${statusMessage}` : '视频审核失败',
        checkedAt: new Date().toISOString(),
        checkedTargets: 0,
      };
    }

    let maxRisk = 0;
    let blockedLabel: string | null = null;
    let checkedTargets = 0;
    for (const row of allLabels) {
      const m = (row.ModerationLabel || {}) as AnyRow;
      const name = String(m.Name || '');
      const parent = String(m.ParentName || '');
      const confidence = Number(m.Confidence || 0);
      if (!isUnsafeLabel(name, parent)) continue;
      checkedTargets += 1;
      if (confidence > maxRisk) maxRisk = confidence;
      if (confidence >= input.config.blockConfidence && !blockedLabel) {
        blockedLabel = name || parent || 'unsafe_video';
      }
    }

    if (blockedLabel) {
      return {
        jobStatus: 'SUCCEEDED',
        pass: false,
        score: clamp(maxRisk / 100, 0, 1),
        reason: `视频疑似不健康内容（${blockedLabel}）`,
        checkedAt: new Date().toISOString(),
        checkedTargets,
      };
    }
    return {
      jobStatus: 'SUCCEEDED',
      pass: true,
      score: clamp(maxRisk / 100, 0, 1),
      reason: null,
      checkedAt: new Date().toISOString(),
      checkedTargets,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return {
      jobStatus: 'FAILED',
      pass: false,
      score: 1,
      reason: `视频审核失败：${message}`,
      checkedAt: new Date().toISOString(),
      checkedTargets: 0,
    };
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export async function reconcilePendingDiscoverVideoModerationJobs(input: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  siteId: string;
  config: VideoModerationConfig;
  limit?: number;
}): Promise<{ scanned: number; updated: number }> {
  if (!input.config.enabled || !input.config.moderateFullVideo) {
    return { scanned: 0, updated: 0 };
  }
  const limit = Math.max(1, Math.min(input.limit || 20, 100));
  const { data: rows } = await input.supabase
    .from('voice_posts')
    .select('id, status, ai_spam_score, moderation_reason, metadata, published_at')
    .eq('site_id', input.siteId)
    .eq('post_type', 'video')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })
    .limit(limit);

  const posts = (rows || []) as AnyRow[];
  let scanned = 0;
  let updated = 0;
  for (const post of posts) {
    const metadata = asRecord(post.metadata) || {};
    const moderation = asRecord(metadata.moderation) || {};
    const text = asRecord(moderation.text) || {};
    const media = asRecord(moderation.media) || {};
    const video = asRecord(moderation.video) || {};
    const jobId = typeof video.job_id === 'string' ? video.job_id : '';
    if (!jobId) continue;
    scanned += 1;

    const result = await pollDiscoverVideoModerationJob({
      jobId,
      config: input.config,
    });
    if (result.jobStatus === 'IN_PROGRESS') continue;

    const textPass = text.pass !== false;
    const mediaPass = media.pass !== false;
    const videoPass = result.pass === true;
    const nextStatus = textPass && mediaPass && videoPass ? 'published' : 'pending_review';

    const reasons: string[] = [];
    if (!textPass && typeof text.reason === 'string' && text.reason) reasons.push(text.reason);
    if (!mediaPass && typeof media.reason === 'string' && media.reason) reasons.push(media.reason);
    if (result.reason) reasons.push(result.reason);
    const moderationReason = nextStatus === 'published' ? null : reasons.join('；') || '视频需人工审核';

    const nextMetadata: Record<string, unknown> = {
      ...metadata,
      moderation: {
        ...moderation,
        video: {
          ...video,
          provider: 'rekognition',
          job_status: result.jobStatus,
          pass: result.pass,
          score: result.score,
          reason: result.reason,
          checked_at: result.checkedAt,
          checked_targets: result.checkedTargets,
        },
      },
    };

    const nextScore = Math.max(Number(post.ai_spam_score || 0), result.score || 0);
    const payload: AnyRow = {
      status: nextStatus,
      moderation_reason: moderationReason,
      ai_spam_score: nextScore,
      metadata: nextMetadata,
      updated_at: new Date().toISOString(),
    };
    if (nextStatus === 'published' && !post.published_at) {
      payload.published_at = new Date().toISOString();
    }

    const { error } = await input.supabase
      .from('voice_posts')
      .update(payload)
      .eq('id', post.id)
      .eq('site_id', input.siteId);
    if (!error) updated += 1;
  }
  return { scanned, updated };
}
