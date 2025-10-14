from datetime import datetime
from typing import Tuple, Optional

from sqlalchemy.orm import Session

from ..db.models import Pool, User
from .youtube_service import get_or_create_user_by_sub
from ..db.session import get_db_session
from .starknet_client import create_pool_on_chain


def create_pool_db_then_chain(
    token: str,
    brand: str,
    deadline_ts: int,
    refund_after_ts: int,
    attester_pubkey: int,
    creator_sub: str,
    task_title: str | None = None,
    description: str | None = None,
) -> str:
    # Persist first
    with next(get_db_session()) as db:  # type: ignore
        # Resolve user id by Clerk sub
        u = get_or_create_user_by_sub(db, creator_sub)
        pool = Pool(
            brand=brand,
            token=token,
            task_title=task_title,
            description=description,
            attester_pubkey=str(attester_pubkey),
            deadline_ts=deadline_ts,
            refund_after_ts=refund_after_ts,
            status="submitted",
            created_at=datetime.utcnow(),
            user_id=u.id,
        )
        db.add(pool)
        db.commit()
        db.refresh(pool)

        # Mirror DB primary key to on-chain pool_id field for consistency
        if pool.pool_id is None:
            pool.pool_id = pool.id
            db.add(pool)
            db.commit()

        # derive a numeric pool_id (simple: db id)
        return str(pool.id)


def get_pool_status(pool_id: int) -> dict:
    with next(get_db_session()) as db:  # type: ignore
        pool = db.query(Pool).filter(Pool.id == pool_id).first()
        if not pool:
            return {"error": "not found"}
        return {
            "pool_id": str(pool.id),
            "status": pool.status,
            "tx_hash": pool.tx_hash,
            "error": pool.error_message,
        }


def process_pool_creation(pool_id: int, token: str, brand: str, deadline_ts: int, refund_after_ts: int, attester_pubkey: int) -> None:
    try:
        # send tx and wait
        import anyio
        tx_hash = anyio.run(create_pool_on_chain, pool_id, brand, token, attester_pubkey, deadline_ts, refund_after_ts)
        with next(get_db_session()) as db:  # type: ignore
            pool = db.query(Pool).filter(Pool.id == pool_id).first()
            if pool:
                pool.tx_hash = tx_hash
                pool.status = "created"
                db.add(pool)
                db.commit()
    except Exception as e:
        with next(get_db_session()) as db:  # type: ignore
            pool = db.query(Pool).filter(Pool.id == pool_id).first()
            if pool:
                pool.status = "failed"
                pool.error_message = str(e)
                db.add(pool)
                db.commit()


def list_pools_for_user(sub: str) -> list[dict]:
    with next(get_db_session()) as db:  # type: ignore
        user = db.query(User).filter(User.sub == sub).first()
        if not user or (user.user_type or "").upper() != "ADVERTISER":
            return []
        pools = (
            db.query(Pool)
            .filter(Pool.user_id == user.id, Pool.status == "created")
            .order_by(Pool.id.desc())
            .all()
        )
        return [
            {
                "pool_id": p.pool_id or p.id,
                "status": p.status,
                "tx_hash": p.tx_hash,
                "brand": p.brand,
                "token": p.token,
                "deadline_ts": p.deadline_ts,
                "refund_after_ts": p.refund_after_ts,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in pools
        ]


def list_all_pools() -> list[dict]:
    with next(get_db_session()) as db:  # type: ignore
        pools = (
            db.query(Pool)
            .filter(Pool.status == "created")
            .order_by(Pool.id.desc())
            .all()
        )
        return [
            {
                "pool_id": p.pool_id or p.id,
                "status": p.status,
                "tx_hash": p.tx_hash,
                "brand": p.brand,
                "token": p.token,
                "deadline_ts": p.deadline_ts,
                "refund_after_ts": p.refund_after_ts,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "user_id": p.user_id,
            }
            for p in pools
        ]

