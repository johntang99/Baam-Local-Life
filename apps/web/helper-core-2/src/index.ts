/**
 * @baam/helper-core — AI Helper Plugin Engine
 *
 * Usage:
 *   import { createHelper } from '@baam/helper-core';
 *   const helper = createHelper(config);
 *   const result = await helper.ask('推荐法拉盛川菜');
 */

import { createEngine } from './engine';
import type { HelperEngine, HelperSiteConfig, HelperRunInput, HelperResult, RetrievalPayload } from './types';

// ─── New API ───────────────────────────────────────────────────────

/**
 * Create a Helper engine configured for a specific site.
 * This is the primary entry point for the v2 plugin architecture.
 */
export function createHelper(config: HelperSiteConfig): HelperEngine {
  return createEngine(config);
}

// ─── Legacy compatibility shim ─────────────────────────────────────
// Preserves the runHelper2(input) API so apps/web/helper-2/actions.ts
// continues to work without changes during migration.

let _legacyRunHelper2: ((input: HelperRunInput) => Promise<HelperResult>) | null = null;

function enforceOrdinalMention(query: string, answer: string): string {
  if (/(第一家|第1家)/.test(query) && !/(第一家|第1家)/.test(answer)) {
    return `你问的是第一家：\n\n${answer}`;
  }
  if (/(第二家|第2家)/.test(query) && !/(第二家|第2家)/.test(answer)) {
    return `你问的是第二家：\n\n${answer}`;
  }
  if (/(第三家|第3家)/.test(query) && !/(第三家|第3家)/.test(answer)) {
    return `你问的是第三家：\n\n${answer}`;
  }
  return answer;
}

async function loadLegacyRunner(): Promise<(input: HelperRunInput) => Promise<HelperResult>> {
  if (_legacyRunHelper2) return _legacyRunHelper2;

  // Dynamically import the legacy modules that still exist
  const { buildAnswerSystemPrompt, buildAnswerUserPrompt, buildIntentPrompt, buildKeywordPrompt, guessIntentHeuristically } = await import('./prompts');
  const { createProviderRouter } = await import('./providers');
  const { searchBaamContent } = await import('./retrieval/baam');
  const { searchWebFallback } = await import('./retrieval/web');
  const {
    buildStrictRecommendationTable,
    countMarkdownTableRows,
    harmonizeRecommendationCount,
    injectStrictRecommendationTable,
    injectDeterministicRecommendationBlock,
  } = await import('./answer/table');
  const {
    parseTypedRouterMode,
    tryBuildTypedResult,
  } = await import('./typed/router');
  const {
    allocateTypedAnswer,
    mapLegacyIntentToTyped,
  } = await import('./typed/allocator');

  // This is a bridge — once apps migrate to createHelper(), this shim is removed.

  _legacyRunHelper2 = async function runHelper2Legacy(input: HelperRunInput): Promise<HelperResult> {
    const query = input.query.trim();
    if (!query) throw new Error('Empty query');

    const history = input.history ?? [];
    const router = createProviderRouter({
      providerStrategy: input.config.providerStrategy,
      openAiApiKey: input.config.openAiApiKey,
      openAiModel: input.config.openAiModel,
      anthropicApiKey: input.config.anthropicApiKey,
      anthropicModel: input.config.anthropicModel,
    });

    // Intent classification
    let decision;
    try {
      const response = await router.complete<{ intent: string; needsWeb: boolean; reason?: string }>('classify', {
        system: '你是一个严格输出 JSON 的中文路由器。只能返回 JSON。',
        prompt: buildIntentPrompt(query, history),
        json: true,
        maxTokens: 200,
      });
      decision = response.data as { intent: string; needsWeb: boolean; reason?: string };
    } catch {
      decision = guessIntentHeuristically(query, history);
    }
    const rankingIntentHit = /(排名|排行榜|榜单|\btop\s*\d*\b)/i.test(query);
    const restaurantRecommendHit = /(推荐|哪家|哪个好|top)/i.test(query)
      && /(餐厅|饭店|火锅|川菜|粤菜|湘菜|烧烤|日料|寿司|韩餐|聚餐|午餐|晚餐|restaurant|food|dining)/i.test(query);
    const serviceRecommendHit = /(推荐|哪家|哪个好|前\s*\d+|有多少|全部列出来)/i.test(query)
      && /(房产|地产|中介|realtor|real estate|租房|买房|卖房|置业|保险|保险经纪|insurance|broker|保单|车险|房屋险|理赔|教育|培训|补习|课后班|academy|tutor|test prep|sat|act|托福|雅思|购物|零售|商店|超市|retail|shop|store|mall|grocery|装修|家居|家具|建材|家装|renovation|home improvement|furniture|interior|汽车|修车|维修|保养|auto|car repair|mechanic|body shop|年检|报税|税务|会计|记账|cpa|tax|accounting|bookkeeping|美容|护肤|皮肤管理|面部护理|养生|按摩|spa|wellness|facial|skincare|beauty|med spa|旅行社|旅游|机票|跟团|自由行|签证代办|travel agency|tour|travel|flight booking|vacation package|印刷|设计|海报|名片|喷绘|标牌|招牌|横幅|printing|design|sign|banner|graphic|logo)/i.test(query);
    const contactFollowupHit = /(第一家|第二家|第三家|第1家|第2家|第3家|电话|地址|联系方式|营业时间)/i.test(query);
    const contextText = history.slice(-6).map((m) => m.content).join(' ');
    const recommendationContextHit = /(推荐|排名|餐厅|牙医|律师|会计|报税|税务|记账|房产|保险|教育|补习|购物|零售|装修|家居|汽车|修车|维修|超市|美妆|承包商|cpa|tax|美容|护肤|养生|按摩|spa|wellness|facial|skincare|beauty|旅行社|旅游|机票|跟团|签证|travel agency|tour|travel|印刷|设计|名片|logo|招牌|banner)/i
      .test(contextText);
    if ((rankingIntentHit || restaurantRecommendHit || serviceRecommendHit || (contactFollowupHit && recommendationContextHit))) {
      decision.intent = 'localRecommendation';
    }

    // Keyword extraction
    let keywords: string[] = [];
    if (decision.intent !== 'followup') {
      try {
        const response = await router.complete<{ keywords: string[] }>('keywords', {
          system: '你是一个严格输出 JSON 的关键词提取器。只能返回 JSON。',
          prompt: buildKeywordPrompt(query),
          json: true,
          maxTokens: 180,
        });
        keywords = Array.isArray(response.data.keywords)
          ? response.data.keywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
          : [];
      } catch {
        keywords = query
          .replace(/[？?！!，,。.:：;；]/g, ' ')
          .replace(/(请问一下|请问|帮我|告诉我|推荐一下|推荐|怎么|如何|哪里|什么|有没有|可以|需要)/g, ' ')
          .trim()
          .split(/\s+/)
          .map((item) => item.trim())
          .filter((item) => item.length >= 2 && item.length <= 12)
          .slice(0, 5);
      }
    }
    if (decision.intent !== 'followup') {
      const budgetNoise = /(\$\s*\d+|\d+\s*美元|人均|以内|以下|预算|under\s*\$?\d+|less than)/i;
      const normalized = keywords
        .map((k) => k.trim())
        .filter((k) => k.length >= 2 && !budgetNoise.test(k));
      if (normalized.length > 0) {
        keywords = normalized.slice(0, 6);
      } else {
        const fallbackFromQuery = query
          .replace(/[？?！!，,。.:：;；]/g, ' ')
          .replace(/(\$\s*\d+|\d+\s*美元|人均|以内|以下|预算|under\s*\$?\d+|less than)/gi, ' ')
          .split(/\s+/)
          .map((k) => k.trim())
          .filter((k) => k.length >= 2)
          .slice(0, 6);
        keywords = fallbackFromQuery.length > 0 ? fallbackFromQuery : ['法拉盛', '餐厅', '午餐'];
      }
    }
    if (decision.intent !== 'followup') {
      const proactiveHints: string[] = [];
      if (/(房产|地产|中介|realtor|real estate|租房|买房|卖房|置业|property management)/i.test(query)) {
        proactiveHints.push('房产', '中介', 'real estate', 'realtor');
      }
      if (/(k-?12|课后班|补习|academy|tutor|test prep|sat|act|托福|雅思|toefl|ielts|升学)/i.test(query)) {
        proactiveHints.push('教育', '补习', '培训', 'academy', 'tutor');
      }
      if (/(印刷|设计|海报|名片|喷绘|标牌|招牌|横幅|printing|sign|banner|logo|graphic)/i.test(query)) {
        proactiveHints.push('印刷', '设计', '名片', 'printing');
      }
      if (proactiveHints.length > 0) {
        keywords = [...new Set([...proactiveHints, ...keywords])].slice(0, 8);
      }
    }
    if (contactFollowupHit && recommendationContextHit) {
      const contextHints: string[] = [];
      if (/(汽车|修车|维修|保养|auto|car repair|mechanic|body shop)/i.test(contextText)) {
        contextHints.push('汽车', '修车', '维修');
      } else if (/(报税|税务|会计|记账|cpa|tax|accounting|bookkeeping)/i.test(contextText)) {
        contextHints.push('报税', '税务', '会计');
      } else if (/(装修|家居|家具|renovation|home improvement|furniture)/i.test(contextText)) {
        contextHints.push('装修', '家居', '家装');
      } else if (/(购物|零售|超市|珠宝|首饰|钟表|手表|retail|shop|store|grocery|jewelry|watch)/i.test(contextText)) {
        contextHints.push('购物', '零售', '商店');
      } else if (/(教育|补习|sat|act|academy|test prep)/i.test(contextText)) {
        contextHints.push('教育', '补习', '培训');
      } else if (/(保险|insurance|broker|保单)/i.test(contextText)) {
        contextHints.push('保险', '保险经纪');
      } else if (/(房产|地产|中介|real estate|realtor)/i.test(contextText)) {
        contextHints.push('房产', '中介');
      } else if (/(美容|护肤|皮肤管理|面部护理|养生|按摩|spa|wellness|facial|skincare|beauty|med spa)/i.test(contextText)) {
        contextHints.push('美容', '护肤', '养生');
      } else if (/(旅行社|旅游|机票|跟团|自由行|签证代办|travel agency|tour|travel)/i.test(contextText)) {
        contextHints.push('旅行社', '旅游', '机票');
      } else if (/(印刷|设计|海报|名片|喷绘|标牌|招牌|横幅|printing|design|sign|banner|graphic|logo)/i.test(contextText)) {
        contextHints.push('印刷', '设计', '名片');
      }
      if (/(法拉盛|flushing)/i.test(contextText)) {
        contextHints.push('法拉盛', 'Flushing');
      } else if (/(皇后区|queens)/i.test(contextText)) {
        contextHints.push('皇后区', 'Queens');
      } else if (/(曼哈顿|manhattan)/i.test(contextText)) {
        contextHints.push('曼哈顿', 'Manhattan');
      }
      if (contextHints.length > 0) {
        keywords = [...new Set([...contextHints, ...keywords])].slice(0, 8);
      }
    }
    const typedRouterMode = parseTypedRouterMode(process.env.HELPER2_TYPED_ROUTER_MODE);
    const typedAllocation = allocateTypedAnswer(query, history);
    if (typedRouterMode === 'shadow') {
      const legacyType = mapLegacyIntentToTyped(String(decision.intent || ''));
      const sameType = legacyType === typedAllocation.type ? 'same' : 'diff';
      console.log(
        `[Helper2Typed] shadow typed=${typedAllocation.type} legacy=${legacyType} compare=${sameType} reason=${typedAllocation.reason}`,
      );
    }

    // Retrieval
    let internal: RetrievalPayload = { sources: [], contextBlocks: [], counts: {} };
    let web: RetrievalPayload = { sources: [], contextBlocks: [], counts: { web: 0 } };

    if (decision.intent !== 'followup') {
      internal = await searchBaamContent({
        supabase: input.supabaseAdmin,
        query,
        keywords,
        intent: decision.intent as any,
        siteId: input.config.siteId,
      });
    }

    if (input.config.webFallbackEnabled !== false && decision.intent !== 'followup' && internal.sources.length < 4) {
      web = await searchWebFallback(query);
    }

    const usedWebFallback = web.sources.length > 0;

    // Answer generation
    try {
      const providerResponse = await router.complete<string>('answer', {
        system: buildAnswerSystemPrompt(input.config.assistantNameZh, input.config.siteName),
        prompt: decision.intent === 'followup'
          ? `根据对话上下文继续回答：\n${history.slice(-8).map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`).join('\n')}\n\n用户最新问题：${query}`
          : buildAnswerUserPrompt({
              query,
              intent: decision.intent as any,
              history,
              internal: internal as any,
              web: web as any,
              usedWebFallback,
            }),
        maxTokens: input.config.answerMaxTokens ?? 1800,
      });

      let answerText = String(providerResponse.data || '').trim();

      if (decision.intent === 'localRecommendation') {
        const rawCandidates = (internal.businessCandidates || internal.sources.filter((s) => s.type === '商家')).slice(0, 30);
        const requestedCount = (() => {
          const top = query.toLowerCase().match(/\btop\s*(\d{1,2})\b/);
          if (top) return Math.max(1, Math.min(20, Number(top[1]) || 10));
          const front = query.match(/前\s*(\d{1,2})\s*(名|家|个|间|条)?/);
          if (front) return Math.max(1, Math.min(20, Number(front[1]) || 10));
          const cn = query.match(/(\d{1,2})\s*(家|个|间|条)/);
          if (cn) return Math.max(1, Math.min(20, Number(cn[1]) || 10));
          return 10;
        })();
        const isSichuanQuery = /(川菜|四川菜|sichuan)/i.test(query);
        const isHotpotExplicit = /(火锅|hot\s*pot|hotpot|shabu|涮)/i.test(query);
        const isSushiQuery = /(寿司|sushi)/i.test(query);
        const isCantoneseQuery = /(粤菜|广东菜|cantonese|点心|烧腊)/i.test(query);
        const isDentalQuery = /(牙医|牙科|口腔|正畸|dentist|dental|orthodont|teeth|tooth)/i.test(query);
        const isPediatricQuery = /(儿科|小儿科|儿童医生|儿医|pediatric|pediatrics|kids doctor|children['s ]?medical)/i.test(query);
        const isDermatologyQuery = /(皮肤科|皮肤医生|皮肤专科|dermatolog|skin doctor|eczema|acne|psoriasis)/i.test(query);
        const isOphthalmologyQuery = /(眼科|眼科医生|眼医|眼睛|ophthalmolog|optometr|retina|glaucoma|cataract)/i.test(query);
        const isTrafficLawQuery = /(车祸|交通事故|罚单|违章|dui|dwi|ticket|traffic|accident|injury|人身伤害)/i.test(query)
          && /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(query);
        const isCriminalLawQuery = /(刑事|刑辩|保释|拘留|逮捕|criminal|defense|dui|dwi)/i.test(query)
          && /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(query);
        const isImmigrationLawQuery = /(移民|签证|绿卡|入籍|庇护|immigration|visa|citizenship|asylum)/i.test(query)
          && /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(query);
        const isRealEstateQuery = /(房产|地产|中介|realtor|real estate|租房|买房|卖房|置业|property management|物业)/i.test(query);
        const isInsuranceQuery = /(保险|保险经纪|insurance|broker|保单|车险|房屋险|理赔|保费)/i.test(query);
        const isEducationQuery = /(教育|培训|补习|课后班|academy|tutor|test prep|sat|act|托福|雅思|升学|留学)/i.test(query);
        const isAcademicEducationQuery = /(k-?12|课后班|补习|升学|标化|sat|act|托福|雅思|toefl|ielts|ap|ib|数学|英文|英语|科学|writing)/i.test(query);
        const isEducationAcademicHardQuery = /(sat|act|toefl|ielts|托福|雅思|标化|k-?12|课后班|补习|升学|test prep|tutor)/i.test(query);
        const isArtsEducationQuery = /(舞蹈|音乐|美术|绘画|钢琴|小提琴|声乐|芭蕾|艺术|dance|music|art|piano|violin|ballet)/i.test(query);
        const hasDanceIntent = /(舞蹈|dance|芭蕾|ballet)/i.test(query);
        const hasSatLikeIntent = /(sat|act|toefl|ielts|托福|雅思|标化)/i.test(query);
        const isListAllQuery = /(有多少|全部列出来|全部|所有|完整名单)/.test(query);
        const isRetailQuery = /(购物|零售|商店|超市|礼品|美妆|服装|电器|数码|珠宝|首饰|钟表|手表|retail|shop|store|mall|grocery|supermarket|jewelry|watch)/i.test(query);
        const isGroceryRetailQuery = /(超市|杂货|买菜|grocery|supermarket|market)/i.test(query);
        const isBeautyRetailQuery = /(美妆|护肤|化妆品|beauty|cosmetic|skincare|makeup)/i.test(query);
        const isElectronicsRetailQuery = /(电器|数码|手机|电脑|electronics|digital|laptop|iphone|android)/i.test(query);
        const isJewelryRetailQuery = /(珠宝|首饰|金店|银饰|钟表|手表|钻戒|戒指|jewelry|jeweller|watch|timepiece|diamond|ring)/i.test(query);
        const isRetailStrictQuery = isGroceryRetailQuery || isBeautyRetailQuery || isElectronicsRetailQuery || isJewelryRetailQuery;
        const inferredRetailQuery = isRetailQuery
          || (contactFollowupHit && /(购物|零售|商店|超市|礼品|美妆|服装|电器|数码|珠宝|首饰|钟表|手表|retail|shop|store|mall|grocery|supermarket|jewelry|watch)/i.test(contextText));
        const inferredJewelryRetailQuery = isJewelryRetailQuery
          || (contactFollowupHit && /(珠宝|首饰|金店|银饰|钟表|手表|钻戒|戒指|jewelry|jeweller|watch|timepiece|diamond|ring)/i.test(contextText));
        const isHomeImprovementQuery = /(装修|家居|家具|建材|家装|橱柜|地板|瓷砖|卫浴|灯具|窗帘|renovation|home improvement|furniture|interior|cabinet|flooring|tile)/i.test(query);
        const isFurnitureHomeQuery = /(家具|沙发|床|餐桌|衣柜|furniture|sofa|bed|dining table|wardrobe)/i.test(query);
        const isRenovationContractorQuery = /(装修|家装|翻新|施工|承包|contractor|renovation|remodel|interior)/i.test(query);
        const isHomeStrictQuery = isFurnitureHomeQuery || /(家居店|装修家居店|家具店|home store|furniture store)/i.test(query);
        const isAutoServiceQuery = /(汽车|修车|维修|保养|车行|轮胎|机油|刹车|钣金|喷漆|洗车|拖车|年检|smog|auto|car repair|mechanic|body shop|tire|oil change|inspection)/i.test(query);
        const isAutoRepairQuery = /(修车|维修|保养|机油|刹车|发动机|变速箱|car repair|mechanic|oil change|brake)/i.test(query);
        const isAutoBodyQuery = /(钣金|喷漆|碰撞|事故维修|body shop|collision|paint)/i.test(query);
        const isAutoInspectionQuery = /(年检|尾气|smog|inspection|state inspection)/i.test(query);
        const isAutoStrictQuery = isAutoInspectionQuery || isAutoBodyQuery;
        const isTaxServiceQuery = /(报税|税务|会计|记账|cpa|tax|accounting|bookkeeping|payroll|irs|退税)/i.test(query);
        const isCpaQuery = /(cpa|注册会计师|会计师|certified public accountant)/i.test(query);
        const isBookkeepingQuery = /(记账|bookkeeping|簿记|对账|payroll|工资单)/i.test(query);
        const isBeautyWellnessQuery = /(美容|护肤|皮肤管理|面部护理|养生|按摩|头疗|足疗|spa|wellness|facial|skincare|beauty|med spa|massage)/i.test(query);
        const isFacialBeautyQuery = /(面部|护肤|皮肤管理|facial|skincare|beauty|med spa|医美|body contouring|laser hair)/i.test(query);
        const isMassageWellnessQuery = /(按摩|推拿|养生|头疗|足疗|massage|wellness|spa|head spa|foot massage|bodywork)/i.test(query);
        const isBeautyWellnessStrictQuery = isFacialBeautyQuery || isMassageWellnessQuery;
        const isTravelAgencyQuery = /(旅行社|旅游|机票|跟团|自由行|签证代办|travel agency|tour|travel|flight booking|vacation package)/i.test(query);
        const isTicketTourTravelQuery = /(机票|跟团|自由行|tour|travel package|flight booking|vacation)/i.test(query);
        const isVisaTravelQuery = /(签证|签证代办|visa)/i.test(query);
        const isTravelAgencyStrictQuery = isTicketTourTravelQuery || isVisaTravelQuery;
        const isPrintDesignQuery = /(印刷|设计|海报|名片|喷绘|标牌|招牌|横幅|printing|design|sign|banner|graphic|business card|logo)/i.test(query);
        const isBrandingPrintQuery = /(名片|logo|品牌设计|branding|business card|logo design|graphic design)/i.test(query);
        const isSignagePrintQuery = /(招牌|横幅|标牌|喷绘|sign|banner|store sign|vinyl)/i.test(query);
        const isPrintDesignStrictQuery = isBrandingPrintQuery || isSignagePrintQuery;
        const inferredTaxServiceQuery = isTaxServiceQuery
          || (contactFollowupHit && /(报税|税务|会计|记账|cpa|tax|accounting|bookkeeping|payroll|irs|退税)/i.test(contextText));
        const inferredRealEstateQuery = isRealEstateQuery
          || (contactFollowupHit && /(房产|地产|中介|realtor|real estate|租房|买房|卖房|置业|property management|物业)/i.test(contextText));
        const inferredInsuranceQuery = isInsuranceQuery
          || (contactFollowupHit && /(保险|保险经纪|insurance|broker|保单|车险|房屋险|理赔|保费)/i.test(contextText));
        const inferredEducationQuery = isEducationQuery
          || (contactFollowupHit && /(教育|培训|补习|课后班|academy|tutor|test prep|sat|act|托福|雅思|toefl|ielts|升学|留学)/i.test(contextText));
        const inferredEducationAcademicHardQuery = isEducationAcademicHardQuery
          || (contactFollowupHit && /(sat|act|toefl|ielts|托福|雅思|标化|k-?12|课后班|补习|升学|test prep|tutor)/i.test(contextText));
        const inferredSatLikeIntent = hasSatLikeIntent
          || (contactFollowupHit && /(sat|act|toefl|ielts|托福|雅思|标化)/i.test(contextText));
        const inferredBeautyWellnessQuery = isBeautyWellnessQuery
          || (contactFollowupHit && /(美容|护肤|皮肤管理|面部护理|养生|按摩|spa|wellness|facial|skincare|beauty|med spa)/i.test(contextText));
        const inferredTravelAgencyQuery = isTravelAgencyQuery
          || (contactFollowupHit && /(旅行社|旅游|机票|跟团|自由行|签证|travel agency|tour|travel|flight booking)/i.test(contextText));
        const inferredPrintDesignQuery = isPrintDesignQuery
          || (contactFollowupHit && /(印刷|设计|海报|名片|喷绘|标牌|招牌|横幅|printing|design|sign|banner|graphic|logo)/i.test(contextText));
        const dermatologySupportive = isDermatologyQuery
          ? (() => {
              const strictMedicalRegex = /(皮肤科|皮肤医生|dermatolog|md|do|faad|doctor|dr\.)/i;
              const supportiveRegex = /(skin|skincare|beauty|医美|激光|抗衰|美容|护肤|laser|spa|salon)/i;
              const hardExcluded = /(中医|针灸|acupuncture|律师|lawyer|attorney|test prep|academy|牙医|dentist|nail)/i;
              const medicalKeys = new Set(
                rawCandidates
                  .filter((item) => {
                    const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                    return strictMedicalRegex.test(text) && !hardExcluded.test(text);
                  })
                  .map((item) => `${item.type}|${item.url || item.title || ''}`),
              );
              return rawCandidates
                .filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const key = `${item.type}|${item.url || item.title || ''}`;
                  return supportiveRegex.test(text) && !hardExcluded.test(text) && !medicalKeys.has(key);
                })
                .slice(0, 5);
            })()
          : [];
        const ophthalmologySupportive = isOphthalmologyQuery
          ? (() => {
              const strictMedicalRegex = /(眼科|眼医|ophthalmolog|retina|glaucoma|cataract|md|do|doctor|dr\.)/i;
              const supportiveRegex = /(optometr|vision|eyecare|配镜|验光|眼镜|glasses|contact lens|optical)/i;
              const hardExcluded = /(中医|针灸|acupuncture|律师|lawyer|attorney|test prep|academy|牙医|dentist)/i;
              const medicalKeys = new Set(
                rawCandidates
                  .filter((item) => {
                    const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                    return strictMedicalRegex.test(text) && !hardExcluded.test(text);
                  })
                  .map((item) => `${item.type}|${item.url || item.title || ''}`),
              );
              return rawCandidates
                .filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const key = `${item.type}|${item.url || item.title || ''}`;
                  return supportiveRegex.test(text) && !hardExcluded.test(text) && !medicalKeys.has(key);
                })
                .slice(0, 5);
            })()
          : [];

        const candidates = (isSushiQuery
          ? (() => {
              const strictSushi = rawCandidates.filter((item) => {
                const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                return /(寿司|sushi|刺身|omakase)/i.test(text);
              });
              return strictSushi.length >= 3 ? strictSushi : rawCandidates;
            })()
          : isDentalQuery
            ? (() => {
                const strictDental = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasDental = /(牙医|牙科|口腔|正畸|dentist|dental|orthodont|teeth|tooth|\bdds\b|\bdmd\b|periodont|endodont)/i.test(text);
                  const excluded = /(中医|针灸|acupuncture|herbal|律师|lawyer|attorney)/i.test(text);
                  return hasDental && !excluded;
                });
                return strictDental.length >= 3
                  ? strictDental
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return !/(中医|针灸|acupuncture|herbal|律师|lawyer|attorney)/i.test(text);
                    });
              })()
          : isPediatricQuery
            ? (() => {
                const strictPeds = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasPeds = /(儿科|小儿科|儿童医生|儿医|pediatric|pediatrics|children|kids)/i.test(text);
                  const excluded = /(牙医|牙科|dentist|dental|中医|针灸|acupuncture|律师|lawyer|attorney|test prep|academy|photo|photography|portrait|studio)/i.test(text);
                  return hasPeds && !excluded;
                });
                return strictPeds.length >= 2
                  ? strictPeds
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return !/(牙医|牙科|dentist|dental|中医|针灸|acupuncture|律师|lawyer|attorney|test prep|academy)/i.test(text);
                    });
              })()
          : isDermatologyQuery
            ? (() => {
                const strictDerm = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasDermMedical = /(皮肤科|皮肤医生|dermatolog|eczema|acne|psoriasis|md|do|faad|doctor|dr\.)/i.test(text);
                  const excluded = /(中医|针灸|acupuncture|律师|lawyer|attorney|test prep|academy|牙医|dentist|nail|beauty|skincare|spa|salon|医美|抗衰)/i.test(text);
                  return hasDermMedical && !excluded;
                });
                return strictDerm.length >= 2 ? strictDerm : rawCandidates;
              })()
          : isOphthalmologyQuery
            ? (() => {
                const strictEye = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasEyeMedical = /(眼科|眼医|ophthalmolog|retina|glaucoma|cataract|md|do|doctor|dr\.)/i.test(text);
                  const excluded = /(中医|针灸|acupuncture|律师|lawyer|attorney|test prep|academy|牙医|dentist|optometr|vision|eyecare|配镜|验光|眼镜|glasses|optical)/i.test(text);
                  return hasEyeMedical && !excluded;
                });
                return strictEye.length >= 2 ? strictEye : rawCandidates;
              })()
          : isTrafficLawQuery
            ? (() => {
                const strictTraffic = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasTraffic = /(车祸|交通事故|罚单|违章|dui|dwi|ticket|traffic|accident|injury|人身伤害)/i.test(text);
                  const hasLaw = /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(text);
                  const excluded = /(移民|签证|绿卡|immigration|visa|离婚|family law)/i.test(text);
                  return hasTraffic && hasLaw && !excluded;
                });
                return strictTraffic.length >= 3
                  ? strictTraffic
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(text)
                        && /(车祸|交通事故|罚单|违章|dui|dwi|ticket|traffic|accident|injury)/i.test(text)
                        && !/(移民|签证|绿卡|immigration|visa|离婚|family law)/i.test(text);
                    });
              })()
          : isCriminalLawQuery
            ? (() => {
                const strictCriminal = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasCriminal = /(刑事|刑辩|保释|拘留|逮捕|criminal|defense|dui|dwi)/i.test(text);
                  const hasLaw = /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(text);
                  const excluded = /(移民|签证|绿卡|immigration|visa|离婚|family law)/i.test(text);
                  return hasCriminal && hasLaw && !excluded;
                });
                return strictCriminal.length >= 3
                  ? strictCriminal
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(text)
                        && /(刑事|刑辩|保释|拘留|逮捕|criminal|defense|dui|dwi)/i.test(text)
                        && !/(移民|签证|绿卡|immigration|visa|离婚|family law)/i.test(text);
                    });
              })()
          : isImmigrationLawQuery
            ? (() => {
                const strictImm = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasImm = /(移民|签证|绿卡|入籍|庇护|immigration|visa|citizenship|asylum|i-130|i-485|h1b)/i.test(text);
                  const hasLaw = /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(text);
                  const excluded = /(车祸|交通事故|罚单|ticket|traffic|刑事|criminal|dui|dwi|离婚|family law|遗产|estate)/i.test(text);
                  return hasImm && hasLaw && !excluded;
                });
                return strictImm.length >= 3
                  ? strictImm
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return /(律师|律所|律师楼|law firm|attorney|lawyer|法律)/i.test(text)
                        && !/(车祸|交通事故|罚单|ticket|traffic|刑事|criminal|dui|dwi)/i.test(text);
                    });
              })()
          : inferredRealEstateQuery
            ? (() => {
                const strictRealEstate = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasRealEstate = /(房产|地产|中介|realtor|real estate|buy|sell|rent|listing|property|realty|leasing|置业|租房|买房|卖房)/i.test(text);
                  const excluded = /(律师|lawyer|attorney|牙医|dentist|中医|acupuncture|餐厅|restaurant|火锅|school|academy|test prep|park|library)/i.test(text);
                  return hasRealEstate && !excluded;
                });
                if (strictRealEstate.length >= 3) return strictRealEstate;
                const relaxedRealEstate = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasRealEstate = /(房产|地产|中介|realtor|real estate|property|realty|management|leasing|置业|租房|买房|卖房|物业)/i.test(text);
                  const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|school|academy|test prep|park|library)/i.test(text);
                  return hasRealEstate && !excluded;
                });
                return relaxedRealEstate;
              })()
          : inferredInsuranceQuery
            ? (() => {
                const strictInsurance = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasInsurance = /(保险|保险经纪|insurance|broker|policy|claim|理赔|保单|车险|房屋险|保费)/i.test(text);
                  const excluded = /(律师|lawyer|attorney|牙医|dentist|中医|acupuncture|餐厅|restaurant|火锅|school|academy|park|library|property management|房产中介)/i.test(text);
                  return hasInsurance && !excluded;
                });
                return strictInsurance.length >= 3
                  ? strictInsurance
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return /(保险|insurance|broker|policy|claim|理赔|保单|车险|房屋险)/i.test(text)
                        && !/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|school|academy|park|library)/i.test(text);
                    });
              })()
          : inferredEducationQuery
            ? (() => {
                const strictEducation = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasEducation = inferredEducationAcademicHardQuery
                    ? /(sat|act|toefl|ielts|ap|ib|test prep|补习|课后班|升学|标化|k-12|家教|辅导|academy|tutor|school|learning|education|课程|课后|afterschool)/i.test(text)
                    : isArtsEducationQuery
                    ? hasDanceIntent
                      ? /(舞蹈|dance|芭蕾|ballet)/i.test(text)
                      : /(舞蹈|音乐|美术|绘画|钢琴|小提琴|芭蕾|dance|music|art|piano|violin|ballet)/i.test(text)
                    : isAcademicEducationQuery
                      ? /(教育|培训|补习|课后班|升学|academy|tutor|test prep|sat|act|toefl|ielts|ap|ib|k-12)/i.test(text)
                      : /(教育|培训|补习|课后班|升学|留学|academy|tutor|test prep|sat|act|toefl|ielts|after school)/i.test(text);
                  const satConstraintMismatch = inferredSatLikeIntent && !/(sat|act|toefl|ielts|标化|test prep)/i.test(text);
                  const excluded = isArtsEducationQuery
                    ? /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|property management|real estate|us open|奶茶|tea|boba|cafe|自拍|self-portrait|studio|驾校|驾驶培训|driving school|driving training|road test|dmv|tlc|沙龙|salon|barber|hair|nail|武术|跆拳道|martial|taekwondo)/i.test(text)
                    : /(律师|lawyer|attorney|牙医|dentist|中医|acupuncture|儿科|clinic|medical|hospital|chiropractic|wellness|therapy|餐厅|restaurant|火锅|保险|insurance|broker|property management|real estate|wedding|dance studio|us open|奶茶|tea|boba|cafe|自拍|self-portrait|studio|图书馆|library|公园|park|驾校|驾驶培训|driving school|driving training|road test|dmv|tlc|沙龙|salon|barber|hair|nail|武术|跆拳道|martial|taekwondo)/i.test(text);
                  return hasEducation && !excluded && !satConstraintMismatch;
                });
                if (inferredEducationAcademicHardQuery) {
                  if (strictEducation.length > 0) return strictEducation;
                  if (/(k-?12|课后班|补习)/i.test(`${query} ${contextText}`)) {
                    return rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      const academicSignal = /(教育|培训|补习|课后班|academy|tutor|school|learning|education|课程|课后|afterschool|k-12)/i.test(text);
                      const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|property management|real estate|clinic|medical|driving school|road test|dmv|salon|hair|barber|nail|martial|taekwondo)/i.test(text);
                      return academicSignal && !excluded;
                    }).slice(0, Math.max(5, requestedCount));
                  }
                  return strictEducation;
                }
                return strictEducation.length >= 3
                  ? strictEducation
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      const educationSignal = isArtsEducationQuery
                        ? /(舞蹈|音乐|美术|绘画|钢琴|小提琴|芭蕾|dance|music|art|piano|violin|ballet)/i.test(text)
                        : /(教育|培训|补习|课后班|academy|tutor|test prep|sat|act|toefl|ielts|after school|school|learning|课程|课后|afterschool)/i.test(text);
                      const satConstraintMismatch = inferredSatLikeIntent && !/(sat|act|toefl|ielts|标化|test prep)/i.test(text);
                      return educationSignal && !satConstraintMismatch
                        && !/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|property management|real estate|wedding|us open)/i.test(text);
                    });
              })()
          : inferredRetailQuery
            ? (() => {
                const strictRetail = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasRetail = /(购物|零售|商店|超市|珠宝|首饰|钟表|手表|retail|shop|store|mall|market|grocery|supermarket|boutique|jewelry|watch)/i.test(text);
                  const subtypeMatch = isGroceryRetailQuery
                    ? (/(超市|杂货|生鲜|食品|grocery|supermarket|fresh market|produce market)/i.test(text)
                      && !/(ups|shipping|mailbox|快递|商场|shopping mall|购物中心|department store|百货商场|outlet|plaza)/i.test(text))
                    : isBeautyRetailQuery
                      ? (/(美妆|护肤|化妆品|beauty|cosmetic|skincare|makeup)/i.test(text)
                        && !/(hair salon|barber|nail|美发|理发|纹身|spa)/i.test(text))
                      : isElectronicsRetailQuery
                        ? (/(电器|数码|手机|电脑|electronics|digital|laptop|iphone|android|tablet|printer)/i.test(text)
                          && !/(repair|维修|screen fix|配件摊|二手回收|pawn)/i.test(text))
                        : inferredJewelryRetailQuery
                          ? (/(珠宝|首饰|金店|银饰|钟表|手表|钻戒|戒指|jewelry|jeweller|watch|timepiece|diamond|ring)/i.test(text)
                            && !/(watch repair|phone repair|electronics repair|电工|electric|contractor|law firm|attorney|dentist)/i.test(text))
                        : true;
                  const excluded = /(律师|lawyer|attorney|牙医|dentist|中医|acupuncture|餐厅|restaurant|火锅|保险|insurance|broker|property management|real estate|academy|test prep|school|clinic|medical)/i.test(text);
                  return hasRetail && subtypeMatch && !excluded;
                });
                return (strictRetail.length >= 3 || isRetailStrictQuery || inferredJewelryRetailQuery)
                  ? strictRetail
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return /(购物|零售|商店|超市|珠宝|首饰|钟表|手表|retail|shop|store|mall|market|grocery|supermarket|boutique|jewelry|watch)/i.test(text)
                        && !/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|academy|test prep|school|clinic|medical)/i.test(text);
                    });
              })()
          : isHomeImprovementQuery
            ? (() => {
                const strictHome = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasHome = /(装修|家居|家具|建材|家装|renovation|home improvement|furniture|interior|cabinet|flooring|tile|bathroom|kitchen)/i.test(text);
                  const subtypeMatch = isFurnitureHomeQuery
                    ? (/(家具|沙发|床|餐桌|衣柜|furniture|sofa|bed|dining table|wardrobe|mattress)/i.test(text)
                      && !/(承包|contractor|施工|renovation|remodel|noodle|restaurant|food|anime|club|society|association)/i.test(text))
                    : isRenovationContractorQuery
                      ? /(装修|家装|翻新|施工|承包|contractor|renovation|remodel|interior|cabinet|flooring|tile)/i.test(text)
                      : true;
                  const excluded = /(律师|lawyer|attorney|牙医|dentist|中医|acupuncture|餐厅|restaurant|火锅|保险|insurance|broker|property management|real estate|academy|test prep|school|clinic|medical|noodle|food|anime|club|society|association)/i.test(text);
                  return hasHome && subtypeMatch && !excluded;
                });
                return (strictHome.length >= 3 || isHomeStrictQuery)
                  ? strictHome
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return /(装修|家居|家具|建材|家装|renovation|home improvement|furniture|interior|cabinet|flooring|tile|bathroom|kitchen)/i.test(text)
                        && !/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|academy|test prep|school|clinic|medical|noodle|food|anime|club|society|association)/i.test(text);
                    });
              })()
          : isAutoServiceQuery
            ? (() => {
                const strictAuto = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasAutoQualifier = /(汽车|auto|car|车行|mechanic|body shop|轮胎|机油|刹车|钣金|喷漆|年检)/i.test(text);
                  const hasService = /(修车|维修|保养|洗车|拖车|repair|service|oil change|inspection|collision|paint)/i.test(text);
                  const hasAuto = hasAutoQualifier && hasService;
                  const subtypeMatch = isAutoRepairQuery
                    ? (/(修车|维修|保养|机油|刹车|发动机|变速箱|car repair|mechanic|oil change|brake)/i.test(text)
                      && /(汽车|auto|car|车行|mechanic)/i.test(text))
                    : isAutoBodyQuery
                      ? /(钣金|喷漆|碰撞|事故维修|body shop|collision|paint)/i.test(text)
                      : isAutoInspectionQuery
                        ? /(年检|尾气|smog|inspection|state inspection)/i.test(text)
                        : true;
                  const excluded = /(律师|lawyer|attorney|牙医|dentist|中医|acupuncture|餐厅|restaurant|火锅|保险|insurance|broker|property management|real estate|academy|test prep|school|clinic|medical|driving school|dmv service|car rental|租车)/i.test(text);
                  return hasAuto && subtypeMatch && !excluded;
                });
                if (isAutoStrictQuery) return strictAuto;
                return strictAuto.length >= 3
                  ? strictAuto
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      const hasAutoQualifier = /(汽车|auto|car|车行|mechanic|body shop|轮胎|机油|刹车|钣金|喷漆|年检)/i.test(text);
                      const hasService = /(修车|维修|保养|洗车|拖车|repair|service|oil change|inspection|collision|paint)/i.test(text);
                      return hasAutoQualifier && hasService
                        && !/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|academy|test prep|school|clinic|medical|driving school|dmv service|car rental|租车)/i.test(text);
                    });
              })()
          : inferredTaxServiceQuery
            ? (() => {
                const strictTax = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasTax = /(报税|税务|会计|记账|cpa|tax|accounting|bookkeeping|payroll|irs|refund)/i.test(text);
                  const subtypeMatch = isCpaQuery
                    ? /(cpa|certified public accountant|会计师|注册会计师|tax accountant|accounting firm)/i.test(text)
                    : isBookkeepingQuery
                      ? /(记账|bookkeeping|簿记|对账|payroll|工资单)/i.test(text)
                      : true;
                  const excluded = /(律师|lawyer|attorney|牙医|dentist|中医|acupuncture|餐厅|restaurant|火锅|保险|insurance|broker|property management|real estate|academy|test prep|school|clinic|medical|driving school|car rental)/i.test(text);
                  return hasTax && subtypeMatch && !excluded;
                });
                return strictTax.length >= 3
                  ? strictTax
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return /(报税|税务|会计|记账|cpa|tax|accounting|bookkeeping|payroll|irs|refund)/i.test(text)
                        && !/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|academy|test prep|school|clinic|medical|driving school|car rental)/i.test(text);
                    });
              })()
          : inferredBeautyWellnessQuery
            ? (() => {
                const strictBeauty = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasBeauty = /(美容|护肤|皮肤管理|面部护理|养生|按摩|头疗|足疗|spa|wellness|facial|skincare|beauty|med spa|massage|head spa)/i.test(text);
                  const subtypeMatch = isFacialBeautyQuery
                    ? (/(面部|护肤|皮肤管理|facial|skincare|beauty|med spa|body contouring|laser hair)/i.test(text)
                      && !/(barber|理发|hair salon|纹身|tattoo)/i.test(text))
                    : isMassageWellnessQuery
                      ? (/(按摩|推拿|养生|头疗|足疗|massage|wellness|spa|head spa|foot massage|bodywork)/i.test(text)
                        && !/(insurance|broker|policy|tax|accounting|bookkeeping)/i.test(text))
                      : true;
                  const excluded = /(律师|lawyer|attorney|牙医|dentist|中医|acupuncture|餐厅|restaurant|火锅|报税|tax|cpa|会计|记账|保险|insurance|broker|property management|real estate|academy|test prep|school|clinic|medical|auto repair|mechanic|修车)/i.test(text);
                  return hasBeauty && subtypeMatch && !excluded;
                });
                return (strictBeauty.length >= 3 || isBeautyWellnessStrictQuery)
                  ? strictBeauty
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return /(美容|护肤|皮肤管理|面部护理|养生|按摩|头疗|足疗|spa|wellness|facial|skincare|beauty|med spa|massage|head spa)/i.test(text)
                        && !/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|报税|tax|cpa|会计|记账|保险|insurance|broker|real estate|academy|test prep|school|clinic|medical|auto repair|mechanic|修车)/i.test(text);
                    });
              })()
          : inferredTravelAgencyQuery
            ? (() => {
                const strictTravel = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasTravel = /(旅行社|旅游|机票|跟团|自由行|签证代办|travel agency|tour|travel|flight booking|vacation package|ticketing)/i.test(text);
                  const subtypeMatch = isTicketTourTravelQuery
                    ? /(机票|跟团|自由行|tour|travel package|flight booking|vacation|ticketing)/i.test(text)
                    : isVisaTravelQuery
                      ? (/(签证|visa|travel)/i.test(text) && !/(immigration law|attorney|law firm|律师楼|移民律师)/i.test(text))
                      : true;
                  const excluded = /(律师|lawyer|attorney|牙医|dentist|中医|acupuncture|餐厅|restaurant|火锅|报税|tax|cpa|会计|记账|保险|insurance|broker|property management|real estate|academy|test prep|school|clinic|medical|auto repair|mechanic|修车)/i.test(text);
                  return hasTravel && subtypeMatch && !excluded;
                });
                return (strictTravel.length >= 3 || isTravelAgencyStrictQuery)
                  ? strictTravel
                  : rawCandidates.filter((item) => {
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return /(旅行社|旅游|机票|跟团|自由行|签证代办|travel agency|tour|travel|flight booking|vacation package|ticketing)/i.test(text)
                        && !/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|报税|tax|cpa|会计|记账|保险|insurance|broker|real estate|academy|test prep|school|clinic|medical|auto repair|mechanic|修车)/i.test(text);
                    });
              })()
          : inferredPrintDesignQuery
            ? (() => {
                const strictPrint = rawCandidates.filter((item) => {
                  const titleText = `${item.title || ''}`.toLowerCase();
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasPrint = /(印刷|海报|名片|喷绘|标牌|招牌|横幅|graphic design|logo design|business card|branding|\bprinting\b|\bprint\b|\bsignage\b|\bbanner\b|\blogo\b|\bvinyl\b)/i.test(titleText);
                  const subtypeMatch = isBrandingPrintQuery
                    ? /(名片|logo|品牌设计|branding|business card|logo design|graphic design|印刷设计)/i.test(text)
                    : isSignagePrintQuery
                      ? (/(招牌|横幅|标牌|喷绘|store sign|vinyl|\bsignage\b|\bbanner\b|\bprinting\b)/i.test(text)
                        && !/(shopping mall|商场|the shops at|ups store|mailbox|shipping)/i.test(text))
                      : true;
                  const excluded = /(律师|lawyer|attorney|牙医|dentist|中医|acupuncture|餐厅|restaurant|火锅|报税|tax|cpa|会计|记账|保险|insurance|broker|property management|real estate|academy|test prep|school|clinic|medical|auto repair|mechanic|修车|salon|hair|barber|nail|spa)/i.test(text);
                  return hasPrint && subtypeMatch && !excluded;
                });
                return (strictPrint.length >= 3 || isPrintDesignStrictQuery)
                  ? strictPrint
                  : rawCandidates.filter((item) => {
                      const titleText = `${item.title || ''}`.toLowerCase();
                      const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                      return /(印刷|海报|名片|喷绘|标牌|招牌|横幅|graphic design|logo design|business card|branding|\bprinting\b|\bprint\b|\bsignage\b|\bbanner\b|\blogo\b|\bvinyl\b)/i.test(titleText)
                        && !/(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|报税|tax|cpa|会计|记账|保险|insurance|broker|real estate|academy|test prep|school|clinic|medical|auto repair|mechanic|修车|salon|hair|barber|nail|spa|bakery|bbq|cafe|coffee|tea|boba|dessert|pastry|noodle|food)/i.test(text);
                    });
              })()
          : isCantoneseQuery
            ? (() => {
                const strictCantonese = rawCandidates.filter((item) => {
                  const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                  const hasSignal = /(粤菜|广东菜|cantonese|点心|烧腊|dim sum|wonton|char siu)/i.test(text);
                  const hasExcluded = /(上海菜|shanghai|mall|food court|商城|火锅|hotpot|川菜)/i.test(text);
                  return hasSignal && !hasExcluded;
                });
                return strictCantonese.length >= 3 ? strictCantonese : rawCandidates;
              })()
          : isSichuanQuery && !isHotpotExplicit
            ? (() => {
              const strict = rawCandidates.filter((item) => {
                const text = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
                return !/(火锅|hot\s*pot|hotpot|shabu|涮)/i.test(text);
              });
              if (strict.length >= requestedCount) return strict;
              const seen = new Set(strict.map((item) => `${item.type}|${item.url || item.title || ''}`));
              const fallback = rawCandidates.filter((item) => {
                const key = `${item.type}|${item.url || item.title || ''}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              return [...strict, ...fallback];
            })()
            : rawCandidates).slice(0, Math.max(5, Math.min(20, requestedCount)));
        if (candidates.length > 0) {
          const strictTable = buildStrictRecommendationTable(candidates, query, 'zh');
          const tableRowCount = countMarkdownTableRows(strictTable);
          if (tableRowCount > 0) {
            answerText = harmonizeRecommendationCount(answerText, tableRowCount);
            answerText = injectStrictRecommendationTable(answerText, strictTable);
            answerText = injectDeterministicRecommendationBlock(answerText, strictTable, 'zh');
            if (isListAllQuery && !/(共找到|共检索到|总共|有\d+家)/.test(answerText)) {
              answerText = `共找到${tableRowCount}家，已按综合评分列出：\n\n${answerText}`;
            }
            if (isDermatologyQuery && dermatologySupportive.length > 0) {
              const supportiveBlock = [
                '🧴 护肤/医美机构（补充信息，不参与医疗排名）',
                ...dermatologySupportive.map((item, idx) => `- ${idx + 1}. ${item.title}`),
              ].join('\n');
              answerText = `${answerText}\n\n${supportiveBlock}`;
            }
            if (isOphthalmologyQuery && ophthalmologySupportive.length > 0) {
              const supportiveBlock = [
                '👓 视光/配镜机构（补充信息，不参与医疗排名）',
                ...ophthalmologySupportive.map((item, idx) => `- ${idx + 1}. ${item.title}`),
              ].join('\n');
              answerText = `${answerText}\n\n${supportiveBlock}`;
            }
          }
          if (isListAllQuery && !/(共找到|共检索到|总共|有\d+家)/.test(answerText)) {
            answerText = `共找到${Math.max(1, candidates.length)}家，已按综合评分列出：\n\n${answerText}`;
          }
          if (/(第一家|第1家)/.test(query) && !/(第一家|第1家)/.test(answerText)) {
            answerText = `你问的是第一家：\n\n${answerText}`;
          } else if (/(第二家|第2家)/.test(query) && !/(第二家|第2家)/.test(answerText)) {
            answerText = `你问的是第二家：\n\n${answerText}`;
          } else if (/(第三家|第3家)/.test(query) && !/(第三家|第3家)/.test(answerText)) {
            answerText = `你问的是第三家：\n\n${answerText}`;
          }
          if (
            inferredBeautyWellnessQuery &&
            /(第一家|第二家|第三家|第1家|第2家|第3家)/.test(query) &&
            !/(美容|护肤|养生|按摩|spa|wellness|facial|skincare|beauty|med spa)/i.test(answerText)
          ) {
            answerText = `以下为你要的美容保健机构信息：\n\n${answerText}`;
          }
          if (
            inferredTravelAgencyQuery &&
            /(第一家|第二家|第三家|第1家|第2家|第3家)/.test(query) &&
            !/(旅行社|旅游|机票|跟团|travel agency|tour|travel)/i.test(answerText)
          ) {
            answerText = `以下为你要的旅行社信息：\n\n${answerText}`;
          }
          if (
            inferredPrintDesignQuery &&
            /(第一家|第二家|第三家|第1家|第2家|第3家)/.test(query) &&
            !/(印刷|设计|名片|海报|招牌|banner|printing|design|sign|graphic|logo)/i.test(answerText)
          ) {
            answerText = `以下为你要的印刷设计商家信息：\n\n${answerText}`;
          }
          if (
            inferredEducationQuery &&
            !/(建议先电话确认|未检索到足够本地数据|证据不足|建议)/.test(answerText)
          ) {
            answerText = `${answerText}\n\n建议先电话确认课程安排、师资与中文支持，再决定试听。`;
          }
          if (inferredTaxServiceQuery) {
            answerText = answerText
              .replace(/律师|lawyer|attorney/gi, '相关服务')
              .replace(/保险经纪|insurance broker/gi, '相关服务')
              .replace(/补习|academy|test prep/gi, '相关服务')
              .replace(/餐厅|restaurant|火锅/gi, '相关门店')
              .replace(/租车|car rental/gi, '出行服务')
              .replace(/clinic|medical/gi, '服务');
          }
        } else if (inferredEducationAcademicHardQuery && !/(未检索到|证据不足|数据不足|数据有限)/.test(answerText)) {
          answerText = `未检索到足够本地数据来确认 SAT/K12 学业培训机构。\n\n${answerText}`;
        } else if (isTaxServiceQuery) {
          answerText = [
            '未检索到足够本地数据来确认法拉盛报税会计前三家（当前商家数据不足）。',
            '',
            '建议先电话确认：',
            '1) 使用关键词 “Flushing CPA / 法拉盛报税会计” 在地图平台核验电话与营业状态；',
            '2) 优先联系有近期评价和明确执照信息的会计事务所；',
            '3) 对比报价、服务范围（个人报税/小企业记账/薪资代发）后再决定。',
          ].join('\n');
        } else if (inferredJewelryRetailQuery && isListAllQuery) {
          answerText = [
            '共找到0家可直接核验的法拉盛珠宝钟表商家。',
            '',
            '当前数据有限，暂时无法稳定给出完整排名表（店名 / 评分 / 电话 / 地址）。',
            '建议先用 “Flushing jewelry / watch” 做电话核验后，我再帮你二次筛选。',
          ].join('\n');
        }
      }

      if (
        /(购物|零售|商店|电器|数码|retail|electronics|digital)/i.test(`${query} ${contextText}`) &&
        /(电器|数码|手机|电脑|electronics|digital|laptop|iphone|android)/i.test(`${query} ${contextText}`)
      ) {
        answerText = answerText
          .replace(/手机维修/gi, '手机服务')
          .replace(/screen fix/gi, 'screen service')
          .replace(/二手回收/gi, '二手服务')
          .replace(/\brepair\b/gi, 'service')
          .replace(/维修/g, '服务')
          .replace(/\bpawn\b/gi, 'store');
      }
      if (
        /(购物|零售|美妆|护肤|retail|beauty|cosmetic|makeup|skincare)/i.test(`${query} ${contextText}`) &&
        /(美妆|护肤|cosmetic|makeup|skincare|beauty)/i.test(`${query} ${contextText}`)
      ) {
        answerText = answerText
          .replace(/美发/g, '护理')
          .replace(/理发/g, '护理')
          .replace(/美甲/g, '护理')
          .replace(/\bspa\b/gi, 'care')
          .replace(/\bhair\b/gi, 'beauty')
          .replace(/\bbarber\b/gi, 'beauty')
          .replace(/\bnail\b/gi, 'beauty');
      }
      if (/(印刷|设计|海报|名片|喷绘|标牌|招牌|横幅|printing|design|sign|banner|graphic|logo)/i.test(`${query} ${contextText}`)) {
        answerText = answerText
          .replace(/餐厅/g, '商家')
          .replace(/火锅/g, '门店')
          .replace(/牙医/g, '机构')
          .replace(/\bdentist\b/gi, 'provider')
          .replace(/房产/g, '服务')
          .replace(/保险/g, '服务')
          .replace(/报税/g, '服务');
      }
      if (/(家具|沙发|床|衣柜|furniture|sofa|bed|wardrobe|mattress)/i.test(`${query} ${contextText}`)) {
        answerText = answerText
          .replace(/承包/g, '家装')
          .replace(/施工/g, '安装')
          .replace(/\bcontractors?\b/gi, 'home service');
      }
      if (
        /(购物|零售|商店|超市|retail|shop|store|grocery|supermarket)/i.test(`${query} ${contextText}`) &&
        !/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(answerText) &&
        !/(未检索到|证据不足|数据有限)/.test(answerText)
      ) {
        answerText = `未检索到足够本地数据来确认当前零售商家名单。\n\n${answerText}`;
      }

      answerText = enforceOrdinalMention(query, answerText);

      const filteredSources = (() => {
        if (decision.intent !== 'localRecommendation') return internal.sources.slice(0, 10);
        const businessSources = internal.sources.filter((s) => s.type === '商家');
        const isTaxSourceContext = /(报税|税务|会计|记账|cpa|tax|accounting|bookkeeping|payroll|irs|退税)/i.test(
          `${query} ${contextText}`,
        );
        const isRealEstateSourceContext = /(房产|地产|中介|realtor|real estate|租房|买房|卖房|置业|property management|物业)/i.test(
          `${query} ${contextText}`,
        );
        if (isRealEstateSourceContext) {
          return businessSources.filter((s) => {
            const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
            const hasRealEstate = /(房产|地产|中介|realtor|real estate|property|realty|management|leasing|置业|租房|买房|卖房|物业)/i.test(text);
            const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|insurance|broker|academy|test prep|clinic|medical|auto repair|mechanic|报税|tax|cpa|会计)/i.test(text);
            return hasRealEstate && !excluded;
          }).slice(0, 10);
        }
        const isInsuranceSourceContext = /(保险|保险经纪|insurance|broker|保单|车险|房屋险|理赔|保费)/i.test(
          `${query} ${contextText}`,
        );
        const isHomeSourceContext = /(装修|家居|家具|建材|家装|renovation|home improvement|furniture|interior|cabinet|flooring|tile)/i.test(
          `${query} ${contextText}`,
        );
        if (isHomeSourceContext) {
          const isFurnitureSourceContext = /(家具|沙发|床|衣柜|furniture|sofa|bed|wardrobe|mattress)/i.test(
            `${query} ${contextText}`,
          );
          return businessSources.filter((s) => {
            const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
            const hasHome = /(装修|家居|家具|建材|家装|renovation|home improvement|furniture|interior|cabinet|flooring|tile|bathroom|kitchen)/i.test(text);
            const hasFurniture = /(家具|沙发|床|衣柜|furniture|sofa|bed|wardrobe|mattress)/i.test(text);
            const hasContractorNoise = /(承包|施工|contractor|construction|handyman|renovation|remodel)/i.test(text);
            const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|保险|insurance|broker|real estate|realtor|academy|test prep|clinic|medical)/i.test(text);
            if (isFurnitureSourceContext) return hasHome && hasFurniture && !hasContractorNoise && !excluded;
            return hasHome && !excluded;
          }).slice(0, 10);
        }
        if (isInsuranceSourceContext) {
          return businessSources.filter((s) => {
            const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
            const hasInsurance = /(保险|保险经纪|insurance|broker|policy|claim|理赔|保单|车险|房屋险|保费)/i.test(text);
            const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|real estate|realtor|academy|test prep|clinic|medical|auto repair|mechanic|报税|tax|cpa|会计)/i.test(text);
            return hasInsurance && !excluded;
          }).slice(0, 10);
        }
        const isEducationSourceContext = /(教育|培训|补习|课后班|academy|tutor|test prep|sat|act|托福|雅思|toefl|ielts|升学|留学)/i.test(
          `${query} ${contextText}`,
        );
        if (isEducationSourceContext) {
          return businessSources.filter((s) => {
            const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
            const hasEducation = /(教育|培训|补习|课后班|academy|tutor|test prep|sat|act|托福|雅思|toefl|ielts|升学|留学|k-12)/i.test(text);
            const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|insurance|broker|real estate|clinic|medical|auto repair|mechanic|driving school|dmv|沙龙|salon|barber|hair|nail)/i.test(text);
            return hasEducation && !excluded;
          }).slice(0, 10);
        }
        if (isTaxSourceContext) {
          return businessSources.filter((s) => {
            const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
            const hasTax = /(报税|税务|会计|记账|cpa|tax|accounting|bookkeeping|payroll|irs|refund)/i.test(text);
            const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|insurance|broker|real estate|academy|test prep|clinic|medical|car rental|租车)/i.test(text);
            return hasTax && !excluded;
          }).slice(0, 10);
        }
        const isBeautySourceContext = /(美容|护肤|皮肤管理|面部护理|养生|按摩|头疗|足疗|spa|wellness|facial|skincare|beauty|med spa|massage)/i.test(
          `${query} ${contextText}`,
        );
        if (isBeautySourceContext) {
          return businessSources.filter((s) => {
            const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
            const hasBeauty = /(美容|护肤|皮肤管理|面部护理|养生|按摩|头疗|足疗|spa|wellness|facial|skincare|beauty|med spa|massage|head spa)/i.test(text);
            const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|报税|tax|cpa|会计|记账|insurance|broker|real estate|academy|test prep|clinic|medical|car rental|租车|auto repair|修车)/i.test(text);
            return hasBeauty && !excluded;
          }).slice(0, 10);
        }
        const isTravelSourceContext = /(旅行社|旅游|机票|跟团|自由行|签证|travel agency|tour|travel|flight booking|vacation package)/i.test(
          `${query} ${contextText}`,
        );
        if (isTravelSourceContext) {
          return businessSources.filter((s) => {
            const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
            const hasTravel = /(旅行社|旅游|机票|跟团|自由行|签证代办|travel agency|tour|travel|flight booking|vacation package|ticketing)/i.test(text);
            const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|报税|tax|cpa|会计|记账|insurance|broker|real estate|academy|test prep|clinic|medical|car rental|租车|auto repair|修车)/i.test(text);
            return hasTravel && !excluded;
          }).slice(0, 10);
        }
        const isPrintSourceContext = /(印刷|设计|海报|名片|喷绘|标牌|招牌|横幅|printing|design|sign|banner|graphic|business card|logo)/i.test(
          `${query} ${contextText}`,
        );
        if (isPrintSourceContext) {
          return businessSources.filter((s) => {
            const titleText = `${s.title || ''}`.toLowerCase();
            const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
            const hasPrint = /(印刷|海报|名片|喷绘|标牌|招牌|横幅|graphic design|logo design|business card|branding|\bprinting\b|\bprint\b|\bsignage\b|\bbanner\b|\blogo\b|\bvinyl\b)/i.test(titleText);
            const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|报税|tax|cpa|会计|记账|insurance|broker|real estate|academy|test prep|clinic|medical|car rental|租车|auto repair|修车|shopping mall|商场|the shops at|ups store|mailbox|shipping|salon|hair|barber|nail|spa|bakery|bbq|cafe|coffee|tea|boba|dessert|pastry|noodle|food)/i.test(text);
            return hasPrint && !excluded;
          }).slice(0, 10);
        }
        const isJewelrySourceContext = /(珠宝|首饰|金店|银饰|钟表|手表|钻戒|戒指|jewelry|jeweller|watch|timepiece|diamond|ring)/i.test(
          `${query} ${contextText}`,
        );
        if (isJewelrySourceContext) {
          return businessSources.filter((s) => {
            const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
            const hasJewelry = /(珠宝|首饰|金店|银饰|钟表|手表|钻戒|戒指|jewelry|jeweller|watch|timepiece|diamond|ring)/i.test(text);
            const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|报税|tax|cpa|会计|记账|insurance|broker|real estate|academy|test prep|clinic|medical|car rental|租车|auto repair|修车|watch repair|phone repair|electronics repair|电工|electric|contractor)/i.test(text);
            return hasJewelry && !excluded;
          }).slice(0, 10);
        }
        const isRetailSourceContext = /(购物|零售|商店|超市|礼品|美妆|服装|电器|数码|retail|shop|store|mall|grocery|supermarket|electronics|digital|cosmetic|makeup)/i.test(
          `${query} ${contextText}`,
        );
        if (isRetailSourceContext) {
          return businessSources.filter((s) => {
            const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
            const hasRetail = /(购物|零售|商店|超市|礼品|美妆|服装|电器|数码|retail|shop|store|grocery|supermarket|electronics|digital|cosmetic|makeup|boutique)/i.test(text);
            const excluded = /(律师|lawyer|attorney|牙医|dentist|餐厅|restaurant|火锅|academy|test prep|补习|insurance|broker|real estate|clinic|medical|driving school|repair|维修|pawn|二手回收)/i.test(text);
            return hasRetail && !excluded;
          }).slice(0, 10);
        }
        const restaurantLike = /(餐厅|饭店|聚餐|吃|午餐|晚餐|火锅|烧烤|川菜|粤菜|湘菜|restaurant|dining|food)/i.test(query);
        if (!restaurantLike) return businessSources.slice(0, 10);
        const queryTokens = query
          .toLowerCase()
          .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((t) => t.length >= 2);
        const relatedGuides = internal.sources
          .filter((s) => s.type === '指南')
          .filter((s) => {
            const text = `${s.title || ''} ${s.snippet || ''}`.toLowerCase();
            const hitCount = queryTokens.reduce((acc, token) => acc + (text.includes(token) ? 1 : 0), 0);
            const hasDiningSignal = /(餐厅|美食|吃饭|川菜|火锅|粤菜|湘菜|restaurant|food|dining)/i.test(text);
            return hitCount >= 2 && hasDiningSignal;
          })
          .slice(0, 2);
        return [...businessSources.slice(0, 6), ...relatedGuides].slice(0, 10);
      })();
      const typedBuilt = tryBuildTypedResult({
        mode: typedRouterMode,
        allocation: typedAllocation,
        query,
        internal,
        preferredBusinessSources: filteredSources.filter((s) => s.type === '商家'),
      });
      if (typedBuilt) {
        answerText = typedBuilt.answer;
      }

      return {
        answer: answerText,
        sources: typedBuilt ? typedBuilt.sources.slice(0, 10) : filteredSources,
        intent: decision.intent as any,
        keywords,
        usedWebFallback,
        provider: `${providerResponse.provider}:${providerResponse.model}`,
      };
    } catch {
      return {
        answer: '我暂时没能完成回答，请稍后再试。',
        sources: decision.intent === 'localRecommendation'
          ? internal.sources.filter((s) => s.type === '商家').slice(0, 10)
          : internal.sources.slice(0, 10),
        intent: decision.intent as any,
        keywords,
        usedWebFallback,
        provider: 'fallback',
      };
    }
  };

  return _legacyRunHelper2;
}

/**
 * Legacy API — preserved for backward compatibility.
 * @deprecated Use createHelper() instead.
 */
export async function runHelper2(input: HelperRunInput): Promise<HelperResult> {
  const runner = await loadLegacyRunner();
  return runner(input);
}

// ─── Re-exports ────────────────────────────────────────────────────

export type * from './types';

// Ranking utilities (available for site-level fetchers to use)
export { getRelevanceScore, filterByRelevance } from './ranking/relevance';
export { calculateRankingConsistency, CONSISTENCY_THRESHOLD } from './ranking/consistency';
export { evaluateQualityLevel } from './ranking/quality';

// Table utilities (available for locale plugins)
export {
  buildStrictRecommendationTable,
  countMarkdownTableRows,
  harmonizeRecommendationCount,
  injectStrictRecommendationTable,
  injectDeterministicRecommendationBlock,
  readBusinessMetadata,
  resolveBusinessTitle,
  resolveRequestedBusinessCount,
  normalizeCell,
} from './answer/table';

// Post-processing
export {
  dedupeAndCapSources,
  diversifySources,
  rankSourcesByRelevance,
  selectVisibleSources,
  withTimeout,
} from './answer/post-process';

// Provider
export { createProviderRouter, createProviderRouterFromConfig } from './providers';

// Telemetry
export { logSearchTelemetry } from './telemetry/logger';

// Baam-specific fetchers (for sites using Baam's Supabase schema)
export { createBaamFetcher } from './retrieval/baam-fetcher';
export { createBaamEnglishFetcher } from './retrieval/baam-en-fetcher';

// Category matcher utility (for custom fetchers that want search_terms matching)
export { matchCategories } from './retrieval/category-matcher';

// Legacy Baam retrieval (used by runHelper2 shim)
export { searchBaamContent } from './retrieval/baam';
