/**
 * Seed script — run with: node scripts/seed.mjs
 * Reads .env.local from apps/web/ for Supabase credentials
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read env
const envPath = resolve('apps/web/.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('🌱 Seeding Baam database...\n');

  // Get region IDs
  const { data: regions } = await supabase.from('regions').select('id, slug');
  const regionMap = {};
  (regions || []).forEach(r => regionMap[r.slug] = r.id);
  console.log(`Found ${regions?.length || 0} regions`);

  // Get category IDs
  const { data: categories } = await supabase.from('categories').select('id, slug, type');
  const catMap = {};
  (categories || []).forEach(c => catMap[c.slug] = c.id);
  console.log(`Found ${categories?.length || 0} categories`);

  const flushingId = regionMap['flushing-ny'];
  const queensId = regionMap['queens-ny'];
  const nycId = regionMap['new-york-city'];

  // ============================================================
  // SEED PROFILES (for forum authors and voices)
  // ============================================================
  console.log('\n👥 Seeding profiles...');

  const profiles = [
    { id: '00000000-0000-0000-0000-000000000001', username: 'xiaoli', display_name: '新来的小李', bio: '刚搬到法拉盛的新移民', profile_type: 'user', primary_language: 'zh', region_id: flushingId },
    { id: '00000000-0000-0000-0000-000000000002', username: 'foodie_wang', display_name: '美食猎人小王', bio: '法拉盛美食地图每周更新！', profile_type: 'creator', primary_language: 'zh', region_id: flushingId, headline: '美食达人 · 法拉盛 · 探店', bio_zh: '法拉盛美食地图每周更新！从街头小吃到隐藏神店，带你吃遍皇后区。', follower_count: 1200, post_count: 89, is_featured: true },
    { id: '00000000-0000-0000-0000-000000000003', username: 'dr_li', display_name: 'Dr. 李文华', bio: '法拉盛执业内科医生', profile_type: 'expert', primary_language: 'zh', region_id: flushingId, headline: '内科专家 · 家庭医疗 · 双语达人', bio_zh: '法拉盛执业内科医生，15年临床经验。在Baam分享健康知识和就医经验。', follower_count: 328, post_count: 42, blog_count: 8, is_verified: true, is_featured: true },
    { id: '00000000-0000-0000-0000-000000000004', username: 'kevin_chen', display_name: 'Kevin 陈地产', bio: '10年纽约地产经验', profile_type: 'professional', primary_language: 'zh', region_id: queensId, headline: '地产专家 · 法拉盛 · 10年经验', bio_zh: '10年纽约地产经验，专注法拉盛及周边区域买卖房和投资。', follower_count: 562, post_count: 35, is_verified: true, is_featured: true },
    { id: '00000000-0000-0000-0000-000000000005', username: 'jessica_mom', display_name: '纽约妈妈Jessica', bio: '两个孩子的妈妈', profile_type: 'creator', primary_language: 'zh', region_id: flushingId, headline: '家庭博主 · 亲子活动 · 学区攻略', bio_zh: '两个孩子的妈妈，分享学区选择、课外活动和育儿经验。', follower_count: 876, post_count: 58, is_featured: true },
  ];

  for (const p of profiles) {
    const { error } = await supabase.from('profiles').upsert(p, { onConflict: 'id' });
    if (error) console.log(`  ⚠ Profile ${p.username}: ${error.message}`);
    else console.log(`  ✓ ${p.display_name}`);
  }

  // ============================================================
  // SEED ARTICLES (News + Guides)
  // ============================================================
  console.log('\n📝 Seeding articles...');

  const articles = [
    {
      slug: 'flushing-main-st-closure-2025',
      content_vertical: 'news_alert',
      title_zh: '法拉盛Main Street本周四起因施工封路，预计持续两周',
      title_en: 'Flushing Main Street Closure Starting Thursday',
      summary_zh: '法拉盛Main Street将从本周四起因道路施工封闭，预计持续两周。',
      ai_summary_zh: '法拉盛Main Street将从3月20日起封路约两周，影响Q13、Q28公交线路。建议使用Union Street绕行，7号线地铁正常运行。',
      body_zh: '## 道路封闭详情\n\n法拉盛Main Street（从Roosevelt Avenue到Northern Boulevard段）将从本周四起因道路施工封闭。\n\n### 影响范围\n- Main Street双向车道全部封闭\n- 公交Q13、Q28线路临时改道\n- 沿街商铺正常营业\n\n### 替代路线\n1. 使用Union Street或Prince Street绕行\n2. 地铁7号线正常运行\n3. 步行和自行车道保持开放',
      source_name: 'NYC DOT', source_type: 'official_gov',
      editorial_status: 'published', published_at: new Date(Date.now() - 2*3600000).toISOString(),
      region_id: flushingId, ai_tags: ['交通', '法拉盛', '施工'], view_count: 456,
    },
    {
      slug: 'nyc-small-business-tax-relief-2025',
      content_vertical: 'news_brief',
      title_zh: '纽约市宣布新的小企业税收减免计划，华人商家可享最高30%优惠',
      title_en: 'NYC Announces New Small Business Tax Relief Plan',
      ai_summary_zh: '纽约市推出小企业税收减免计划，年收入100万以下企业可享最高30%优惠。法拉盛约3,000家华人商家符合条件。',
      body_zh: '## 政策概要\n\n纽约市长办公室今日宣布了一项新的小企业税收减免计划。\n\n### 核心内容\n- **适用对象**：年收入100万美元以下的小企业\n- **减免幅度**：最高可达30%\n- **申请期限**：2025年7月1日至9月30日\n- **预计惠及**：全市超过15,000家小企业',
      source_name: 'NYC.gov', source_type: 'official_gov',
      editorial_status: 'published', published_at: new Date(Date.now() - 5*3600000).toISOString(),
      region_id: nycId, ai_tags: ['税收', '小企业', '优惠'], view_count: 1234,
    },
    {
      slug: 'dmv-license-renewal-online-2025',
      content_vertical: 'news_explainer',
      title_zh: 'DMV新规：4月起驾照更新必须预约，网上预约系统全面开放',
      title_en: 'DMV New Rule: License Renewal Requires Appointment',
      ai_summary_zh: '4月1日起纽约州DMV驾照更新必须网上预约，不再接受walk-in。新系统支持中文界面。',
      body_zh: '## 什么变了\n\n纽约州DMV宣布，从4月1日起所有驾照更新必须网上预约。\n\n## 为什么重要\n- 目前等待时间平均超过2小时\n- 新系统将等待时间缩短至30分钟\n\n## 如何预约\n1. 访问 dmv.ny.gov/appointments\n2. 选择"驾照更新"\n3. 选择办事处和时间',
      source_name: 'DMV.NY.gov', source_type: 'official_gov',
      editorial_status: 'published', published_at: new Date(Date.now() - 24*3600000).toISOString(),
      region_id: nycId, ai_tags: ['DMV', '驾照', '预约'], view_count: 892,
    },
    {
      slug: 'flushing-bakery-opening-2025',
      content_vertical: 'news_community',
      title_zh: '法拉盛新世界商城旁开业新中式面包房，排队超两小时',
      ai_summary_zh: '法拉盛新开"麦香坊"中式面包房，主打台式港式面包，开业期间全场8折。',
      body_zh: '## 新店开业\n\n"麦香坊"今日盛大开业，吸引大批居民排队。\n\n### 特色\n- 主打台式及港式面包\n- 每日现烤招牌菠萝包\n- 提供外卖服务\n\n**地址**：136-20 Main Street, Flushing',
      source_name: 'Baam原创', source_type: 'original',
      editorial_status: 'published', published_at: new Date(Date.now() - 8*3600000).toISOString(),
      region_id: flushingId, ai_tags: ['美食', '法拉盛', '新店'], view_count: 567,
    },
    {
      slug: 'how-to-find-chinese-doctor-nyc',
      content_vertical: 'guide_howto',
      title_zh: '如何在纽约找到靠谱的中文家庭医生',
      title_en: 'How to Find a Chinese-Speaking Family Doctor in NYC',
      ai_summary_zh: '找纽约中文家庭医生分6步：确认保险网络、搜索社区资源、评估资质、预约准备、首诊评估、建立长期关系。',
      body_zh: '## 为什么需要家庭医生\n\n在美国，家庭医生（PCP）是你医疗保健的第一联系人。\n\n## 第一步：确认保险网络\n登录保险公司官网，搜索"Find a Doctor"，筛选语言为Chinese。\n\n## 第二步：利用社区资源\n- Baam商家目录\n- ZocDoc在线预约\n- 社区论坛推荐\n\n## 第三步：评估资质\n- 是否Board Certified\n- 执业许可有效\n- 在线评价\n\n## 第四步：预约准备\n准备保险卡、ID、病史记录\n\n## 第五步：首诊评估\n注意医生是否耐心、解释是否清楚\n\n## 第六步：建立长期关系\n每年至少体检一次',
      editorial_status: 'published', published_at: new Date(Date.now() - 3*24*3600000).toISOString(),
      region_id: flushingId, ai_tags: ['医疗', '家庭医生', '中文服务'],
      ai_faq: [
        { q: '没有保险可以看医生吗？', a: '可以。法拉盛多家社区健康中心提供免费或低价医疗服务。' },
        { q: '家庭医生和专科医生有什么区别？', a: '家庭医生处理常规问题，专科医生处理特定疾病，通常需要PCP转介。' },
        { q: 'Copay一般多少钱？', a: '取决于保险计划，一般PCP的copay在$15-$40。' },
      ],
      view_count: 2345, category_id: catMap['guide-medical'], last_reviewed_at: new Date(Date.now() - 24*3600000).toISOString(),
    },
    {
      slug: 'new-to-nyc-first-month-checklist',
      content_vertical: 'guide_checklist',
      title_zh: '新搬到纽约第一个月要做的12件事',
      title_en: '12 Things to Do in Your First Month in NYC',
      ai_summary_zh: '新搬纽约必做12件事：办手机、开银行、申请SSN、找住房、注册保险、找医生、学交通等。',
      body_zh: '## 新移民安家清单\n\n## ✅ 办理手机号\n推荐T-Mobile或Mint Mobile\n\n## ✅ 开设银行账户\n推荐Chase或Bank of America\n\n## ✅ 申请SSN\n到达后尽快申请\n\n## ✅ 找住房\n租房网站：StreetEasy、Zillow\n\n## ✅ 注册健康保险\nNY State of Health市场申请\n\n## ✅ 找家庭医生\n参考我们的找医生指南',
      editorial_status: 'published', published_at: new Date(Date.now() - 5*24*3600000).toISOString(),
      region_id: nycId, ai_tags: ['新移民', '安家', '清单'],
      view_count: 3567, category_id: catMap['guide-new-immigrant'],
    },
    {
      slug: 'flushing-tax-service-comparison-2025',
      content_vertical: 'guide_comparison',
      title_zh: '2025年报税季：法拉盛中文报税服务怎么选',
      ai_summary_zh: '法拉盛报税服务对比：华信会计$150起综合评分最高，金信$120起最便宜。',
      body_zh: '## 报税季来了\n\n截止日4月15日。\n\n| 项目 | 华信会计 | 金信报税 |\n|------|---------|--------|\n| 个人报税 | $150起 | $120起 |\n| 中文服务 | ✅ | ✅ |\n| 评分 | 4.7 | 4.5 |',
      editorial_status: 'published', published_at: new Date(Date.now() - 7*24*3600000).toISOString(),
      region_id: flushingId, ai_tags: ['报税', '会计', '对比'],
      view_count: 1890, category_id: catMap['guide-tax-business'],
    },
    {
      slug: 'nyc-drivers-license-guide',
      content_vertical: 'guide_howto',
      title_zh: '纽约州驾照路考完全攻略（含中文考场信息）',
      ai_summary_zh: '纽约州驾照攻略：笔试支持中文，通过后参加5小时课程，建议练车10-20小时后预约路考。',
      body_zh: '## 驾照申请流程\n\n### 第一步：笔试\n可选中文考试\n\n### 第二步：5小时课程\n法拉盛多家驾校提供中文课\n\n### 第三步：路考准备\n建议10-20小时练车\n\n### 第四步：路考\n法拉盛附近考场：College Point',
      editorial_status: 'published', published_at: new Date(Date.now() - 10*24*3600000).toISOString(),
      region_id: nycId, ai_tags: ['驾照', '路考', 'DMV'],
      view_count: 4567,
    },
  ];

  for (const a of articles) {
    const { error } = await supabase.from('articles').upsert(a, { onConflict: 'slug' });
    if (error) console.log(`  ⚠ Article ${a.slug}: ${error.message}`);
    else console.log(`  ✓ ${a.title_zh?.slice(0, 30)}...`);
  }

  // ============================================================
  // SEED BUSINESSES
  // ============================================================
  console.log('\n🏪 Seeding businesses...');

  const businesses = [
    { slug: 'wang-family-medical-center', display_name: 'Wang Family Medical Center', display_name_zh: '王氏家庭医疗中心', short_desc_zh: '法拉盛中文家庭医疗诊所', phone: '(718) 555-0123', status: 'active', verification_status: 'verified', current_plan: 'pro', ai_summary_zh: '法拉盛老牌中文家庭诊所，接受Medicaid，周末营业。', ai_tags: ['中文服务', '周末营业', '接受Medicaid'], review_count: 126, avg_rating: 4.8, view_count: 3456, is_featured: true, is_active: true, languages_served: ['zh', 'en'] },
    { slug: 'zhang-law-office', display_name: 'Zhang Law Office', display_name_zh: '张律师事务所', short_desc_zh: '专注移民法和商业法', phone: '(718) 555-0456', status: 'active', verification_status: 'verified', current_plan: 'pro', ai_summary_zh: '法拉盛中文移民律师，首次咨询免费。', ai_tags: ['中文服务', '免费咨询', '移民法'], review_count: 83, avg_rating: 4.5, view_count: 2345, is_featured: true, is_active: true, languages_served: ['zh', 'en'] },
    { slug: 'sichuan-flavor-house', display_name: 'Sichuan Flavor House', display_name_zh: '川味坊麻辣烫', short_desc_zh: '正宗川味麻辣烫', phone: '(718) 555-0789', status: 'active', verification_status: 'unverified', current_plan: 'free', ai_summary_zh: '法拉盛人气川菜馆，口碑极佳。', ai_tags: ['川菜', '麻辣烫', '外卖'], review_count: 256, avg_rating: 4.9, view_count: 5678, is_featured: false, is_active: true, languages_served: ['zh'] },
    { slug: 'huaxin-accounting', display_name: 'Huaxin Accounting', display_name_zh: '华信会计师事务所', short_desc_zh: '中文注册会计师事务所', phone: '(718) 555-0234', status: 'active', verification_status: 'verified', current_plan: 'pro', ai_summary_zh: '法拉盛老牌会计事务所，报税季热门。', ai_tags: ['中文服务', '报税', '免费咨询'], review_count: 94, avg_rating: 4.7, view_count: 1890, is_featured: false, is_active: true, languages_served: ['zh', 'en'] },
    { slug: 'little-genius-education', display_name: 'Little Genius Education', display_name_zh: '小天才教育中心', short_desc_zh: '课后辅导、考试培训', phone: '(718) 555-0567', status: 'active', verification_status: 'unverified', current_plan: 'free', ai_summary_zh: '法拉盛课后辅导中心，SAT培训。', ai_tags: ['教育', '中文教学', '适合儿童'], review_count: 47, avg_rating: 4.6, view_count: 987, is_featured: false, is_active: true, languages_served: ['zh', 'en'] },
    { slug: 'lao-li-renovation', display_name: 'Lao Li Renovation', display_name_zh: '老李装修工程', short_desc_zh: '住宅装修、维修服务', phone: '(718) 555-0890', status: 'active', verification_status: 'unverified', current_plan: 'free', ai_summary_zh: '皇后区中文装修服务，免费估价。', ai_tags: ['中文服务', '装修', '免费估价'], review_count: 38, avg_rating: 4.4, view_count: 654, is_featured: false, is_active: true, languages_served: ['zh'] },
  ];

  for (const b of businesses) {
    const { error } = await supabase.from('businesses').upsert(b, { onConflict: 'slug' });
    if (error) console.log(`  ⚠ Business ${b.slug}: ${error.message}`);
    else console.log(`  ✓ ${b.display_name_zh}`);
  }

  // ============================================================
  // SEED FORUM THREADS
  // ============================================================
  console.log('\n💬 Seeding forum threads...');

  const threads = [
    { slug: 'flushing-sichuan-recommend', title: '法拉盛有没有推荐的川菜馆？最近新开的那几家如何？', body: '最近想吃川菜，有没有去过的朋友推荐一下？', board_id: catMap['forum-food'], author_id: '00000000-0000-0000-0000-000000000001', region_id: flushingId, language: 'zh', status: 'published', reply_count: 68, view_count: 1234, vote_count: 45, ai_summary_zh: '多位用户推荐川味坊和川渝人家，性价比高、味道正宗。', ai_tags: ['川菜', '法拉盛', '推荐'], ai_intent: 'recommendation_request' },
    { slug: 'flushing-rent-2025', title: '2025年法拉盛租房行情怎么样？一室一厅大概多少钱？', body: '刚来纽约准备找房子，想问问行情。', board_id: catMap['forum-housing'], author_id: '00000000-0000-0000-0000-000000000001', region_id: flushingId, language: 'zh', status: 'published', reply_count: 45, view_count: 892, vote_count: 32, ai_summary_zh: '法拉盛一室一厅月租约$1800-2200，比去年上涨约10%。', ai_tags: ['租房', '法拉盛', '价格'], ai_intent: 'question' },
    { slug: 'flushing-tcm-clinic', title: '法拉盛有没有推荐的中医诊所？最近肩颈不太舒服', body: '想找靠谱的中医做针灸，保险是Oscar Health。', board_id: catMap['forum-medical'], author_id: '00000000-0000-0000-0000-000000000001', region_id: flushingId, language: 'zh', status: 'published', reply_count: 23, view_count: 456, vote_count: 15, ai_summary_zh: '推荐仁和堂和济世堂，针灸每次$80-120。', ai_tags: ['中医', '针灸', '法拉盛'], ai_intent: 'recommendation_request' },
    { slug: 'queens-school-ranking', title: '皇后区学区排名分享，哪些学校适合华人家庭？', body: '孩子明年上小学，想了解学区情况。', board_id: catMap['forum-education'], author_id: '00000000-0000-0000-0000-000000000005', region_id: queensId, language: 'zh', status: 'published', reply_count: 28, view_count: 567, vote_count: 20, ai_summary_zh: '26学区和25学区最受推荐。', ai_tags: ['学区', '教育', '皇后区'], ai_intent: 'question' },
    { slug: 'h1b-lottery-2025', title: 'H1B抽签结果出来了吗？有没有今年中签的？', body: '听说结果开始通知了，分享一下经验？', board_id: catMap['forum-legal'], author_id: '00000000-0000-0000-0000-000000000001', region_id: nycId, language: 'zh', status: 'published', reply_count: 56, view_count: 1890, vote_count: 38, ai_summary_zh: '部分用户已收到通知，讨论了后续流程。', ai_tags: ['H1B', '签证', '移民'], ai_intent: 'discussion' },
  ];

  for (const t of threads) {
    const { error } = await supabase.from('forum_threads').upsert(t, { onConflict: 'slug' });
    if (error) console.log(`  ⚠ Thread ${t.slug}: ${error.message}`);
    else console.log(`  ✓ ${t.title.slice(0, 30)}...`);
  }

  // ============================================================
  // SEED EVENTS
  // ============================================================
  console.log('\n📅 Seeding events...');

  const events = [
    { slug: 'flushing-spring-fest-2025', title_zh: '法拉盛春季文化节暨美食嘉年华', summary_zh: '年度春季文化活动', description_zh: '包含美食、表演、手工体验，免费入场。', region_id: flushingId, venue_name: '法拉盛市政厅广场', address: '135-35 Northern Blvd, Flushing', start_at: '2025-03-22T10:00:00-04:00', end_at: '2025-03-22T17:00:00-04:00', is_free: true, organizer_name: '法拉盛BID', status: 'published', is_featured: true, language: 'zh', ai_tags: ['文化节', '美食', '免费'], view_count: 234 },
    { slug: 'flushing-tax-seminar-2025', title_zh: '免费报税讲座：2025年新政策解读（中文）', summary_zh: '法拉盛图书馆免费报税讲座', region_id: flushingId, venue_name: '法拉盛图书馆', address: '41-17 Main Street, Flushing', start_at: '2025-03-23T14:00:00-04:00', end_at: '2025-03-23T16:00:00-04:00', is_free: true, organizer_name: '华信会计', status: 'published', language: 'zh', ai_tags: ['报税', '讲座', '免费'], view_count: 156 },
    { slug: 'queens-kids-craft-spring', title_zh: '亲子手工活动：春天的花园', summary_zh: '皇后区植物园亲子手工', region_id: queensId, venue_name: '皇后区植物园', start_at: '2025-03-22T13:00:00-04:00', is_free: false, ticket_price: '$15/家庭', organizer_name: '皇后区植物园', status: 'published', language: 'zh', ai_tags: ['亲子', '手工'], view_count: 89 },
    { slug: 'flushing-5k-walk-spring', title_zh: '法拉盛公园春季5K健走活动', summary_zh: '免费5K健走', region_id: flushingId, venue_name: '法拉盛草地公园', start_at: '2025-03-23T08:00:00-04:00', is_free: true, organizer_name: '社区志愿者协会', status: 'published', language: 'zh', ai_tags: ['健走', '运动', '免费'], view_count: 67 },
  ];

  for (const e of events) {
    const { error } = await supabase.from('events').upsert(e, { onConflict: 'slug' });
    if (error) console.log(`  ⚠ Event ${e.slug}: ${error.message}`);
    else console.log(`  ✓ ${e.title_zh?.slice(0, 25)}...`);
  }

  // ============================================================
  // SEED VOICE POSTS
  // ============================================================
  console.log('\n🎙️ Seeding voice posts...');

  const voicePosts = [
    { author_id: '00000000-0000-0000-0000-000000000003', post_type: 'blog', title: '在美国看急诊你需要知道的5件事', slug: 'er-visit-5-things', content: '## 急诊 vs Urgent Care\n\n1. **什么情况去急诊**：胸痛、严重出血\n2. **什么情况去Urgent Care**：发烧、轻伤\n3. **急诊费用贵**：copay $150-500\n4. **Urgent Care便宜**：copay $25-75\n5. **不确定时打911**', status: 'published', region_id: flushingId, language: 'zh', topic_tags: ['健康', '急诊'], like_count: 89, comment_count: 23, view_count: 567 },
    { author_id: '00000000-0000-0000-0000-000000000002', post_type: 'short_post', slug: 'foodie-malatang-discovery', content: '今天发现法拉盛Main Street新开了一家麻辣烫🌶️ 味道超正宗！推荐招牌鸳鸯锅底。#法拉盛美食 #麻辣烫', status: 'published', region_id: flushingId, language: 'zh', topic_tags: ['美食', '法拉盛'], like_count: 156, comment_count: 34, view_count: 890 },
    { author_id: '00000000-0000-0000-0000-000000000005', post_type: 'blog', title: '法拉盛最好的3个儿童课外活动推荐', slug: 'flushing-kids-activities-top3', content: '## 1. 小天才教育中心\n数学和阅读辅导\n\n## 2. 法拉盛YMCA\n游泳课性价比高\n\n## 3. 皇后区植物园\n户外探索活动', status: 'published', region_id: flushingId, language: 'zh', topic_tags: ['亲子', '教育'], like_count: 234, comment_count: 45, view_count: 1234 },
    { author_id: '00000000-0000-0000-0000-000000000004', post_type: 'blog', title: '2025年法拉盛房价趋势分析', slug: 'flushing-housing-2025', content: '## 当前行情\n- 一室公寓：$350K-450K\n- 两室：$500K-700K\n\n## 趋势\n需求强劲，华人购房者占60%。', status: 'published', region_id: flushingId, language: 'zh', topic_tags: ['地产', '房价'], like_count: 178, comment_count: 56, view_count: 2345 },
  ];

  for (const vp of voicePosts) {
    const { error } = await supabase.from('voice_posts').upsert(vp, { onConflict: 'slug' });
    if (error) console.log(`  ⚠ Voice post ${vp.slug}: ${error.message}`);
    else console.log(`  ✓ ${(vp.title || vp.content).slice(0, 30)}...`);
  }

  console.log('\n✅ Seeding complete!');
}

seed().catch(console.error);
