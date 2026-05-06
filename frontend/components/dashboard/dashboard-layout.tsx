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
  const [hasSession] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }
    return Boolean(localStorage.getItem("token"))
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!hasSession) {
      router.replace("/login")
    }
  }, [hasSession, router])

  if (!hasSession) {
    return null
  }

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
