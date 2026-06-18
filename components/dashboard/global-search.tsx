"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchResults = {
  customers: Array<{ id: string; name: string; phone: string | null }>;
  inventory: Array<{
    id: string;
    sku: string;
    barcode: string;
    status: string;
    category: { name: string } | null;
  }>;
  sales: Array<{
    id: string;
    invoiceNumber: string | null;
    status: string;
    customer: { name: string } | null;
  }>;
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) setResults(data.data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query.trim()), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  };

  const hasResults =
    results &&
    (results.customers.length > 0 ||
      results.inventory.length > 0 ||
      results.sales.length > 0);

  return (
    <div ref={containerRef} className="relative flex-1 md:max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search customers, SKU, invoice…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-md border bg-popover p-2 shadow-lg">
          {!hasResults && !loading && (
            <p className="px-2 py-3 text-sm text-muted-foreground">No results found.</p>
          )}

          {results?.customers.length ? (
            <div className="mb-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                Customers
              </p>
              {results.customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full flex-col rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => navigate(`/dashboard/customers/${c.id}`)}
                >
                  <span className="font-medium">{c.name}</span>
                  {c.phone && (
                    <span className="text-xs text-muted-foreground">{c.phone}</span>
                  )}
                </button>
              ))}
            </div>
          ) : null}

          {results?.inventory.length ? (
            <div className="mb-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                Inventory
              </p>
              {results.inventory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                  onClick={() =>
                    navigate(
                      item.status === "AVAILABLE"
                        ? `/dashboard/sales/new?sku=${encodeURIComponent(item.sku)}`
                        : `/dashboard/inventory/${item.id}`
                    )
                  }
                >
                  <span>
                    <span className="font-mono font-medium">{item.sku}</span>
                    <span className="ml-2 text-muted-foreground">
                      {item.category?.name || "—"}
                    </span>
                  </span>
                  <span className={cn("text-xs", item.status === "AVAILABLE" ? "text-[var(--success)]" : "text-muted-foreground")}>
                    {item.status}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {results?.sales.length ? (
            <div>
              <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                Sales
              </p>
              {results.sales.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="flex w-full flex-col rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => navigate(`/dashboard/sales/${s.id}`)}
                >
                  <span className="font-mono font-medium">{s.invoiceNumber || "—"}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.customer?.name || "Walk-in"} · {s.status}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
