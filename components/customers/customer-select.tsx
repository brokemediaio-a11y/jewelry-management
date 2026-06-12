"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerForm, CustomerFormData } from "@/components/customers/customer-form";
import { CustomerRow } from "@/components/customers/customer-table";

interface CustomerSelectProps {
  value?: string | null;
  onChange: (customerId: string | null, customer?: CustomerRow) => void;
  disabled?: boolean;
  placeholder?: string;
}

function matchesSearch(customer: CustomerRow, query: string): boolean {
  const q = query.toLowerCase();
  return (
    customer.name.toLowerCase().includes(q) ||
    (customer.phone?.toLowerCase().includes(q) ?? false) ||
    (customer.email?.toLowerCase().includes(q) ?? false)
  );
}

export function CustomerSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Search customers...",
}: CustomerSelectProps) {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = customers.find((c) => c.id === value);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers?limit=100");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setShowAddForm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = search.trim()
    ? customers.filter((c) => matchesSearch(c, search.trim()))
    : customers;

  const handleSelect = (customer: CustomerRow) => {
    onChange(customer.id, customer);
    setOpen(false);
    setSearch("");
    setShowAddForm(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearch("");
  };

  const handleCreateCustomer = async (formData: CustomerFormData) => {
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const newCustomer = data.data as CustomerRow;
        setCustomers((prev) => [newCustomer, ...prev]);
        onChange(newCustomer.id, newCustomer);
        setShowAddForm(false);
        setOpen(false);
        setSearch("");
      } else {
        setFormError(data.error || "Failed to create customer");
      }
    } catch {
      setFormError("An error occurred while creating customer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {selectedCustomer && !open ? (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{selectedCustomer.name}</p>
            {(selectedCustomer.phone || selectedCustomer.email) && (
              <p className="truncate text-xs text-muted-foreground">
                {[selectedCustomer.phone, selectedCustomer.email].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setOpen(true)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={placeholder}
            value={search}
            disabled={disabled}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
              setShowAddForm(false);
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
      )}

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {showAddForm ? (
            <div className="p-4">
              <p className="mb-3 text-sm font-medium">Add New Customer</p>
              {formError && (
                <p className="mb-2 text-sm text-destructive">{formError}</p>
              )}
              <CustomerForm
                onSubmit={handleCreateCustomer}
                isSubmitting={submitting}
                submitLabel="Create & Select"
                showCancel
                onCancel={() => {
                  setShowAddForm(false);
                  setFormError(null);
                }}
              />
            </div>
          ) : (
            <>
              <div className="max-h-48 overflow-y-auto p-1">
                {loading ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Loading...</p>
                ) : filteredCustomers.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    No customers found
                  </p>
                ) : (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="w-full rounded-sm px-3 py-2 text-left hover:bg-accent"
                      onClick={() => handleSelect(customer)}
                    >
                      <p className="text-sm font-medium">{customer.name}</p>
                      {(customer.phone || customer.email) && (
                        <p className="text-xs text-muted-foreground">
                          {[customer.phone, customer.email].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="border-t p-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setShowAddForm(true);
                    setFormError(null);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Customer
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
