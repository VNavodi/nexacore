export interface UserProfile {
  fullName: string
  email: string
  phoneNumber: string
  companyName: string
}

const USER_PROFILE_STORAGE_KEY = "userProfile"
export const USER_PROFILE_UPDATED_EVENT = "user-profile-updated"

const defaultUserProfile: UserProfile = {
  fullName: "",
  email: "",
  phoneNumber: "",
  companyName: "",
}

export function getUserProfile(): UserProfile {
  if (typeof window === "undefined") {
    return defaultUserProfile
  }

  const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY)
  if (!raw) {
    return defaultUserProfile
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>
    return {
      fullName: parsed.fullName ?? "",
      email: parsed.email ?? "",
      phoneNumber: parsed.phoneNumber ?? "",
      companyName: parsed.companyName ?? "",
    }
  } catch {
    return defaultUserProfile
  }
}

export function saveUserProfile(nextProfile: Partial<UserProfile>): UserProfile {
  if (typeof window === "undefined") {
    return { ...defaultUserProfile, ...nextProfile }
  }

  const mergedProfile = {
    ...getUserProfile(),
    ...nextProfile,
  }

  localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(mergedProfile))
  window.dispatchEvent(
    new CustomEvent(USER_PROFILE_UPDATED_EVENT, {
      detail: mergedProfile,
    }),
  )

  return mergedProfile
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export async function fetchUserProfileFromServer(): Promise<UserProfile | null> {
  if (typeof window === "undefined") {
    return null
  }

  const token = localStorage.getItem("token")
  if (!token) {
    return null
  }

  const response = await fetch("http://localhost:8080/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return saveUserProfile({
    fullName: data.fullName ?? "",
    email: data.email ?? "",
    phoneNumber: data.phoneNumber ?? "",
    companyName: data.companyName ?? "",
  })
}
