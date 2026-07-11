from fastapi import APIRouter, HTTPException, status
from langchain_groq import ChatGroq
from backend.app.config import settings

router = APIRouter()

@router.get("/test", status_code=status.HTTP_200_OK)
async def test_groq():
    """
    Test connectivity to the Groq LLM.
    Sends a test greeting prompt and returns Llama3's response.
    """
    if not settings.GROQ_API_KEY or "your_groq_api" in settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GROQ_API_KEY is not configured in the settings or environment."
        )
        
    try:
        # Connect to Groq using langchain-groq
        llm = ChatGroq(
            groq_api_key=settings.GROQ_API_KEY,
            model_name=settings.GROQ_MODEL_NAME,
            temperature=0.2
        )
        # Send prompt asynchronously
        response = await llm.ainvoke("Say hello from the AI-Powered Job Recommendation Assistant")
        return {
            "status": "success",
            "message": response.content.strip()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to Groq: {str(e)}"
        )
