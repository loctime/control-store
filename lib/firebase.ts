import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_REBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_REBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_REBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_REBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_REBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_REBASE_APP_ID,
}

// Solo inicializar Firebase si tenemos las variables de entorno necesarias
// y no está ya inicializado
let app
let auth
let db

if (
  typeof window !== 'undefined' &&
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } else {
    app = getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)
  }
}

export { auth, db }
export default app

