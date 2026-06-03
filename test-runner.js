import db from './src/models/db.js';
import { parseCV } from './src/services/cvParserService.js';
import { analyzeCV, compareJobWithCV } from './src/services/geminiService.js';
import { scrapeWttj } from './src/scrapers/wttjScraper.js';
import { scrapeApec } from './src/scrapers/apecScraper.js';
import { scrapeIndeed } from './src/scrapers/indeedScraper.js';
import { scrapeJobteaser } from './src/scrapers/jobteaserScraper.js';
import { scrapeCadremploi } from './src/scrapers/cadremploiScraper.js';
import { runCrawlAndMatch } from './src/scrapers/scraperManager.js';

async function runTests() {
  console.log('========================================');
  console.log('       JOB HUNTER AGENT SELF-TESTS      ');
  console.log('========================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Test 1: Database Operations
  try {
    console.log('\n--- 1. Testing Database Manager ---');
    db.init();
    db.addLog('Running automated verification suite...');
    const logs = db.getLogs();
    assert(logs.length > 0, 'Database logging is functioning.');
    
    const settings = db.getSettings();
    assert(settings && typeof settings.keywords === 'string', 'Database loaded default settings.');
    
    db.saveSettings({ keywords: 'Test Verification Keywords' });
    const updatedSettings = db.getSettings();
    assert(updatedSettings.keywords === 'Test Verification Keywords', 'Database settings saving works.');
  } catch (err) {
    console.error('[ERROR] Database test failed:', err);
    failed++;
  }

  // Test 2: CV Parsing Logic
  try {
    console.log('\n--- 2. Testing CV Text Parser ---');
    const mockTxtBuffer = Buffer.from('My resume text containing Javascript, Node, React.');
    const text = await parseCV(mockTxtBuffer, 'text/plain', 'test_resume.txt');
    assert(text.includes('resume text'), 'CV parser successfully extracted text from text buffer.');
    
    try {
      await parseCV(Buffer.from(''), 'application/pdf', 'empty.pdf');
      assert(false, 'CV parser should throw an error on empty PDF file.');
    } catch (e) {
      assert(true, `CV parser threw expected error for empty files: "${e.message}"`);
    }
  } catch (err) {
    console.error('[ERROR] CV Parser test failed:', err);
    failed++;
  }

  // Test 3: Gemini Analysis and Comparison (validating structures)
  try {
    console.log('\n--- 3. Testing Gemini AI Service ---');
    const testCV = 'Shawmiya Christen. Fullstack developer. Skills: Node.js, Express, Javascript, Git.';
    
    console.log('Analyzing test CV...');
    const cvAnalysis = await analyzeCV(testCV);
    assert(cvAnalysis && typeof cvAnalysis.name === 'string', 'Gemini CV analyzer returned structured name.');
    assert(cvAnalysis.skills && Array.isArray(cvAnalysis.skills.technical), 'Gemini CV analyzer structured technical skills array.');

    console.log('Comparing CV with mock job description...');
    const jobComparison = await compareJobWithCV(
      testCV,
      'Backend Engineer (Node.js)',
      'Innovative Lab Ltd',
      'We need a developer with experience in Node.js, Express, databases and git workflows.'
    );
    
    assert(jobComparison && typeof jobComparison.score === 'number', 'Gemini matcher yielded numerical compatibility score.');
    assert(jobComparison.score >= 1 && jobComparison.score <= 10, 'Compatibility score fits range (1 to 10).');
    assert(Array.isArray(jobComparison.matchingSkills), 'Matching skills is returned as array.');
    assert(Array.isArray(jobComparison.missingSkills), 'Missing skills is returned as array.');
    assert(typeof jobComparison.coverLetter === 'string' && jobComparison.coverLetter.length > 50, 'Personalized cover letter generated.');
    assert(Array.isArray(jobComparison.cvImprovements), 'CV improvements list is returned as array.');
  } catch (err) {
    console.error('[ERROR] Gemini service test failed:', err);
    failed++;
  }

  // Test 4: Job Crawler Modules (Testing Scraper Return Schemas)
  try {
    console.log('\n--- 4. Testing Scraper Modules (Mock Fallback Modes) ---');
    const wttjJobs = await scrapeWttj('Node.js', 'Paris', true);
    assert(wttjJobs.length > 0, 'Welcome to the Jungle scraper returned job results.');
    assert(wttjJobs[0].source === 'Welcome to the Jungle', 'Welcome to the Jungle jobs labeled correctly.');

    const apecJobs = await scrapeApec('React', 'Paris', true);
    assert(apecJobs.length > 0, 'APEC scraper returned job results.');
    assert(apecJobs[0].source === 'APEC', 'APEC jobs labeled correctly.');

    const indeedJobs = await scrapeIndeed('Javascript', 'Remote', true);
    assert(indeedJobs.length > 0, 'Indeed RSS scraper returned job results.');
    assert(indeedJobs[0].source === 'Indeed', 'Indeed jobs labeled correctly.');

    const jtJobs = await scrapeJobteaser('Node.js', 'Paris', true);
    assert(jtJobs.length > 0, 'JobTeaser scraper returned job results.');
    assert(jtJobs[0].source === 'JobTeaser', 'JobTeaser jobs labeled correctly.');

    const ceJobs = await scrapeCadremploi('Express', 'Lyon', true);
    assert(ceJobs.length > 0, 'Cadremploi scraper returned job results.');
    assert(ceJobs[0].source === 'Cadremploi', 'Cadremploi jobs labeled correctly.');
    
    // Check fields presence
    const sampleJob = wttjJobs[0];
    assert(
      sampleJob.title && sampleJob.company && sampleJob.description && sampleJob.url && sampleJob.date,
      'Jobs object complies with required schema (title, company, description, url, date).'
    );
  } catch (err) {
    console.error('[ERROR] Scrapers test failed:', err);
    failed++;
  }

  // Test 5: Scraper Manager Cycle
  try {
    console.log('\n--- 5. Testing Scraper Manager Orchestrator ---');
    // Pre-populate dummy CV to trigger matching loop
    db.saveCV('test_filename.txt', 'Name: Shawmiya Christen. Skills: Node.js, Javascript, Express, Git.', {
      name: 'Shawmiya Christen',
      skills: { technical: ['Node.js', 'Javascript', 'Express'], soft: ['Teamwork'], tools: ['Git'] }
    });
    
    db.saveSettings({ mockScraping: true }); // Ensure mocks are active
    
    console.log('Running scraper manager...');
    const results = await runCrawlAndMatch();
    
    assert(results && typeof results.jobsFound === 'number', 'Scraper manager returned jobsFound count.');
    assert(typeof results.jobsMatched === 'number', 'Scraper manager returned jobsMatched count.');
    
    const storedJobs = db.getJobs();
    assert(storedJobs.length > 0, 'Jobs successfully persisted into the DB store.');
    
    const matches = db.getMatches();
    assert(Object.keys(matches).length > 0, 'AI Matches successfully written into the DB match table.');
  } catch (err) {
    console.error('[ERROR] Scraper Manager test failed:', err);
    failed++;
  }

  console.log('\n========================================');
  console.log('            VERIFICATION SUMMARY         ');
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All core modules are verified and operational! 🚀');
    process.exit(0);
  }
}

runTests();
