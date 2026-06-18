"use client";

import { usePathname } from "next/navigation";
import { getModuleKey, moduleStyleVars } from "@/lib/module-theme";

export function ModuleMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const accent = moduleStyleVars(getModuleKey(pathname)).accent;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div
        className="mb-4 h-0.5 w-full rounded-full opacity-60"
        style={{
          background: `linear-gradient(90deg, ${accent} 0%, transparent 70%)`,
        }}
        aria-hidden
      />
      {children}
    </main>
  );
}
