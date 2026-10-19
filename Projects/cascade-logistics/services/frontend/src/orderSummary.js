function formatOrderSummary(order) {
  if (!order || !order.orderId) {
    throw new Error("order with orderId is required");
  }
  const refunded = order.refundedCents ? order.refundedCents / 100 : 0;
  return {
    orderId: order.orderId,
    status: order.status || "unknown",
    refundedDisplay: refunded > 0 ? `$${refunded.toFixed(2)} refunded` : null,
  };
}

module.exports = { formatOrderSummary };
