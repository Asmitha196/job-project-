import asyncio
import sys
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.config import settings

async def verify_ai_endpoint():
    print("=== Testing GET /api/ai/test ===")
    print(f"Current GROQ_API_KEY: {settings.GROQ_API_KEY}")
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        try:
            response = await ac.get("/api/ai/test")
            print(f"Response status code: {response.status_code}")
            print(f"Response JSON: {response.json()}")
            
            if "your_groq_api_key" in settings.GROQ_API_KEY or not settings.GROQ_API_KEY:
                print("\nExpected behavior for unconfigured/placeholder Groq key:")
                assert response.status_code == 400
                assert "not configured" in response.json()["detail"]
                print("Endpoint correctly blocks execution with HTTP 400 and clear error message. PASSED.")
            else:
                print("\nExpected behavior for active Groq key:")
                if response.status_code == 200:
                    assert response.json()["status"] == "success"
                    assert "message" in response.json()
                    print(f"Message from Groq: {response.json()['message']}")
                    print("Connection test: PASSED.")
                else:
                    print(f"Connection test failed with status: {response.status_code}")
                    assert response.status_code == 500
                    print("Error correctly handled and logged as HTTP 500. PASSED.")
                    
        except Exception as e:
            print(f"Verification test failed: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(verify_ai_endpoint())
