"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Printer, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
  InventoryTable,
  InventoryItemRow,
} from "@/components/inventory/inventory-table";
import { DeleteInventoryDialog } from "@/components/inventory/delete-inventory-dialog";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage jewelry stock with images, SKUs, and barcodes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/inventory/print-barcodes?status=AVAILABLE">
              <Printer className="mr-2 h-4 w-4" />
              Print All Barcodes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/inventory/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
          <CardDescription>
            Filter by category or status, search by SKU or barcode
          </CardDescription>
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
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <InventoryTable
              items={items}
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
