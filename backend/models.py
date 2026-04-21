from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Domain(Base):
    __tablename__ = "domains"
    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True)   # 'architecture' | 'civil'
    name = Column(String)                # '건축' | '토목'


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    name = Column(String)
    sort_order = Column(Integer, default=0)
    domain = relationship("Domain")
    items = relationship("Item", back_populates="category")


class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    name = Column(String)
    spec = Column(String, default="")
    unit = Column(String, default="식")
    unit_weight = Column(Float, nullable=True)   # kg/m (H빔·각파이프)
    is_weight_based = Column(Boolean, default=False)
    supplier = Column(String, default="")
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    category = relationship("Category", back_populates="items")
    prices = relationship("PriceMaster", back_populates="item", order_by="PriceMaster.effective_date.desc()")
    price_histories = relationship("PriceHistory", back_populates="item")


class PriceMaster(Base):
    __tablename__ = "price_master"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"))
    price = Column(Float, default=0)
    effective_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    item = relationship("Item", back_populates="prices")


class PriceHistory(Base):
    __tablename__ = "price_history"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"))
    old_price = Column(Float)
    new_price = Column(Float)
    changed_at = Column(DateTime, default=datetime.utcnow)
    changed_by = Column(String, default="admin")
    note = Column(String, default="")
    item = relationship("Item", back_populates="price_histories")


class PercentMaster(Base):
    __tablename__ = "percent_master"
    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    name = Column(String)      # 노무비, 경비, 일반관리비, 이윤, 부가세
    percent = Column(Float, default=0)
    sort_order = Column(Integer, default=0)
    domain = relationship("Domain")


class Quote(Base):
    __tablename__ = "quotes"
    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    quote_number = Column(String, default="")
    field_name = Column(String, default="")
    client_name = Column(String, default="")
    work_name = Column(String, default="")
    quote_date = Column(String, default="")
    tax_included = Column(Boolean, default=True)
    margin_rate = Column(Float, default=0)
    status = Column(String, default="draft")   # draft | confirmed
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, default="")
    # 퍼센트 스냅샷 (저장 당시 값 고정)
    labor_pct = Column(Float, default=0)
    expense_pct = Column(Float, default=0)
    management_pct = Column(Float, default=0)
    profit_pct = Column(Float, default=0)
    tax_pct = Column(Float, default=10)
    note = Column(Text, default="")
    domain = relationship("Domain")
    items = relationship("QuoteItem", back_populates="quote", order_by="QuoteItem.sort_order")


class QuoteItem(Base):
    __tablename__ = "quote_items"
    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id", ondelete="CASCADE"))
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    category_name = Column(String, default="")
    item_name = Column(String, default="")
    spec = Column(String, default="")
    unit = Column(String, default="식")
    quantity = Column(Float, default=0)
    unit_price = Column(Float, default=0)   # 저장 당시 단가 고정
    amount = Column(Float, default=0)
    # 중량 기반 항목 (H빔·각파이프)
    unit_weight = Column(Float, nullable=True)
    length_m = Column(Float, nullable=True)
    total_weight = Column(Float, nullable=True)
    price_per_kg = Column(Float, nullable=True)
    note = Column(String, default="")
    sort_order = Column(Integer, default=0)
    quote = relationship("Quote", back_populates="items")
