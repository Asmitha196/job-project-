from fastapi import APIRouter, HTTPException

from backend.app.schemas import (
    ChatRequest,
    ChatResponse,
    ClearMemoryResponse,
)

from backend.app.services.ai_service import (
    chat,
    clear_session,
    get_history,
)

router = APIRouter(
    prefix="/chat",
    tags=["AI Chatbot"],
)


@router.post(
    "/",
    response_model=ChatResponse,
    summary="Chat with AI",
    description="Send a message to the AI chatbot."
)
async def chat_endpoint(request: ChatRequest):

    result = await chat(
        session_id=request.session_id,
        message=request.message,
    )

    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["response"],
        )

    return ChatResponse(
        success=True,
        response=result["response"],
    )


@router.get(
    "/history/{session_id}",
    summary="Get Chat History",
)
async def history(session_id: str):

    history = get_history(session_id)

    messages = []

    for msg in history:
        messages.append(
            {
                "type": msg.type,
                "content": msg.content,
            }
        )

    return {
        "session_id": session_id,
        "messages": messages,
    }


@router.delete(
    "/history/{session_id}",
    response_model=ClearMemoryResponse,
    summary="Clear Chat History",
)
async def delete_history(session_id: str):

    clear_session(session_id)

    return ClearMemoryResponse(
        success=True,
        message="Conversation history cleared successfully.",
    )