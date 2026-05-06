export const AUTH_SESSION_EXPIRED_EVENT = "auth-session-expired"

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {}
  }

  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem("token")
  window.dispatchEvent(new Event("storage"))
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT))
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers ?? {})
  const authHeaders = getAuthHeaders()

  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value)
  })

  const response = await fetch(input, {
    ...init,
    headers,
  })

  if (response.status === 401 && typeof window !== "undefined") {
    clearAuthSession()
    if (window.location.pathname !== "/login") {
      window.location.assign("/login")
    }
  }

  return response
}
