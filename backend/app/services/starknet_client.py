from typing import Tuple

from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.net.account.account import Account
from starknet_py.net.signer.stark_curve_signer import KeyPair
from starknet_py.net.models.chains import StarknetChainId
from starknet_py.net.client_models import Call
from starknet_py.hash.selector import get_selector_from_name
from starknet_py.net.client_errors import ClientError

from ..core.config import settings


def to_u256(value: int) -> Tuple[int, int]:
    # Starknet u256 tuple order is (low, high)
    low = value & ((1 << 128) - 1)
    high = (value >> 128) & ((1 << 128) - 1)
    return low, high


async def create_pool_on_chain(
    pool_id: int,
    brand: str,
    token: str,
    attester_pubkey: int,
    deadline_ts: int,
    refund_after_ts: int,
) -> str:
    client = FullNodeClient(node_url=settings.starknet_rpc_url)
    chain_raw = getattr(settings, "starknet_chain_id", None)
    if chain_raw and str(chain_raw).upper() in ("SN_MAIN", "MAINNET"):
        chain_id = StarknetChainId.MAINNET
    else:
        chain_id = StarknetChainId.SEPOLIA
    
    account = Account(
        address=int(settings.starknet_account_address, 16),
        client=client,
        key_pair=KeyPair.from_private_key(int(settings.starknet_private_key, 16)),
        chain=chain_id,
    )
    
    # Build raw Call for create_pool and submit via Account
    to_addr = int(settings.starknet_contract_address, 16)
    brand_addr = int(brand, 16)
    token_addr = int(token, 16)
    low, high = to_u256(pool_id)
    calldata = [
        low,
        high,
        brand_addr,
        token_addr,
        attester_pubkey,
        deadline_ts,
        refund_after_ts,
    ]
    call = Call(
        to_addr=to_addr,
        selector=get_selector_from_name("create_pool"),
        calldata=calldata,
    )

    # Prefer v3 auto-estimate; fallback to v1 auto-estimate; then legacy execute
    tx_hash = None
    if hasattr(account, "execute_v3"):
        try:
            tx = await account.execute_v3(calls=[call], auto_estimate=True)
            tx_hash = tx.transaction_hash
        except (TypeError, ClientError):
            tx_hash = None
    if tx_hash is None and hasattr(account, "execute_v1"):
        tx = await account.execute_v1(calls=[call], auto_estimate=True)  
        tx_hash = tx.transaction_hash
    if tx_hash is None and hasattr(account, "execute"):
        tx = await account.execute(calls=[call], auto_estimate=True)  
        tx_hash = tx.transaction_hash
    if tx_hash is None:
        raise RuntimeError("No compatible execute method found on Account (v3/v1/legacy)")

    await account.client.wait_for_tx(tx_hash)
    return hex(tx_hash)


