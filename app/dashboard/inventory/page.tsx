"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Printer, Search, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  InventoryTable,
  InventoryItemRow,
} from "@/components/inventory/inventory-table";
import { DeleteInventoryDialog } from "@/components/inventory/delete-inventory-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Package } from "lucide-react";
import {
  formatInventoryStatus,
} from "@/lib/display-labels";

interface Category {
  id: string;
  name: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showExtended, setShowExtended] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItemRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      });
  }, []);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (search.trim()) params.set("sku", search.trim());
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/inventory?${params}`);
      const data = await res.json();

      if (data.success) {
        setItems(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchInventory, 300);
    return () => clearTimeout(timer);
  }, [fetchInventory]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/inventory/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setDeleteTarget(null);
        fetchInventory();
      } else {
        setDeleteError(data.error || "Failed to delete item");
      }
    } catch {
      setDeleteError("An error occurred while deleting");
    } finally {
      setDeleting(false);
    }
  };

  const agingHref =
    categoryFilter !== "all"
      ? `/dashboard/reports/aging-stock?period=this-month&categoryId=${categoryFilter}`
      : "/dashboard/reports/aging-stock?period=this-month";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Manage jewelry stock with images, SKUs, and barcodes"
        actions={
          <>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle>Inventory actions</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-2">
                  <Button variant="outline" asChild className="justify-start">
                    <Link href="/dashboard/reports/stock-on-hand?period=this-month">
                      Stock on hand report
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="justify-start">
                    <Link href="/dashboard/reports/inventory-valuation?period=this-month">
                      Inventory valuation
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="justify-start">
                    <Link href={agingHref}>Aging stock report</Link>
                  </Button>
                  <Button variant="outline" asChild className="justify-start">
                    <Link href="/dashboard/inventory/print-barcodes?status=AVAILABLE">
                      <Printer className="mr-2 h-4 w-4" />
                      Print all barcodes
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button asChild variant="bronze">
              <Link href="/dashboard/inventory/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Inventory
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Inventory List</CardTitle>
            <CardDescription>
              Filter by category or status, search by SKU or barcode
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExtended((v) => !v)}
          >
            {showExtended ? "Show less" : "Show more columns"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by SKU or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="AVAILABLE">{formatInventoryStatus("AVAILABLE")}</SelectItem>
                <SelectItem value="SOLD">{formatInventoryStatus("SOLD")}</SelectItem>
                <SelectItem value="RESERVED">{formatInventoryStatus("RESERVED")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No inventory items"
              description="Add your first item or adjust your filters."
              action={
                <Button asChild>
                  <Link href="/dashboard/inventory/new">Add Inventory</Link>
                </Button>
              }
            />
          ) : (
            <InventoryTable
              items={items}
              showExtended={showExtended}
              onDelete={(item) => {
                setDeleteError(null);
                setDeleteTarget(item);
              }}
            />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteInventoryDialog
        open={Boolean(deleteTarget)}
        sku={deleteTarget?.sku || ""}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
