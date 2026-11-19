import type { Audience } from "@/utils/types";
import { slugify } from "@/utils/format";

const MEN = [
  "Shirts", "T-Shirts", "Polo", "Formal Shirts", "Jeans", "Pants", "Cargo",
  "Blazers", "Jackets", "Kurta", "Sherwani", "Sportswear",
];

const WOMEN = [
  "Dresses", "Maxi Dresses", "Midi Dresses", "Mini Dresses", "Sarees", "Silk Sarees",
  "Designer Sarees", "Cotton Sarees", "Lehengas", "Gowns", "Kurti", "Kurta Sets",
  "Anarkali", "Salwar", "Churidar", "Blouses", "Tops", "Shirts", "T-Shirts", "Tunics",
  "Jumpsuits", "Co-ord Sets", "Skirts", "Palazzo", "Leggings", "Jeans", "Jeggings",
  "Pants", "Blazers", "Jackets", "Shrugs", "Sweaters", "Nightwear", "Maternity Wear",
  "Activewear",
];

const KIDS = ["Boys", "Girls", "Ethnic", "Winter", "Casual"];

export interface Category {
  slug: string;
  label: string;
}

const toCategories = (labels: string[]): Category[] =>
  labels.map((label) => ({ label, slug: slugify(label) }));

export const CATEGORIES: Record<Audience, Category[]> = {
  men: toCategories(MEN),
  women: toCategories(WOMEN),
  kids: toCategories(KIDS),
};

export const AUDIENCES: { id: Audience; title: string; subtitle: string; gradient: string }[] = [
  { id: "men", title: "Men", subtitle: `${MEN.length} categories`, gradient: "from-primary to-accent" },
  { id: "women", title: "Women", subtitle: `${WOMEN.length} categories`, gradient: "from-secondary to-pink" },
  { id: "kids", title: "Kids", subtitle: `${KIDS.length} categories`, gradient: "from-accent to-secondary" },
];
