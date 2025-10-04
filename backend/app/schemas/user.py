from typing import Literal
from pydantic import BaseModel


class UserTypeSetRequest(BaseModel):
    user_type: Literal['KOL', 'Advertiser']


