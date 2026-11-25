// Content for the 3D notebook. Copied once from ~/personal-website/index.html.
// Inline markup: ==highlight==, **bold**, [label](url)

export const RESUME = 'https://docs.google.com/document/d/17If3PePLBrR7-VX_hWRZ4sIcpXqI0p71jI1XItjCE38/export?format=pdf';
export const EMAIL = 'mailto:keyiyu@stanford.edu';
export const LINKEDIN = 'https://www.linkedin.com/in/keyiyu03/';
export const GITHUB = 'https://github.com/keyiyu0331';
export const SITE_2D = 'https://keyiyu0331.github.io/';

export const profile = {
  name: 'Keyi Yu',
  label: 'Healthcare AI · Stanford M.S. Bioengineering ’27',
  tagline: 'Building LLM systems for clinical and biomedical data.',
  abstract: 'I build multi-agent pipelines and retrieval-grounded models that work on real clinical documents, and the evaluations that show whether they can be trusted. Currently a data science research assistant at the Stanford Woods Institute; previously an AI Engineer Intern at Genentech and a researcher in Stanford Medicine’s Boussard Lab. Before AI, I did neuroscience, bioinformatics and wet-lab research at UC San Diego and Scripps Research.',
  links: [
    { label: '↓ resume.pdf', href: RESUME, primary: true },
    { label: 'email', href: EMAIL },
    { label: 'linkedin', href: LINKEDIN },
    { label: 'github', href: GITHUB },
  ],
  note: 'open to AI/ML roles in health & life sciences',
};

export const jobs = [
  {
    when: '2026-11 → now', where: 'Stanford, CA', now: true,
    org: 'Stanford Woods Institute for the Environment',
    role: 'Data Scientist, Research Assistant',
    fields: [],
  },
  {
    when: '2026-06 → 2026-09', where: 'South San Francisco, CA',
    org: 'Genentech',
    role: 'AI Engineer Intern, Product Development Data Science',
    fields: [
      ['Problem', 'Data Managers wrote first-draft clinical blueprints by hand from protocols, vendor documents and EHR data.'],
      ['Approach', 'Owned a LangGraph multi-agent pipeline that drafts the blueprint. Built the Python + Snowflake SQL services that extract the source data, defined a unified schema and semantic layer with domain experts, and added LangSmith tracing across every agent step.'],
      ['Result', '==~70% less manual drafting time, ~15+ hours saved per blueprint.== A companion LLM knowledge wiki (CLAUDE.md + Obsidian) cut team lookup time by 50%.'],
      ['Stack', 'LangGraph · LangChain · OpenAI API · Snowflake · LangSmith · Python', 'mono'],
    ],
  },
  {
    when: '2025-07 → 2026-09', where: 'Stanford, CA',
    org: 'Boussard Lab, Stanford School of Medicine',
    role: 'Graduate AI Researcher',
    note: 'paper on arXiv',
    fields: [
      ['Question', 'Frontier models score 100% on the binary “prescribe an opioid or not” check in the Q-Pain post-operative benchmark. Does that mean their decisions are stable?'],
      ['Method', 'Built Q-Pain++, a full-factorial stress test that varies clinical risk factors (mental health, opioid tolerance, preoperative pain), patient demographics and dosage granularity (none / low / medium / high). Evaluated prediction labels, model explanations and retrieval traceability across five models, closed-book and with guideline RAG.'],
      ['Result', '==Adding a “medium” dose option drove ~92% of decision changes, regardless of clinical context.== RAG improved demographic agreement for some models and worsened it for others. Label-only audits miss these failures.'],
      ['Paper', '[arXiv:2611.18631](https://arxiv.org/abs/2611.18631), second author'],
      ['Stack', 'LLM evaluation · RAG · fairness analysis · LLM-as-a-judge · semantic similarity', 'mono'],
    ],
  },
  {
    when: '2025-05 → 2025-11', where: 'Folsom, CA · remote',
    org: 'STEMz Learning', href: 'https://www.stemzlearning.org/',
    role: 'Machine Learning Engineer',
    fields: [
      ['Problem', 'A chatbot tutor that hands students the answer doesn’t teach them anything.'],
      ['Approach', 'Full-stack tutoring platform (React + Express) with adversarial prompt design and context restriction to block direct answers during quizzes, plus a MongoDB layer for learning-pattern analytics.'],
      ['Result', '==200+ student–chatbot interactions logged and structured each month.=='],
      ['Stack', 'React · Express.js · MongoDB · LLM APIs', 'mono'],
      ['Live', '[stemzlearning.org](https://www.stemzlearning.org/)'],
    ],
  },
  {
    when: '2025-06 → 2025-08', where: 'Richmond, VA · hybrid',
    org: 'EndoMD Health',
    role: 'Data Scientist Intern',
    fields: [
      ['Problem', 'Public pediatric endocrinology data (NHANES, outpatient records) was spread across hundreds of inconsistent files.'],
      ['Approach', 'Curated and harmonized the data with preprocessing and imputation into supervised input–output pairs, then built a reproducible LoRA fine-tuning pipeline with A/B testing and output evaluation on Google Cloud.'],
      ['Result', '==Fine-tuned Llama 3.1, Meditron and BioMistral on 13K examples.== Also analyzed insurance and clinic availability by state to guide expansion planning.'],
      ['Stack', 'Python · pandas · PyTorch · Hugging Face Transformers · LoRA · GCP', 'mono'],
    ],
  },
  {
    when: '2024-09 → 2025-08', where: 'San Diego, CA',
    org: 'Mesirov Lab, UC San Diego School of Medicine',
    role: 'Bioinformatics Intern',
    fields: [
      ['Problem', 'Large biological gene sets are noisy, which weakens enrichment analysis.'],
      ['Approach', 'Implemented and modified a non-negative matrix factorization (NMF) pipeline with parallel processing on AWS EC2, chose the number of components with consensus clustering and cophenetic analysis, and linked components to mutation status, drug sensitivity and protein expression with ssGSEA and information-coefficient scores.'],
      ['Result', '==More functionally coherent gene sets== for the PI3K-AKT-MTOR pathway, including KRAS-mutation-associated clusters validated against the literature.'],
      ['Stack', 'Python · NumPy · pandas · scikit-learn · plotnine · AWS EC2 · Git', 'mono'],
    ],
  },
];

export const earlier = [
  { when: '2023-09 → 2025-04', org: 'Rangel Lab, UCSD Cognitive Science', role: 'Research Assistant' },
  { when: '2024-03 → 2024-12', org: 'Scripps Research', role: 'Research Intern' },
  { when: '2024-02 → 2024-10', org: 'UCSD Altman Clinical & Translational Research Institute', role: 'Data Analyst Intern', text: 'Preprocessed and analyzed neural data in MATLAB for a study of cognitive control circuits.' },
  { when: '2023 · 2024 (fall)', org: 'UCSD Cognitive Science', role: 'Instructional Apprentice', text: 'Ran discussion sections and office hours for Sensation & Perception (COGS 101A) and Neuroimaging of Cognition (COGS 165).' },
];

export const projects = [
  {
    id: 'EXP-01', when: '2026', where: 'Stanford · team of 3',
    title: 'Do newer language models think more like brains?',
    fields: [
      ['Question', 'How does layer-by-layer alignment with human brain activity differ across language model generations?'],
      ['Method', 'Extracted hidden states from GPT-2 XL and DeepSeek-R1 8B / 14B and predicted fMRI responses (LeBel 2023) with noise-ceiling-normalized ridge regression, comparing peak predictivity, peak depth and area under the layer-wise profile.'],
      ['Result', '==DeepSeek models peak in intermediate layers with significantly larger AUC; GPT-2 XL peaks at its final layer.== No gain from 8B to 14B, so training paradigm mattered more than scale.'],
      ['Stack', 'PyTorch · Hugging Face · ridge regression (SVD) · fMRI', 'mono'],
    ],
  },
  {
    id: 'EXP-02', when: '2025', where: 'Stanford · team of 2',
    title: 'Do food categories reflect nutrition?',
    fields: [
      ['Question', 'Do culinary groupings like “Dairy” or “Grains” match the actual nutritional structure of foods?'],
      ['Method', 'Represented USDA FoodData Central and FNDDS items as 10 standardized nutrient features, then compared K-Means clusters against supervised classifiers (multinomial logistic regression, random forest, MLP) trained on standard food categories.'],
      ['Stack', 'Python · scikit-learn · K-Means · random forest · MLP · regularization', 'mono'],
    ],
  },
  {
    id: 'EXP-03', when: '2023–25', where: 'Rangel Lab · UC San Diego', note: 'SfN 2025',
    title: 'Dentate gyrus rhythms in learning and recall',
    fields: [
      ['Question', 'How do the layers of the hippocampal dentate gyrus coordinate when similar experiences must be linked to different outcomes?'],
      ['Method', 'In vivo laminar-probe recordings across the granule cell and hilar layers while rats learned and recalled a spatial reward task. Wrote code for cross-layer coherence and analyzed behavior with MATLAB, SLEAP and DeepSqueak.'],
      ['Result', '==Both layers were co-recruited into 20–40 Hz rhythms during path selection and outcome.== Incorrect recall choices followed reduced 20–40 Hz activity during learning.'],
      ['Output', 'Co-authored SfN 2025 abstract; presented at UCSD URC 2024 and Lab Expo 2025.'],
    ],
  },
  {
    id: 'EXP-04', when: '2024', where: 'Scripps Research',
    title: 'Does STAT3 drive liver cell senescence?',
    fields: [
      ['Question', 'Earlier STAT3 knockout work suggested a role in liver aging. Does overexpressing STAT3 in young mice accelerate senescence?'],
      ['Method', 'Delivered STAT3 with lentiviral vectors (EF1A promoter) and measured senescence with SA-β-gal staining on 16 µm and 30 µm liver slices.'],
      ['Result', '==Significantly higher senescence in STAT3-overexpressing mice (p ≤ 0.001).== Slice thickness affected staining intensity, so thickness must be held constant in comparisons.'],
      ['Stack', 'Lentivirus · CRISPR-Cas9 · SA-β-gal staining · ImageJ', 'mono'],
    ],
  },
];

export const pubs = [
  {
    title: 'Beyond Binary Audits: Does Guideline Grounding Mitigate Decision-Space Framing in LLM Opioid Prescribing?',
    href: 'https://arxiv.org/abs/2611.18631',
    venue: 'S. Roy, **K. Yu**, T. Hernandez-Boussard · arXiv:2611.18631 [cs.CL] · 2026',
    note: 'Boussard Lab, Stanford Medicine. See §1.',
  },
  {
    title: 'Dynamic co-recruitment of rhythmic activity in the hilus and granule cell layer of the dentate gyrus during learning and recall',
    venue: 'Society for Neuroscience (SfN) 2025 · co-author',
    note: 'Rangel Lab, UC San Diego. See EXP-03.',
  },
  {
    title: 'Dentate gyrus layer dynamics in spatial reward learning',
    venue: 'UCSD Undergraduate Research Conference 2024 · UCSD Lab Expo 2025 · presenter',
  },
];

export const materials = [
  ['AI engineering', ['LangGraph / LangChain', 'LangSmith', 'RAG', 'Multi-agent systems', 'LLM evaluation', 'MCP & tool use']],
  ['Machine learning', ['PyTorch', 'TensorFlow', 'Hugging Face', 'LoRA fine-tuning', 'scikit-learn', 'NMF / clustering']],
  ['Languages', ['Python', 'SQL', 'R', 'JavaScript', 'C++ / Java', 'MATLAB']],
  ['Data & cloud', ['Snowflake', 'Databricks / Spark', 'PostgreSQL / MongoDB', 'AWS / GCP / Azure', 'Docker']],
  ['Biomedical data', ['EHR', 'Clinical trial protocols', 'Real-world evidence', 'Gene expression / ssGSEA', 'fMRI & electrophysiology']],
  ['Wet lab', ['CRISPR-Cas9', 'Lentivirus production', 'Flow cytometry', 'Immunofluorescence', 'Confocal imaging']],
];

export const schools = [
  {
    name: 'Stanford University', when: '2025 → 2027',
    deg: 'M.S. Bioengineering, Biomedical Computation track · GPA 3.85',
    cw: 'Machine Learning · NLP with Deep Learning · Probabilistic Graphical Models · Statistical Learning · Biomedical Image Analysis · Data Science for Medicine · Modern Software Development',
  },
  {
    name: 'UC San Diego', when: '2021 → 2025',
    deg: 'B.S. Cognitive Science (Machine Learning) and B.S. Behavioral Neuroscience · GPA 3.93',
    cw: 'Data Structures & Algorithms · Linear Algebra · Probability & Statistics · Stochastic Processes · Supervised & Unsupervised ML',
  },
];

export const contact = {
  text: 'I’m looking for AI / ML engineering roles where LLMs meet healthcare and life sciences. Email is the fastest way to reach me.',
};

// Sections → first page index (page 0 = right page after the cover).
export const sections = [
  { key: 'exp', label: 'Experience', short: 'Exp.', mark: '§1', color: '#e8b04a' },
  { key: 'proj', label: 'Projects', short: 'Proj.', mark: '§2', color: '#7fb3d5' },
  { key: 'pubs', label: 'Publications', short: 'Pubs', mark: '§3', color: '#e58a80' },
  { key: 'mat', label: 'Materials & methods', short: 'Skills', mark: '§4', color: '#9ccc9c' },
  { key: 'edu', label: 'Training', short: 'Edu.', mark: '§5', color: '#c3a6e0' },
  { key: 'contact', label: 'Correspondence', short: 'Contact', mark: '§6', color: '#f2d36b' },
];
