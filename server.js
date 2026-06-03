import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import fs from 'fs';
import apiRouter from './src/routes/api.js';
import db from './src/models/db.js';
import { initScheduler } from './src/services/schedulerService.js';
import { parseCV } from './src/services/cvParserService.js';
import { analyzeCV } from './src/services/geminiService.js';
import { runCrawlAndMatch } from './src/scrapers/scraperManager.js';

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount API router
app.use('/api', apiRouter);

// Log server start parameters
db.addLog(`Server starting in ${process.env.NODE_ENV || 'development'} mode...`);

// Initialize local cron job scheduler
try {
  initScheduler();
} catch (error) {
  console.error('Error starting cron scheduler on startup:', error);
  db.addLog(`Failed to start local cron scheduler: ${error.message}`);
}

// Fallback all non-API GET requests to serving the index.html SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Auto startup task: parse local PDF and run crawl/matching
async function performAutoStartupTask() {
  const localCVPath = path.join(__dirname, 'CV VF Shawmiya CHRISTEN VASEEKARAN.pdf');
  
  if (fs.existsSync(localCVPath)) {
    db.addLog('Detected local CV PDF file: "CV VF Shawmiya CHRISTEN VASEEKARAN.pdf". Checking parsed status...');
    try {
      // 1. Read PDF locally to extract text (zero API cost)
      const buffer = fs.readFileSync(localCVPath);
      const cvText = await parseCV(buffer, 'application/pdf', 'CV VF Shawmiya CHRISTEN VASEEKARAN.pdf');
      
      const currentCV = db.getCV();
      const needsReparse = !currentCV || !currentCV.text || currentCV.text.trim() !== cvText.trim();
      
      if (needsReparse) {
        db.addLog('Local CV text is new or modified. Re-analyzing with Gemini...');
        const parsedProfile = await analyzeCV(cvText);
        db.saveCV('CV VF Shawmiya CHRISTEN VASEEKARAN.pdf', cvText, parsedProfile);
        db.addLog('Local CV parsed and saved to database.');
        
        // Reset jobs and matches to ensure compatibility matches are updated for the new CV
        db.data.jobs = [];
        db.data.matches = {};
        db.save();
      } else {
        db.addLog('Local CV is already up-to-date in database.');
      }
      
      // 2. Pre-populate jobs and matches if empty
      const jobs = db.getJobs();
      const matches = db.getMatches();
      
      if (jobs.length === 0 || Object.keys(matches).length === 0) {
        db.addLog('No job listings or AI matches found in database. Running auto crawler and matcher...');
        
        // Enforce settings for Product Manager presentation
        db.saveSettings({ 
          keywords: 'Chef de produit, Product Manager',
          locations: 'Paris, Remote',
          mockScraping: true 
        });
        
        // Run crawler
        await runCrawlAndMatch();
        db.addLog('Dashboard successfully pre-populated with parsed CV, job matches, and cover letters.');
      } else {
        db.addLog('Dashboard is already populated with job matches.');
      }
    } catch (error) {
      console.error('Auto startup task failed:', error);
      db.addLog(`Auto startup task failed: ${error.message}`);
    }
  } else {
    db.addLog('No local CV PDF found at root. Auto-startup task skipped.');
  }
}

// Start listening
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  db.addLog(`Server successfully listening on port ${PORT}`);
  
  // Run auto startup tasks asynchronously so we don't block server listen
  performAutoStartupTask();
});

export default app;
