import { Cannabis, Cigarette, Package } from "lucide-react";
import type { Unit } from "@/lib/types";

export default function UnitIcon({ unit, size = 16 }: { unit: Unit; size?: number }) {
  if (unit === "stick") return <Cigarette size={size} />;
  if (unit === "gram") return <Cannabis size={size} />;
  return <Package size={size} />;
}
