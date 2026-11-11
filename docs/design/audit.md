# Design audit: why the current UI reads as generated

Screenshots: `docs/design/screenshots/before/*-1440.png` and `*-390.png` (captured 2026-11-11 with Playwright, live data, real Gemini replies).

The short version: every screen is assembled from the default kit of an "AI-built food app". Maroon band, cream page, serif display face, a pill-shaped orange call to action, rounded white cards with soft shadows, a corner chat bubble, KPI tiles. Swap the product names and it could sell candles, coffee or biryani. Nothing on screen comes from a Maharashtrian kirana shop, a faral plate, or a parcel going abroad.

## System-wide problems

| Problem | Where | Why it reads as generated |
|---|---|---|
| Cream background + serif headline (Rozha One) + terracotta/maroon accent | Every page | The single most common "warm artisanal" preset. Exactly the combination the client rejected. |
| One radius for everything (`rounded-2xl`), one soft shadow (`shadow-sm`/`shadow-lg`) | Product cards, checkout sections, order sections, KPI tiles, summary card, drawers, chat panel | No hierarchy: a product, a form section and a KPI look like the same object. |
| ALL CAPS tracked eyebrow labels | "GHARGUTI DIWALI FARAL", "YOUR CART", "ORDERS TODAY", "ORDER UPDATE · NEEDS YOUR OK", "OWNER" badge | Template tell. |
| Accent-coloured word in headline | Hero: "Bhausaheb Faral **भाऊसाहेब फराळ**" in turmeric | Template tell (one word in a second colour). |
| Middle-dot meta strings | "250 g · Medium spice · Veg, eggless", "Free shipping over $100.00 · Pay in USD with PayPal", "#1027 · Priya Kulkarni · CA", "10 Nov · via cart" | Every line of metadata is a dot-joined string. |
| Arrows on buttons and links | "Checkout →", "← Continue shopping", "← Back to the shop", "Status: NEW → SHIPPED" | Template tell. |
| Emoji as UI | 🪔 in nav, 404 and order page, 🙏 in greetings, 🎉 for free shipping, 📦💰⭐⏳🎁 in the AI summary, ↻ on refresh | Emoji stand in for design decisions. They also render as empty boxes on systems without colour emoji (seen in our own headless captures). |
| Monospace IDs | PayPal order/capture ids in the owner drawer (`font-mono`) | Developer aesthetic shown to a home cook. |
| Generic copy | "Homemade Diwali faral from Karjat, delivered to your doorstep abroad.", "This Diwali's faral", "Here's how the faral orders are doing.", "Secure payment by PayPal." | Could be any food brand. No voice of the family. |
| Icons as decoration | Generic cart and chat-bubble outline icons | Stock UI vocabulary. |
| Status pills all identical soft-tint rounded pills | Payment and fulfilment everywhere | Default dashboard pills. |

## Screen by screen

### 01 Customer home (`01-home-1440`, `01-home-390`)
- **Hero is the stock layout**: eyebrow label, two-line display headline, subline, a row of country pills, then two buttons ("Order by chatting…" filled, "Browse faral" outlined). Left-aligned, but otherwise the default.
- **The diya illustration** at 20% opacity in the corner is festival clip-art used as wallpaper.
- **Product grid = 8 identical cards**: image on top, title, Marathi name, two-line clamped description, meta line, price, full-width button. A kirana shop doesn't present goods like a Shopify collection.
- **Placeholder art**: every product sits on the same gold plate with corner "rangoli" blobs. It's consistent, but it says "generic Indian food" rather than this shop.
- **"How ordering works"**: three identical cards with numbered orange circles 1/2/3. It is a sequence, but the treatment is the stock "3 steps" block.
- **Floating "Order with Aai's assistant" pill** bottom right: the corner chat widget, covering product content at 1440 (Karanji card) and needing a separate bottom bar on mobile.
- **Mobile**: the hero takes the whole first screen with no product or counter visible. The 2-column card grid truncates descriptions mid-word.

### 02 Chat (`02-chat-1440`, `02-chat-390`)
- **It's a widget**: a 400px floating panel over the hero on desktop, a full-screen overlay on mobile that hides the shop. The chat is the core of the product but is treated like a support bubble.
- **Chat bubbles** are the standard rounded speech bubbles (maroon for the user, white for the assistant), the same in every chat UI.
- **Tool activity** shows as a pulsing dot plus generic text ("Updating your cart…"): readable, but not in the shop's voice.
- **The cart card** is a rounded white card with an all-caps "YOUR CART" header: a dashboard widget, not something a shop hands you.
- **The empty state** is a greeting plus three pill chips. OK functionally, but generic.
- **The cart lives in three places** (nav pill, chat card, checkout page), each designed differently.

### 03 Cart / checkout (`03-checkout-1440`, `03-checkout-390`)
- **Three numbered cards** ("1. Your faral", "2. Where should we ship?", "3. Pay") in the same rounded style: a generic checkout wizard.
- **Country selection** uses five rounded pills, the same as the hero pills.
- **The form** is stacked rounded inputs with labels, default e-commerce.
- **The free-shipping progress bar** in an orange-tint box is a stock upsell pattern.
- **Mobile**: about 1,800px of scrolling, with the total and the pay button at the very bottom.

### 04 Order status (`04-order-1440`, `04-order-390`)
- **"Paid" green pill** next to the title, then a four-box orange stepper. It's a SaaS progress tracker; nothing marks the moment you have paid.
- **Three more rounded cards** (Items, Shipping to, Gift message).
- The 🪔 renders as an empty box on systems without colour emoji.

### 05 About (`05-about-*`)
- The same eyebrow + band hero, two side-by-side white cards, a tinted note box, and pill buttons. The writing is good; the presentation is a template blog post.

### 06 404 (`06-404-*`)
- A centred emoji, serif headline and pill button. It's fine, but it's the default "friendly 404".

### 07 Owner login (`07-owner-login-*`)
- A centred white card on cream with an all-caps eyebrow and a pill button: the stock auth card.

### 08 Owner dashboard (`08-owner-dashboard-1440`, `08-owner-dashboard-390`)
- **The KPI tile row** (Orders today / Revenue today / Awaiting payment / To pack / Shipped) leads the page. These are vanity numbers first: "0", "$0.00". The most useful thing for Aai (what to make and pack today) is a number in the 4th tile.
- **"Namaskar, Aai 🙏"** is a greeting headline plus emoji: the default friendly-dashboard opener.
- **The AI summary** is a card with a pill toggle and an orange pill button. Its output is emoji-led lines that render as boxes.
- **AG Grid** is lightly tinted Quartz with a header band, filter icons on every column, and default pills. It reads as "admin panel".
- **Owner header**: a dark bar with an orange "OWNER" badge in caps.
- **Mobile**: the tiles stack into a tall column before anything actionable.

### 09 Owner assistant (`09-owner-assistant-*`)
- **Chat in a centred white card**, dark user bubbles, white assistant bubbles.
- **The action card** has an orange 2px border, an all-caps "ORDER UPDATE · NEEDS YOUR OK", "Status: NEW → SHIPPED", and a big green "Confirm" button. The button doesn't say what it does ("Confirm" what?), and the result line ("✓ Done.") doesn't reuse the verb.

## What already works and must survive the redesign
- Information architecture and flows: chat → cart → PayPal → order page; dashboard → assistant → confirm cards.
- Real Marathi names next to English ones.
- Server-computed totals shown inside the chat.
- One-tap native status select (owner) and the mobile order cards.
- Accessibility basics: real buttons, labels, focus rings via Tailwind defaults.
