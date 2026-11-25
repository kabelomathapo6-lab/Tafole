// Demo data for the Tafole Demo Kitchen. Prices are in cents (ZAR).

export const RESTAURANT = { name: "Tafole Demo Kitchen", slug: "tafole-demo" };

export const STAFF = [
  { email: "manager@tafole.test", role: "manager", full_name: "Demo Manager" },
  { email: "waiter@tafole.test", role: "waiter", full_name: "Demo Waiter" },
  { email: "kitchen@tafole.test", role: "kitchen", full_name: "Demo Kitchen" },
];

export const TABLES = [
  ...[2, 2, 4, 4, 4, 6, 6, 8].map((seats, i) => ({
    label: `Table ${i + 1}`,
    area: "Main dining",
    seats,
  })),
  ...[2, 4, 4, 6].map((seats, i) => ({
    label: `Courtyard ${i + 1}`,
    area: "Courtyard",
    seats,
  })),
];

export const CATEGORIES = ["Starters", "Mains", "Sides", "Drinks"];

export const MENU = [
  // Starters
  {
    category: "Starters",
    name: "Peri-peri chicken livers",
    description:
      "Pan-fried livers in a warm peri-peri sauce with toasted bread.",
    price_cents: 7900,
  },
  {
    category: "Starters",
    name: "Chakalaka spring rolls",
    description:
      "Crisp rolls filled with spicy chakalaka vegetables, with sweet chilli dip.",
    price_cents: 6900,
  },
  {
    category: "Starters",
    name: "Butternut soup",
    description: "Roasted butternut with a swirl of cream and seeded bread.",
    price_cents: 5900,
  },
  {
    category: "Starters",
    name: "Biltong and feta salad",
    description:
      "Shaved biltong, feta, cherry tomatoes and rocket with a honey-mustard dressing.",
    price_cents: 8500,
  },
  // Mains
  {
    category: "Mains",
    name: "Beef burger",
    description:
      "180g beef patty, cheddar, caramelised onion and tomato on a toasted bun, with chips.",
    price_cents: 12900,
  },
  {
    category: "Mains",
    name: "Half peri-peri chicken",
    description:
      "Flame-grilled half chicken basted in house peri-peri, with chips.",
    price_cents: 13900,
  },
  {
    category: "Mains",
    name: "Bobotie",
    description:
      "Cape Malay spiced mince baked with an egg custard topping, with yellow rice and sambal.",
    price_cents: 13500,
  },
  {
    category: "Mains",
    name: "300g rump steak",
    description:
      "Grilled rump with your choice of pepper or mushroom sauce, and chips.",
    price_cents: 18500,
  },
  {
    category: "Mains",
    name: "Vegetable potjie",
    description:
      "Slow-cooked seasonal vegetables and lentils in a rich tomato stew, with pap.",
    price_cents: 11900,
  },
  {
    category: "Mains",
    name: "Slow-braised lamb shank",
    description:
      "Lamb shank braised for six hours with red wine and rosemary, on creamy mash.",
    price_cents: 19500,
    available: false,
  },
  // Sides
  {
    category: "Sides",
    name: "Pap and chakalaka",
    description: "Soft maize pap with spicy chakalaka.",
    price_cents: 3500,
  },
  {
    category: "Sides",
    name: "Chips",
    description: "Hand-cut chips with sea salt.",
    price_cents: 3900,
  },
  {
    category: "Sides",
    name: "Creamed spinach",
    description: "Spinach in a light cream and nutmeg sauce.",
    price_cents: 3900,
  },
  {
    category: "Sides",
    name: "Garden salad",
    description: "Mixed leaves, cucumber, tomato and red onion.",
    price_cents: 4500,
  },
  // Drinks
  {
    category: "Drinks",
    name: "Rooibos tea",
    description: "Hot or iced, served with honey.",
    price_cents: 2500,
  },
  {
    category: "Drinks",
    name: "Ginger beer",
    description: "Locally brewed, served over ice.",
    price_cents: 3200,
  },
  {
    category: "Drinks",
    name: "Still water 500ml",
    description: "Chilled.",
    price_cents: 2200,
  },
  {
    category: "Drinks",
    name: "Fresh orange juice",
    description: "Pressed to order.",
    price_cents: 3800,
  },
  {
    category: "Drinks",
    name: "Local craft lager",
    description: "330ml, ask your waiter for today's pour.",
    price_cents: 4500,
  },
];
