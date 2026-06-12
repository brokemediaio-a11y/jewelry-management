"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InventoryDetail,
  InventoryDetailData,
} from "@/components/inventory/inventory-detail";
import { DeleteInventoryDialog } from "@/components/inventory/delete-inventory-dialog";

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [item, setItem] = useState<InventoryDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/inventory/${id}`);
      const data = await res.json();

      if (data.success) {
        setItem(data.data);
      } else {
        setError(data.error || "Item not found");
      }
    } catch {
      setError("Failed to load inventory item");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        router.push("/dashboard/inventory");
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {item ? item.sku : "Inventory Detail"}
          </h1>
          <p className="text-muted-foreground">
            View item details, barcode, and sale history
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : error ? (
        <div className="space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/inventory">Back to Inventory</Link>
          </Button>
        </div>
      ) : item ? (
        <InventoryDetail
          item={item}
          onDelete={() => {
            setDeleteError(null);
            setDeleteOpen(true);
          }}
          deleting={deleting}
        />
      ) : null}

      <DeleteInventoryDialog
        open={deleteOpen}
        sku={item?.sku || ""}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
