'use server';

import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any;
const reval = () => revalidatePath('/admin/settings');
const CONTENT_CATEGORY_TABLES = new Set([
  'categories_guide',
  'categories_news',
  'categories_forum',
  'categories_discover',
]);

function resolveContentTable(tableName: string): string | null {
  const normalized = (tableName || '').trim();
  return CONTENT_CATEGORY_TABLES.has(normalized) ? normalized : null;
}

// ============================================================
// CATEGORY CRUD
// ============================================================

export async function addCategory(formData: FormData) {
  const slug = (formData.get('slug') as string)?.trim();
  const name_en = (formData.get('name_en') as string)?.trim();
  const name_zh = (formData.get('name_zh') as string)?.trim();
  const icon = (formData.get('icon') as string)?.trim();
  const parent_id = (formData.get('parent_id') as string) || null;
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);
  if (!slug || !name_en) return { error: 'Slug and English name are required' };

  const searchTermsRaw = formData.get('search_terms') as string;
  const search_terms = searchTermsRaw ? JSON.parse(searchTermsRaw) : [];

  const { error } = await db().from('categories').insert({
    slug,
    name_en,
    name_zh: name_zh || null,
    type: 'business',
    parent_id: parent_id || null,
    icon: icon || null,
    sort_order: isNaN(sort_order) ? 0 : sort_order,
    search_terms,
    site_scope: 'zh',
  });
  if (error) return { error: error.message };
  reval();
  return { success: true };
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const slug = (formData.get('slug') as string)?.trim();
  const name_en = (formData.get('name_en') as string)?.trim();
  const name_zh = (formData.get('name_zh') as string)?.trim();
  const icon = (formData.get('icon') as string)?.trim();
  const parent_id = (formData.get('parent_id') as string) || null;
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);
  if (!name_en) return { error: 'English name is required' };

  const searchTermsRaw = formData.get('search_terms') as string;
  const search_terms = searchTermsRaw ? JSON.parse(searchTermsRaw) : [];

  const updates: Record<string, unknown> = {
    name_en,
    name_zh: name_zh || null,
    icon: icon || null,
    parent_id: parent_id || null,
    sort_order: isNaN(sort_order) ? 0 : sort_order,
    search_terms,
  };
  if (slug) updates.slug = slug;

  const { error } = await db().from('categories').update(updates).eq('id', categoryId);
  if (error) return { error: error.message };
  reval();
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  // Delete children first (if any), then the category itself
  await db().from('categories').delete().eq('parent_id', categoryId);
  const { error } = await db().from('categories').delete().eq('id', categoryId);
  if (error) return { error: error.message };
  reval();
  return { success: true };
}

// ============================================================
// LIGHTWEIGHT CATEGORY UPDATE (for non-business tables)
// ============================================================

export async function updateCategoryBasic(categoryId: string, formData: FormData) {
  const requestedTable = (formData.get('table_name') as string) || '';
  const tableName = resolveContentTable(requestedTable);
  const slug = (formData.get('slug') as string)?.trim();
  const name_en = (formData.get('name_en') as string)?.trim();
  const name_zh = (formData.get('name_zh') as string)?.trim();
  const icon = (formData.get('icon') as string)?.trim();
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);
  const is_active = (formData.get('is_active') as string) === 'true';

  if (!slug || !name_en) {
    return { error: 'Slug and English name are required' };
  }
  if (!tableName) return { error: 'Invalid category table' };

  const updates: Record<string, unknown> = {
    slug,
    name_en,
    name_zh: name_zh || null,
    icon: icon || null,
    sort_order: isNaN(sort_order) ? 0 : sort_order,
    is_active,
  };
  if (tableName) {
    const site_scope = ((formData.get('site_scope') as string) || '').trim().toLowerCase();
    if (site_scope === 'zh' || site_scope === 'en') {
      updates.site_scope = site_scope;
    }
  }

  const { error } = await db()
    .from(tableName)
    .update({
      ...updates,
    })
    .eq('id', categoryId);
  if (error) return { error: error.message };
  reval();
  return { success: true };
}

export async function addCategoryBasic(formData: FormData) {
  const requestedTable = (formData.get('table_name') as string) || '';
  const tableName = resolveContentTable(requestedTable);
  const slug = (formData.get('slug') as string)?.trim();
  const name_en = (formData.get('name_en') as string)?.trim();
  const name_zh = (formData.get('name_zh') as string)?.trim();
  const icon = (formData.get('icon') as string)?.trim();
  const sort_order = parseInt((formData.get('sort_order') as string) || '0', 10);
  const is_active = (formData.get('is_active') as string) !== 'false';
  const site_scope = ((formData.get('site_scope') as string) || '').trim().toLowerCase();

  if (!slug || !name_en) {
    return { error: 'Slug and English name are required' };
  }
  if (!tableName) return { error: 'Invalid category table' };

  const payload: Record<string, unknown> = {
    slug,
    name_en,
    name_zh: name_zh || null,
    icon: icon || null,
    sort_order: isNaN(sort_order) ? 0 : sort_order,
    is_active,
  };
  payload.site_scope = site_scope === 'en' ? 'en' : 'zh';

  const { error } = await db()
    .from(tableName)
    .insert({
      ...payload,
    });
  if (error) return { error: error.message };
  reval();
  return { success: true };
}

export async function deleteCategoryBasic(categoryId: string, formData: FormData) {
  const requestedTable = (formData.get('table_name') as string) || '';
  const tableName = resolveContentTable(requestedTable);
  if (!tableName) return { error: 'Invalid category table' };
  const { error } = await db()
    .from(tableName)
    .delete()
    .eq('id', categoryId);
  if (error) return { error: error.message };
  reval();
  return { success: true };
}

// ============================================================
// THEME EDITOR (theme.ts -> baamTheme)
// ============================================================

const THEME_DECLARATION = 'export const baamTheme: BaamTheme =';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateThemeShape(theme: unknown): { ok: boolean; error?: string } {
  if (!isRecord(theme)) return { ok: false, error: 'Theme must be a JSON object.' };
  const requiredTopLevel = ['colors', 'typography', 'shape', 'layout'];
  for (const key of requiredTopLevel) {
    if (!isRecord(theme[key])) {
      return { ok: false, error: `Missing required object: ${key}` };
    }
  }
  return { ok: true };
}

function normalizeThemeForSave(theme: unknown): unknown {
  if (!isRecord(theme)) return theme;

  const next = JSON.parse(JSON.stringify(theme)) as Record<string, unknown>;
  if (!isRecord(next.typography)) next.typography = {};
  const typography = next.typography as Record<string, unknown>;
  const existingWeights = isRecord(typography.weights) ? (typography.weights as Record<string, unknown>) : {};

  typography.weights = {
    regular: String(existingWeights.regular ?? '400'),
    medium: String(existingWeights.medium ?? '500'),
    semibold: String(existingWeights.semibold ?? '600'),
    bold: String(existingWeights.bold ?? '700'),
  };
  if (!isRecord(next.shape)) next.shape = {};
  const shape = next.shape as Record<string, unknown>;
  shape.radiusCard = String(shape.radiusCard ?? shape.radiusXl ?? '16px');
  shape.radiusButton = String(shape.radiusButton ?? shape.radiusLg ?? '12px');
  shape.radiusChip = String(shape.radiusChip ?? shape.radiusFull ?? '9999px');
  shape.radiusInput = String(shape.radiusInput ?? shape.radiusLg ?? '12px');

  return next;
}

function formatTsKey(key: string): string {
  return /^[$A-Z_][0-9A-Z_$]*$/i.test(key) ? key : JSON.stringify(key);
}

function renderTsValue(value: unknown, indentLevel = 0): string {
  const indent = '  '.repeat(indentLevel);
  const nextIndent = '  '.repeat(indentLevel + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const rendered = value.map((item) => `${nextIndent}${renderTsValue(item, indentLevel + 1)}`).join(',\n');
    return `[\n${rendered}\n${indent}]`;
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const rendered = entries
      .map(([key, val]) => `${nextIndent}${formatTsKey(key)}: ${renderTsValue(val, indentLevel + 1)}`)
      .join(',\n');
    return `{\n${rendered}\n${indent}}`;
  }

  return JSON.stringify(value);
}

function findThemeObjectRange(source: string): { declarationStart: number; objectStart: number; objectEnd: number; statementEnd: number } {
  const declarationStart = source.indexOf(THEME_DECLARATION);
  if (declarationStart < 0) throw new Error('Could not find baamTheme declaration in theme.ts');

  const objectStart = source.indexOf('{', declarationStart);
  if (objectStart < 0) throw new Error('Could not find opening brace for baamTheme');

  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;
  let objectEnd = -1;

  for (let i = objectStart; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (inSingle) {
      if (ch === "'" && !escaped) inSingle = false;
      escaped = ch === '\\' && !escaped;
      continue;
    }
    if (inDouble) {
      if (ch === '"' && !escaped) inDouble = false;
      escaped = ch === '\\' && !escaped;
      continue;
    }
    if (inTemplate) {
      if (ch === '`' && !escaped) inTemplate = false;
      escaped = ch === '\\' && !escaped;
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      escaped = false;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      escaped = false;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      escaped = false;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        objectEnd = i;
        break;
      }
      continue;
    }
  }

  if (objectEnd < 0) throw new Error('Could not locate closing brace for baamTheme object');

  const statementEnd = source.indexOf(';', objectEnd);
  if (statementEnd < 0) throw new Error('Could not locate statement terminator for baamTheme');

  return { declarationStart, objectStart, objectEnd, statementEnd };
}

export async function saveThemeConfig(formData: FormData) {
  await requireAdmin();

  const themeJsonText = String(formData.get('theme_json') || '').trim();
  if (!themeJsonText) return { error: 'Theme JSON is required.' };

  let parsedTheme: unknown;
  try {
    parsedTheme = JSON.parse(themeJsonText);
  } catch {
    return { error: 'Invalid JSON. Please fix JSON syntax and try again.' };
  }

  const shapeCheck = validateThemeShape(parsedTheme);
  if (!shapeCheck.ok) return { error: shapeCheck.error || 'Invalid theme schema.' };
  parsedTheme = normalizeThemeForSave(parsedTheme);

  const candidatePaths = [
    path.join(process.cwd(), 'src/lib/theme.ts'),
    path.join(process.cwd(), 'apps/web/src/lib/theme.ts'),
  ];
  let filePath = '';
  for (const p of candidatePaths) {
    try {
      await access(p);
      filePath = p;
      break;
    } catch {
      // try next path
    }
  }
  if (!filePath) {
    return { error: 'Cannot locate theme.ts file. Checked src/lib/theme.ts and apps/web/src/lib/theme.ts.' };
  }

  const source = await readFile(filePath, 'utf-8');
  const range = findThemeObjectRange(source);
  const renderedTheme = renderTsValue(parsedTheme, 0);
  const replacement = `${THEME_DECLARATION} ${renderedTheme};`;
  const nextSource = `${source.slice(0, range.declarationStart)}${replacement}${source.slice(range.statementEnd + 1)}`;

  await writeFile(filePath, nextSource, 'utf-8');

  revalidatePath('/admin/settings');
  revalidatePath('/zh');
  revalidatePath('/en');

  return { success: true, message: 'Theme saved to src/lib/theme.ts' };
}
