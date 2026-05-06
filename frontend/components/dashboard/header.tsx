"use client"

import { useEffect, useState } from "react"
import { Bell, Search, ChevronDown, Plus, RefreshCw, Settings, HelpCircle, LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { clearAuthSession } from "@/lib/auth-fetch"
import { fetchUserProfileFromServer, getInitials, getUserProfile, USER_PROFILE_UPDATED_EVENT } from "@/lib/user-profile"

interface HeaderProps {
  sidebarCollapsed?: boolean
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")

  useEffect(() => {
    const loadProfile = () => {
      const profile = getUserProfile()
      setFullName(profile.fullName)
      setCompanyName(profile.companyName)
    }

    loadProfile()
    void fetchUserProfileFromServer().then((serverProfile) => {
      if (!serverProfile) return
      setFullName(serverProfile.fullName)
      setCompanyName(serverProfile.companyName)
    })
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, loadProfile)
    window.addEventListener("storage", loadProfile)
    return () => {
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, loadProfile)
      window.removeEventListener("storage", loadProfile)
    }
  }, [])
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4"
    >
      {/* Left Section - Quick Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          className="h-8 w-8 rounded bg-[#e04f4f] text-white hover:bg-[#c94444]"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Center - Search Bar */}
      <div className="flex-1 max-w-lg mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search"
            className="h-9 w-full rounded-full border-gray-300 bg-gray-50 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-[#e04f4f] focus:ring-[#e04f4f]"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Organization Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-1 px-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {companyName || "Organization"}
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Zylker</DropdownMenuItem>
            <DropdownMenuItem>Add Organization</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-700"
        >
          <Bell className="h-5 w-5" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-700"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* Help */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-700"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full p-0"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-teal-500 text-white text-xs">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuLabel className="font-normal text-xs text-gray-500 -mt-1">
              {fullName || "User"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => router.push("/profile")}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 cursor-pointer"
              onClick={() => {
                clearAuthSession()
                router.push("/login")
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
