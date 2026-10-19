export type Variant = {
  id: string;
  pack_size: number;
  unit: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
};

export type Category = { id: string; name: string; slug: string; description: string | null };

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  image_alt: string | null;
  how_to_use: string | null;
  is_featured: boolean;
  category: Pick<Category, "id" | "name" | "slug"> | null;
  variants: Variant[];
};
