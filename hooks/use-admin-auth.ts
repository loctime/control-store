import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth"
import { getStoreBySlug, isUserOwnerOfStore } from "@/lib/stores"
import type { Store } from "@/lib/types"

export function useAdminAuth(storeSlug: string) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!auth) return
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        await checkStoreAccess(currentUser.uid)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [storeSlug])

  async function checkStoreAccess(userId: string) {
    try {
      const storeData = await getStoreBySlug(storeSlug)
      if (!storeData) {
        alert("Tienda no encontrada")
        router.push("/")
        return
      }

      setStore(storeData)

      const isOwner = await isUserOwnerOfStore(userId, storeSlug)
      setIsAuthenticated(isOwner)

      setIsLoading(false)
    } catch (error) {
      console.error("Error verificando acceso:", error)
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!auth) return
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Error en login:", error)
    }
  }

  const handleLogout = async () => {
    if (!auth) return
    await signOut(auth)
    router.push(`/${storeSlug}`)
  }

  return { user, store, isAuthenticated, isLoading, handleLogin, handleLogout }
}

