import Sidebar from '@/components/layout/Sidebar';

const PanelLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#020F14] text-white pb-6">
    <Sidebar />

    <main className="min-h-[calc(100vh-60px)] overflow-visible">
      {children}
    </main>
  </div>
);

export default PanelLayout;
