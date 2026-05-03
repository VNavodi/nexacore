"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Link2,
  Settings,
} from "lucide-react"

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Inventory", href: "/items", icon: Package, hasSubmenu: true },
  { name: "Sales", href: "/sales-orders", icon: ShoppingCart, hasSubmenu: true },
  { name: "Purchases", href: "/purchase-orders", icon: Truck, hasSubmenu: true },
  { name: "Integrations", href: "/integrations", icon: Link2 },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void
}

export function Sidebar({ onCollapseChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const handleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    onCollapseChange?.(newCollapsed)
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#2b2f36] transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
 {/* Logo Area */}
<div className="relative flex h-16 items-center justify-between border-b border-[#373b41] px-4">
  <Image
    src="/logo.png"
    alt="Nexacore Logo"
    width={collapsed ? 32 : 240}  
    height={64}
    className="object-cover"
    priority
  />
  
  <button
    onClick={handleCollapse}
    className="relative z-10 ml-auto flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#373b41] hover:text-white"
    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
  >
    {collapsed ? (
      <ChevronRight className="h-5 w-5" />
    ) : (
      <ChevronLeft className="h-5 w-5" />
    )}
  </button>
</div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#e04f4f] text-white"
                      : "text-gray-400 hover:bg-[#373b41] hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </div>
                  {!collapsed && item.hasSubmenu && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      {/* <div className="border-t border-[#373b41] p-4">
          <button
            onClick={handleCollapse}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#373b41] hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
        )}
        </button>
      </div> */}
    </aside>
  )
}
