from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.services.rag_service import ask_rag

router = APIRouter(
    tags=["RAG"]
)


class RAGRequest(BaseModel):
    resume_text: str

@router.post("/recommend")
async def rag_recommend(request: RAGRequest):
    response = await ask_rag(
        request.resume_text
    )

    return response