from typing import Literal
from pydantic import BaseModel


class UserTypeSetRequest(BaseModel):
    user_type: Literal['KOL', 'ADVERTISER']


class UserTypeResponse(BaseModel):
    user_type: str


