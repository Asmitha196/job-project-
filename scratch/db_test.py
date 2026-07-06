import sys
import asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import engine, AsyncSessionLocal
from sqlalchemy import text, delete

# Import hashing utilities, schemas, and models for verification
from backend.app.auth import get_password_hash, verify_password
from backend.app.schemas import UserCreate
from backend.app import models

async def run_lifecycle_verification():
    print("Starting FastAPI app lifecycle with AsyncClient transport...")
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
            print("FastAPI application startup events triggered successfully.")
            
            # 1. Clean up any existing test user to ensure repeatability
            test_email = "reg_test@example.com"
            async with AsyncSessionLocal() as session:
                await session.execute(
                    delete(models.User).where(models.User.email == test_email)
                )
                await session.commit()
                print(f"Cleaned up any existing database records for {test_email}.")
            
            # 2. Query pg_tables to get lists of tables in public schema
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
                tables = [row[0] for row in result.fetchall()]
                print(f"Tables currently in PostgreSQL 'public' schema: {tables}")
            
            # 3. Verify get_password_hash("Password123") succeeds
            print("\nVerifying get_password_hash('Password123') succeeds...")
            test_pass = "Password123"
            hashed = get_password_hash(test_pass)
            print(f"Hashed 'Password123' successfully (hash: {hashed}).")
            assert verify_password(test_pass, hashed) is True
            print("Password verification check passed.")
            
            # 4. Verify registration endpoint creates users successfully
            print("\nTesting user registration endpoint POST /api/auth/register...")
            reg_payload = {
                "email": test_email,
                "password": "Password123",
                "full_name": "Registration Test User",
                "is_active": True
            }
            
            response = await ac.post("/api/auth/register", json=reg_payload)
            print(f"Registration response status code: {response.status_code}")
            print(f"Registration response body: {response.json()}")
            
            assert response.status_code == 201, f"Expected 201, got {response.status_code}"
            resp_data = response.json()
            assert resp_data["email"] == test_email
            assert "id" in resp_data
            
            # 5. Confirm user is stored in the database correctly
            print("\nVerifying user record in PostgreSQL database...")
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select
                result = await session.execute(
                    select(models.User).where(models.User.email == test_email)
                )
                db_user = result.scalars().first()
                assert db_user is not None, "User record not found in database!"
                print(f"User found in database. ID: {db_user.id}, Email: {db_user.email}")
                print(f"Database hashed password: {db_user.hashed_password}")
                assert verify_password("Password123", db_user.hashed_password) is True
                print("Database password verification passed!")
                
            # 6. Verify duplicate registration fails with HTTP 400
            print("\nVerifying duplicate registration behavior...")
            dup_response = await ac.post("/api/auth/register", json=reg_payload)
            print(f"Duplicate registration status: {dup_response.status_code}")
            assert dup_response.status_code == 400
            print(f"Duplicate registration error message: {dup_response.json()}")

            print("\nAll integration and compatibility tests PASSED successfully!")
            
    except Exception as e:
        print(f"Verification tests failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_lifecycle_verification())
