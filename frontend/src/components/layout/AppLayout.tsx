import NavBar from "@/components/ui/NavBar";
import BottomBarComponent from "@/components/ui/BottomBar";
import TickerBar from "@/components/ui/TickerBar";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))", paddingTop: 96, paddingBottom: 48 }}>
      <NavBar />
      <TickerBar />
      {children}
      <BottomBarComponent />
    </div>
  );
};

export default AppLayout;
