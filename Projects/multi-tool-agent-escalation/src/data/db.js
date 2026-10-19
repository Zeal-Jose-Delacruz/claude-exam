// In-memory mock data store standing in for Northbrook's account/order systems.

export const customers = [
  {
    customer_id: "cus_8841",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "555-0101",
    standing: "good",
  },
  {
    customer_id: "cus_1123",
    name: "Sam Lee",
    email: "sam.lee@example.com",
    phone: "555-0199",
    standing: "good",
    paymentMethodActive: false,
  },
  {
    customer_id: "cus_locked",
    name: "Restricted Account",
    email: "restricted@example.com",
    phone: "555-0150",
    standing: "restricted",
  },
];

export const orders = [
  {
    order_id: "ord_301",
    customer_id: "cus_8841",
    status: "delivered_late",
    items: [{ sku: "SKU-100", desc: "Starter plan fee", qty: 1, price: 120 }],
    amount: 120,
    refund_eligible: true,
  },
  {
    order_id: "ord_302",
    customer_id: "cus_8841",
    status: "never_arrived",
    items: [{ sku: "SKU-200", desc: "Premium plan fee", qty: 1, price: 740 }],
    amount: 740,
    refund_eligible: true,
  },
  {
    order_id: "ord_410",
    customer_id: "cus_1123",
    status: "never_arrived",
    items: [{ sku: "SKU-050", desc: "Processing fee", qty: 1, price: 60 }],
    amount: 60,
    refund_eligible: true,
  },
];

export function findCustomerByEmailOrPhone({ email, phone }) {
  const normPhone = (p) => (p || "").replace(/[^\d]/g, "");
  return customers.find(
    (c) =>
      (email && c.email.toLowerCase() === String(email).toLowerCase()) ||
      (phone && normPhone(c.phone) === normPhone(phone))
  );
}

export function findOrder({ customer_id, order_id }) {
  if (order_id === "latest") {
    const matches = orders.filter((o) => o.customer_id === customer_id);
    return matches[matches.length - 1];
  }
  return orders.find((o) => o.customer_id === customer_id && o.order_id === order_id);
}
