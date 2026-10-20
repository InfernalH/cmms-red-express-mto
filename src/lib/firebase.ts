import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  writeBatch,
  getDocs,
  setDoc,
  Firestore,
} from "firebase/firestore";
import {
  INITIAL_ASSETS,
  INITIAL_ASSET_CATEGORIES,
  INITIAL_ASSET_TYPES,
  INITIAL_CHECKLIST_ITEMS,
  INITIAL_MAINTENANCE_PLANS,
  INITIAL_PREVENTIVE_EXECUTIONS,
  INITIAL_REQUESTS,
  INITIAL_STORES,
  INITIAL_USERS,
  INITIAL_ZONES,
} from "./initial-data";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "cmms-red-express-locales.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cmms-red-express-locales",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "cmms-red-express-locales.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

let app: FirebaseApp;
let db: Firestore;

export function getFirebaseClient(): { app: FirebaseApp; db: Firestore } {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    if (typeof window !== "undefined") {
      // Persistencia Offline-First nativa de Cloud Firestore en IndexedDB
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } else {
      db = getFirestore(app);
    }
  } else {
    app = getApp();
    db = getFirestore(app);
  }
  return { app, db };
}

/**
 * Inicializa y puebla las colecciones de Cloud Firestore con la estructura del CMMS
 * (Zonas, Locales de la red 528, Categorías HVAC/REFRIG, Activos con QR UUID, Tickets y Planes Preventivos).
 */
export async function seedFirestoreDatabase(customDb?: Firestore) {
  const targetDb = customDb ?? getFirebaseClient().db;
  const batch = writeBatch(targetDb);

  // 1. Zonas (zones)
  for (const zone of INITIAL_ZONES) {
    batch.set(doc(targetDb, "zones", String(zone.id)), zone);
  }

  // 2. Locales Cabecera (stores)
  for (const store of INITIAL_STORES) {
    batch.set(doc(targetDb, "stores", String(store.id)), store);
  }

  // 3. Usuarios (users)
  for (const user of INITIAL_USERS) {
    batch.set(doc(targetDb, "users", String(user.id)), user);
  }

  // 4. Categorías y Tipos de Activos (asset_categories, asset_types)
  for (const cat of INITIAL_ASSET_CATEGORIES) {
    batch.set(doc(targetDb, "asset_categories", String(cat.id)), cat);
  }
  for (const type of INITIAL_ASSET_TYPES) {
    batch.set(doc(targetDb, "asset_types", String(type.id)), type);
  }

  // 5. Activos HVAC con su QR UUID (assets)
  for (const asset of INITIAL_ASSETS) {
    batch.set(doc(targetDb, "assets", String(asset.id)), asset);
  }

  // 6. Solicitudes de Mantenimiento / Tickets (maintenance_requests)
  for (const req of INITIAL_REQUESTS) {
    batch.set(doc(targetDb, "maintenance_requests", String(req.id)), req);
  }

  // 7. Planes Preventivos, Checklists y Ejecuciones
  for (const plan of INITIAL_MAINTENANCE_PLANS) {
    batch.set(doc(targetDb, "maintenance_plans", String(plan.id)), plan);
  }
  for (const item of INITIAL_CHECKLIST_ITEMS) {
    batch.set(doc(targetDb, "plan_checklist_items", String(item.id)), item);
  }
  for (const exec of INITIAL_PREVENTIVE_EXECUTIONS) {
    batch.set(doc(targetDb, "preventive_executions", String(exec.id)), exec);
  }

  await batch.commit();
  return {
    ok: true,
    collectionsSeeded: [
      "zones",
      "stores",
      "users",
      "asset_categories",
      "asset_types",
      "assets",
      "maintenance_requests",
      "maintenance_plans",
      "plan_checklist_items",
      "preventive_executions",
    ],
  };
}

export { collection, doc, getDocs, setDoc };
