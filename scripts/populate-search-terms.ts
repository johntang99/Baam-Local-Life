/**
 * Populate search_terms for all business categories
 *
 * Fills the search_terms TEXT[] column with comprehensive synonyms,
 * colloquial terms, and related keywords in Chinese + English.
 *
 * Usage:
 *   source apps/web/.env.local && npx tsx scripts/populate-search-terms.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function update(slug: string, terms: string[]) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/categories?slug=eq.${slug}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ search_terms: terms }),
  });
  const status = res.ok ? '✅' : '❌';
  console.log(`  ${status} ${slug} (${terms.length} terms)`);
}

const TERMS: Record<string, string[]> = {
  // ═══ FOOD & DINING ═══
  'food-dining': ['餐饮', '美食', '吃饭', '餐厅', '饭店', '饭馆', '食堂', 'restaurant', 'food', 'dining', '吃什么', '好吃的', '觅食'],
  'food-chinese': ['中餐', '中国菜', '中餐馆', '中餐厅', '川菜', '粤菜', '湘菜', '东北菜', '上海菜', '北京菜', '鲁菜', '闽菜', '客家菜', 'Chinese food', 'Chinese restaurant'],
  'food-japanese': ['日料', '日本菜', '日餐', '寿司', '刺身', '生鱼片', '拉面', '天妇罗', '居酒屋', '日式', 'sushi', 'ramen', 'Japanese'],
  'food-korean': ['韩餐', '韩国菜', '韩式', '烤肉', '韩国烤肉', '石锅拌饭', '泡菜', '部队锅', 'Korean', 'BBQ', 'Korean BBQ'],
  'food-hotpot': ['火锅', '麻辣烫', '串串', '串串香', '冒菜', '涮锅', '鸳鸯锅', '九宫格', '铜锅', 'hotpot', 'hot pot'],
  'food-bubble-tea': ['奶茶', '茶饮', '珍珠奶茶', '波霸', '鲜茶', '果茶', '手摇茶', '冰沙', 'bubble tea', 'boba', 'milk tea'],
  'food-bakery': ['面包', '蛋糕', '烘焙', '甜品', '西点', '糕点', '面包店', '蛋糕店', '生日蛋糕', 'bakery', 'cake', 'pastry'],
  'food-dim-sum': ['点心', '早茶', '饮茶', '茶楼', '虾饺', '烧卖', '肠粉', '叉烧包', 'dim sum', 'yum cha'],
  'food-noodles': ['面馆', '面条', '拉面', '牛肉面', '刀削面', '炸酱面', '米粉', '河粉', '粉丝', 'noodle'],
  'food-seafood': ['海鲜', '鱼', '虾', '蟹', '龙虾', '生蚝', '贝类', 'seafood', 'fish', 'lobster'],
  'food-vietnamese': ['越南菜', '越南粉', 'pho', '春卷', '越南', 'Vietnamese'],
  'food-thai': ['泰餐', '泰国菜', '泰式', '冬阴功', '绿咖喱', '泰国', 'Thai'],
  'food-asian-fusion': ['亚洲融合', '创意菜', '混搭', 'Asian fusion'],
  'food-american': ['美式', '美国菜', '汉堡', '牛排', '三明治', 'American', 'burger', 'steak'],
  'food-pizza': ['披萨', '比萨', 'pizza'],
  'food-mexican': ['墨西哥菜', '塔可', '卷饼', 'Mexican', 'taco', 'burrito'],
  'food-indian': ['印度菜', '咖喱', '飞饼', '印度', 'Indian', 'curry'],
  'food-dessert': ['甜品', '冰淇淋', '甜点', '冰激凌', '雪糕', '冻酸奶', 'dessert', 'ice cream', 'frozen yogurt'],
  'food-fast-food': ['快餐', '外卖', '便当', '盒饭', 'fast food', 'takeout', 'takeaway'],
  'food-grocery': ['超市', '杂货', '菜市场', '买菜', '生鲜', '食材', '粮油', '亚洲超市', '华人超市', 'supermarket', 'grocery', 'market'],
  'food-bar-nightlife': ['酒吧', '夜生活', '酒吧', '夜店', '鸡尾酒', 'bar', 'nightlife', 'pub', 'cocktail'],
  'food-catering': ['宴会', '外烩', '酒席', '包办酒席', '团餐', 'catering', 'banquet'],
  'food-coffee': ['咖啡', '咖啡厅', '咖啡馆', '拿铁', '美式咖啡', 'coffee', 'cafe', 'latte', 'espresso'],

  // ═══ MEDICAL ═══
  'medical-health': ['医疗', '健康', '看病', '看医生', '诊所', '医院', '门诊', 'medical', 'health', 'doctor', 'clinic'],
  'medical-chinese-medicine': ['中医', '针灸', '推拿', '拔罐', '刮痧', '艾灸', '中药', '草药', '经络', '穴位', '中医诊所', 'acupuncture', 'TCM', 'Chinese medicine', 'herbal'],
  'medical-dental': ['牙科', '牙医', '牙齿', '看牙', '洗牙', '补牙', '拔牙', '种植牙', '矫正', '正畸', '牙套', '智齿', '根管', '口腔', '牙周', 'dental', 'dentist', 'teeth', 'orthodontist'],
  'medical-optometry': ['眼科', '配镜', '验光', '眼镜', '隐形眼镜', '近视', '散光', '视力', '眼睛', 'optometry', 'eye doctor', 'glasses', 'contact lens'],
  'medical-pediatrics': ['儿科', '儿童', '小儿', '宝宝', '婴儿', '儿童医生', 'pediatrics', 'pediatrician', 'children'],
  'medical-internal': ['内科', '内科医生', '体检', '常规检查', 'internal medicine'],
  'medical-primary-care': ['家庭医生', '全科', '家医', '年检', '体检', '普通门诊', 'primary care', 'family doctor', 'GP', 'physical exam'],
  'medical-mental-health': ['心理', '心理健康', '心理咨询', '抑郁', '焦虑', '压力', '心理医生', '精神科', 'mental health', 'therapy', 'counseling', 'depression', 'anxiety'],
  'medical-obgyn': ['妇产科', '妇科', '产科', '怀孕', '产检', '妇科检查', '月经', 'OB/GYN', 'gynecologist', 'pregnancy'],
  'medical-dermatology': ['皮肤科', '皮肤', '痘痘', '湿疹', '过敏', '皮炎', '脱发', 'dermatology', 'skin', 'acne', 'eczema'],
  'medical-orthopedic': ['骨科', '骨头', '关节', '脊椎', '腰痛', '膝盖', '骨折', 'orthopedic', 'bone', 'joint'],
  'medical-physical-therapy': ['物理治疗', '理疗', '康复', '复健', '运动伤', 'physical therapy', 'PT', 'rehab'],
  'medical-pharmacy': ['药房', '药店', '买药', '处方药', '配药', 'pharmacy', 'drugstore', 'medicine'],
  'medical-urgent-care': ['急诊', '急诊室', '急救', '紧急', 'urgent care', 'ER', 'emergency'],
  'medical-chiropractic': ['脊椎治疗', '整脊', '正骨', 'chiropractic', 'chiropractor'],
  'medical-cardiology': ['心脏科', '心脏', '心血管', '血压', '心电图', 'cardiology', 'heart'],
  'medical-ent': ['耳鼻喉', '耳朵', '鼻子', '喉咙', '听力', '鼻炎', 'ENT', 'ear nose throat'],
  'medical-allergy': ['过敏', '过敏科', '花粉过敏', '食物过敏', '哮喘', 'allergy', 'allergist', 'asthma'],

  // ═══ LEGAL ═══
  'legal-immigration': ['法律', '律师', '律师楼', '法律咨询', '诉讼', 'legal', 'lawyer', 'attorney', 'law firm'],
  'legal-immigration-visa': ['移民', '签证', '绿卡', '工卡', '身份', 'H1B', 'EB5', '入籍', '公民', '庇护', '工作许可', 'immigration', 'visa', 'green card', 'citizenship'],
  'legal-business-law': ['商业法', '公司法', '合同', '注册公司', '商标', 'business law', 'corporate'],
  'legal-family': ['家庭法', '离婚', '监护权', '抚养费', '家暴', 'family law', 'divorce', 'custody'],
  'legal-real-estate': ['房产法', '房产纠纷', '买房法律', '租房纠纷', '过户', 'real estate law'],
  'legal-personal-injury': ['人身伤害', '车祸', '工伤', '索赔', '赔偿', 'personal injury', 'accident'],
  'legal-criminal': ['刑事', '刑事辩护', '犯罪', '逮捕', '保释', 'criminal', 'defense'],
  'legal-labor': ['劳工法', '劳动法', '欠薪', '工资', '解雇', '歧视', 'labor law', 'employment'],
  'legal-estate-planning': ['遗产', '遗嘱', '信托', '生前信托', '继承', 'estate planning', 'will', 'trust'],
  'legal-notary': ['公证', '翻译', '认证', '公证翻译', '文件翻译', 'notary', 'translation'],

  // ═══ FINANCE ═══
  'finance-tax': ['财税', '税务', '财务', 'finance', 'tax'],
  'finance-accounting': ['会计', '会计师', 'CPA', '记账', '审计', '财报', 'accounting', 'accountant', 'bookkeeping'],
  'finance-tax-prep': ['报税', '退税', '个税', '公司税', '州税', '联邦税', 'W2', '1099', '1040', 'tax return', 'tax preparation', 'IRS'],
  'finance-insurance': ['保险', '医疗保险', '车险', '房屋保险', '人寿保险', '商业保险', 'insurance', 'health insurance', 'auto insurance'],
  'finance-mortgage': ['贷款', '房贷', '按揭', '再融资', '首付', 'mortgage', 'loan', 'refinance'],
  'finance-investment': ['投资', '理财', '股票', '基金', '退休金', '401K', 'IRA', 'investment', 'wealth'],
  'finance-bookkeeping': ['记账', '簿记', '对账', 'bookkeeping'],
  'finance-payroll': ['薪资', '工资单', '发工资', 'payroll'],
  'finance-business-consulting': ['商业咨询', '创业', '开店', '生意', '商业计划', 'business consulting', 'startup'],

  // ═══ REAL ESTATE ═══
  'real-estate': ['地产', '房产', '买房', '租房', '卖房', '房屋', 'real estate', 'property', 'housing'],
  'realestate-agent': ['地产经纪', '经纪人', '房产中介', '买房中介', '租房中介', 'realtor', 'real estate agent', 'broker'],
  'realestate-property-mgmt': ['物业', '物业管理', '管理公司', '出租管理', 'property management'],
  'realestate-home-inspection': ['验房', '房屋检查', '验屋', 'home inspection'],
  'realestate-commercial': ['商业地产', '商铺', '写字楼', '仓库', 'commercial real estate', 'office space'],
  'realestate-title-closing': ['过户', '产权', 'title', 'closing'],
  'realestate-appraisal': ['估价', '评估', '房产评估', 'appraisal'],

  // ═══ EDUCATION ═══
  'education': ['教育', '学校', '学习', '上课', 'education', 'school', 'learning'],
  'edu-tutoring': ['补习', '辅导', '课后辅导', '家教', '补课', '作业', '学业', 'tutoring', 'after school', 'homework'],
  'edu-language': ['语言', '语言学校', '学英语', '学中文', '英语班', '中文班', 'ESL', 'language school', 'English class'],
  'edu-test-prep': ['考试', '考试培训', 'SAT', 'ACT', 'GRE', 'TOEFL', '雅思', '考试准备', 'test prep'],
  'edu-music-art': ['音乐', '美术', '钢琴', '小提琴', '吉他', '画画', '素描', '书法', 'music', 'art', 'piano', 'violin'],
  'edu-daycare': ['托管', '托儿所', '日托', '课后托管', '放学接送', 'daycare', 'child care'],
  'edu-stem': ['编程', '科技', 'STEM', '机器人', '人工智能', '数学竞赛', '奥数', 'coding', 'programming', 'robotics'],
  'edu-sports': ['体育', '武术', '跆拳道', '游泳', '篮球', '足球', '乒乓球', '羽毛球', 'sports', 'martial arts', 'taekwondo'],
  'edu-dance': ['舞蹈', '跳舞', '芭蕾', '民族舞', '拉丁舞', '街舞', 'dance', 'ballet'],
  'edu-driving-school': ['驾校', '学车', '考驾照', '练车', '路考', '笔试', '驾驶', 'driving school', "driver's license"],
  'edu-preschool': ['幼儿园', '学前班', 'pre-K', '幼教', 'preschool', 'kindergarten'],
  'edu-college-prep': ['升学', '升学顾问', '大学申请', '留学', '常春藤', 'college prep', 'college counseling', 'admission'],

  // ═══ HOME ═══
  'home-renovation': ['装修', '家居', '翻新', '改造', 'renovation', 'home improvement', 'remodel'],
  'home-general-contractor': ['总承包', '承包商', '工程', '建筑', 'general contractor', 'builder'],
  'home-plumbing': ['水管', '管道', '漏水', '马桶', '下水道', '水龙头', 'plumbing', 'plumber'],
  'home-electrical': ['电工', '电路', '开关', '插座', '布线', '跳闸', 'electrical', 'electrician'],
  'home-painting': ['油漆', '刷墙', '粉刷', '涂料', '墙面', 'painting', 'painter'],
  'home-cleaning': ['清洁', '保洁', '打扫', '深度清洁', '家政', '钟点工', 'cleaning', 'housekeeping', 'maid'],
  'home-moving': ['搬家', '搬运', '搬家公司', '长途搬家', '打包', 'moving', 'movers'],
  'home-hvac': ['暖通', '空调', '暖气', '冷气', '中央空调', '制冷', 'HVAC', 'heating', 'AC', 'air conditioning'],
  'home-roofing': ['屋顶', '漏雨', '修屋顶', '换屋顶', 'roofing', 'roof repair'],
  'home-flooring': ['地板', '地砖', '木地板', '铺地板', 'flooring', 'tile'],
  'home-landscaping': ['园艺', '绿化', '草坪', '修剪', '花园', '庭院', 'landscaping', 'gardening', 'lawn'],
  'home-pest-control': ['害虫', '灭虫', '蟑螂', '老鼠', '白蚁', '除虫', 'pest control', 'exterminator'],
  'home-locksmith': ['锁匠', '换锁', '开锁', '配钥匙', 'locksmith'],
  'home-kitchen-bath': ['厨卫', '厨房', '浴室', '卫生间', '橱柜', 'kitchen', 'bathroom'],
  'home-windows-doors': ['门窗', '换窗', '纱窗', '防盗门', 'windows', 'doors'],
  'home-furniture': ['家具', '沙发', '床', '桌子', '柜子', '家居用品', 'furniture'],

  // ═══ BEAUTY ═══
  'beauty-wellness': ['美容', '保健', '养生', 'beauty', 'wellness'],
  'beauty-hair-salon': ['美发', '理发', '剪头发', '烫发', '染发', '发型', '发廊', '造型', '头发', 'hair salon', 'haircut', 'hairstyle'],
  'beauty-barber': ['理发', '理发店', '男士理发', '剃头', 'barber', 'barbershop'],
  'beauty-nail-salon': ['美甲', '做指甲', '指甲', '甲油', '美甲店', 'nail salon', 'manicure', 'pedicure'],
  'beauty-spa-massage': ['SPA', '按摩', '足疗', '足浴', '推油', '精油', '水疗', 'spa', 'massage', 'foot massage'],
  'beauty-skincare': ['美容', '护肤', '面部', '美白', '祛斑', '抗衰', 'skincare', 'facial'],
  'beauty-fitness-gym': ['健身', '健身房', '运动', '瑜伽', '锻炼', '减肥', '增肌', 'gym', 'fitness', 'workout'],
  'beauty-yoga-pilates': ['瑜伽', '普拉提', '冥想', '拉伸', 'yoga', 'pilates', 'meditation'],
  'beauty-tattoo': ['纹身', '纹眉', '半永久', '文身', 'tattoo', 'microblading', 'permanent makeup'],
  'beauty-medical-aesthetics': ['医美', '整形', '注射', '玻尿酸', '肉毒素', '激光', 'medical aesthetics', 'Botox', 'filler'],

  // ═══ AUTO ═══
  'auto': ['汽车', '车', '修车', '汽车服务', 'auto', 'car', 'vehicle'],
  'auto-repair': ['汽车维修', '修车', '汽修', '发动机', '刹车', '变速箱', 'auto repair', 'mechanic'],
  'auto-body-shop': ['钣金', '喷漆', '车身修复', '事故车', '凹痕', 'body shop', 'collision repair'],
  'auto-dealer': ['车行', '买车', '卖车', '二手车', '新车', '车商', 'auto dealer', 'car dealership', 'used car'],
  'auto-tire': ['轮胎', '换胎', '补胎', '轮毂', 'tire', 'tires'],
  'auto-car-wash': ['洗车', '美容', '打蜡', '抛光', 'car wash', 'detailing'],
  'auto-towing': ['拖车', '救援', '道路救援', '抛锚', 'towing', 'roadside assistance'],
  'auto-oil-change': ['换机油', '保养', '机油', '滤芯', 'oil change', 'lube', 'maintenance'],

  // ═══ OTHER SERVICES ═══
  'other-services': ['服务', '其他', 'service'],
  'svc-travel': ['旅行', '旅行社', '旅游', '机票', '签证', '酒店', '旅游团', 'travel', 'travel agency', 'flight', 'hotel'],
  'svc-shipping': ['快递', '物流', '寄包裹', '国际快递', '海运', '空运', '寄东西', 'shipping', 'logistics', 'package'],
  'svc-photography': ['摄影', '拍照', '写真', '婚纱照', '证件照', '摄像', '视频制作', 'photography', 'photo', 'video'],
  'svc-printing': ['印刷', '打印', '名片', '传单', '海报', '设计', 'printing', 'design', 'banner'],
  'svc-translation': ['翻译', '口译', '笔译', '文件翻译', '同声传译', 'translation', 'interpreter'],
  'svc-pet': ['宠物', '宠物店', '宠物医院', '猫', '狗', '宠物美容', '寄养', 'pet', 'veterinary', 'vet', 'grooming'],
  'svc-dry-cleaning': ['干洗', '洗衣', '洗衣店', '熨烫', 'dry cleaning', 'laundry'],
  'svc-phone-repair': ['手机维修', '电脑维修', '修手机', '修电脑', '换屏', 'phone repair', 'computer repair'],
  'svc-tailor': ['裁缝', '改衣', '定制', '缝纫', '修改', 'tailor', 'alteration'],
  'svc-wedding': ['婚庆', '婚礼', '结婚', '婚纱', '婚礼策划', '司仪', 'wedding', 'bridal'],
  'svc-funeral': ['殡葬', '丧葬', '殡仪馆', '追悼', 'funeral'],
  'svc-storage': ['仓储', '自存', '存储', '迷你仓', 'storage', 'self storage'],
  'svc-jewelry': ['珠宝', '钟表', '首饰', '金饰', '修表', '钻石', 'jewelry', 'watch', 'diamond'],
  'svc-daycare-senior': ['老人', '养老', '老人护理', '老人院', '居家护理', '老人日托', 'senior care', 'elderly', 'nursing'],
  'svc-religious': ['教堂', '寺庙', '教会', '佛堂', '礼拜', 'church', 'temple', 'religious'],
  'svc-community-org': ['社区', '社团', '协会', '商会', '同乡会', 'community', 'organization', 'association'],
};

async function main() {
  console.log('🔤 Populating search_terms for categories\n');

  let updated = 0;
  for (const [slug, terms] of Object.entries(TERMS)) {
    await update(slug, terms);
    updated++;
  }

  console.log(`\n✅ Updated ${updated} categories`);
}

main().catch(console.error);
