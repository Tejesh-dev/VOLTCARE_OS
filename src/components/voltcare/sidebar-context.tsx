import { createContext, useContext, useState, type ReactNode } from "react";

type Ctx = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  toggleMobile: () => void;
};
const SidebarCtx = createContext<Ctx>({
  collapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
  toggleMobile: () => {},
});

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarCtx.Provider
      value={{
        collapsed,
        toggle: () => setCollapsed((v) => !v),
        setCollapsed,
        mobileOpen,
        setMobileOpen,
        toggleMobile: () => setMobileOpen((v) => !v),
      }}
    >
      {children}
    </SidebarCtx.Provider>
  );
}

export const useSidebarState = () => useContext(SidebarCtx);
