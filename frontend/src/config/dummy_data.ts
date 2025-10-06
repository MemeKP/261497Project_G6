import type { Table } from "../types";

export const menus = [
  {
    id: 1,
    name: "Enso’s Secret Beef Ramen",
    desc: "159",
    price: 159,
    category: "noodle",
    is_available: true,
    banner: "https://enso.app/menu/beef-ramen.jpg",
    created_at: "2025-07-21T12:00:00Z",
    updated_at: "2025-09-01T09:30:00Z",
  },
  {
    id: 2,
    name: "Truffle Unagi Don",
    desc: "Grilled eel glazed with sweet soy, served over premium Japanese rice with truffle aroma.",
    price: 289,
    category: "rice",
    is_available: true,
    banner: "https://enso.app/menu/unagi-don.jpg",
    created_at: "2025-07-21T12:05:00Z",
    updated_at: "2025-09-01T09:31:00Z",
  },
  {
    id: 3,
    name: "Salmon Sashimi Deluxe",
    desc: "Freshly sliced salmon sashimi served with wasabi and soy sauce.",
    price: 199,
    category: "sashimi",
    is_available: true,
    banner: "https://enso.app/menu/salmon-sashimi.jpg",
    created_at: "2025-07-21T12:10:00Z",
    updated_at: "2025-09-01T09:32:00Z",
  },
  {
    id: 4,
    name: "Dragon Roll Sushi",
    desc: "Shrimp tempura roll topped with avocado and unagi sauce.",
    price: 259,
    category: "sushi",
    is_available: true,
    banner: "https://enso.app/menu/dragon-roll.jpg",
    created_at: "2025-07-21T12:15:00Z",
    updated_at: "2025-09-01T09:33:00Z",
  },
  {
    id: 5,
    name: "Spicy Tuna Roll",
    desc: "Classic sushi roll with fresh tuna, spicy mayo, and cucumber.",
    price: 189,
    category: "sushi",
    is_available: false,
    banner: "https://enso.app/menu/spicy-tuna-roll.jpg",
    created_at: "2025-07-21T12:20:00Z",
    updated_at: "2025-09-01T09:34:00Z",
  },
];

export const category = [
  "All",
  "noodles",
  "Sushi & Sashimi",
  "Appetizers",
  "rice",
  "Desserts",
  "Drinks",
];

export const tables: Table[] = [
  { id: 1, number: 1, status: "AVAILABLE" },
  { id: 2, number: 2, status: "OCCUPIED" },
  { id: 3, number: 3, status: "AVAILABLE" },
  { id: 4, number: 4, status: "AVAILABLE" },
  { id: 5, number: 5, status: "OCCUPIED" },
  { id: 6, number: 6, status: "OCCUPIED" },
  { id: 7, number: 7, status: "AVAILABLE" },
  { id: 8, number: 8, status: "OCCUPIED" },
  { id: 9, number: 9, status: "AVAILABLE" },
];

 // Default demo data
export const defaultData: PaymentData[] = [
    { date: 'Week 1', thisMonth: 4500, lastMonth: 3800 },
    { date: 'Week 2', thisMonth: 5200, lastMonth: 4200 },
    { date: 'Week 3', thisMonth: 4800, lastMonth: 5000 },
    { date: 'Week 4', thisMonth: 6500, lastMonth: 4500 },
  ];