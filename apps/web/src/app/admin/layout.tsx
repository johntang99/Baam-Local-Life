import '../globals.css';
import { Suspense } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminSiteProvider } from '@/components/admin/AdminSiteContext';

export const metadata = {
  title: 'Admin · Baam',
  description: 'Baam Admin Panel',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AdminSiteProvider>
          <Suspense>
            <AdminSidebar />
          </Suspense>
          <main className="lg:ml-60 min-h-screen">
            <Suspense>
              <AdminHeader />
            </Suspense>
            {children}
          </main>
        </AdminSiteProvider>
      </body>
    </html>
  );
}
