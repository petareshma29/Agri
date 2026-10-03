import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import config from '../firebase-applet-config.json' with { type: 'json' };
import fs from 'fs';
import path from 'path';

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function seedAll() {
  console.log('Seeding Firestore database:', config.firestoreDatabaseId);

  const dbJsonPath = path.resolve(process.cwd(), 'data', 'database.json');
  if (!fs.existsSync(dbJsonPath)) {
    console.error('database.json not found');
    return;
  }

  const raw = fs.readFileSync(dbJsonPath, 'utf-8');
  const data = JSON.parse(raw);

  // 1. Farmers
  for (const farmer of data.farmers || []) {
    try {
      await setDoc(doc(db, 'farmers', farmer.id), farmer);
      console.log(`✓ Seeded farmer: ${farmer.name} (${farmer.id})`);
    } catch (e: any) {
      console.error(`✗ Error seeding farmer ${farmer.id}:`, e.message);
    }
    await delay(200);
  }

  // 2. Crops
  for (const crop of data.crops || []) {
    try {
      await setDoc(doc(db, 'crops', crop.id), crop);
      console.log(`✓ Seeded crop: ${crop.crop_name} (${crop.id})`);
    } catch (e: any) {
      console.error(`✗ Error seeding crop ${crop.id}:`, e.message);
    }
    await delay(200);
  }

  // 3. Scans
  for (const scan of data.scans || []) {
    try {
      await setDoc(doc(db, 'scans', scan.id), scan);
      console.log(`✓ Seeded scan: ${scan.detected_condition} (${scan.id})`);
    } catch (e: any) {
      console.error(`✗ Error seeding scan ${scan.id}:`, e.message);
    }
    await delay(200);
  }

  // 4. Alerts
  for (const alert of data.alerts || []) {
    try {
      await setDoc(doc(db, 'alerts', alert.id), alert);
      console.log(`✓ Seeded alert: ${alert.title} (${alert.id})`);
    } catch (e: any) {
      console.error(`✗ Error seeding alert ${alert.id}:`, e.message);
    }
    await delay(200);
  }

  // 5. Market Rates (both market_rates and marketRates key check)
  const rates = data.market_rates || data.marketRates || [];
  for (const rate of rates) {
    try {
      await setDoc(doc(db, 'marketRates', rate.id), rate);
      console.log(`✓ Seeded rate: ${rate.crop_name} at ${rate.market_name} (${rate.id})`);
    } catch (e: any) {
      console.error(`✗ Error seeding rate ${rate.id}:`, e.message);
    }
    await delay(200);
  }

  // 6. Feedback
  for (const fb of data.feedback || []) {
    try {
      await setDoc(doc(db, 'feedback', fb.id), fb);
      console.log(`✓ Seeded feedback: ${fb.id}`);
    } catch (e: any) {
      console.error(`✗ Error seeding feedback ${fb.id}:`, e.message);
    }
    await delay(200);
  }

  // 7. Weather
  if (data.weather) {
    try {
      await setDoc(doc(db, 'weather', data.weather.id || 'W001'), data.weather);
      console.log('✓ Seeded weather data');
    } catch (e: any) {
      console.error('✗ Error seeding weather:', e.message);
    }
    await delay(200);
  }

  // 8. Admins
  for (const user of data.users || []) {
    if (user.role === 'admin') {
      try {
        await setDoc(doc(db, 'admins', user.id), {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: new Date().toISOString()
        });
        console.log(`✓ Seeded admin: ${user.name} (${user.id})`);
      } catch (e: any) {
        console.error(`✗ Error seeding admin ${user.id}:`, e.message);
      }
      await delay(200);
    }
  }

  console.log('Finished seeding Firestore database.');
}

seedAll();
