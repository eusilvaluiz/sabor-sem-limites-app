// Dados mock das categorias compartilhados
export const mockCategories = [
  {
    id: "1",
    name: "Doces",
    image: "/placeholder.svg",
    recipeCount: 124,
    createdAt: "2024-01-15"
  },
  {
    id: "2", 
    name: "Salgados",
    image: "/placeholder.svg",
    recipeCount: 89,
    createdAt: "2024-01-10"
  },
  {
    id: "3",
    name: "Lanches",
    image: "/placeholder.svg", 
    recipeCount: 56,
    createdAt: "2024-01-08"
  },
  {
    id: "4",
    name: "Sobremesas",
    image: "/placeholder.svg",
    recipeCount: 78,
    createdAt: "2024-01-05"
  },
  {
    id: "5",
    name: "Pães",
    image: "/placeholder.svg",
    recipeCount: 45,
    createdAt: "2024-01-03"
  },
  {
    id: "6",
    name: "Bebidas",
    image: "/placeholder.svg",
    recipeCount: 34,
    createdAt: "2024-01-02"
  },
  {
    id: "7",
    name: "Massas",
    image: "/placeholder.svg",
    recipeCount: 67,
    createdAt: "2024-01-01"
  },
  {
    id: "8",
    name: "Saladas",
    image: "/placeholder.svg",
    recipeCount: 42,
    createdAt: "2023-12-30"
  },
  {
    id: "9",
    name: "Sopas",
    image: "/placeholder.svg",
    recipeCount: 38,
    createdAt: "2023-12-28"
  },
  {
    id: "10",
    name: "Vitaminas",
    image: "/placeholder.svg",
    recipeCount: 25,
    createdAt: "2023-12-25"
  },
  {
    id: "11",
    name: "Molhos",
    image: "/placeholder.svg",
    recipeCount: 18,
    createdAt: "2023-12-20"
  },
  {
    id: "12",
    name: "Bolos",
    image: "/placeholder.svg",
    recipeCount: 92,
    createdAt: "2023-12-15"
  }
];

// Interface para tipagem das categorias
export interface Category {
  id: string;
  name: string;
  image: string;
  recipeCount: number;
  createdAt: string;
} 