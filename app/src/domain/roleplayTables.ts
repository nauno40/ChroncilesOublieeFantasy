// Tables de génération aléatoire du roleplay (COF2, création du personnage).
// Idéaux héroïques & travers : d20. Secrets intimes : deux tables de 20 (fusionnées en un
// seul tirage de 40 ici — « choisissez l'un des secrets obtenus »).

export const IDEAUX_HEROIQUES: string[] = [
  'Abnégation', 'Clémence', 'Compassion', 'Courage', 'Égalité', 'Éducation', 'Fraternité',
  'Frugalité', 'Générosité', 'Honnêteté', 'Honneur', 'Humilité', 'Justice', 'Liberté',
  'Loyauté', 'Pacifisme', 'Protection', 'Sens du sacrifice', 'Solidarité', 'Vérité',
];

export const TRAVERS: string[] = [
  'Alcoolique', 'Couard', 'Crédule', 'Cupide', 'Colérique', 'Distrait', 'Dragueur',
  'Fanfaron', 'Gourmand', 'Grossier', 'Impatient', 'Indécis', 'Menteur', 'Orgueilleux',
  'Paranoïaque', 'Paresseux', 'Phobie (au choix)', 'Timide', 'Violent', 'Voleur',
];

export const SECRETS_INTIMES: string[] = [
  // Table 1
  "Je ne suis pas celui que je prétends être.",
  "Je recherche un membre de ma famille.",
  "Je suis victime d'une malédiction.",
  "Je suis recherché pour un crime (mais l'ai-je commis ?).",
  "J'ai perdu la mémoire d'une période de ma vie.",
  "J'ai une phobie que j'ai honte d'avouer.",
  "J'ai une addiction qui me cause du tort.",
  "Il y a une chose en particulier qui me fait sortir de mes gonds.",
  "Un membre de ma propre famille est devenu un ennemi mortel.",
  "Je mène une double vie.",
  "Je suis déjà mort une fois.",
  "J'ai d'énormes dettes.",
  "Ceci n'est pas mon corps (ou deux esprits cohabitent dans mon corps).",
  "J'ai brisé un serment sacré.",
  "Je possède un objet qui ne doit pas tomber entre de mauvaises mains.",
  "Je porte un deuil terrible.",
  "J'ai fui une amante ou un amant puissant (socialement).",
  "Un terrible cauchemar me hante chaque nuit (est-ce que je m'en souviens ?).",
  "Je n'ai pas réussi à empêcher un grand mal et je porte ce fardeau.",
  "Je fais partie d'une organisation secrète (ou je la fuis).",
  // Table 2
  "Toute ma famille est décédée ou m'a renié, mais j'ignore pourquoi.",
  "J'ai été recruté pour surveiller/protéger/espionner un autre membre du groupe.",
  "On m'a prédit que je causerai une terrible catastrophe.",
  "Je suis porteur d'une marque de naissance (j'en ignore l'origine et la signification).",
  "Mon enfant/frère/sœur/amour a disparu sans explication.",
  "Je possède un objet qui est un héritage familial et j'y tiens comme à ma vie.",
  "J'ai passé un pacte secret avec un démon ou une entité supérieure.",
  "J'ai été trahi et cela a bouleversé ma vie.",
  "J'ai un handicap, mais je le surmonte à tout prix.",
  "Je suis célèbre pour une histoire que je préfère oublier…",
  "Je veux devenir célèbre pour gagner le cœur de quelqu'un.",
  "Je veux prouver à mon père/ma mère que je vaux mieux que ce qu'il croit.",
  "J'ai besoin de beaucoup d'argent pour une bonne cause.",
  "J'ai un objectif affiché, mais ce n'est pas celui que je cherche à atteindre.",
  "Je veux devenir puissant pour abattre un tyran/une créature.",
  "J'ai fait quelque chose d'horrible et je tente de me racheter.",
  "Je sais comment je vais mourir, je l'ai vu.",
  "Je n'ai aucun secret ou originalité, alors je m'en invente.",
  "Je suis le parfait compagnon, mais un jour tous devront ployer le genou devant moi.",
  "Je viens d'un autre monde et tout ce qui m'entoure me semble étrange.",
];

/** Tire un élément au hasard dans une table (d20 / d40). */
export const rollFrom = (table: string[]): string => table[Math.floor(Math.random() * table.length)];
