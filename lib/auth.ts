"use client"

import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from "firebase/auth"
import { auth } from "./firebase"

const AUTH_KEY = "admin_authenticated"
const ADMIN_EMAIL = "maxdev@gmail.com"
const ADMIN_PASSWORD = "admin123" // Contraseña temporal para desarrollo

export async function login(email: string, password: string): Promise<boolean> {
  try {
    console.log("Intentando login con:", email)
    
    // Verificar si Firebase Auth está disponible
    if (!auth) {
      console.error("Firebase Auth no está disponible")
      // Fallback: verificar credenciales hardcodeadas
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(AUTH_KEY, "true")
          sessionStorage.setItem("admin_email", email)
        }
        return true
      }
      return false
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("Login exitoso:", userCredential.user.email)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(AUTH_KEY, "true")
      sessionStorage.setItem("admin_email", email)
    }
    return true
  } catch (error) {
    console.error("Error de autenticación:", error)
    
    // Fallback: verificar credenciales hardcodeadas
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AUTH_KEY, "true")
        sessionStorage.setItem("admin_email", email)
      }
      return true
    }
    
    return false
  }
}

export async function logout(): Promise<void> {
  try {
    if (auth) {
      await signOut(auth)
    }
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(AUTH_KEY)
      sessionStorage.removeItem("admin_email")
    }
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    // Fallback: limpiar sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(AUTH_KEY)
      sessionStorage.removeItem("admin_email")
    }
  }
}

export function isAuthenticated(): boolean {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem(AUTH_KEY) === "true"
  }
  return false
}

export function getCurrentUser(): User | null {
  if (auth) {
    return auth.currentUser
  }
  // Fallback: crear un objeto usuario simulado
  if (typeof window !== "undefined" && isAuthenticated()) {
    const email = sessionStorage.getItem("admin_email")
    return email ? { email, uid: "admin" } as any : null
  }
  return null
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (auth) {
    return onAuthStateChanged(auth, callback)
  }
  // Fallback: simular cambio de estado
  if (typeof window !== "undefined") {
    const isAuth = sessionStorage.getItem(AUTH_KEY) === "true"
    const email = sessionStorage.getItem("admin_email")
    const user = isAuth && email ? { email, uid: "admin" } as any : null
    callback(user)
  }
  return () => {} // Función de limpieza vacía
}
