'use client';

import { useState } from 'react';
import { saveThemeConfig, saveEditorialThemeConfig } from './actions';

interface ThemeEditorProps {
  initialThemeJson: string;
  targetFile: string;
  /** 'editorial' to save to editorialTheme, default saves to baamTheme */
  saveAction?: 'editorial' | 'base';
}

type ThemeTab = 'presets' | 'form' | 'json';
type ThemeObject = Record<string, unknown>;
type ThemePresetPatch = { path: string[]; value: unknown };

interface ThemePreset {
  id: string;
  group: string;
  name: string;
  description: string;
  swatches: string[];
  tags: string[];
  patch: ThemePresetPatch[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeTheme(theme: ThemeObject, isEditorial = false): ThemeObject {
  const next = cloneTheme(theme);
  // Only add baamTheme-specific defaults for non-editorial themes
  if (!isEditorial) {
    if (!isRecord(next.typography)) next.typography = {};
    const typography = next.typography as Record<string, unknown>;
    const weights = isRecord(typography.weights) ? (typography.weights as Record<string, unknown>) : {};
    typography.weights = {
      regular: String(weights.regular ?? '400'),
      medium: String(weights.medium ?? '500'),
      semibold: String(weights.semibold ?? '600'),
      bold: String(weights.bold ?? '700'),
    };
    if (!isRecord(next.shape)) next.shape = {};
    const shape = next.shape as Record<string, unknown>;
    shape.radiusCard = String(shape.radiusCard ?? shape.radiusXl ?? '16px');
    shape.radiusButton = String(shape.radiusButton ?? shape.radiusLg ?? '12px');
    shape.radiusChip = String(shape.radiusChip ?? shape.radiusFull ?? '9999px');
    shape.radiusInput = String(shape.radiusInput ?? shape.radiusLg ?? '12px');
  }
  return next;
}

function safeParseTheme(input: string, isEditorial = false): { value: ThemeObject; error: string } {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!isRecord(parsed)) return { value: {}, error: 'Theme JSON 必须是对象。' };
    return { value: normalizeTheme(parsed, isEditorial), error: '' };
  } catch {
    return { value: {}, error: 'JSON 格式有误。' };
  }
}

function cloneTheme(input: ThemeObject): ThemeObject {
  return JSON.parse(JSON.stringify(input)) as ThemeObject;
}

function getPathValue(root: ThemeObject, path: string[]): unknown {
  let cursor: unknown = root;
  for (const key of path) {
    if (!isRecord(cursor)) return '';
    cursor = cursor[key];
  }
  return cursor ?? '';
}

function setPathValue(root: ThemeObject, path: string[], value: unknown): ThemeObject {
  const next = cloneTheme(root);
  let cursor: Record<string, unknown> = next;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    const child = cursor[key];
    if (!isRecord(child)) cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = value;
  return next;
}

function normalizeHex(value: string): string {
  const raw = String(value || '').trim();
  // Try to extract hex from various formats
  const hexMatch = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hexMatch) {
    // Try to parse rgba/rgb into hex
    const rgbaMatch = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbaMatch) {
      const r = Math.min(255, parseInt(rgbaMatch[1]));
      const g = Math.min(255, parseInt(rgbaMatch[2]));
      const b = Math.min(255, parseInt(rgbaMatch[3]));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return '#888888'; // neutral gray fallback instead of black
  }
  const match = hexMatch;
  if (match[1].length === 3) {
    const [r, g, b] = match[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return raw.toLowerCase();
}

const PRESET_GROUP_ORDER = [
  'BAAM DEFAULT',
  'CLEAN & MODERN',
  'WARM & LOCAL',
  'LUXURY',
] as const;

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'editorial-default',
    group: 'BAAM DEFAULT',
    name: '暖纸 Editorial',
    description: '当前默认 — 暖黄纸底、红色强调、杂志风格',
    swatches: ['#C73E1D', '#D4A017', '#FBF6EC'],
    tags: ['warm paper', 'serif', 'magazine'],
    patch: [
      { path: ['colors', 'paper'], value: '#FBF6EC' },
      { path: ['colors', 'paperWarm'], value: '#F5EDD8' },
      { path: ['colors', 'surface'], value: '#FFFDF8' },
      { path: ['colors', 'ink'], value: '#1F1B16' },
      { path: ['colors', 'inkSoft'], value: '#4A4236' },
      { path: ['colors', 'inkMuted'], value: '#8C8478' },
      { path: ['colors', 'line'], value: 'rgba(31, 27, 22, 0.08)' },
      { path: ['colors', 'lineStrong'], value: 'rgba(31, 27, 22, 0.16)' },
      { path: ['colors', 'accent'], value: '#C73E1D' },
      { path: ['colors', 'accentSoft'], value: '#E56342' },
      { path: ['colors', 'amber'], value: '#D4A017' },
      { path: ['colors', 'amberSoft'], value: '#E8B84A' },
      { path: ['shape', 'radiusMd'], value: '14px' },
      { path: ['shape', 'radiusLg'], value: '20px' },
      { path: ['shape', 'radiusXl'], value: '28px' },
    ],
  },
  {
    id: 'cool-slate',
    group: 'CLEAN & MODERN',
    name: 'Cool Slate',
    description: '冷色调灰白底，蓝色强调，现代简洁风格',
    swatches: ['#2563EB', '#0891B2', '#F8FAFC'],
    tags: ['cool', 'modern', 'blue accent'],
    patch: [
      { path: ['colors', 'paper'], value: '#F8FAFC' },
      { path: ['colors', 'paperWarm'], value: '#EFF6FF' },
      { path: ['colors', 'surface'], value: '#FFFFFF' },
      { path: ['colors', 'ink'], value: '#0F172A' },
      { path: ['colors', 'inkSoft'], value: '#334155' },
      { path: ['colors', 'inkMuted'], value: '#94A3B8' },
      { path: ['colors', 'line'], value: 'rgba(15, 23, 42, 0.06)' },
      { path: ['colors', 'lineStrong'], value: 'rgba(15, 23, 42, 0.12)' },
      { path: ['colors', 'accent'], value: '#2563EB' },
      { path: ['colors', 'accentSoft'], value: '#3B82F6' },
      { path: ['colors', 'amber'], value: '#0891B2' },
      { path: ['colors', 'amberSoft'], value: '#06B6D4' },
      { path: ['shape', 'radiusMd'], value: '10px' },
      { path: ['shape', 'radiusLg'], value: '16px' },
      { path: ['shape', 'radiusXl'], value: '24px' },
    ],
  },
  {
    id: 'forest-green',
    group: 'WARM & LOCAL',
    name: 'Forest Green',
    description: '森林绿自然风 — 浅米色底，绿色强调',
    swatches: ['#166534', '#D4A017', '#FAFAF5'],
    tags: ['earthy', 'green', 'natural'],
    patch: [
      { path: ['colors', 'paper'], value: '#FAFAF5' },
      { path: ['colors', 'paperWarm'], value: '#F0EDE0' },
      { path: ['colors', 'surface'], value: '#FDFDFB' },
      { path: ['colors', 'ink'], value: '#1A2E1A' },
      { path: ['colors', 'inkSoft'], value: '#3D5A3D' },
      { path: ['colors', 'inkMuted'], value: '#7A9A7A' },
      { path: ['colors', 'line'], value: 'rgba(26, 46, 26, 0.08)' },
      { path: ['colors', 'lineStrong'], value: 'rgba(26, 46, 26, 0.16)' },
      { path: ['colors', 'accent'], value: '#166534' },
      { path: ['colors', 'accentSoft'], value: '#22863A' },
      { path: ['colors', 'amber'], value: '#B8860B' },
      { path: ['colors', 'amberSoft'], value: '#DAA520' },
    ],
  },
  {
    id: 'burgundy-luxury',
    group: 'LUXURY',
    name: 'Burgundy Luxury',
    description: '酒红金色 — 高端奢华感，深色系强调',
    swatches: ['#7F1D1D', '#B8860B', '#FDF8F0'],
    tags: ['luxury', 'burgundy', 'gold'],
    patch: [
      { path: ['colors', 'paper'], value: '#FDF8F0' },
      { path: ['colors', 'paperWarm'], value: '#F5EDE0' },
      { path: ['colors', 'surface'], value: '#FFFCF8' },
      { path: ['colors', 'ink'], value: '#2D1B1B' },
      { path: ['colors', 'inkSoft'], value: '#5A3A3A' },
      { path: ['colors', 'inkMuted'], value: '#9A7A7A' },
      { path: ['colors', 'line'], value: 'rgba(45, 27, 27, 0.08)' },
      { path: ['colors', 'lineStrong'], value: 'rgba(45, 27, 27, 0.16)' },
      { path: ['colors', 'accent'], value: '#7F1D1D' },
      { path: ['colors', 'accentSoft'], value: '#991B1B' },
      { path: ['colors', 'amber'], value: '#B8860B' },
      { path: ['colors', 'amberSoft'], value: '#DAA520' },
    ],
  },
  {
    id: 'navy-professional',
    group: 'LUXURY',
    name: 'Navy Professional',
    description: '深蓝专业风 — 信任感强，适合商务',
    swatches: ['#1E3A8A', '#C73E1D', '#F8FAFC'],
    tags: ['navy', 'professional', 'trust'],
    patch: [
      { path: ['colors', 'paper'], value: '#F8FAFC' },
      { path: ['colors', 'paperWarm'], value: '#E8EEF8' },
      { path: ['colors', 'surface'], value: '#FAFBFD' },
      { path: ['colors', 'ink'], value: '#0F172A' },
      { path: ['colors', 'inkSoft'], value: '#1E3A5F' },
      { path: ['colors', 'inkMuted'], value: '#6B8AB0' },
      { path: ['colors', 'line'], value: 'rgba(15, 23, 42, 0.08)' },
      { path: ['colors', 'lineStrong'], value: 'rgba(15, 23, 42, 0.14)' },
      { path: ['colors', 'accent'], value: '#1E3A8A' },
      { path: ['colors', 'accentSoft'], value: '#2563EB' },
      { path: ['colors', 'amber'], value: '#C73E1D' },
      { path: ['colors', 'amberSoft'], value: '#E56342' },
    ],
  },
  {
    id: 'terracotta-warm',
    group: 'WARM & LOCAL',
    name: 'Terracotta Warm',
    description: '陶土暖色调 — 温馨社区感，橙棕强调',
    swatches: ['#B45309', '#7C3AED', '#FFF8F0'],
    tags: ['warm', 'terracotta', 'community'],
    patch: [
      { path: ['colors', 'paper'], value: '#FFF8F0' },
      { path: ['colors', 'paperWarm'], value: '#F5E8D8' },
      { path: ['colors', 'surface'], value: '#FFFCF8' },
      { path: ['colors', 'ink'], value: '#2D1F0E' },
      { path: ['colors', 'inkSoft'], value: '#5A4230' },
      { path: ['colors', 'inkMuted'], value: '#9A8670' },
      { path: ['colors', 'line'], value: 'rgba(45, 31, 14, 0.08)' },
      { path: ['colors', 'lineStrong'], value: 'rgba(45, 31, 14, 0.16)' },
      { path: ['colors', 'accent'], value: '#B45309' },
      { path: ['colors', 'accentSoft'], value: '#D97706' },
      { path: ['colors', 'amber'], value: '#7C3AED' },
      { path: ['colors', 'amberSoft'], value: '#8B5CF6' },
    ],
  },
  {
    id: 'fresh-ocean',
    group: 'CLEAN & MODERN',
    name: 'Fresh Ocean',
    description: '海洋清新 — 浅蓝白底，活力橙点缀',
    swatches: ['#0284C7', '#EA580C', '#F0F9FF'],
    tags: ['fresh', 'ocean', 'clean'],
    patch: [
      { path: ['colors', 'paper'], value: '#F0F9FF' },
      { path: ['colors', 'paperWarm'], value: '#E0F2FE' },
      { path: ['colors', 'surface'], value: '#F8FCFF' },
      { path: ['colors', 'ink'], value: '#0C1E2E' },
      { path: ['colors', 'inkSoft'], value: '#1E4060' },
      { path: ['colors', 'inkMuted'], value: '#6B9AB8' },
      { path: ['colors', 'line'], value: 'rgba(12, 30, 46, 0.06)' },
      { path: ['colors', 'lineStrong'], value: 'rgba(12, 30, 46, 0.12)' },
      { path: ['colors', 'accent'], value: '#0284C7' },
      { path: ['colors', 'accentSoft'], value: '#0EA5E9' },
      { path: ['colors', 'amber'], value: '#EA580C' },
      { path: ['colors', 'amberSoft'], value: '#F97316' },
      { path: ['shape', 'radiusMd'], value: '12px' },
      { path: ['shape', 'radiusLg'], value: '18px' },
    ],
  },
];

function applyPreset(base: ThemeObject, presetId: string): ThemeObject {
  const preset = THEME_PRESETS.find((item) => item.id === presetId);
  const next = cloneTheme(base);
  if (!preset) return next;

  let patched = next;
  for (const item of preset.patch) {
    patched = setPathValue(patched, item.path, item.value);
  }
  return patched;
}

export function ThemeEditor({ initialThemeJson, targetFile, saveAction = 'base' }: ThemeEditorProps) {
  const isEditorial = saveAction === 'editorial';
  const parsedInitial = safeParseTheme(initialThemeJson, isEditorial);
  const [activeTab, setActiveTab] = useState<ThemeTab>('form');
  const [themeJson, setThemeJson] = useState(initialThemeJson);
  const [formData, setFormData] = useState<ThemeObject>(parsedInitial.value);
  const [jsonError, setJsonError] = useState(parsedInitial.error);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activePresetId, setActivePresetId] = useState('baam-default');

  const handleReset = () => {
    const parsed = safeParseTheme(initialThemeJson);
    setThemeJson(initialThemeJson);
    setFormData(parsed.value);
    setJsonError(parsed.error);
    setError('');
    setSuccess('');
    setActivePresetId('baam-default');
  };

  const updateFormValue = (path: string[], value: unknown) => {
    const next = setPathValue(formData, path, value);
    setFormData(next);
    setThemeJson(JSON.stringify(next, null, 2));
    setJsonError('');
    setError('');
  };

  const handleJsonChange = (nextText: string) => {
    setThemeJson(nextText);
    const parsed = safeParseTheme(nextText);
    if (parsed.error) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError('');
    setFormData(parsed.value);
  };

  const handleFormat = () => {
    const parsed = safeParseTheme(themeJson);
    if (parsed.error) {
      setError('JSON 格式有误，无法自动格式化。');
      return;
    }
    const formatted = JSON.stringify(parsed.value, null, 2);
    setThemeJson(formatted);
    setFormData(parsed.value);
    setJsonError('');
    setError('');
  };

  const handleApplyPreset = (presetId: string) => {
    const base = safeParseTheme(initialThemeJson).value;
    const next = applyPreset(base, presetId);
    const preset = THEME_PRESETS.find((item) => item.id === presetId);
    setFormData(next);
    setThemeJson(JSON.stringify(next, null, 2));
    setJsonError('');
    setError('');
    setActivePresetId(presetId);
    setSuccess(`已应用 ${preset?.name || presetId} preset（未保存）`);
    setActiveTab('form');
  };

  const handleSave = async () => {
    if (jsonError) {
      setError('请先修复 JSON 格式错误后再保存。');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const fd = new FormData();
      fd.set('theme_json', themeJson);
      const saveFn = saveAction === 'editorial' ? saveEditorialThemeConfig : saveThemeConfig;
      const result = await saveFn(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(result?.message || '保存成功');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const renderTextField = (label: string, path: string[]) => {
    const raw = String(getPathValue(formData, path) || '');
    return (
      <div>
        <label className="block text-xs text-gray-500">{label}</label>
        <input
          value={raw}
          onChange={(event) => updateFormValue(path, event.target.value)}
          className="mt-1 w-full h-9 r-base border border-gray-200 px-3 text-sm"
        />
      </div>
    );
  };

  const renderColorField = (label: string, path: string[]) => {
    const raw = String(getPathValue(formData, path) || '');
    const color = normalizeHex(raw);
    return (
      <div>
        <label className="block text-xs text-gray-500">{label}</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            value={raw}
            onChange={(event) => updateFormValue(path, event.target.value)}
            className="h-9 flex-1 r-base border border-gray-200 px-3 text-sm"
            placeholder="#f97316"
          />
          <input
            type="color"
            value={color}
            onChange={(event) => updateFormValue(path, event.target.value)}
            className="h-9 w-11 rounded border border-gray-200 bg-white p-1"
            aria-label={`${label} color`}
          />
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">主题配置（Theme）</h2>
          <p className="text-sm text-text-muted">
            通过 JSON 编辑 `colors / typography / shape / layout`，保存后将写入
            {' '}
            <span className="font-mono text-xs bg-bg-page px-1.5 py-0.5 rounded">{targetFile}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className="h-9 px-3 border border-border text-sm r-base hover:bg-bg-page"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleFormat}
            className="h-9 px-3 border border-border text-sm r-base hover:bg-bg-page"
          >
            格式化 JSON
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="h-9 px-3 border border-border text-sm r-base hover:bg-bg-page"
          >
            重置
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 bg-primary text-white text-sm font-medium r-base hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? '保存中...' : '保存 Theme'}
          </button>
        </div>
      </div>

      {error && (
        <div className="r-base border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="r-base border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          {([
            { key: 'presets', label: 'Presets' },
            { key: 'form', label: 'Form' },
            { key: 'json', label: 'JSON' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`h-8 px-3 r-base text-sm border transition-colors ${
                activeTab === tab.key
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-text-secondary hover:text-text-primary hover:bg-bg-page'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'presets' && (
          <div className="space-y-5">
            <p className="text-xs text-text-muted">
              应用预设会覆盖当前主题的部分 token，保存后生效。你也可以先在 Form 或 JSON 里微调。
            </p>
            {PRESET_GROUP_ORDER.map((group) => {
              const presets = THEME_PRESETS.filter((item) => item.group === group);
              if (presets.length === 0) return null;
              return (
                <div key={group} className="space-y-2">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{group}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className={`r-lg border p-4 ${
                          activePresetId === preset.id ? 'border-primary bg-primary/5' : 'border-border bg-bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {preset.swatches.slice(0, 3).map((swatch) => (
                            <span
                              key={`${preset.id}-${swatch}`}
                              className="inline-block h-4 w-4 r-full border border-gray-200"
                              style={{ backgroundColor: swatch }}
                            />
                          ))}
                        </div>
                        <div className="font-semibold text-sm">{preset.name}</div>
                        <p className="text-xs text-text-muted mt-1">{preset.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {preset.tags.map((tag) => (
                            <span key={`${preset.id}-${tag}`} className="text-[11px] px-2 py-0.5 r-full bg-bg-page text-text-secondary">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(preset.id)}
                          className="mt-3 text-sm text-secondary hover:text-secondary-dark underline"
                        >
                          Apply Preset
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'form' && saveAction === 'editorial' && (
          <div className="space-y-6">
            <div className="text-xs font-semibold text-gray-500 uppercase">Editorial Theme</div>

            {/* Colors */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Background / Surface</div>
                {renderColorField('Paper (背景)', ['colors', 'paper'])}
                {renderColorField('Paper Warm', ['colors', 'paperWarm'])}
                {renderColorField('Surface', ['colors', 'surface'])}
                {renderColorField('Surface Elev (卡片)', ['colors', 'surfaceElev'])}
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Ink / Text</div>
                {renderColorField('Ink (主文字)', ['colors', 'ink'])}
                {renderColorField('Ink Soft (副文字)', ['colors', 'inkSoft'])}
                {renderColorField('Ink Muted (弱文字)', ['colors', 'inkMuted'])}
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Accent / Brand</div>
                {renderColorField('Accent (强调色)', ['colors', 'accent'])}
                {renderColorField('Accent Soft', ['colors', 'accentSoft'])}
                {renderColorField('Amber (金色)', ['colors', 'amber'])}
                {renderColorField('Amber Soft', ['colors', 'amberSoft'])}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Line / Border</div>
                {renderTextField('Line (细边框)', ['colors', 'line'])}
                {renderTextField('Line Strong (粗边框)', ['colors', 'lineStrong'])}
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Tag Colors — Green</div>
                {renderColorField('Tag Green BG', ['colors', 'tagGreenBg'])}
                {renderColorField('Tag Green Text', ['colors', 'tagGreenText'])}
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Tag Colors — Purple</div>
                {renderColorField('Tag Purple BG', ['colors', 'tagPurpleBg'])}
                {renderColorField('Tag Purple Text', ['colors', 'tagPurpleText'])}
              </div>
            </div>

            {/* Typography */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Typography — Fonts</div>
                {renderTextField('Serif Font (标题)', ['typography', 'fontSerif'])}
                {renderTextField('Serif Italic (英文)', ['typography', 'fontSerifItalic'])}
                {renderTextField('Sans Font (正文)', ['typography', 'fontSans'])}
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Typography — Sizes</div>
                {renderTextField('Page Title', ['typography', 'sizePageTitle'])}
                {renderTextField('Section Title', ['typography', 'sizeSectionTitle'])}
                {renderTextField('Card Title', ['typography', 'sizeCardTitle'])}
                {renderTextField('Body', ['typography', 'sizeBody'])}
                {renderTextField('Small', ['typography', 'sizeSmall'])}
                {renderTextField('XS', ['typography', 'sizeXs'])}
              </div>
            </div>

            {/* Shape & Layout */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Shape — Radius & Shadow</div>
                {renderTextField('Radius MD', ['shape', 'radiusMd'])}
                {renderTextField('Radius LG (卡片)', ['shape', 'radiusLg'])}
                {renderTextField('Radius XL', ['shape', 'radiusXl'])}
                {renderTextField('Radius Pill (圆角)', ['shape', 'radiusPill'])}
                {renderTextField('Shadow Card (悬浮)', ['shape', 'shadowCard'])}
                {renderTextField('Shadow Elev (弹窗)', ['shape', 'shadowElev'])}
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Layout</div>
                {renderTextField('Container Max Width', ['layout', 'containerMax'])}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'form' && saveAction !== 'editorial' && (
          <div className="space-y-6">
            <div className="text-xs font-semibold text-gray-500 uppercase">Theme</div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Typography Sizes</div>
                {(['display', 'heading', 'subheading', 'body', 'small', 'xs'] as const).map((key) => (
                  <div key={`type-${key}`}>
                    <label className="block text-xs text-gray-500">{key}</label>
                    <input
                      className="mt-1 w-full r-base border border-gray-200 px-3 py-2 text-sm"
                      value={String(getPathValue(formData, ['typography', key]) || '')}
                      onChange={(event) => updateFormValue(['typography', key], event.target.value)}
                      placeholder="e.g. 1rem"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Typography Fonts</div>
                {(['display', 'heading', 'body', 'mono'] as const).map((key) => (
                  <div key={`font-${key}`}>
                    <label className="block text-xs text-gray-500">{key}</label>
                    <input
                      className="mt-1 w-full r-base border border-gray-200 px-3 py-2 text-sm"
                      value={String(getPathValue(formData, ['typography', 'fonts', key]) || '')}
                      onChange={(event) => updateFormValue(['typography', 'fonts', key], event.target.value)}
                      placeholder="e.g. Inter, sans-serif"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Primary Colors</div>
                {renderColorField('Primary', ['colors', 'primary', 'DEFAULT'])}
                {renderColorField('Primary Dark', ['colors', 'primary', 'dark'])}
                {renderColorField('Primary Light', ['colors', 'primary', 'light'])}
                {renderColorField('Primary 50', ['colors', 'primary', '50'])}
                {renderColorField('Primary 100', ['colors', 'primary', '100'])}
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Secondary Colors</div>
                {renderColorField('Secondary', ['colors', 'secondary', 'DEFAULT'])}
                {renderColorField('Secondary Dark', ['colors', 'secondary', 'dark'])}
                {renderColorField('Secondary Light', ['colors', 'secondary', 'light'])}
                {renderColorField('Secondary 50', ['colors', 'secondary', '50'])}
                {renderColorField('Border', ['colors', 'border', 'DEFAULT'])}
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Backdrop Colors</div>
                {renderColorField('Backdrop Primary', ['colors', 'backdrop', 'primary'])}
                {renderColorField('Backdrop Secondary', ['colors', 'backdrop', 'secondary'])}
                {renderColorField('Text Primary', ['colors', 'text', 'primary'])}
                {renderColorField('Text Secondary', ['colors', 'text', 'secondary'])}
                {renderColorField('Card BG', ['colors', 'bg', 'card'])}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Shape Tokens</div>
                {(['radius', 'radiusLg', 'radiusXl', 'radiusFull', 'radiusCard', 'radiusButton', 'radiusChip', 'radiusInput', 'shadow', 'shadowSm', 'shadowMd', 'shadowLg'] as const).map((key) => (
                  <div key={`shape-${key}`}>
                    <label className="block text-xs text-gray-500">{key}</label>
                    <input
                      className="mt-1 w-full r-base border border-gray-200 px-3 py-2 text-sm"
                      value={String(getPathValue(formData, ['shape', key]) || '')}
                      onChange={(event) => updateFormValue(['shape', key], event.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase">Layout Tokens</div>
                {(['navHeight', 'sidebarWidth', 'containerMax', 'contentMax'] as const).map((key) => (
                  <div key={`layout-${key}`}>
                    <label className="block text-xs text-gray-500">{key}</label>
                    <input
                      className="mt-1 w-full r-base border border-gray-200 px-3 py-2 text-sm"
                      value={String(getPathValue(formData, ['layout', key]) || '')}
                      onChange={(event) => updateFormValue(['layout', key], event.target.value)}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-500">spacingDensity</label>
                  <select
                    className="mt-1 w-full r-base border border-gray-200 px-3 py-2 text-sm"
                    value={String(getPathValue(formData, ['layout', 'spacingDensity']) || 'comfortable')}
                    onChange={(event) => updateFormValue(['layout', 'spacingDensity'], event.target.value)}
                  >
                    <option value="compact">compact</option>
                    <option value="comfortable">comfortable</option>
                    <option value="spacious">spacious</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="space-y-2">
            {jsonError && (
              <div className="r-base border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {jsonError} 切回 Form 或修复 JSON 后再保存。
              </div>
            )}
            <textarea
              value={themeJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="w-full min-h-[560px] font-mono text-xs p-4 r-lg outline-none border border-border focus:ring-2 focus:ring-primary/30"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </section>
  );
}

