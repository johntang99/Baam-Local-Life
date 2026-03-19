import '../globals.css';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

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
        <AdminSidebar />
        <main className="lg:ml-60 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
