"""HTTP handlers for the shipments/orders API.

Convention: every handler validates its body with a Pydantic model before
touching the "database" (the in-memory dicts below stand in for it).
"""
from .auth import require_auth
from .models import OrderRequest, RefundRequest, UserDeleteRequest

_ORDERS = {}
_USERS = {"u1": {"name": "Priya"}, "u2": {"name": "Sam"}}


@require_auth
def get_order(request, body: dict):
    data = OrderRequest(**body)
    return _ORDERS.get(data.order_id, {"order_id": data.order_id, "status": "unknown"})


@require_auth
def create_order(request, body: dict):
    data = OrderRequest(**body)
    _ORDERS[data.order_id] = {"order_id": data.order_id, "customer_id": data.customer_id, "status": "created"}
    return _ORDERS[data.order_id]


@require_auth
def refund_order(request, body: dict):
    data = RefundRequest(**body)
    order = _ORDERS.get(data.order_id)
    if order is None:
        raise ValueError(f"no such order {data.order_id}")
    order["refunded_cents"] = data.amount_cents
    return order


def delete_user(request, body: dict):
    """Admin-only teardown endpoint."""
    data = UserDeleteRequest(**body)
    return _USERS.pop(data.user_id, None)
