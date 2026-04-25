import { Link } from '@/lib/i18n/routing';

interface FilterTab {
  key: string;
  label: string;
  href: string;
}

interface EditorialFilterBarProps {
  tabs: FilterTab[];
  activeKey: string;
}

export function EditorialFilterBar({ tabs, activeKey }: EditorialFilterBarProps) {
  return (
    <div className="flex gap-1.5 flex-wrap overflow-x-auto pb-1 scrollbar-hide" style={{ marginBottom: 24 }}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className="transition-all whitespace-nowrap"
          style={{
            padding: '8px 16px', borderRadius: 'var(--ed-radius-pill)', fontSize: 13.5,
            background: activeKey === tab.key ? 'var(--ed-ink)' : 'transparent',
            color: activeKey === tab.key ? 'var(--ed-paper)' : 'var(--ed-ink-soft)',
            border: activeKey === tab.key ? '1px solid var(--ed-ink)' : '1px solid var(--ed-line)',
          }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
