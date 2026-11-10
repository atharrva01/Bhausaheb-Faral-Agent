// Re-runnable seed (PRD 7.1). Wipes all data, then inserts products, customers and ~20 demo orders.
// Seeded orders have NO PayPal IDs: they are not real PayPal transactions.
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type FulfilmentStatus, type PaymentStatus } from "../lib/generated/prisma/client";
import { quoteShipping } from "../lib/shipping";
import { startOfDayIST } from "../lib/format";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

// Prices are placeholders; Atharva will confirm with Aai.
const products = [
  {
    slug: "chakli", name: "Chakli", nameMarathi: "चकली", packSize: "250 g", weightGrams: 250, priceCents: 900, stock: 40,
    spiceLevel: "medium", shelfLifeDays: 30,
    description: "Crunchy spiral made from Aai's roasted bhajani flour. The first thing to vanish from any faral plate.",
    ingredients: "Bhajani flour (rice, chana dal, urad dal, coriander, cumin), sesame, red chilli, ajwain, turmeric, salt, groundnut oil",
  },
  {
    slug: "besan-ladoo", name: "Besan Ladoo", nameMarathi: "बेसन लाडू", packSize: "500 g", weightGrams: 500, priceCents: 1400, stock: 30,
    spiceLevel: "mild", shelfLifeDays: 20,
    description: "Slow-roasted gram flour in pure ghee, rolled by hand with cardamom. Melts in the mouth.",
    ingredients: "Besan (gram flour), ghee, sugar, cardamom, cashew. Contains dairy (ghee).",
  },
  {
    slug: "rava-ladoo", name: "Rava Ladoo", nameMarathi: "रवा लाडू", packSize: "500 g", weightGrams: 500, priceCents: 1300, stock: 25,
    spiceLevel: "mild", shelfLifeDays: 15,
    description: "Semolina and fresh coconut ladoo with raisins, soft and fragrant.",
    ingredients: "Rava (semolina), ghee, sugar, desiccated coconut, cardamom, raisins. Contains dairy (ghee).",
  },
  {
    slug: "karanji", name: "Karanji", nameMarathi: "करंजी", packSize: "12 pcs", weightGrams: 400, priceCents: 1200, stock: 20,
    spiceLevel: "mild", shelfLifeDays: 15,
    description: "Flaky half-moon pastries stuffed with coconut, poppy seeds and cardamom.",
    ingredients: "Maida, desiccated coconut, sugar, poppy seeds, cardamom, ghee, groundnut oil. Contains gluten and dairy.",
  },
  {
    slug: "shankarpali", name: "Shankarpali (sweet)", nameMarathi: "शंकरपाळी", packSize: "250 g", weightGrams: 250, priceCents: 700, stock: 35,
    spiceLevel: "mild", shelfLifeDays: 30,
    description: "Crisp diamond-cut sweet bites. Kids' favourite, perfect with chai.",
    ingredients: "Maida, sugar, ghee, milk, groundnut oil. Contains gluten and dairy.",
  },
  {
    slug: "chivda", name: "Poha Chivda", nameMarathi: "पोहा चिवडा", packSize: "500 g", weightGrams: 500, priceCents: 800, stock: 30,
    spiceLevel: "medium", shelfLifeDays: 30,
    description: "Light thin-poha chivda with peanuts, dalia and curry leaves, a little sweet, a little hot.",
    ingredients: "Thin poha, peanuts, roasted chana dal, dry coconut, curry leaves, green chilli, turmeric, sugar, salt, groundnut oil",
  },
  {
    slug: "anarse", name: "Anarse", nameMarathi: "अनारसे", packSize: "10 pcs", weightGrams: 300, priceCents: 1500, stock: 0,
    spiceLevel: "mild", shelfLifeDays: 20,
    description: "The labour-of-love Diwali sweet: fermented rice and jaggery, coated in poppy seeds. Small batches only.",
    ingredients: "Rice, jaggery, poppy seeds, ghee. Contains dairy (ghee).",
  },
  {
    slug: "shev", name: "Shev", nameMarathi: "शेव", packSize: "250 g", weightGrams: 250, priceCents: 600, stock: 40,
    spiceLevel: "spicy", shelfLifeDays: 30,
    description: "Thin, crispy gram-flour sev with ajwain and a proper Kolhapuri kick.",
    ingredients: "Besan (gram flour), ajwain, red chilli, turmeric, salt, groundnut oil",
  },
];

const customers = [
  { name: "Priya Kulkarni", email: "priya.kulkarni@example.com", country: "US", line1: "41 Maple Ave", city: "Edison", state: "NJ", postal: "08817" },
  { name: "Rohan Deshpande", email: "rohan@example.com", country: "GB", line1: "12 Station Road", city: "Leicester", state: null, postal: "LE1 3HQ" },
  { name: "Sneha Patil", email: "sneha.patil@example.com", country: "CA", line1: "88 Queen St W", city: "Brampton", state: "ON", postal: "L6X 1A3" },
  { name: "Amit Joshi", email: "amit.joshi@example.com", country: "AE", line1: "Villa 7, Al Barsha 2", city: "Dubai", state: null, postal: "00000" },
  { name: "Neha Gokhale", email: "neha.gokhale@example.com", country: "AU", line1: "5 Harris Park Rd", city: "Parramatta", state: "NSW", postal: "2150" },
  { name: "Vikram Sathe", email: "vikram.sathe@example.com", country: "US", line1: "220 El Camino Real", city: "Sunnyvale", state: "CA", postal: "94087" },
  { name: "Anjali Bhide", email: "anjali.bhide@example.com", country: "US", line1: "1500 Legacy Dr", city: "Plano", state: "TX", postal: "75023" },
  { name: "Kunal Pawar", email: "kunal.pawar@example.com", country: "GB", line1: "3 Wembley Park Blvd", city: "London", state: null, postal: "HA9 0FD" },
];

// Deterministic PRNG so every seed produces the same demo data.
let seed = 20261110;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const gifts = ["Happy Diwali Aai-Baba!", "Shubh Deepavali from all of us in Leicester", null, null, null];

async function main() {
  // Wipe everything and restart the order number sequence (#1001 again).
  await db.$executeRawUnsafe(
    `TRUNCATE "OrderEvent", "OrderItem", "Order", "Customer", "Product", "Cart", "PendingAction" RESTART IDENTITY CASCADE`,
  );

  const createdProducts = [];
  for (const [i, p] of products.entries()) {
    createdProducts.push(
      await db.product.create({ data: { ...p, imageUrl: `/products/${p.slug}.svg`, isVeg: true, sortOrder: i } }),
    );
  }
  const sellable = createdProducts.filter((p) => p.slug !== "anarse"); // anarse is sold out

  const createdCustomers = [];
  for (const c of customers) {
    createdCustomers.push({ ...c, row: await db.customer.create({ data: { name: c.name, email: c.email, country: c.country } }) });
  }

  // ~20 orders over the last 7 days; at least 3 on "today" in IST (orders 0-3).
  const todayIST = startOfDayIST();
  const now = Date.now();
  const ORDER_COUNT = 20;

  for (let i = 0; i < ORDER_COUNT; i++) {
    const dayOffset = i < 4 ? 0 : 1 + Math.floor(rand() * 6);
    let createdAt = new Date(todayIST.getTime() - dayOffset * 86_400_000 + (1 + rand() * 20) * 3_600_000);
    if (createdAt.getTime() > now) createdAt = new Date(now - (i + 1) * 600_000); // keep today's orders in the past

    const cust = i === 0 ? createdCustomers[0] : pick(createdCustomers);
    const lineCount = 1 + Math.floor(rand() * 3);
    const chosen = [...sellable].sort(() => rand() - 0.5).slice(0, lineCount);
    const items = chosen.map((p) => ({ product: p, quantity: 1 + Math.floor(rand() * 3) }));

    const subtotalCents = items.reduce((s, it) => s + it.product.priceCents * it.quantity, 0);
    const weight = items.reduce((s, it) => s + it.product.weightGrams * it.quantity, 0);
    const quote = quoteShipping(cust.country, weight, subtotalCents);
    if (!quote.supported) throw new Error("seed customer in unsupported country");

    // Status mix: older orders are further along. A few unpaid ones for the "pending payment" KPI.
    let paymentStatus: PaymentStatus = "PAID";
    let fulfilment: FulfilmentStatus = "NEW";
    if (i === 2 || i === 9 || i === 15) paymentStatus = "AWAITING_PAYMENT";
    else if (i === 18) paymentStatus = "CANCELLED";
    else if (dayOffset >= 4) fulfilment = rand() < 0.5 ? "DELIVERED" : "SHIPPED";
    else if (dayOffset >= 2) fulfilment = rand() < 0.5 ? "SHIPPED" : "PACKING";
    else if (dayOffset === 1) fulfilment = rand() < 0.5 ? "PACKING" : "NEW";

    const shipped = fulfilment === "SHIPPED" || fulfilment === "DELIVERED";
    const events: { type: string; message: string; createdAt: Date }[] = [
      { type: "created", message: "Order placed via chat", createdAt },
    ];
    if (paymentStatus === "PAID")
      events.push({ type: "paid", message: "Payment received (seeded demo data, no PayPal record)", createdAt: new Date(createdAt.getTime() + 300_000) });
    if (paymentStatus === "CANCELLED")
      events.push({ type: "cancelled", message: "Customer did not complete payment", createdAt: new Date(createdAt.getTime() + 86_400_000) });
    if (shipped)
      events.push({ type: "tracking_added", message: "Shipped via India Post", createdAt: new Date(createdAt.getTime() + 2 * 86_400_000) });

    await db.order.create({
      data: {
        customerId: cust.row.id,
        subtotalCents,
        shippingCents: quote.shippingCents,
        totalCents: quote.totalCents,
        shipName: cust.name,
        shipLine1: cust.line1,
        shipCity: cust.city,
        shipState: cust.state,
        shipPostal: cust.postal,
        shipCountry: cust.country,
        giftMessage: pick(gifts),
        paymentStatus,
        fulfilment,
        carrier: shipped ? "India Post" : null,
        trackingNumber: shipped ? `EE${String(100000000 + Math.floor(rand() * 899999999))}IN` : null,
        source: i % 5 === 0 ? "cart" : "chat",
        createdAt,
        items: { create: items.map((it) => ({ productId: it.product.id, quantity: it.quantity, unitCents: it.product.priceCents })) },
        events: { create: events },
      },
    });
  }

  const [p, c, o] = await Promise.all([db.product.count(), db.customer.count(), db.order.count()]);
  const today = await db.order.count({ where: { createdAt: { gte: todayIST } } });
  console.log(`Seeded ${p} products, ${c} customers, ${o} orders (${today} today IST).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
