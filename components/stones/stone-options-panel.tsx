"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StoneOptionForm, StoneOptionFormData } from "@/components/stones/stone-option-form";
import { DeleteStoneOptionDialog } from "@/components/stones/delete-stone-option-dialog";

export type StoneKind = "TYPE" | "COLOR" | "CUT" | "CLARITY";

interface StoneOption {
  id: string;
  kind: StoneKind;
  name: string;
  createdAt: string;
  usageCount?: number;
}

interface StoneOptionsPanelProps {
  kind: StoneKind;
  title: string;
  description: string;
}

export function StoneOptionsPanel({ kind, title, description }: StoneOptionsPanelProps) {
  const [options, setOptions] = useState<StoneOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<StoneOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoneOption | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ kind, limit: "100" });
      if (search.trim()) params.set("name", search.trim());

      const res = await fetch(`/api/stones/options?${params}`);
      const data = await res.json();

      if (data.success) {
        setOptions(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [kind, search]);

  useEffect(() => {
    const timer = setTimeout(fetchOptions, 300);
    return () => clearTimeout(timer);
  }, [fetchOptions]);

  const openCreate = () => {
    setEditingOption(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (option: StoneOption) => {
    setEditingOption(option);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (formData: StoneOptionFormData) => {
    setSubmitting(true);
    setFormError(null);

    try {
      const url = editingOption
        ? `/api/stones/options/${editingOption.id}`
        : "/api/stones/options";
      const method = editingOption ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingOption
            ? { name: formData.name }
            : { kind, name: formData.name }
        ),
      });

      const data = await res.json();

      if (data.success) {
        setFormOpen(false);
        setEditingOption(null);
        fetchOptions();
      } else {
        setFormError(data.error || "Failed to save option");
      }
    } catch {
      setFormError("An error occurred while saving");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/stones/options/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setDeleteTarget(null);
        fetchOptions();
      } else {
        setDeleteError(data.error || "Failed to delete option");
      }
    } catch {
      setDeleteError("An error occurred while deleting");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add {title}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No options yet. Add your first {title.toLowerCase()}.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Used in inventory</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.map((option) => (
              <TableRow key={option.id}>
                <TableCell className="font-medium">{option.name}</TableCell>
                <TableCell>{option.usageCount ?? 0}</TableCell>
                <TableCell>
                  {new Date(option.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(option)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(option);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOption ? `Edit ${title}` : `Add ${title}`}
            </DialogTitle>
            <DialogDescription>
              {editingOption
                ? "Update this stone option"
                : `Create a new ${title.toLowerCase()} option`}
            </DialogDescription>
          </DialogHeader>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <StoneOptionForm
            key={editingOption?.id || "new"}
            defaultValues={
              editingOption ? { name: editingOption.name } : undefined
            }
            onSubmit={handleSubmit}
            isSubmitting={submitting}
            submitLabel={editingOption ? "Update" : "Create"}
          />
        </DialogContent>
      </Dialog>

      <DeleteStoneOptionDialog
        open={Boolean(deleteTarget)}
        optionName={deleteTarget?.name || ""}
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
