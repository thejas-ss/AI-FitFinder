export type Audience = "men" | "women" | "kids";
export type Gender = "male" | "female" | "other";
export type PhotoView = "front" | "side" | "back" | "angle45";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  gender?: Gender | null;
  date_of_birth?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  avatar_url?: string | null;
  favorite_brands: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface Brand {
  slug: string;
  name: string;
  website: string;
  segments: string[];
  fit_offset_cm: number;
  fit: string;
  color: string;
}

export interface Measurements {
  chest: number;
  waist: number;
  hip: number;
  shoulder: number;
  sleeve: number;
  inseam?: number | null;
  height?: number | null;
}

export interface MeasurementResult {
  id: string;
  measurements: Measurements;
  quality: number;
  views: PhotoView[];
  image_urls: Partial<Record<PhotoView, string>>;
  /** view -> joint name -> [x, y, visibility]; x/y are 0..1 fractions of the photo */
  landmarks?: Partial<Record<PhotoView, Record<string, [number, number, number]>>>;
  created_at: string;
}

export interface SizeMatch {
  brand: string;
  brand_name: string;
  size: string;
  confidence: number;
}

export interface Recommendation {
  id: string;
  brand: string;
  brand_name: string;
  category: string;
  audience: Audience;
  measurements: Measurements;
  recommended_size: string;
  confidence: number;
  fit_note: string;
  comparison: SizeMatch[];
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  brand_name: string;
  price: number;
  rating: number;
  reviews: number;
  recommended_size: string;
  image_url: string | null;
  official_url: string;
  marketplaces: Record<"amazon" | "flipkart" | "ajio" | "myntra", string>;
}

export interface Purchase {
  id: string;
  product_name: string;
  brand: string;
  size: string;
  price: number;
  store: string;
  url: string;
  created_at: string;
}
