# Concert Hall — VR Seat Selector

An immersive, production-ready 3D ticketing experience for **Simfoniya Konserti** at **Istiqlol San'at Saroyi**, Tashkent. Explore the auditorium, pick a seat in real time, preview the exact view from it, and complete a simulated checkout.

![Concert Hall overview](./img/images%20(1).jpeg)

## Highlights

- **Procedural 2,113-seat auditorium** rendered with a single `InstancedMesh` per seat part for smooth performance.
- **Reference-driven architecture**: folded acoustic ceiling funnels, tiered white balcony slats, gold/wood trim, burgundy velvet seating, amber wood stage canopy, and a glossy black stage.
- **Fully interactive hall**: orbit, pan, zoom, reset overview, and focus-stage camera modes.
- **View from Seat**: cinematic camera transition to eye level with 360° drag/arrow-key look-around and a one-click return to the hall.
- **Live booking UI**: hover tooltips, available/hover/selected/booked states, VIP pricing, selection cart, totals, and a three-step checkout with confirmation ticket and `.ics` calendar download.
- **Responsive luxury interface**: dark glassmorphism sidebar on desktop and a bottom dock with a booking sheet on mobile.
- **No people or avatars**: the hall is intentionally empty.

## Tech stack

React 18 · TypeScript · Vite 5 · Three.js · React Three Fiber · Drei · Framer Motion · Zustand · Tailwind CSS · Lucide React

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Production build

```bash
npm run build
npm run preview
```

### Type checking

```bash
npm run typecheck
```

## Controls

| Action | Input |
| --- | --- |
| Orbit / pan / zoom | Drag, right-drag, scroll |
| Select seat | Click or tap an available seat |
| Reset overview | `R` or the orbit button |
| Focus stage | `F` or the stage button |
| Look around in seat view | Drag anywhere, or use arrow keys |
| Exit seat view | `Esc` or **Back to hall overview** |

## Project structure

```
src/
  components/ui/   Booking panel, seat HUD, tooltip, checkout, mobile UI
  data/            Event metadata, procedural seat generation, pricing
  scene/           Auditorium shell, ceiling, stage, instanced seats, camera rig
  store/           Zustand booking and camera state
public/            Favicon
img/               Local architectural reference photography
```

## Seat sections

| Section | Seats | Price |
| --- | ---: | ---: |
| VIP | 28 | 890,000 UZS |
| Parterre | 1,319 | 490,000 UZS |
| Tier 1 | 430 | 350,000 UZS |
| Side Balcony | 336 | 310,000 UZS |

419 seats are deterministically pre-booked so the hall feels live on every visit.

## Notes

- Checkout and payment are simulated for demonstration purposes. No real payment data is sent anywhere.
- The selected seats and purchases are kept in memory for the current session.
- The production bundle is intentionally code-split only by Vite defaults; the Three.js scene is the primary chunk.
