import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { InventoryData } from '../types';
import { getInitialData } from '../data/initialData';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if configured
const dbId = (firebaseConfig as any).firestoreDatabaseId || undefined;
export const db: Firestore = getFirestore(app, dbId);

// Main collection and document reference for shared inventory
const INVENTORY_DOC_ID = 'main_inventory_store';
const INVENTORY_COLLECTION = 'inventory_data';

export const inventoryDocRef = doc(db, INVENTORY_COLLECTION, INVENTORY_DOC_ID);

/**
 * Initializes and listens to real-time changes in Firestore.
 * Automatically handles seeding the initial data if Firestore is empty.
 */
export function subscribeToCloudInventory(
  onDataChange: (data: InventoryData) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const unsubscribe = onSnapshot(
      inventoryDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const cloudData = snapshot.data() as InventoryData;
          onDataChange(cloudData);
        } else {
          // Document does not exist in Firestore yet.
          // Check if there is existing local data or use default initialData to seed Firestore
          const initial = getInitialData();
          try {
            const localRaw = typeof window !== 'undefined' ? localStorage.getItem('ais_inventaris_gudang_data_v2') : null;
            const dataToSeed: InventoryData = localRaw ? JSON.parse(localRaw) : initial;
            
            await setDoc(inventoryDocRef, dataToSeed);
            onDataChange(dataToSeed);
          } catch (seedErr) {
            console.error('Error seeding initial Firestore document:', seedErr);
            onDataChange(initial);
          }
        }
      },
      (err) => {
        console.error('Firestore snapshot listener error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to Firestore inventory:', err);
    return () => {};
  }
}

/**
 * Saves or updates inventory data directly into Firestore cloud database.
 * This triggers real-time updates for all connected devices/browsers instantly.
 */
export async function saveInventoryDataToCloud(data: InventoryData): Promise<void> {
  try {
    // Also keep a local cache
    if (typeof window !== 'undefined') {
      localStorage.setItem('ais_inventaris_gudang_data_v2', JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('inventory-data-updated', { detail: data }));
    }
    
    // Push directly to Firestore
    await setDoc(inventoryDocRef, data);
  } catch (err) {
    console.error('Failed to save inventory data to Firestore:', err);
    throw err;
  }
}
