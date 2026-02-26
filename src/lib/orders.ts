export type OrderItem = {
  productId: string;
  title: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  userId?: string;
  email: string;
  phone: string;
  name: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: "draft" | "pending" | "paid" | "shipped" | "cancelled";
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
};
