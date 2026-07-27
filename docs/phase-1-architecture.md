# AI Learning Companion — Phase 1: Product Architecture

## 1. Product Vision

**AI Learning Companion** is an AI-native study platform that turns any document a student uploads — lecture slides, textbook PDFs, scanned notes — into a personalized learning system: a searchable knowledge base, an AI tutor that answers questions grounded in the student's own material, auto-generated quizzes and flashcards, and a planner that schedules review sessions using spaced repetition.

The differentiator versus a generic ChatGPT wrapper is **grounded, agentic study assistance**: every AI answer is retrieved from the student's own uploaded corpus (RAG), and a team of specialized agents (planner, quiz, flashcard, summary, reminder, analytics, research) collaborate rather than a single chat model doing everything.

**Target outcome:** reduce time-to-mastery for a course unit by combining retrieval-grounded Q&A, active-recall testing (quizzes/flashcards), and adaptive scheduling — with measurable analytics showing retention over time.

## 2. User Personas

| Persona | Description | Core Need | Primary Features Used |
|---|---|---|---|
| **Aisha, Undergrad (19)** | Juggling 5 courses, uploads lecture PDFs the night before exams | Fast, trustworthy answers grounded in her own notes | AI Chat, Quiz Generator, Flashcards |
| **Daniyal, Grad Researcher (26)** | Reading dense papers, needs synthesis across many documents | Cross-document semantic search, summarization | Semantic Search, AI Notes, Research Agent |
| **Sara, Self-learner (32)** | Studying for a certification exam on her own schedule | Structured study plan with accountability | Study Planner, Reminder Agent, Analytics |
| **Admin/Instructor (persona, later)** | Oversees a study group or cohort | Visibility into group progress | Study Groups, Admin Panel |

## 3. User Journey (primary — Aisha)

1. **Discover** → lands on marketing page, sees demo of "upload a PDF → ask it questions"
2. **Sign up** → Firebase Auth (email or Google)
3. **Onboard** → short wizard: subjects, exam date, study hours/week
4. **Upload material** → drags in lecture slides + textbook chapter
5. **Processing** → sees OCR/chunking/embedding progress in real time
6. **Ask questions** → AI Chat answers with citations back to page/slide
7. **Generate quiz** → Quiz Agent creates a 10-question quiz from the uploaded chapter
8. **Review flashcards** → Flashcard Agent extracts key terms, spaced-repetition scheduling begins
9. **Check planner** → Study Planner shows next review session, auto-scheduled
10. **Track progress** → Analytics dashboard shows retention curve, weak topics
11. **Return daily** → Reminder Agent nudges via notification/email

## 4. Information Architecture

```
Root
├── Marketing (public)
│   ├── Landing
│   ├── Pricing
│   └── Features
├── Auth
│   ├── Sign In
│   ├── Sign Up
│   └── Forgot Password
└── App (authenticated)
    ├── Dashboard
    ├── Materials (Library)
    │   ├── Upload Wizard
    │   └── Document Viewer
    ├── AI Chat
    ├── AI Notes
    ├── Quiz Generator
    ├── Flashcards
    ├── Study Planner
    ├── Analytics
    ├── Study Groups
    ├── Profile
    ├── Settings
    └── Admin Panel (role-gated)
```

## 5. Complete Sitemap

```
/                          Landing
/pricing                   Pricing
/login                     Auth
/signup                    Auth
/forgot-password           Auth
/onboarding                Post-signup wizard

/app/dashboard             Overview: recent docs, due reviews, streak
/app/materials             Library grid/list
/app/materials/upload      Upload wizard (drag/drop, OCR status)
/app/materials/[docId]     Document viewer + chat-with-doc panel
/app/chat                  General AI Chat (cross-document)
/app/chat/[sessionId]      Specific chat thread
/app/notes                 AI-generated notes list
/app/notes/[noteId]        Note editor
/app/quiz                  Quiz library
/app/quiz/generate         Quiz generation wizard
/app/quiz/[quizId]         Quiz taking + results
/app/flashcards            Deck list
/app/flashcards/[deckId]   Study session (spaced repetition)
/app/planner               Calendar + agenda view
/app/analytics             Charts: mastery, time studied, retention
/app/groups                Study group list
/app/groups/[groupId]      Group workspace
/app/profile               Public profile / achievements
/app/settings              Account, billing, integrations, notifications
/app/admin                 User mgmt, usage, feature flags (role-gated)
```

## 6. Feature Hierarchy

```
Core (MVP)
├── Auth (Firebase)
├── Document Upload + OCR
├── RAG Chat
├── Quiz Generation
└── Flashcards

Growth (V2)
├── Study Planner (spaced repetition scheduling)
├── Analytics Dashboard
├── AI Notes (auto-summarization)
└── Study Groups

Platform (V3)
├── Admin Panel
├── Speech-to-Text module
├── Multi-agent orchestration (LangGraph)
└── Billing / subscription tiers
```

## 7. Screen Flow (high level)

```
Landing → Sign Up → Onboarding → Dashboard
                                    │
        ┌───────────────┬──────────┼───────────────┬───────────┐
        ▼               ▼          ▼               ▼           ▼
    Materials         AI Chat    Quiz Gen      Flashcards    Planner
        │                                          │
        ▼                                          ▼
   Upload Wizard                            Spaced-Rep Session
        │                                          │
        ▼                                          ▼
  Processing Status                          Analytics Update
        │
        ▼
  Document Viewer ──(ask question)──> AI Chat (scoped to doc)
```

## 8. AI Workflow (RAG pipeline — detailed in Phase 6)

```
Upload → OCR (if scanned) → Text Extraction → Chunking (semantic, ~500 tokens)
   → Embeddings (OpenAI text-embedding-3-large) → Pinecone upsert (namespaced per user/doc)
   → Query time: user question → embed → Pinecone similarity search (top-k)
   → Context assembly + citation metadata → GPT-4-class model → streamed response
   → Chat memory persisted (MongoDB) → Analytics event logged
```

## 9. Agent Workflow (detailed in Phase 5 build)

```
Orchestrator (LangGraph state machine)
   ├── Study Agent      — decides what the student should work on next
   ├── Planner Agent     — builds/updates the calendar using spaced repetition
   ├── Quiz Agent        — generates quizzes from retrieved chunks
   ├── Flashcard Agent    — extracts term/definition pairs
   ├── Summary Agent      — condenses documents into structured notes
   ├── Reminder Agent      — triggers notifications based on planner state
   ├── Analytics Agent     — aggregates study events into metrics
   └── Research Agent      — cross-document semantic search & synthesis

Agents communicate via a shared LangGraph state object (not direct calls),
so each agent reads/writes typed state and the orchestrator routes between them.
```

## 10. Database Relationships (MongoDB — full schema in Phase 6)

```
User 1───* Document
User 1───* ChatSession 1───* ChatMessage
User 1───* Quiz 1───* QuizQuestion
User 1───* FlashcardDeck 1───* Flashcard
User 1───* PlannerEvent
User 1───* StudyGroupMembership *───1 StudyGroup
Document 1───* Chunk (metadata only — vectors live in Pinecone, referenced by chunk_id)
User 1───* AnalyticsEvent
```

## 11. API Architecture (REST — FastAPI, versioned `/api/v1`)

```
/api/v1/auth/*            verify Firebase token → issue app session
/api/v1/documents          CRUD, upload, processing status
/api/v1/chat/sessions      list/create chat sessions
/api/v1/chat/messages      send message (streams via SSE)
/api/v1/quiz               generate, list, submit answers
/api/v1/flashcards         deck CRUD, review submission (SM-2 algorithm)
/api/v1/planner            events CRUD, auto-schedule endpoint
/api/v1/analytics          aggregated metrics endpoints
/api/v1/groups             study group CRUD
/api/v1/admin              role-gated management endpoints
```

## 12. Folder Structure (top level — full detail in Phase 7/backend build)

```
ai-learning-companion/
├── frontend/                 Next.js 15 (App Router)
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── store/
│   ├── utils/
│   ├── providers/
│   └── middleware.ts
├── backend/                  FastAPI
│   ├── app/
│   │   ├── api/v1/
│   │   ├── core/           (config, security)
│   │   ├── models/         (Pydantic)
│   │   ├── db/             (Motor/MongoDB)
│   │   ├── services/       (RAG, agents, OCR)
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── .github/workflows/        CI/CD
└── docs/                     architecture docs (this file lives here)
```

---

### Next step
Say **"approved, start Phase 2"** and I'll build the full Design System (tokens, component specs, dark/light themes) — or tell me what to adjust in Phase 1 first.
