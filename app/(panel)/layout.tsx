import Sidebar from '@/components/layout/Sidebar';

const PanelLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#020F14] text-white">
    <Sidebar />
    <main className="h-[calc(100vh-110px)] overflow-hidden">
      {children}
    </main>
  </div>
);

export default PanelLayout;
