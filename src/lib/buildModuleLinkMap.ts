import { getAllContent, CONTENT_TYPES } from '@/lib/content';
import type { Language, ContentItem } from '@/lib/content';

export interface ArticleLink {
  url: string;
  title: string;
}

export type ModuleLinkMap = Record<string, ArticleLink | null>;

interface ArticleWithType extends ContentItem {
  contentType: string;
}

// 模块子项字段映射：moduleKey -> { 子项数组字段名, 子项名称字段 }
// 基于 src/locales/en.json 的 modules 结构：
//   - cardChroniclesCodes: items[].code
//   - cardChroniclesBeginnerGuide: items[].heading
//   - cardChroniclesTierList: items[].label
//   - cardChroniclesRollingRarity: items[].system
//   - cardChroniclesTraitsRerolls: items[].name
//   - cardChroniclesUpgradesAbilities: items[].heading
//   - cardChroniclesBestLineup: items[].name
//   - cardChroniclesPotionsChronogems: items[].item
const MODULE_FIELDS: Record<string, { field: string; nameKey: string }> = {
  cardChroniclesCodes: { field: 'items', nameKey: 'code' },
  cardChroniclesBeginnerGuide: { field: 'items', nameKey: 'heading' },
  cardChroniclesTierList: { field: 'items', nameKey: 'label' },
  cardChroniclesRollingRarity: { field: 'items', nameKey: 'system' },
  cardChroniclesTraitsRerolls: { field: 'items', nameKey: 'name' },
  cardChroniclesUpgradesAbilities: { field: 'items', nameKey: 'heading' },
  cardChroniclesBestLineup: { field: 'items', nameKey: 'name' },
  cardChroniclesPotionsChronogems: { field: 'items', nameKey: 'item' },
};

// 每个模块的语义补充关键词，提升模块大标题与 content/ 文章的匹配率
// 关键词来自模块 intro/subtitle、子项名称及游戏专有名词（Trait Rerolls/Luck Potions/Chronogems/Waves 等）
const MODULE_EXTRA_KEYWORDS: Record<string, string[]> = {
  cardChroniclesCodes: ['codes', 'redeem', 'trait rerolls', 'luck potions', 'roll speed potions', 'chronogems', 'reward'],
  cardChroniclesBeginnerGuide: ['beginner guide', 'rolling', 'lineup', 'upgrade', 'progression', 'how to play', 'noob to pro'],
  cardChroniclesTierList: ['tier list', 'best cards', 'rare cards', 'card list', 'rarity', 'ranking', 'limited cards'],
  cardChroniclesRollingRarity: ['rolling', 'rarity', 'rng', 'luck', 'roll speed', 'upgrade', 'abilities'],
  cardChroniclesTraitsRerolls: ['traits', 'rerolls', 'keeper cards', 'trait rerolls', 'trait priority', 'reroll'],
  cardChroniclesUpgradesAbilities: ['upgrades', 'abilities', 'upgrade', 'ability', 'card growth', 'duplicates', 'wave'],
  cardChroniclesBestLineup: ['lineup', 'team builds', 'wave clear', 'boss push', 'reroll build', 'build'],
  cardChroniclesPotionsChronogems: ['potions', 'chronogems', 'luck potion', 'roll speed potion', 'boss potion', 'super luck potion', 'boosts'],
};

// 停用词：游戏名 Card Chronicles 的各单词（连写 + 分写）+ 通用停用词
const FILLER_WORDS = [
  'card', 'chronicles', 'cardchronicles',
  '2026', '2025', 'complete', 'the', 'and', 'for', 'how', 'with',
  'our', 'this', 'your', 'all', 'from', 'learn', 'master',
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSignificantTokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length > 2 && !FILLER_WORDS.includes(w));
}

function matchScore(queryText: string, article: ArticleWithType, extraKeywords?: string[]): number {
  const normalizedQuery = normalize(queryText);
  const normalizedTitle = normalize(article.frontmatter.title);
  const normalizedDesc = normalize(article.frontmatter.description || '');
  const normalizedSlug = article.slug.replace(/-/g, ' ').toLowerCase();

  let score = 0;

  // 标题精确短语匹配（去掉游戏名前缀；兼容 "card chronicles" 分写与 "cardchronicles" 连写）
  const strippedQuery = normalizedQuery.replace(/(card\s*chronicles|cardchronicles)\s*/g, '').trim();
  const strippedTitle = normalizedTitle.replace(/(card\s*chronicles|cardchronicles)\s*/g, '').trim();
  if (strippedQuery.length > 3 && strippedTitle.includes(strippedQuery)) {
    score += 100;
  }

  // query 文本的有效 token 与文章标题/描述/slug 重叠计分
  const queryTokens = getSignificantTokens(queryText);
  for (const token of queryTokens) {
    if (normalizedTitle.includes(token)) score += 20;
    if (normalizedDesc.includes(token)) score += 5;
    if (normalizedSlug.includes(token)) score += 15;
  }

  // 模块大标题的补充关键词计分
  if (extraKeywords) {
    for (const kw of extraKeywords) {
      const normalizedKw = normalize(kw);
      if (normalizedTitle.includes(normalizedKw)) score += 15;
      if (normalizedDesc.includes(normalizedKw)) score += 5;
      if (normalizedSlug.includes(normalizedKw)) score += 10;
    }
  }

  return score;
}

function findBestMatch(
  queryText: string,
  articles: ArticleWithType[],
  extraKeywords?: string[],
  threshold = 20,
): ArticleLink | null {
  let bestScore = 0;
  let bestArticle: ArticleWithType | null = null;

  for (const article of articles) {
    const score = matchScore(queryText, article, extraKeywords);
    if (score > bestScore) {
      bestScore = score;
      bestArticle = article;
    }
  }

  if (bestScore >= threshold && bestArticle) {
    return {
      url: `/${bestArticle.contentType}/${bestArticle.slug}`,
      title: bestArticle.frontmatter.title,
    };
  }

  return null;
}

export async function buildModuleLinkMap(locale: Language): Promise<ModuleLinkMap> {
  // 1. 跨所有内容类型加载全部文章
  const allArticles: ArticleWithType[] = [];
  for (const contentType of CONTENT_TYPES) {
    const items = await getAllContent(contentType, locale);
    for (const item of items) {
      allArticles.push({ ...item, contentType });
    }
  }

  // 2. 从 en.json 读取模块数据（用英文做关键词匹配）
  const enMessages = (await import('../locales/en.json')).default as any;

  const linkMap: ModuleLinkMap = {};

  // 3. 为每个模块匹配 h2 大标题和子项
  for (const [moduleKey, fieldConfig] of Object.entries(MODULE_FIELDS)) {
    const moduleData = enMessages.modules?.[moduleKey];
    if (!moduleData) continue;

    // 匹配模块 h2 大标题（用补充关键词 + 更低阈值以扩大覆盖）
    const moduleTitle = moduleData.title as string;
    if (moduleTitle) {
      const extraKw = MODULE_EXTRA_KEYWORDS[moduleKey] || [];
      linkMap[moduleKey] = findBestMatch(moduleTitle, allArticles, extraKw, 15);
    }

    // 匹配子项
    const subItems = moduleData[fieldConfig.field] as any[];
    if (Array.isArray(subItems)) {
      for (let i = 0; i < subItems.length; i++) {
        const itemName = subItems[i]?.[fieldConfig.nameKey] as string;
        if (itemName) {
          const key = `${moduleKey}::${fieldConfig.field}::${i}`;
          linkMap[key] = findBestMatch(itemName, allArticles);
        }
      }
    }
  }

  return linkMap;
}
