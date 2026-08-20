import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export const metadata = {
  title: {
    default: 'Admin Dashboard | TrendForge AI',
    template: '%s | TrendForge AI',
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
