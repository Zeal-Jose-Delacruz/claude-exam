import unittest

from app.auth import AuthError
from app.handlers import create_order, delete_user, get_order, refund_order


AUTHED = {"user": "u1"}
ANON = {}


class OrderHandlerTests(unittest.TestCase):
    def test_create_then_get_order(self):
        create_order(AUTHED, {"order_id": "o1", "customer_id": "c1"})
        order = get_order(AUTHED, {"order_id": "o1", "customer_id": "c1"})
        self.assertEqual(order["status"], "created")

    def test_get_order_requires_auth(self):
        with self.assertRaises(AuthError):
            get_order(ANON, {"order_id": "o1", "customer_id": "c1"})

    def test_refund_applies_amount(self):
        create_order(AUTHED, {"order_id": "o2", "customer_id": "c1"})
        order = refund_order(AUTHED, {"order_id": "o2", "amount_cents": 500})
        self.assertEqual(order["refunded_cents"], 500)


if __name__ == "__main__":
    unittest.main()
