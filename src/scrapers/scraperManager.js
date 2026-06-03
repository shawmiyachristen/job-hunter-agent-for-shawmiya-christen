import db from '../models/db.js';
import { scrapeWttj } from './wttjScraper.js';
import { scrapeApec } from './apecScraper.js';
import { scrapeIndeed } from './indeedScraper.js';
import { scrapeJobteaser } from './jobteaserScraper.js';
import { scrapeCadremploi } from './cadremploiScraper.js';
import { compareJobWithCV } from '../services/geminiService.js';

/**
 * Orchestrates job scraping across the five sources and matches them with CV.
 * 
 * @returns {Promise<Object>} Object containing counts of crawled and matched jobs.
 */
export async function runCrawlAndMatch() {
  const settings = db.getSettings();
  const keywords = settings.keywords || 'Node.js Developer';
  const locations = settings.locations || 'Paris';
  const forceMock = settings.mockScraping;

  db.addLog(`Starting crawlers for keywords: "${keywords}" | location: "${locations}" (Mock Mode: ${forceMock})`);

  // Run all scrapers in parallel (settled ensures failures on one site don't break others)
  const crawlPromises = [
    scrapeWttj(keywords, locations, forceMock).catch(err => {
      db.addLog(`Welcome to the Jungle crawl error: ${err.message}`);
      return [];
    }),
    scrapeApec(keywords, locations, forceMock).catch(err => {
      db.addLog(`APEC crawl error: ${err.message}`);
      return [];
    }),
    scrapeIndeed(keywords, locations, forceMock).catch(err => {
      db.addLog(`Indeed crawl error: ${err.message}`);
      return [];
    }),
    scrapeJobteaser(keywords, locations, forceMock).catch(err => {
      db.addLog(`JobTeaser crawl error: ${err.message}`);
      return [];
    }),
    scrapeCadremploi(keywords, locations, forceMock).catch(err => {
      db.addLog(`Cadremploi crawl error: ${err.message}`);
      return [];
    })
  ];

  const results = await Promise.allSettled(crawlPromises);
  
  const crawledJobs = [];
  results.forEach((result, idx) => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      crawledJobs.push(...result.value);
    }
  });

  db.addLog(`Crawlers finished. Retrieved total of ${crawledJobs.length} job postings.`);

  if (crawledJobs.length === 0) {
    return { jobsFound: 0, jobsMatched: 0 };
  }

  // Save the jobs to the database
  db.saveJobs(crawledJobs);
  
  // Get updated jobs list with generated IDs
  const allStoredJobs = db.getJobs();
  const cv = db.getCV();

  if (!cv || !cv.text) {
    db.addLog('No CV has been uploaded yet. Skipping AI compatibility analysis. (Upload your CV to see scores!)');
    return { jobsFound: crawledJobs.length, jobsMatched: 0 };
  }

  // Identify which jobs are new and need Gemini AI comparison
  const existingMatches = db.getMatches();
  const jobsToMatch = allStoredJobs.filter(job => {
    // Only match jobs retrieved in this crawl run
    const isFromThisRun = crawledJobs.some(cj => (cj.url || cj.id) === (job.url || job.id));
    return isFromThisRun && !existingMatches[job.id];
  });

  db.addLog(`Found ${jobsToMatch.length} new jobs requiring compatibility matching...`);

  let matchedCount = 0;
  for (const job of jobsToMatch) {
    try {
      db.addLog(`Matching job: "${job.title}" at ${job.company} via Gemini...`);
      
      const analysis = await compareJobWithCV(
        cv.text,
        job.title,
        job.company,
        job.description
      );

      db.saveMatch(job.id, analysis);
      matchedCount++;
    } catch (err) {
      db.addLog(`Failed to match job "${job.title}" (ID: ${job.id}): ${err.message}`);
    }
  }

  return {
    jobsFound: crawledJobs.length,
    jobsMatched: matchedCount
  };
}
