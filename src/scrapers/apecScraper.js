import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrapes job listings from APEC.
 * 
 * @param {string} keywords - Search keywords
 * @param {string} locations - Search locations
 * @param {boolean} useMock - Force fallback mock data
 * @returns {Promise<Array>} List of parsed jobs
 */
export async function scrapeApec(keywords, locations, useMock = false) {
  if (useMock) {
    return getMockJobs(keywords, locations);
  }

  try {
    const searchUrl = `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${encodeURIComponent(keywords)}&lieux=${encodeURIComponent(locations)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      },
      timeout: 8000
    });

    const $ = cheerio.load(response.data);
    const jobs = [];

    // APEC jobs are typically under elements with class like "container-result" or specific card containers
    $('.container-result, .card-body, .container-card').each((i, el) => {
      if (jobs.length >= 5) return;

      const title = $(el).find('h2, h3, .card-title').first().text().trim();
      const company = $(el).find('.card-subtitle, .entreprise, .company-name').first().text().trim();
      const relativeUrl = $(el).find('a').attr('href');
      const url = relativeUrl ? (relativeUrl.startsWith('http') ? relativeUrl : `https://www.apec.fr${relativeUrl}`) : searchUrl;
      const description = $(el).find('.card-text, .description').text().trim() || `Description complète du poste sur le site de l'APEC. Mots-clés : ${keywords}`;

      if (title && company && title.length > 3) {
        jobs.push({
          title,
          company,
          description: description.substring(0, 300) + '...',
          url,
          source: 'APEC',
          date: new Date().toISOString()
        });
      }
    });

    if (jobs.length > 0) {
      return jobs;
    }

    console.log('[APEC Scraper] No jobs found in HTML parsing, falling back to mock data.');
    return getMockJobs(keywords, locations);
  } catch (error) {
    console.warn('[APEC Scraper] Scrape failed, using mock data:', error.message);
    return getMockJobs(keywords, locations);
  }
}

function getMockJobs(keywords, locations) {
  return [
    {
      title: "Chef de Projet Digital / CRM (F/H)",
      company: "Orange Business Services",
      description: "Au sein de nos équipes à Paris, vous serez en charge de coordonner les projets de campagnes marketing CRM, d'enrichir les bases de données et de planifier les lancements de produits digitaux B2B/B2C. Une formation supérieure type Master en Consumer Marketing (ESCE) ou similaire est vivement appréciée.",
      url: "https://www.apec.fr/candidat/recherche-emploi.html/emploi/orange-business-project-manager",
      source: "APEC",
      date: new Date(Date.now() - 3600000 * 6).toISOString()
    },
    {
      title: "Product Owner Junior - Event Tech & Billetterie",
      company: "FNAC Darty",
      description: "Rattaché(e) au Head of Product, vous interviendrez sur notre solution de billetterie dématérialisée. Vos missions : rédaction des spécifications fonctionnelles, conception de parcours utilisateurs, participation aux tests fonctionnels avant lancement et gestion de tickets Jira. Profil autonome avec un esprit d'équipe.",
      url: "https://www.apec.fr/candidat/recherche-emploi.html/emploi/fnac-darty-product-owner-junior",
      source: "APEC",
      date: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ];
}
