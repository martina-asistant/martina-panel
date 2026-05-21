import Sidebar from '@/components/layout/Sidebar';

const PanelLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#020F14] text-white">
    <Sidebar />
    <main className="min-h-[calc(100vh-112px)] overflow-hidden">
      {children}
    </main>
  </div>
);

export default PanelLayout;
