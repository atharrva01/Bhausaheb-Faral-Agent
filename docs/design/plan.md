# Design plan: Bhausaheb Faral

Status: **plan + self-critique (steps 2–3). Not built yet.** Business logic, API routes, agent tools, DB schema, PayPal flows and auth are out of scope; this is visual, layout and interaction only.

---

## 0. The world this has to come from

Things you would actually see, touch or do around Bhausaheb General Kirana Stores at Diwali:

1. **The painted tin signboard (पाटी)** over the shop: red ground, hand-painted Devanagari in yellow and white, shop name first, town underneath, a thin painted border inset from the edge.
2. **The bill book (पावती पुस्तक)**: printed red letterhead, the bill number printed in red, ruled columns headed नग / माल / दर / रक्कम (qty / goods / rate / amount), a carbon copy underneath, and a perforation line where the slip tears off.
3. **The shop's round rubber stamp** in violet stamp-pad ink: the shop name in a ring, pressed onto every bill once money is received. Slightly uneven ink, slightly crooked.
4. **The red cloth-bound khata / chopda (ledger)**: red margin rules, columns, entries in order. At Lakshmi pujan the shop worships new account books (चोपडी पूजन). Diwali literally starts a new khata.
5. **The rate board (भाव फलक)** near the counter: item, pack, today's rate, in rows, changed by hand.
6. **Stainless steel everywhere**: the counter top, the dabbas the faral is stored in, and the round steel taat the faral is served on. A cool, slightly green-grey sheen; nothing beige about it.
7. **Glass barnis** with steel lids lined up on the counter (where stock is checked: "how much chakli is left in the barni?").
8. **The weighing scale and brass weights**: everything is in 250 g / 500 g packets, so pack size is part of the item's name.
9. **Haldi and kunku**: turmeric yellow and vermilion red, the two colours on every puja thali.
10. **The Kalnirnay calendar** on the wall: a dense grid of black dates, festival days in red. Practical, not decorative.
11. **Packing the parcel abroad**: faral in airtight dabbas, wrapped, stitched into white cloth (कापडी पार्सल), the address written in marker, an India Post speed-post sticker and a customs slip.
12. **Faral exchange (फराळ देणे-घेणे)**: plates sent to neighbours and relatives. Ordering is social and informal ("do packet chakli").
13. **The people**: Aai cooking with oily hands who can't type much; Atharva on WhatsApp juggling orders; relatives in New Jersey who think in "1 kilo"; the munim habit of writing every rupee in the khata.

**Deliberately not used:** diyas, rangoli dot patterns, akash kandil, marigold torans, paisley. They're true to Diwali, but they're the clip-art every Diwali template already uses (see §9).

---

## 1. Concept

**"The counter and the bill."** The site is the counter of Bhausaheb Kirana. On one side is the **rate board**: today's faral, packet sizes and rates. At the counter you **talk to the shop**: the chat is a column of the page itself, not a widget. Whatever you agree on, the shop writes on a **पावती, a bill-book slip**. That slip is the cart, the checkout summary, the amount PayPal charges, the order receipt, and on the owner side it becomes a line in the **khata**. When money comes in, the shop presses its **violet round stamp** on the slip.

**Signature element (the only bold thing): the पावती with the violet shop stamp.** A printed bill slip with a khata-red letterhead, bill number in red, Marathi column heads (नग / माल / दर / रक्कम), ruled rows, and a perforation line at the top where it tore off the book. It appears in exactly four places: the running bill at the counter, the checkout, the order page (stamped "पैसे मिळाले" when PayPal confirms), and the owner's action slips (stamped "नोंद केली" when confirmed). Only the slip gets a shadow, a texture or a tilt. Everything else is quiet: steel ground, ink text, hairline rules, no cards.

---

## 2. Colour

Seven named colours, each with one job. Contrast checked with the WCAG formula (script in this session):

| Name | Hex | Role | Contrast |
|---|---|---|---|
| **Steel** | `#E2E4DF` | Page ground (the counter top). Never beige. | Ink on steel 13.5:1, pencil on steel 6.0:1 |
| **Bill paper** | `#FBF8F0` | Only for paper objects: the पावती, input fields, customer message slips. | Ink on paper 16.3:1 |
| **Kirana ink** | `#1D1A17` | All body text, outlines of secondary buttons. | — |
| **Pencil** | `#57524B` | Secondary text, input borders (non-text 3:1 ✓). | 7.3:1 on paper |
| **Khata red** | `#9A1C23` | Signboard, bill letterhead, bill numbers, totals rule, error text. | 7.7:1 on paper; paper on red 7.7:1 |
| **Stamp violet** | `#4E3D7E` | The shop stamp and **commit actions only** (Make my bill, Mark shipped, Send invoice), links, focus ring. | 8.6:1 on paper, 7.2:1 on steel |
| **Haldi** | `#E3A21A` | Fills only: signboard lettering (large text only, 3.7:1 on red), "ink drying" highlight on a changed bill row, the to-pack marker. **Never as text on light.** | Ink on haldi 7.8:1 |

Rules: hairlines `#BFC3BB` (decorative only, never the only cue). No gradients, no tints of tints, no opacity-washed backgrounds.

---

## 3. Type

Two typefaces, both chosen for what they do with Devanagari:

- **Anek Devanagari** (Ek Type, variable `wdth 75–125`, `wght 100–800`). Its width axis lets one family do two jobs from the shop: **condensed and heavy like a painted signboard** (`wdth 75, wght 800`), and **normal width like the printed bill book** (`wdth 100`). The Latin and Devanagari share proportions, so "Chakli" and "चकली" sit on one line without fighting.
- **Tiro Devanagari Marathi** (Tiro Typeworks, 400 + italic). A text face that draws the **Marathi forms** of letters like ल and श rather than the Hindi ones. Used only for Marathi words: product names next to English, the stamp text, and the owner's Marathi summary and labels. Marathi readers will notice it's *their* script, not generic Devanagari.

| Role | Face | Size / line height (desktop → mobile) | Settings |
|---|---|---|---|
| Signboard | Anek | 56/52 → 34/34 | wdth 75, wght 800, haldi on khata red |
| Page title | Anek | 40/44 → 30/34 | wdth 82, wght 700 |
| Section head | Anek | 24/30 → 21/26 | wdth 88, wght 700 |
| Bill letterhead | Anek | 20/24 | wdth 75, wght 800, khata red |
| Body | Anek | 17/27 → 17/26 | wdth 100, wght 400 |
| UI label / button | Anek | 16/20 | wdth 100, wght 600 |
| Small print | Anek | 14/20 (floor: nothing smaller than 13) | wdth 100, wght 400, pencil |
| Money and quantities | Anek | inherits | `tabular-nums`, wght 600 |
| Marathi words | Tiro Marathi | 1.06× the companion size, line height 1.45 | 400; italic for gift notes |

No all-caps anywhere. Sentence case throughout.

---

## 4. Layout (ASCII wireframes)

Grid: 12 columns, max 1280 px, 24 px gutters desktop; 16 px side margins mobile. Text left-aligned everywhere. Nothing centred except the stamp.

### 4.1 Customer home + counter (chat), desktop 1440
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│▓ भाऊसाहेब जनरल किराणा स्टोर्स ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ signboard, 128px tall
│▓ Bhausaheb General Kirana Stores, opposite the bus depot, Karjat   Our story  Bill 3 ▓│ painted inset frame
├───────────────────────────────────────────────┬──────────────────────────────────┤
│ Aai's Diwali faral, 2026 batch                 │ At the counter                   │ cols 1-7 | cols 8-12
│ Fried, rolled and packed by hand in Karjat,    │ ─────────────────────────────────│ counter is sticky,
│ then posted to you in the US, UK, Canada,      │ Shop: Namaskar. Tell me what to  │ full viewport height
│ UAE and Australia.                             │ pack and where it's going…       │
│                                                │  2 chakli, 1 kilo besan ladoo,   │ suggestion lines
│ Today's rates                                  │   New Jersey                     │ (tap to send)
│ ┌──────┬───────────────────────┬──────┬──────┐ │  1 kilo ladoo aur chivda, Dubai  │
│ │ taat │ Chakli  चकली           │250 g │  $9  │ │                                  │
│ │ img  │ bhajani, sesame, ajwain│[−1+] │      │ │ ┌ पावती (running bill) ───────┐  │ the signature slip
│ ├──────┼───────────────────────┼──────┼──────┤ │ │ BHAUSAHEB… letterhead, red  │  │
│ │ …    8 rows, hairline rules, no cards        │ │ │ नग माल         दर    रक्कम   │  │
│ └──────┴───────────────────────┴──────┴──────┘ │ │ 2  Chakli      9.00  18.00  │  │
│                                                │ │ Postage to US         24.00 │  │
│ How the parcel reaches you                     │ │ Total                $70.00 │  │
│  Packed the day you pay. Posted by India Post  │ │ [ Make my bill ]  (violet)   │  │
│  speed post. Tracking number sent to your mail.│ └─────────────────────────────┘  │
│                                                │ [ Type to the shop…     ][Send]  │
├───────────────────────────────────────────────┴──────────────────────────────────┤
│ Opposite the bus depot, Karjat, Raigad. Payments by PayPal (sandbox).  Owner login │
└──────────────────────────────────────────────────────────────────────────────────┘
```
- The counter column is part of the page from first paint, with the greeting and two suggestion lines. **No floating widget.**
- The running bill sits at the bottom of the counter, above the input. Rate-board steppers and the agent edit the same server cart, and both re-render this one slip.

### 4.2 Customer home + counter, mobile 390
```
┌────────────────────────────┐
│▓ भाऊसाहेब जनरल किराणा ▓▓▓▓▓│ signboard, 2 lines, 96px
│▓ Karjat         Our story ▓│
├────────────────────────────┤
│ Aai's Diwali faral, 2026   │
│ Fried, rolled and packed…  │
│ At the counter             │ counter inline, ~70vh
│ Shop: Namaskar…            │ greeting + suggestion lines
│  2 chakli… New Jersey      │
│ [ Type to the shop… ][Send]│
│ Today's rates              │ rate board rows: img 64px,
│ img Chakli चकली      $9    │ name stacked over Marathi,
│     250 g   [ − 1 + ]      │ stepper under the price
│ …                          │
├────────────────────────────┤
│ Bill: 3 packets, $32  [See bill] │ sticky bar, only when bill has items
└────────────────────────────┘
```
"See bill" opens the bill as a bottom sheet (same slip component). The sheet's button is "Make my bill" → checkout.

### 4.3 Counter mid-order (tool results inside the conversation)
```
Shop: Adding to your bill…              ← tool activity in the shop's words, pencil, no spinner icon
┌ पावती slip (compact) ──────────┐       ← update_cart / quote_shipping result = the same slip, compact
│ 2 Chakli 18.00 · 2 Besan 28.00 │          changed rows flash haldi ("ink drying")
│ Postage to US        24.00     │
│ Total               $70.00     │
└────────────────────────────────┘
Shop: That's 2 packets each. Name, email and the full address for the parcel?
                              ┌──────────────────────────────┐
                              │ Priya Kulkarni, 41 Maple Ave… │ ← customer line: paper slip, right
                              └──────────────────────────────┘
Shop: Writing your bill…
┌ पावती, bill no. 1031 ───────────┐
│ …rows, total $70.00            │
│ [ PayPal button ]              │ ← create_checkout result: PayPal inside the bill
└────────────────────────────────┘
```

### 4.4 Checkout, desktop
```
signboard (slim, 72px)
┌ cols 1-6 ───────────────────────────────┐   ┌ cols 8-12 (sticky) ───────────────┐
│ Where is the parcel going?               │   │ पावती                              │
│ ( United States )( Canada )( UK )…       │   │ BHAUSAHEB letterhead, bill (draft) │
│  square segmented control, 44px          │   │ नग माल            दर     रक्कम      │
│ Name on the parcel                       │   │ 2  Chakli चकली   9.00   18.00 [−+] │
│ Email for the tracking number            │   │ 2  Besan ladoo  14.00   28.00 [−+] │
│ House / street                           │   │ ─────────────────────────────────  │
│ Flat, apartment (optional)               │   │ Postage to US, 1.5 kg      24.00   │
│ City            State         ZIP code   │   │ Total                    $70.00    │
│ A note to tuck in the parcel (optional)  │   │ $30 more and postage is free       │
│                                          │   │ [ Pay $70.00 with PayPal ] (PayPal)│
└──────────────────────────────────────────┘   └────────────────────────────────────┘
```
Mobile: the bill comes first (rows editable), then the address, then a sticky bottom bar "Total $70.00 / Make my bill". The PayPal buttons appear inside the slip.

### 4.5 Order status (desktop and mobile share one column, 640 max)
```
signboard (slim)
┌ पावती, bill no. 1027, 10 Nov 2026 ──────────┐
│ letterhead … rows … total $114.00            │
│                          ( violet round      │ ← stamp lands here once PAID
│                            stamp: पैसे मिळाले │
│                            Paid, 10 Nov )    │
└──────────────────────────────────────────────┘
Where your parcel is
  ■ Order written        10 Nov
  ■ Aai is packing       11 Nov
  □ Posted               India Post EE123456789IN
  □ Reached you
Parcel for Priya Kulkarni, Edison, NJ, Canada      Note inside: "Happy Diwali Aai-Baba" (Tiro italic)
```

### 4.6 Owner "Today" (dashboard), desktop
```
┌ khata-red bar 56px: Bhausaheb Faral, shop side   Today  Ask   English|मराठी   Log out ┐
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Wednesday, 11 November                                                               │
│ ┌ cols 1-8: To make and pack ─────────────────────┐ ┌ cols 9-12: Needs a look ──────┐│
│ │ For 5 parcels you need                           │ │ 3 bills not paid yet          ││
│ │  Chakli 7 packets   Besan ladoo 4   Karanji 4    │ │  1010 Sneha Patil   $63       ││
│ │ ──────────────────────────────────────────────── │ │  1016 Anjali Bhide  $48       ││
│ │ 1027 Priya Kulkarni, Canada                      │ │ Barni almost empty            ││
│ │  Chakli ×5, Shev ×1 …        [ Mark packed ]     │ │  Anarse 0 packets             ││
│ │ 1017 Amit Joshi, UAE         [ Mark packed ]     │ │ ───────────────────────────── ││
│ │ …                                                │ │ Aai's note for today          ││
│ └──────────────────────────────────────────────────┘ │ [ Write today's note ]        ││
│                                                       │ (5 lines, Marathi in Tiro)    ││
│ The khata (all orders)  [search]  [show cancelled]   └───────────────────────────────┘│
│ AG Grid themed as a ledger: red margin rule, 48px rows, ruled lines, stamp-style status │
└─────────────────────────────────────────────────────────────────────────────────────┘
```
Revenue appears once, as plain text in the khata header ("This week: $1,265 from 16 paid bills"), not as a tile.

### 4.7 Owner "Today", mobile
```
[red bar: Today | Ask | मराठी | ⋯]
Wednesday, 11 November
To make and pack: chakli 7, besan ladoo 4 …
parcel rows, each with [Mark packed] 48px tall
Needs a look: unpaid bills, empty barnis
Aai's note [Write today's note]
The khata: order cards (number, name, total, status select)
```

### 4.8 Owner assistant ("Ask"), desktop and mobile
```
red bar
┌ max 760 ─────────────────────────────────────────┐
│ Ask the shop book                                  │
│ Suggestion lines: What's left to pack? …          │
│ You: Mark 1027 shipped, India Post EE123…  (paper) │
│ Shop: Writing it up for you to check…              │
│ ┌ action slip (पावती style, ledger ruling) ──────┐ │
│ │ Mark 1027 as shipped                           │ │
│ │ Priya Kulkarni, Canada                         │ │
│ │ Packing, then shipped. India Post EE123…       │ │
│ │ Also adds tracking to her PayPal payment.      │ │
│ │ [ Mark shipped ] (violet)   [ Not now ]        │ │
│ └────────────────────────────────────────────────┘ │
│   after: violet stamp "नोंद केली", line "Marked shipped." │
│ [ Ask about orders, stock, money…     ][ Send ]    │
└────────────────────────────────────────────────────┘
```

### 4.9 Small pages
- **Our story**: signboard, then a single 680 px text column, written like a letter from Atharva. One inline rate-board excerpt. No cards.
- **404**: the bill slip with one row: "1 page, not found". Link: "Back to today's rates".
- **Owner login**: a plain form on steel: "Shop side", one password field, a "Open the khata" button.

---

## 5. Shape and depth (rules by object, not one value)

| Object | Radius | Edge / depth |
|---|---|---|
| Signboard | 0 | Flat red; 2 px haldi inset frame 8 px from the edge (painted border). No shadow. |
| **पावती slip** (signature) | 2 px | The only shadow in the system: `0 1px 0 rgb(0 0 0 / .06), 0 10px 22px -14px rgb(29 26 23 / .45)`. Top edge: a perforation (row of 4 px holes punched with a CSS mask), not a zigzag. Faint ruled lines. |
| Shop stamp | full circle | Violet ring, 2 px double border, slight -7° rotation, ink texture via an SVG turbulence mask (only on this element). |
| Rate-board rows | 0 | Hairline rules between rows. No background, no hover lift. Focus = violet outline on the row's stepper. |
| Product image | 50% (the steel taat is round) | Placed as a round plate on the rule line. |
| Customer message | 10 10 2 10 px | Paper fill, pencil hairline. No shadow. |
| Shop message | 0 | Plain text on steel with a 3 px khata-red rule on the left (like the khata margin). |
| Buttons | 4 px | Violet fill for commit actions, ink outline for everything else; 44 px min height (48 on owner pages). |
| Inputs | 3 px | Paper fill, 1.5 px pencil border; focus 2 px violet ring offset 2 px. |
| Segmented country control | 3 px on the outer group only | Square cells sharing borders, like boxes on a form. |
| Owner panels | 0 | Separated by a 2 px ink rule on top, like sections of a ledger page. |
| Status labels | 2 px | Outlined 1.5 px, coloured by meaning (paid violet, unpaid khata red, packing haldi fill + ink text, shipped ink outline). Like stamped words. |

---

## 6. Motion (strict budget: four moments, nothing else)

1. **Page-load moment (home only):** the running bill slides out from under the counter heading, as if torn off the pad (`translateY(-14px) → 0`, opacity, 380 ms, `cubic-bezier(.2,.7,.2,1)`). Plays once.
2. **Bill changes (user or agent adds/changes items):** the changed row's background goes haldi and fades to paper over 900 ms ("ink drying"). Both rate-board steppers and the agent trigger it.
3. **Payment confirmed:** the violet stamp presses onto the slip on the order page and in the counter (`scale 1.35 → 0.98 → 1`, opacity 0 → 1, rotate -7°, 260 ms).
4. **Owner action confirmed:** the same stamp with the action's text ("नोंद केली") on the action slip.

`prefers-reduced-motion: reduce` turns all four into instant state changes. No hover lifts, no scroll reveals, no animated gradients, no typing animations. The "shop is writing" indicator is static text.

---

## 7. Copy

**Voice:** the family behind the counter. Atharva writes the site; Aai's name carries the food. Warm, specific, short. Talks in packets, parcels, bills and postage. Marathi words appear where the shop would use them (पावती, फराळ, product names) and always next to English. Never "delicious", "artisanal", "doorstep", "seamless". Buttons say exactly what happens, and the result reuses the verb.

### Customer side
| Place | Copy |
|---|---|
| Signboard | भाऊसाहेब जनरल किराणा स्टोर्स / Bhausaheb General Kirana Stores, opposite the bus depot, Karjat |
| Intro heading | Aai's Diwali faral, 2026 batch |
| Intro text | Fried, rolled and packed by hand in Karjat, then posted to you in the US, UK, Canada, UAE and Australia. |
| Rate board heading | Today's rates |
| Rate board note | Rates are per packet, in US dollars. Postage is added on the bill. |
| Sold out | Finished for this batch |
| Stepper add | Add a packet / (when in bill) − 2 + |
| Counter heading | At the counter |
| Greeting | Namaskar. Tell me what to pack and where it's going. Write it however you like, "do packet chakli, Dubai" works too. |
| Suggestions | 2 chakli and 1 kilo besan ladoo to New Jersey / 1 kilo ladoo aur 2 packet chivda Dubai bhejna hai / Which ones have no ghee? |
| Input placeholder | Type to the shop… |
| Send | Send |
| Tool: update_cart | Adding to your bill… |
| Tool: get_cart | Reading your bill… |
| Tool: quote_shipping | Checking postage to {country}… |
| Tool: get_product | Asking Aai what goes into it… |
| Tool: create_checkout | Writing your bill and opening PayPal… |
| Tool: get_order_status | Looking up your bill in the order book… |
| Running bill empty | Nothing on the bill yet. Tell the counter, or add packets from today's rates. |
| Mobile bill bar | Bill: 3 packets, $32.00 / See bill |
| Bill primary | Make my bill (→ checkout) |
| Free postage hint | $30 more and the postage is on us. / Postage is on us. |
| Checkout title | Your bill |
| Address heading | Where is the parcel going? |
| Fields | Name on the parcel / Email for the tracking number / House and street / Flat or apartment (optional) / City / State / ZIP code (or Postcode, Province, PO box by country) / A note to tuck in the parcel (optional) |
| Saved hint | We'll remember this address on this phone. |
| Pay step | Pay $70.00 with PayPal (after the bill is made) / before: Make my bill |
| Paid (order page) | Stamp: पैसे मिळाले / Paid, 10 Nov. Line: Thank you, Priya. Aai starts frying tomorrow morning. |
| Parcel steps | Order written / Aai is packing / Posted / Reached you |
| Unpaid (order page) | This bill isn't paid yet. Pay $70.00 with PayPal |
| 404 | Bill no. 404: 1 page, not found. / Back to today's rates |

### Errors (say what happened and what to do)
| Case | Copy | Action |
|---|---|---|
| Gemini 429/503 | The counter is busy, lots of Diwali orders at once. Wait about 10 seconds and send again, or add packets from today's rates. | Send again |
| Other AI error | The counter didn't hear that. Send it again; your bill is safe. | Send again |
| PayPal create failed | PayPal couldn't open the payment. Check the address (especially state and ZIP) and press Make my bill again. Nothing was charged. | Make my bill |
| Capture failed | PayPal didn't complete the payment, so nothing was charged. Try the PayPal button again. | — |
| Address validation | Field-level, plain: That ZIP code doesn't look right for the US (example: 08817). | — |
| Country not served | We don't post there yet. We post to the US, UK, Canada, UAE and Australia. | — |

### Owner side (English / मराठी)
| Place | English | मराठी |
|---|---|---|
| Bar | Bhausaheb Faral, shop side | भाऊसाहेब फराळ, दुकान |
| Nav | Today / Ask | आज / विचारा |
| Main heading | To make and pack | आज बनवायचे आणि बांधायचे |
| Batch line | For 5 parcels you need | ५ पार्सलसाठी लागणार |
| Parcel action | Mark packed → Marked packed | पॅक झाले |
| Attention | Needs a look | लक्ष द्या |
| Unpaid | 3 bills not paid yet | ३ बिलांचे पैसे बाकी |
| Low stock | Barni almost empty | बरणी संपत आली |
| Summary | Aai's note for today / Write today's note → Note written | आजची नोंद / आजची नोंद लिहा |
| Khata | The khata, all orders | खाते, सर्व ऑर्डर |
| Week line | This week: $1,265 from 16 paid bills | या आठवड्यात: १६ बिलांतून $1,265 |
| Show cancelled | Show cancelled | रद्द केलेले दाखवा |
| Ask heading | Ask the shop book | खात्याला विचारा |
| Ask placeholder | Ask about orders, stock or money… | ऑर्डर, माल, पैसे… विचारा |
| Action buttons | Mark shipped → Marked shipped. / Send invoice → Invoice sent. / Not now → Left as it was. | पाठवले / बिल पाठवले / आत्ता नको |
| Owner tool activity | Opening the order book… / Totting up the khata… / Checking the barnis… / Weighing it out… / Asking PayPal… / Writing it up for you to check… | — |
| Login | Shop side / Password / Open the khata / Wrong password. Try again, or ask Atharva. | — |

---

## 8. Placeholder imagery

Each product is drawn **top-down on a round steel taat** (concentric cool greys with a thin bright rim), the item in two flat colours with an ink outline. All eight share one light direction, one stroke weight and one plate. This matches the steel world and also **sets the art direction for the real photos**: Atharva can shoot each faral top-down on the same steel plate on the counter.

Swap-in without code changes: a `prebuild` step lists `public/products/*.jpg` into a small generated manifest. The product image component uses `/products/{slug}.jpg` when it exists and falls back to `{slug}.svg`. Drop a photo in, push, and the next deploy uses it.

---

## 9. Self-critique (step 3): "Would I have done this for any food or e-commerce app?"

| First idea | Verdict | Replaced with | Why |
|---|---|---|---|
| Keep the maroon/cream/serif look and just refine it | Generic | Steel ground + paper only for paper objects + khata red only for the shop's printing | Cream + serif + terracotta is the exact preset the client rejected. Steel is what this counter and these dabbas are made of. |
| Receipt-style cart with a zigzag torn edge | Generic (thermal-receipt trope seen on every food app concept) | A **bill-book पावती** with red letterhead, red bill number, Marathi column heads and a straight **perforation line** | Indian kirana bills come from a bound bill book, not a thermal printer. The Marathi column heads make it unmistakably this shop. |
| A rectangular "PAID" stamp | Generic (invoice template) | The **shop's round violet stamp** with the shop name in the ring and "पैसे मिळाले" in the centre | That's the object pressed on real bills in Karjat. |
| Primary buttons in a brand indigo/purple | Generic (reads as SaaS) | Violet only for **commit actions** that "stamp" something (Make my bill, Mark shipped, Send invoice), and a duller, inkier violet (`#4E3D7E`) | Ties the colour to a meaning in this world: violet = the stamp = it's official now. |
| Rangoli dot-grid background, diya and akash kandil illustrations | Generic Diwali clip-art | None. Diwali comes from the faral itself, the "2026 batch" and the khata (चोपडी पूजन) | Every Diwali sale banner uses diyas and rangoli. |
| Kraft-paper pudi with twine for product images | Generic "artisanal" packaging trope | **Steel taat** illustrations | Kraft + twine is the global craft-brand look. The steel plate is how faral is actually served and photographed here. |
| A handwriting font (Kalam) on the bill | Kitsch, poor legibility | Printed-bill typography in Anek; only the stamp is "inked" | Real bill books are printed; only the stamp and totals are hand-applied. |
| Product cards in a grid | Generic (Shopify collection) | **Rate board** rows with column heads | A kirana shop lists rates; a 2-column card grid is how every store theme looks. |
| KPI tiles on the owner dashboard | Generic and not useful for Aai | **"To make and pack"** first (batch totals per product + parcel rows with one big button), then "Needs a look" | Aai needs to know what to fry and pack, not "$0.00 revenue today". |
| Floating chat bubble | Generic support widget | **"At the counter"**: a page column on desktop, an inline section on mobile, sharing the bill with the rate board | The chat is how this shop takes orders; it gets the counter's place on the page. |
| Chat bubbles for both sides | Generic chat UI | Shop lines as plain text with a red khata margin rule; customer lines as paper slips | Reads like a conversation over the counter written in the book, and stays clearly two-sided. |
| Pill chips for suggestions | Generic | Indented suggestion **lines** under the greeting, each a 44 px button | Feels like things people actually say, not tags. |
| Airmail red/blue stripe borders for "shipping abroad" | Generic shipping trope | Plain parcel steps written like ledger entries | Overused postal motif. |
| Big centred greeting "Namaskar, Aai 🙏" | Generic friendly dashboard | The date as the owner's heading, like the top of a khata page | The khata page starts with the date. |
| Using Tiro Marathi for headings too | Overreach | Tiro only for Marathi words | Keeps the second face meaningful and the page disciplined. |
| Haldi as a text colour for accents | Fails contrast (2.1:1) and is decorative | Haldi only as a fill (signboard letters at large size, ink-drying flash, to-pack marker) | Accessibility, and fewer accent colours. |
| Section fade-ins on scroll | Generic motion | Four motion moments, all tied to real events | Motion budget. |

What still carries some risk, and how it's held in check:
- **A red band at the top** could still read as "hero band". It's held to signboard proportions (128 px, not a screen), carries Devanagari first with a painted inset frame, and has no subline or buttons.
- **Light grey ground** is common in dashboards. It's tuned to a cool green-grey steel (`#E2E4DF`) and only ever paired with paper objects and ink, never white cards.

---

## 10. Build order (step 4, after approval)
1. Tokens + fonts (Tailwind theme, CSS variables, Anek width axis, Tiro Marathi), stripping old classes (`shadow-*`, `uppercase`, `tracking-*`, `font-mono`, `rounded-2xl` everywhere, emoji, arrows).
2. `<Bill>` slip component + `<ShopStamp>`, used by counter, checkout, order page and owner actions.
3. Customer home: signboard, rate board, counter column (chat moves out of the floating panel into the page; shared chat state via a provider so it survives navigation).
4. Checkout, order page (stamp moment), story, 404.
5. Owner: red bar with English/मराठी toggle (labels + summary language), "To make and pack", "Needs a look", the khata (AG Grid theme: Anek, 48 px rows, ruled, red margin rule, stamp-style status), mobile cards.
6. Owner "Ask": action slips with verb buttons and the stamp.
7. Steel-taat illustrations + image manifest.
8. Mobile pass at 390, 768, 1024, 1440; focus states; reduced motion; contrast re-check.
9. After screenshots in `docs/design/screenshots/after/`, grep check, end-to-end tests of both flows.
