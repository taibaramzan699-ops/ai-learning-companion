# AI Learning Companion — Project Architecture

## 1. Product Vision

**AI Learning Companion** is an AI-native study platform that turns any document a student
uploads — lecture slides, textbook PDFs, scanned notes, images — into a personalized learning
system: a searchable knowledge base, an AI tutor that answers questions grounded in the
student's own material, auto-generated quizzes and flashcards, and a spaced-repetition study
planner.

The differentiator versus a generic ChatGPT wrapper is **grounded, RAG-based study assistance**:
every AI answer is retrieved from the student's own uploaded corpus rather than generic model
knowledge.

**Target outcome:** reduce time-to-mastery for a course unit by combining retrieval-grounded
Q&A, active-recall testing (quizzes/flashcards), and spaced-repetition scheduling.

## 2. User Personas

| Persona | Description | Core Need | Primary Features Used |
|---|---|---|---|
| **Aisha, Undergrad (19)** | Juggling 5 courses, uploads lecture PDFs the night before exams | Fast, trustworthy answers grounded in her own notes | AI Chat, Quiz Generator, Flashcards |
| **Daniyal, Grad Researcher (26)** | Reading dense papers, needs synthesis across many documents | Cross-document semantic search, summarization | AI Notes, Materials Library |
| **Sara, Self-learner (32)** | Studying for a certification exam on her own schedule | Structured study plan with accountability | Study Planner, Flashcards |

## 3. User Journey (implemented)

1. **Discover** → landing page (`frontend/components/landing-page.tsx`) shows product features
2. **Sign up** → Firebase Auth, email/password or Google (`features/auth/`)
3. **Upload material** → drag-and-drop PDF / Word / PowerPoint / image (`features/documents/upload-dropzone.tsx`)
4. **Processing** → OCR (scanned/image content) → text chunking → embeddings → Pinecone upsert
5. **Ask questions** → AI Chat answers grounded only in the student's uploaded content
6. **Generate quiz** → auto-generated quiz from uploaded material
7. **Review flashcards** → auto-generated flashcard decks, spaced-repetition review
8. **Check planner** → spaced-repetition scheduling across materials


## 4. Actual Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind |
| Backend | FastAPI (Python 3.12) |
| Database | MongoDB via Motor (async driver) |
| Vector store | Pinecone (namespaced per user/document) |
| Embeddings / LLM | OpenAI |
| Auth | Firebase (email/password + Google) |
| File storage | Cloudinary |
| OCR | pytesseract + poppler-utils (`pdf2image`) |
| Office file parsing | `office_extraction_service.py` (Word/PowerPoint extraction) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |
| Deployment | Railway (`nixpacks.toml`, `railway.json`, `start.sh`) — migrated off Render, `render.yaml` removed |
| Containerization | Docker (`backend/Dockerfile`) |

## 5. Information Architecture / Sitemap

```
/                          Landing
/login                     Auth
/signup                    Auth
/forgot-password           Auth

/app/chat                  AI Chat (RAG)
/app/materials             Document library / upload
/app/notes                 AI-generated notes
/app/quiz                  Quiz library
/app/quiz/create           Quiz generation
/app/quiz/[id]              Quiz taking + results
/app/flashcards             Deck list
/app/flashcards/create      Create/generate deck
/app/flashcards/[deckId]    Study session (spaced repetition)
/app/planner                 Spaced-repetition planner
```

## 6. Feature Status

```
✅ Built (Core + partial Growth)
├── Auth (Firebase)
├── Document Upload + OCR + chunking + embeddings + Pinecone
├── RAG Chat
├── AI Notes
├── Quiz Generator
├── Flashcards (SM-2 style spaced repetition)
└── Study Planner

🚧 Not yet built (Growth / Platform tier)
├── Analytics Dashboard
├── Study Groups
├── Admin Panel
└── Multi-agent orchestration (LangGraph) — currently single-service AI calls per feature,
    not a shared agent-orchestrator state machine
```

## 7. AI / RAG Pipeline

```
Upload → OCR (if scanned) → Text Extraction → Chunking
   → Embeddings (OpenAI) → Pinecone upsert (namespaced per user/doc)
   → Query time: user question → embed → Pinecone similarity search (top-k)
   → Context assembly → LLM → response
   → Chat/notes/quiz/flashcard state persisted in MongoDB
```

Implemented in `backend/app/services/`:
- `ai_service.py` — core LLM call wrapper
- `chat_service.py` — RAG chat orchestration
- `ocr_service.py` — OCR for scanned/image content
- `office_extraction_service.py` — Word/PowerPoint text extraction
- `cloudinary_service.py` — file storage
- `notes_service_enhanced.py` / `notes_export_service.py` — AI notes + export
- `quiz_service_enhanced.py` — quiz generation
- `flashcard_service_enhanced.py` — flashcard generation + spaced repetition

## 8. Database Relationships (MongoDB)

```
User 1───* Document
User 1───* ChatSession 1───* ChatMessage
User 1───* Notes
User 1───* Quiz 1───* QuizQuestion
User 1───* FlashcardDeck 1───* Flashcard
User 1───* PlannerEvent
Document 1───* Chunk (metadata only — vectors live in Pinecone, referenced by chunk_id)
```

## 9. API Architecture (REST — FastAPI, `/api/v1`)

```
/api/v1/chat/*         chat.py       — RAG chat sessions/messages
/api/v1/notes/*        notes.py      — AI notes CRUD/generation
/api/v1/quiz/*         quiz.py       — quiz generation, submission
/api/v1/flashcard/*    flashcard.py  — deck CRUD, spaced-repetition review
```

Auth handled via `app/core/security.py` (`get_current_user`, `FirebaseUser` — verifies Firebase
token on each request). Config in `app/core/config.py`.

## 10. Actual Folder Structure

```
ai-learning-companion/
├── README.md
├── nixpacks.toml              Railway build config
├── railway.json                Railway deploy config
├── start.sh                    Railway start script
├── docs/
│   ├── project-architecture.md   (this file)
│   └── screenshots/              dashboard, tutor, quiz, planner
├── backend/
│   ├── .github/workflows/ci.yml
│   ├── app/
│   │   ├── api/v1/              chat.py, notes.py, quiz.py, flashcard.py
│   │   ├── core/                 config.py, security.py
│   │   ├── models/                chat.py, flashcard.py, notes_enhanced.py, quiz_enhanced.py
│   │   ├── services/              ai_service.py, chat_service.py, ocr_service.py,
│   │   │                          office_extraction_service.py, cloudinary_service.py,
│   │   │                          notes_service_enhanced.py, notes_export_service.py,
│   │   │                          quiz_service_enhanced.py, flashcard_service_enhanced.py
│   │   └── main.py
│   ├── schemas/                  flashcard.py
│   ├── tests/
│   ├── docs/                     phase-1-architecture.md (superseded by this file)
│   ├── .dockerignore / .env.example / .gitignore
│   ├── Dockerfile
│   ├── pytest.ini
│   ├── requirements.txt
│   └── README.md
└── frontend/
    ├── app/                      login, signup, forgot-password, app/(chat, notes, quiz, flashcards, planner, materials)
    ├── components/               landing-page.tsx, ui/, flashcards/
    ├── features/                 auth/, chat/, documents/, notes/, hooks/
    ├── hooks/
    ├── services/                 api.ts, chat.ts, notes.ts, notes_ai.ts, quiz_ai.ts, flashcard_ai.ts
    ├── store/                    auth-store.ts
    ├── providers/                auth-provider.tsx, query-provider.tsx
    ├── types/
    ├── lib/                      firebase.ts
    └── public/fonts/             Inter, Fraunces, JetBrains Mono
```

## 11. Deployment

- **Backend:** Dockerized, deployed to Railway (`nixpacks.toml` + `railway.json` + `start.sh`).
  Previously deployed via Render (`render.yaml` — removed).
- **CI:** GitHub Actions (`backend/.github/workflows/ci.yml`) runs frontend build/lint checks
  and backend `pytest` on push/PR to `main`.
- **Secrets:** Firebase service account, MongoDB URI, OpenAI/Pinecone keys, Cloudinary
  credentials — all via environment variables, never committed (`backend/.env.example` documents
  required vars; `.gitignore` excludes `.env` and `firebase-service-account.json`).

## 12. Known Gaps vs. Original Phase-1 Plan

- No multi-agent orchestration layer (LangGraph) yet — each AI feature calls the LLM directly
  through its own service rather than a shared agent state machine.
- No Analytics dashboard, Study Groups, or Admin Panel.
- No onboarding wizard — users go straight from signup to the app.
- No billing/subscription tiers.

---
