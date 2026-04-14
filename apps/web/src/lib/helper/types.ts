/**
 * Chinese Helper Type System — adapted from English Helper
 */

export type AnswerType =
  | 'business-recommendation'  // 商家推荐
  | 'guide'                    // 攻略/指南
  | 'info-lookup'              // 信息查询
  | 'mixed'                    // 混合 (信息+商家)
  | 'community'                // 社区讨论
  | 'news-events'              // 新闻/活动
  | 'follow-up'                // 追问
  | 'no-match'                 // 无匹配
  | 'business-lookup'          // 单个商家查询
  | 'comparison'               // 商家对比
  | 'life-event';              // 生活事件

export interface BusinessResult {
  id: string;
  slug: string;
  display_name: string;
  display_name_zh?: string;
  short_desc_zh?: string;
  short_desc_en?: string;
  avg_rating: number | null;
  review_count: number | null;
  phone: string | null;
  website_url?: string | null;
  address_full: string | null;
  total_score: number;
  ai_tags: string[];
  latitude?: number | null;
  longitude?: number | null;
}

export interface ContentItem {
  title: string;
  slug: string;
  snippet: string;
  boardSlug?: string;
  replyCount?: number;
  likeCount?: number;
}

export interface EventItem {
  title: string;
  slug: string;
  venueName: string;
  startAt: string;
  isFree: boolean;
  ticketPrice?: string | null;
}

export interface RelatedContent {
  guides: ContentItem[];
  forum: ContentItem[];
  discover: ContentItem[];
  news: ContentItem[];
}

export interface AllocationResult {
  type: AnswerType;
  keywords: string[];
  businesses: BusinessResult[];
  matchedCategory: string | null;
  locationFallback: boolean;
  regionLabel: string | null;
  related: RelatedContent;
  singleBusiness: BusinessResult | null;
  comparisonPair: [BusinessResult, BusinessResult] | null;
}

export interface HelperSource {
  type: string;
  title: string;
  url: string;
  snippet?: string;
  isExternal?: boolean;
  metadata?: Record<string, unknown>;
}

// Chinese-specific region mapping (NYC Chinatowns + surrounding areas)
export const REGION_MAP: Record<string, string> = {
  '法拉盛': 'flushing-ny',
  '日落公园': 'sunset-park-ny',
  '华埠': 'manhattan-chinatown-ny',
  '曼哈顿': 'manhattan-chinatown-ny',
  '艾姆赫斯特': 'elmhurst-ny',
  '可乐娜': 'corona-ny',
  '布鲁克林': 'avenue-u-brooklyn-ny',
  '本森赫斯特': 'bensonhurst-ny',
  '皇后区': 'queens-ny',
  '长岛市': 'long-island-city-ny',
  '森林小丘': 'forest-hills-ny',
  'flushing': 'flushing-ny',
  'sunset park': 'sunset-park-ny',
  'chinatown': 'manhattan-chinatown-ny',
  'elmhurst': 'elmhurst-ny',
  'brooklyn': 'avenue-u-brooklyn-ny',
  'queens': 'queens-ny',
};

// Address keywords for region validation (used to filter out mismatched business_locations)
export const REGION_ADDRESS_KEYWORDS: Record<string, string[]> = {
  'flushing-ny': ['flushing', 'bayside', 'whitestone', 'college point', 'ny 11354', 'ny 11355', 'ny 11358', 'ny 11357', 'ny 11360', 'ny 11361'],
  'sunset-park-ny': ['sunset park', 'ny 11220', 'ny 11232'],
  'manhattan-chinatown-ny': ['chinatown', 'canal st', 'mott st', 'bowery', 'ny 10013', 'ny 10002', 'ny 10038'],
  'elmhurst-ny': ['elmhurst', 'ny 11373'],
  'corona-ny': ['corona', 'ny 11368'],
  'avenue-u-brooklyn-ny': ['brooklyn'],
  'bensonhurst-ny': ['bensonhurst', 'ny 11214', 'ny 11204'],
  'queens-ny': ['queens', 'flushing', 'elmhurst', 'corona', 'bayside', 'jackson heights'],
  'long-island-city-ny': ['long island city', 'ny 11101', 'ny 11109'],
  'forest-hills-ny': ['forest hills', 'rego park', 'ny 11375', 'ny 11374'],
};

// Generic words to filter from Chinese queries
export const GENERIC_WORDS = new Set([
  '最好', '推荐', '哪里', '哪家', '什么', '怎么', '如何', '请问', '想问',
  '有没有', '附近', '好的', '不错', '靠谱', '便宜', '最近', '周围',
  '找', '要', '想', '能', '可以', '帮', '问', '看看', '告诉',
  '谢谢', '感谢', '你好', '请', '帮忙', '一下',
  'best', 'good', 'top', 'recommend', 'find', 'near', 'nearby',
  'where', 'what', 'how', 'the', 'are', 'any', 'in', 'can', 'get',
  'please', 'need', 'looking', 'want', 'my', 'for', 'with',
]);
