import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };

const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
export const firestore = getFirestore(app, config.firestoreDatabaseId);

export function sanitizeForFirestore(val: any): any {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === 'string') {
    // Prevent document size limit (1MB max per document in Firestore)
    if (val.length > 500000) {
      return val.slice(0, 500000) + '...[truncated]';
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(item => sanitizeForFirestore(item));
  }
  if (typeof val === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        cleaned[k] = sanitizeForFirestore(v);
      }
    }
    return cleaned;
  }
  return val;
}

export async function syncToFirestore(collectionName: string, id: string, data: any): Promise<boolean> {
  try {
    if (!id) return false;
    const cleanData = sanitizeForFirestore(data);
    await setDoc(doc(firestore, collectionName, String(id)), cleanData, { merge: true });
    console.log(`[Firestore Sync] Successfully written ${collectionName}/${id}`);
    return true;
  } catch (err) {
    console.error(`[Firestore Sync] Failed to write ${collectionName}/${id}:`, (err as Error).message);
    return false;
  }
}

export async function deleteFromFirestore(collectionName: string, id: string): Promise<boolean> {
  try {
    if (!id) return false;
    await deleteDoc(doc(firestore, collectionName, String(id)));
    console.log(`[Firestore Sync] Successfully deleted ${collectionName}/${id}`);
    return true;
  } catch (err) {
    console.error(`[Firestore Sync] Failed to delete ${collectionName}/${id}:`, (err as Error).message);
    return false;
  }
}

export async function syncAllDatabaseToFirestore(data: any): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;
  console.log(`[Firestore Sync] Starting full sync to database: ${config.firestoreDatabaseId}`);

  // 1. Farmers
  if (Array.isArray(data.farmers)) {
    for (const f of data.farmers) {
      const ok = await syncToFirestore('farmers', f.id, f);
      ok ? synced++ : errors++;
    }
  }

  // 2. Crops
  if (Array.isArray(data.crops)) {
    for (const c of data.crops) {
      const ok = await syncToFirestore('crops', c.id, c);
      ok ? synced++ : errors++;
    }
  }

  // 3. Scans
  if (Array.isArray(data.crop_scans)) {
    for (const s of data.crop_scans) {
      const ok = await syncToFirestore('scans', s.id, s);
      ok ? synced++ : errors++;
    }
  }

  // 4. Alerts
  if (Array.isArray(data.alerts)) {
    for (const a of data.alerts) {
      const ok = await syncToFirestore('alerts', a.id, a);
      ok ? synced++ : errors++;
    }
  }

  // 5. Feedback
  if (Array.isArray(data.feedback)) {
    for (const fb of data.feedback) {
      const ok = await syncToFirestore('feedback', fb.id, fb);
      ok ? synced++ : errors++;
    }
  }

  // 6. Market Rates
  if (Array.isArray(data.market_rates)) {
    for (const m of data.market_rates) {
      const ok = await syncToFirestore('marketRates', m.id, m);
      ok ? synced++ : errors++;
    }
  }

  // 7. Weather
  if (Array.isArray(data.weather_records)) {
    for (const w of data.weather_records) {
      const ok = await syncToFirestore('weather', w.id, w);
      ok ? synced++ : errors++;
    }
  }

  // 8. Admins (omitting sensitive password hashes)
  if (Array.isArray(data.users)) {
    for (const u of data.users) {
      if (u.role === 'admin') {
        const { password_hash, ...safeAdmin } = u;
        const ok = await syncToFirestore('admins', safeAdmin.id, safeAdmin);
        ok ? synced++ : errors++;
      }
    }
  }

  console.log(`[Firestore Sync] Completed full sync: ${synced} documents synced, ${errors} errors.`);
  return { synced, errors };
}

