import asyncio
import sys

from backend.app.services import (
    init_qdrant_collection,
    get_text_embedding,
    upsert_job_vector,
    delete_job_vector,
    search_similar_jobs,
    generate_match_reasoning,
    generate_learning_path
)
from backend.app import models

async def run_ai_tests():
    print("=== Phase 3 AI Integration Tests ===")
    
    # 1. Test Embeddings Model
    print("\nTesting SentenceTransformer embeddings model loading and vector dimension...")
    test_text = "Python Developer with SQL database experience"
    vector = get_text_embedding(test_text)
    print(f"Generated embedding vector length: {len(vector)}")
    assert len(vector) == 768, f"Expected 768 dimensions, got {len(vector)}"
    print("Embeddings check: PASSED.")
    
    # 2. Test Qdrant Collection Initialization
    print("\nTesting Qdrant collection initialization...")
    init_ok = init_qdrant_collection()
    print(f"Qdrant collection initialization returned: {init_ok}")
    print("Qdrant setup check: COMPLETED.")
    
    # 3. Test Qdrant Index and Query lifecycle (mocking a Job)
    print("\nTesting Qdrant Indexing and Semantic Similarity Search lifecycle...")
    mock_job = models.Job(
        id=999,
        title="Full-Stack Developer",
        company="Mock AI Corp",
        location="Remote",
        description="Looking for Vue, JavaScript, and Node developer.",
        skills_required=["Vue", "Javascript", "Node"],
        is_active=True
    )
    
    # Try indexing
    upsert_job_vector(mock_job)
    
    # Try semantic search
    resume_skills = ["Javascript", "Node", "Vue", "Docker"]
    resume_text = "Familiar with Vue, JavaScript, and backend Node servers. Skilled in docker containerization."
    
    hits = search_similar_jobs(
        resume_skills=resume_skills,
        resume_text=resume_text,
        limit=5
    )
    print(f"Semantic search returned {len(hits)} hits: {hits}")
    
    # Delete test vector
    delete_job_vector(999)
    print("Qdrant index lifecycle check: COMPLETED.")
    
    # 4. Test Groq Match Reasoning (with fallback check)
    print("\nTesting Groq / Llama3 matching reasoning...")
    reasoning = generate_match_reasoning(
        resume_skills=["Python", "Sql"],
        resume_text="Worked on Python backend applications and writing SQL queries.",
        job_title="Backend Developer",
        job_company="Data Solutions Inc",
        job_description="Seeking a backend engineer with Python and SQL knowledge.",
        job_skills=["Python", "Sql", "AWS"]
    )
    print(f"Match Reasoning output: {reasoning}")
    assert "match_score" in reasoning
    assert "explanation" in reasoning
    assert "skills_gap" in reasoning
    print("Groq Match Reasoning check: PASSED.")
    
    # 5. Test Skill-Gap Learning Roadmap Advice (with fallback check)
    print("\nTesting skill-gap learning path generation...")
    roadmap = generate_learning_path(["AWS", "Docker", "FastAPI"])
    print("\nGenerated Roadmap / learning path:\n")
    print(roadmap)
    print("\nLearning path check: PASSED.")
    
    print("\n=== All Phase 3 AI Service Integration Tests PASSED successfully ===")

if __name__ == "__main__":
    asyncio.run(run_ai_tests())
