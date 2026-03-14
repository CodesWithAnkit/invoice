export type BusinessItem = {
  name: string;
  category: "machine" | "equipment" | "infrastructure" | "material";
  quantity: number;
  weight: number;
};

export interface BusinessTemplate {
  industryName: string;
  items: BusinessItem[];
}

