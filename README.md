# AI Learning Companion

Production SaaS: upload course material → get a RAG-grounded AI tutor, auto-generated quizzes/flashcards, and a spaced-repetition study planner.

## Stack
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind, shadcn-style components, Framer Motion, Zustand, TanStack Query
- **Backend:** FastAPI, Motor (async MongoDB), Pydantic
- **Auth:** Firebase Authentication (client SDK + Admin SDK token verification)
- **Database:** MongoDB Atlas
- **Vector DB:** Pinecone
- **File storage:** Cloudinary
- **AI:** OpenAI (chat + embeddings), LangChain, LangGraph agents

## Prerequisites (real accounts required — nothing here is mocked)
1. **Firebase project** — enable Email/Password + Google sign-in. Download a service-account JSON (Project Settings → Service Accounts) for the backend, and copy the web app config for the frontend.
2. **MongoDB Atlas cluster** — create a free/shared cluster, get the connection string, whitelist your IP (or `0.0.0.0/0` for dev).
3. **Pinecone account** — create an index with dimension `3072` (matches `text-embedding-3-large`), metric `cosine`.
4. **Cloudinary account** — get cloud name, API key, API secret.
5. **OpenAI API key** with access to a GPT-4-class model.

## Local setup

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in real credentials
# place your Firebase service account JSON at the path set in FIREBASE_CREDENTIALS_PATH
uvicorn app.main:app --reload --port 8000
```
Visit `http://localhost:8000/api/docs` for the live Swagger UI.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # fill in real Firebase web config + API URL
npm run dev
```
Visit `http://localhost:3000`.

## Testing
```bash
# backend
cd backend && pytest -q

# frontend
cd frontend && npm run lint && npm run type-check
```

## Deployment
- **Frontend →Vercel:** import the repo, set root directory to `frontend`, add the same env vars as `.env.local`.
- **Backend → Render:** new Web Service, root directory `backend`, build command `pip install -r requirements.txt`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, add the same env vars as `.env`.
- CI runs lint/type-check/build (frontend) and pytest (backend) on every PR via `.github/workflows/ci.yml`.

## Project structure
See `docs/phase-1-architecture.md` for the full architecture, sitemap, and data model.

## Build status
- [x] Phase 1 — Architecture
- [x] Project scaffolding (frontend + backend, auth wiring)
- [x] Documents module (upload, OCR, chunking, embeddings, Pinecone)
- [ ] RAG chat
- [ ] Notes
- [ ] Quiz generator
- [ ] Flashcards
- [ ] Study planner
- [ ] Analytics
