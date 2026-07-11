"""
chat_service.py

AI Chatbot Service

Features
--------
- Groq Chat
- LangChain Runnable
- Session Memory
- Chat History
"""

from typing import Dict

from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.prompts import MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_groq import ChatGroq

from backend.app.config import settings


# -----------------------------------------
# Session Store
# -----------------------------------------

store: Dict[str, ChatMessageHistory] = {}


def get_session_history(session_id: str) -> BaseChatMessageHistory:

    if session_id not in store:
        store[session_id] = ChatMessageHistory()

    return store[session_id]


# -----------------------------------------
# LLM
# -----------------------------------------

llm = ChatGroq(
    groq_api_key=settings.GROQ_API_KEY,
    model_name=settings.GROQ_MODEL_NAME,
    temperature=0.3,
)


# -----------------------------------------
# Prompt
# -----------------------------------------

prompt = ChatPromptTemplate.from_messages(

    [

        (

            "system",

            """
You are an AI Assistant for the AI Powered Job Recommendation System.

You can help users with

• Jobs
• Resume
• Skills
• Career Guidance
• Interview Preparation

Always answer politely.

Remember previous conversation.

If you don't know the answer,
say you don't have enough information.

Never make up information.
"""

        ),

        MessagesPlaceholder(
            variable_name="history"
        ),

        ("human", "{input}")

    ]

)


# -----------------------------------------
# Runnable
# -----------------------------------------

chain = prompt | llm

chatbot = RunnableWithMessageHistory(

    chain,

    get_session_history,

    input_messages_key="input",

    history_messages_key="history",

)


# -----------------------------------------
# Chat
# -----------------------------------------

async def chat(

    session_id: str,

    message: str,

):

    if not message.strip():

        return {

            "success": False,

            "response": "Message cannot be empty."

        }

    try:

        response = chatbot.invoke(

            {

                "input": message

            },

            config={

                "configurable": {

                    "session_id": session_id

                }

            }

        )

        return {

            "success": True,

            "response": response.content

        }

    except Exception as e:

        return {

            "success": False,

            "response": str(e)

        }


# -----------------------------------------
# Clear Memory
# -----------------------------------------

def clear_session(session_id: str):

    if session_id in store:

        del store[session_id]


# -----------------------------------------
# Get History
# -----------------------------------------

def get_history(session_id: str):

    history = get_session_history(session_id)

    return history.messages