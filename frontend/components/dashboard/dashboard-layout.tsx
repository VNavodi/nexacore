"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const hasSession = Boolean(localStorage.getItem("token"))
    if (!hasSession) {
      router.replace("/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <Sidebar onCollapseChange={setSidebarCollapsed} />
      <div
        className="flex flex-col transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? "64px" : "240px",
        }}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
