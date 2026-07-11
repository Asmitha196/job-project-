"""
qdrant_service.py

Handles all Qdrant operations.

Responsibilities
----------------
1. Connect to Qdrant Cloud
2. Create Collection
3. Delete Collection
4. Upsert Vectors
5. Update Vectors
6. Delete Vectors
7. Search Similar Vectors
"""

from typing import List, Dict, Any

from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)

from backend.app.config import settings
from backend.app.services.embedding_service import (
    get_embedding,
    build_job_text,
)

COLLECTION_NAME = "jobs"


# --------------------------------------------------
# Qdrant Client
# --------------------------------------------------

qdrant_client = QdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY,
    check_compatibility=False,
)


# --------------------------------------------------
# Create Collection
# --------------------------------------------------

def create_collection():

    collections = qdrant_client.get_collections()

    existing = [
        c.name
        for c in collections.collections
    ]

    if COLLECTION_NAME in existing:
        print("Collection already exists.")
        return

    qdrant_client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=384,
            distance=Distance.COSINE,
        ),
    )

    print("Collection created successfully.")


# --------------------------------------------------
# Delete Collection
# --------------------------------------------------

def delete_collection():

    collections = qdrant_client.get_collections()

    existing = [
        c.name
        for c in collections.collections
    ]

    if COLLECTION_NAME not in existing:
        return

    qdrant_client.delete_collection(
        collection_name=COLLECTION_NAME
    )


# --------------------------------------------------
# Rebuild Collection
# --------------------------------------------------

def rebuild_collection():

    delete_collection()

    create_collection()


# --------------------------------------------------
# Insert One Job
# --------------------------------------------------

def upsert_job(job):

    text = build_job_text(
        title=job.title,
        company=job.company,
        description=job.description,
        requirements=job.requirements,
        skills=job.skills_required,
        location=job.location,
    )

    vector = get_embedding(text)

    qdrant_client.upsert(
        collection_name=COLLECTION_NAME,
        wait=True,
        points=[
            PointStruct(
                id=job.id,
                vector=vector,
                payload={
                    "job_id": job.id,
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "description": job.description,
                    "requirements": job.requirements,
                    "skills": job.skills_required,
                },
            )
        ],
    )


# --------------------------------------------------
# Batch Insert
# --------------------------------------------------

def batch_upsert_jobs(jobs):

    points = []

    for job in jobs:

        text = build_job_text(
            title=job.title,
            company=job.company,
            description=job.description,
            requirements=job.requirements,
            skills=job.skills_required,
            location=job.location,
        )

        vector = get_embedding(text)

        points.append(

            PointStruct(

                id=job.id,

                vector=vector,

                payload={

                    "job_id": job.id,

                    "title": job.title,

                    "company": job.company,

                    "location": job.location,

                    "description": job.description,

                    "requirements": job.requirements,

                    "skills": job.skills_required,

                }

            )

        )

    qdrant_client.upsert(

        collection_name=COLLECTION_NAME,

        wait=True,

        points=points,

    )

    print(f"{len(points)} jobs indexed.")


# --------------------------------------------------
# Delete Job
# --------------------------------------------------

def delete_job(job_id: int):

    qdrant_client.delete(

        collection_name=COLLECTION_NAME,

        points_selector=Filter(

            must=[

                FieldCondition(

                    key="job_id",

                    match=MatchValue(value=job_id),

                )

            ]

        ),

    )


# --------------------------------------------------
# Search
# --------------------------------------------------

def search_jobs(
    query: str,
    limit: int = 5,
):

    vector = get_embedding(query)

    results = qdrant_client.query_points(

        collection_name=COLLECTION_NAME,

        query=vector,

        limit=limit,

        with_payload=True,

    )

    return results.points


# --------------------------------------------------
# Collection Info
# --------------------------------------------------

def collection_info():

    return qdrant_client.get_collection(

        collection_name=COLLECTION_NAME

    )


# --------------------------------------------------
# Count Vectors
# --------------------------------------------------

def vector_count():

    info = collection_info()

    return info.points_count