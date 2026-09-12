from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routes import patients, screening, doctors
from .seed import seed_database


# Ensure tables are created immediately
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure all database tables exist
    Base.metadata.create_all(bind=engine)
    # 2. Seed initial clinical data if empty
    seed_database()
    yield


app = FastAPI(
    title="NetraSaarthi AI Backend",
    description="FastAPI Backend for NetraSaarthi - AI-assisted Diabetic Retinopathy screening & tele-ophthalmology platform.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for React frontend (Vite defaults to port 5173, Create React App to 3000)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles

# Ensure static directories exist for Grad-CAM heatmaps and clinical media
STATIC_DIR = Path(__file__).resolve().parent / "static"
HEATMAPS_DIR = STATIC_DIR / "heatmaps"
HEATMAPS_DIR.mkdir(parents=True, exist_ok=True)

# Mount static folder for heatmap URL access
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Register API Routers
app.include_router(patients.router)
app.include_router(screening.router)
app.include_router(doctors.router)


@app.get("/", tags=["System"])
def root():
    return {
        "service": "NetraSaarthi AI Backend",
        "status": "operational",
        "version": "1.0.0",
        "docs_url": "/docs",
        "endpoints": {
            "patients": "/patients",
            "screenings": "/screenings",
            "doctor_queue": "/doctors/review-queue",
        },
    }


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "database": "sqlite", "prediction_service": "mock_active"}


if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
