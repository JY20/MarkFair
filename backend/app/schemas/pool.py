from pydantic import BaseModel


class PoolCreateRequest(BaseModel):
    token: str
    brand: str
    deadline_ts: int
    refund_after_ts: int
    task_title: str | None = None
    description: str | None = None


class PoolCreateResponse(BaseModel):
    pool_id: str
    tx_hash: str
    message: str = "pool created"


