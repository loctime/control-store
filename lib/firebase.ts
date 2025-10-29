import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_REBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_REBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_REBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_REBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_REBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_REBASE_APP_ID,
}

// Inicializar Firebase si tenemos las variables de entorno necesarias
let app
let auth
let db

// Verificar que tenemos las variables mínimas necesarias
const hasConfig = firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId

if (hasConfig) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } else {
    app = getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)
  }
} else {
  console.warn('⚠️ Firebase no está configurado. Verifica tus variables de entorno en .env.local')
}

export { auth, db }
export default app

