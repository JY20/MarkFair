"""
Minimal tests for pools endpoints:
  1) POST /api/pools → returns { pool_id, message: submitted }
  2) GET  /api/pools/{id} → poll until status in { created, failed }

Auth:
  - Preferred: JWT_TOKEN env (Clerk JWT)
  - Dev: TEST_USER_ID with TEST_MODE=true (sends X-Test-User-ID header)
"""

import os
import sys
import time
from pathlib import Path
import requests


def load_dotenv_if_present() -> None:
    try:
        from dotenv import load_dotenv  # type: ignore
        env_path = Path(__file__).resolve().parents[1] / ".env"
        if env_path.exists():
            load_dotenv(env_path)
    except Exception:
        pass


def get_auth_headers() -> dict:
    jwt = os.getenv("JWT_TOKEN")
    test_user_id = os.getenv("TEST_USER_ID")
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if jwt:
        headers["Authorization"] = f"Bearer {jwt}"
    elif test_user_id:
        headers["X-Test-User-ID"] = test_user_id
    else:
        print("❌ Set JWT_TOKEN or TEST_USER_ID in env (backend/.env or shell)")
        sys.exit(1)
    return headers


def post_pool(api_base: str, headers: dict) -> str:
    payload = {
        "token": os.getenv("TEST_TOKEN_ADDR", "0x075d470cb627938cb8f835fd01cab06b7fab0fbe4b2eeb2f6e6175edad0f98ec"),
        "brand": os.getenv("TEST_BRAND_ADDR", "0x0299970ba982112ab018832b2875ff750409d5239c1cc056e98402d8d53bd148"),
        "deadline_ts": int(os.getenv("TEST_DEADLINE_TS", "1761968731")),
        "refund_after_ts": int(os.getenv("TEST_REFUND_TS", "1762573531")),
        "task_title": os.getenv("TEST_TASK_TITLE", "Test campaign"),
        "description": os.getenv("TEST_DESCRIPTION", "Demo"),
    }
    r = requests.post(f"{api_base}/api/pools", headers=headers, json=payload, timeout=20)
    if r.status_code != 200:
        raise RuntimeError(f"POST /api/pools failed: {r.status_code} {r.text}")
    data = r.json()
    pool_id = str(data.get("pool_id"))
    if not pool_id:
        raise RuntimeError(f"Unexpected response: {data}")
    print("Created pool_id:", pool_id)
    return pool_id


def poll_pool(api_base: str, headers: dict, pool_id: str, timeout_s: int = 120, interval_s: int = 2) -> dict:
    start = time.time()
    while time.time() - start < timeout_s:
        r = requests.get(f"{api_base}/api/pools/{pool_id}", headers=headers, timeout=15)
        if r.status_code != 200:
            raise RuntimeError(f"GET /api/pools/{pool_id} failed: {r.status_code} {r.text}")
        data = r.json()
        status = data.get("status")
        print("status:", status, "tx:", data.get("tx_hash"))
        if status in ("created", "failed"):
            return data
        time.sleep(interval_s)
    raise TimeoutError("Polling timed out")


def main() -> int:
    load_dotenv_if_present()
    api_base = os.getenv("API_BASE", "http://localhost:8000")
    headers = get_auth_headers()
    print("API:", api_base)

    pool_id = post_pool(api_base, headers)
    result = poll_pool(api_base, headers, pool_id)
    print("Final:", result)
    if result.get("status") != "created":
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
