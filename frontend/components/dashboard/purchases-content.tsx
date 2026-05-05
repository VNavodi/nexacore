"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Eye } from "lucide-react"

type PurchaseOrderLine = {
  id: number
  itemName: string
  orderedQty: number
  unitCost: number
  expectedDate: string | null
  receivedQty: number
  lineTotal: number
}

type PurchaseOrder = {
  id: number
  poNumber: string
  supplier: string
  orderDate: string
  expectedDeliveryDate: string | null
  deliveryAddress: string
  paymentTerms: string
  internalNotes: string
  supplierInstructions: string
  termsAndConditions: string
  status: string
  totalItems: number
  subtotal: number
  tax: number
  grandTotal: number
  items: PurchaseOrderLine[]
}

type FormLine = {
  id: number
  itemName: string
  orderedQty: number
  unitCost: number
  expectedDate: string
}

const API_BASE_URL = "http://localhost:8080/api/v1/purchase-orders"

function getAuthHeaders() {
  const headers: Record<string, string> = {}
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token")
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }
  return headers
}

async function parseErrorMessage(response: Response, fallbackMessage: string) {
  const text = await response.text()
  if (!text) return fallbackMessage
  try {
    const parsed = JSON.parse(text)
    if (parsed?.message && typeof parsed.message === "string") {
      return parsed.message
    }
  } catch {
    // Response is not JSON; use plain text.
  }
  return text
}

function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>
    case "ordered":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ordered</Badge>
    case "partial":
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Partially Received</Badge>
    case "completed":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function defaultNewLine(id: number): FormLine {
  return {
    id,
    itemName: "",
    orderedQty: 1,
    unitCost: 0,
    expectedDate: "",
  }
}

export function PurchasesContent() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null)
  const [isPurchaseDetailsOpen, setIsPurchaseDetailsOpen] = useState(false)

  const [supplier, setSupplier] = useState("")
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0])
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [supplierInstructions, setSupplierInstructions] = useState("")
  const [termsAndConditions, setTermsAndConditions] = useState("")
  const [orderLines, setOrderLines] = useState<FormLine[]>([defaultNewLine(1)])

  const suppliers = useMemo(() => {
    const uniqueSuppliers = new Set(
      purchaseOrders
        .map((po) => po.supplier)
        .filter((value) => value && value.trim().length > 0)
    )
    return Array.from(uniqueSuppliers)
  }, [purchaseOrders])

  const subtotal = useMemo(
    () => orderLines.reduce((sum, line) => sum + line.orderedQty * line.unitCost, 0),
    [orderLines]
  )
  const tax = subtotal * 0.1
  const grandTotal = subtotal + tax

  const commitmentSummary = useMemo(() => {
    const openOrders = purchaseOrders.filter((po) => po.status !== "completed")
    const completedOrders = purchaseOrders.filter((po) => po.status === "completed")

    const openCommitmentValue = openOrders.reduce((sum, po) => sum + po.grandTotal, 0)
    const openItemsCount = openOrders.reduce((sum, po) => sum + po.totalItems, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in14Days = new Date(today)
    in14Days.setDate(today.getDate() + 14)

    const upcomingDeliveries = purchaseOrders.filter((po) => {
      if (!po.expectedDeliveryDate) return false
      const deliveryDate = new Date(po.expectedDeliveryDate)
      deliveryDate.setHours(0, 0, 0, 0)
      return deliveryDate >= today && deliveryDate <= in14Days
    })

    const topSupplierName = purchaseOrders.length
      ? purchaseOrders
          .reduce<Record<string, { count: number; value: number }>>((acc, po) => {
            const current = acc[po.supplier] ?? { count: 0, value: 0 }
            acc[po.supplier] = {
              count: current.count + 1,
              value: current.value + po.grandTotal,
            }
            return acc
          }, {})
      : {}

    const topSupplierEntry = Object.entries(topSupplierName).sort((a, b) => b[1].value - a[1].value)[0]

    return {
      openOrdersCount: openOrders.length,
      completedOrdersCount: completedOrders.length,
      openCommitmentValue,
      openItemsCount,
      upcomingDeliveries,
      topSupplierName: topSupplierEntry?.[0] ?? "-",
      topSupplierValue: topSupplierEntry?.[1].value ?? 0,
      topSupplierOrders: topSupplierEntry?.[1].count ?? 0,
    }
  }, [purchaseOrders])

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const searchText = search.trim().toLowerCase()
      const matchesSearch =
        searchText.length === 0 ||
        po.poNumber.toLowerCase().includes(searchText) ||
        po.supplier.toLowerCase().includes(searchText)

      const matchesSupplier =
        supplierFilter === "all" || po.supplier.toLowerCase() === supplierFilter

      const matchesStatus = statusFilter === "all" || po.status === statusFilter

      return matchesSearch && matchesSupplier && matchesStatus
    })
  }, [purchaseOrders, search, supplierFilter, statusFilter])

  const fetchPurchaseOrders = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(API_BASE_URL, {
        headers: {
          ...getAuthHeaders(),
        },
      })
      if (!response.ok) {
        const message = await parseErrorMessage(response, "Failed to load purchase orders")
        throw new Error(message)
      }
      const data = (await response.json()) as PurchaseOrder[]
      setPurchaseOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load purchase orders")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPurchaseOrders()
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  const addOrderLine = () => {
    setOrderLines((current) => [...current, defaultNewLine(current.length + 1)])
  }

  const removeOrderLine = (id: number) => {
    setOrderLines((current) => {
      if (current.length === 1) {
        return current
      }
      return current.filter((line) => line.id !== id)
    })
  }

  const updateOrderLine = (id: number, field: keyof FormLine, value: string | number) => {
    setOrderLines((current) =>
      current.map((line) =>
        line.id === id
          ? {
              ...line,
              [field]: value,
            }
          : line
      )
    )
  }

  const resetForm = () => {
    setSupplier("")
    setOrderDate(new Date().toISOString().split("T")[0])
    setExpectedDeliveryDate("")
    setDeliveryAddress("")
    setPaymentTerms("")
    setInternalNotes("")
    setSupplierInstructions("")
    setTermsAndConditions("")
    setOrderLines([defaultNewLine(1)])
  }

  const openPurchaseDetails = (purchaseOrder: PurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder)
    setIsPurchaseDetailsOpen(true)
  }

  const openEditModal = (po: PurchaseOrder) => {
    setIsEditing(true)
    setEditingId(po.id)
    setSupplier(po.supplier ?? "")
    setOrderDate(po.orderDate ?? new Date().toISOString().split("T")[0])
    setExpectedDeliveryDate(po.expectedDeliveryDate ?? "")
    setDeliveryAddress(po.deliveryAddress ?? "")
    setPaymentTerms(po.paymentTerms ?? "")
    setInternalNotes(po.internalNotes ?? "")
    setSupplierInstructions(po.supplierInstructions ?? "")
    setTermsAndConditions(po.termsAndConditions ?? "")
    setOrderLines(
      po.items && po.items.length > 0
        ? po.items.map((it, idx) => ({
            id: idx + 1,
            itemName: it.itemName,
            orderedQty: it.orderedQty,
            unitCost: it.unitCost,
            expectedDate: it.expectedDate ?? "",
          }))
        : [defaultNewLine(1)]
    )
    setIsNewPOModalOpen(true)
  }

  const handleCreatePurchaseOrder = async (status: "draft" | "ordered") => {
    setError("")

    const cleanedItems = orderLines
      .map((line) => ({
        itemName: line.itemName.trim(),
        orderedQty: Number(line.orderedQty),
        unitCost: Number(line.unitCost),
        expectedDate: line.expectedDate || null,
      }))
      .filter((line) => line.itemName.length > 0)

    if (!supplier.trim()) {
      setError("Supplier is required")
      return
    }

    if (cleanedItems.length === 0) {
      setError("Add at least one item")
      return
    }

    const invalidLine = cleanedItems.find((line) => line.orderedQty <= 0 || line.unitCost < 0)
    if (invalidLine) {
      setError("Ordered quantity must be > 0 and unit cost cannot be negative")
      return
    }

    setIsSaving(true)
    try {
      const url = isEditing && editingId ? `${API_BASE_URL}/${editingId}` : API_BASE_URL
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          supplier: supplier.trim(),
          orderDate,
          expectedDeliveryDate: expectedDeliveryDate || null,
          deliveryAddress: deliveryAddress.trim(),
          paymentTerms: paymentTerms.trim(),
          internalNotes: internalNotes.trim(),
          supplierInstructions: supplierInstructions.trim(),
          termsAndConditions: termsAndConditions.trim(),
          status,
          items: cleanedItems,
        }),
      })

      if (!response.ok) {
        const message = await parseErrorMessage(response, isEditing ? "Failed to update purchase order" : "Failed to create purchase order")
        throw new Error(message)
      }

      await fetchPurchaseOrders()
      setIsNewPOModalOpen(false)
      resetForm()
      setIsEditing(false)
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create purchase order")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePurchaseOrder = async (id: number) => {
    if (!confirm("Delete this purchase order? This action cannot be undone.")) return
    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      })
      if (!response.ok) {
        const message = await parseErrorMessage(response, "Failed to delete purchase order")
        throw new Error(message)
      }
      await fetchPurchaseOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete purchase order")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Purchases</h1>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search purchase orders..."
                  className="pl-9 w-64"
                />
              </div>

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((supplierName) => (
                    <SelectItem key={supplierName} value={supplierName.toLowerCase()}>
                      {supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="partial">Partially Received</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => setIsNewPOModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Purchase Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead className="text-center">Total Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No purchase orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        className="text-left font-medium text-primary hover:underline"
                        onClick={() => openPurchaseDetails(po)}
                      >
                        {po.poNumber}
                      </button>
                    </TableCell>
                    <TableCell>{po.supplier}</TableCell>
                    <TableCell>{po.orderDate}</TableCell>
                    <TableCell>{po.expectedDeliveryDate || "-"}</TableCell>
                    <TableCell className="text-center">{po.totalItems}</TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell className="text-right">${po.grandTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPurchaseDetails(po)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(po)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePurchaseOrder(po.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isPurchaseDetailsOpen} onOpenChange={setIsPurchaseDetailsOpen}>
        <SheetContent side="right" className="w-[92vw] sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Purchase Order Details</SheetTitle>
            <SheetDescription>
              Open the full purchase order commitment and review its items, totals, and notes.
            </SheetDescription>
          </SheetHeader>

          {selectedPurchaseOrder ? (
            <div className="space-y-5 px-4 pb-4">
              <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">PO Number</p>
                  <p className="font-medium">{selectedPurchaseOrder.poNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedPurchaseOrder.supplier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order Date</p>
                  <p className="font-medium">{selectedPurchaseOrder.orderDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expected Delivery</p>
                  <p className="font-medium">{selectedPurchaseOrder.expectedDeliveryDate || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPurchaseOrder.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Grand Total</p>
                  <p className="font-medium">${selectedPurchaseOrder.grandTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Line Items</p>
                  <span className="text-xs text-muted-foreground">{selectedPurchaseOrder.items.length} items</span>
                </div>
                <div className="space-y-2">
                  {selectedPurchaseOrder.items.map((line) => (
                    <div key={line.id} className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{line.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty {line.orderedQty} × ${line.unitCost.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${line.lineTotal.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            Received: {line.receivedQty}/{line.orderedQty}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${selectedPurchaseOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${selectedPurchaseOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Grand Total</span>
                  <span>${selectedPurchaseOrder.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {selectedPurchaseOrder.deliveryAddress && (
                <div className="rounded-lg border p-4 text-sm">
                  <p className="mb-1 text-muted-foreground">Delivery Address</p>
                  <p>{selectedPurchaseOrder.deliveryAddress}</p>
                </div>
              )}

              {(selectedPurchaseOrder.paymentTerms || selectedPurchaseOrder.internalNotes || selectedPurchaseOrder.supplierInstructions || selectedPurchaseOrder.termsAndConditions) && (
                <div className="space-y-3 rounded-lg border p-4 text-sm">
                  {selectedPurchaseOrder.paymentTerms && (
                    <div>
                      <p className="text-muted-foreground">Payment Terms</p>
                      <p>{selectedPurchaseOrder.paymentTerms}</p>
                    </div>
                  )}
                  {selectedPurchaseOrder.internalNotes && (
                    <div>
                      <p className="text-muted-foreground">Internal Notes</p>
                      <p>{selectedPurchaseOrder.internalNotes}</p>
                    </div>
                  )}
                  {selectedPurchaseOrder.supplierInstructions && (
                    <div>
                      <p className="text-muted-foreground">Supplier Instructions</p>
                      <p>{selectedPurchaseOrder.supplierInstructions}</p>
                    </div>
                  )}
                  {selectedPurchaseOrder.termsAndConditions && (
                    <div>
                      <p className="text-muted-foreground">Terms & Conditions</p>
                      <p>{selectedPurchaseOrder.termsAndConditions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 text-sm text-muted-foreground">Select a purchase order to view its details.</div>
          )}

          <SheetFooter>
            <Button variant="outline" onClick={() => setIsPurchaseDetailsOpen(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Purchase Orders (PO) – The Commitment</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            This panel tracks the value and timing of open purchase commitments so you can plan cash flow and deliveries.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Open Commitment Value</p>
              <p className="text-2xl font-semibold">${commitmentSummary.openCommitmentValue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Across {commitmentSummary.openOrdersCount} active orders</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Items on Commitments</p>
              <p className="text-2xl font-semibold">{commitmentSummary.openItemsCount}</p>
              <p className="text-xs text-muted-foreground">Line-item quantity still on order</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Upcoming Deliveries</p>
              <p className="text-2xl font-semibold">{commitmentSummary.upcomingDeliveries.length}</p>
              <p className="text-xs text-muted-foreground">Due in the next 14 days</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Supplier</p>
              <p className="text-lg font-semibold truncate">{commitmentSummary.topSupplierName}</p>
              <p className="text-xs text-muted-foreground">
                ${commitmentSummary.topSupplierValue.toFixed(2)} across {commitmentSummary.topSupplierOrders} orders
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Commitment Breakdown</p>
                <span className="text-xs text-muted-foreground">{commitmentSummary.completedOrdersCount} completed</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Orders</span>
                  <span>{commitmentSummary.openOrdersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed Orders</span>
                  <span>{commitmentSummary.completedOrdersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Active Value</span>
                  <span>${commitmentSummary.openCommitmentValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Upcoming Deliveries</p>
                <span className="text-xs text-muted-foreground">Next 14 days</span>
              </div>
              {commitmentSummary.upcomingDeliveries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scheduled deliveries in the next 14 days.</p>
              ) : (
                <div className="space-y-2">
                  {commitmentSummary.upcomingDeliveries.slice(0, 5).map((po) => (
                    <div key={po.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{po.poNumber}</p>
                        <p className="text-xs text-muted-foreground">{po.supplier}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${po.grandTotal.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{po.expectedDeliveryDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isNewPOModalOpen} onOpenChange={setIsNewPOModalOpen}>
        <DialogContent className="w-[96vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input
                  value={supplier}
                  onChange={(event) => setSupplier(event.target.value)}
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="space-y-2">
                <Label>Order Date</Label>
                <Input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(event) => setExpectedDeliveryDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input
                  value={paymentTerms}
                  onChange={(event) => setPaymentTerms(event.target.value)}
                  placeholder="Ex: Net 30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Delivery Address</Label>
              <Input
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                placeholder="Enter delivery address"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button variant="outline" onClick={addOrderLine}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                {orderLines.map((line) => (
                  <div key={line.id} className="rounded-md border p-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
                      <div className="space-y-1 xl:col-span-2">
                        <Label>Item Name</Label>
                        <Input
                          value={line.itemName}
                          onChange={(event) => updateOrderLine(line.id, "itemName", event.target.value)}
                          placeholder="Item name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Ordered Qty</Label>
                        <Input
                          type="number"
                          min={1}
                          className="text-center"
                          value={line.orderedQty}
                          onChange={(event) => updateOrderLine(line.id, "orderedQty", Number(event.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Unit Cost</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          className="text-center"
                          value={line.unitCost}
                          onChange={(event) => updateOrderLine(line.id, "unitCost", Number(event.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Expected Date</Label>
                        <Input
                          type="date"
                          value={line.expectedDate}
                          onChange={(event) => updateOrderLine(line.id, "expectedDate", event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Line Total: <span className="font-medium text-foreground">${(line.orderedQty * line.unitCost).toFixed(2)}</span>
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeOrderLine(line.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border rounded-lg p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Grand Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea
                  value={internalNotes}
                  onChange={(event) => setInternalNotes(event.target.value)}
                  placeholder="Add internal notes"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Supplier Instructions</Label>
                <Textarea
                  value={supplierInstructions}
                  onChange={(event) => setSupplierInstructions(event.target.value)}
                  placeholder="Add supplier instructions"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={termsAndConditions}
                  onChange={(event) => setTermsAndConditions(event.target.value)}
                  placeholder="Add terms and conditions"
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsNewPOModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => handleCreatePurchaseOrder("draft")} disabled={isSaving}>
              Save as Draft
            </Button>
            <Button onClick={() => handleCreatePurchaseOrder("ordered")} disabled={isSaving}>
              Create Purchase Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
