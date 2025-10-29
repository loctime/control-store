"use client"

import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from "firebase/auth"
import { auth } from "./firebase"

const AUTH_KEY = "admin_authenticated"

export async function login(email: string, password: string): Promise<boolean> {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(AUTH_KEY, "true")
    }
    return true
  } catch (error) {
    console.error("Error de autenticación:", error)
    return false
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth)
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(AUTH_KEY)
    }
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
  }
}

export function isAuthenticated(): boolean {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(AUTH_KEY) === "true"
  }
  return false
}

export function getCurrentUser(): User | null {
  return auth.currentUser
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
