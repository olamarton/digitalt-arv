# STARTSIDA — Nyckelvalvet.se
> Tekniska beslut, felsökning och deployment-workflow för landing page.
> Uppdaterad: April 2026

---

## Nuläge

| Fil | Status |
|---|---|
| `public/landing.html` | ✅ Live — komplett design, copy, FAQ, prissättning |
| `public/landing.js` | ✅ Live — all JavaScript externaliserad |
| `public/demo.html` | ✅ Live — interaktiv demo av appen |
| `src/app/route.ts` | ⛔ INAKTIVERAD (döpt till `route.ts.bak`) |
| `next.config.mjs` | ✅ Rewrite `/` → `/landing.html` |

**Live URL:** https://digitalt-arv.vercel.app

---

## Arkitektur — varför det ser ut som det gör

### Problemet med Next.js + inline scripts
Next.js App Router interceptar ALLA HTTP-svar — även statiska filer via `rewrites()` — och injicerar sin React-runtime (`Vary: RSC`-header avslöjar detta). Den runtime-scripten körs i browsern och strippar/ignorerar inline `<script>`-block under sin hydration-process.

**Symptom:** Fem browsers, alla devices — `typeof openDemo === 'undefined'`, hamburgermenyn fungerar inte, inga konsolfel.

### Lösning: extern JS-fil
All JavaScript ligger i `public/landing.js`. Extern script-referens (`<script src="/landing.js">`) kan Next.js inte strippa — den laddas som separat HTTP-request.

### Root cause — okopplad HTML-kommentar
Den egentliga orsaken till att INGENTING fungerade från dag ett:

```html
<!-- ═══════════════════ JAVASCRIPT ═══════════════════ */
<script src="/landing.js"></script>
</body>
</html>
```

HTML-kommentaren öppnas med `<!--` men stängs ALDRIG — `*/` är CSS-syntax, inte `-->`. Browsern tolkar allt efter `<!--` som en kommentar, inklusive script-taggen, `</body>` och `</html>`. Gäller i alla browsers utan undantag.

**Fix:** Ta bort kommentarsraden helt.

---

## Deploy-workflow

```bash
cd ~/Documents/Claude/Projects/Digitalt-Arv/digitalt-arv
npx vercel@latest --prod --yes
```

Kräver att du är inloggad med Vercel CLI. Om CLI saknas installeras det automatiskt av `npx`. Deployar direkt till produktion (`digitalt-arv.vercel.app`).

**Vercel-projekt:**
- Team ID: `team_X2NGWNETtU8DQpXIlM2N3Ete`
- Project ID: `prj_5S3NRk6e96tsIF62GaffvRDJp98r`
- Config: `.vercel/project.json`

---

## Fil-struktur (landing page-relevanta filer)

```
digitalt-arv/
├── next.config.mjs          ← rewrite: / → /landing.html
├── src/app/
│   ├── route.ts.bak         ← INAKTIVERAD — orsakade Next.js-wrapping
│   └── layout.tsx           ← gäller ej för statiska filer
└── public/
    ├── landing.html         ← startsidan (komplett HTML + CSS)
    ├── landing.js           ← all JS externaliserad hit
    └── demo.html            ← interaktiv app-demo
```

---

## JavaScript-funktioner i landing.js

| Funktion | Trigger | Vad den gör |
|---|---|---|
| `openDemo()` | Alla demo/CTA-knappar | `window.location.href = '/demo.html'` |
| `toggleMobileMenu()` | Hamburger-knapp | Öppnar/stänger mobilmeny |
| `closeMobileMenu()` | Menylinks, openDemo | Stänger mobilmeny |
| `toggleFaq(btn)` | FAQ-frågor | Accordion open/close |
| `scrollToTop(e)` | Logo-klick | Smooth scroll till topp |
| IntersectionObserver | Auto | Scroll-reveal på `.reveal`-element |

---

## CSS-klasser att känna till

```css
.nav-mobile.open { display: block; }   /* KRITISK — utan display:block öppnas inte menyn */
.js-ready .reveal { opacity: 0; }      /* Sätts av JS — gömmer element tills synliga */
.js-ready .reveal.visible { opacity: 1; } /* IntersectionObserver lägger till .visible */
body.js-ready                          /* Flagga att JS kör — sätts omedelbart vid load */
```

---

## Debugging-verktyg

Kör i browser-konsolen för att verifiera att allt fungerar:
```javascript
// Ska ge 'function' för alla tre
console.log(typeof openDemo, typeof toggleMobileMenu, typeof toggleFaq)

// Ska ge 'js-ready' om JS kör
console.log(document.body.className)

// Testa demo-navigering direkt
openDemo()
```

---

## Vanliga fällor

| Fel | Orsak | Fix |
|---|---|---|
| Inline scripts körs inte | Next.js hydration strippar dem | Externalisera till `/landing.js` |
| Hamburger öppnas inte | `.nav-mobile.open` saknar `display:block` | Redan fixat i CSS |
| Knappar öppnar popup | `window.open()` blockeras av popup-blockers | Använd `window.location.href` |
| Script i HTML-kommentar | `<!-- ... */` stänger inte kommentaren | Ta bort kommentarsraden |
| CDN serverar gammal version | Vercel edge cache med `age > 0` | Vänta eller deploy ny version |

---

## Nästa steg — Fas 1

- [ ] BankID via Idura (sandbox → prod)
- [ ] Supabase-schema live (se CLAUDE.md §3)
- [ ] tRPC-routers: user, social, passwords, farewell
- [ ] Stripe-integration (49 kr/mån + 990 kr lifetime)
- [ ] Byt domän från `digitalt-arv.vercel.app` till produktionsdomän
- [ ] Aktivera `route.ts` igen när backend är klar (ta bort `.bak`)

---

*STARTSIDA.md · Digitalt Arv · Scandinavian Design www AB*
