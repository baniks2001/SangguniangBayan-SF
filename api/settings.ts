// Serverless function to fetch system settings
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './_lib/mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('settings');

    // Get all public settings
    const settings = await collection.find({}).toArray();
    
    // Convert to key-value object
    const settingsMap: any = {};
    settings.forEach((setting: any) => {
      settingsMap[setting.key] = setting.value;
    });

    // Default settings if not found
    const defaultSettings = {
      municipalityName: 'San Francisco',
      provinceName: 'Southern Leyte',
      sbTitle: 'Sangguniang Bayan',
      officeLocation: 'Municipal Hall, San Francisco, Southern Leyte',
      contactEmail: 'sb.sanfrancisco@gmail.com',
      contactPhone: '(053) 514-1234',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
      ...settingsMap
    };

    res.status(200).json({ settings: defaultSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}
