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
const SEEDED_CV = {
  filename: 'CV VF Shawmiya CHRISTEN VASEEKARAN.pdf',
  text: 'Shawmiya Christen - Junior Product Manager / CRM / Digital Marketing. Experience: Digital Virgo, ESCE Master in International Consumer Marketing...',
  parsedData: {
    name: 'Shawmiya Christen',
    email: 'shawmiyachristen@gmail.com',
    phone: '07.68.89.68.82',
    location: '78700 Conflans-Sainte-Honorine, France',
    summary: 'Jeune diplômée d\'un Master en International Consumer Marketing de l\'ESCE, avec une première expérience significative chez Digital Virgo (Chef de Projet CRM & Marketing / Product Manager Junior) où j\'ai piloté le cycle de vie de solutions digitales B2B/B2C, de la conception fonctionnelle à la recette (QA) d\'applications de billetterie mobile et d\'offres de divertissement digital (DV Live, DV Ticketing). Passionnée par l\'innovation produit, la mobilité et la satisfaction client, je souhaite intégrer une équipe dynamique en tant que Product Manager Junior.',
    skills: {
      technical: [
        'Product Management B2B/B2C',
        'Spécifications fonctionnelles (PRD)',
        'Tests applicatifs & Recette (QA)',
        'Conception de Mock-ups & User Flows',
        'Analyse de performance & KPIs',
        'Benchmark & Veille concurrentielle',
        'Roadmap & Backlog prioritization'
      ],
      soft: [
        'Esprit d\'équipe & Collaboration',
        'Sens du relationnel client',
        'Autonomie & Rigueur',
        'Coordination de projets transverses',
        'Attrait pour le Luxe, Beauté & Innovation'
      ],
      tools: [
        'Jira',
        'Bolt.new',
        'Lovable.dev',
        'Canva',
        'Pack Office (Excel, Word, PowerPoint)',
        'Réseaux Sociaux'
      ]
    }
  },
  lastUpdated: new Date().toISOString()
};

const SEEDED_JOBS = [
  {
    id: 'job_veepee_luxury',
    title: 'Junior Product Manager (F/H) - Luxe & Cosmétiques',
    company: 'Veepee Luxury',
    description: 'Au sein de notre pôle Beauté & Luxe, vous interviendrez en tant que Junior Product Manager. Vous gérerez le cycle de vie de nos applications de vente événementielle, de la définition des besoins en collaboration avec les équipes marketing jusqu\'aux phases de tests fonctionnels. Profil recherché : Master en Marketing (ESCE ou équivalent), intérêt pour l\'expérience client et la mobilité.',
    url: 'https://www.welcometothejungle.com/fr/companies/veepee/jobs/junior-product-manager-luxe',
    source: 'Welcome to the Jungle',
    crawledAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'job_showroomprive',
    title: 'Assistant Chef de Produit Digital (F/H)',
    company: 'Showroomprive',
    description: 'Rejoignez Showroomprive pour accompagner le déploiement de nos nouvelles offres e-commerce. Vos missions : benchmark concurrentiel, modélisation des parcours clients (mockups Bolt.new), rédaction de tickets Jira et coordination avec les développeurs. Une expérience chez Digital Virgo ou similaire est appréciée.',
    url: 'https://www.welcometothejungle.com/fr/companies/showroomprive/jobs/assistant-chef-de-produit-digital',
    source: 'Welcome to the Jungle',
    crawledAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'job_orange',
    title: 'Chef de Projet Digital / CRM (F/H)',
    company: 'Orange Business Services',
    description: 'Au sein de nos équipes à Paris, vous serez en charge de coordonner les projets de campagnes marketing CRM, d\'enrichir les bases de données et de planifier les lancements de produits digitaux B2B/B2C. Une formation supérieure type Master en Consumer Marketing (ESCE) ou similaire est vivement appréciée.',
    url: 'https://www.apec.fr/candidat/recherche-emploi.html/emploi/orange-business-project-manager',
    source: 'APEC',
    crawledAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'job_fnac_darty',
    title: 'Product Owner Junior - Event Tech & Billetterie',
    company: 'FNAC Darty',
    description: 'Rattaché(e) au Head of Product, vous interviendrez sur notre solution de billetterie dématérialisée. Vos missions : rédaction des spécifications fonctionnelles, conception de parcours utilisateurs, participation aux tests fonctionnels avant lancement et gestion de tickets Jira. Profil autonome avec un esprit d\'équipe.',
    url: 'https://www.apec.fr/candidat/recherche-emploi.html/emploi/fnac-darty-product-owner-junior',
    source: 'APEC',
    crawledAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'job_digital_virgo',
    title: 'Chef de Projet CRM & Marketing Digital (F/H)',
    company: 'Digital Virgo',
    description: 'Rattaché(e) au pôle Marketing Digital de Digital Virgo, vous piloterez le déploiement et l\'optimisation des campagnes CRM multi-canaux (SMS, emailings, push notifications). Vous assurerez la coordination du lancement des offres de divertissement et de billetterie mobile. Missions : benchmark concurrentiel, analyse des KPI de conversion, spécifications fonctionnelles, recette et tests de non-régression. Profil : Master ESCE en Marketing Digital / Consumer Marketing.',
    url: 'https://fr.indeed.com/viewjob?jk=indeed_mock_dv1',
    source: 'Indeed',
    crawledAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'job_loreal',
    title: 'Junior CRM Project Manager (F/H) - Luxe',
    company: 'L\'Oréal',
    description: 'Au sein de la division Luxe de L\'Oréal à Paris, vous accompagnerez la mise en œuvre de la stratégie de fidélisation omnicanale pour nos marques de cosmétiques de prestige. En collaboration étroite avec les Product Managers et équipes techniques, vous concevrez des parcours clients personnalisés et piloterez la recette des nouvelles fonctionnalités CRM. Master ESCE, Lovable/Canva et Jira souhaités.',
    url: 'https://fr.indeed.com/viewjob?jk=indeed_mock_lor1',
    source: 'Indeed',
    crawledAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'job_veepee_pm',
    title: 'Stage Assistant Product Manager (F/H)',
    company: 'Veepee',
    description: 'Veepee propose un stage de 6 mois d\'Assistant Product Manager e-commerce. Au sein de la direction Produit, vous interviendrez sur l\'optimisation du tunnel d\'achat et de l\'expérience utilisateur mobile. Vous rédigerez les spécifications fonctionnelles (PRD), modéliserez les parcours utilisateurs et validerez les développements (recette QA) avec l\'équipe technique en méthodologie Agile Scrum. Outils : Jira, Lovable, Canva.',
    url: 'https://www.jobteaser.com/fr/job-offers/veepee-stage-assistant-product-manager',
    source: 'JobTeaser',
    crawledAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'job_club_med',
    title: 'Alternance Assistant Chef de Projet Marketing Digital (F/H)',
    company: 'Club Med',
    description: 'Rejoignez le Club Med en alternance pour accompagner nos campagnes marketing et l\'animation digitale des offres de séjours. Missions : benchmark concurrentiel, suivi opérationnel des campagnes omnicanales CRM, coordination transverse avec les pays et partenaires techniques, et suivi des performances de conversion. Profil recherché : étudiant en Master ESCE / Ecole de Commerce avec esprit d\'équipe.',
    url: 'https://www.jobteaser.com/fr/job-offers/club-med-alternance-marketing-digital',
    source: 'JobTeaser',
    crawledAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'job_air_france',
    title: 'Chef de Projet Marketing & Expérience Client (F/H)',
    company: 'Air France',
    description: 'Dans le cadre de l\'évolution de nos services digitaux, Air France recherche un(e) Chef de Projet Marketing & Expérience Client. Vous assurerez la cohérence des parcours clients sur nos plateformes web et mobiles, analyserez l\'impact de nos campagnes de fidélisation CRM, et participerez à la définition de la roadmap produit. Coordination transverse avec les équipes UX, techniques et métiers. Profil : Diplômé(e) Master ESCE/Ecole de commerce.',
    url: 'https://www.cadremploi.fr/emploi/offres/air-france-marketing-project-manager',
    source: 'Cadremploi',
    crawledAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'job_ratp',
    title: 'Product Manager Mobile & Billetterie (F/H)',
    company: 'RATP Smart Systems',
    description: 'RATP Smart Systems est leader dans les technologies de billettique et de mobilité. Nous recherchons un Product Manager Junior pour piloter le cycle de vie de nos applications mobiles de ticketing. Vous travaillerez sur la conception fonctionnelle des parcours de vente et d\'accès, piloterez les phases de tests fonctionnels et de recette applicative (QA), et rédigerez les spécifications fonctionnelles Jira. Expérience dans la mobilité ou billettique souhaitée.',
    url: 'https://www.cadremploi.fr/emploi/offres/ratp-smart-systems-product-manager',
    source: 'Cadremploi',
    crawledAt: new Date(Date.now() - 3600000 * 36).toISOString()
  }
];

const SEEDED_MATCHES = {
  'job_digital_virgo': {
    score: 10,
    matchingSkills: ['Gestion de produits', 'Développement de produits digitaux', 'Spécifications fonctionnelles (PRD)', 'Veille concurrentielle & Benchmark', 'Tests fonctionnels & Recette (QA)', 'Roadmap & Backlog management', 'Jira', 'Bolt.new', 'Lovable.dev', 'Canva', 'Coordination de projets transverses'],
    missingSkills: ['Expérience spécifique sur les outils CRM du marché (Salesforce/Hubspot)'],
    cvImprovements: ['Mettez en avant vos réalisations concrètes de recette et d\'analyse de performance chez Digital Virgo.', 'Insistez sur votre double compétence ESCE + Digital Virgo pour démontrer votre autonomie.'],
    coverLetter: 'Madame, Monsieur,\n\nC\'est avec un grand intérêt que je vous adresse ma candidature pour le poste de Chef de Projet CRM & Marketing Digital (F/H) au sein de Digital Virgo. Récemment diplômée d\'un Master en International Consumer Marketing à l\'ESCE International Business School, je dispose d\'une première expérience réussie en gestion de produits et coordination de projets digitaux CRM / Marketing au sein même de Digital Virgo.\n\nMon parcours m\'a permis de développer une double expertise : d\'une part, en Product Management digital, de la conception fonctionnelle (rédaction de spécifications, mock-ups) jusqu\'aux phases de tests d\'acceptation et de recette (QA) ; et d\'autre part, en Consumer Marketing international. Collaborer étroitement avec les équipes marketing, commerciales et de développement m\'a donné une vision globale du cycle de vie d\'un produit et m\'a appris à fédérer des interlocuteurs transverses.\n\nIntégrer les équipes de Digital Virgo représente une opportunité unique de mettre mon dynamisme, mes compétences en Product Management / CRM et ma rigueur au service de vos projets de développement.\n\nJe reste à votre disposition pour convenir d\'un entretien afin de vous exposer plus en détail mon parcours et ma motivation.\n\nJe vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.\n\nShawmiya Christen',
    analyzedAt: new Date().toISOString()
  },
  'job_veepee_luxury': {
    score: 9,
    matchingSkills: ['Gestion de produits', 'Développement de produits digitaux', 'Analyse des performances', 'Spécifications fonctionnelles (PRD)', 'Veille concurrentielle & Benchmark', 'Tests fonctionnels & Recette (QA)', 'Jira', 'Bolt.new', 'Canva', 'Coordination de projets transverses'],
    missingSkills: ['Connaissance approfondie de l\'écosystème retail & distribution luxe'],
    cvImprovements: ['Valorisez votre Master en International Consumer Marketing de l\'ESCE pour appuyer votre profil marketing luxe.', 'Mentionnez des projets universitaires ou personnels liés à l\'industrie des cosmétiques ou de la mode.'],
    coverLetter: 'Madame, Monsieur,\n\nC\'est avec un grand intérêt que je vous adresse ma candidature pour le poste de Junior Product Manager (F/H) - Luxe & Cosmétiques au sein de Veepee Luxury. Récemment diplômée d\'un Master en International Consumer Marketing à l\'ESCE International Business School, je dispose d\'une première expérience réussie en gestion de produits et coordination de projets digitaux CRM / Marketing, notamment au sein de Digital Virgo.\n\nMon parcours m\'a permis de développer une double expertise : d\'une part, en Product Management digital, de la conception fonctionnelle (rédaction de spécifications, mock-ups) jusqu\'aux phases de tests d\'acceptation et de recette (QA) ; et d\'autre part, en Consumer Marketing international. Collaborer étroitement avec les équipes marketing, commerciales et de développement m\'a donné une vision globale du cycle de vie d\'un produit et m\'a appris à fédérer des interlocuteurs transverses.\n\nIntégrer les équipes de Veepee Luxury représente une opportunité unique de mettre mon dynamisme, mes compétences en Product Management / CRM et ma rigueur au service de vos projets de développement.\n\nJe reste à votre disposition pour convenir d\'un entretien afin de vous exposer plus en détail mon parcours et ma motivation.\n\nJe vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.\n\nShawmiya Christen',
    analyzedAt: new Date().toISOString()
  },
  'job_loreal': {
    score: 9,
    matchingSkills: ['Gestion de produits', 'Développement de produits digitaux', 'Analyse des performances', 'Spécifications fonctionnelles (PRD)', 'Veille concurrentielle & Benchmark', 'Tests fonctionnels & Recette (QA)', 'Jira', 'Bolt.new', 'Canva', 'Coordination de projets transverses'],
    missingSkills: ['Connaissance approfondie de l\'écosystème retail & distribution luxe'],
    cvImprovements: ['Valorisez votre Master en International Consumer Marketing de l\'ESCE pour appuyer votre profil marketing luxe.', 'Mentionnez des projets universitaires ou personnels liés à l\'industrie des cosmétiques ou de la mode.'],
    coverLetter: 'Madame, Monsieur,\n\nC\'est avec un grand intérêt que je vous adresse ma candidature pour le poste de Junior CRM Project Manager (F/H) - Luxe au sein de L\'Oréal. Récemment diplômée d\'un Master en International Consumer Marketing à l\'ESCE International Business School, je dispose d\'une première expérience réussie en gestion de produits et coordination de projets digitaux CRM / Marketing, notamment au sein de Digital Virgo.\n\nMon parcours m\'a permis de développer une double expertise : d\'une part, en Product Management digital, de la conception fonctionnelle (rédaction de spécifications, mock-ups) jusqu\'aux phases de tests d\'acceptation et de recette (QA) ; et d\'autre part, en Consumer Marketing international. Collaborer étroitement avec les équipes marketing, commerciales et de développement m\'a donné une vision globale du cycle de vie d\'un produit et m\'a appris à fédérer des interlocuteurs transverses.\n\nIntégrer les équipes de L\'Oréal représente une opportunité unique de mettre mon dynamisme, mes compétences en Product Management / CRM et ma rigueur au service de vos projets de développement.\n\nJe reste à votre disposition pour convenir d\'un entretien afin de vous exposer plus en détail mon parcours et ma motivation.\n\nJe vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.\n\nShawmiya Christen',
    analyzedAt: new Date().toISOString()
  },
  'job_ratp': {
    score: 9,
    matchingSkills: ['Gestion de produits', 'Développement de produits digitaux', 'Spécifications fonctionnelles (PRD)', 'Tests fonctionnels & Recette (QA)', 'Jira', 'Bolt.new', 'Coordination de projets transverses'],
    missingSkills: ['Expérience sur des systèmes de billettique complexes (smart ticketing)'],
    cvImprovements: ['Détaillez vos méthodes de tests de non-régression menées sur les applications mobiles de billetterie chez Digital Virgo.', 'Présentez des mock-ups de parcours de ticketing réalisés sous Bolt.new.'],
    coverLetter: 'Madame, Monsieur,\n\nC\'est avec un grand intérêt que je vous adresse ma candidature pour le poste de Product Manager Mobile & Billetterie (F/H) au sein de RATP Smart Systems. Récemment diplômée d\'un Master en International Consumer Marketing à l\'ESCE International Business School, je dispose d\'une première expérience réussie en gestion de produits et coordination de projets digitaux CRM / Marketing, notamment au sein de Digital Virgo.\n\nMon parcours m\'a permis de développer une double expertise : d\'une part, en Product Management digital, de la conception fonctionnelle (rédaction de spécifications, mock-ups) jusqu\'aux phases de tests d\'acceptation et de recette (QA) ; et d\'autre part, en Consumer Marketing international. Collaborer étroitement avec les équipes marketing, commerciales et de développement m\'a donné une vision globale du cycle de vie d\'un produit et m\'a appris à fédérer des interlocuteurs transverses.\n\nIntégrer les équipes de RATP Smart Systems représente une opportunité unique de mettre mon dynamisme, mes compétences en Product Management / CRM et ma rigueur au service de vos projets de développement.\n\nJe reste à votre disposition pour convenir d\'un entretien afin de vous exposer plus en détail mon parcours et ma motivation.\n\nJe vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.\n\nShawmiya Christen',
    analyzedAt: new Date().toISOString()
  },
  'job_veepee_pm': {
    score: 9,
    matchingSkills: ['Gestion de produits', 'Développement de produits digitaux', 'Spécifications fonctionnelles (PRD)', 'Tests fonctionnels & Recette (QA)', 'Jira', 'Bolt.new', 'Canva', 'Coordination de projets transverses'],
    missingSkills: ['Connaissance de l\'écosystème e-commerce mode (un plus)'],
    cvImprovements: ['Valorisez vos modélisations de mock-ups sous Bolt.new.', 'Expliquez comment vous organisez votre backlog Jira.'],
    coverLetter: 'Madame, Monsieur,\n\nC\'est avec un grand intérêt que je vous adresse ma candidature pour le poste de Stage Assistant Product Manager (F/H) au sein de Veepee. Récemment diplômée d\'un Master en International Consumer Marketing à l\'ESCE International Business School, je dispose d\'une première expérience réussie en gestion de produits et coordination de projets digitaux CRM / Marketing, notamment au sein de Digital Virgo.\n\nMon parcours m\'a permis de développer une double expertise : d\'une part, en Product Management digital, de la conception fonctionnelle (rédaction de spécifications, mock-ups) jusqu\'aux phases de tests d\'acceptation et de recette (QA) ; et d\'autre part, en Consumer Marketing international. Collaborer étroitement avec les équipes marketing, commerciales et de développement m\'a donné une vision globale du cycle de vie d\'un produit et m\'a appris à fédérer des interlocuteurs transverses.\n\nIntégrer les équipes de Veepee représente une opportunité unique de mettre mon dynamisme, mes compétences en Product Management / CRM et ma rigueur au service de vos projets de développement.\n\nJe reste à votre disposition pour convenir d\'un entretien afin de vous exposer plus en détail mon parcours et ma motivation.\n\nJe vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.\n\nShawmiya Christen',
    analyzedAt: new Date().toISOString()
  },
  'job_fnac_darty': {
    score: 9,
    matchingSkills: ['Gestion de produits', 'Développement de produits digitaux', 'Spécifications fonctionnelles (PRD)', 'Tests fonctionnels & Recette (QA)', 'Jira', 'Bolt.new', 'Coordination de projets transverses'],
    missingSkills: ['Expérience sur des systèmes de billettique complexes (smart ticketing)'],
    cvImprovements: ['Détaillez vos méthodes de tests de non-régression menées sur les applications de billetterie chez Digital Virgo.', 'Présentez des mock-ups de parcours de ticketing réalisés sous Bolt.new.'],
    coverLetter: 'Madame, Monsieur,\n\nC\'est avec un grand intérêt que je vous adresse ma candidature pour le poste de Product Owner Junior - Event Tech & Billetterie au sein de FNAC Darty. Récemment diplômée d\'un Master en International Consumer Marketing à l\'ESCE International Business School, je dispose d\'une première expérience réussie en gestion de produits et coordination de projets digitaux CRM / Marketing, notamment au sein de Digital Virgo.\n\nMon parcours m\'a permis de développer une double expertise : d\'une part, en Product Management digital, de la conception fonctionnelle (rédaction de spécifications, mock-ups) jusqu\'aux phases de tests d\'acceptation et de recette (QA) ; et d\'autre part, en Consumer Marketing international. Collaborer étroitement avec les équipes marketing, commerciales et de développement m\'a donné une vision globale du cycle de vie d\'un produit et m\'a appris à fédérer des interlocuteurs transverses.\n\nIntégrer les équipes de FNAC Darty représente une opportunité unique de mettre mon dynamisme, mes compétences en Product Management / CRM et ma rigueur au service de vos projets de développement.\n\nJe reste à votre disposition pour convenir d\'un entretien afin de vous exposer plus en détail mon parcours et ma motivation.\n\nJe vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.\n\nShawmiya Christen',
    analyzedAt: new Date().toISOString()
  },
  'job_showroomprive': {
    score: 8,
    matchingSkills: ['Gestion de produits', 'Développement de produits digitaux', 'Spécifications fonctionnelles (PRD)', 'Veille concurrentielle & Benchmark', 'Jira', 'Bolt.new', 'Coordination de projets transverses'],
    missingSkills: ['Certification Agile Product Owner (CSPO)'],
    cvImprovements: ['Mettez en avant vos compétences de coordination de projets multi-acteurs.', 'Expliquez comment vous gérez le backlog et priorisez les fonctionnalités sur Jira.'],
    coverLetter: 'Madame, Monsieur,\n\nC\'est avec un grand intérêt que je vous adresse ma candidature pour le poste de Assistant Chef de Produit Digital (F/H) au sein de Showroomprive. Récemment diplômée d\'un Master en International Consumer Marketing à l\'ESCE International Business School, je dispose d\'une première expérience réussie en gestion de produits et coordination de projets digitaux CRM / Marketing, notamment au sein de Digital Virgo.\n\nMon parcours m\'a permis de développer une double expertise : d\'une part, en Product Management digital, de la conception fonctionnelle (rédaction de spécifications, mock-ups) jusqu\'aux phases de tests d\'acceptation et de recette (QA) ; et d\'autre part, en Consumer Marketing international. Collaborer étroitement avec les équipes marketing, commerciales et de développement m\'a donné une vision globale du cycle de vie d\'un produit et m\'a appris à fédérer des interlocuteurs transverses.\n\nIntégrer les équipes de Showroomprive représente une opportunité unique de mettre mon dynamisme, mes compétences en Product Management / CRM et ma rigueur au service de vos projets de développement.\n\nJe reste à votre disposition pour convenir d\'un entretien afin de vous exposer plus en détail mon parcours et ma motivation.\n\nJe vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.\n\nShawmiya Christen',
    analyzedAt: new Date().toISOString()
  },
  'job_orange': {
    score: 8,
    matchingSkills: ['Gestion de produits', 'Développement de produits digitaux', 'Spécifications fonctionnelles (PRD)', 'Veille concurrentielle & Benchmark', 'Jira', 'Bolt.new', 'Coordination de projets transverses'],
    missingSkills: ['Certification Agile Product Owner (CSPO)'],
    cvImprovements: ['Mettez en avant vos compétences de coordination de projets multi-acteurs.', 'Expliquez comment vous gérez le backlog et priorisez les fonctionnalités sur Jira.'],
    coverLetter: 'Madame, Monsieur,\n\nC\'est avec un grand intérêt que je vous adresse ma candidature pour le poste de Chef de Projet Digital / CRM (F/H) au sein de Orange Business Services. Récemment diplômée d\'un Master en International Consumer Marketing à l\'ESCE International Business School, je dispose d\'une première expérience réussie en gestion de produits et coordination de projets digitaux CRM / Marketing, notamment au sein de Digital Virgo.\n\nMon parcours m\'a permis de développer une double expertise : d\'une part, en Product Management digital, de la conception fonctionnelle (rédaction de spécifications, mock-ups) jusqu\'aux phases de tests d\'acceptation et de recette (QA) ; et d\'autre part, en Consumer Marketing international. Collaborer étroitement avec les équipes marketing, commerciales et de développement m\'a donné une vision globale du cycle de vie d\'un produit et m\'a appris à fédérer des interlocuteurs transverses.\n\nIntégrer les équipes de Orange Business Services représente une opportunité unique de mettre mon dynamisme, mes compétences en Product Management / CRM et ma rigueur au service de vos projets de développement.\n\nJe reste à votre disposition pour convenir d\'un entretien afin de vous exposer plus en détail mon parcours et ma motivation.\n\nJe vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.\n\nShawmiya Christen',
    analyzedAt: new Date().toISOString()
  },
  'job_club_med': {
    score: 8,
    matchingSkills: ['Gestion de produits', 'Développement de produits digitaux', 'Spécifications fonctionnelles (PRD)', 'Veille concurrentielle & Benchmark', 'Jira', 'Bolt.new', 'Coordination de projets transverses'],
    missingSkills: ['Certification Agile Product Owner (CSPO)'],
    cvImprovements: ['Mettez en avant vos compétences de coordination de projets multi-acteurs.', 'Expliquez comment vous gérez le backlog et priorisez les fonctionnalités sur Jira.'],
    coverLetter: 'Madame, Monsieur,\n\nC\'est avec un grand intérêt que je vous adresse ma candidature pour le poste de Alternance Assistant Chef de Projet Marketing Digital (F/H) au sein de Club Med. Récemment diplômée d\'un Master en International Consumer Marketing à l\'ESCE International Business School, je dispose d\'une première expérience réussie en gestion de produits et coordination de projets digitaux CRM / Marketing, notamment au sein de Digital Virgo.\n\nMon parcours m\'a permis de développer une double expertise : d\'une part, en Product Management digital, de la conception fonctionnelle (rédaction de spécifications, mock-ups) jusqu\'aux phases de tests d\'acceptation et de recette (QA) ; et d\'autre part, en Consumer Marketing international. Collaborer étroitement avec les équipes marketing, commerciales et de développement m\'a donné une vision globale du cycle de vie d\'un produit et m\'a appris à fédérer des interlocuteurs transverses.\n\nIntégrer les équipes de Club Med représente une opportunité unique de mettre mon dynamisme, mes compétences en Product Management / CRM et ma rigueur au service de vos projets de développement.\n\nJe reste à votre disposition pour convenir d\'un entretien afin de vous exposer plus en détail mon parcours et ma motivation.\n\nJe vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.\n\nShawmiya Christen',
    analyzedAt: new Date().toISOString()
  },
  'job_air_france': {
    score: 8,
    matchingSkills: ['Gestion de produits', 'Développement de produits digitaux', 'Spécifications fonctionnelles (PRD)', 'Veille concurrentielle & Benchmark', 'Jira', 'Bolt.new', 'Coordination de projets transverses'],
    missingSkills: ['Certification Agile Product Owner (CSPO)'],
    cvImprovements: ['Mettez en avant vos compétences de coordination de projets multi-acteurs.', 'Expliquez comment vous gérez le backlog et priorisez les fonctionnalités sur Jira.'],
    coverLetter: 'Madame, Monsieur,\n\nC\'est avec un grand intérêt que je vous adresse ma candidature pour le poste de Chef de Projet Marketing & Expérience Client (F/H) au sein de Air France. Récemment diplômée d\'un Master en International Consumer Marketing à l\'ESCE International Business School, je dispose d\'une première expérience réussie en gestion de produits et coordination de projets digitaux CRM / Marketing, notamment au sein de Digital Virgo.\n\nMon parcours m\'a permis de développer une double expertise : d\'une part, en Product Management digital, de la conception fonctionnelle (rédaction de spécifications, mock-ups) jusqu\'aux phases de tests d\'acceptation et de recette (QA) ; et d\'autre part, en Consumer Marketing international. Collaborer étroitement avec les équipes marketing, commerciales et de développement m\'a donné une vision globale du cycle de vie d\'un produit et m\'a appris à fédérer des interlocuteurs transverses.\n\nIntégrer les équipes de Air France représente une opportunité unique de mettre mon dynamisme, mes compétences en Product Management / CRM et ma rigueur au service de vos projets de développement.\n\nJe reste à votre disposition pour convenir d\'un entretien afin de vous exposer plus en détail mon parcours et ma motivation.\n\nJe vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.\n\nShawmiya Christen',
    analyzedAt: new Date().toISOString()
  }
};

const DEFAULT_STATE = {
  cv: SEEDED_CV,
  jobs: SEEDED_JOBS,
  matches: SEEDED_MATCHES,
  settings: {
    keywords: 'Chef de produit, Product Manager',
    locations: 'Paris, Remote',
    cronSchedule: '0 6 * * *', // runs once per day on Vercel Hobby
    manualSearchInProgress: false,
    mockScraping: true
  },
  logs: [
    {
      id: 'log_seed_1',
      timestamp: new Date().toISOString(),
      message: '[Database] Seeded default state with CV profile of Shawmiya Christen.'
    },
    {
      id: 'log_seed_2',
      timestamp: new Date().toISOString(),
      message: '[Database] Seeded 10 matched digital Product Management & CRM roles.'
    }
  ]
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
