import axios from 'axios';
import * as cheerio from 'cheerio';

const keywords = 'Product Manager';
const locations = 'Paris';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

async function testWttj() {
  const url = `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(keywords)}&refinementList%5Boffice.city%5D%5B%5D=${encodeURIComponent(locations)}`;
  console.log(`[WTTJ] Fetching live: ${url}`);
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'fr-FR,fr;q=0.9' },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    const jobs = [];
    $('article, li[data-testid="search-results-list-item"]').each((i, el) => {
      const title = $(el).find('h3, h4').first().text().trim();
      const company = $(el).find('span').first().text().trim();
      if (title && company) jobs.push({ title, company });
    });
    return { success: true, count: jobs.length, jobs, htmlLength: res.data.length };
  } catch (err) {
    return { success: false, error: err.message, status: err.response?.status, headers: err.response?.headers, isCloudflare: checkCloudflare(err) };
  }
}

async function testApec() {
  const url = `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${encodeURIComponent(keywords)}&lieux=${encodeURIComponent(locations)}`;
  console.log(`[APEC] Fetching live: ${url}`);
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    const jobs = [];
    $('.container-result, .card-body, .container-card').each((i, el) => {
      const title = $(el).find('h2, h3, .card-title').first().text().trim();
      const company = $(el).find('.card-subtitle, .entreprise, .company-name').first().text().trim();
      if (title && company) jobs.push({ title, company });
    });
    return { success: true, count: jobs.length, jobs, htmlLength: res.data.length };
  } catch (err) {
    return { success: false, error: err.message, status: err.response?.status, headers: err.response?.headers, isCloudflare: checkCloudflare(err) };
  }
}

async function testIndeed() {
  const url = `https://rss.indeed.com/rss?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(locations)}`;
  console.log(`[Indeed] Fetching live RSS: ${url}`);
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/xml,text/xml' },
      timeout: 8000
    });
    const $ = cheerio.load(res.data, { xmlMode: true });
    const jobs = [];
    $('item').each((i, el) => {
      const fullTitle = $(el).find('title').text().trim();
      const titleParts = fullTitle.split(' - ');
      const title = titleParts[0] || fullTitle;
      const company = titleParts[1] || 'Indeed Employer';
      if (title) jobs.push({ title, company });
    });
    return { success: true, count: jobs.length, jobs, htmlLength: res.data.length };
  } catch (err) {
    return { success: false, error: err.message, status: err.response?.status, headers: err.response?.headers, isCloudflare: checkCloudflare(err) };
  }
}

async function testJobteaser() {
  const url = `https://www.jobteaser.com/fr/job-offers?query=${encodeURIComponent(keywords)}&city_names%5B%5D=${encodeURIComponent(locations)}`;
  console.log(`[JobTeaser] Fetching live: ${url}`);
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    const jobs = [];
    $('.job-offer-card, [data-testid="job-offer-card"]').each((i, el) => {
      const title = $(el).find('h3, [data-testid="job-title"]').text().trim();
      const company = $(el).find('.company-name, [data-testid="company-name"]').text().trim();
      if (title && company) jobs.push({ title, company });
    });
    return { success: true, count: jobs.length, jobs, htmlLength: res.data.length };
  } catch (err) {
    return { success: false, error: err.message, status: err.response?.status, headers: err.response?.headers, isCloudflare: checkCloudflare(err) };
  }
}

async function testCadremploi() {
  const url = `https://www.cadremploi.fr/emploi/liste_offres?mots=${encodeURIComponent(keywords)}&ville=${encodeURIComponent(locations)}`;
  console.log(`[Cadremploi] Fetching live: ${url}`);
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    const jobs = [];
    $('.offre-block, .job-card, [class*="job-card"]').each((i, el) => {
      const title = $(el).find('.title, h3, h2').first().text().trim();
      const company = $(el).find('.company, .entreprise-name').first().text().trim();
      if (title && company) jobs.push({ title, company });
    });
    return { success: true, count: jobs.length, jobs, htmlLength: res.data.length };
  } catch (err) {
    return { success: false, error: err.message, status: err.response?.status, headers: err.response?.headers, isCloudflare: checkCloudflare(err) };
  }
}

function checkCloudflare(err) {
  const server = err.response?.headers?.['server'] || '';
  const body = err.response?.data || '';
  return server.toLowerCase().includes('cloudflare') || 
         body.includes('cf-ray') || 
         body.includes('cloudflare') || 
         err.response?.status === 403;
}

async function runLiveCheck() {
  console.log('==================================================');
  console.log('         LIVE JOB BOARD SCRAPER DIAGNOSTIC        ');
  console.log('==================================================\n');

  const wttj = await testWttj();
  console.log('Result:', wttj.success ? `SUCCESS (Parsed ${wttj.count} jobs)` : `FAILED: ${wttj.error} (Status: ${wttj.status}, Cloudflare Block: ${wttj.isCloudflare})`);
  if (wttj.success && wttj.count > 0) {
    console.log('Titles:', wttj.jobs.slice(0, 3).map(j => `  - "${j.title}" by ${j.company}`).join('\n'));
  }
  console.log('--------------------------------------------------\n');

  const apec = await testApec();
  console.log('Result:', apec.success ? `SUCCESS (Parsed ${apec.count} jobs)` : `FAILED: ${apec.error} (Status: ${apec.status}, Cloudflare Block: ${apec.isCloudflare})`);
  if (apec.success && apec.count > 0) {
    console.log('Titles:', apec.jobs.slice(0, 3).map(j => `  - "${j.title}" by ${j.company}`).join('\n'));
  }
  console.log('--------------------------------------------------\n');

  const indeed = await testIndeed();
  console.log('Result:', indeed.success ? `SUCCESS (Parsed ${indeed.count} jobs)` : `FAILED: ${indeed.error} (Status: ${indeed.status}, Cloudflare Block: ${indeed.isCloudflare})`);
  if (indeed.success && indeed.count > 0) {
    console.log('Titles:', indeed.jobs.slice(0, 3).map(j => `  - "${j.title}" by ${j.company}`).join('\n'));
  }
  console.log('--------------------------------------------------\n');

  const jobteaser = await testJobteaser();
  console.log('Result:', jobteaser.success ? `SUCCESS (Parsed ${jobteaser.count} jobs)` : `FAILED: ${jobteaser.error} (Status: ${jobteaser.status}, Cloudflare Block: ${jobteaser.isCloudflare})`);
  if (jobteaser.success && jobteaser.count > 0) {
    console.log('Titles:', jobteaser.jobs.slice(0, 3).map(j => `  - "${j.title}" by ${j.company}`).join('\n'));
  }
  console.log('--------------------------------------------------\n');

  const cadremploi = await testCadremploi();
  console.log('Result:', cadremploi.success ? `SUCCESS (Parsed ${cadremploi.count} jobs)` : `FAILED: ${cadremploi.error} (Status: ${cadremploi.status}, Cloudflare Block: ${cadremploi.isCloudflare})`);
  if (cadremploi.success && cadremploi.count > 0) {
    console.log('Titles:', cadremploi.jobs.slice(0, 3).map(j => `  - "${j.title}" by ${j.company}`).join('\n'));
  }
  console.log('==================================================');
}

runLiveCheck();
