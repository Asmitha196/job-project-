"""
rag_service.py

Retrieval Augmented Generation Service

Flow

PostgreSQL
    ↓
FastEmbed
    ↓
Qdrant
    ↓
Retrieve Context
    ↓
Groq
    ↓
AI Response
"""

from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from backend.app.config import settings
from backend.app import models

from backend.app.services.embedding_service import (
    build_resume_text,
)

from backend.app.services.qdrant_service import (
    create_collection,
    batch_upsert_jobs,
    search_jobs,
)


# ---------------------------------------------------------
# Embed Entire Database
# ---------------------------------------------------------

async def embed_database(db: AsyncSession):
    """
    Read all active jobs from PostgreSQL
    and index them into Qdrant.
    """

    create_collection()

    result = await db.execute(

        select(models.Job).where(

            models.Job.is_active == True

        )

    )

    jobs = result.scalars().all()

    if not jobs:

        return {

            "success": False,

            "message": "No jobs found."

        }

    batch_upsert_jobs(jobs)

    return {

        "success": True,

        "indexed": len(jobs)

    }


# ---------------------------------------------------------
# Retrieve Similar Jobs
# ---------------------------------------------------------

async def retrieve_jobs(

    question: str,

    top_k: int = 5,

):

    results = search_jobs(

        query=question,

        limit=top_k,

    )

    return results


# ---------------------------------------------------------
# Build Context
# ---------------------------------------------------------

def build_context(results):

    if not results:

        return "No relevant jobs found."

    context = []

    for point in results:

        payload = point.payload

        context.append(

            f"""

Job ID:
{payload.get('job_id')}

Title:
{payload.get('title')}

Company:
{payload.get('company')}

Location:
{payload.get('location')}

Description:
{payload.get('description')}

Requirements:
{payload.get('requirements')}

Skills:
{payload.get('skills')}

"""

        )

    return "\n-----------------------------\n".join(context)


# ---------------------------------------------------------
# Initialize Groq
# ---------------------------------------------------------

llm = ChatGroq(

    groq_api_key=settings.GROQ_API_KEY,

    model_name=settings.GROQ_MODEL_NAME,

    temperature=0.2,

)

# ---------------------------------------------------------
# Prompt Template
# ---------------------------------------------------------

PROMPT = ChatPromptTemplate.from_template(
"""
You are an intelligent AI Job Recommendation Assistant.

Answer ONLY using the retrieved context below.

If the answer is unavailable in the retrieved context,
reply politely with:

"I couldn't find relevant information in the knowledge base."

Retrieved Context

{context}

User Question

{question}

Return a professional answer.
"""
)


# ---------------------------------------------------------
# Ask RAG
# ---------------------------------------------------------

async def ask_rag(
    question: str,
    top_k: int = 5,
):

    try:

        results = await retrieve_jobs(
            question,
            top_k
        )

        if not results:

            return {
                "success": False,
                "answer": "No relevant information found."
            }

        context = build_context(results)

        chain = PROMPT | llm

        response = chain.invoke({

            "context": context,

            "question": question

        })

        return {

            "success": True,

            "answer": response.content,

            "sources": [

                {

                    "job_id": point.payload.get("job_id"),

                    "title": point.payload.get("title"),

                    "company": point.payload.get("company"),

                    "score": round(point.score, 3)

                }

                for point in results

            ]

        }

    except Exception as e:

        return {

            "success": False,

            "answer": str(e)

        }


# ---------------------------------------------------------
# Semantic Search
# ---------------------------------------------------------

async def search_jobs(

    question: str,

    limit: int = 5,

):

    results = await retrieve_jobs(

        question,

        limit

    )

    response = []

    for point in results:

        response.append({

            "score": point.score,

            "payload": point.payload

        })

    return response


# ---------------------------------------------------------
# Delete Collection
# ---------------------------------------------------------

from backend.app.services.qdrant_service import delete_collection


async def delete_all_vectors():

    delete_collection()

    return {

        "success": True,

        "message": "Collection deleted."

    }


# ---------------------------------------------------------
# Rebuild Collection
# ---------------------------------------------------------

from backend.app.services.qdrant_service import rebuild_collection


async def rebuild_vectors(

    db: AsyncSession

):

    rebuild_collection()

    return await embed_database(db)