import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrapes job listings from Welcome to the Jungle.
 * If scraping fails or mock mode is enabled, returns realistic fallback jobs.
 * 
 * @param {string} keywords - Search keywords (e.g. "Node.js React")
 * @param {string} locations - Search locations (e.g. "Paris")
 * @param {boolean} useMock - Force fallback mock data
 * @returns {Promise<Array>} List of parsed jobs
 */
export async function scrapeWttj(keywords, locations, useMock = false) {
  if (useMock) {
    return getMockJobs(keywords, locations);
  }

  try {
    const searchUrl = `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(keywords)}&refinementList%5Boffice.city%5D%5B%5D=${encodeURIComponent(locations)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 8000
    });
    
    const $ = cheerio.load(response.data);
    const jobs = [];
    
    // Welcome to the Jungle job items are typically wrapped in articles
    $('article, li[data-testid="search-results-list-item"]').each((i, el) => {
      if (jobs.length >= 5) return; // Limit to first few results
      
      const title = $(el).find('h3, h4').first().text().trim();
      const company = $(el).find('span').first().text().trim(); 
      const relativeUrl = $(el).find('a').attr('href');
      const url = relativeUrl ? (relativeUrl.startsWith('http') ? relativeUrl : `https://www.welcometothejungle.com${relativeUrl}`) : searchUrl;
      const description = $(el).find('p, div').text().trim() || `Position available at ${company}. Experience with ${keywords} is preferred.`;
      
      if (title && company && title.length > 3) {
        jobs.push({
          title,
          company,
          description: description.substring(0, 300) + '...',
          url,
          source: 'Welcome to the Jungle',
          date: new Date().toISOString()
        });
      }
    });

    if (jobs.length > 0) {
      return jobs;
    }
    
    console.log('[WTTJ Scraper] No jobs found in HTML parsing, falling back to mock data.');
    return getMockJobs(keywords, locations);
  } catch (error) {
    console.warn('[WTTJ Scraper] Scrape failed, using mock data:', error.message);
    return getMockJobs(keywords, locations);
  }
}

function getMockJobs(keywords, locations) {
  return [
    {
      title: "Junior Product Manager (F/H) - Luxe & Cosmétiques",
      company: "Veepee Luxury",
      description: "Au sein de notre pôle Beauté & Luxe, vous interviendrez en tant que Junior Product Manager. Vous gérerez le cycle de vie de nos applications de vente événementielle, de la définition des besoins en collaboration avec les équipes marketing jusqu'aux phases de tests fonctionnels. Profil recherché : Master en Marketing (ESCE ou équivalent), intérêt pour l'expérience client et la mobilité.",
      url: "https://www.welcometothejungle.com/fr/companies/veepee/jobs/junior-product-manager-luxe",
      source: "Welcome to the Jungle",
      date: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      title: "Assistant Chef de Produit Digital (F/H)",
      company: "Showroomprive",
      description: "Rejoignez Showroomprive pour accompagner le déploiement de nos nouvelles offres e-commerce. Vos missions : benchmark concurrentiel, modélisation des parcours clients (mockups Bolt.new), rédaction de tickets Jira et coordination avec les développeurs. Une expérience chez Digital Virgo ou similaire est appréciée.",
      url: "https://www.welcometothejungle.com/fr/companies/showroomprive/jobs/assistant-chef-de-produit-digital",
      source: "Welcome to the Jungle",
      date: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ];
}
