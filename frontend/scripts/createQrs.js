import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createQRCode } from '../src/lib/qr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';
const CLIENT_DOMAIN = process.env.CLIENT_DOMAIN || 'https://hacktech.gtap.ro';

async function generateQRCodes() {
  try {
    console.log(`Fetching checkpoints from ${API_URL}/api/checkpoints...`);
    const res = await fetch(`${API_URL}/api/checkpoints`);
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch checkpoints');
    
    const checkpoints = json.data;
    const outputDir = path.resolve(__dirname, '../qrcodes');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    if (!Array.isArray(checkpoints) || checkpoints.length === 0) {
        console.log('No checkpoints found.');
        return;
    }

    const mainOutputPath = path.join(outputDir, 'main.png');
    await createQRCode(CLIENT_DOMAIN, mainOutputPath);
    console.log(`Generated QR code for Main Domain:`);
    console.log(` -> URL: ${CLIENT_DOMAIN}`);
    console.log(` -> Saved to: ${mainOutputPath}\n`);

    for (const cp of checkpoints) {
      const clientPath = `${CLIENT_DOMAIN}/verify/${cp.id}`;
      const outputPath = path.join(outputDir, `${cp.id}.png`);
      
      await createQRCode(clientPath, outputPath);
      console.log(`Generated QR code for ${cp.label}:`);
      console.log(` -> URL: ${clientPath}`);
      console.log(` -> Saved to: ${outputPath}\n`);
    }
    console.log('Successfully generated all QR codes!');
  } catch (error) {
    console.error('Error generating QR codes:', error.message);
    console.error('Ensure that the backend server is running and accessible at API_URL.');
  }
}

generateQRCodes();
