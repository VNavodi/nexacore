"use client"

import { useState } from "react"
import { Eye, EyeOff, Lock, Mail, User, Building, ArrowRight, ArrowLeft, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { saveUserProfile } from "@/lib/user-profile"

export default function RegisterPage() {
  const [authMode, setAuthMode] = useState<"login" | "register">("register")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const isRegister = authMode === "register"

      if (isRegister && password.trim() !== confirmPassword.trim()) {
        throw new Error("Password and confirm password do not match")
      }

      const endpoint = isRegister ? "register" : "login"
      const username = identifier.includes("@") ? identifier.split("@")[0] : identifier

      const payload = isRegister
        ? {
            username: username.trim(),
            fullName: fullName.trim(),
            companyName: companyName.trim(),
            email: identifier.trim(),
            phoneNumber: phoneNumber.trim(),
            password: password.trim(),
            confirmPassword: confirmPassword.trim(),
          }
        : { username: identifier.trim(), password: password.trim() }

      const response = await fetch(`http://localhost:8080/api/v1/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        let message = text
        try {
          const parsed = JSON.parse(text)
          if (parsed?.message && typeof parsed.message === "string") {
            message = parsed.message
          }
        } catch {
          // Response is not JSON; use plain text as-is.
        }
        throw new Error(message || (isRegister ? "Registration failed" : "Login failed"))
      }

      const data = await response.json()
      if (!data?.token) {
        throw new Error("Token not returned from server")
      }

      localStorage.setItem("token", data.token)
      saveUserProfile({
        fullName: fullName.trim(),
        email: identifier.trim(),
        phoneNumber: phoneNumber.trim(),
        companyName: companyName.trim(),
      })
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : authMode === "register" ? "Registration failed" : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9] p-4 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-[#e63946] text-white p-2 rounded-lg shadow-sm">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[#1c1f26] tracking-tight">Inventory</span>
          </div>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden transition-all duration-300">
          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-2xl font-semibold text-center text-[#1c1f26]">
              {authMode === "login" ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-center text-slate-500">
              {authMode === "login"
                ? "Enter your credentials to access your dashboard"
                : "Join our inventory management system today"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleAuth} className="space-y-5">
              {authMode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-sm font-medium text-slate-700">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="fullname"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10 h-11 border-slate-300 focus-visible:ring-[#1c1f26]"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium text-slate-700">Company Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="company"
                        type="text"
                        placeholder="Acme Corp"
                        className="pl-10 h-11 border-slate-300 focus-visible:ring-[#1c1f26]"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 555 123 4567"
                        className="pl-10 h-11 border-slate-300 focus-visible:ring-[#1c1f26]"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  {authMode === "login" ? "Username" : "Email Address"}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type={authMode === "login" ? "text" : "email"}
                    placeholder={authMode === "login" ? "admin" : "name@company.com"}
                    className="pl-10 h-11 border-slate-300 focus-visible:ring-[#1c1f26]"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  {authMode === "login" && (
                    <button type="button" className="text-xs font-medium text-[#e63946] hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 h-11 border-slate-300 focus-visible:ring-[#1c1f26]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {authMode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 h-11 border-slate-300 focus-visible:ring-[#1c1f26]"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-1">
                <Checkbox id="terms" className="border-slate-300 data-[state=checked]:bg-[#1c1f26]" required={authMode === "register"} />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 cursor-pointer"
                >
                  {authMode === "login" ? "Keep me signed in" : "I agree to the Terms of Service"}
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#1c1f26] hover:bg-[#2d333d] text-white font-semibold transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  authMode === "login" ? "Sign In to Dashboard" : "Register Account"
                )}
              </Button>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              {authMode === "login" ? (
                <p className="text-sm text-slate-500">
                  New to the platform? {" "}
                  <button
                    onClick={() => setAuthMode("register")}
                    className="font-semibold text-[#e63946] hover:underline inline-flex items-center gap-1"
                  >
                    Create an account <ArrowRight className="h-3 w-3" />
                  </button>
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Already have an account? {" "}
                  <button
                    onClick={() => setAuthMode("login")}
                    className="font-semibold text-[#e63946] hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back to login
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-slate-400">
          © 2024 Inventory Management System. All rights reserved.
        </div>
      </div>
    </div>
  )
}
