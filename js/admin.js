/* DEMO panel za pracenje zahteva.

   Na pravom sajtu ovaj panel cita zahteve sa /admin/api/zahtevi i upisuje
   izmene na /admin/api/izmeni. Iza toga stoje Cloudflare Pages Functions i
   D1 baza, a ceo panel je zakljucan Cloudflare Access-om, sa prijavom preko
   koda koji stize na mejl.

   U demou nema ni servera ni baze ni prijave. Zahtevi ispod su izmisljeni i
   zive samo u pretrazivacu. Izmene rade i vide se odmah, ali se gube kad se
   strana osvezi. Sve ostalo izgleda i radi isto kao na pravom panelu. */

(function () {
  "use strict";

  var STATUSI = [
    "nov", "pozvan", "zakazan", "preuzet", "u obradi",
    "spreman", "isporucen", "naplacen", "otkazan"
  ];

  var IMENA_USLUGA = {
    "masinsko-pranje-tepiha": "Mašinsko pranje tepiha",
    "dubinsko-pranje-namestaja": "Dubinsko pranje nameštaja",
    "dubinsko-pranje-vozila": "Dubinsko pranje vozila",
    "bebi-program": "Bebi program"
  };

  var IMENA_TERMINA = {
    "bilo-koji": "Bilo koji termin",
    "08-12": "08h - 12h",
    "12-16": "12h - 16h",
    "16-20": "16h - 20h"
  };

  var GRAD = "Beograd";

  /* ---------- izmisljeni zahtevi ---------- */

  function pre(sati) {
    return new Date(Date.now() - sati * 3600 * 1000).toISOString();
  }
  function za(dana) {
    return new Date(Date.now() + dana * 86400 * 1000).toISOString().slice(0, 10);
  }

  var ZAHTEVI = [
    { id: 112, kreiran: pre(1),   ime: "Marko M.",   telefon: "060 000 0011", adresa: "Primer ulica 12, stan 4",
      usluge: ["masinsko-pranje-tepiha"], zeljeni_datum: za(2), termin: "08-12",
      napomena: "Dva tepiha, jedan veliki iz dnevne sobe. Zgrada bez lifta, treći sprat.",
      status: "nov", interna_napomena: "", cena_procena: null, cena_konacna: null },

    { id: 111, kreiran: pre(3),   ime: "Jelena P.",  telefon: "060 000 0012", adresa: "Bulevar primer 44",
      usluge: ["masinsko-pranje-tepiha", "bebi-program"], zeljeni_datum: za(2), termin: "16-20",
      napomena: "Beba u kući, molim bez jakih sredstava.",
      status: "nov", interna_napomena: "", cena_procena: null, cena_konacna: null },

    { id: 110, kreiran: pre(6),   ime: "Nenad S.",   telefon: "060 000 0013", adresa: "Primer trg 2",
      usluge: ["dubinsko-pranje-namestaja"], zeljeni_datum: za(3), termin: "12-16",
      napomena: "Trosed i dve fotelje.",
      status: "pozvan", interna_napomena: "Javiti se ponovo posle 17h.", cena_procena: 4800, cena_konacna: null },

    { id: 109, kreiran: pre(22),  ime: "Ana V.",     telefon: "060 000 0014", adresa: "Primer ulica 7",
      usluge: ["masinsko-pranje-tepiha"], zeljeni_datum: za(1), termin: "08-12",
      napomena: "", status: "zakazan", interna_napomena: "Preuzimanje sutra ujutru.", cena_procena: 3600, cena_konacna: null },

    { id: 108, kreiran: pre(30),  ime: "Dušan K.",   telefon: "060 000 0015", adresa: "Primer bulevar 18",
      usluge: ["dubinsko-pranje-vozila"], zeljeni_datum: "", termin: "bilo-koji",
      napomena: "Kombi, sedišta i tepisi.",
      status: "preuzet", interna_napomena: "", cena_procena: 6000, cena_konacna: null },

    { id: 107, kreiran: pre(48),  ime: "Milica R.",  telefon: "060 000 0016", adresa: "Primer ulica 31",
      usluge: ["masinsko-pranje-tepiha"], zeljeni_datum: "", termin: "12-16",
      napomena: "Tri staze i jedan vuneni tepih.",
      status: "u obradi", interna_napomena: "Vuneni ide na blaži program.", cena_procena: 5200, cena_konacna: null },

    { id: 106, kreiran: pre(72),  ime: "Stefan J.",  telefon: "060 000 0017", adresa: "Primer ulica 5",
      usluge: ["masinsko-pranje-tepiha", "dubinsko-pranje-namestaja"], zeljeni_datum: "", termin: "16-20",
      napomena: "", status: "spreman", interna_napomena: "Zvati za dostavu.", cena_procena: 7400, cena_konacna: null },

    { id: 105, kreiran: pre(96),  ime: "Tijana L.",  telefon: "060 000 0018", adresa: "Primer trg 9",
      usluge: ["bebi-program"], zeljeni_datum: "", termin: "bilo-koji",
      napomena: "Dečja soba, tepih i dušek.",
      status: "isporucen", interna_napomena: "", cena_procena: 0, cena_konacna: 0 },

    { id: 104, kreiran: pre(120), ime: "Vladimir Đ.", telefon: "060 000 0019", adresa: "Primer ulica 22",
      usluge: ["masinsko-pranje-tepiha"], zeljeni_datum: "", termin: "08-12",
      napomena: "", status: "naplacen", interna_napomena: "Plaćeno gotovinom pri dostavi.", cena_procena: 3200, cena_konacna: 3200 },

    { id: 103, kreiran: pre(168), ime: "Sanja B.",   telefon: "060 000 0020", adresa: "Primer bulevar 60",
      usluge: ["dubinsko-pranje-namestaja"], zeljeni_datum: "", termin: "12-16",
      napomena: "Otkazala, kupila novu garnituru.",
      status: "otkazan", interna_napomena: "", cena_procena: null, cena_konacna: null }
  ];

  var spisak = document.getElementById("spisak");
  var stanje = document.getElementById("stanje");
  var filteri = document.getElementById("filteri");
  var trazi = document.getElementById("trazi");
  var osvezi = document.getElementById("osvezi");
  var korisnik = document.getElementById("korisnik");
  var predlozak = document.getElementById("predlozak-zahteva");

  var izabranStatus = "svi";
  var tajmerPretrage = null;
  var otvoreni = {};

  /* ---------- ucitavanje, iz niza umesto sa servera ---------- */

  function poStatusu() {
    var b = {};
    ZAHTEVI.forEach(function (z) { b[z.status] = (b[z.status] || 0) + 1; });
    return b;
  }

  function filtrirani() {
    var q = trazi.value.trim().toLowerCase();
    return ZAHTEVI.filter(function (z) {
      if (izabranStatus !== "svi" && z.status !== izabranStatus) return false;
      if (!q) return true;
      return (z.ime + " " + z.telefon + " " + z.adresa).toLowerCase().indexOf(q) !== -1;
    });
  }

  function ucitaj() {
    if (korisnik) korisnik.textContent = "demo prikaz";
    nacrtajFiltere(poStatusu(), ZAHTEVI.length);
    nacrtajSpisak(filtrirani());
  }

  function nacrtajFiltere(brojevi, ukupno) {
    if (filteri.childElementCount) {
      Array.prototype.forEach.call(filteri.children, function (d) {
        var s = d.dataset.status;
        d.querySelector("em").textContent = s === "svi" ? ukupno : (brojevi[s] || 0);
        d.setAttribute("aria-pressed", String(s === izabranStatus));
      });
      return;
    }
    ["svi"].concat(STATUSI).forEach(function (s) {
      var d = document.createElement("button");
      d.type = "button";
      d.className = "panel__filter";
      d.dataset.status = s;
      d.setAttribute("aria-pressed", String(s === izabranStatus));
      d.appendChild(document.createTextNode(s === "svi" ? "Svi" : veliko(s)));
      var e = document.createElement("em");
      e.textContent = s === "svi" ? ukupno : (brojevi[s] || 0);
      d.appendChild(e);
      d.addEventListener("click", function () {
        izabranStatus = s;
        ucitaj();
      });
      filteri.appendChild(d);
    });
  }

  function nacrtajSpisak(zahtevi) {
    spisak.innerHTML = "";
    if (!zahtevi.length) {
      stanje.hidden = false;
      stanje.textContent = trazi.value.trim()
        ? "Nema zahteva koji odgovaraju pretrazi."
        : "Nema zahteva u ovom statusu.";
      return;
    }
    stanje.hidden = true;
    zahtevi.forEach(function (z) { spisak.appendChild(nacrtajZahtev(z)); });
  }

  /* ---------- jedan zahtev ---------- */

  function nacrtajZahtev(z) {
    var cvor = predlozak.content.cloneNode(true);
    var stavka = cvor.querySelector(".zahtev");
    if (z.status === "nov") stavka.classList.add("zahtev--nov");

    var vrh = cvor.querySelector(".zahtev__vrh");
    var telo = cvor.querySelector(".zahtev__telo");

    cvor.querySelector(".zahtev__ime").textContent = z.ime;

    var oznaka = cvor.querySelector(".oznaka-status");
    oznaka.textContent = z.status;
    oznaka.dataset.status = z.status;

    cvor.querySelector(".zahtev__stiglo").textContent = vreme(z.kreiran);
    cvor.querySelector(".zahtev__usluge").textContent = kratkeUsluge(z.usluge);

    var tel = cvor.querySelector(".zahtev__telefon");
    tel.textContent = z.telefon;
    tel.href = "tel:" + z.telefon.replace(/[^+0-9]/g, "");

    var adr = cvor.querySelector(".zahtev__adresa");
    adr.textContent = z.adresa;
    adr.href = "https://www.google.com/maps/search/?api=1&query=" +
               encodeURIComponent(z.adresa + ", " + GRAD);

    cvor.querySelector(".zahtev__termin").textContent =
      (z.zeljeni_datum ? datum(z.zeljeni_datum) + ", " : "Bez izbora datuma, ") +
      (IMENA_TERMINA[z.termin] || z.termin);

    cvor.querySelector(".zahtev__usluge-pun").textContent =
      z.usluge.map(function (u) { return IMENA_USLUGA[u] || u; }).join(", ") || "nije navedeno";

    if (z.napomena) {
      cvor.querySelector(".zahtev__napomena").textContent = z.napomena;
    } else {
      cvor.querySelector(".zahtev__napomena-oznaka").remove();
      cvor.querySelector(".zahtev__napomena").remove();
    }

    var izbor = cvor.querySelector(".zahtev__status");
    STATUSI.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s;
      o.textContent = veliko(s);
      if (s === z.status) o.selected = true;
      izbor.appendChild(o);
    });

    cvor.querySelector(".zahtev__procena").value = z.cena_procena == null ? "" : z.cena_procena;
    cvor.querySelector(".zahtev__konacna").value = z.cena_konacna == null ? "" : z.cena_konacna;
    cvor.querySelector(".zahtev__beleska").value = z.interna_napomena || "";

    if (otvoreni[z.id]) {
      telo.hidden = false;
      vrh.setAttribute("aria-expanded", "true");
    }

    vrh.addEventListener("click", function () {
      var otvoren = telo.hidden;
      telo.hidden = !otvoren;
      vrh.setAttribute("aria-expanded", String(otvoren));
      if (otvoren) otvoreni[z.id] = true; else delete otvoreni[z.id];
    });

    cvor.querySelector(".zahtev__forma").addEventListener("submit", function (e) {
      e.preventDefault();
      sacuvaj(z, this, stavka, oznaka);
    });

    return cvor;
  }

  /* Na pravom panelu ovde ide POST na /admin/api/izmeni. U demou se menja
     zapis u nizu, pa se osvezavaju brojevi uz filtere. */
  function sacuvaj(z, forma, stavka, oznaka) {
    var dugme = forma.querySelector(".zahtev__sacuvaj");
    var poruka = forma.querySelector(".zahtev__poruka");
    var stariTekst = dugme.textContent;
    dugme.disabled = true;
    dugme.textContent = "Čuvam...";
    poruka.textContent = "";
    poruka.removeAttribute("data-vrsta");

    setTimeout(function () {
      z.status = forma.querySelector(".zahtev__status").value;
      z.interna_napomena = forma.querySelector(".zahtev__beleska").value;
      z.cena_procena = broj(forma.querySelector(".zahtev__procena").value);
      z.cena_konacna = broj(forma.querySelector(".zahtev__konacna").value);

      oznaka.textContent = z.status;
      oznaka.dataset.status = z.status;
      stavka.classList.toggle("zahtev--nov", z.status === "nov");
      nacrtajFiltere(poStatusu(), ZAHTEVI.length);

      dugme.disabled = false;
      dugme.textContent = stariTekst;
      poruka.textContent = "Sačuvano (demo)";
      setTimeout(function () { poruka.textContent = ""; }, 2500);
    }, 400);
  }

  /* ---------- sitno ---------- */

  function broj(v) {
    var t = String(v).trim().replace(",", ".");
    if (t === "") return null;
    var n = Number(t);
    return isFinite(n) && n >= 0 ? n : null;
  }

  function veliko(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function kratkeUsluge(u) {
    if (!u || !u.length) return "";
    if (u.length === 1) return IMENA_USLUGA[u[0]] || u[0];
    return (IMENA_USLUGA[u[0]] || u[0]) + " i još " + (u.length - 1);
  }

  function vreme(iso) {
    try {
      return new Date(iso).toLocaleString("sr-RS", {
        timeZone: "Europe/Belgrade",
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch (e) { return iso; }
  }

  function datum(d) {
    try {
      var delovi = d.split("-");
      return delovi[2] + "." + delovi[1] + "." + delovi[0] + ".";
    } catch (e) { return d; }
  }

  /* ---------- pokretanje ---------- */

  osvezi.addEventListener("click", ucitaj);

  trazi.addEventListener("input", function () {
    if (tajmerPretrage) clearTimeout(tajmerPretrage);
    tajmerPretrage = setTimeout(ucitaj, 250);
  });

  ucitaj();
})();
