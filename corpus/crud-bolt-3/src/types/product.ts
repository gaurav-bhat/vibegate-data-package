export type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  created_at: string;
};

export type ProductInput = {
  name: string;
  price: number;
  description?: string | null;
};
