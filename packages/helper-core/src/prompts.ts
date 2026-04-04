import type { HelperIntent, HelperMessage, IntentDecision, RetrievalPayload } from './types';

const RECENT_HINTS = ['今天', '最近', '最新', '刚刚', '本周', '这个月', '当前', '现在', '新闻', '政策', '更新'];
const DISCOVER_HINTS = ['达人', '笔记', '帖子', '探店', '种草', '推荐清单', '发现'];
const GUIDE_HINTS = ['怎么办', '如何', '流程', '步骤', '攻略', '指南', '注意事项'];
const RECOMMEND_HINTS = ['推荐', '哪家', '哪个好', '适合', '最好', '比较'];

export function buildIntentPrompt(query: string, history: HelperMessage[]): string {
  const condensedHistory = history
    .slice(-6)
    .map((message) => `${message.role === 'user' ? '用户' : '助手'}: ${message.content}`)
    .join('\n');

  return `你是一个中文本地智能助手的路由器。请判断用户当前问题属于哪一种模式，并且判断是否需要网页补充。

可选 intent：
- followup
- localRecommendation
- localLookup
- guideMode
- discoverMode
- freshInfo
- broadWeb

规则：
- 如果用户是在继续刚才的话题，比如“再推荐几个”“那地址呢”“为什么”，优先判定为 followup
- 推荐商家、服务、地方、活动时，用 localRecommendation
- 查本地事实、店铺、文章、帖子、活动时，用 localLookup
- 问步骤、办事、生活指导时，用 guideMode
- 问达人、社区内容、笔记、探店内容时，用 discoverMode
- 问最新消息、近期变化、政策更新时，用 freshInfo
- 如果问题明显超出站内数据范围，或需要更广泛常识/外部信息，用 broadWeb

返回严格 JSON：
{"intent":"localLookup","needsWeb":false,"reason":"一句简短中文原因"}

对话历史：
${condensedHistory || '无'}

当前问题：
${query}`;
}

export function buildKeywordPrompt(query: string): string {
  return `你是中文本地智能助手的关键词提取器。请从用户问题中提取 1-5 个最核心的检索关键词。

要求：
- 返回 JSON：{"keywords":["关键词1","关键词2"]}
- 去掉语气词、礼貌词、虚词
- 保留品类词、服务词、症状词、主题词、实体词
- 尽量提炼成更适合搜索的短词
- 可保留中英混合实体

用户问题：
${query}`;
}

export function buildAnswerSystemPrompt(assistantNameZh: string, siteName: string): string {
  return `你是 ${siteName} 的中文本地智能助手「${assistantNameZh}」。

你不是单纯搜索框，而是一个“聊天 + 检索 + 推荐 + 网页补充”的中文助手。

回答要求：
- 全程使用简体中文
- 优先回答用户真正想解决的问题，而不是机械罗列结果
- 你要像一个很懂事的秘书、顾问、朋友，帮用户把信息整理好，而不是把搜索结果原样扔给用户
- 如果有本地商家推荐，要说明推荐理由，并优先给出最值得先看的 3-5 个
- 推荐类回答要尽量结构化，必要时使用 markdown 表格
- 只推荐检索结果里真实出现的商家或内容，不要自己编造店名
- 如果使用了网页信息，要明确说明“我也补充参考了网页信息”
- 如果信息不够确定，要直接说不确定，不要编造
- 适当使用小标题、短段落、项目列表，提高可读性
- 回答风格像一个熟悉纽约本地华人生活的靠谱助手
- 不要把内部思考过程暴露给用户
- 如果问题是推荐类，不要泛泛而谈，要帮用户整理成“先看什么、为什么、怎么选”
- 如果问题是办事类，不要只讲道理，要给出步骤和注意事项`;
}

function buildModeInstructions(intent: HelperIntent): string {
  switch (intent) {
    case 'localRecommendation':
      return `这是推荐类问题。请遵守以下格式：
1. 先用 1-2 句话直接回答，告诉用户你理解的推荐场景
2. 如果有 5 家以上合适商家，优先给出 Top 5；如果不足 5 家，就给出全部可信候选
3. 先给一个 markdown 表格，列建议包含：店名 | 评分 | 评价数 | 电话 | 地址 | 推荐理由
4. 推荐理由要短而具体，像“评分高、评价多、适合家庭聚餐”“口味偏川渝、适合重口味”
5. 然后补一个“我的建议”小节，按场景帮用户筛选，例如“适合家庭聚餐”“适合性价比”“适合口味重”
6. 最后补一个“小贴士”或“下一步建议”，像秘书一样提醒用户订位、避开高峰、先打电话确认
7. 只能推荐商家结果里真实存在的店，不能编造
8. 如果商家结果不足，就明确说“目前站内能确认的推荐有限”
9. 不要把无关行业、无关商家写进推荐结果`;
    case 'guideMode':
      return `这是办事/指南类问题。请优先使用：
1. 结论
2. 具体步骤
3. 注意事项 / 避坑提醒
4. 如有相关商家或内容，再放到最后做补充`;
    case 'discoverMode':
      return `这是社区/发现类问题。请优先整理：
1. 值得看的达人/笔记/讨论
2. 为什么值得看
3. 如果涉及商家，再补充商家建议`;
    case 'freshInfo':
      return `这是新近信息类问题。请优先：
1. 先说最新结论
2. 再说明站内信息和网页补充分别提供了什么
3. 对不确定部分要明确标出来`;
    case 'followup':
      return `这是追问类问题。请自然延续上一轮语境，不要重复大段背景。`;
    default:
      return `请优先给出结论，再补充来源和下一步建议。`;
  }
}

export function buildAnswerUserPrompt(params: {
  query: string;
  intent: HelperIntent;
  history: HelperMessage[];
  internal: RetrievalPayload;
  web: RetrievalPayload;
  usedWebFallback: boolean;
}): string {
  const historyText = params.history
    .slice(-6)
    .map((message) => `${message.role === 'user' ? '用户' : '助手'}: ${message.content}`)
    .join('\n');

  return `用户问题：${params.query}

识别到的模式：${params.intent}
是否用了网页补充：${params.usedWebFallback ? '是' : '否'}

最近对话：
${historyText || '无'}

站内检索结果统计：
${JSON.stringify(params.internal.counts, null, 2)}

站内上下文：
${params.internal.contextBlocks.join('\n\n') || '无'}

网页补充结果统计：
${JSON.stringify(params.web.counts, null, 2)}

网页补充上下文：
${params.web.contextBlocks.join('\n\n') || '无'}

请输出一段直接给用户看的中文答案。

优先级：
1. 先直接回答
2. 再给推荐/下一步
3. 如果有本地来源，尽量利用
4. 如果使用网页补充，要自然说明
5. 如果没有足够信息，就坦诚说明并给出下一步建议

模式补充要求：
${buildModeInstructions(params.intent)}`;
}

export function guessIntentHeuristically(query: string, history: HelperMessage[]): IntentDecision {
  const trimmed = query.trim();
  const shortFollowup = trimmed.length <= 8 && history.length > 0;

  if (shortFollowup && /^(那|再|还有|地址|电话|营业|为什么|需要|行吗|可以吗|谢谢|好的)/.test(trimmed)) {
    return { intent: 'followup', needsWeb: false, reason: '短句延续上下文' };
  }

  if (DISCOVER_HINTS.some((hint) => trimmed.includes(hint))) {
    return { intent: 'discoverMode', needsWeb: false, reason: '偏社区/发现内容' };
  }

  if (GUIDE_HINTS.some((hint) => trimmed.includes(hint))) {
    return { intent: 'guideMode', needsWeb: false, reason: '偏步骤和生活指导' };
  }

  if (RECOMMEND_HINTS.some((hint) => trimmed.includes(hint))) {
    return { intent: 'localRecommendation', needsWeb: false, reason: '偏推荐场景' };
  }

  if (RECENT_HINTS.some((hint) => trimmed.includes(hint))) {
    return { intent: 'freshInfo', needsWeb: true, reason: '明显需要近期信息' };
  }

  return { intent: 'localLookup', needsWeb: false, reason: '默认本地检索' };
}
