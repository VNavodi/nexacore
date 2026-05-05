"use client"

import { useEffect, useState } from "react"
import {
  User,
  Mail,
  Building,
  Camera,
  MapPin,
  Phone,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { fetchUserProfileFromServer, getInitials, getUserProfile, saveUserProfile } from "@/lib/user-profile"

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [companyName, setCompanyName] = useState("")

  useEffect(() => {
    let isMounted = true
    const profile = getUserProfile()
    if (isMounted) {
      setFullName(profile.fullName)
      setEmail(profile.email)
      setPhoneNumber(profile.phoneNumber)
      setCompanyName(profile.companyName)
    }

    void fetchUserProfileFromServer().then((serverProfile) => {
      if (!isMounted || !serverProfile) return
      setFullName(serverProfile.fullName)
      setEmail(serverProfile.email)
      setPhoneNumber(serverProfile.phoneNumber)
      setCompanyName(serverProfile.companyName)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    saveUserProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      companyName: companyName.trim(),
    })
    setTimeout(() => setIsLoading(false), 500)
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumbs / Navigation Info */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <span>Home</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#1c1f26] font-medium">Profile Settings</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1c1f26]">Account Settings</h1>
            <p className="text-slate-500 mt-1">Update your photo and personal details here.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Left Column: Brief Info */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="h-24 bg-[#1c1f26]" />
              <CardContent className="-mt-12 pb-8 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden text-2xl font-bold text-[#1c1f26]">
                    {getInitials(fullName)}
                  </div>
                  <button className="absolute bottom-1 right-1 p-1.5 bg-[#e63946] text-white rounded-full border-2 border-white shadow-sm hover:bg-[#d62839] transition-colors">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <h2 className="text-lg font-bold text-[#1c1f26]">{fullName || "User"}</h2>
                <p className="text-sm text-slate-500">Administrator</p>
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#e8f5e9] text-[#2e7d32]">
                    Active Account
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Main Settings Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-slate-200 rounded-none h-auto p-0 mb-8 space-x-8">
                <TabsTrigger
                  value="general"
                  className="border-none data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#e63946] data-[state=active]:text-[#e63946] data-[state=active]:shadow-none rounded-none px-0 pb-4 text-slate-500 font-semibold text-sm transition-all"
                >
                  General Info
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="border-none data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#e63946] data-[state=active]:text-[#e63946] data-[state=active]:shadow-none rounded-none px-0 pb-4 text-slate-500 font-semibold text-sm transition-all"
                >
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="company"
                  className="border-none data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-[#e63946] data-[state=active]:text-[#e63946] data-[state=active]:shadow-none rounded-none px-0 pb-4 text-slate-500 font-semibold text-sm transition-all"
                >
                  Company Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="focus-visible:ring-0">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1c1f26] font-bold">Personal Information</CardTitle>
                    <CardDescription>Update your personal details and contact information.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullname" className="text-slate-700 font-medium">Full Name</Label>
                        <Input
                          id="fullname"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-11 border-slate-200 focus-visible:ring-[#1c1f26]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 pl-10 border-slate-200 focus-visible:ring-[#1c1f26]"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-700 font-medium">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="h-11 pl-10 border-slate-200 focus-visible:ring-[#1c1f26]"
                          />
                        </div>
                      </div>
                      <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={isLoading} className="bg-[#e63946] hover:bg-[#d62839] text-white px-8 h-11 font-semibold transition-all">
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="focus-visible:ring-0">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1c1f26] font-bold">Security Settings</CardTitle>
                    <CardDescription>Manage your password and account security preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPass">Current Password</Label>
                        <Input id="currentPass" type="password" placeholder="••••••••" className="h-11 border-slate-200" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPass">New Password</Label>
                          <Input id="newPass" type="password" placeholder="••••••••" className="h-11 border-slate-200" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPass">Confirm New Password</Label>
                          <Input id="confirmPass" type="password" placeholder="••••••••" className="h-11 border-slate-200" />
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#1c1f26]">Two-factor Authentication</div>
                        <div className="text-sm text-slate-500">Add an extra layer of security to your account.</div>
                      </div>
                      <Button variant="outline" className="h-10 border-slate-200 text-[#1c1f26] font-semibold hover:bg-slate-50">
                        Enable
                      </Button>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button className="bg-[#e63946] hover:bg-[#d62839] text-white px-8 h-11 font-semibold">Update Password</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="company" className="focus-visible:ring-0">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#1c1f26] font-bold">Organization Details</CardTitle>
                    <CardDescription>Configure your organization's business profile.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="orgName"
                          placeholder="Ex:Acme Inventory Solutions"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="h-11 pl-10 border-slate-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Business Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input id="address" placeholder="Ex:123 Supply Chain Ave, Logistics City" className="h-11 pl-10 border-slate-200" />
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <Button className="bg-[#e63946] hover:bg-[#d62839] text-white px-8 h-11 font-semibold">Save Details</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
