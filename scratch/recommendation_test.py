import sys
import asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import engine, AsyncSessionLocal
from sqlalchemy import select, delete

# Import modules
from backend.app import models
from backend.app.auth import get_password_hash

async def setup_test_data():
    print("Setting up database records for recommendation integration test...")
    email = "rec_test_user@example.com"
    
    async with AsyncSessionLocal() as session:
        # Clean up existing test data
        await session.execute(delete(models.Recommendation).where(models.Recommendation.user_id.in_(
            select(models.User.id).where(models.User.email == email)
        )))
        await session.execute(delete(models.Resume).where(models.Resume.user_id.in_(
            select(models.User.id).where(models.User.email == email)
        )))
        await session.execute(delete(models.User).where(models.User.email == email))
        await session.execute(delete(models.Job).where(models.Job.company == "Test E2E Corp"))
        await session.commit()
        
        # 1. Create a Test User
        user = models.User(
            email=email,
            hashed_password=get_password_hash("Password123"),
            full_name="Recommendation Tester",
            is_active=True
        )
        session.add(user)
        await session.flush()  # Populates user.id
        
        # 2. Create a Test Job
        job = models.Job(
            title="Senior Python Cloud Engineer",
            company="Test E2E Corp",
            location="Remote",
            description="Looking for Python, SQL, and FastAPI developer.",
            skills_required=["Python", "Sql", "Fastapi"],
            is_active=True
        )
        session.add(job)
        await session.flush()
        
        # 3. Create a Test Resume for the User
        resume = models.Resume(
            user_id=user.id,
            file_name="resume.txt",
            file_path="uploads/test_resume.txt",
            content_text="Experienced in Python, SQL, and Git.",
            parsed_skills=["Python", "Sql", "Git"],
            parsed_experience={"years": 5}
        )
        session.add(resume)
        await session.commit()
        print("Test data setup completed successfully.")
        return email

async def run_recommendation_test():
    email = await setup_test_data()
    
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
            # Step 1: Login to get token
            print("\nLogging in...")
            login_payload = {
                "username": email,
                "password": "Password123"
            }
            login_response = await ac.post("/api/auth/login", data=login_payload)
            assert login_response.status_code == 200, f"Login failed: {login_response.text}"
            token_data = login_response.json()
            headers = {"Authorization": f"Bearer {token_data['access_token']}"}
            print("Login successful! Token acquired.")
            
            # Step 2: Get recommendations
            print("\nCalling GET /api/recommendations/ ...")
            rec_response = await ac.get("/api/recommendations/", headers=headers)
            print(f"Response code: {rec_response.status_code}")
            
            assert rec_response.status_code == 200, f"Expected 200, got: {rec_response.text}"
            recs = rec_response.json()
            print(f"Number of recommendations returned: {len(recs)}")
            
            # Print serialized recommendation including the nested job field
            print("\nChecking serialization of the recommendation response...")
            for rec in recs:
                print(f"Recommendation ID: {rec['id']}")
                print(f"Match Score: {rec['match_score']}%")
                print(f"Explanation: {rec['explanation']}")
                print(f"Skills Gap: {rec['skills_gap']}")
                print(f"Nested Job: {rec['job']}")
                assert rec['job'] is not None, "Nested job field was None/missing!"
                assert isinstance(rec['job']['title'], str)
                print(f"Validated job title: {rec['job']['title']}")
            
            # Step 3: Get skills gap analysis
            print("\nCalling GET /api/recommendations/skills-gap ...")
            gap_response = await ac.get("/api/recommendations/skills-gap", headers=headers)
            assert gap_response.status_code == 200, f"Expected 200, got: {gap_response.text}"
            gap_data = gap_response.json()
            print(f"Skills Gap Analysis advice: {gap_data['advice']}")
            print(f"Aggregated skill gaps list: {gap_data['skill_gaps']}")
            
            print("\nAll recommendation tests PASSED successfully!")
            
    except Exception as e:
        print(f"E2E test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_recommendation_test())
