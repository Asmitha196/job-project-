import os
import json
from typing import List, Dict, Any, Optional
import bcrypt
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.config import settings
from backend.app import models

COLLECTION_NAME = "jobs"

# 1. Qdrant Client Setup
qdrant_client: Optional[QdrantClient] = None
try:
    # Attempt to connect to remote/local Docker Qdrant server
    qdrant_client = QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY,
        timeout=2.0,
        check_compatibility=False
    )
    # Check if remote server is reachable
    qdrant_client.get_collections()
    print(f"Successfully connected to Qdrant server at {settings.QDRANT_URL}")
except Exception as remote_err:
    print(f"WARNING: Remote Qdrant server is offline ({remote_err}). Falling back to embedded local storage Qdrant client...")
    try:
        # Fallback to local file-based Qdrant client
        local_db_path = os.path.join(settings.BASE_DIR, "backend", "local_qdrant_db")
        os.makedirs(local_db_path, exist_ok=True)
        qdrant_client = QdrantClient(path=local_db_path)
        print(f"Embedded local Qdrant initialized at: {local_db_path}")
    except Exception as local_err:
        print(f"CRITICAL: Failed to initialize fallback local Qdrant client: {local_err}")
        qdrant_client = None

# 2. SentenceTransformer Embedding Model (lazy-loaded)

_embeddings_model = TextEmbedding(
    model_name="BAAI/bge-small-en-v1.5"
)

def get_text_embedding(text: str) -> List[float]:
    try:
        embedding = list(_embeddings_model.embed([text]))[0]
        return embedding.tolist()
    except Exception as e:
        print(f"Embedding generation failed: {e}")
        return [0.0] * 384

# 3. Collection Initialization
def check_qdrant_health() -> bool:
    """
    Check if the Qdrant service is online and accessible.
    """
    if not qdrant_client:
        return False
    try:
        qdrant_client.get_collections()
        return True
    except Exception as e:
        print(f"WARNING: Qdrant service is offline or unavailable at {settings.QDRANT_URL}. Skipping Qdrant-specific operations. (Error: {e})")
        return False

def init_qdrant_collection() -> bool:
    """
    Initialize the Qdrant collection for jobs.
    """
    if not check_qdrant_health():
        return False
    try:
        if not qdrant_client.collection_exists(COLLECTION_NAME):
            qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=qmodels.VectorParams(
                    size=768,  # all-mpnet-base-v2 outputs 768-dimensional vectors
                    distance=qmodels.Distance.COSINE
                )
            )
            print(f"Created Qdrant collection: {COLLECTION_NAME}")
        else:
            print(f"Qdrant collection '{COLLECTION_NAME}' already exists.")
        return True
    except Exception as e:
        print(f"WARNING: Failed to initialize Qdrant collection: {e}")
        return False

# 4. Job Indexing Helpers
def upsert_job_vector(job: models.Job):
    """
    Embed job metadata and description, and upsert the vector to Qdrant.
    """
    if not qdrant_client:
        return
    try:
        text_to_embed = (
            f"Title: {job.title}\n"
            f"Company: {job.company}\n"
            f"Location: {job.location or 'Remote'}\n"
            f"Description: {job.description}\n"
            f"Requirements: {job.requirements or ''}\n"
            f"Skills: {', '.join(job.skills_required or [])}"
        )
        vector = get_text_embedding(text_to_embed)
        
        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                qmodels.PointStruct(
                    id=job.id,
                    vector=vector,
                    payload={
                        "id": job.id,
                        "title": job.title,
                        "company": job.company,
                        "location": job.location,
                        "description": job.description,
                        "requirements": job.requirements,
                        "skills_required": job.skills_required
                    }
                )
            ]
        )
        print(f"Indexed/Upserted job {job.id} into Qdrant.")
    except Exception as e:
        print(f"Failed to upsert job vector for job {job.id}: {e}")

def delete_job_vector(job_id: int):
    """
    Delete a job's vector index from Qdrant.
    """
    if not qdrant_client:
        return
    try:
        qdrant_client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=qmodels.PointIdsList(
                points=[job_id]
            )
        )
        print(f"Deleted job {job_id} vector from Qdrant.")
    except Exception as e:
        print(f"Failed to delete job vector for job {job_id}: {e}")

# 5. Semantic Similarity Search
def search_similar_jobs(resume_skills: List[str], resume_text: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Generate embeddings for user's resume, and query Qdrant for semantic similarity matches.
    Returns list of dicts with 'id' and 'score' matching the hit records.
    """
    if not qdrant_client:
        return []
    try:
        text_to_embed = (
            f"Skills: {', '.join(resume_skills or [])}\n"
            f"Resume Text: {resume_text or ''}"
        )
        vector = get_text_embedding(text_to_embed)
        
        # Verify collection exists before query
        if not qdrant_client.collection_exists(COLLECTION_NAME):
            init_qdrant_collection()
            
        hits = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=vector,
            limit=limit
        )
        return [{"id": hit.id, "score": hit.score} for hit in hits]
    except Exception as e:
        print(f"Semantic similarity search failed: {e}")
        return []

# 6. Groq Llama3 Matching Reasoning & Skill Gaps
def generate_match_reasoning(
    resume_skills: List[str], 
    resume_text: str, 
    job_title: str, 
    job_company: str, 
    job_description: str, 
    job_skills: List[str]
) -> Dict[str, Any]:
    """
    Call Groq Llama3 using LangChain to generate match explanation, reasoning,
    and a list of skill gaps. Includes local algorithmic fallback.
    """
    # 1. Prepare algorithmic fallback
    r_skills_lower = {s.lower() for s in (resume_skills or [])}
    j_skills_lower = {s.lower() for s in (job_skills or [])}
    overlapping = r_skills_lower.intersection(j_skills_lower)
    skills_gap = [s for s in (job_skills or []) if s.lower() not in r_skills_lower]
    
    fallback_score = round((len(overlapping) / len(job_skills)) * 100, 1) if job_skills else 50.0
    fallback_explanation = (
        f"You match {len(overlapping)} out of {len(job_skills)} required skills for this position. "
        f"Acquiring skills like {', '.join(skills_gap[:3])} will make you a stronger candidate."
    ) if skills_gap else "You match all key skill requirements for this job."
    
    # 2. Check if Groq API is configured
    if not settings.GROQ_API_KEY or "your_groq_api" in settings.GROQ_API_KEY:
        return {
            "match_score": fallback_score,
            "explanation": fallback_explanation + " (Groq key not configured)",
            "skills_gap": skills_gap
        }
        
    try:
        llm = ChatGroq(
            groq_api_key=settings.GROQ_API_KEY,
            model_name=settings.GROQ_MODEL_NAME,
            temperature=0.2
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert career advisor and job matching assistant. Respond strictly with raw JSON payloads inside markdown code blocks."),
            ("user", """
Analyze the match between the candidate's resume and the target job description.

Candidate Resume Details:
Skills: {resume_skills}
Resume Text Snippet: {resume_text_snippet}

Target Job Details:
Title: {job_title}
Company: {job_company}
Description: {job_description}
Required Skills: {job_skills}

Generate the matching feedback in JSON format. The JSON MUST contain:
1. "match_score": A floating point matching score percentage between 0.0 and 100.0 based on skills overlap and experience relevance.
2. "explanation": A detailed, professional 2-3 sentence matching reason explaining why they align.
3. "skills_gap": A list of missing skills from the job description that the candidate should learn.

Return ONLY the JSON payload inside standard markdown JSON code blocks. Do not add any conversational text before or after the JSON.
            """)
        ])
        
        chain = prompt | llm
        response = chain.invoke({
            "resume_skills": ", ".join(resume_skills),
            "resume_text_snippet": (resume_text or "")[:1000],
            "job_title": job_title,
            "job_company": job_company,
            "job_description": job_description[:1000],
            "job_skills": ", ".join(job_skills)
        })
        
        content = response.content.strip()
        
        # Extract JSON block
        if "```json" in content:
            json_str = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            json_str = content.split("```")[1].split("```")[0].strip()
        else:
            json_str = content
            
        parsed = json.loads(json_str)
        return {
            "match_score": float(parsed.get("match_score", fallback_score)),
            "explanation": parsed.get("explanation", fallback_explanation),
            "skills_gap": parsed.get("skills_gap", skills_gap)
        }
    except Exception as e:
        print(f"Groq API call failed: {e}. Using algorithmic fallback.")
        return {
            "match_score": fallback_score,
            "explanation": fallback_explanation + f" (Fallback: API error {type(e).__name__})",
            "skills_gap": skills_gap
        }

# 7. Learning Path/Roadmap Generation
def generate_learning_path(skills_gap_list: List[str]) -> str:
    """
    Call Groq Llama3 to generate a personalized Step-by-Step Career roadmap
    for the candidate's missing skills. Includes local fallback.
    """
    fallback_path = (
        "Here is your customized skill-gap roadmap:\n\n" +
        "\n".join(f"{i+1}. **{skill}**: Practice building small projects and review documentation for {skill}." 
                  for i, skill in enumerate(skills_gap_list[:5]))
    )
    
    if not skills_gap_list:
        return "Excellent! You have all the skills required for these jobs. Keep learning and practicing!"
        
    if not settings.GROQ_API_KEY or "your_groq_api" in settings.GROQ_API_KEY:
        return fallback_path + "\n\n(Note: Setup GROQ_API_KEY in .env for custom AI-guided paths)"
        
    try:
        llm = ChatGroq(
            groq_api_key=settings.GROQ_API_KEY,
            model_name=settings.GROQ_MODEL_NAME,
            temperature=0.3
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert career coach. Generate a concise and actionable step-by-step career learning path / roadmap in markdown format."),
            ("user", """
The candidate is missing these skills: {missing_skills}.
Generate a short step-by-step learning roadmap in markdown format. 
For each missing skill, suggest:
1. Key concepts to focus on.
2. Free resources or learning strategies.
3. A quick practical project idea.

Keep it structured, clear, and under 250 words total.
            """)
        ])
        
        chain = prompt | llm
        response = chain.invoke({"missing_skills": ", ".join(skills_gap_list)})
        return response.content.strip()
    except Exception as e:
        print(f"Groq learning path generation failed: {e}")
        return fallback_path

# 8. Database Startup Sync
async def sync_db_jobs_to_qdrant(db: AsyncSession):
    """
    Synchronize active jobs from PostgreSQL database to Qdrant collection.
    """
    if not check_qdrant_health():
        return
        
    try:
        # Check if collection exists
        init_qdrant_collection()
        
        # Load all active jobs from PostgreSQL
        query = select(models.Job).where(models.Job.is_active == True)
        result = await db.execute(query)
        jobs = result.scalars().all()
        
        print(f"Syncing {len(jobs)} active jobs to Qdrant collection '{COLLECTION_NAME}'...")
        for job in jobs:
            upsert_job_vector(job)
        print("Startup job synchronization to Qdrant completed.")
    except Exception as e:
        print(f"WARNING: Job sync to Qdrant failed on startup: {e}")
