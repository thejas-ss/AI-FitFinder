import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.routes import router as auth_router
from app.brands.routes import router as brands_router
from app.core.config import settings
from app.database.mongo import init_indexes
from app.history.routes import router as history_router
from app.recommendation.routes import router as recommendation_router
from app.shopping.routes import router as shopping_router
from app.upload.routes import router as upload_router
from app.users.routes import router as users_router

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_indexes()
    yield


app = FastAPI(title=settings.app_name, version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

api = APIRouter(prefix="/api")
for router in (auth_router, users_router, brands_router, upload_router,
               recommendation_router, shopping_router, history_router):
    api.include_router(router)


@api.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "app": settings.app_name}


app.include_router(api)
