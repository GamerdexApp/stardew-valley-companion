import type { Season } from "stardew-valley-data";
import type { BonusResult } from "@/lib/utils/professionPrices";

export interface EnergyHealthGridProps {
  energy: number;
  health: number;
  maxQuality: string;
  variant?: "card" | "modal";
  poison?: boolean;
}

export interface BuyPrice {
  place: string;
  price: number;
}

export interface SeedRowProps {
  image?: string | null;
  name: string;
  prices?: BuyPrice[];
  variant?: "card" | "modal";
  emptyLabel?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  onEdit?: () => void;
}
