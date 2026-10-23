import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Package,
  Wrench,
  FileText,
  ClipboardList,
  Receipt,
  IndianRupee,
  BarChart3,
  Settings as SettingsIcon,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { VoltcareLogo, VoltcareMark } from "./logo";
import { useVoltcare } from "@/store/voltcare";
import { cn } from "@/lib/utils";
import { useSidebarState } from "./sidebar-context";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/products", label: "Products", icon: Package },
  { to: "/services", label: "Services", icon: Wrench },
  { to: "/quotations", label: "Quotation Builder", icon: FileText },
  { to: "/material-lists", label: "Material Lists", icon: ClipboardList },
  { to: "/invoices", label: "Invoices", icon: Receipt },
  { to: "/payments", label: "Payments", icon: IndianRupee },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const settings = useVoltcare((s) => s.settings);
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebarState();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen shrink-0 transition-[width,transform] duration-200",
          // Desktop
          "md:sticky md:top-0 md:flex",
          collapsed ? "md:w-[72px]" : "md:w-[248px]",
          // Mobile drawer
          "fixed inset-y-0 left-0 z-50 w-[260px] md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
      {/* Logo */}
      <div className={cn("flex items-center gap-2 px-5 py-5 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
        {collapsed ? <VoltcareMark /> : <VoltcareLogo />}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 no-scrollbar">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 my-0.5 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
                collapsed && "md:justify-center md:px-0",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user + collapse */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors",
            collapsed && "justify-center",
          )}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold shrink-0">
            {settings.user.name[0]}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-[13px] font-semibold text-white truncate">{settings.user.name}</div>
                <div className="text-[11px] text-white/60 truncate">{settings.user.role}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </>
          )}
        </button>

        <button
          onClick={toggle}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-sidebar-border/60 py-1.5 text-[12px] text-white/70 hover:bg-sidebar-accent"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : (<><PanelLeftClose className="h-4 w-4" /><span>Collapse</span></>)}
        </button>
      </div>
    </aside>
    </>
  );
}
