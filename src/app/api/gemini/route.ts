import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export const maxDuration = 120

const API_KEY = process.env.GEMINI_API_KEY || ''
const genai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null

// Candidate models in order of priority
const MODELS = ['gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

interface GenOptions {
  json?: boolean
  search?: boolean
  maxTokens?: number
  temperature?: number
  parts?: any[]
}

async function generate(prompt: string, opts: GenOptions = {}) {
  if (!genai) throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in your environment variables.')

  let lastError: any = null
  for (const model of MODELS) {
    try {
      const config: any = {
        temperature: opts.temperature ?? 0.3,
        maxOutputTokens: opts.maxTokens ?? 8000,
      }
      if (opts.json) config.responseMimeType = 'application/json'
      if (opts.search) config.tools = [{ googleSearch: {} }]

      const response = await genai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [...(opts.parts || []), { text: prompt }] }],
        config,
      })

      if (response?.text) {
        const chunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks || []
        const sources = chunks
          .map((c: any) => c.web)
          .filter((w: any) => w?.uri)
          .map((w: any) => ({ uri: w.uri as string, title: (w.title || w.uri) as string }))
        return { text: response.text, sources }
      }
    } catch (err: any) {
      lastError = err
      continue
    }
  }
  throw lastError || new Error('Failed to generate with all available models')
}

async function callGemini(prompt: string, jsonMode = false) {
  return (await generate(prompt, { json: jsonMode })).text
}

async function callJson(prompt: string, maxTokens = 8000) {
  const { text } = await generate(prompt, { json: true, maxTokens })
  try {
    return JSON.parse(text)
  } catch {
    // Strip accidental markdown fences and retry
    const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    return JSON.parse(cleaned)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, payload } = body

    switch (action) {
      case 'health': {
        return NextResponse.json({ gemini: !!genai })
      }

      case 'analyzeMaintainability': {
        const { caseContext, petitionerPosition, respondentPosition } = payload
        const prompt = `You are a constitutional law expert and moot court judge.
Analyze the maintainability of this case before the Supreme Court / High Court.
Case Context: ${caseContext}
Petitioner Position: ${petitionerPosition || 'Not specified'}
Respondent Position: ${respondentPosition || 'Not specified'}

Return JSON:
{
  "score": number (0-100),
  "strongestPoint": string,
  "weakestPoint": string,
  "likelyBenchAttack": string,
  "requiredAuthority": string,
  "factors": [
    {
      "name": string,
      "strength": number (0-100),
      "status": "strong" | "weak",
      "note": string
    }
  ],
  "benchAttacks": [
    {
      "q": string,
      "difficulty": "HIGH" | "MEDIUM" | "LOW"
    }
  ]
}`
        return NextResponse.json(await callJson(prompt))
      }

      case 'verifyCitation': {
        const { citation, proposition } = payload
        const prompt = `You are a meticulous Indian legal citation auditor. Assess the citation below. You have NO access to SCC Online, so never claim certainty you do not have; if you do not clearly recognise the case with that exact citation, use POSSIBLE_HALLUCINATION or PARTIALLY_VERIFIED.
Citation: ${citation}
Proposition it is cited for: ${proposition || 'Not specified'}

Return JSON: {"status": "VERIFIED"|"PARTIALLY_VERIFIED"|"SOURCE_CONFLICT"|"MIS_CITATION"|"POSSIBLE_HALLUCINATION"|"OVERRULED"|"PROPOSITION_NOT_SUPPORTED", "notes": string (2-3 sentences: what the case actually held, bench strength, any later overruling/distinguishing, whether it supports the proposition), "correct_citation": string|null}`
        return NextResponse.json(await callJson(prompt))
      }

      case 'extractText': {
        // Extract text from a PDF or image (OCR) using Gemini's multimodal input
        const { mimeType, data } = payload
        const { text } = await generate(
          'Extract ALL text from this document verbatim, preserving headings, numbering and paragraph structure. Output only the extracted text, with no commentary.',
          { temperature: 0, maxTokens: 32000, parts: [{ inlineData: { mimeType, data } }] }
        )
        return NextResponse.json({ text })
      }

      case 'briefJudgment': {
        const { text } = payload
        const prompt = `You are a Senior Advocate. Prepare a concise case brief of the following judgment for moot court use.
Return JSON: {"name": string, "cite": string, "court": string, "year": number|null, "facts": string, "issues": string[], "holding": string, "ratio": string, "obiter": string}
Use "Not stated" where information is absent. Do not invent citations.

JUDGMENT TEXT:
${String(text).slice(0, 60000)}`
        return NextResponse.json(await callJson(prompt))
      }

      case 'legalResearch': {
        const { query, caseContext } = payload
        const prompt = `You are a distinguished Senior Advocate and Constitutional Law scholar specializing in Indian Supreme Court jurisprudence and moot court competitions.
Conduct thorough, authoritative legal research on this query.

Active Case Context: ${caseContext || 'None provided'}
Research Query: ${query}

Structure your response into:
1. Primary Ratio Decidendi (Binding precedents from SC of India - include full citations like AIR / SCC)
2. Persuasive Authorities & High Court Positions
3. Statutory & Constitutional Framework (Specific Articles and Sections)
4. Strategic Counter-Arguments & Distinguishing Precedents
5. Moot Court Advocacy Guidance (How to frame this before a 3-judge constitutional bench)

Never hallucinate fake citations. If an authority is persuasive only, explicitly label it. Maintain formal Indian judicial register.`

        let result
        try {
          // Prefer Google Search grounding so sources are real
          result = await generate(prompt, { search: true, maxTokens: 8000 })
        } catch {
          result = await generate(prompt, { maxTokens: 8000 })
        }
        return NextResponse.json({ text: result.text, sources: result.sources })
      }

      case 'generateBenchQuestion': {
        const { issue, currentArgument, archetype, difficulty, previousQuestions, propositionContext, caseContext } = payload
        const prompt = `You are a simulated moot court judge with archetype: ${archetype} (Difficulty: ${difficulty}/5).
Case: ${caseContext || 'Constitutional Challenge'}
Proposition: ${propositionContext || 'Administrative & Constitutional Matter'}
Current Issue: ${issue}
Counsel's Argument: ${currentArgument}
Previous Questions: ${(previousQuestions || []).slice(-3).join('; ')}

Generate ONE incisive, direct judicial question in formal Indian courtroom register (e.g. "Counsel, ...").
Do NOT include explanations. Just return the judge's spoken question.`
        const text = await callGemini(prompt)
        return NextResponse.json({ question: text.replace(/^"|"$/g, '').trim() })
      }

      case 'scoreCounselAnswer': {
        const { question, answer, issue, propositionContext } = payload
        const prompt = `Evaluate this moot court counsel answer.
Question: ${question}
Answer: ${answer}
Issue: ${issue}
Context: ${propositionContext}

Return JSON with:
{
  "score": number (0-100),
  "legal_accuracy": number (0-20),
  "structure": number (0-20),
  "authority_cited": boolean,
  "fact_accurate": boolean,
  "language_quality": number (0-20),
  "strengths": string[],
  "weaknesses": string[],
  "suggested_improvement": string,
  "follow_up_warranted": boolean,
  "bench_reaction": "satisfied" | "curious" | "skeptical" | "unconvinced"
}`
        return NextResponse.json(await callJson(prompt))
      }

      case 'generateSessionFeedback': {
        const { questions, totalScore, issue, side } = payload
        const prompt = `You are a veteran moot court coach. Analyse this oral round and give honest coaching.
Issue argued: ${issue}
Side: ${side}
Overall score so far: ${totalScore}/100
Q&A transcript with per-answer scores: ${JSON.stringify(questions)}

Return JSON:
{
  "scores": {"legalAccuracy": number(0-100), "structure": number(0-100), "authorityUsage": number(0-100), "facturalAccuracy": number(0-100), "languageQuality": number(0-100)},
  "strengths": string[],
  "weaknesses": string[],
  "researchNeeded": string[],
  "nextFocus": string
}
Base everything strictly on the transcript. If the transcript is very short, say so in weaknesses and score conservatively.`
        return NextResponse.json(await callJson(prompt))
      }

      case 'analyzeMemorial': {
        const { memorialText } = payload
        const prompt = `Analyze this moot court memorial text.
Text: ${memorialText?.substring(0, 20000)}

Return JSON:
{
  "argument_strength": number (0-100),
  "citation_integrity": number (0-100),
  "structure_score": number (0-100),
  "issues": [{"type": "critical"|"high"|"medium"|"low", "location": string, "description": string, "suggestion": string}],
  "strengths": string[],
  "missing_authorities": string[],
  "bench_attacks": string[]
}`
        return NextResponse.json(await callJson(prompt))
      }

      case 'deconstructProposition': {
        const { text } = payload
        const prompt = `Deconstruct this moot court proposition text into structured JSON. Use only information present in the text; use "Not stated" or empty arrays where absent.
${text?.substring(0, 80000)}

Return JSON:
{
  "competition_name": string,
  "year": string,
  "court": string,
  "jurisdiction": string,
  "parties": {"petitioner": string, "respondent": string},
  "procedural_posture": string,
  "relief_sought": string,
  "admitted_facts": string[],
  "disputed_facts": string[],
  "relevant_statutes": string[],
  "constitutional_provisions": string[],
  "issues": [
    {
      "number": number,
      "title": string,
      "statement": string,
      "petitioner_position": string,
      "respondent_position": string,
      "sub_issues": string[],
      "relevant_statutes": string[],
      "constitutional_articles": string[],
      "legal_questions": string[]
    }
  ],
  "key_dates": [{"event": string, "date": string}],
  "maintainability_issues": string[]
}`
        return NextResponse.json(await callJson(prompt, 16000))
      }

      case 'interpretStatute': {
        const { sectionText, sectionNumber, actTitle, issue, userPosition } = payload
        const prompt = `Statutory Interpretation of:
Act: ${actTitle}
Section: ${sectionNumber} - ${sectionText}
Issue: ${issue}
Position: ${userPosition}

Return JSON with:
{
  "plain_meaning": string,
  "key_terms": [{"term": string, "definition": string}],
  "statutory_context": string,
  "interpretive_approaches": [{"approach": string, "analysis": string, "supports_position": string, "relevance": string}],
  "related_provisions": string[],
  "legislative_purpose": string,
  "bench_observations": string[],
  "strength_for_user": number,
  "caution": string
}`
        return NextResponse.json(await callJson(prompt))
      }

      case 'generatePreparationSchedule': {
        const { daysRemaining, memorialDeadline, oralDate, currentScores, issues } = payload
        const prompt = `Generate a realistic preparation schedule for a moot court team.
Days remaining: ${daysRemaining}
Memorial deadline: ${memorialDeadline}
Oral rounds: ${oralDate}
Current readiness scores: ${JSON.stringify(currentScores || {})}
Issues: ${JSON.stringify(issues || [])}
Prioritise the weakest areas. Fit everything within the days remaining.

Return JSON with:
{
  "phases": [{"name": string, "start_day": number, "end_day": number, "focus": string, "daily_tasks": string[]}],
  "weekly_schedule": [{"week": number, "theme": string, "days": [{"day": number, "date_offset": number, "tasks": [{"time": string, "duration_min": number, "type": string, "title": string, "description": string}]}]}],
  "milestones": [{"title": string, "date_offset": number, "description": string}],
  "daily_drills": [{"type": string, "title": string, "prompt": string}]
}`
        return NextResponse.json(await callJson(prompt, 12000))
      }

      case 'checkFactConsistency': {
        const { statement, facts } = payload
        const prompt = `Check statement against facts.
Statement: "${statement}"
Facts: ${JSON.stringify(facts)}

Return JSON:
{
  "status": "FACT_MATCH" | "FACT_EXPANSION" | "UNSUPPORTED_INFERENCE" | "FACTUAL_CONTRADICTION" | "PROPOSITION_VIOLATION",
  "confidence": number,
  "discrepancy": string | null,
  "relevant_fact_ids": string[],
  "explanation": string
}`
        return NextResponse.json(await callJson(prompt))
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
