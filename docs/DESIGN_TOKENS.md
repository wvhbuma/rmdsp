# Design Tokens — ES Brand

Geëxtraheerd uit `RAM_DSP.py` regels 1748-1810. **Deze tokens zijn authoritatief voor de React-frontend.**

Alles wat hieronder staat moet gereproduceerd worden in `tailwind.config.ts` of `src/styles/globals.css`. Geen magic numbers elders in de codebase.

---

## Kleuren

```ts
// tailwind.config.ts — theme.extend.colors
{
  'es-blue':       '#0077FF',   // primary accent, actieve nav, links, CTA's
  'es-magenta':    '#C92EC9',   // secondary accent, gradients
  'rm-gray':       '#6D6E71',   // secundaire tekst, nav-items (idle)
  'rm-gray-light': '#EDF0F2',   // hover-states, menubar, subtle backgrounds
  'rm-dark':       '#1a1a2e',   // primary text, headings, logo
  'rm-border':     '#e0e4e8',   // borders (sidebar right, topbar bottom)
  'rm-bg':         '#f8f9fb',   // body background (NIET #EDF0F2 — dat is rm-gray-light)
  'rm-surface':    '#ffffff',   // card/surface background
}
```

### Semantische kleuren (optioneel, voor later)

```ts
// niet verplicht in Fase 0, maar nuttige vooruitziende namen
{
  'status-ok':    '#10b981',   // groen (bv. API reachable)
  'status-warn':  '#f59e0b',   // oranje
  'status-error': '#ef4444',   // rood
}
```

### Gradients

ES signature-gradient voor headers, logo's, accent-elementen:

```css
background: linear-gradient(135deg, #0077FF 0%, #C92EC9 100%);
```

In Tailwind:
```tsx
<div className="bg-gradient-to-br from-es-blue to-es-magenta" />
```

Met text-clip voor gradient-text (zoals DSP `.sidebar-logo h2`):
```tsx
<h2 className="bg-gradient-to-br from-es-blue to-es-magenta bg-clip-text text-transparent font-display font-bold text-base">
  European Sleeper
</h2>
```

---

## Typography

```ts
// tailwind.config.ts — theme.extend.fontFamily
{
  'display': ['"Red Hat Display"', 'sans-serif'],   // headers, nav items, topbar title, buttons
  'body':    ['Lato', 'sans-serif'],                // body text, paragraphs, data
}
```

### Google Fonts imports

In `index.html` (vóór `</head>`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;600;700&family=Lato:wght@400;500;700&display=swap" rel="stylesheet">
```

### Default body styling

In `src/styles/globals.css`:

```css
body {
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  color: #333;
  background-color: #f8f9fb;
}
```

Of via Tailwind in `globals.css`:
```css
@layer base {
  body {
    @apply font-body text-sm text-[#333] bg-rm-bg;
  }
}
```

### Font-size scale (gebruikt in DSP)

| Token | Pixels | Gebruik |
|-------|--------|---------|
| `text-[10px]` | 10px | sidebar footer, badges |
| `text-[11px]` | 11px | kleine subkopjes, tags |
| `text-xs` | 12px | nav sub-items, meta-info |
| `text-sm` | 14px | **default body** |
| `text-base` | 16px | geen |
| `text-[13px]` | 13px | nav items, table rows |
| `text-[20px]` | 20px | topbar page title |
| `text-2xl` (24px) | 24px | home welcome heading |

---

## Spacing & Sizing

```ts
// tailwind.config.ts — theme.extend.spacing + width
{
  spacing: {
    // sidebar-width is uniek genoeg om als dedicated token te hebben
    'sidebar': '220px',
  },
  width: {
    'sidebar': '220px',
  }
}
```

Gebruik:
```tsx
<aside className="w-sidebar" />
<main className="ml-sidebar" />
```

---

## Component-specifieke styling (reference uit DSP)

### Sidebar item (idle / hover / active)

```tsx
// idle
<button className="flex items-center gap-2.5 px-5 py-2.5 w-full text-left 
                   font-display font-medium text-[13px] text-rm-gray 
                   border-r-[3px] border-transparent transition-colors">

// hover (Tailwind: hover:-prefix)
className="hover:bg-rm-gray-light hover:text-rm-dark"

// active
className="text-es-blue bg-[rgba(0,119,255,0.06)] border-r-es-blue"
```

### Topbar

```tsx
<div className="bg-white border-b border-rm-border px-8 py-4 
                flex items-center justify-between">
  <h1 className="font-display font-semibold text-[20px] text-rm-dark">
    {pageTitle}
  </h1>
  <div className="text-xs text-rm-gray">
    {dateString}
  </div>
</div>
```

### Home welcome-circle (DSP regel 2262-2263)

```tsx
<div className="w-16 h-16 mx-auto mb-5 rounded-2xl 
                bg-gradient-to-br from-es-blue to-es-magenta 
                flex items-center justify-center">
  <ClockIcon className="w-8 h-8 text-white" strokeWidth={1.8} />
</div>
```

### Sidebar-logo (DSP regel 2103-2106)

```tsx
<div className="p-5 pt-5 pb-4 border-b border-rm-border">
  <h2 className="font-display font-bold text-base 
                 bg-gradient-to-br from-es-blue to-es-magenta 
                 bg-clip-text text-transparent">
    European Sleeper
  </h2>
  <div className="text-[11px] text-rm-gray mt-0.5">
    RevenueMindz
  </div>
</div>
```

---

## Icons

DSP gebruikt **inline SVG icons** (Feather/Lucide-style, 1.8 stroke-width, 24x24 viewBox, `currentColor` stroke).

Voor Fase 0: neem de SVG's letterlijk over uit RAM_DSP.py (regels 2108-2245). Lucide-react als npm-package kan later worden toegevoegd; voor nu hardcoded SVG's houden dingen simpel en vermijdt een extra dependency.

Standaard icon-size in sidebar:
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
     strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
     className="w-[18px] h-[18px] flex-shrink-0">
  {/* path content */}
</svg>
```

---

## Borders & Radii

```ts
// Gebruik Tailwind defaults:
// rounded     = 4px
// rounded-md  = 6px  
// rounded-lg  = 8px  ← veel gebruikt in DSP (tables, cards)
// rounded-2xl = 16px ← home welcome circle
// rounded-full = cirkels
```

Border-widths: Tailwind defaults werken (`border`, `border-2`). Enige uitzondering: actieve nav-item heeft 3px right-border:
```tsx
className="border-r-[3px] border-transparent [.active &]:border-es-blue"
```

---

## Verboden in Fase 0

- Geen custom dark mode variables
- Geen extra kleuren toevoegen buiten deze lijst zonder overleg
- Geen `text-[13.5px]` of andere rare waarden — Tailwind-scale of exacte pixel-waarden hierboven
- Geen Material Design shadows / elevation — DSP heeft platte design met subtle borders
- Geen CSS animations in Fase 0 behalve de bestaande `transition-colors` voor hover-states

---

## Validatie

Aan het eind van stap 2 (Tailwind setup), test dit blok:

```tsx
<div className="p-8 space-y-4">
  <h1 className="text-2xl font-display font-bold 
                 bg-gradient-to-br from-es-blue to-es-magenta 
                 bg-clip-text text-transparent">
    RAM
  </h1>
  <p className="font-body text-sm text-rm-gray">
    European Sleeper Revenue Management
  </p>
  <div className="h-px bg-rm-border" />
  <div className="flex gap-2">
    <span className="text-xs text-rm-gray">Weekly</span>
    <span className="text-xs text-es-blue font-medium">Active</span>
  </div>
</div>
```

Als dit correct rendert (gradient-heading in ES-blauw→magenta, Lato body-text, grijze border), zijn de tokens goed geconfigureerd.
