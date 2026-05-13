"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  VendorAPI,
  VendorRequest,
  VendorResponse,
  VendorSuppliedProductRequest,
} from "@/lib/api/vendorAPI"

type ProductLine = VendorSuppliedProductRequest & { key: number }

const emptyProductLine = (key: number): ProductLine => ({
  key,
  productName: "",
  category: "",
})

const productCategories = ["Electronics", "Grocery", "Kitchenware", "Apparel", "Health"]

export function VendorsContent() {
  const productLineKeyRef = useRef(1)
  const [vendors, setVendors] = useState<VendorResponse[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVendorId, setEditingVendorId] = useState<number | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [accountName, setAccountName] = useState("")
  const [bankName, setBankName] = useState("")
  const [branchName, setBranchName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [productLines, setProductLines] = useState<ProductLine[]>([emptyProductLine(1)])

  const getNextProductLine = () => {
    productLineKeyRef.current += 1
    return emptyProductLine(productLineKeyRef.current)
  }

  const loadVendors = useCallback(async () => {
    setIsTableLoading(true)
    try {
      const data = await VendorAPI.getAllVendors()
      setVendors(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch vendors")
    } finally {
      setIsTableLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVendors()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadVendors])

  const filteredVendors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return vendors

    return vendors.filter((vendor) => {
      const products = vendor.suppliedProducts
        .map((product) => `${product.productName} ${product.category}`)
        .join(" ")
        .toLowerCase()

      return (
        vendor.companyName.toLowerCase().includes(query) ||
        vendor.email?.toLowerCase().includes(query) ||
        vendor.phone?.toLowerCase().includes(query) ||
        products.includes(query)
      )
    })
  }, [vendors, searchQuery])

  const resetForm = () => {
    setEditingVendorId(null)
    setCompanyName("")
    setPhone("")
    setEmail("")
    setAccountName("")
    setBankName("")
    setBranchName("")
    setAccountNumber("")
    setProductLines([getNextProductLine()])
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (vendor: VendorResponse) => {
    setEditingVendorId(vendor.id)
    setCompanyName(vendor.companyName)
    setPhone(vendor.phone ?? "")
    setEmail(vendor.email ?? "")
    setAccountName(vendor.accountName ?? "")
    setBankName(vendor.bankName ?? "")
    setBranchName(vendor.branchName ?? "")
    setAccountNumber(vendor.accountNumber ?? "")
    setProductLines(
      vendor.suppliedProducts.length
        ? vendor.suppliedProducts.map((product) => ({
            key: product.id,
            productName: product.productName,
            category: product.category,
          }))
        : [getNextProductLine()]
    )
    setIsDialogOpen(true)
  }

  const updateProductLine = (key: number, field: keyof VendorSuppliedProductRequest, value: string) => {
    setProductLines((lines) =>
      lines.map((line) => (line.key === key ? { ...line, [field]: value } : line))
    )
  }

  const addProductLine = () => {
    setProductLines((lines) => [...lines, getNextProductLine()])
  }

  const removeProductLine = (key: number) => {
    setProductLines((lines) => (lines.length > 1 ? lines.filter((line) => line.key !== key) : lines))
  }

  const buildPayload = (): VendorRequest | null => {
    const suppliedProducts = productLines
      .map((line) => ({
        productName: line.productName.trim(),
        category: line.category.trim(),
      }))
      .filter((line) => line.productName || line.category)

    if (!companyName.trim()) {
      toast.error("Company name is required")
      return null
    }

    if (suppliedProducts.length === 0) {
      toast.error("Add at least one supplied product")
      return null
    }

    const incompleteLine = suppliedProducts.find((line) => !line.productName || !line.category)
    if (incompleteLine) {
      toast.error("Each supplied product needs a name and category")
      return null
    }

    return {
      companyName: companyName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      accountName: accountName.trim() || undefined,
      bankName: bankName.trim() || undefined,
      branchName: branchName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      suppliedProducts,
    }
  }

  const handleSaveVendor = async () => {
    const payload = buildPayload()
    if (!payload) return

    setIsSaving(true)
    try {
      if (editingVendorId !== null) {
        await VendorAPI.updateVendor(editingVendorId, payload)
        toast.success("Vendor updated successfully")
      } else {
        await VendorAPI.createVendor(payload)
        toast.success("Vendor created successfully")
      }

      await loadVendors()
      resetForm()
      setIsDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save vendor")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteVendor = async (vendor: VendorResponse) => {
    if (!window.confirm(`Are you sure you want to delete "${vendor.companyName}"?`)) return

    try {
      await VendorAPI.deleteVendor(vendor.id)
      toast.success("Vendor deleted successfully")
      await loadVendors()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete vendor")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Vendors</h1>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                className="w-[320px] pl-9"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Vendor
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Vendor ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTableLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Loading vendors...
                  </TableCell>
                </TableRow>
              ) : filteredVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No vendors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-mono text-sm">V-{String(vendor.id).padStart(3, "0")}</TableCell>
                    <TableCell className="font-medium">{vendor.companyName}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>{vendor.phone || "No phone"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>{vendor.suppliedProducts.map((product) => product.productName).join(", ")}</div>
                      </div>
                    </TableCell>
                    <TableCell>{vendor.suppliedProducts.map((product) => product.category).join(", ")}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(vendor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteVendor(vendor)}
                        >
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>{editingVendorId !== null ? "Edit Vendor" : "New Vendor"}</DialogTitle>
          </DialogHeader>

          <div className="mt-4 grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" value={bankName} onChange={(event) => setBankName(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branchName">Branch Name</Label>
                <Input
                  id="branchName"
                  value={branchName}
                  onChange={(event) => setBranchName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(event) => setAccountNumber(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Supplied Products</Label>
                <Button type="button" variant="outline" size="sm" onClick={addProductLine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>

              <div className="space-y-3">
                {productLines.map((line) => (
                  <div key={line.key} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      placeholder="Product name"
                      value={line.productName}
                      onChange={(event) => updateProductLine(line.key, "productName", event.target.value)}
                    />
                    <Select
                      value={line.category}
                      onValueChange={(value) => updateProductLine(line.key, "category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-destructive hover:text-destructive"
                      onClick={() => removeProductLine(line.key)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setIsDialogOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveVendor} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : editingVendorId !== null ? "Update Vendor" : "Save Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
