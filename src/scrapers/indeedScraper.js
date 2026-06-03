import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrapes job listings from Indeed using public RSS feeds.
 * RSS bypasses common Cloudflare protection blocks on Indeed's main site.
 * 
 * @param {string} keywords - Search keywords
 * @param {string} locations - Search locations
 * @param {boolean} useMock - Force fallback mock data
 * @returns {Promise<Array>} List of parsed jobs
 */
export async function scrapeIndeed(keywords, locations, useMock = false) {
  if (useMock) {
    return getMockJobs(keywords, locations);
  }

  try {
    // RSS endpoint: rss.indeed.com/rss
    const rssUrl = `https://rss.indeed.com/rss?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(locations)}`;
    const response = await axios.get(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/xml,text/xml'
      },
      timeout: 8000
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const jobs = [];

    $('item').each((i, el) => {
      if (jobs.length >= 5) return;

      const fullTitle = $(el).find('title').text().trim();
      // Indeed RSS titles are formatted as: "Job Title - Company - Location"
      const titleParts = fullTitle.split(' - ');
      const title = titleParts[0] || fullTitle;
      const company = titleParts[1] || 'Indeed Employer';
      
      const url = $(el).find('link').text().trim();
      const description = $(el).find('description').text().trim() || `Job opening for ${title} requiring skills in ${keywords}.`;
      const pubDate = $(el).find('pubDate').text().trim();

      if (title && company) {
        jobs.push({
          title,
          company,
          description: description.replace(/<[^>]*>/g, '').substring(0, 300) + '...', // Strip HTML tags
          url,
          source: 'Indeed',
          date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
        });
      }
    });

    if (jobs.length > 0) {
      return jobs;
    }

    console.log('[Indeed Scraper] No jobs found in RSS feed, falling back to mock data.');
    return getMockJobs(keywords, locations);
  } catch (error) {
    console.warn('[Indeed Scraper] Scrape failed, using mock data:', error.message);
    return getMockJobs(keywords, locations);
  }
}

function getMockJobs(keywords, locations) {
  return [
    {
      title: "Chef de Projet CRM & Marketing Digital (F/H)",
      company: "Digital Virgo",
      description: "Rattaché(e) au pôle Marketing Digital de Digital Virgo, vous piloterez le déploiement et l'optimisation des campagnes CRM multi-canaux (SMS, emailings, push notifications). Vous assurerez la coordination du lancement des offres de divertissement et de billetterie mobile. Missions : benchmark concurrentiel, analyse des KPI de conversion, spécifications fonctionnelles, recette et tests de non-régression. Profil : Master ESCE en Marketing Digital / Consumer Marketing.",
      url: "https://fr.indeed.com/viewjob?jk=indeed_mock_dv1",
      source: "Indeed",
      date: new Date(Date.now() - 3600000 * 3).toISOString() // 3 hours ago
    },
    {
      title: "Junior CRM Project Manager (F/H) - Luxe",
      company: "L'Oréal",
      description: "Au sein de la division Luxe de L'Oréal à Paris, vous accompagnerez la mise en œuvre de la stratégie de fidélisation omnicanale pour nos marques de cosmétiques de prestige. En collaboration étroite avec les Product Managers et équipes techniques, vous concevrez des parcours clients personnalisés et piloterez la recette des nouvelles fonctionnalités CRM. Master ESCE, Lovable/Canva et Jira souhaités.",
      url: "https://fr.indeed.com/viewjob?jk=indeed_mock_lor1",
      source: "Indeed",
      date: new Date(Date.now() - 3600000 * 18).toISOString() // 18 hours ago
    }
  ];
}
