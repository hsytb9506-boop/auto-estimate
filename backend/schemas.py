from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    is_admin: bool
    username: str


class DomainOut(BaseModel):
    id: int
    code: str
    name: str
    class Config: from_attributes = True


class CategoryOut(BaseModel):
    id: int
    domain_id: int
    name: str
    sort_order: int
    class Config: from_attributes = True


class CategoryCreate(BaseModel):
    domain_id: int
    name: str
    sort_order: int = 0


class ItemOut(BaseModel):
    id: int
    category_id: int
    name: str
    spec: str
    unit: str
    unit_weight: Optional[float]
    is_weight_based: bool
    supplier: str
    is_active: bool
    sort_order: int
    current_price: Optional[float] = None
    category_name: Optional[str] = None
    class Config: from_attributes = True


class ItemCreate(BaseModel):
    category_id: int
    name: str
    spec: str = ""
    unit: str = "식"
    unit_weight: Optional[float] = None
    is_weight_based: bool = False
    supplier: str = ""
    sort_order: int = 0
    initial_price: float = 0


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    spec: Optional[str] = None
    unit: Optional[str] = None
    unit_weight: Optional[float] = None
    is_weight_based: Optional[bool] = None
    supplier: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class PriceUpdate(BaseModel):
    price: float
    note: str = ""
    effective_date: Optional[str] = None


class PriceHistoryOut(BaseModel):
    id: int
    item_id: int
    old_price: float
    new_price: float
    changed_at: datetime
    changed_by: str
    note: str
    class Config: from_attributes = True


class PercentOut(BaseModel):
    id: int
    domain_id: int
    name: str
    percent: float
    sort_order: int
    class Config: from_attributes = True


class PercentUpdate(BaseModel):
    percent: float


class QuoteItemIn(BaseModel):
    item_id: Optional[int] = None
    category_name: str = ""
    item_name: str
    spec: str = ""
    unit: str = "식"
    quantity: float = 0
    unit_price: float = 0
    amount: float = 0
    unit_weight: Optional[float] = None
    length_m: Optional[float] = None
    total_weight: Optional[float] = None
    price_per_kg: Optional[float] = None
    note: str = ""
    sort_order: int = 0


class QuoteItemOut(QuoteItemIn):
    id: int
    quote_id: int
    class Config: from_attributes = True


class QuoteCreate(BaseModel):
    domain_id: int
    field_name: str = ""
    client_name: str = ""
    work_name: str = ""
    quote_date: str = ""
    tax_included: bool = True
    margin_rate: float = 0
    labor_pct: float = 0
    expense_pct: float = 0
    management_pct: float = 0
    profit_pct: float = 0
    tax_pct: float = 10
    note: str = ""
    items: List[QuoteItemIn] = []


class QuoteOut(BaseModel):
    id: int
    domain_id: int
    quote_number: str
    field_name: str
    client_name: str
    work_name: str
    quote_date: str
    tax_included: bool
    margin_rate: float
    status: str
    created_at: datetime
    created_by: str
    labor_pct: float
    expense_pct: float
    management_pct: float
    profit_pct: float
    tax_pct: float
    note: str
    items: List[QuoteItemOut] = []
    class Config: from_attributes = True
