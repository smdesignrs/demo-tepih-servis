# Demo sajt za tepih servise

Sablon i prodajni demo. Sluzi da se vlasniku tepih servisa posalje ziv link i da
vidi tacno sta dobija, pre nego sto bilo sta plati.

**Nije sajt nijedne stvarne firme.** Ime, telefon, adresa, recenzije i zahtevi u
panelu su izmisljeni. Ceo sajt je van pretrage.

## Adresa

Repo se zove `demo-tepih-servis`, pa Cloudflare Pages projekat istog imena daje
adresu `https://demo-tepih-servis.pages.dev`. Ta adresa je vec upisana u
`canonical` i `og:url`. Ako se projekat nazove drugacije, ta adresa se menja u
`index.html`, `hvala.html`, `404.html`, `politika-privatnosti.html` i u
`sadrzaj/podaci.json`.

## Putanje su relativne, namerno

Sve putanje do CSS-a, JS-a, slika i fontova su **relativne** (`css/style.css`),
a ne apsolutne od korena domena (`/css/style.css`). Isto vazi i za `url()` u
CSS-u i za linkove medju stranama, koji nose `.html`.

Razlog: demo mora da radi na tri mesta, a apsolutne putanje rade samo na prvom.
- Cloudflare Pages ili bilo koji koren domena
- GitHub Pages, gde sajt sedi u podfolderu `korisnik.github.io/demo-tepih-servis/`
- otvoren duplim klikom iz foldera, bez servera

Provereno u sva tri slucaja. Jedina razlika kod duplog klika: pisma se ne
ucitavaju, jer pretrazivac ne dozvoljava ucitavanje fontova sa `file://`, pa
tekst pada na sistemsko pismo. Sve ostalo radi.

**Na sajtu za klijenta se vraca na apsolutne putanje** (`/css/style.css`) i
adrese bez nastavka (`/politika-privatnosti`), jer taj sajt uvek sedi na korenu
svog domena, a Cloudflare Pages sam skida `.html`. Tako je i u skilu
`sajt-standard`.

## Podizanje

1. Nov privatan repo na GitHubu, ime `demo-tepih-servis`
2. Cloudflare Pages -> Create -> Connect to Git -> taj repo
3. Build komanda prazna, izlazni direktorijum koren (`/`)
4. Nista vise. Nema baze, nema promenljivih, nema tajni.

## Sta je izmisljeno

| Podatak | Vrednost u demou |
|---|---|
| Firma | Tepih Servis Alfa |
| Telefon | 060 000 0000, ne postoji |
| Adresa | Primer ulica 1, 11000 Beograd, ne postoji |
| Mejl | kontakt@example.com |
| Recenzije | tri izmisljene, oznaceno u podnaslovu sekcije |
| Zahtevi u panelu | deset izmisljenih, u `js/admin.js` |
| Logo | nema ga, stoji tekstualni logo da se vidi gde ide klijentov |

Traka na vrhu svake strane kaze da je demo i da su podaci primeri.

## Sta radi, a sta ne radi

**Radi u potpunosti:** sve sekcije, mobilni meni, klizač pre i posle, tabovi u
cenovniku, karusel recenzija, cesta pitanja, provera forme polje po polje,
sazetak gresaka, potvrda posle slanja, panel sa filterima, pretragom, izmenom
statusa, cena i interne beleske.

**Namerno ne radi:**
- forma nista ne salje. Posle provere se prikazuje ista potvrda kao na pravom
  sajtu, uz jasnu napomenu da zahtev nije poslat. Vidi komentar u `js/main.js`.
- panel ne cita iz baze nego iz niza u `js/admin.js`. Izmene rade i vide se
  odmah, ali se gube pri osvezavanju strane.
- panel nije zakljucan, namerno, da prospekt moze da ga vidi.

**Ne postoji u ovom repou:** `functions/` (Cloudflare Pages Functions), `baza/`
(D1 sema i migracije), Turnstile, Resend, Cloudflare Access, `sitemap.xml`.
Sve to se dodaje tek kad se radi sajt za klijenta.

## Van pretrage

`_headers` salje `X-Robots-Tag: noindex, nofollow` na sve adrese, a svaka strana
ima i `<meta name="robots" content="noindex, nofollow">`.

`robots.txt` **namerno ne zabranjuje citanje.** Zabrana bi sprecila crawler da
uopste vidi `noindex`, pa bi adresa mogla da zavrsi u pretrazi bez opisa. Ovako
sme da procita i mora da ne indeksira.

Nema `sitemap.xml`, jer nijedna strana ne treba da ude u pretragu.

## Kako se od demoa pravi sajt za klijenta

1. Nov privatan repo po klijentu, kopira se ovaj sadrzaj
2. `sadrzaj/podaci.json` se popunjava klijentovim podacima. To je jedini izvor
   istine. Svako mesto u HTML-u koje nosi marker `<!-- p:putanja -->` se menja
   po njemu.
3. Klijentov logo u `slike/logo/`, u zaglavlje se vraca blok `<picture>`,
   atribut `data-logo` se menja iz `tekst` u `slika`. Detalji u
   `slike/logo/PROCITAJ.txt`.
4. Klijentove fotografije u `slike/`, u AVIF i WebP, sa vise velicina
5. Izmisljene recenzije se zamenjuju pravim, ili se sekcija izbacuje
6. Traka `.demo-traka` se brise iz sve cetiri strane, a `.potvrda__demo` iz
   `index.html`
7. Vracaju se `functions/`, `baza/`, Turnstile, Resend i Access, pa se forma i
   panel spajaju sa bazom
8. `sitemap.xml` se pravi, `noindex` se skida, `robots.txt` dobija Sitemap red
9. Putanje se vracaju na apsolutne, linkovi na adrese bez `.html`
10. Sve ostalo po skilu `sajt-standard`, ukljucujuci QA liste

## Paketi

Koja sekcija ulazi u koji paket nije odluceno u kodu. Sekcije su pisane tako da
se svaka moze izbaciti bez diranja ostalih: svaka ima svoj kljuc, svoj CSS
prefiks i ne stilizuje nista van sebe. Vidi poglavlje 3 u skilu `sajt-standard`.

Spisak sekcija u demou, redom: zaglavlje, hero, o nama, usluge, garancija,
galerija, kako funkcionise, zasto komora, recenzije, cenovnik sa tabovima,
pre i posle klizac uz formu za zakazivanje, cesta pitanja, podnozje.
Uz to strane `hvala`, `politika-privatnosti`, `404` i panel `/admin`.
