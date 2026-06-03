import Sidebar from '@/components/layout/Sidebar';

const PanelLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#020F14] text-white pb-6">
    <Sidebar />

    <main className="h-[calc(100vh-128px)] overflow-hidden">
      {children}
    </main>
  </div>
);

export default PanelLayout;
