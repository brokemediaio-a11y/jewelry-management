"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  Gem,
  Users,
  ShoppingCart,
  Receipt,
  FileBarChart,
  HandCoins,
  Hammer,
  Warehouse,
  Settings,
  Menu,
  PlusCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getModuleKey, moduleStyleVars, type ModuleKey } from "@/lib/module-theme";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  module: ModuleKey;
  accent?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
      {
        title: "New Sale",
        href: "/dashboard/sales/new",
        icon: PlusCircle,
        module: "new-sale",
        accent: true,
      },
      { title: "Sales", href: "/dashboard/sales", icon: ShoppingCart, module: "sales" },
      { title: "Karegar", href: "/dashboard/karegar", icon: Hammer, module: "karegar" },
      { title: "Expenses", href: "/dashboard/expenses", icon: Receipt, module: "expenses" },
    ],
  },
  {
    label: "Stock",
    items: [
      { title: "Inventory", href: "/dashboard/inventory", icon: Warehouse, module: "inventory" },
      { title: "Categories", href: "/dashboard/categories", icon: FolderTree, module: "categories" },
      { title: "Stones", href: "/dashboard/stones", icon: Gem, module: "stones" },
    ],
  },
  {
    label: "Partners & Insights",
    items: [
      { title: "Beopari", href: "/dashboard/beopari", icon: HandCoins, module: "beopari" },
      { title: "Customers", href: "/dashboard/customers", icon: Users, module: "customers" },
      { title: "Reports", href: "/dashboard/reports", icon: FileBarChart, module: "reports" },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Settings", href: "/dashboard/settings", icon: Settings, module: "settings" },
    ],
  },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

  const vars = moduleStyleVars(item.module);
  const isNewSaleCta = item.accent && item.module === "new-sale";

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? isNewSaleCta
            ? "border-transparent text-white shadow-sm"
            : "border-transparent text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
      style={
        isActive
          ? {
              borderLeftColor: isNewSaleCta ? "transparent" : vars.accent,
              background: isNewSaleCta ? vars.bgActive : vars.bgActive,
              backgroundImage: isNewSaleCta
                ? undefined
                : `linear-gradient(90deg, ${vars.bgActive} 0%, transparent 100%)`,
            }
          : undefined
      }
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderLeftColor = vars.accent;
          e.currentTarget.style.background = `linear-gradient(90deg, ${vars.bg} 0%, transparent 85%)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderLeftColor = "transparent";
          e.currentTarget.style.background = "";
        }
      }}
    >
      <Icon
        className="h-5 w-5 shrink-0"
        style={
          isActive && isNewSaleCta
            ? { color: "#ffffff" }
            : !isActive
              ? { color: vars.accent }
              : { color: vars.accent }
        }
      />
      {item.title}
    </Link>
  );
}

function SidebarBrand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-2 py-1">
      <Image
        src="/venus_logo.png"
        alt="Venus Silver Collection"
        width={140}
        height={48}
        className="h-10 w-auto object-contain"
        priority
      />
    </Link>
  );
}

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto p-4">
      {navSections.map((section, index) => (
        <div key={section.label}>
          {index > 0 && <Separator className="mb-4" />}
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const activeModule = getModuleKey(pathname);
  const accent = moduleStyleVars(activeModule).accent;

  return (
    <div
      className="flex h-full w-64 flex-col border-r bg-sidebar"
      style={{
        boxShadow: `inset -4px 0 12px -4px color-mix(in srgb, ${accent} 18%, transparent)`,
      }}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <SidebarBrand />
      </div>
      <SidebarNav pathname={pathname} />
    </div>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col bg-sidebar">
          <div className="flex h-16 items-center border-b border-sidebar-border px-4">
            <SidebarBrand />
          </div>
          <SidebarNav pathname={pathname} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
