# POS System — Barcode Scanner + Receipt Print

## Overview
Store ke liye ek mukammal POS (Point of Sale) cashier system banaya jayega jisme:
- Products databse with barcode
- Cashier screen with barcode scanner support
- Thermal-style receipt print

---

## Proposed Changes

### Backend

#### [MODIFY] schema.prisma
New models add honge:
- **Product** — `name`, `barcode` (unique), `price`, `stock`, `unit`, `categoryId`
- **SaleTransaction** — `receiptNo`, `totalAmount`, `paidAmount`, `change`, `discount`
- **SaleItem** — `saleId`, `productId`, `name`, `qty`, `price`, `total`
- Category model mein `products Product[]` relation

#### [NEW] productController.js
- `GET /api/products` — all products
- `GET /api/products/barcode/:barcode` — lookup by barcode (POS scanner use karega)
- `POST /api/products` — create
- `PUT /api/products/:id` — update
- `DELETE /api/products` — bulk delete

#### [NEW] productRoutes.js

#### [NEW] saleController.js
- `GET /api/sales` — all sales history
- `POST /api/sales` — create sale (from POS checkout)
- `DELETE /api/sales` — bulk delete

#### [NEW] saleRoutes.js

#### [MODIFY] app.js — new routes register

---

### Frontend

#### [NEW] Products.jsx
Simple CRUD page — product Name, Barcode, Price, Stock, Unit, Category

#### [NEW] POS.jsx — Main cashier screen
```
┌─────────────────────────────────────────────────────────┐
│  🏪 POS — Cashier                     [17/06/2026]      │
├──────────────────────────┬──────────────────────────────┤
│  🔍 [Scan Barcode ↵]    │  BILL                        │
│                          │  ─────────────────────────── │
│  # Item      Qty  Price  │  Items: 3                    │
│  1 Product A  2   100    │  Subtotal:    Rs. 300        │
│  2 Product B  1   200    │  Discount:  [ 0           ]  │
│  [× Remove]              │  Total:       Rs. 300        │
│                          │  ─────────────────────────── │
│  [+Add Manually]         │  Cash:    [  500          ]  │
│                          │  Change:      Rs. 200        │
│                          │  ─────────────────────────── │
│                          │  [🖨️ Print Receipt] [Clear]  │
└──────────────────────────┴──────────────────────────────┘
```

**Barcode Scanner:** Input field auto-focused. Scanner types barcode + Enter → product loads instantly

**Receipt:** Thermal-style print via `window.print()` with print-only CSS:
```
================================
      YOUR STORE
      Inventory System
================================
Date: 17/06/2026  R-0001
================================
Product A    2 x 50    Rs.100
Product B    1 x 200   Rs.200
================================
Total:               Rs.300
Paid:                Rs.500
Change:              Rs.200
================================
   Thank you! Come again
================================
```

#### [MODIFY] App.jsx — routes `/products`, `/pos`

---

## Open Questions
> [!IMPORTANT]
> **Store ka naam kya hai?** Receipt mein print hoga (e.g., "My Store" ya "XYZ Shop")

---

## Verification Plan
- Products add karein with barcode
- POS page par barcode scan karein → product cart mein aaye
- Print Receipt → thermal-style receipt browser print dialog mein aaye
