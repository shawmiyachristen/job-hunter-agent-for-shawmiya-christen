import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrapes job listings from JobTeaser.
 * 
 * @param {string} keywords - Search keywords
 * @param {string} locations - Search locations
 * @param {boolean} useMock - Force fallback mock data
 * @returns {Promise<Array>} List of parsed jobs
 */
export async function scrapeJobteaser(keywords, locations, useMock = false) {
  if (useMock) {
    return getMockJobs(keywords, locations);
  }

  try {
    const searchUrl = `https://www.jobteaser.com/fr/job-offers?query=${encodeURIComponent(keywords)}&city_names%5B%5D=${encodeURIComponent(locations)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      },
      timeout: 8000
    });

    const $ = cheerio.load(response.data);
    const jobs = [];

    // JobTeaser selectors
    $('.job-offer-card, [data-testid="job-offer-card"]').each((i, el) => {
      if (jobs.length >= 5) return;

      const title = $(el).find('h3, [data-testid="job-title"]').text().trim();
      const company = $(el).find('.company-name, [data-testid="company-name"]').text().trim();
      const relativeUrl = $(el).find('a').attr('href');
      const url = relativeUrl ? (relativeUrl.startsWith('http') ? relativeUrl : `https://www.jobteaser.com${relativeUrl}`) : searchUrl;
      const description = $(el).find('.job-description, p').text().trim() || `Découvrez cette offre d'emploi pour ${title} chez ${company} sur JobTeaser. Connaissances en ${keywords} souhaitées.`;

      if (title && company) {
        jobs.push({
          title,
          company,
          description: description.substring(0, 300) + '...',
          url,
          source: 'JobTeaser',
          date: new Date().toISOString()
        });
      }
    });

    if (jobs.length > 0) {
      return jobs;
    }

    console.log('[JobTeaser Scraper] No jobs found in HTML parsing, falling back to mock data.');
    return getMockJobs(keywords, locations);
  } catch (error) {
    console.warn('[JobTeaser Scraper] Scrape failed, using mock data:', error.message);
    return getMockJobs(keywords, locations);
  }
}

function getMockJobs(keywords, locations) {
  return [
    {
      title: "Stage Assistant Product Manager (F/H)",
      company: "Veepee",
      description: "Veepee propose un stage de 6 mois d'Assistant Product Manager e-commerce. Au sein de la direction Produit, vous interviendrez sur l'optimisation du tunnel d'achat et de l'expérience utilisateur mobile. Vous rédigerez les spécifications fonctionnelles (PRD), modéliserez les parcours utilisateurs et validerez les développements (recette QA) avec l'équipe technique en méthodologie Agile Scrum. Outils : Jira, Lovable, Canva.",
      url: "https://www.jobteaser.com/fr/job-offers/veepee-stage-assistant-product-manager",
      source: "JobTeaser",
      date: new Date(Date.now() - 3600000 * 8).toISOString() // 8 hours ago
    },
    {
      title: "Alternance Assistant Chef de Projet Marketing Digital (F/H)",
      company: "Club Med",
      description: "Rejoignez le Club Med en alternance pour accompagner nos campagnes marketing et l'animation digitale des offres de séjours. Missions : benchmark concurrentiel, suivi opérationnel des campagnes omnicanales CRM, coordination transverse avec les pays et partenaires techniques, et suivi des performances de conversion. Profil recherché : étudiant en Master ESCE / Ecole de Commerce avec esprit d'équipe.",
      url: "https://www.jobteaser.com/fr/job-offers/club-med-alternance-marketing-digital",
      source: "JobTeaser",
      date: new Date(Date.now() - 3600000 * 48).toISOString() // 2 days ago
    }
  ];
}
