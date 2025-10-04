from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.health import router as health_router
from .routers.youtube import router as youtube_router
from .routers.user import router as user_router
from .routers.wallet import router as wallet_router
from .db.session import init_engine_and_create_tables


def create_app() -> FastAPI:
    app = FastAPI(title="MarkFair API", version="0.1.0")

    # CORS (allow all in development)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    # Routers
    app.include_router(health_router, prefix="/api")
    app.include_router(youtube_router, prefix="/api/youtube")
    app.include_router(user_router)
    app.include_router(wallet_router, prefix="/api/wallet")

    return app


app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    init_engine_and_create_tables()


