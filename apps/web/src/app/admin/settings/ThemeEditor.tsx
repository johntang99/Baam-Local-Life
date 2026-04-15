'use client';

import { useState } from 'react';
import { saveThemeConfig } from './actions';

interface ThemeEditorProps {
  initialThemeJson: string;
  targetFile: string;
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

function normalizeTheme(theme: ThemeObject): ThemeObject {
  const next = cloneTheme(theme);
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
  return next;
}

function safeParseTheme(input: string): { value: ThemeObject; error: string } {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!isRecord(parsed)) return { value: {}, error: 'Theme JSON 必须是对象。' };
    return { value: normalizeTheme(parsed), error: '' };
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
  const match = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return '#000000';
  if (match[1].length === 3) {
    const [r, g, b] = match[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return raw.toLowerCase();
}

const PRESET_GROUP_ORDER = [
  'BAAM DEFAULT',
  'LUXURY',
  'WARM & LOCAL',
  'BOLD & MODERN',
  'CLASSIC & PROFESSIONAL',
  'FRESH & CLEAN',
] as const;

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'baam-default',
    group: 'BAAM DEFAULT',
    name: 'Default',
    description: '当前 BAAM 默认橙色主题',
    swatches: ['#f97316', '#3b82f6', '#fff7ed'],
    tags: ['radius: 8px', 'AI: enabled', 'comfortable'],
    patch: [],
  },
  {
    id: 'luxury-navy',
    group: 'LUXURY',
    name: 'Luxury Navy',
    description: 'Deep navy tone with red accent and serif typography.',
    swatches: ['#1e3a8a', '#dc2626', '#f8fafc'],
    tags: ['radius: 8px', 'AI: enabled', 'serif display'],
    patch: [
      { path: ['colors', 'primary', 'DEFAULT'], value: '#1e3a8a' },
      { path: ['colors', 'primary', 'dark'], value: '#1e40af' },
      { path: ['colors', 'primary', 'light'], value: '#3b82f6' },
      { path: ['colors', 'secondary', 'DEFAULT'], value: '#dc2626' },
      { path: ['colors', 'secondary', 'dark'], value: '#b91c1c' },
      { path: ['colors', 'backdrop', 'primary'], value: '#f8fafc' },
      { path: ['typography', 'fonts', 'display'], value: "Georgia, 'Times New Roman', serif" },
      { path: ['typography', 'fonts', 'heading'], value: "Georgia, 'Times New Roman', serif" },
    ],
  },
  {
    id: 'luxury-burgundy',
    group: 'LUXURY',
    name: 'Luxury Burgundy',
    description: 'Rich burgundy palette with formal gold heading style.',
    swatches: ['#7f1d1d', '#a16207', '#fdf4d8'],
    tags: ['radius: 8px', 'AI: enabled', 'elevated'],
    patch: [
      { path: ['colors', 'primary', 'DEFAULT'], value: '#7f1d1d' },
      { path: ['colors', 'primary', 'dark'], value: '#450a0a' },
      { path: ['colors', 'primary', 'light'], value: '#b91c1c' },
      { path: ['colors', 'secondary', 'DEFAULT'], value: '#a16207' },
      { path: ['colors', 'secondary', 'dark'], value: '#713f12' },
      { path: ['colors', 'backdrop', 'primary'], value: '#fdf4d8' },
      { path: ['colors', 'backdrop', 'secondary'], value: '#fef9e8' },
    ],
  },
  {
    id: 'luxury-charcoal',
    group: 'LUXURY',
    name: 'Luxury Charcoal',
    description: 'Minimal dark neutral theme with elevated blue accents.',
    swatches: ['#111827', '#0ea5e9', '#f3f4f6'],
    tags: ['radius: 8px', 'AI: enabled', 'serious'],
    patch: [
      { path: ['colors', 'primary', 'DEFAULT'], value: '#111827' },
      { path: ['colors', 'primary', 'dark'], value: '#030712' },
      { path: ['colors', 'primary', 'light'], value: '#374151' },
      { path: ['colors', 'secondary', 'DEFAULT'], value: '#0ea5e9' },
      { path: ['colors', 'secondary', 'dark'], value: '#0284c7' },
      { path: ['colors', 'backdrop', 'primary'], value: '#f3f4f6' },
    ],
  },
  {
    id: 'warm-sage',
    group: 'WARM & LOCAL',
    name: 'Warm Sage',
    description: 'Earthy green with rounded UI and calm readable typography.',
    swatches: ['#3f6212', '#a16207', '#f7f4ea'],
    tags: ['radius: 12px', 'AI: enabled', 'comfortable'],
    patch: [
      { path: ['colors', 'primary', 'DEFAULT'], value: '#3f6212' },
      { path: ['colors', 'primary', 'dark'], value: '#365314' },
      { path: ['colors', 'primary', 'light'], value: '#65a30d' },
      { path: ['colors', 'secondary', 'DEFAULT'], value: '#a16207' },
      { path: ['colors', 'backdrop', 'primary'], value: '#f7f4ea' },
      { path: ['shape', 'radius'], value: '12px' },
      { path: ['shape', 'radiusLg'], value: '16px' },
    ],
  },
  {
    id: 'warm-terracotta',
    group: 'WARM & LOCAL',
    name: 'Warm Terracotta',
    description: 'Warm tea-ceramic tone with inviting well-loved style.',
    swatches: ['#b45309', '#7c3aed', '#fff7ed'],
    tags: ['radius: 8px', 'AI: enabled', 'comfortable'],
    patch: [
      { path: ['colors', 'primary', 'DEFAULT'], value: '#b45309' },
      { path: ['colors', 'primary', 'dark'], value: '#92400e' },
      { path: ['colors', 'primary', 'light'], value: '#ea580c' },
      { path: ['colors', 'secondary', 'DEFAULT'], value: '#7c3aed' },
      { path: ['colors', 'secondary', 'dark'], value: '#6d28d9' },
      { path: ['colors', 'backdrop', 'primary'], value: '#fff7ed' },
    ],
  },
  {
    id: 'bold-midnight',
    group: 'BOLD & MODERN',
    name: 'Bold Midnight',
    description: 'High-contrast dark palette with modern energetic tone.',
    swatches: ['#0f766e', '#7c3aed', '#e2e8f0'],
    tags: ['radius: 4px', 'AI: enabled', 'spacious'],
    patch: [
      { path: ['colors', 'primary', 'DEFAULT'], value: '#0f766e' },
      { path: ['colors', 'primary', 'dark'], value: '#115e59' },
      { path: ['colors', 'secondary', 'DEFAULT'], value: '#7c3aed' },
      { path: ['colors', 'backdrop', 'primary'], value: '#e2e8f0' },
      { path: ['shape', 'radius'], value: '4px' },
      { path: ['shape', 'radiusLg'], value: '8px' },
      { path: ['layout', 'spacingDensity'], value: 'spacious' },
    ],
  },
  {
    id: 'classic-forest',
    group: 'CLASSIC & PROFESSIONAL',
    name: 'Classic Forest',
    description: 'Professional evergreen palette with timeless typography.',
    swatches: ['#166534', '#a16207', '#f5f5f4'],
    tags: ['radius: 8px', 'AI: enabled', 'comfortable'],
    patch: [
      { path: ['colors', 'primary', 'DEFAULT'], value: '#166534' },
      { path: ['colors', 'primary', 'dark'], value: '#14532d' },
      { path: ['colors', 'secondary', 'DEFAULT'], value: '#a16207' },
      { path: ['colors', 'backdrop', 'primary'], value: '#f5f5f4' },
      { path: ['typography', 'fonts', 'display'], value: "Georgia, 'Times New Roman', serif" },
      { path: ['typography', 'fonts', 'heading'], value: "Georgia, 'Times New Roman', serif" },
    ],
  },
  {
    id: 'fresh-ocean',
    group: 'FRESH & CLEAN',
    name: 'Fresh Ocean',
    description: 'Clean blue-forward style with approachable modern type.',
    swatches: ['#0284c7', '#ea580c', '#f8fafc'],
    tags: ['radius: 12px', 'AI: quick', 'comfortable'],
    patch: [
      { path: ['colors', 'primary', 'DEFAULT'], value: '#0284c7' },
      { path: ['colors', 'primary', 'dark'], value: '#0369a1' },
      { path: ['colors', 'primary', 'light'], value: '#0ea5e9' },
      { path: ['colors', 'secondary', 'DEFAULT'], value: '#ea580c' },
      { path: ['colors', 'backdrop', 'primary'], value: '#f8fafc' },
      { path: ['shape', 'radius'], value: '12px' },
      { path: ['shape', 'radiusLg'], value: '16px' },
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

export function ThemeEditor({ initialThemeJson, targetFile }: ThemeEditorProps) {
  const parsedInitial = safeParseTheme(initialThemeJson);
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
      const result = await saveThemeConfig(fd);
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

        {activeTab === 'form' && (
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

