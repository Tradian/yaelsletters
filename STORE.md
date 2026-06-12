# Selling books & taking donations

Everything is wired. There is **one file to edit** — [`assets/store.js`](assets/store.js) —
and the buttons go live the moment you paste a URL in. No code changes, no
redeploy beyond committing that file. Buttons left blank show a quiet
"Available soon" state, so nothing ever looks broken.

```js
window.STORE = {
  donate: {
    buymeacoffee: "https://buymeacoffee.com/yaelsletters",   // ← your page
    stripe: ""                                                // ← optional
  },
  books: {
    "letters-from-the-hill": { ebook: "https://payhip.com/b/abcd", paper: "" },
    "before-the-rooster":    { ebook: "", paper: "" }
  }
};
```

---

## Ebooks — get paid + auto-deliver (no inventory, no shipping)
Yael won't handle files or fulfilment, so use a seller that takes the payment
**and delivers the file automatically**:

- **Payhip** or **Gumroad** (recommended). Both: connect your **Stripe**, upload
  the PDF/EPUB, set a price, get a product link. On purchase, the buyer is
  emailed the download automatically. No inventory, no shipping.

**Steps:** create the account → connect Stripe → upload the ebook + price →
copy the product/checkout URL → paste it into `store.js` under that book's
`ebook`. Done — "Get the ebook" now works.

**Paper copies:** if you offer print, use print-on-demand (Lulu, Amazon KDP) so
there's still nothing to ship from home; paste that link into `paper`. Leave it
blank and the "Or the paper copy" link just stays quiet.

### Delivering to people who already pre-paid
The website doesn't store files or customers — the seller platform does — so
deliver the presold copies one of two ways:
1. **From the seller:** on Payhip/Gumroad create a **100%-off / free coupon** (or
   use "send to customer") and email your presold list that link, so they
   download without paying again; **or**
2. **Directly:** email the file to your presold buyers yourself (or as a one-off
   Resend broadcast) — simplest if the list is short.

---

## Donations — Buy Me a Coffee (+ optional Stripe)
- **Buy Me a Coffee:** create your page, then paste its URL into
  `donate.buymeacoffee`. BMC pays out through **Stripe**, so it covers cards
  cleanly. The "Buy Yael a coffee" button on **Support** then works.
- **Give another way (optional):** make a **Stripe Payment Link** (a hosted
  donation page) and paste it into `donate.stripe`. Leave blank to hide that
  option.

The little "donations connect here" note on the Support page disappears on its
own once a donation link is set.

---

## Notes
- Links open in a **new tab**. We use plain links (not embedded checkout
  pop-ups) so the site stays inside its strict security policy (CSP). If you
  later want an in-page checkout overlay, that provider's domain just needs
  adding to the CSP — ask and we'll wire it.
- Adding a new book later: give its page a `data-book="<slug>"` (the buy buttons
  already follow this pattern) and add a matching entry under `books` in
  `store.js`.
- The Privacy Policy and Terms already name Stripe / Buy Me a Coffee as payment
  providers; if you choose Payhip/Gumroad too, add them there for accuracy.
