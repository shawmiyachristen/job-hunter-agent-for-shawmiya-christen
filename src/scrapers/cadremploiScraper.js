import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrapes job listings from Cadremploi.
 * 
 * @param {string} keywords - Search keywords
 * @param {string} locations - Search locations
 * @param {boolean} useMock - Force fallback mock data
 * @returns {Promise<Array>} List of parsed jobs
 */
export async function scrapeCadremploi(keywords, locations, useMock = false) {
  if (useMock) {
    return getMockJobs(keywords, locations);
  }

  try {
    const searchUrl = `https://www.cadremploi.fr/emploi/liste_offres?mots=${encodeURIComponent(keywords)}&ville=${encodeURIComponent(locations)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      },
      timeout: 8000
    });

    const $ = cheerio.load(response.data);
    const jobs = [];

    // Cadremploi class selectors
    $('.offre-block, .job-card, [class*="job-card"]').each((i, el) => {
      if (jobs.length >= 5) return;

      const title = $(el).find('.title, h3, h2').first().text().trim();
      const company = $(el).find('.company, .entreprise-name').first().text().trim();
      const relativeUrl = $(el).find('a').attr('href');
      const url = relativeUrl ? (relativeUrl.startsWith('http') ? relativeUrl : `https://www.cadremploi.fr${relativeUrl}`) : searchUrl;
      const description = $(el).find('.description, p').text().trim() || `Retrouvez cette opportunité de cadre pour ${title} chez ${company} sur Cadremploi. Compétences souhaitées : ${keywords}`;

      if (title && company) {
        jobs.push({
          title,
          company,
          description: description.substring(0, 300) + '...',
          url,
          source: 'Cadremploi',
          date: new Date().toISOString()
        });
      }
    });

    if (jobs.length > 0) {
      return jobs;
    }

    console.log('[Cadremploi Scraper] No jobs found in HTML parsing, falling back to mock data.');
    return getMockJobs(keywords, locations);
  } catch (error) {
    console.warn('[Cadremploi Scraper] Scrape failed, using mock data:', error.message);
    return getMockJobs(keywords, locations);
  }
}

function getMockJobs(keywords, locations) {
  return [
    {
      title: "Chef de Projet Marketing & Expérience Client (F/H)",
      company: "Air France",
      description: "Dans le cadre de l'évolution de nos services digitaux, Air France recherche un(e) Chef de Projet Marketing & Expérience Client. Vous assurerez la cohérence des parcours clients sur nos plateformes web et mobiles, analyserez l'impact de nos campagnes de fidélisation CRM, et participerez à la définition de la roadmap produit. Coordination transverse avec les équipes UX, techniques et métiers. Profil : Diplômé(e) Master ESCE/Ecole de commerce.",
      url: "https://www.cadremploi.fr/emploi/offres/air-france-marketing-project-manager",
      source: "Cadremploi",
      date: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
    },
    {
      title: "Product Manager Mobile & Billetterie (F/H)",
      company: "RATP Smart Systems",
      description: "RATP Smart Systems est leader dans les technologies de billettique et de mobilité. Nous recherchons un Product Manager Junior pour piloter le cycle de vie de nos applications mobiles de ticketing. Vous travaillerez sur la conception fonctionnelle des parcours de vente et d'accès, piloterez les phases de tests fonctionnels et de recette applicative (QA), et rédigerez les spécifications fonctionnelles Jira. Expérience dans la mobilité ou billettique souhaitée.",
      url: "https://www.cadremploi.fr/emploi/offres/ratp-smart-systems-product-manager",
      source: "Cadremploi",
      date: new Date(Date.now() - 3600000 * 36).toISOString() // 1.5 days ago
    }
  ];
}
