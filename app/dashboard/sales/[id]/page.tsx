"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, Printer, XCircle } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPKR } from "@/lib/currency-utils";
import { getImageSrc } from "@/lib/image-utils";
import { formatItemQuality, formatStoneSnapshot } from "@/lib/stone-utils";
import { CloseSaleDialog } from "@/components/sales/close-sale-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WorkshopStatusBanner } from "@/components/sales/workshop-status-banner";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  formatPaymentMethod,
  formatSaleStatus,
  saleStatusVariant,
} from "@/lib/display-labels";
import { StatusBadge } from "@/components/ui/status-badge";
import "./print.css";

interface SaleItem {
  id: string;
  weightGrams: number;
  silverRateAtPurchase: number;
  purchasePricePerPiece: number;
  silverRateAtSale: number;
  categoryQuotient: number;
  suggestedSalePrice: number;
  finalPrice: number;
  itemQuality: "PREMIUM" | "LOCAL";
  stoneTypeName: string | null;
  stoneColorName: string | null;
  stoneCutName: string | null;
  stoneClarityName: string | null;
  stonePrice: number | null;
  inventoryItem: {
    sku: string;
    barcode: string;
    imageData: string;
    category?: { name: string };
  };
}

interface SaleDetail {
  id: string;
  invoiceNumber: string | null;
  saleType: string;
  status: string;
  source?: "INVENTORY" | "EXTERNAL";
  suggestedSalePrice: number;
  finalPrice: number;
  silverRateAtSale: number;
  advancePaid: number | null;
  remainingAmount: number | null;
  pickupDate: string | null;
  paymentMethod: string;
  notes: string | null;
  sampleImageData?: string | null;
  sampleImageMimeType?: string | null;
  orderDescription?: string | null;
  manualCost?: number | null;
  createdAt: string;
  closedAt: string | null;
  customer: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  user: { name: string };
  items: SaleItem[];
  workshopOrder?: {
    status: string;
    karegar?: { id: string; name: string } | null;
  } | null;
  shopInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export default function SaleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchSale = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sales/${id}`);
      const data = await res.json();

      if (data.success) {
        setSale(data.data);
      } else {
        setError(data.error || "Sale not found");
      }
    } catch {
      setError("Failed to load sale");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !sale) return;

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${sale.invoiceNumber || sale.id}.pdf`);
  };

  const handleCloseSale = async (paymentMethod?: string) => {
    setClosing(true);
    setCloseError(null);

    try {
      const res = await fetch(`/api/sales/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentMethod ? { paymentMethod } : {}),
      });
      const data = await res.json();

      if (data.success) {
        setCloseOpen(false);
        fetchSale();
      } else {
        setCloseError(data.error || "Failed to close sale");
      }
    } catch {
      setCloseError("An error occurred");
    } finally {
      setClosing(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setCancelOpen(false);
        fetchSale();
      } else {
        setCancelError(data.error || "Failed to cancel sale");
      }
    } catch {
      setCancelError("Failed to cancel sale");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (error || !sale) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{error || "Sale not found"}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/sales">Back to Sales</Link>
        </Button>
      </div>
    );
  }

  const isOpenCustomOrder =
    sale.saleType === "CUSTOM_ORDER" && sale.status === "OPEN";
  const isPartialPayment = sale.status === "OPEN";
  const isExternal = sale.source === "EXTERNAL";
  const workshopIncomplete =
    isOpenCustomOrder &&
    sale.workshopOrder &&
    sale.workshopOrder.status !== "COMPLETE";

  return (
    <div className="space-y-6">
      <PageHeader
        title={sale.invoiceNumber || "Invoice"}
        description="Sale invoice and item breakdown"
        breadcrumbs={[
          { label: "Sales", href: "/dashboard/sales" },
          { label: sale.invoiceNumber || "Detail" },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            {isOpenCustomOrder && (
              <Button
                onClick={() => setCloseOpen(true)}
                disabled={Boolean(workshopIncomplete)}
                title={workshopIncomplete ? "Karegar must mark workshop complete before closing" : undefined}
              >
                Close Sale
              </Button>
            )}
            {sale.status !== "CANCELLED" && (
              <Button
                variant="destructive"
                onClick={() => {
                  setCancelError(null);
                  setCancelOpen(true);
                }}
                disabled={cancelling}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Sale
              </Button>
            )}
          </>
        }
        className="no-print"
      />

      {sale.saleType === "CUSTOM_ORDER" && sale.workshopOrder && (
        <WorkshopStatusBanner
          workshopOrder={sale.workshopOrder}
          saleStatus={sale.status}
        />
      )}

      <div ref={invoiceRef} className="invoice-content space-y-6 bg-white p-6">
        {isPartialPayment && (
          <div className="rounded border-2 border-warning-border bg-warning-muted p-3 text-center text-sm font-semibold text-[var(--warning)]">
            PARTIAL PAYMENT — Custom Order
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold">
              {sale.shopInfo?.name || "Venus Silver Collection"}
            </h2>
            {sale.shopInfo?.address && (
              <p className="text-sm text-muted-foreground">{sale.shopInfo.address}</p>
            )}
            {sale.shopInfo?.phone && (
              <p className="text-sm text-muted-foreground">{sale.shopInfo.phone}</p>
            )}
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-semibold">{sale.invoiceNumber}</p>
            <p>{new Date(sale.createdAt).toLocaleString()}</p>
            <StatusBadge
              label={formatSaleStatus(sale.status)}
              variant={saleStatusVariant(sale.status)}
              className="mt-1"
            />
          </div>
        </div>

        {sale.customer && (
          <div className="text-sm">
            <p className="font-medium">Customer</p>
            <p>{sale.customer.name}</p>
            {sale.customer.phone && <p>{sale.customer.phone}</p>}
            {sale.customer.address && <p>{sale.customer.address}</p>}
          </div>
        )}

        {isExternal ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">External custom order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {sale.sampleImageData && sale.sampleImageMimeType && (
                <img
                  src={`data:${sale.sampleImageMimeType};base64,${sale.sampleImageData}`}
                  alt="Sample"
                  className="h-40 w-40 rounded border object-cover"
                />
              )}
              <div>
                <p className="text-muted-foreground">Description</p>
                <p className="whitespace-pre-wrap">{sale.orderDescription || "—"}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {sale.workshopOrder && (
                  <div>
                    <p className="text-muted-foreground">Workshop status</p>
                    <p className="font-medium">
                      {sale.workshopOrder.status}
                      {sale.workshopOrder.karegar?.name
                        ? ` — ${sale.workshopOrder.karegar.name}`
                        : ""}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Stone</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead className="text-right">Suggested</TableHead>
                <TableHead className="text-right">Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <img
                      src={getImageSrc(item.inventoryItem.imageData)}
                      alt={item.inventoryItem.sku}
                      className="h-10 w-10 rounded object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.inventoryItem.sku}
                  </TableCell>
                  <TableCell>{item.inventoryItem.category?.name || "—"}</TableCell>
                  <TableCell>{formatItemQuality(item.itemQuality)}</TableCell>
                  <TableCell className="max-w-[200px] text-sm">
                    {formatStoneSnapshot(item) || "—"}
                  </TableCell>
                  <TableCell>{item.weightGrams.toFixed(3)} g</TableCell>
                  <TableCell className="text-right">
                    {formatPKR(item.suggestedSalePrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPKR(item.finalPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suggested total</span>
              <span>{formatPKR(sale.suggestedSalePrice)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Final total</span>
              <span>{formatPKR(sale.finalPrice)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Silver rate at sale</span>
              <span>{formatPKR(sale.silverRateAtSale)}/g</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Payment</span>
              <span>{formatPaymentMethod(sale.paymentMethod)}</span>
            </div>
          </div>
        </div>

        {sale.saleType === "CUSTOM_ORDER" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom Order</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Advance paid</p>
                <p className="font-medium">
                  {formatPKR(sale.advancePaid || 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Remaining</p>
                <p className="font-medium">
                  {formatPKR(sale.remainingAmount || 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Pickup date</p>
                <p className="font-medium">
                  {sale.pickupDate
                    ? new Date(sale.pickupDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {sale.notes && (
          <p className="text-sm text-muted-foreground">Notes: {sale.notes}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Served by {sale.user.name}
        </p>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this sale?"
        description="This will cancel the sale and return inventory items to available stock. This action cannot be undone."
        confirmLabel="Cancel sale"
        destructive
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => {
          setCancelOpen(false);
          setCancelError(null);
        }}
      />

      {cancelError && (
        <p className="no-print text-sm text-destructive">{cancelError}</p>
      )}

      <CloseSaleDialog
        open={closeOpen}
        remainingAmount={sale.remainingAmount || 0}
        loading={closing}
        error={closeError}
        onConfirm={handleCloseSale}
        onCancel={() => {
          setCloseOpen(false);
          setCloseError(null);
        }}
      />
    </div>
  );
}
