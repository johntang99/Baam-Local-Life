/**
 * Seed users via Supabase Auth Admin API, then seed profiles, threads, voice posts
 * Run with: node scripts/seed-users.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve('apps/web/.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const seedUsers = [
  { email: 'xiaoli@baam.test', password: 'BaamTest123!', display_name: '新来的小李', username: 'xiaoli', profile_type: 'user', bio: '刚搬到法拉盛的新移民' },
  { email: 'foodie@baam.test', password: 'BaamTest123!', display_name: '美食猎人小王', username: 'foodie_wang', profile_type: 'creator', bio: '法拉盛美食地图每周更新！', headline: '美食达人 · 法拉盛 · 探店', bio_zh: '法拉盛美食地图每周更新！从街头小吃到隐藏神店。', follower_count: 1200, post_count: 89, is_featured: true },
  { email: 'drli@baam.test', password: 'BaamTest123!', display_name: 'Dr. 李文华', username: 'dr_li', profile_type: 'expert', bio: '法拉盛执业内科医生', headline: '内科专家 · 家庭医疗 · 双语达人', bio_zh: '法拉盛执业内科医生，15年临床经验。', follower_count: 328, post_count: 42, blog_count: 8, is_verified: true, is_featured: true },
  { email: 'kevin@baam.test', password: 'BaamTest123!', display_name: 'Kevin 陈地产', username: 'kevin_chen', profile_type: 'professional', bio: '10年纽约地产经验', headline: '地产专家 · 法拉盛 · 10年经验', bio_zh: '10年纽约地产经验，专注法拉盛及周边区域。', follower_count: 562, post_count: 35, is_verified: true, is_featured: true },
  { email: 'jessica@baam.test', password: 'BaamTest123!', display_name: '纽约妈妈Jessica', username: 'jessica_mom', profile_type: 'creator', bio: '两个孩子的妈妈', headline: '家庭博主 · 亲子活动 · 学区攻略', bio_zh: '两个孩子的妈妈，分享学区选择和育儿经验。', follower_count: 876, post_count: 58, is_featured: true },
];

async function seed() {
  console.log('🌱 Seeding users, profiles, threads, voice posts...\n');

  const { data: regions } = await supabase.from('regions').select('id, slug');
  const regionMap = {};
  (regions || []).forEach(r => regionMap[r.slug] = r.id);

  const { data: categories } = await supabase.from('categories').select('id, slug');
  const catMap = {};
  (categories || []).forEach(c => catMap[c.slug] = c.id);

  const userIdMap = {};

  // Create auth users and update profiles
  console.log('👥 Creating auth users + updating profiles...');
  for (const u of seedUsers) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.display_name },
    });

    if (authError) {
      // User might already exist, try to get them
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(eu => eu.email === u.email);
      if (existing) {
        userIdMap[u.username] = existing.id;
        console.log(`  ℹ ${u.display_name} already exists (${existing.id})`);
      } else {
        console.log(`  ⚠ ${u.display_name}: ${authError.message}`);
        continue;
      }
    } else {
      userIdMap[u.username] = authData.user.id;
      console.log(`  ✓ Created ${u.display_name} (${authData.user.id})`);
    }

    // Update profile with extra fields
    const profileUpdate = {
      username: u.username,
      display_name: u.display_name,
      bio: u.bio,
      profile_type: u.profile_type,
      primary_language: 'zh',
      region_id: regionMap['flushing-ny'],
    };
    if (u.headline) profileUpdate.headline = u.headline;
    if (u.bio_zh) profileUpdate.bio_zh = u.bio_zh;
    if (u.follower_count) profileUpdate.follower_count = u.follower_count;
    if (u.post_count) profileUpdate.post_count = u.post_count;
    if (u.blog_count) profileUpdate.blog_count = u.blog_count;
    if (u.is_verified) profileUpdate.is_verified = u.is_verified;
    if (u.is_featured) profileUpdate.is_featured = u.is_featured;

    const { error: profileErr } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userIdMap[u.username]);

    if (profileErr) console.log(`    ⚠ Profile update: ${profileErr.message}`);
  }

  // Seed forum threads
  console.log('\n💬 Seeding forum threads...');
  const threads = [
    { slug: 'flushing-sichuan-recommend', title: '法拉盛有没有推荐的川菜馆？', body: '最近想吃川菜，有推荐吗？', board_id: catMap['forum-food'], author_id: userIdMap['xiaoli'], region_id: regionMap['flushing-ny'], language: 'zh', status: 'published', reply_count: 68, view_count: 1234, vote_count: 45, ai_summary_zh: '多位用户推荐川味坊，性价比高。', ai_tags: ['川菜', '法拉盛'], ai_intent: 'recommendation_request' },
    { slug: 'flushing-rent-2025', title: '2025年法拉盛租房行情怎么样？', body: '一室一厅大概多少钱？', board_id: catMap['forum-housing'], author_id: userIdMap['xiaoli'], region_id: regionMap['flushing-ny'], language: 'zh', status: 'published', reply_count: 45, view_count: 892, vote_count: 32, ai_summary_zh: '一室一厅月租$1800-2200。', ai_tags: ['租房', '法拉盛'], ai_intent: 'question' },
    { slug: 'flushing-tcm-clinic', title: '法拉盛有没有推荐的中医诊所？', body: '想找靠谱的中医做针灸。', board_id: catMap['forum-medical'], author_id: userIdMap['xiaoli'], region_id: regionMap['flushing-ny'], language: 'zh', status: 'published', reply_count: 23, view_count: 456, vote_count: 15, ai_summary_zh: '推荐仁和堂和济世堂。', ai_tags: ['中医', '针灸'], ai_intent: 'recommendation_request' },
    { slug: 'queens-school-ranking', title: '皇后区学区排名，哪些适合华人家庭？', body: '孩子明年上小学。', board_id: catMap['forum-education'], author_id: userIdMap['jessica_mom'], region_id: regionMap['queens-ny'], language: 'zh', status: 'published', reply_count: 28, view_count: 567, vote_count: 20, ai_summary_zh: '26学区和25学区推荐。', ai_tags: ['学区', '教育'], ai_intent: 'question' },
    { slug: 'h1b-lottery-2025', title: 'H1B抽签结果出来了吗？', body: '有中签的分享经验吗？', board_id: catMap['forum-legal'], author_id: userIdMap['xiaoli'], region_id: regionMap['new-york-city'], language: 'zh', status: 'published', reply_count: 56, view_count: 1890, vote_count: 38, ai_summary_zh: '部分用户已收到通知。', ai_tags: ['H1B', '移民'], ai_intent: 'discussion' },
  ];

  for (const t of threads) {
    if (!t.author_id) { console.log(`  ⚠ Skipping ${t.slug} (no author)`); continue; }
    const { error } = await supabase.from('forum_threads').upsert(t, { onConflict: 'slug' });
    if (error) console.log(`  ⚠ ${t.slug}: ${error.message}`);
    else console.log(`  ✓ ${t.title.slice(0, 25)}...`);
  }

  // Seed voice posts
  console.log('\n🎙️ Seeding voice posts...');
  const voicePosts = [
    { author_id: userIdMap['dr_li'], post_type: 'blog', title: '在美国看急诊你需要知道的5件事', slug: 'er-visit-5-things', content: '## 急诊 vs Urgent Care\n\n1. 去急诊：胸痛、严重出血\n2. 去Urgent Care：发烧、轻伤\n3. 急诊贵：copay $150-500\n4. UC便宜：copay $25-75\n5. 不确定打911', status: 'published', region_id: regionMap['flushing-ny'], language: 'zh', topic_tags: ['健康', '急诊'], like_count: 89, comment_count: 23, view_count: 567 },
    { author_id: userIdMap['foodie_wang'], post_type: 'short_post', slug: 'foodie-malatang', content: '法拉盛新开麻辣烫🌶️ 味道超正宗！推荐鸳鸯锅底。#法拉盛美食', status: 'published', region_id: regionMap['flushing-ny'], language: 'zh', topic_tags: ['美食', '法拉盛'], like_count: 156, comment_count: 34, view_count: 890 },
    { author_id: userIdMap['jessica_mom'], post_type: 'blog', title: '法拉盛最好的3个儿童课外活动', slug: 'flushing-kids-activities', content: '## 1. 小天才教育中心\n## 2. 法拉盛YMCA游泳\n## 3. 皇后区植物园', status: 'published', region_id: regionMap['flushing-ny'], language: 'zh', topic_tags: ['亲子', '教育'], like_count: 234, comment_count: 45, view_count: 1234 },
    { author_id: userIdMap['kevin_chen'], post_type: 'blog', title: '2025年法拉盛房价趋势', slug: 'flushing-housing-trend', content: '一室$350K-450K，两室$500K-700K。需求强劲，华人购房者占60%。', status: 'published', region_id: regionMap['flushing-ny'], language: 'zh', topic_tags: ['地产', '房价'], like_count: 178, comment_count: 56, view_count: 2345 },
  ];

  for (const vp of voicePosts) {
    if (!vp.author_id) { console.log(`  ⚠ Skipping ${vp.slug} (no author)`); continue; }
    const { error } = await supabase.from('voice_posts').upsert(vp, { onConflict: 'slug' });
    if (error) console.log(`  ⚠ ${vp.slug}: ${error.message}`);
    else console.log(`  ✓ ${(vp.title || vp.content).slice(0, 25)}...`);
  }

  console.log('\n✅ User seeding complete!');
}

seed().catch(console.error);
