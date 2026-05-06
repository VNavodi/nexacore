"use client"

import { useState, useEffect, useId } from "react"
import { Plus, Trash2, Eye, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"
import { authFetch, getAuthHeaders } from "@/lib/auth-fetch"

const SALES_API_BASE_URLS = process.env.NEXT_PUBLIC_API_URL
  ? [process.env.NEXT_PUBLIC_API_URL]
  : ["http://localhost:8081/api", "http://localhost:8080/api"]

interface InvoiceItem {
  id: string
  skuNumber: string
  itemName: string
  qty: number
  unitPrice: number
  discount: number
  lineTotal: number
}

interface InvoiceRecord {
  id: number
  invoiceNumber: string
  customerName: string
  invoiceDate: string
  grandTotal: number
  subtotal: number
  items: {
    skuNumber: string
    itemName: string
    qty: number
    unitPrice: number
    discount: number
    lineTotal: number
  }[]
}

async function fetchInvoicesWithAuth(baseUrls: string[]): Promise<InvoiceRecord[]> {
  for (const baseUrl of baseUrls) {
    try {
      const response = await authFetch(`${baseUrl}/v1/invoices`, {
        method: "GET",
        headers: getAuthHeaders(),
      })
      if (response.ok) return response.json()
    } catch {
      // try next base URL
    }
  }
  return []
}

export function SalesContent() {
  const invoiceSeed = useId().replace(/:/g, "")
  const postInvoiceWithFallback = async (payload: unknown) => {
    let lastResponse: Response | null = null
    let lastError: Error | null = null

    for (let i = 0; i < SALES_API_BASE_URLS.length; i++) {
      const baseUrl = SALES_API_BASE_URLS[i]
      try {
        const response = await authFetch(`${baseUrl}/v1/invoices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        })
        lastResponse = response

        const shouldRetry =
          i < SALES_API_BASE_URLS.length - 1 &&
          !process.env.NEXT_PUBLIC_API_URL &&
          (response.status === 403 || response.status >= 500)

        if (shouldRetry) continue
        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Network request failed")
        if (i === SALES_API_BASE_URLS.length - 1) break
      }
    }

    if (lastResponse) return lastResponse
    throw lastError ?? new Error("Unable to reach invoice API")
  }

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [invoiceRecords, setInvoiceRecords] = useState<InvoiceRecord[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceRecord | null>(null)

  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [appliedStartDate, setAppliedStartDate] = useState("")
  const [appliedEndDate, setAppliedEndDate] = useState("")

  const [customerName, setCustomerName] = useState("")
  const [invoiceSequence, setInvoiceSequence] = useState(1)
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0])
  const invoiceNumber = `INV-${invoiceSeed}-${invoiceSequence}`

  const loadInvoices = async () => {
    setIsLoadingInvoices(true)
    try {
      const data = await fetchInvoicesWithAuth(SALES_API_BASE_URLS)
      setInvoiceRecords(data)
    } catch {
      toast.error("Failed to load invoice list")
    } finally {
      setIsLoadingInvoices(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchInvoicesWithAuth(SALES_API_BASE_URLS)
        .then((data) => setInvoiceRecords(data))
        .catch(() => toast.error("Failed to load invoice list"))
        .finally(() => setIsLoadingInvoices(false))
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { id: Date.now().toString(), skuNumber: "", itemName: "", qty: 0, unitPrice: 0, discount: 0, lineTotal: 0 },
    ])
  }

  const removeInvoiceItem = (id: string) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== id))
  }

  const updateInvoiceItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceItems(
      invoiceItems.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        const sub = updated.qty * updated.unitPrice
        updated.lineTotal = sub - sub * (updated.discount / 100)
        return updated
      })
    )
  }

  const handleSkuBlur = async (id: string, sku: string) => {
    if (!sku.trim()) return

    try {
      // Find the best API URL to use
      let productData = null
      for (const baseUrl of SALES_API_BASE_URLS) {
        try {
          const response = await authFetch(`${baseUrl}/v1/products/sku/${sku}`, {
            headers: getAuthHeaders(),
          })
          if (response.ok) {
            productData = await response.json()
            break
          }
        } catch {
          // try next
        }
      }

      if (productData) {
        setInvoiceItems(prev => prev.map(item => {
          if (item.id !== id) return item
          const updated = {
            ...item,
            itemName: productData.name,
            unitPrice: productData.sellingPrice
          }
          const sub = updated.qty * updated.unitPrice
          updated.lineTotal = sub - sub * (updated.discount / 100)
          return updated
        }))
      }
    } catch (error) {
      console.error("Error fetching product by SKU:", error)
    }
  }

  const parseNum = (v: string) => (v.trim() === "" ? 0 : Number.isFinite(Number(v)) ? Number(v) : 0)
  const parseInt2 = (v: string) => (v.trim() === "" ? 0 : Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : 0)

  const subtotalBeforeDiscount = invoiceItems.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const discountAmount = invoiceItems.reduce((s, i) => s + (i.qty * i.unitPrice * i.discount) / 100, 0)
  const grandTotal = subtotalBeforeDiscount - discountAmount

  const handleConfirmSale = async () => {
    if (!customerName) { toast.error("Please enter customer name"); return }
    if (invoiceItems.length === 0) { toast.error("Please add at least one item."); return }
    if (invoiceItems.some((i) => !i.itemName.trim() || i.qty <= 0 || i.unitPrice <= 0)) {
      toast.error("Each item must have a name, quantity, and unit price.")
      return
    }

    try {
      const response = await postInvoiceWithFallback({
        customerName,
        invoiceNumber,
        invoiceDate,
        subtotal: subtotalBeforeDiscount,
        grandTotal,
        items: invoiceItems.map(({ skuNumber, itemName, qty, unitPrice, discount, lineTotal }) => ({
          skuNumber, itemName, qty, unitPrice, discount, lineTotal,
        })),
      })
      if (response.ok) {
        toast.success("Sale confirmed!", { description: `Invoice ${invoiceNumber} saved successfully.` })
        setCustomerName("")
        setInvoiceSequence((current) => current + 1)
        setInvoiceItems([])
        await loadInvoices()
      } else {
        toast.error((await response.text()) || "Failed to save invoice.")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error saving invoice.")
    }
  }

  const handleCancel = () => {
    setCustomerName("")
    setInvoiceSequence((current) => current + 1)
    setInvoiceItems([])
  }

  const handleApplyFilters = () => {
    setAppliedStartDate(filterStartDate)
    setAppliedEndDate(filterEndDate)
  }

  const filteredInvoices = invoiceRecords.filter(invoice => {
    if (appliedStartDate && invoice.invoiceDate < appliedStartDate) return false
    if (appliedEndDate && invoice.invoiceDate > appliedEndDate) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* New Invoice */}
      <Card>
        <CardHeader>
          <CardTitle>New Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Customer</FieldLabel>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Invoice #</FieldLabel>
                <Input value={invoiceNumber} disabled className="bg-muted" />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </Field>
            </FieldGroup>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">SKU</TableHead>
                  <TableHead className="w-[200px]">Item</TableHead>
                  <TableHead className="w-[80px]">Qty</TableHead>
                  <TableHead className="w-[120px]">Unit Price</TableHead>
                  <TableHead className="w-[100px]">Discount %</TableHead>
                  <TableHead className="w-[120px] text-right">Line Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        value={item.skuNumber}
                        onChange={(e) => updateInvoiceItem(item.id, "skuNumber", e.target.value)}
                        onKeyUp={() => handleSkuBlur(item.id, item.skuNumber)}
                        placeholder="SKU"
                      />
                    </TableCell>
                    <TableCell>
                      <Input value={item.itemName} onChange={(e) => updateInvoiceItem(item.id, "itemName", e.target.value)} placeholder="Enter item name" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" placeholder="Qty" value={item.qty === 0 ? "" : item.qty} onChange={(e) => updateInvoiceItem(item.id, "qty", parseInt2(e.target.value))} min={1} step={1} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" placeholder="Unit price" value={item.unitPrice === 0 ? "" : item.unitPrice} onChange={(e) => updateInvoiceItem(item.id, "unitPrice", parseNum(e.target.value))} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" placeholder="Discount %" value={item.discount === 0 ? "" : item.discount} onChange={(e) => updateInvoiceItem(item.id, "discount", parseNum(e.target.value))} min={0} max={100} />
                    </TableCell>
                    <TableCell className="text-right font-medium">Rs. {item.lineTotal.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeInvoiceItem(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button variant="outline" size="sm" onClick={addInvoiceItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>

          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal (Before Discount)</span>
                <span>Rs. {subtotalBeforeDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount Amount</span>
                <span>- Rs. {discountAmount.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-xl font-bold">Grand Total</span>
                  <span className="text-xl font-bold">Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleConfirmSale}>Confirm Sale</Button>
          </div>
        </CardContent>
      </Card>



      {/* Customer Invoice List */}
      <Card>
        <CardContent className="p-4 flex items-center justify-end gap-3">
          <Input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-40"
          />
          <span className="text-muted-foreground text-sm font-medium">to</span>
          <Input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-40"
          />
          <Button onClick={handleApplyFilters} className="bg-zinc-900 hover:bg-zinc-800 text-white">
            Apply Filters
          </Button>
        </CardContent>

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Customer Invoice List
            <Badge variant="secondary" className="ml-auto">Ranked by Grand Total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">Rank</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                  <TableHead className="text-right w-[130px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInvoices ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No invoices found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice, index) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="text-center">
                        <Badge
                          variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}
                          className="w-8 h-8 rounded-full flex items-center justify-center p-0 text-xs font-bold mx-auto"
                        >
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="font-medium">{invoice.customerName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(invoice.invoiceDate).toLocaleDateString("en-LK", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        Rs. {Number(invoice.grandTotal).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setViewingInvoice(invoice)}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View Order
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      {viewingInvoice && (
        <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Invoice — {viewingInvoice.invoiceNumber}</DialogTitle>
              <DialogDescription>
                Customer: <span className="font-medium text-foreground">{viewingInvoice.customerName}</span>
                &nbsp;·&nbsp;
                Date: {new Date(viewingInvoice.invoiceDate).toLocaleDateString("en-LK", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-md border mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-center">Disc %</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(viewingInvoice.items ?? []).map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{item.skuNumber || "—"}</TableCell>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell className="text-center">{item.qty}</TableCell>
                      <TableCell className="text-right">Rs. {Number(item.unitPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{item.discount}%</TableCell>
                      <TableCell className="text-right font-medium">Rs. {Number(item.lineTotal).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mt-2">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>Rs. {Number(viewingInvoice.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Grand Total</span>
                  <span>Rs. {Number(viewingInvoice.grandTotal).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
