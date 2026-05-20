import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

const PanelLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-martina-bg">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  </div>
);

export default PanelLayout;
