import { Sidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // In production, fetch user from session/auth
  const mockUser = {
    name: 'Admin User',
    email: 'admin@koenig-solutions.com',
    role: 'admin',
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar user={mockUser} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
