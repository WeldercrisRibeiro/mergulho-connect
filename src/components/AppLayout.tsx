import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";

const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen">
    <DesktopSidebar />
    <main className="flex-1 pb-20 md:pb-0">
      {children}
    </main>
    <BottomNav />
  </div>
);

export default AppLayout;
