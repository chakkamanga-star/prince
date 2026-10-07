-- ============================================================
-- MootCourt AI — Full Database Schema
-- Migration 001: Initial Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  institution TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'coach', 'admin')),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COMPETITIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT,
  organizer TEXT,
  year INTEGER,
  jurisdiction TEXT DEFAULT 'India',
  court_simulated TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MOOT CASES (Active Case) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.moot_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES public.competitions(id),
  name TEXT NOT NULL,
  proposition_title TEXT,
  side TEXT CHECK (side IN ('petitioner', 'respondent', 'both')),
  active_side TEXT CHECK (active_side IN ('petitioner', 'respondent')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  preparation_stage TEXT DEFAULT 'understand',
  readiness_score INTEGER DEFAULT 0,
  memorial_deadline DATE,
  oral_round_date DATE,
  competition_date DATE,
  registration_date DATE,
  is_active BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROPOSITIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.propositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  raw_text TEXT,
  parties_petitioner TEXT,
  parties_respondent TEXT,
  court TEXT,
  jurisdiction TEXT,
  procedural_posture TEXT,
  relief_sought TEXT,
  admitted_facts JSONB DEFAULT '[]',
  disputed_facts JSONB DEFAULT '[]',
  inferred_facts JSONB DEFAULT '[]',
  relevant_statutes JSONB DEFAULT '[]',
  constitutional_provisions JSONB DEFAULT '[]',
  deconstructed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COMPETITION RULES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competition_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  memorial_word_limit INTEGER,
  memorial_page_limit INTEGER,
  font TEXT,
  font_size NUMERIC,
  line_spacing NUMERIC,
  margin_top NUMERIC,
  margin_bottom NUMERIC,
  margin_left NUMERIC,
  margin_right NUMERIC,
  citation_style TEXT,
  anonymity_required BOOLEAN DEFAULT false,
  oral_time_petitioner INTEGER, -- seconds
  oral_time_respondent INTEGER,
  oral_time_rebuttal INTEGER,
  extension_allowed BOOLEAN DEFAULT true,
  max_extension_seconds INTEGER,
  speaker_restrictions JSONB DEFAULT '{}',
  prohibited_materials JSONB DEFAULT '[]',
  required_sections JSONB DEFAULT '[]',
  footnote_style TEXT,
  cover_requirements JSONB DEFAULT '{}',
  scoring_criteria JSONB DEFAULT '{}',
  submission_format TEXT,
  raw_rules_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ISSUES ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  proposition_id UUID REFERENCES public.propositions(id),
  issue_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  statement TEXT,
  petitioner_position TEXT,
  respondent_position TEXT,
  sub_issues JSONB DEFAULT '[]',
  relevant_statutes JSONB DEFAULT '[]',
  constitutional_articles JSONB DEFAULT '[]',
  legal_questions JSONB DEFAULT '[]',
  unresolved_questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FACTS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.facts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  fact_id TEXT, -- e.g. FACT-001
  description TEXT NOT NULL,
  date_of_event DATE,
  status TEXT CHECK (status IN ('admitted','disputed','established','alleged','inferred','uncertain','irrelevant')),
  legal_relevance TEXT,
  source_paragraph TEXT,
  allowed_inferences JSONB DEFAULT '[]',
  prohibited_inferences JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUTHORITIES (Case Law) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.authorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  case_name TEXT NOT NULL,
  neutral_citation TEXT,
  reporter_citations JSONB DEFAULT '[]',
  court TEXT,
  year INTEGER,
  bench_strength INTEGER,
  judges JSONB DEFAULT '[]',
  is_constitution_bench BOOLEAN DEFAULT false,
  binding_status TEXT CHECK (binding_status IN ('binding','persuasive','comparative','historical','questionable')),
  ratio_or_obiter TEXT CHECK (ratio_or_obiter IN ('ratio','obiter','mixed','unclear')),
  current_status TEXT CHECK (current_status IN ('good','overruled','distinguished','doubted','approved','followed')),
  precedential_strength INTEGER DEFAULT 0, -- 0-100
  argument_alignment INTEGER DEFAULT 0,    -- 0-100
  supports_side TEXT CHECK (supports_side IN ('petitioner','respondent','neutral','both')),
  holding TEXT,
  ratio_decidendi TEXT,
  obiter_dicta TEXT,
  facts_summary TEXT,
  issues_decided JSONB DEFAULT '[]',
  statutes_interpreted JSONB DEFAULT '[]',
  constitutional_provisions JSONB DEFAULT '[]',
  later_treatment JSONB DEFAULT '[]',
  source_url TEXT,
  source_type TEXT DEFAULT 'uploaded',
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified','partially_verified','unverified','source_conflict','miscitation','possible_hallucination','overruled')),
  uploaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STATUTES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.statutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_title TEXT,
  year INTEGER,
  act_number TEXT,
  jurisdiction TEXT DEFAULT 'India',
  india_code_url TEXT,
  full_text TEXT,
  sections JSONB DEFAULT '[]',
  amendments JSONB DEFAULT '[]',
  current_status TEXT DEFAULT 'in_force',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LEGISLATIVE MATERIALS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.legislative_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('parliamentary_debate','committee_report','bill_text','statement_of_objects','amendment_history','law_commission','parliamentary_question','gazette')),
  title TEXT NOT NULL,
  date DATE,
  source TEXT,
  source_url TEXT,
  content TEXT,
  relevance TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MEMORIALS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  side TEXT CHECK (side IN ('petitioner','respondent')),
  version INTEGER DEFAULT 1,
  version_label TEXT DEFAULT 'Draft v1',
  content JSONB DEFAULT '{}', -- structured sections
  word_count INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  compliance_score INTEGER DEFAULT 0,
  argument_strength_score INTEGER DEFAULT 0,
  citation_integrity_score INTEGER DEFAULT 0,
  is_current BOOLEAN DEFAULT true,
  export_docx_url TEXT,
  export_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CITATIONS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memorial_id UUID REFERENCES public.memorials(id) ON DELETE CASCADE,
  authority_id UUID REFERENCES public.authorities(id),
  raw_citation TEXT NOT NULL,
  cited_paragraph TEXT,
  cited_quote TEXT,
  proposition_cited_for TEXT,
  section_location TEXT, -- where in memorial
  verification_status TEXT DEFAULT 'pending',
  verification_notes TEXT,
  risk_level TEXT CHECK (risk_level IN ('green','yellow','orange','red')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GLOSSARY TERMS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.glossary_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  preferred_term TEXT NOT NULL,
  alternative_terms JSONB DEFAULT '[]',
  definition TEXT,
  context TEXT,
  sections_used JSONB DEFAULT '[]',
  citation TEXT,
  is_locked BOOLEAN DEFAULT false,
  consistency_status TEXT DEFAULT 'consistent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESEARCH NOTES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.research_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id),
  title TEXT,
  content TEXT,
  tags JSONB DEFAULT '[]',
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTEBOOKS (LLM Notebook) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notebooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  linked_issue_id UUID REFERENCES public.issues(id),
  content JSONB DEFAULT '{}',
  flashcards JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BENCH PROFILES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bench_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  archetype TEXT NOT NULL CHECK (archetype IN ('procedural','constitutional','strict_textualist','precedent_focused','facts_focused','skeptical','policy_oriented','remedy_focused','highly_interruptive','balanced','constitution_bench','devils_advocate')),
  description TEXT,
  questioning_style JSONB DEFAULT '{}',
  typical_phrases JSONB DEFAULT '[]',
  focus_areas JSONB DEFAULT '[]',
  interrupt_probability NUMERIC DEFAULT 0.3,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORAL SESSIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.oral_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id),
  side TEXT CHECK (side IN ('petitioner','respondent')),
  bench_config JSONB DEFAULT '{}', -- bench profiles, difficulty, etc.
  difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  interruption_level TEXT DEFAULT 'medium',
  hypothetical_level TEXT DEFAULT 'medium',
  time_pressure TEXT DEFAULT 'medium',
  allocated_time INTEGER DEFAULT 900, -- seconds
  time_used INTEGER DEFAULT 0,
  extensions_requested INTEGER DEFAULT 0,
  extensions_granted INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','completed','aborted')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  -- Scoring
  score_legal_accuracy INTEGER DEFAULT 0,
  score_argument_structure INTEGER DEFAULT 0,
  score_authorities INTEGER DEFAULT 0,
  score_bench_handling INTEGER DEFAULT 0,
  score_factual_accuracy INTEGER DEFAULT 0,
  score_courtroom_language INTEGER DEFAULT 0,
  score_persuasiveness INTEGER DEFAULT 0,
  score_rebuttal INTEGER DEFAULT 0,
  score_time_management INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BENCH QUESTIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bench_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.oral_sessions(id) ON DELETE CASCADE,
  bench_profile_id UUID REFERENCES public.bench_profiles(id),
  question_text TEXT NOT NULL,
  question_type TEXT,
  issue_targeted TEXT,
  difficulty INTEGER DEFAULT 3,
  timestamp_in_session INTEGER, -- seconds from start
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COUNSEL ANSWERS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.counsel_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.oral_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.bench_questions(id),
  answer_text TEXT,
  answer_audio_url TEXT,
  authorities_cited JSONB DEFAULT '[]',
  fact_discrepancies JSONB DEFAULT '[]',
  language_quality_score INTEGER,
  legal_accuracy_score INTEGER,
  timestamp_in_session INTEGER,
  duration_seconds INTEGER,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TIMER EVENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.timer_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.oral_sessions(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('start','pause','resume','bench_question_start','bench_question_end','extension_requested','extension_granted','extension_refused','warning_one_minute','expired','completed')),
  timestamp_utc TIMESTAMPTZ DEFAULT NOW(),
  time_remaining INTEGER, -- seconds
  notes TEXT
);

-- ─── COURT RECORDS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.court_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.oral_sessions(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  record_date DATE,
  bench_composition JSONB DEFAULT '[]',
  counsel_name TEXT,
  issue_argued TEXT,
  full_transcript JSONB DEFAULT '[]', -- timestamped events
  authorities_mentioned JSONB DEFAULT '[]',
  factual_discrepancies JSONB DEFAULT '[]',
  judicial_observations JSONB DEFAULT '[]',
  extensions_log JSONB DEFAULT '[]',
  bench_assessment JSONB DEFAULT '{}',
  export_pdf_url TEXT,
  export_docx_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FEEDBACK REPORTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.oral_sessions(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  what_went_well JSONB DEFAULT '[]',
  what_bench_exposed JSONB DEFAULT '[]',
  most_dangerous_weakness TEXT,
  authorities_needed JSONB DEFAULT '[]',
  questions_failed JSONB DEFAULT '[]',
  questions_answered_well JSONB DEFAULT '[]',
  facts_misstated JSONB DEFAULT '[]',
  sentences_to_improve JSONB DEFAULT '[]',
  research_required JSONB DEFAULT '[]',
  memorial_changes_required JSONB DEFAULT '[]',
  next_simulation_focus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PREPARATION TASKS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.preparation_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.issues(id),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT CHECK (task_type IN ('research','memorial','oral','citation','fact','statute','maintainability','glossary','drill')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  estimated_minutes INTEGER,
  scheduled_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  source_session_id UUID REFERENCES public.oral_sessions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PREPARATION PLANS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.preparation_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  plan_data JSONB DEFAULT '{}', -- full weekly schedule
  total_days INTEGER,
  days_remaining INTEGER,
  phases JSONB DEFAULT '[]',
  is_current BOOLEAN DEFAULT true
);

-- ─── DOCUMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  doc_type TEXT CHECK (doc_type IN ('proposition','brochure','rules','memorial_guidelines','judgment','statute','academic','other')),
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  ocr_performed BOOLEAN DEFAULT false,
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending','processing','completed','failed')),
  extracted_text TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DOCUMENT CHUNKS (RAG) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  chunk_index INTEGER,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SOURCE METADATA ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.source_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  authority_id UUID REFERENCES public.authorities(id) ON DELETE CASCADE,
  source_type TEXT, -- 'primary', 'secondary', 'tertiary', 'web'
  source_tier INTEGER CHECK (source_tier BETWEEN 1 AND 4),
  source_name TEXT,
  source_url TEXT,
  retrieved_at TIMESTAMPTZ,
  publication_date DATE,
  confidence NUMERIC DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── READINESS SCORES (history) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.readiness_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.moot_cases(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  overall_score INTEGER,
  memorial_score INTEGER,
  research_score INTEGER,
  authorities_score INTEGER,
  jurisdiction_score INTEGER,
  maintainability_score INTEGER,
  facts_score INTEGER,
  oral_score INTEGER,
  language_score INTEGER,
  time_management_score INTEGER,
  citation_integrity_score INTEGER
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_moot_cases_user ON public.moot_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_moot_cases_active ON public.moot_cases(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_issues_case ON public.issues(case_id);
CREATE INDEX IF NOT EXISTS idx_facts_case ON public.facts(case_id);
CREATE INDEX IF NOT EXISTS idx_authorities_case ON public.authorities(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_case ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON public.document_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_oral_sessions_case ON public.oral_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_preparation_tasks_case ON public.preparation_tasks(case_id, completed);
CREATE INDEX IF NOT EXISTS idx_court_records_case ON public.court_records(case_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moot_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oral_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bench_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counsel_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preparation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preparation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies — users own their data
CREATE POLICY "Users own their profile" ON public.users FOR ALL USING (auth.uid() = auth_id);

CREATE POLICY "Users own their cases" ON public.moot_cases FOR ALL
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Cascade policy via case ownership for all sub-tables
CREATE POLICY "Case data access" ON public.propositions FOR ALL
  USING (case_id IN (SELECT id FROM public.moot_cases WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "Case data access" ON public.issues FOR ALL
  USING (case_id IN (SELECT id FROM public.moot_cases WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "Case data access" ON public.facts FOR ALL
  USING (case_id IN (SELECT id FROM public.moot_cases WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "Case data access" ON public.authorities FOR ALL
  USING (case_id IN (SELECT id FROM public.moot_cases WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "Case data access" ON public.memorials FOR ALL
  USING (case_id IN (SELECT id FROM public.moot_cases WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "Case data access" ON public.oral_sessions FOR ALL
  USING (case_id IN (SELECT id FROM public.moot_cases WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE POLICY "Case data access" ON public.documents FOR ALL
  USING (case_id IN (SELECT id FROM public.moot_cases WHERE user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

-- Bench profiles are public (read)
ALTER TABLE public.bench_profiles DISABLE ROW LEVEL SECURITY;

-- ─── SEED: BENCH PROFILES ─────────────────────────────────────────────────────
INSERT INTO public.bench_profiles (name, archetype, description, typical_phrases, focus_areas, interrupt_probability) VALUES
('Justice Anand', 'procedural', 'Focuses on procedural correctness, jurisdiction, and maintainability', 
  '["Counsel, what is your jurisdictional foundation?", "Show us the authority for that proposition.", "Is this petition maintainable in the first place?"]',
  '["maintainability","jurisdiction","procedure","locus standi"]', 0.4),
('Justice Krishnan', 'constitutional', 'Deep constitutional questions, Articles, Fundamental Rights',
  '["How do you read Article 14 in this context?", "What is the constitutional basis for this claim?", "Does this violate the basic structure?"]',
  '["constitution","fundamental rights","basic structure","article 14","article 21"]', 0.35),
('Justice Mehta', 'strict_textualist', 'Literal reading of statutes, plain meaning',
  '["What does the section actually say?", "You cannot read in what the legislature has not provided.", "Where exactly does the statute say that?"]',
  '["statutory interpretation","plain meaning","literal construction"]', 0.3),
('Justice Sharma', 'precedent_focused', 'Binding precedent, ratio vs obiter, bench strength',
  '["Is that ratio or merely an observation?", "What is the bench strength of that judgment?", "Show us a five-judge bench authority on this."]',
  '["precedent","ratio decidendi","obiter","bench strength","overruling"]', 0.35),
('Justice Nair', 'facts_focused', 'Factual matrix, proposition paragraph references',
  '["Take us through the facts.", "Where in the proposition does it say that?", "You are going beyond the factual matrix."]',
  '["facts","proposition","factual matrix","evidence"]', 0.45),
('Justice Verma', 'skeptical', 'Probes every assumption, plays devil''s advocate',
  '["Assuming we accept your submission, what follows?", "But your own argument seems to contradict that.", "Why should this Court accept that?"]',
  '["all issues"]', 0.5),
('Justice Pillai', 'policy_oriented', 'Consequences, public interest, policy implications',
  '["What would be the consequences of your interpretation?", "Is this in the public interest?", "What signal does this send?"]',
  '["policy","public interest","consequences","social impact"]', 0.3),
('Justice Iyer', 'remedy_focused', 'Relief, directions, enforcement, scope of remedy',
  '["What relief are you seeking exactly?", "Can this Court grant that relief?", "What would your order look like?"]',
  '["relief","remedy","directions","enforcement","jurisdiction to grant"]', 0.35),
('Justice Chatterjee', 'highly_interruptive', 'Interrupts frequently, rapid-fire questions',
  '["Counsel, before you proceed—", "Just answer this one question.", "That is not the point. Answer this."]',
  '["all issues"]', 0.75),
('Balanced Bench', 'balanced', 'Well-rounded bench covering all aspects equally',
  '["Counsel, what is your answer to that?", "Assuming we accept your submission, what follows?", "You have one minute remaining."]',
  '["all issues"]', 0.35),
('Constitution Bench', 'constitution_bench', 'Five-judge bench for substantial constitutional questions',
  '["Is there a substantial question of constitutional law involved?", "What is the conflict between High Court judgments?", "Should this be referred to a larger bench?"]',
  '["basic structure","article 32","article 131","substantial question"]', 0.4),
('Devil''s Advocate', 'devils_advocate', 'Takes the opposite position to every submission made',
  '["But counsel for the other side would say—", "Your own authority says the opposite.", "Let me put the respondent''s case to you."]',
  '["all issues"]', 0.6)
ON CONFLICT DO NOTHING;

-- ─── SEED: SAMPLE COMPETITION ─────────────────────────────────────────────────
INSERT INTO public.competitions (name, short_name, organizer, year, jurisdiction, court_simulated) VALUES
('National Moot Court Competition 2025', 'NMCC 2025', 'National Law School', 2025, 'India', 'Supreme Court of India'),
('Philip C. Jessup International Law Moot', 'Jessup 2025', 'ILSA', 2025, 'International', 'International Court of Justice'),
('Henry Dunant Memorial Moot Court', 'HDMMC 2025', 'ICRC', 2025, 'International', 'International Humanitarian Law Tribunal')
ON CONFLICT DO NOTHING;
