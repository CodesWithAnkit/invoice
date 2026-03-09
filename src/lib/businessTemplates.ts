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

export const businessTemplates: Record<string, BusinessTemplate> = {
  atta_chakki_mill: {
    industryName: "Atta Chakki Mill",
    items: [
      { name: "Flour mill grinder machine", category: "machine", quantity: 1, weight: 50 },
      { name: "Stone chakki grinder", category: "machine", quantity: 1, weight: 30 },
      { name: "Grain cleaning machine", category: "machine", quantity: 1, weight: 20 },
      { name: "Wheat storage bins", category: "infrastructure", quantity: 4, weight: 10 },
      { name: "Flour packaging machine", category: "machine", quantity: 1, weight: 15 },
      { name: "Industrial weighing scale", category: "equipment", quantity: 1, weight: 5 },
      { name: "Electrical installation", category: "infrastructure", quantity: 1, weight: 10 },
      { name: "Packaging materials", category: "material", quantity: 1, weight: 5 },
    ],
  },
  general_store: {
    industryName: "General Store",
    items: [
      { name: "Display racks", category: "infrastructure", quantity: 10, weight: 30 },
      { name: "Billing counter", category: "infrastructure", quantity: 1, weight: 10 },
      { name: "POS system", category: "equipment", quantity: 1, weight: 15 },
      { name: "Refrigerator", category: "equipment", quantity: 1, weight: 20 },
      { name: "Storage shelves", category: "infrastructure", quantity: 5, weight: 15 },
      { name: "Security cameras", category: "equipment", quantity: 4, weight: 10 },
      { name: "Lighting fixtures", category: "infrastructure", quantity: 1, weight: 5 },
      { name: "Inventory software", category: "equipment", quantity: 1, weight: 5 },
    ],
  },
  cafe: {
    industryName: "Cafe",
    items: [
      { name: "Espresso machine", category: "machine", quantity: 1, weight: 40 },
      { name: "Coffee grinder", category: "machine", quantity: 1, weight: 10 },
      { name: "Commercial blender", category: "machine", quantity: 1, weight: 10 },
      { name: "Cake display fridge", category: "equipment", quantity: 1, weight: 20 },
      { name: "Dining tables", category: "infrastructure", quantity: 5, weight: 15 },
      { name: "Chairs", category: "infrastructure", quantity: 20, weight: 15 },
      { name: "Kitchen stove", category: "machine", quantity: 1, weight: 15 },
      { name: "Deep fryer", category: "machine", quantity: 1, weight: 10 },
    ],
  },
  paper_plate_business: {
    industryName: "Paper Plate Business",
    items: [
      { name: "Paper plate making machine", category: "machine", quantity: 1, weight: 40 },
      { name: "Semi automatic paper plate machine", category: "machine", quantity: 1, weight: 20 },
      { name: "Automatic paper plate machine", category: "machine", quantity: 1, weight: 25 },
      { name: "Paper plate die", category: "equipment", quantity: 2, weight: 10 },
      { name: "Paper plate raw material", category: "material", quantity: 1, weight: 15 },
      { name: "Paper plate packaging machine", category: "machine", quantity: 1, weight: 10 },
      { name: "Paper plate weighing scale", category: "equipment", quantity: 1, weight: 5 },
      { name: "Paper plate electrical installation", category: "infrastructure", quantity: 1, weight: 10 },
      { name: "Paper plate packaging materials", category: "material", quantity: 1, weight: 5 },
    ],
  },
  paper_cup_business: {
    industryName: "Paper Cup Business",
    items: [
      { name: "Paper cup making machine", category: "machine", quantity: 1, weight: 40 },
      { name: "Semi automatic paper cup machine", category: "machine", quantity: 1, weight: 20 },
      { name: "Automatic paper cup machine", category: "machine", quantity: 1, weight: 25 },
      { name: "Paper cup die", category: "equipment", quantity: 2, weight: 10 },
      { name: "Paper cup raw material", category: "material", quantity: 1, weight: 15 },
      { name: "Paper cup packaging machine", category: "machine", quantity: 1, weight: 10 },
      { name: "Paper cup weighing scale", category: "equipment", quantity: 1, weight: 5 },
      { name: "Paper cup electrical installation", category: "infrastructure", quantity: 1, weight: 10 },
      { name: "Paper cup packaging materials", category: "material", quantity: 1, weight: 5 },
    ],
  },
  paper_napkin_business: {
    industryName: "Paper Napkin Business",
    items: [
      { name: "Paper napkin making machine", category: "machine", quantity: 1, weight: 40 },
      { name: "Semi automatic paper napkin machine", category: "machine", quantity: 1, weight: 20 },
      { name: "Automatic paper napkin machine", category: "machine", quantity: 1, weight: 25 },
      { name: "Paper napkin die", category: "equipment", quantity: 2, weight: 10 },
      { name: "Paper napkin raw material", category: "material", quantity: 1, weight: 15 },
      { name: "Paper napkin packaging machine", category: "machine", quantity: 1, weight: 10 },
      { name: "Paper napkin weighing scale", category: "equipment", quantity: 1, weight: 5 },
      { name: "Paper napkin electrical installation", category: "infrastructure", quantity: 1, weight: 10 },
      { name: "Paper napkin packaging materials", category: "material", quantity: 1, weight: 5 },
    ],
  },
  paper_glass_business: {
    industryName: "Paper Glass Business",
    items: [
      { name: "Paper glass making machine", category: "machine", quantity: 1, weight: 40 },
      { name: "Semi automatic paper glass machine", category: "machine", quantity: 1, weight: 20 },
      { name: "Automatic paper glass machine", category: "machine", quantity: 1, weight: 25 },
      { name: "Paper glass die", category: "equipment", quantity: 2, weight: 10 },
      { name: "Paper glass raw material", category: "material", quantity: 1, weight: 15 },
      { name: "Paper glass packaging machine", category: "machine", quantity: 1, weight: 10 },
      { name: "Paper glass weighing scale", category: "equipment", quantity: 1, weight: 5 },
      { name: "Paper glass electrical installation", category: "infrastructure", quantity: 1, weight: 10 },
      { name: "Paper glass packaging materials", category: "material", quantity: 1, weight: 5 },
    ],
  },
  textile: {
  "industryName": "Textile",
  "items": [
    {
      "name": "Industrial Single Needle Sewing Machine",
      "category": "machine",
      "quantity": 6,
      "weight": 45
    },
    {
      "name": "Four-Thread Overlock Machine",
      "category": "machine",
      "quantity": 2,
      "weight": 38
    },
    {
      "name": "Vertical Fabric Cutting Machine",
      "category": "machine",
      "quantity": 1,
      "weight": 30
    },
    {
      "name": "Industrial Steam Iron with Boiler",
      "category": "equipment",
      "quantity": 2,
      "weight": 25
    },
    {
      "name": "Professional Pattern Making Plotter",
      "category": "machine",
      "quantity": 1,
      "weight": 35
    },
    {
      "name": "Large Scale Fabric Cutting Table",
      "category": "infrastructure",
      "quantity": 2,
      "weight": 40
    },
    {
      "name": "Heavy Duty Fabric Storage Racks",
      "category": "infrastructure",
      "quantity": 4,
      "weight": 20
    },
    {
      "name": "Raw Cotton and Synthetic Fabric Rolls",
      "category": "material",
      "quantity": 25,
      "weight": 50
    },
    {
      "name": "Industrial Grade Sewing Thread Sets",
      "category": "material",
      "quantity": 150,
      "weight": 12
    },
    {
      "name": "LED Factory Task Lighting",
      "category": "infrastructure",
      "quantity": 1,
      "weight": 15
    },
    {
      "name": "Quality Control Inspection Station",
      "category": "equipment",
      "quantity": 1,
      "weight": 18
    }
  ]
},
};

export function getBusinessTemplate(businessType: string): BusinessItem[] | null {
  const normalized = businessType.toLowerCase().replace(/\s+/g, "_");
  return businessTemplates[normalized]?.items || null;
}
