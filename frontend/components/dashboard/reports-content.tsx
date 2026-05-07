"use client"

import { useEffect, useState } from "react"
import { ReportAPI, SalesSummaryResponse } from "@/lib/api/reportAPI"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Download,
  ChevronDown,
  FileText,
  BarChart3,
  Users,
  Receipt,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Package,
  PieChart,
  Box,
  AlertTriangle,
  CreditCard,
  ChevronRight,
  TrendingDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart as RechartsPieChart, Cell, ResponsiveContainer } from "recharts"

// Sample data for other reports

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
}

const stockValuationData = [
  { item: "Cotton T-Shirt - White", sku: "SKU-001", qty: 150, avgCost: 450, totalValue: 67500 },
  { item: "Denim Jeans - Blue", sku: "SKU-002", qty: 80, avgCost: 1200, totalValue: 96000 },
  { item: "Summer Dress - Floral", sku: "SKU-003", qty: 45, avgCost: 800, totalValue: 36000 },
  { item: "Polo Shirt - Navy", sku: "SKU-004", qty: 200, avgCost: 550, totalValue: 110000 },
  { item: "Casual Shorts - Khaki", sku: "SKU-005", qty: 120, avgCost: 650, totalValue: 78000 },
]

const profitAnalysisData = [
  { sku: "SKU-001", item: "Cotton T-Shirt - White", initialCost: 450, saleCost: 750, profit: 300 },
  { sku: "SKU-002", item: "Denim Jeans - Blue", initialCost: 1200, saleCost: 2200, profit: 1000 },
  { sku: "SKU-003", item: "Summer Dress - Floral", initialCost: 800, saleCost: 1500, profit: 700 },
  { sku: "SKU-004", item: "Polo Shirt - Navy", initialCost: 550, saleCost: 950, profit: 400 },
  { sku: "SKU-005", item: "Casual Shorts - Khaki", initialCost: 650, saleCost: 1100, profit: 450 },
]

const weeklyProfitData = [
  { day: "Mon", cost: 30000, profit: 15000 },
  { day: "Tue", cost: 24000, profit: 8000 },
  { day: "Wed", cost: 36000, profit: 22000 },
  { day: "Thu", cost: 27000, profit: 14000 },
  { day: "Fri", cost: 47000, profit: 28000 },
  { day: "Sat", cost: 50000, profit: 32000 },
  { day: "Sun", cost: 37000, profit: 18000 },
]

const categoryData = [
  { name: "Apparel", value: 40, color: "#3b82f6" },
  { name: "Electronics", value: 24, color: "#10b981" },
  { name: "Accessories", value: 14, color: "#f59e0b" },
  { name: "Other", value: 22, color: "#ef4444" },
]

const lowStockItems = [
  { item: "Cotton T-Shirt", sku: "SKU-014", stock: 4, status: "Critical" },
  { item: "Denim Jeans", sku: "SKU-023", stock: 11, status: "Low" },
  { item: "Polo Shirt", sku: "SKU-045", stock: 7, status: "Critical" },
  { item: "Casual Shorts", sku: "SKU-031", stock: 18, status: "Low" },
  { item: "Summer Dress", sku: "SKU-009", stock: 22, status: "OK" },
]

const topSellingItems = [
  { item: "Rice 5kg", sales: 4200, progress: 85 },
  { item: "Milk 1L", sales: 3380, progress: 70 },
  { item: "USB cable", sales: 2740, progress: 55 },
  { item: "Bread loaf", sales: 2190, progress: 45 },
  { item: "Orange juice", sales: 1600, progress: 30 },
]

const profitChartConfig = {
  cost: {
    label: "Revenue (Cost part)",
    color: "#fecaca", // Light red
  },
  profit: {
    label: "Profit",
    color: "#e04f4f", // Nexacore Red
  },
}

const EmptyState = ({ onRun }: { onRun: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
      <FileText className="h-12 w-12 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">No Report Data</h3>
    <p className="text-muted-foreground max-w-sm mb-4">
      Select your filters and click &quot;Apply Filters&quot; to generate the report.
    </p>
    <Button onClick={onRun}>
      Run Report
    </Button>
  </div>
)

export function ReportsContent() {
  const [activeTab, setActiveTab] = useState("sales-summary")
  const [hasData, setHasData] = useState(true)
  const [isSalesLoading, setIsSalesLoading] = useState(false)
  const [salesSummary, setSalesSummary] = useState<SalesSummaryResponse[]>([])
  const [period, setPeriod] = useState("this-month")

  useEffect(() => {
    if (activeTab === "sales-summary") {
      loadSalesSummary()
    }
  }, [activeTab])

  const loadSalesSummary = async () => {
    setIsSalesLoading(true)
    try {
      const data = await ReportAPI.getSalesSummary()
      setSalesSummary(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load sales summary")
    } finally {
      setIsSalesLoading(false)
    }
  }

  const chartData = salesSummary.map(item => ({
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    sales: item.totalAmount
  })).reverse().slice(-7) // Show last 7 days

  const totalInvoices = salesSummary.reduce((sum, item) => sum + item.invoiceCount, 0)
  const grandTotalAll = salesSummary.reduce((sum, item) => sum + item.totalAmount, 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Report Selector Tabs */}
      <Card>
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sales-summary" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Sales Summary
              </TabsTrigger>
              <TabsTrigger value="stock-valuation" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Stock Valuation
              </TabsTrigger>
              <TabsTrigger value="profit-analysis" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Profit Analysis
              </TabsTrigger>
              <TabsTrigger value="custom-export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Custom Export
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Filters Row */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Period Selector */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                <Button 
                  variant={period === "this-month" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setPeriod("this-month")}
                  className="text-xs h-8"
                >
                  This month
                </Button>
                <Button 
                  variant={period === "last-7-days" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setPeriod("last-7-days")}
                  className="text-xs h-8"
                >
                  Last 7 days
                </Button>
                <Button 
                  variant={period === "last-3-months" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setPeriod("last-3-months")}
                  className="text-xs h-8"
                >
                  Last 3 months
                </Button>
                <Button 
                  variant={period === "custom" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setPeriod("custom")}
                  className="text-xs h-8"
                >
                  Custom
                </Button>
              </div>

              <div className="h-8 w-px bg-gray-200 mx-2" />

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Category:</span>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="apparel">Apparel</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setHasData(true)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content Area */}
      <div className="min-h-[500px]">
          {!hasData ? (
            <Card className="p-12">
              <EmptyState onRun={() => setHasData(true)} />
            </Card>
          ) : (
            <>
              {/* Sales Summary Report */}
              {activeTab === "sales-summary" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Sales Summary Report</h3>
                    <Badge variant="secondary">
                      {isSalesLoading ? "Loading..." : `${salesSummary.length} days recorded`}
                    </Badge>
                  </div>
                  
                  {/* Chart */}
                  <div className="h-64 border rounded-lg p-4 bg-white">
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </div>

                  {/* Table */}
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Invoice Count</TableHead>
                          <TableHead className="text-right">Grand Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isSalesLoading ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              Loading summary...
                            </TableCell>
                          </TableRow>
                        ) : salesSummary.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No sales data found for the selected period
                            </TableCell>
                          </TableRow>
                        ) : (
                          salesSummary.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.date}</TableCell>
                              <TableCell className="text-right">{row.invoiceCount}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(row.totalAmount)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell className="font-semibold">Total</TableCell>
                          <TableCell className="text-right font-semibold">{totalInvoices}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(grandTotalAll)}</TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </Card>
                </div>
              )}

              {/* Stock Valuation Report */}
              {activeTab === "stock-valuation" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Stock Valuation Report</h3>
                    <Badge variant="secondary">As of today</Badge>
                  </div>

                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Qty on Hand</TableHead>
                          <TableHead className="text-right">Total Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockValuationData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.item}</TableCell>
                            <TableCell className="text-muted-foreground">{row.sku}</TableCell>
                            <TableCell className="text-right">{row.qty}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(row.totalValue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-semibold">
                            Total Inventory Value
                          </TableCell>
                          <TableCell className="text-right text-xl font-bold">
                            {formatCurrency(387500)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </Card>
                </div>
              )}

              {/* Profit Analysis Report */}
              {activeTab === "profit-analysis" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Profit Analysis Report</h3>
                    <Badge variant="secondary">Overview</Badge>
                  </div>

                  {/* Profit Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Potential Profit</p>
                          <p className="text-3xl font-black text-[#e04f4f] mt-2">LKR 280,250</p>
                          <div className="flex items-center gap-1 mt-4 text-[#e04f4f]">
                            <TrendingUp className="h-3 w-3" />
                            <span className="text-xs font-medium">24% increase from last month</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Most Profitable SKU</p>
                          <p className="text-3xl font-black text-[#e04f4f] mt-2">SKU-002</p>
                          <div className="flex items-center gap-1 mt-4 text-[#e04f4f]">
                            <Package className="h-3 w-3" />
                            <span className="text-xs font-medium">Denim Jeans - Blue</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Weekly Revenue vs Profit Chart */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-[#e04f4f]" />
                        <CardTitle className="text-lg font-bold">Weekly Revenue vs Profit</CardTitle>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-[#fecaca]" />
                          <span className="text-xs text-muted-foreground">Revenue</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-[#e04f4f]" />
                          <span className="text-xs text-muted-foreground">Profit</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="h-72 w-full">
                        <ChartContainer config={profitChartConfig} className="h-full w-full">
                          <BarChart data={weeklyProfitData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                            <XAxis 
                              dataKey="day" 
                              axisLine={false} 
                              tickLine={false}
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
                              dy={10}
                            />
                            <YAxis hide />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Bar 
                              dataKey="cost" 
                              fill="#fecaca" 
                              stackId="a"
                              radius={[0, 0, 0, 0]} 
                              barSize={40}
                              background={{ fill: '#f8fafc', radius: 4 }}
                            />
                            <Bar 
                              dataKey="profit" 
                              fill="#e04f4f" 
                              stackId="a"
                              radius={[4, 4, 0, 0]} 
                              barSize={40}
                            />
                          </BarChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Item Profit Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Best Profitable 3 Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>SKU Number</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead className="text-right">Initial Cost</TableHead>
                            <TableHead className="text-right">Sale Cost</TableHead>
                            <TableHead className="text-right">Profit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profitAnalysisData.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                              <TableCell className="font-medium">{row.item}</TableCell>
                              <TableCell className="text-right">{formatCurrency(row.initialCost)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(row.saleCost)}</TableCell>
                              <TableCell className="text-right font-bold text-[#e04f4f]">
                                {formatCurrency(row.profit)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={4} className="text-right font-semibold">Total Average Profit</TableCell>
                            <TableCell className="text-right text-lg font-bold text-[#e04f4f]">
                              {formatCurrency(570)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Custom Export */}
              {activeTab === "custom-export" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Custom Export Builder</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Select Data Source</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose data source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="invoices">Sales Invoices</SelectItem>
                            <SelectItem value="items">Items & Stock</SelectItem>
                            <SelectItem value="customers">Customers</SelectItem>
                            <SelectItem value="suppliers">Suppliers</SelectItem>
                            <SelectItem value="purchases">Purchase Orders</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Select Fields</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          {["Invoice #", "Date", "Customer", "Amount", "Tax", "Status", "Items", "Notes"].map((field) => (
                            <label key={field} className="flex items-center gap-2 text-sm">
                              <input type="checkbox" className="rounded border-input" defaultChecked />
                              {field}
                            </label>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Preview</Button>
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Export
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  )
}
