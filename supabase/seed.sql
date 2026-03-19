-- ============================================================
-- BAAM LOCAL PORTAL — SEED DATA
-- Realistic Chinese content for NYC Flushing community
-- Run after initial_schema.sql
-- ============================================================

-- ============================================================
-- ARTICLES: News + Guides (using existing regions/categories from schema)
-- ============================================================

-- Get region IDs for reference
-- flushing-ny, queens-ny, new-york-city are already seeded

-- NEWS ARTICLES
INSERT INTO articles (slug, content_vertical, title_zh, title_en, summary_zh, body_zh, ai_summary_zh, source_name, source_type, source_url, editorial_status, published_at, region_id, ai_tags, view_count) VALUES

-- Alert
('flushing-main-st-closure-2025', 'news_alert',
'法拉盛Main Street本周四起因施工封路，预计持续两周',
'Flushing Main Street Closure Starting Thursday',
'法拉盛Main Street将从本周四起因道路施工封闭，预计持续两周。',
'## 道路封闭详情

法拉盛Main Street（从Roosevelt Avenue到Northern Boulevard段）将从本周四（3月20日）起因道路施工封闭，预计持续至4月3日。

### 影响范围
- Main Street双向车道全部封闭
- 公交Q13、Q28线路临时改道
- 沿街商铺正常营业，但车辆无法停靠

### 替代路线
建议驾车居民：
1. 使用Union Street或Prince Street绕行
2. 地铁7号线正常运行
3. 步行和自行车道保持开放

### 商家影响
沿街约50家商铺虽然照常营业，但预计客流量将受到影响。市交通局已在施工区域设置临时指示牌。

如有疑问，请致电311或访问NYC.gov/DOT查询最新信息。',
'法拉盛Main Street将从3月20日起封路约两周，影响Q13、Q28公交线路。建议使用Union Street绕行，7号线地铁正常运行。沿街商铺照常营业。',
'NYC DOT', 'official_gov', 'https://www.nyc.gov/dot', 'published', NOW() - INTERVAL '2 hours',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
ARRAY['交通', '法拉盛', '施工', '封路'], 456),

-- Brief
('nyc-small-business-tax-relief-2025', 'news_brief',
'纽约市宣布新的小企业税收减免计划，华人商家可享最高30%优惠',
'NYC Announces New Small Business Tax Relief Plan',
'纽约市推出针对年收入100万以下小企业的税收减免方案。',
'## 政策概要

纽约市长办公室今日宣布了一项新的小企业税收减免计划，旨在帮助受疫情影响的小型企业恢复发展。

### 核心内容
- **适用对象**：年收入100万美元以下的小企业
- **减免幅度**：最高可达30%的商业税减免
- **申请期限**：2025年7月1日至9月30日
- **预计惠及**：全市超过15,000家小企业

### 华人商家特别说明
法拉盛商业改善区（BID）主任表示，法拉盛地区约有3,000家符合条件的华人商家。市政府将在法拉盛图书馆举办中文说明会。

### 如何申请
1. 准备最近一年的税务文件
2. 访问NYC.gov/SmallBusiness填写申请
3. 或致电311获取中文服务

更多详情请关注Baam后续报道。',
'纽约市推出小企业税收减免计划，年收入100万以下企业可享最高30%优惠。法拉盛约3,000家华人商家符合条件，申请期限为7月至9月。',
'NYC.gov', 'official_gov', 'https://www.nyc.gov', 'published', NOW() - INTERVAL '5 hours',
(SELECT id FROM regions WHERE slug = 'new-york-city'),
ARRAY['税收', '小企业', '优惠政策', '华人商家'], 1234),

-- Explainer
('dmv-license-renewal-online-2025', 'news_explainer',
'DMV新规：4月起驾照更新必须预约，网上预约系统全面开放',
'DMV New Rule: License Renewal Requires Online Appointment Starting April',
'纽约州DMV宣布自4月1日起所有驾照更新必须提前在线预约。',
'## 什么变了

纽约州车辆管理局（DMV）宣布，从2025年4月1日起，所有驾照更新业务必须通过网上预约系统提前预约。不再接受walk-in（直接到场办理）。

## 为什么重要

- 目前DMV办事处等待时间平均超过2小时
- 新系统预计将等待时间缩短至30分钟以内
- 中文界面已上线，方便华人居民使用

## 影响谁

- 所有需要更新驾照的纽约州居民
- 需要办理Real ID的居民
- 新移民首次申请驾照的申请人

## 如何预约

1. 访问 dmv.ny.gov/appointments
2. 选择"驾照更新"服务类型
3. 选择最近的办事处（法拉盛办事处地址：30-56 Whitestone Expy）
4. 选择日期和时间
5. 系统支持中文界面

**提示**：建议提前2-3周预约，热门时段容易满。',
'4月1日起纽约州DMV驾照更新必须网上预约，不再接受walk-in。新系统支持中文界面，建议提前2-3周预约。法拉盛办事处地址：30-56 Whitestone Expy。',
'DMV.NY.gov', 'official_gov', 'https://dmv.ny.gov', 'published', NOW() - INTERVAL '1 day',
(SELECT id FROM regions WHERE slug = 'new-york-city'),
ARRAY['DMV', '驾照', '预约', '新规'], 892),

-- Community News
('flushing-bakery-opening-2025', 'news_community',
'法拉盛新世界商城旁开业新中式面包房，当地居民排队超两小时',
'New Chinese Bakery Opens Near Flushing New World Mall',
'位于Main Street的新中式面包房"麦香坊"今日开业。',
'## 新店开业

位于法拉盛Main Street的新中式面包房"麦香坊"今日盛大开业，吸引大批华人居民排队品尝。据悉，开业当天排队时间一度超过两小时。

### 店铺特色
- 主打台式及港式面包
- 法拉盛首家专营中式面包的烘焙店
- 每日现烤，下午2点出炉招牌菠萝包
- 提供外卖服务

### 地址与营业时间
- 地址：136-20 Main Street, Flushing
- 营业时间：7:00 AM - 9:00 PM
- 电话：(718) 555-0188

开业期间全场8折优惠，活动持续至本月底。',
'法拉盛新开"麦香坊"中式面包房，主打台式港式面包，开业当天排队超两小时。地址Main Street，开业期间全场8折。',
'Baam原创', 'original', NULL, 'published', NOW() - INTERVAL '8 hours',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
ARRAY['美食', '法拉盛', '新店开业', '面包'], 567),

-- Roundup
('flushing-weekly-roundup-w12', 'news_roundup',
'本周法拉盛生活提醒：报税截止日临近、新店开业、社区活动汇总',
'Flushing Weekly Roundup: Tax Deadline, New Openings, Community Events',
'本周法拉盛重要事项汇总。',
'## 本周要点

### 📋 报税提醒
- 2024年度报税截止日为4月15日，还有不到一个月
- 法拉盛多家会计事务所提供中文报税服务
- 免费报税讲座本周日在法拉盛图书馆举办

### 🏪 新店开业
- "麦香坊"中式面包房在Main Street开业
- Tangram大楼新增一家奶茶店

### 🎪 社区活动
- 3月22日：法拉盛春季文化节（市政厅广场）
- 3月23日：免费报税讲座（法拉盛图书馆）
- 3月29日：社区清洁日志愿活动

### 🚗 交通提醒
- Main Street本周四起施工封路
- Q13、Q28公交临时改道',
'本周法拉盛重点：报税截止日临近（4月15日），Main Street施工封路，春季文化节本周六举办。新中式面包房"麦香坊"在Main Street开业。',
'Baam原创', 'original', NULL, 'published', NOW() - INTERVAL '12 hours',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
ARRAY['周报', '法拉盛', '活动', '报税'], 345);

-- GUIDE ARTICLES
INSERT INTO articles (slug, content_vertical, title_zh, title_en, summary_zh, body_zh, ai_summary_zh, editorial_status, published_at, region_id, ai_tags, ai_faq, view_count, category_id, last_reviewed_at) VALUES

('how-to-find-chinese-doctor-nyc', 'guide_howto',
'如何在纽约找到靠谱的中文家庭医生',
'How to Find a Reliable Chinese-Speaking Family Doctor in NYC',
'从选择保险网络内医生到第一次预约，6步找到满意的中文家庭医生。',
'## 为什么需要家庭医生

在美国，家庭医生（Primary Care Physician, PCP）是你医疗保健的第一联系人。无论是常规体检、疫苗接种还是慢性病管理，PCP都是你的首选。

## 第一步：确认你的保险网络

在找医生之前，你需要知道自己的保险网络（Network）：
- 登录保险公司官网，搜索"Find a Doctor"
- 选择"Internal Medicine"或"Family Medicine"
- 筛选语言为"Chinese"或"Mandarin"

## 第二步：利用社区资源搜索

- **Baam商家目录**：搜索法拉盛地区中文医生
- **ZocDoc**：在线预约平台，支持按语言筛选
- **社区论坛**：查看其他用户的真实推荐

## 第三步：评估医生资质

- 查看是否Board Certified（认证医生）
- 确认执业许可证有效
- 查看在线评价（Google、Yelp、Baam）

## 第四步：预约并准备

- 提前准备保险卡、ID、病史记录
- 如需翻译，提前告知诊所
- 首诊建议预留1小时

## 第五步：首诊评估

首次就诊时注意评估：
- 医生是否耐心倾听
- 解释是否清楚易懂
- 候诊时间是否合理
- 是否方便后续预约

## 第六步：建立长期关系

找到满意的PCP后，建议：
- 每年至少做一次体检
- 有任何健康问题先联系PCP
- 保持病史记录的连续性',
'找纽约中文家庭医生分6步：确认保险网络、搜索社区资源、评估资质、预约准备、首诊评估、建立长期关系。法拉盛地区有多家提供中文服务的诊所可选。',
'published', NOW() - INTERVAL '3 days',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
ARRAY['医疗', '家庭医生', '中文服务', '新移民'],
'[{"q":"没有保险可以看医生吗？","a":"可以。法拉盛多家社区健康中心提供免费或低价医疗服务，如Charles B. Wang社区健康中心。"},{"q":"家庭医生和专科医生有什么区别？","a":"家庭医生（PCP）处理常规健康问题和体检，专科医生处理特定领域疾病。通常需要PCP转介才能看专科。"},{"q":"看病需要提前预约吗？","a":"强烈建议提前预约。大多数诊所可以网上或电话预约，walk-in等待时间较长。"},{"q":"Copay一般多少钱？","a":"取决于你的保险计划，一般PCP的copay在$15-$40之间。"},{"q":"法拉盛哪些诊所接受Medicaid？","a":"王氏家庭医疗中心、仁和家庭诊所等多家诊所接受Medicaid，具体请查看Baam商家目录。"}]',
2345,
(SELECT id FROM categories WHERE slug = 'guide-medical'),
NOW() - INTERVAL '1 day'),

('new-to-nyc-first-month-checklist', 'guide_checklist',
'新搬到纽约第一个月要做的12件事',
'12 Things to Do in Your First Month in New York City',
'新移民安家清单，覆盖住房、证件、银行、医疗等必办事项。',
'## 新移民安家清单

搬到纽约是一个全新的开始。以下12件事帮你在第一个月内安顿下来。

## ✅ 第1件：办理手机号
- 推荐T-Mobile或Mint Mobile（性价比高）
- 在法拉盛可以找到中文服务的手机店

## ✅ 第2件：开设银行账户
- 推荐Chase或Bank of America（网点多）
- 准备护照和地址证明
- 法拉盛Chase分行有中文服务

## ✅ 第3件：申请社会安全号（SSN）
- 到达美国后尽快申请
- 最近的SSA办事处在法拉盛

## ✅ 第4件：找住房
- 租房网站：StreetEasy、Zillow
- 法拉盛华人论坛也有房源信息
- 租房时注意查看合同条款

## ✅ 第5件：注册健康保险
- NY State of Health市场可申请
- 收入较低可申请Medicaid
- 开放注册期外有特殊注册期

## ✅ 第6件：找家庭医生
- 参考我们的《如何找中文家庭医生》指南
- 建议尽早建立医疗记录

## ✅ 第7件：了解公共交通
- 购买MetroCard或使用OMNY
- 下载Citymapper或Google Maps
- 了解你附近的地铁和公交线路

## ✅ 第8件：申请驾照（如需要）
- 参考我们的驾照攻略
- 笔试有中文版本

## ✅ 第9件：了解学区（有孩子的家庭）
- 纽约市免费公立学校系统
- 查看所在地区学区评级

## ✅ 第10件：注册社区资源
- 法拉盛图书馆（免费WiFi和中文书）
- 社区中心（ESL课程、活动）

## ✅ 第11件：探索周边
- 了解附近的超市、药房、餐厅
- 记录紧急联系方式

## ✅ 第12件：加入社区
- 加入Baam社区论坛
- 关注本地达人获取生活信息
- 参加社区活动认识新朋友',
'新搬纽约第一个月必做12件事：办手机、开银行、申请SSN、找住房、注册保险、找医生、学交通、办驾照、了解学区、注册社区资源、探索周边、加入社区。',
'published', NOW() - INTERVAL '5 days',
(SELECT id FROM regions WHERE slug = 'new-york-city'),
ARRAY['新移民', '安家', '清单', '纽约'],
'[{"q":"没有SSN可以开银行账户吗？","a":"可以。Chase和BoA等银行接受ITIN或护照开户。"},{"q":"MetroCard在哪里买？","a":"地铁站内的自动售票机，或使用OMNY刷手机/信用卡直接乘车。"},{"q":"法拉盛哪里可以买中国食材？","a":"新世界商城、金城发超市、香港超市等都有丰富的中国食材。"}]',
3567,
(SELECT id FROM categories WHERE slug = 'guide-new-immigrant'),
NOW() - INTERVAL '2 days'),

('flushing-tax-service-comparison-2025', 'guide_comparison',
'2025年报税季：法拉盛中文报税服务怎么选',
'2025 Tax Season: Comparing Chinese Tax Services in Flushing',
'对比法拉盛主要中文报税服务的价格、服务范围和用户评价。',
'## 报税季来了

2024年度报税截止日为4月15日。如果你需要中文报税服务，法拉盛有多家可靠的会计事务所。

## 比较维度

| 项目 | 华信会计 | 金信报税 | 永利财税 |
|------|---------|---------|---------|
| 个人报税 | $150起 | $120起 | $180起 |
| 小企业报税 | $500起 | $450起 | $600起 |
| 中文服务 | ✅ | ✅ | ✅ |
| 周末营业 | ✅ | ❌ | ✅ |
| 免费咨询 | ✅ | ✅ | ❌ |
| 用户评分 | 4.7 | 4.5 | 4.3 |

## 如何选择

- **预算有限**：金信报税价格最低
- **需要周末服务**：华信或永利
- **小企业主**：华信经验最丰富
- **首次报税**：建议选择提供免费咨询的事务所

## 报税需要准备什么

1. W-2表格（工资收入）
2. 1099表格（自雇或投资收入）
3. 社会安全号或ITIN
4. 去年的报税文件（如有）
5. 银行账户信息（直接存款用）',
'法拉盛中文报税服务对比：华信会计个人$150起综合评分最高，金信报税$120起价格最低，永利财税$180起。建议根据预算和服务需求选择。',
'published', NOW() - INTERVAL '7 days',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
ARRAY['报税', '会计', '法拉盛', '对比'],
'[{"q":"报税截止日是什么时候？","a":"2024年度报税截止日为2025年4月15日。如需延期，可申请延至10月15日。"},{"q":"首次报税需要注意什么？","a":"确保有SSN或ITIN，收集所有收入证明文件，建议找专业会计帮助。"},{"q":"没有SSN可以报税吗？","a":"可以，使用ITIN（个人纳税识别号）即可报税。"}]',
1890,
(SELECT id FROM categories WHERE slug = 'guide-tax-business'),
NOW() - INTERVAL '3 days'),

('nyc-drivers-license-guide', 'guide_howto',
'纽约州驾照路考完全攻略（含中文考场信息）',
'Complete Guide to Getting a Driver''s License in New York State',
'从笔试到路考，一步步教你拿到纽约州驾照。',
'## 纽约州驾照申请流程

### 第一步：笔试（Written Test）
- 可以选择中文考试
- 在线练习：dmv.ny.gov/practice-test
- 通过后获得Learner Permit

### 第二步：5小时课程
- 必修的Pre-Licensing Course
- 法拉盛多家驾校提供中文5小时课

### 第三步：路考准备
- 建议参加至少10-20小时练车
- 法拉盛驾校推荐看Baam商家目录

### 第四步：路考（Road Test）
- 在线预约路考时间
- 法拉盛附近考场：College Point
- 考试内容：平行停车、三点掉头、路口转弯等

### 常见扣分项
- 没有看后视镜
- 转弯时没有打信号灯
- 速度过快或过慢
- 停车时离路缘太远',
'纽约州驾照攻略：笔试支持中文，通过后参加5小时课程，建议练车10-20小时后预约路考。法拉盛附近路考点在College Point。',
'published', NOW() - INTERVAL '10 days',
(SELECT id FROM regions WHERE slug = 'new-york-city'),
ARRAY['驾照', '路考', '笔试', 'DMV'],
'[{"q":"笔试可以用中文吗？","a":"可以。纽约州DMV笔试支持中文（普通话）版本。"},{"q":"路考容易过吗？","a":"首次通过率约50%。充分练习和熟悉考场路线很重要。"}]',
4567, NULL, NULL);


-- ============================================================
-- BUSINESSES
-- ============================================================

INSERT INTO businesses (slug, display_name, display_name_zh, short_desc_en, short_desc_zh, full_desc_zh, phone, email, website_url, wechat_id, status, verification_status, current_plan, ai_summary_zh, ai_tags, review_count, avg_rating, view_count, lead_count, is_featured, is_active, languages_served) VALUES

('wang-family-medical-center', 'Wang Family Medical Center', '王氏家庭医疗中心',
'Chinese-speaking family medicine practice in Flushing',
'法拉盛中文家庭医疗诊所，提供内科、儿科、体检等服务',
'王氏家庭医疗中心位于法拉盛核心区域，由王文华医生创办于2010年。诊所提供全面的家庭医疗服务，包括内科、儿科、年度体检、疫苗接种和慢性病管理。所有医护人员均能流利使用普通话和粤语沟通。诊所接受大部分保险计划，包括Medicaid和Medicare。',
'(718) 555-0123', 'info@wangmedical.com', 'https://wangmedical.com', 'WangMedicalNY',
'active', 'verified', 'pro',
'法拉盛老牌中文家庭诊所，15年服务社区，接受Medicaid，周末营业，评价出色。',
ARRAY['中文服务', '周末营业', '接受Medicaid', '内科', '儿科', '体检'],
126, 4.8, 3456, 45, true, true, ARRAY['zh', 'en', 'yue']),

('zhang-law-office', 'Zhang Law Office', '张律师事务所',
'Immigration and business law firm with Chinese services',
'专注移民法和商业法的中文律师事务所',
'张律师事务所由张明律师于2015年创立，专注于移民法、商业法和房地产法。张律师拥有纽约州执业资格，团队提供普通话、粤语和英语服务。首次咨询免费。',
'(718) 555-0456', 'info@zhanglaw.com', 'https://zhanglaw.com', 'ZhangLawNY',
'active', 'verified', 'pro',
'法拉盛中文移民律师事务所，首次咨询免费，专注移民和商业法，评价良好。',
ARRAY['中文服务', '免费咨询', '移民法', '商业法'],
83, 4.5, 2345, 32, true, true, ARRAY['zh', 'en']),

('sichuan-flavor-house', 'Sichuan Flavor House', '川味坊麻辣烫',
'Authentic Sichuan-style mala tang in Flushing',
'正宗川味麻辣烫，法拉盛人气餐厅',
'川味坊是法拉盛最受欢迎的麻辣烫餐厅之一，提供正宗四川风味的麻辣烫和各式川菜小吃。食材新鲜，汤底每日现熬。支持堂食和外卖。',
'(718) 555-0789', NULL, NULL, NULL,
'active', 'unverified', 'free',
'法拉盛人气川菜馆，麻辣烫口碑极佳，价格实惠，是当地华人聚餐首选。',
ARRAY['川菜', '麻辣烫', '外卖', '法拉盛'],
256, 4.9, 5678, 12, false, true, ARRAY['zh']),

('huaxin-accounting', 'Huaxin Accounting', '华信会计师事务所',
'Chinese CPA firm specializing in tax and business services',
'中文注册会计师事务所，专注报税和企业服务',
'华信会计师事务所是法拉盛知名的中文CPA事务所，提供个人报税、企业报税、记账、审计和商业咨询服务。团队拥有多名注册会计师，经验丰富，服务周到。',
'(718) 555-0234', 'info@huaxincpa.com', 'https://huaxincpa.com', 'HuaxinCPA',
'active', 'verified', 'pro',
'法拉盛老牌中文会计事务所，报税季热门选择，个人报税$150起，周末营业。',
ARRAY['中文服务', '报税', '会计', '周末营业', '免费咨询'],
94, 4.7, 1890, 28, false, true, ARRAY['zh', 'en']),

('little-genius-education', 'Little Genius Education', '小天才教育中心',
'After-school tutoring and test prep in Chinese',
'课后辅导、考试培训，中文授课',
'小天才教育中心专注于K-12学生的课后辅导和考试培训，提供数学、英语、SAT/SHSAT考试准备等课程。所有课程支持中文和英语双语教学。',
'(718) 555-0567', 'info@littlegenius.com', NULL, 'LittleGeniusNY',
'active', 'unverified', 'free',
'法拉盛课后辅导中心，专注K-12教育，SAT/SHSAT培训，中英双语教学。',
ARRAY['教育', '辅导', 'SAT', '中文教学', '适合儿童'],
47, 4.6, 987, 8, false, true, ARRAY['zh', 'en']),

('lao-li-renovation', 'Lao Li Renovation', '老李装修工程',
'Home renovation and handyman services',
'住宅装修、维修服务，中文沟通',
'老李装修工程提供全方位住宅装修服务，包括厨房翻新、浴室改造、地板安装、油漆粉刷等。免费上门估价，价格合理。',
'(718) 555-0890', NULL, NULL, 'LaoLiRenovation',
'active', 'unverified', 'free',
'皇后区中文装修服务，免费估价，价格合理，口碑不错。',
ARRAY['中文服务', '装修', '免费估价', '厨房', '浴室'],
38, 4.4, 654, 15, false, true, ARRAY['zh']);


-- ============================================================
-- BUSINESS LOCATIONS
-- ============================================================

INSERT INTO business_locations (business_id, region_id, address_line1, city, state, zip_code, latitude, longitude, is_primary) VALUES
((SELECT id FROM businesses WHERE slug = 'wang-family-medical-center'), (SELECT id FROM regions WHERE slug = 'flushing-ny'), '136-20 41st Avenue, Suite 5B', 'Flushing', 'NY', '11355', 40.7590, -73.8300, true),
((SELECT id FROM businesses WHERE slug = 'zhang-law-office'), (SELECT id FROM regions WHERE slug = 'flushing-ny'), '37-06 Main Street, Suite 201', 'Flushing', 'NY', '11354', 40.7595, -73.8280, true),
((SELECT id FROM businesses WHERE slug = 'sichuan-flavor-house'), (SELECT id FROM regions WHERE slug = 'flushing-ny'), '40-52 Main Street', 'Flushing', 'NY', '11354', 40.7600, -73.8290, true),
((SELECT id FROM businesses WHERE slug = 'huaxin-accounting'), (SELECT id FROM regions WHERE slug = 'flushing-ny'), '136-18 39th Avenue, 3F', 'Flushing', 'NY', '11354', 40.7585, -73.8310, true),
((SELECT id FROM businesses WHERE slug = 'little-genius-education'), (SELECT id FROM regions WHERE slug = 'flushing-ny'), '41-60 Main Street, 2F', 'Flushing', 'NY', '11355', 40.7610, -73.8275, true),
((SELECT id FROM businesses WHERE slug = 'lao-li-renovation'), (SELECT id FROM regions WHERE slug = 'queens-ny'), NULL, 'Queens', 'NY', '11355', NULL, NULL, true);


-- ============================================================
-- BUSINESS CATEGORIES
-- ============================================================

INSERT INTO business_categories (business_id, category_id, is_primary) VALUES
((SELECT id FROM businesses WHERE slug = 'wang-family-medical-center'), (SELECT id FROM categories WHERE slug = 'medical-health'), true),
((SELECT id FROM businesses WHERE slug = 'zhang-law-office'), (SELECT id FROM categories WHERE slug = 'legal-immigration'), true),
((SELECT id FROM businesses WHERE slug = 'sichuan-flavor-house'), (SELECT id FROM categories WHERE slug = 'food-dining'), true),
((SELECT id FROM businesses WHERE slug = 'huaxin-accounting'), (SELECT id FROM categories WHERE slug = 'finance-tax'), true),
((SELECT id FROM businesses WHERE slug = 'little-genius-education'), (SELECT id FROM categories WHERE slug = 'education'), true),
((SELECT id FROM businesses WHERE slug = 'lao-li-renovation'), (SELECT id FROM categories WHERE slug = 'home-renovation'), true);


-- ============================================================
-- FORUM THREADS (using existing forum category IDs)
-- ============================================================

-- We need a profile first for forum authors
-- Note: profiles are normally created via auth trigger, but for seed data we insert directly
-- Using a fixed UUID for seed user
INSERT INTO profiles (id, username, display_name, bio, profile_type, primary_language, region_id) VALUES
('00000000-0000-0000-0000-000000000001', 'xiaoli', '新来的小李', '刚搬到法拉盛的新移民', 'user', 'zh', (SELECT id FROM regions WHERE slug = 'flushing-ny')),
('00000000-0000-0000-0000-000000000002', 'foodie_wang', '美食猎人小王', '法拉盛美食地图每周更新！', 'creator', 'zh', (SELECT id FROM regions WHERE slug = 'flushing-ny')),
('00000000-0000-0000-0000-000000000003', 'dr_li', 'Dr. 李文华', '法拉盛执业内科医生，分享健康知识', 'expert', 'zh', (SELECT id FROM regions WHERE slug = 'flushing-ny')),
('00000000-0000-0000-0000-000000000004', 'kevin_chen', 'Kevin 陈地产', '10年纽约地产经验', 'professional', 'zh', (SELECT id FROM regions WHERE slug = 'queens-ny')),
('00000000-0000-0000-0000-000000000005', 'jessica_mom', '纽约妈妈Jessica', '两个孩子的妈妈，分享学区和育儿经验', 'creator', 'zh', (SELECT id FROM regions WHERE slug = 'flushing-ny'))
ON CONFLICT (id) DO NOTHING;

-- Update voice-specific fields
UPDATE profiles SET
  is_verified = true, verified_at = NOW(), verified_type = 'expert',
  headline = '内科专家 · 家庭医疗 · 双语达人',
  bio_zh = '法拉盛执业内科医生，15年临床经验。在Baam分享健康知识和就医经验，帮助华人社区更好理解美国医疗系统。',
  follower_count = 328, post_count = 42, blog_count = 8,
  is_featured = true
WHERE id = '00000000-0000-0000-0000-000000000003';

UPDATE profiles SET
  is_verified = true, verified_type = 'professional',
  headline = '地产专家 · 法拉盛 · 10年经验',
  bio_zh = '10年纽约地产经验，专注法拉盛及周边区域买卖房和投资。',
  follower_count = 562, post_count = 35,
  is_featured = true
WHERE id = '00000000-0000-0000-0000-000000000004';

UPDATE profiles SET
  headline = '家庭博主 · 亲子活动 · 学区攻略',
  bio_zh = '两个孩子的妈妈，分享学区选择、课外活动和育儿经验。',
  follower_count = 876, post_count = 58,
  is_featured = true
WHERE id = '00000000-0000-0000-0000-000000000005';

UPDATE profiles SET
  headline = '美食达人 · 法拉盛 · 探店',
  bio_zh = '法拉盛美食地图每周更新！从街头小吃到隐藏神店，带你吃遍皇后区。',
  follower_count = 1200, post_count = 89,
  is_featured = true
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Forum threads
INSERT INTO forum_threads (slug, title, body, board_id, author_id, region_id, language, status, reply_count, view_count, vote_count, ai_summary_zh, ai_tags, ai_intent, last_replied_at) VALUES

('flushing-sichuan-restaurant-recommend', '法拉盛有没有推荐的川菜馆？最近新开的那几家如何？',
'最近想吃川菜，听说法拉盛新开了几家川菜馆。有没有去过的朋友推荐一下？最好是味道正宗、性价比高的。谢谢大家！',
(SELECT id FROM categories WHERE slug = 'forum-food'),
'00000000-0000-0000-0000-000000000001',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
'zh', 'published', 68, 1234, 45,
'多位用户推荐了Main St的川味坊和川渝人家，提到性价比高、味道正宗。也有用户推荐了新开的蜀香园。',
ARRAY['川菜', '法拉盛', '推荐', '美食'], 'recommendation_request', NOW() - INTERVAL '2 hours'),

('flushing-rent-2025-prices', '2025年法拉盛租房行情怎么样？一室一厅大概多少钱？',
'刚来纽约准备在法拉盛找房子，想问问现在的租房行情。一室一厅大概什么价位？哪个区域比较好？有没有推荐的租房渠道？',
(SELECT id FROM categories WHERE slug = 'forum-housing'),
'00000000-0000-0000-0000-000000000001',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
'zh', 'published', 45, 892, 32,
'目前法拉盛一室一厅月租约$1800-2200，比去年上涨约10%。推荐区域包括Murray Hill和Kissena附近。',
ARRAY['租房', '法拉盛', '价格', '2025'], 'question', NOW() - INTERVAL '5 hours'),

('flushing-tcm-clinic-recommend', '法拉盛有没有推荐的中医诊所？最近肩颈不太舒服',
'最近肩颈特别不舒服，想找个靠谱的中医诊所做针灸。有人有推荐吗？最好在法拉盛附近，能说中文的。保险是Oscar Health，不知道中医诊所收不收。谢谢大家！',
(SELECT id FROM categories WHERE slug = 'forum-medical'),
'00000000-0000-0000-0000-000000000001',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
'zh', 'published', 23, 456, 15,
'推荐了仁和堂和济世堂两家中医诊所，都接受部分保险。针灸每次约$80-120，部分保险可报销。',
ARRAY['中医', '法拉盛', '推荐', '肩颈', '针灸'], 'recommendation_request', NOW() - INTERVAL '3 hours'),

('queens-school-district-ranking', '皇后区学区排名分享，哪些学校适合华人家庭？',
'家里孩子明年要上小学了，想了解一下皇后区的学区情况。哪些学区比较好？华人家庭多的学区有哪些？SAT成绩比较好的高中推荐？',
(SELECT id FROM categories WHERE slug = 'forum-education'),
'00000000-0000-0000-0000-000000000005',
(SELECT id FROM regions WHERE slug = 'queens-ny'),
'zh', 'published', 28, 567, 20,
'讨论集中在26学区和25学区，推荐了几所SAT成绩突出的高中，包括Stuyvesant和Bronx Science。',
ARRAY['学区', '教育', '皇后区', '华人家庭'], 'question', NOW() - INTERVAL '8 hours'),

('h1b-lottery-results-2025', 'H1B抽签结果出来了吗？有没有今年中签的分享经验？',
'听说今年H1B抽签结果已经开始陆续通知了。有没有今年中签的朋友？分享一下经验和后续流程？',
(SELECT id FROM categories WHERE slug = 'forum-legal'),
'00000000-0000-0000-0000-000000000001',
(SELECT id FROM regions WHERE slug = 'new-york-city'),
'zh', 'published', 56, 1890, 38,
'部分用户已收到通知，讨论了中签后的时间线和注意事项。建议找经验丰富的移民律师协助后续流程。',
ARRAY['H1B', '签证', '移民', '抽签'], 'discussion', NOW() - INTERVAL '1 day');


-- ============================================================
-- EVENTS
-- ============================================================

INSERT INTO events (slug, title_zh, title_en, summary_zh, description_zh, region_id, venue_name, address, start_at, end_at, is_free, organizer_name, status, is_featured, language, ai_tags, view_count) VALUES

('flushing-spring-culture-fest-2025', '法拉盛春季文化节暨美食嘉年华',
'Flushing Spring Culture Festival & Food Fair',
'法拉盛年度春季文化活动，包含美食、表演、手工体验。',
'法拉盛春季文化节是社区年度盛事，今年将在市政厅广场举办。活动包括：中国传统文化表演、各国美食摊位、儿童手工体验区、社区组织展示等。免费入场，欢迎全家参加。',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
'法拉盛市政厅广场', '135-35 Northern Blvd, Flushing, NY 11354',
'2025-03-22 10:00:00-04', '2025-03-22 17:00:00-04',
true, '法拉盛商业改善区', 'published', true, 'zh',
ARRAY['文化节', '美食', '免费', '家庭活动'], 234),

('flushing-tax-seminar-2025', '免费报税讲座：2025年新政策解读（中文）',
'Free Tax Seminar: 2025 New Policy Updates (Chinese)',
'法拉盛图书馆免费中文报税讲座。',
'由华信会计师事务所主讲的免费报税讲座，内容包括：2024年度报税新变化、小企业税收减免政策解读、常见报税误区和注意事项。全程中文，欢迎参加。',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
'法拉盛图书馆', '41-17 Main Street, Flushing, NY 11355',
'2025-03-23 14:00:00-04', '2025-03-23 16:00:00-04',
true, '华信会计师事务所', 'published', false, 'zh',
ARRAY['报税', '讲座', '免费', '中文'], 156),

('queens-botanical-kids-craft', '亲子手工活动：春天的花园',
'Kids Craft Activity: Spring Garden',
'皇后区植物园亲子手工活动。',
'带孩子来皇后区植物园参加春季手工活动！活动内容包括制作纸花、种植小盆栽、户外写生等。适合3-10岁儿童，需家长陪同。',
(SELECT id FROM regions WHERE slug = 'queens-ny'),
'皇后区植物园', '43-50 Main Street, Flushing, NY 11355',
'2025-03-22 13:00:00-04', '2025-03-22 16:00:00-04',
false, '皇后区植物园', 'published', false, 'zh',
ARRAY['亲子', '手工', '儿童', '植物园'], 89),

('flushing-5k-spring-walk', '法拉盛公园春季5K健走活动',
'Flushing Meadows Spring 5K Walk',
'法拉盛草地公园免费5K健走。',
'迎接春天，一起来法拉盛草地公园健走！全程5公里，适合所有年龄段。活动免费，完成者可获得纪念T恤。',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
'法拉盛草地公园', 'Flushing Meadows Corona Park',
'2025-03-23 08:00:00-04', '2025-03-23 11:00:00-04',
true, '社区志愿者协会', 'published', false, 'zh',
ARRAY['健走', '运动', '免费', '春季'], 67);


-- ============================================================
-- VOICE POSTS (from featured profiles)
-- ============================================================

INSERT INTO voice_posts (author_id, post_type, title, slug, content, status, region_id, language, topic_tags, like_count, comment_count, view_count, published_at) VALUES

('00000000-0000-0000-0000-000000000003', 'blog',
'在美国看急诊你需要知道的5件事',
'er-visit-5-things-to-know',
'## 急诊 vs Urgent Care

很多新移民分不清Emergency Room（急诊）和Urgent Care（紧急护理）的区别。简单来说：

1. **什么情况去急诊**：胸痛、严重出血、呼吸困难、中风症状、严重过敏反应
2. **什么情况去Urgent Care**：发烧、轻度受伤、皮疹、轻度食物中毒
3. **急诊费用很贵**：即使有保险，急诊copay通常$150-500
4. **Urgent Care便宜很多**：copay通常$25-75
5. **不确定时打911**：如果情况紧急，永远先拨打911

记住：Urgent Care通常不需要预约，营业时间较长，是非紧急情况的好选择。',
'published',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
'zh', ARRAY['健康', '急诊', '就医'], 89, 23, 567, NOW() - INTERVAL '2 days'),

('00000000-0000-0000-0000-000000000002', 'short_post',
NULL, NULL,
'今天发现法拉盛Main Street新开了一家麻辣烫🌶️ 味道超正宗！推荐他们的招牌鸳鸯锅底，麻辣和番茄的组合绝了。排队的人不少，建议避开饭点去。#法拉盛美食 #麻辣烫',
'published',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
'zh', ARRAY['美食', '法拉盛', '麻辣烫'], 156, 34, 890, NOW() - INTERVAL '6 hours'),

('00000000-0000-0000-0000-000000000005', 'blog',
'法拉盛最好的3个儿童课外活动推荐',
'flushing-top-3-kids-activities',
'作为两个孩子的妈妈，这几年试了不少课外活动。分享我最推荐的3个：

## 1. 小天才教育中心 - 数学和阅读
我家大宝在这里上了两年数学课，进步非常明显。老师很有耐心，教学方式适合华人孩子。

## 2. 法拉盛YMCA - 游泳课
游泳是必备技能。YMCA的儿童游泳课性价比很高，教练专业，环境也不错。

## 3. 皇后区植物园 - 户外探索
周末带孩子来植物园是我们的保留节目。春天有种植活动，夏天有昆虫观察，非常适合培养孩子的好奇心。',
'published',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
'zh', ARRAY['亲子', '课外活动', '法拉盛', '教育'], 234, 45, 1234, NOW() - INTERVAL '4 days'),

('00000000-0000-0000-0000-000000000004', 'blog',
'2025年法拉盛房价趋势分析：还能买吗？',
'flushing-housing-market-2025',
'作为在法拉盛做了10年地产的经纪人，分享一下我对2025年市场的看法。

## 当前行情
- 一室公寓：$350K-450K
- 两室公寓：$500K-700K
- 独栋别墅：$800K-1.2M

## 趋势判断
利率虽然有所回落，但法拉盛的需求依然强劲。华人购房者占比约60%，对学区好的区域需求尤其大。

## 我的建议
如果是自住需求，不需要等。如果是投资，建议关注Murray Hill和Kissena附近的新建公寓项目。',
'published',
(SELECT id FROM regions WHERE slug = 'flushing-ny'),
'zh', ARRAY['地产', '房价', '法拉盛', '投资'], 178, 56, 2345, NOW() - INTERVAL '1 day');


-- ============================================================
-- REVIEWS (for businesses)
-- ============================================================

INSERT INTO reviews (business_id, author_id, rating, title, body, status, ai_sentiment, ai_highlights) VALUES

((SELECT id FROM businesses WHERE slug = 'wang-family-medical-center'),
'00000000-0000-0000-0000-000000000001', 5,
'非常满意的就医体验',
'王医生非常耐心，详细解释了每一项检查的目的。护士也很友好，全程中文沟通没有任何障碍。等待时间也不长，大概15分钟就看上了。强烈推荐给需要中文医疗服务的朋友。',
'approved', 'positive', ARRAY['耐心', '中文服务', '等待时间短']),

((SELECT id FROM businesses WHERE slug = 'wang-family-medical-center'),
'00000000-0000-0000-0000-000000000005', 5,
'带孩子看病的首选',
'带两个孩子来做年度体检，医生和护士对小朋友很有耐心。打疫苗的时候还给了小贴纸安慰孩子。而且接受我们的保险，copay只要$20。',
'approved', 'positive', ARRAY['适合儿童', '接受保险', '服务好']),

((SELECT id FROM businesses WHERE slug = 'sichuan-flavor-house'),
'00000000-0000-0000-0000-000000000002', 5,
'法拉盛最好吃的麻辣烫！',
'作为美食达人，可以负责任地说这是法拉盛最正宗的麻辣烫。汤底是每天现熬的，食材也很新鲜。推荐鸳鸯锅底，一半麻辣一半番茄，完美！价格也很合理，人均$15左右。',
'approved', 'positive', ARRAY['味道正宗', '食材新鲜', '性价比高']),

((SELECT id FROM businesses WHERE slug = 'huaxin-accounting'),
'00000000-0000-0000-0000-000000000001', 4,
'报税服务专业',
'今年第一次在华信报税，整体体验不错。会计很专业，帮我找到了几个可以抵扣的项目。唯一的小问题是报税季人比较多，需要提前预约。个人报税收费$180，算合理的。',
'approved', 'positive', ARRAY['专业', '价格合理', '需预约']);


-- ============================================================
-- Done! Seed data complete.
-- ============================================================
