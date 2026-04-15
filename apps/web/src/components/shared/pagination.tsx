import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  /** Extra query params to preserve (e.g. { type: 'news_alert', q: 'search' }) */
  searchParams?: Record<string, string>;
}

export function Pagination({ currentPage, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set('page', String(page));
    } else {
      params.delete('page');
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Show at most 5 page numbers centered around current
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="分页">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-orange-50 r-lg transition-colors"
        >
          上一页
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm text-gray-300 cursor-not-allowed">上一页</span>
      )}

      {/* Page numbers */}
      {start > 1 && (
        <>
          <Link href={buildHref(1)} className="w-9 h-9 flex items-center justify-center text-sm r-lg text-gray-600 hover:text-primary hover:bg-orange-50 transition-colors">1</Link>
          {start > 2 && <span className="px-1 text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          className={`w-9 h-9 flex items-center justify-center text-sm r-lg transition-colors ${
            page === currentPage
              ? 'bg-primary text-white font-medium'
              : 'text-gray-600 hover:text-primary hover:bg-orange-50'
          }`}
        >
          {page}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}
          <Link href={buildHref(totalPages)} className="w-9 h-9 flex items-center justify-center text-sm r-lg text-gray-600 hover:text-primary hover:bg-orange-50 transition-colors">{totalPages}</Link>
        </>
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-orange-50 r-lg transition-colors"
        >
          下一页
        </Link>
      ) : (
        <span className="px-3 py-2 text-sm text-gray-300 cursor-not-allowed">下一页</span>
      )}
    </nav>
  );
}
