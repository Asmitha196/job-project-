# AI-Powered Job Recommendation Assistant

## Abstract

The AI Job Recommendation Assistant is a web-based application that helps users find suitable job opportunities using Artificial Intelligence, Natural Language Processing (NLP), 
and Retrieval-Augmented Generation (RAG). Unlike traditional job portals that rely on keyword matching, the system uses semantic search to analyze the user's resume and recommend
jobs based on skills, experience, and context.

The application is developed using React 18, TypeScript, FastAPI (Python), PostgreSQL, and REST APIs, with JWT authentication for secure user registration and login. 
Users can upload resumes, search for jobs, receive AI-powered job recommendations, view skill gap analysis, and save recommended jobs.

The AI module uses LangChain, Sentence Transformers (specifically the `all-mpnet-base-v2` embeddings model), and a Qdrant vector database to retrieve relevant job descriptions through a RAG pipeline. The retrieved information 
is then processed by a Large Language Model via the Groq API to generate personalized recommendations, explain job matches, and suggest skills required for career growth.

This project combines full-stack development, secure authentication, semantic search, vector databases, and modern AI techniques to provide an intelligent and scalable job 
recommendation platform that enhances the recruitment process for both job seekers and organizations.

## Tech Stack
- **Backend:** FastAPI, Python 3.11, PostgreSQL, SQLAlchemy Async, Pydantic V2, JWT Authentication
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **AI/ML:** LangChain, Qdrant Cloud / Local Qdrant, Groq API, `all-mpnet-base-v2` embeddings

## Project Structure

```text
├── backend/
│   └── app/
│       ├── routes/      # API Endpoints (Auth, Jobs, Recommendations, Resumes)
│       ├── services/    # Business Logic & AI RAG Pipelines
│       ├── models/      # SQLAlchemy Database Models
│       ├── schemas/     # Pydantic Schemas for Validation
│       └── utils/       # Utility Functions (JWT, Hashing, File Handlers)
├── frontend/
│   ├── src/
│   │   ├── pages/       # Page components (Dashboard, Login, Jobs, etc.)
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context providers (Auth context, etc.)
│   │   └── services/    # API integration services (axios clients)
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docs/                # Project documentation
├── requirements.txt     # Python requirements
├── docker-compose.yml   # PostgreSQL and Qdrant database services
└── .env.example         # Environment variables configuration template
```

## Setup Instructions

### Prerequisites
- Python 3.11
- Node.js (v18+)
- Docker (for database services)

### Database and Services
Start PostgreSQL and Qdrant using Docker Compose:
```bash
docker-compose up -d
```

### Backend
1. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in details:
   ```bash
   cp .env.example .env
   ```
4. Start FastAPI server:
   ```bash
   uvicorn backend.app.main:app --reload
   ```

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
