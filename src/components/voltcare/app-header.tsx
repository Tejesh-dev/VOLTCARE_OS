import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Plus, Search, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useVoltcare } from "@/store/voltcare";
import { timeAgo } from "@/lib/format";
import { useSidebarState } from "./sidebar-context";
import { VoltcareLogo } from "./logo";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.611-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.695.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export function AppHeader() {
  const [query, setQuery] = useState("");
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search as { q?: string } });
  const activities = useVoltcare((s) => s.activities);
  const settings = useVoltcare((s) => s.settings);
  const { toggle, toggleMobile } = useSidebarState();

  useEffect(() => {
    setQuery(search?.q ?? "");
  }, [search?.q, pathname]);

  const openWhatsApp = () => {
    const phone = settings.company.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    // Route search to the most relevant page based on where the user is
    if (pathname.startsWith("/customers")) nav({ to: "/customers", search: { q } as any });
    else if (pathname.startsWith("/quotations")) nav({ to: "/quotations", search: { q } as any });
    else if (pathname.startsWith("/invoices")) nav({ to: "/invoices", search: { q } as any });
    else nav({ to: "/products", search: { q } as any });
  };

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border no-print">
      <div className="flex items-center gap-2 md:gap-4 px-3 md:px-6 h-16">
        <button
          onClick={toggleMobile}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          onClick={toggle}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Header logo (visible on mobile primarily) */}
        <Link to="/" className="lg:hidden shrink-0">
          <div className="text-black dark:text-white">
            <VoltcareLogo showTagline={false} />
          </div>
        </Link>

        {/* Search */}
        <form onSubmit={submitSearch} className="flex-1 min-w-0 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, customers, quotations…"
              className="pl-9 pr-14 h-10 bg-muted/50 border-border focus-visible:ring-primary"
            />
            <kbd className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-background">
              ⏎
            </kbd>
          </div>
        </form>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Quick Add */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1.5 h-10 font-semibold shadow-sm hidden sm:inline-flex">
                <Plus className="h-4 w-4" />
                Quick Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Create new</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => nav({ to: "/quotations" })}>New Quotation</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ to: "/invoices" })}>New Invoice</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ to: "/customers" })}>New Customer</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ to: "/products" })}>New Product</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ to: "/services" })}>New Service Point</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ to: "/material-lists" })}>New Material List</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* WhatsApp (real icon) */}
          <button
            onClick={openWhatsApp}
            className="h-10 w-10 rounded-full flex items-center justify-center bg-[#25D366] text-white hover:opacity-90 shrink-0"
            aria-label="WhatsApp"
            title="Open WhatsApp"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative h-10 w-10 rounded-full flex items-center justify-center hover:bg-muted shrink-0" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-4 min-w-4 rounded-full bg-primary text-[10px] text-white font-semibold flex items-center justify-center px-1">
                  {activities.length > 9 ? "9+" : activities.length}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="px-4 py-3 border-b border-border font-semibold">Recent Activity</div>
              <div className="max-h-96 overflow-y-auto">
                {activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="px-4 py-3 hover:bg-muted border-b border-border/60 last:border-0">
                    <div className="text-[13px] font-medium">{a.title}</div>
                    {a.subtitle && <div className="text-[12px] text-muted-foreground">{a.subtitle}</div>}
                    <div className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(a.createdAt)}</div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-1.5 pr-2 h-10 rounded-full hover:bg-muted shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-sm font-semibold">
                  {settings.user.name[0]}
                </div>
                <div className="hidden lg:block text-left leading-tight">
                  <div className="text-[13px] font-semibold">{settings.user.name}</div>
                  <div className="text-[11px] text-muted-foreground">{settings.user.role}</div>
                </div>
                <ChevronDown className="hidden lg:block h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild><Link to="/settings">Profile & Settings</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/reports">Reports</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
