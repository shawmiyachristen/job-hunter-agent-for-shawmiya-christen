import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database file in a writable folder or in temp dir on Vercel
const isVercel = process.env.VERCEL || process.env.NOW_BUILDER || process.env.EPHEMERAL_DB === 'true';
const DATA_DIR = isVercel 
  ? '/tmp' 
  : path.join(__dirname, '../../data');

const DB_PATH = path.join(DATA_DIR, 'db.json');

// Default database state
const DEFAULT_STATE = {
  cv: {
    filename: '',
    text: '',
    parsedData: null,
    lastUpdated: null
  },
  jobs: [],
  matches: {}, // job_id -> match analysis results
  settings: {
    keywords: 'Javascript Node Express Developer',
    locations: 'Paris, Remote',
    cronSchedule: '0 */6 * * *', // runs 4 times per day by default
    manualSearchInProgress: false,
    mockScraping: true // Defaults to true to ensure demo works out-of-the-box
  },
  logs: []
};

class Database {
  constructor() {
    this.data = { ...DEFAULT_STATE };
    this.init();
  }

  init() {
    try {
      if (!isVercel && !fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
        
        // Ensure standard structure is present
        this.data = {
          ...DEFAULT_STATE,
          ...this.data,
          settings: { ...DEFAULT_STATE.settings, ...this.data.settings }
        };
      } else {
        this.save();
      }
    } catch (error) {
      console.error('Error initializing database, using in-memory fallback:', error);
      this.data = { ...DEFAULT_STATE };
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      // In serverless environments, writing might fail, which is okay as long as in-memory state works
      console.warn('Failed to persist database file (normal on serverless/read-only environments):', error.message);
    }
  }

  // Getters & Setters
  getCV() {
    return this.data.cv;
  }

  saveCV(filename, text, parsedData = null) {
    this.data.cv = {
      filename,
      text,
      parsedData,
      lastUpdated: new Date().toISOString()
    };
    this.save();
    this.addLog(`CV uploaded: ${filename}`);
  }

  getJobs() {
    return this.data.jobs || [];
  }

  saveJobs(newJobs) {
    // Merge jobs by unique URL or ID to avoid duplicates
    const existingJobs = this.getJobs();
    const jobMap = new Map(existingJobs.map(job => [job.url || job.id, job]));

    newJobs.forEach(job => {
      const uniqueKey = job.url || job.id;
      if (jobMap.has(uniqueKey)) {
        // Update existing job
        jobMap.set(uniqueKey, { ...jobMap.get(uniqueKey), ...job });
      } else {
        // Insert new job
        jobMap.set(uniqueKey, { ...job, id: job.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, crawledAt: new Date().toISOString() });
      }
    });

    this.data.jobs = Array.from(jobMap.values());
    this.save();
  }

  getJob(jobId) {
    return this.getJobs().find(j => j.id === jobId);
  }

  getMatches() {
    return this.data.matches || {};
  }

  getMatch(jobId) {
    return this.data.matches[jobId] || null;
  }

  saveMatch(jobId, matchResults) {
    this.data.matches[jobId] = {
      ...matchResults,
      analyzedAt: new Date().toISOString()
    };
    this.save();
  }

  getSettings() {
    return this.data.settings;
  }

  saveSettings(newSettings) {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings
    };
    this.save();
    this.addLog('Settings updated');
  }

  getLogs() {
    return this.data.logs || [];
  }

  addLog(message) {
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      message
    };
    this.data.logs = this.data.logs || [];
    this.data.logs.push(logEntry);
    
    // Keep last 200 logs
    if (this.data.logs.length > 200) {
      this.data.logs.shift();
    }
    
    this.save();
    console.log(`[Job Hunter Log] ${logEntry.timestamp} - ${message}`);
  }

  clearLogs() {
    this.data.logs = [];
    this.save();
  }
}

const db = new Database();
export default db;
