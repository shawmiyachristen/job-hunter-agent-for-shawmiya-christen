import cron from 'node-cron';
import db from '../models/db.js';
import { runCrawlAndMatch } from '../scrapers/scraperManager.js';

let cronJob = null;

/**
 * Initializes the background node-cron scheduler.
 * Stops any existing job and registers a new one based on the database settings.
 */
export function initScheduler() {
  const settings = db.getSettings();
  const schedule = settings.cronSchedule || '0 */6 * * *';
  
  db.addLog(`Initializing automatic job hunter scheduler with pattern: "${schedule}"`);
  
  if (cronJob) {
    cronJob.stop();
    db.addLog('Stopped previous scheduled cron job.');
  }
  
  try {
    cronJob = cron.schedule(schedule, async () => {
      db.addLog('Scheduled automatic cron job triggered.');
      try {
        await runJobHunterCycle();
      } catch (error) {
        db.addLog(`Automatic scheduled cron cycle encountered error: ${error.message}`);
      }
    });
    db.addLog('Scheduled cron job successfully loaded.');
  } catch (err) {
    db.addLog(`Failed to load cron schedule: ${err.message}`);
  }
}

/**
 * Updates the cron schedule pattern dynamically.
 * Saves the settings and re-initializes the scheduler.
 * 
 * @param {string} newPattern - A standard 5-field cron pattern
 */
export function updateSchedulerPattern(newPattern) {
  if (!cron.validate(newPattern)) {
    throw new Error(`Invalid cron expression format: "${newPattern}". Must be a standard 5-field cron expression.`);
  }
  
  db.saveSettings({ cronSchedule: newPattern });
  initScheduler();
}

/**
 * Executes a full job hunting cycle:
 * 1. Set progress flag to block overlapping runs.
 * 2. Invoke the Scraper Manager to crawl the 5 job boards.
 * 3. Match new jobs with the candidate's CV using the Gemini AI service.
 * 4. Store all results and clear the progress flag.
 * 
 * @returns {Promise<Object>} Results summary
 */
export async function runJobHunterCycle() {
  const settings = db.getSettings();
  
  if (settings.manualSearchInProgress) {
    db.addLog('Job search process is already running. Skipping execution to avoid overlap.');
    return { status: 'skipped', reason: 'already_running' };
  }
  
  // Set running flag
  db.saveSettings({ manualSearchInProgress: true });
  db.addLog('Starting Job Hunter agent cycle...');
  
  try {
    const results = await runCrawlAndMatch();
    db.addLog(`Job Hunter agent cycle finished. Crawled: ${results.jobsFound} jobs, Analyzed: ${results.jobsMatched} matches.`);
    db.saveSettings({ manualSearchInProgress: false });
    return results;
  } catch (error) {
    db.addLog(`Job Hunter agent cycle failed: ${error.message}`);
    db.saveSettings({ manualSearchInProgress: false });
    throw error;
  }
}
