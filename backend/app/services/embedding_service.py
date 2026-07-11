"""
embedding_service.py

This module is responsible for generating vector embeddings
using FastEmbed.

Model:
    BAAI/bge-small-en-v1.5

Embedding Dimension:
    384
"""

from typing import List
from fastembed import TextEmbedding

# ---------------------------------------------------------
# Initialize FastEmbed Model
# ---------------------------------------------------------

_embedding_model = TextEmbedding(
    model_name="BAAI/bge-small-en-v1.5"
)


# ---------------------------------------------------------
# Generate embedding for a single text
# ---------------------------------------------------------

def get_embedding(text: str) -> List[float]:
    """
    Generate embedding for a single text.

    Args:
        text (str): Input text.

    Returns:
        List[float]: 384-dimensional embedding.
    """

    if not text:
        text = ""

    try:
        embedding = list(_embedding_model.embed([text]))[0]
        return embedding.tolist()
    except Exception as e:
        raise RuntimeError(f"Embedding generation failed: {e}")


# ---------------------------------------------------------
# Generate embeddings for multiple texts
# ---------------------------------------------------------

def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for multiple texts.

    Args:
        texts (List[str]): List of input strings.

    Returns:
        List[List[float]]
    """

    if not texts:
        return []

    try:
        embeddings = _embedding_model.embed(texts)
        return [vector.tolist() for vector in embeddings]
    except Exception as e:
        raise RuntimeError(f"Embedding generation failed: {e}")


# ---------------------------------------------------------
# Combine Job Fields
# ---------------------------------------------------------

def build_job_text(
    title: str,
    company: str,
    description: str,
    requirements: str,
    skills: List[str],
    location: str = ""
) -> str:
    """
    Converts job fields into one searchable document.

    Returns:
        str
    """

    skills_text = ", ".join(skills or [])

    title = title or ""
    company = company or ""
    description = description or ""
    requirements = requirements or ""
    location = location or ""

    return f"""
Title:
{title}

Company:
{company}

Location:
{location}

Description:
{description}

Requirements:
{requirements}

Skills:
{skills_text}
""".strip()


# ---------------------------------------------------------
# Combine Resume Fields
# ---------------------------------------------------------

def build_resume_text(
    resume_text: str,
    skills: List[str]
) -> str:
    """
    Converts resume into searchable text.
    """

    resume_text = resume_text or ""
    skills_text = ", ".join(skills or [])
    return f"""
Resume

Skills:
{skills_text}

Content:
{resume_text}
""".strip()