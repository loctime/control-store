"use client"

const ADMIN_PASSWORD = "admin123"
const AUTH_KEY = "admin_authenticated"

export function login(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(AUTH_KEY, "true")
    }
    return true
  }
  return false
}

export function logout(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(AUTH_KEY)
  }
}

export function isAuthenticated(): boolean {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(AUTH_KEY) === "true"
  }
  return false
}
