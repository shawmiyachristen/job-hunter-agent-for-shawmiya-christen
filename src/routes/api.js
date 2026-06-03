import express from 'express';
import multer from 'multer';
import db from '../models/db.js';
import { parseCV } from '../services/cvParserService.js';
import { analyzeCV, getIsDemoMode } from '../services/geminiService.js';
import { runJobHunterCycle, updateSchedulerPattern } from '../services/schedulerService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * GET /api/stats
 * Returns overall statistics for the dashboard
 */
router.get('/stats', (req, res) => {
  try {
    const jobs = db.getJobs();
    const matches = db.getMatches();
    const cv = db.getCV();
    const settings = db.getSettings();

    const matchesArray = Object.values(matches);
    const totalMatched = matchesArray.length;
    const avgScore = totalMatched > 0 
      ? (matchesArray.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalMatched).toFixed(1)
      : 0;

    const stats = {
      jobsFound: jobs.length,
      jobsAnalyzed: totalMatched,
      averageScore: parseFloat(avgScore),
      hasCV: !!(cv && cv.text),
      cvFilename: cv ? cv.filename : null,
      cvLastUpdated: cv ? cv.lastUpdated : null,
      cronSchedule: settings.cronSchedule,
      manualSearchInProgress: settings.manualSearchInProgress,
      isDemoMode: getIsDemoMode()
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cv/upload
 * Handles PDF/Word CV file upload, parses content, analyzes with Gemini, and saves to DB.
 */
router.post('/cv/upload', upload.single('cv'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const { buffer, originalname, mimetype } = req.file;
    db.addLog(`Processing upload of CV: "${originalname}" (${mimetype})`);

    // 1. Extract raw text from document
    const cvText = await parseCV(buffer, mimetype, originalname);
    
    // 2. Feed text to Gemini for structured extraction (name, summary, skills)
    db.addLog('Extracting structured profile data using Gemini...');
    const parsedProfile = await analyzeCV(cvText);

    // 3. Save to database
    db.saveCV(originalname, cvText, parsedProfile);

    res.json({
      success: true,
      filename: originalname,
      profile: parsedProfile
    });
  } catch (error) {
    db.addLog(`CV parsing or analysis failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cv
 * Returns the current CV state
 */
router.get('/cv', (req, res) => {
  res.json(db.getCV());
});

/**
 * GET /api/jobs
 * Returns a list of jobs, optionally merged with match results.
 */
router.get('/jobs', (req, res) => {
  try {
    const jobs = db.getJobs();
    const matches = db.getMatches();

    // Attach match details directly to each job response
    const enrichedJobs = jobs.map(job => ({
      ...job,
      match: matches[job.id] || null
    }));

    // Sort: jobs with matches and higher scores first, then crawled date
    enrichedJobs.sort((a, b) => {
      if (a.match && b.match) {
        return b.match.score - a.match.score;
      }
      if (a.match && !b.match) return -1;
      if (!a.match && b.match) return 1;
      return new Date(b.crawledAt) - new Date(a.crawledAt);
    });

    res.json(enrichedJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jobs/:id
 * Returns a single job details along with its match analysis
 */
router.get('/jobs/:id', (req, res) => {
  const job = db.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const match = db.getMatch(job.id);
  res.json({
    ...job,
    match
  });
});

/**
 * GET /api/settings
 * Retrieve user configuration settings
 */
router.get('/settings', (req, res) => {
  res.json(db.getSettings());
});

/**
 * POST /api/settings
 * Updates search configuration and cron schedule
 */
router.post('/settings', (req, res) => {
  try {
    const { keywords, locations, cronSchedule, mockScraping } = req.body;
    const updates = {};

    if (keywords !== undefined) updates.keywords = keywords.trim();
    if (locations !== undefined) updates.locations = locations.trim();
    if (mockScraping !== undefined) updates.mockScraping = !!mockScraping;
    
    db.saveSettings(updates);

    if (cronSchedule !== undefined && cronSchedule.trim() !== '') {
      updateSchedulerPattern(cronSchedule.trim());
    }

    res.json({ success: true, settings: db.getSettings() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/logs
 * Retrieve execution logs
 */
router.get('/logs', (req, res) => {
  res.json(db.getLogs());
});

/**
 * DELETE /api/logs
 * Clears execution logs
 */
router.delete('/logs', (req, res) => {
  db.clearLogs();
  res.json({ success: true });
});

/**
 * POST /api/search/run
 * Manual trigger endpoint to run job search cycle in background
 */
router.post('/search/run', (req, res) => {
  const settings = db.getSettings();
  if (settings.manualSearchInProgress) {
    return res.status(409).json({ error: 'Search cycle is already running.' });
  }

  // Trigger asynchronously in the background so request doesn't timeout
  runJobHunterCycle()
    .then(results => {
      console.log('Background manual job hunt completed:', results);
    })
    .catch(err => {
      console.error('Background manual job hunt failed:', err);
    });

  res.json({ success: true, message: 'Job search cycle triggered in background.' });
});

/**
 * GET /api/cron
 * Cron webhook endpoint (secured by CRON_SECRET or secret query parameter)
 * Executed 4 times per day on Vercel
 */
router.get('/cron', async (req, res) => {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET || 'dev_cron_secret_token';

  if (secret !== expectedSecret) {
    db.addLog('Unauthorized cron request attempt blocked.');
    return res.status(401).json({ error: 'Unauthorized cron trigger.' });
  }

  db.addLog('Web-hook API cron job triggered.');
  try {
    const results = await runJobHunterCycle();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
