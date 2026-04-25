'use client';

import { ReactNode, Children } from 'react';

interface MasonryGridProps {
  children: ReactNode;
  columns?: 3 | 4;
}

export function MasonryGrid({ children, columns = 4 }: MasonryGridProps) {
  const items = Children.toArray(children);

  // Mobile: always 2 columns
  const cols2: ReactNode[][] = [[], []];
  items.forEach((child, i) => { cols2[i % 2].push(child); });

  // Desktop: 3 or 4 columns (default 4 for discover page)
  const desktopCols: ReactNode[][] = Array.from({ length: columns }, () => []);
  items.forEach((child, i) => { desktopCols[i % columns].push(child); });

  return (
    <>
      {/* Mobile: 2 columns */}
      <div className="flex gap-3 sm:hidden">
        {cols2.map((colItems, colIndex) => (
          <div key={colIndex} className="flex-1 min-w-0 space-y-3">
            {colItems}
          </div>
        ))}
      </div>
      {/* Desktop: 3 or 4 columns */}
      <div className="hidden sm:flex gap-4">
        {desktopCols.map((colItems, colIndex) => (
          <div key={colIndex} className="flex-1 min-w-0 space-y-4">
            {colItems}
          </div>
        ))}
      </div>
    </>
  );
}
