import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const isDemoMode = !apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key_here');

let ai = null;
if (!isDemoMode) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('Failed to initialize GoogleGenAI client:', error);
  }
}

/**
 * Clean and parse CV text to extract structured information.
 */
export async function analyzeCV(cvText) {
  if (isDemoMode || !ai) {
    console.log('[GeminiService] Running in Demo Mode (Mock CV analysis)');
    return getMockCVAnalysis();
  }

  const prompt = `
    Analyze the following resume text. Extract the applicant's name, contact details (email, phone, location), a short profile summary, and a structured list of skills (grouped by Technical, Soft, and Tools/Frameworks).
    
    Resume Text:
    ${cvText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            email: { type: 'STRING' },
            phone: { type: 'STRING' },
            location: { type: 'STRING' },
            summary: { type: 'STRING' },
            skills: {
              type: 'OBJECT',
              properties: {
                technical: { type: 'ARRAY', items: { type: 'STRING' } },
                soft: { type: 'ARRAY', items: { type: 'STRING' } },
                tools: { type: 'ARRAY', items: { type: 'STRING' } }
              },
              required: ['technical', 'soft', 'tools']
            }
          },
          required: ['name', 'email', 'phone', 'location', 'summary', 'skills']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Gemini CV Analysis error:', error);
    // Return a fallback structure in case of API issues (using correct Product Manager template)
    return getMockCVAnalysis();
  }
}

/**
 * Compare a parsed CV with a Job Description.
 */
export async function compareJobWithCV(cvText, jobTitle, jobCompany, jobDescription) {
  if (isDemoMode || !ai) {
    console.log('[GeminiService] Running in Demo Mode (Mock Job Match Analysis)');
    return getMockJobMatch(jobTitle, jobCompany, jobDescription);
  }

  const prompt = `
    You are an expert recruitment assistant matching a CV with a job description.
    Analyze the candidate's CV and the job description below, and perform the comparison.
    
    Candidate CV Text:
    ${cvText}
    
    Job Title: ${jobTitle}
    Company: ${jobCompany}
    Job Description:
    ${jobDescription}
    
    Specifically, prioritize roles related to the candidate's target profile:
    - Product Management (Junior Product Manager, Product Manager, Assistant Product Manager, Product Owner Junior, Product Owner)
    - CRM & Digital Marketing Project Management (CRM Project Manager, Digital Marketing Project Manager, Customer Experience, Consumer Marketing, International Business)
    - Event Tech, Ticketing, Mobility
    
    CRITICAL SCORING INSTRUCTIONS:
    - If the job is a Software Engineer, Developer, DevOps, Backend Developer, Full-stack Developer, or highly technical coding/engineering role, it is NOT a good fit for this candidate whose background is in Business, Marketing, and Product Management. Give such technical engineering jobs a low compatibility score (e.g. 1 to 4).
    - Give jobs in Product Management, CRM, Digital Marketing, Customer Experience, or Event Tech/Mobility a high compatibility score (e.g. 7 to 10), depending on how well the candidate's skills (like product development, functional specs, Jira, testing, consumer marketing) match the job description.
    
    Provide:
    1. A compatibility score from 1 to 10 (1 = completely irrelevant, 10 = perfect match).
    2. A list of matching skills (skills the candidate possesses that are relevant to this job).
    3. A list of missing skills (skills requested in the job description that are missing or weak in the CV).
    4. A personalized cover letter tailored to this job (written in the language of the job description - French or English). Address the cover letter to the hiring manager. Emphasize why the candidate is a strong fit. Keep it professional, engaging, and standard format (approx 250-350 words).
    5. A list of concrete, actionable CV improvements (e.g. "Add a project demonstrating experience with Docker", "Mention your expertise in Agile methodologies").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            score: { type: 'INTEGER' },
            matchingSkills: { type: 'ARRAY', items: { type: 'STRING' } },
            missingSkills: { type: 'ARRAY', items: { type: 'STRING' } },
            coverLetter: { type: 'STRING' },
            cvImprovements: { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['score', 'matchingSkills', 'missingSkills', 'coverLetter', 'cvImprovements']
        }
      }
    });

    const parsedResult = JSON.parse(response.text);
    
    // Ensure score is between 1 and 10
    parsedResult.score = Math.max(1, Math.min(10, parsedResult.score));
    return parsedResult;
  } catch (error) {
    console.error('Gemini Job Comparison error:', error);
    return getMockJobMatch(jobTitle, jobCompany, jobDescription);
  }
}

// Check if running in mock/demo mode
export function getIsDemoMode() {
  return isDemoMode;
}

// Mock Builders
function getMockCVAnalysis() {
  return {
    name: 'Shawmiya Christen',
    email: 'shawmiyachristen@gmail.com',
    phone: '07.68.89.68.82',
    location: '78700 Conflans-Sainte-Honorine, France',
    summary: "Jeune diplômée d'un Master en International Consumer Marketing, avec 2 ans d'expérience en gestion de produits, coordination de projets marketing et développement d'offres dans un environnement international, je souhaite aujourd'hui rejoindre l'univers de la beauté et du luxe en tant que Junior Product Manager.",
    skills: {
      technical: [
        'Gestion de produits',
        'Développement de produits digitaux',
        'Analyse des performances',
        'Spécifications fonctionnelles (PRD)',
        'Veille concurrentielle & Benchmark',
        'Tests fonctionnels & Recette (QA)',
        'Roadmap & Backlog management'
      ],
      soft: [
        'Esprit d\'équipe',
        'Sens du relationnel',
        'Qualité d\'écoute',
        'Autonomie',
        'Coordination de projets transverses'
      ],
      tools: [
        'Jira',
        'Bolt.new',
        'Lovable.dev',
        'Canva',
        'Pack Office (Word, Excel, PowerPoint)',
        'Réseaux Sociaux'
      ]
    }
  };
}

function getMockJobMatch(jobTitle, jobCompany, jobDescription) {
  const lowerTitle = jobTitle.toLowerCase();
  const lowerDesc = (jobDescription || '').toLowerCase();
  
  // Software engineering / Developer / Backend / Full-stack keywords
  const isSoftwareDev = lowerTitle.includes('developer') || lowerTitle.includes('développeur') || lowerTitle.includes('backend') || lowerTitle.includes('front-end') || lowerTitle.includes('fullstack') || lowerTitle.includes('full-stack') || lowerTitle.includes('software engineer') || lowerTitle.includes('tech lead') || lowerTitle.includes('developpeur');
  
  // Target roles check
  const isPM = lowerTitle.includes('product manager') || lowerTitle.includes('chef de produit') || lowerTitle.includes('product owner') || lowerTitle.includes('assistant product manager') || lowerTitle.includes('junior product manager') || lowerTitle.includes('po junior');
  const isCRMOrDigitalProj = lowerTitle.includes('crm') || lowerTitle.includes('digital marketing') || lowerTitle.includes('marketing digital') || lowerTitle.includes('chef de projet digital') || lowerTitle.includes('consumer marketing') || lowerTitle.includes('customer experience') || lowerTitle.includes('expérience client') || lowerTitle.includes('chef de projet marketing');
  const isEventTechMobility = lowerTitle.includes('billetterie') || lowerTitle.includes('event tech') || lowerTitle.includes('mobility') || lowerTitle.includes('mobilité') || lowerTitle.includes('ticketing');

  let score = 5;
  let matchingSkills = ['Coordination de projets transverses', 'Esprit d\'équipe', 'Autonomie', 'Pack Office (Word, Excel, PowerPoint)'];
  let missingSkills = [];
  let cvImprovements = [];
  
  if (isSoftwareDev) {
    score = 3;
    matchingSkills = ['Autonomie', 'Esprit d\'équipe'];
    missingSkills = ['Programmation backend (Node.js/Express)', 'Développement frontend (React)', 'Gestion de bases de données SQL/NoSQL', 'Pratiques DevOps & CI/CD'];
    cvImprovements = [
      'Ce poste est un rôle technique de développement logiciel. Votre profil de Chef de Projet Marketing / CRM / Product Management n\'est pas adapté.',
      'Si vous souhaitez postuler, vous devrez acquérir des compétences approfondies en codage et ingénierie logicielle.'
    ];
  } else if (isPM || isCRMOrDigitalProj || isEventTechMobility) {
    // If it's a Digital Virgo CRM job
    if (jobCompany.toLowerCase().includes('digital virgo')) {
      score = 10;
      matchingSkills = [
        'Gestion de produits', 'Développement de produits digitaux', 'Spécifications fonctionnelles (PRD)',
        'Veille concurrentielle & Benchmark', 'Tests fonctionnels & Recette (QA)', 'Roadmap & Backlog management',
        'Jira', 'Bolt.new', 'Lovable.dev', 'Canva', 'Coordination de projets transverses'
      ];
      missingSkills = ['Expérience spécifique sur les outils CRM du marché (Salesforce/Hubspot)'];
      cvImprovements = [
        'Mettez en avant vos réalisations concrètes de recette et d\'analyse de performance chez Digital Virgo.',
        'Insistez sur votre double compétence ESCE + Digital Virgo pour démontrer votre autonomie.'
      ];
    } 
    // If it's L'Oréal CRM or Veepee PM or Veepee Luxury
    else if (jobCompany.toLowerCase().includes('l\'oréal') || jobCompany.toLowerCase().includes('veepee') || jobTitle.toLowerCase().includes('luxe') || jobTitle.toLowerCase().includes('cosmétique')) {
      score = 9;
      matchingSkills = [
        'Gestion de produits', 'Développement de produits digitaux', 'Analyse des performances',
        'Spécifications fonctionnelles (PRD)', 'Veille concurrentielle & Benchmark', 'Tests fonctionnels & Recette (QA)',
        'Jira', 'Bolt.new', 'Canva', 'Coordination de projets transverses'
      ];
      missingSkills = ['Connaissance approfondie de l\'écosystème retail & distribution luxe'];
      cvImprovements = [
        'Valorisez votre Master en International Consumer Marketing de l\'ESCE pour appuyer votre profil marketing luxe.',
        'Mentionnez des projets universitaires ou personnels liés à l\'industrie des cosmétiques ou de la mode.'
      ];
    }
    // RATP Smart Systems or FNAC Darty Event Tech
    else if (isEventTechMobility) {
      score = 9;
      matchingSkills = [
        'Gestion de produits', 'Développement de produits digitaux', 'Spécifications fonctionnelles (PRD)',
        'Tests fonctionnels & Recette (QA)', 'Jira', 'Bolt.new', 'Coordination de projets transverses'
      ];
      missingSkills = ['Expérience sur des systèmes de billettique complexes (smart ticketing)'];
      cvImprovements = [
        'Détaillez vos méthodes de tests de non-régression menées sur les applications mobiles de billetterie chez Digital Virgo.',
        'Présentez des mock-ups de parcours de ticketing réalisés sous Bolt.new.'
      ];
    }
    // General PM/CRM digital roles (Orange, Showroomprive, Club Med, Air France)
    else {
      score = 8;
      matchingSkills = [
        'Gestion de produits', 'Développement de produits digitaux', 'Spécifications fonctionnelles (PRD)',
        'Veille concurrentielle & Benchmark', 'Jira', 'Bolt.new', 'Coordination de projets transverses'
      ];
      missingSkills = ['Certification Agile Product Owner (CSPO)'];
      cvImprovements = [
        'Mettez en avant vos compétences de coordination de projets multi-acteurs.',
        'Expliquez comment vous gérez le backlog et priorisez les fonctionnalités sur Jira.'
      ];
    }
  }

  const coverLetter = `
Madame, Monsieur,

C'est avec un grand intérêt que je vous adresse ma candidature pour le poste de ${jobTitle} au sein de ${jobCompany}. Récemment diplômée d'un Master en International Consumer Marketing à l'ESCE International Business School, je dispose d'une première expérience réussie en gestion de produits et coordination de projets digitaux CRM / Marketing, notamment au sein de Digital Virgo.

Mon parcours m'a permis de développer une double expertise : d'une part, en Product Management digital, de la conception fonctionnelle (rédaction de spécifications, mock-ups) jusqu'aux phases de tests d'acceptation et de recette (QA) ; et d'autre part, en Consumer Marketing international. Collaborer étroitement avec les équipes marketing, commerciales et de développement m'a donné une vision globale du cycle de vie d'un produit et m'a appris à fédérer des interlocuteurs transverses.

Intégrer les équipes de ${jobCompany} représente une opportunité unique de mettre mon dynamisme, mes compétences en Product Management / CRM et ma rigueur au service de vos projets de développement.

Je reste à votre disposition pour convenir d'un entretien afin de vous exposer plus en détail mon parcours et ma motivation.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

Shawmiya Christen
`;

  return {
    score,
    matchingSkills,
    missingSkills,
    coverLetter,
    cvImprovements
  };
}
