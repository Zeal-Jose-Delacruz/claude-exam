from pydantic import BaseModel, Field


class OrderRequest(BaseModel):
    order_id: str = Field(min_length=1)
    customer_id: str = Field(min_length=1)


class RefundRequest(BaseModel):
    order_id: str = Field(min_length=1)
    amount_cents: int = Field(gt=0)


class UserDeleteRequest(BaseModel):
    user_id: str = Field(min_length=1)
