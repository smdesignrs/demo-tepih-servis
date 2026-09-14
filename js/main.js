/* Tepih Servis Alfa, DEMO
   Sav JavaScript sajta, bez biblioteka.

   Pisano po sekcijama: jedna funkcija po sekciji, imenovana kljucem sekcije.
   Nijedan tekst sadrzaja ne stoji ovde, sve dolazi iz HTML-a.

   Razlika u odnosu na pravi sajt: slanje forme nista ne salje, jer demo nema
   server ni bazu. Vidi komentar kod slanja forme. */

(function () {
  "use strict";

  /* ---------- zaglavlje: mobilni meni ---------- */
  function zaglavlje() {
    var dugme = document.querySelector(".hamburger");
    var meni = document.getElementById("meni");
    if (!dugme || !meni) return;

    function zatvori(vratiFokus) {
      meni.dataset.otvoren = "ne";
      dugme.setAttribute("aria-expanded", "false");
      dugme.setAttribute("aria-label", "Otvori meni");
      if (vratiFokus) dugme.focus();
    }

    dugme.addEventListener("click", function () {
      var otvoren = meni.dataset.otvoren === "da";
      meni.dataset.otvoren = otvoren ? "ne" : "da";
      dugme.setAttribute("aria-expanded", String(!otvoren));
      dugme.setAttribute("aria-label", otvoren ? "Otvori meni" : "Zatvori meni");
      if (!otvoren) {
        var prvi = meni.querySelector("a");
        if (prvi) prvi.focus();
      }
    });

    meni.addEventListener("click", function (e) {
      if (e.target.closest("a")) zatvori(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && meni.dataset.otvoren === "da") zatvori(true);
    });

    // fokus ostaje unutar menija dok je otvoren
    meni.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || meni.dataset.otvoren !== "da") return;
      var stavke = meni.querySelectorAll("a, button");
      if (!stavke.length) return;
      var prvi = stavke[0], zadnji = stavke[stavke.length - 1];
      if (e.shiftKey && document.activeElement === prvi) { e.preventDefault(); zadnji.focus(); }
      else if (!e.shiftKey && document.activeElement === zadnji) { e.preventDefault(); prvi.focus(); }
    });
  }

  /* ---------- navigacija: aria-current prema vidljivoj sekciji ---------- */
  function navigacija() {
    var linkovi = document.querySelectorAll(".zaglavlje__link");
    if (!linkovi.length || !("IntersectionObserver" in window)) return;

    var mapa = {};
    linkovi.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sek = document.getElementById(id);
      if (sek) mapa[id] = a;
    });

    var posmatrac = new IntersectionObserver(function (redovi) {
      redovi.forEach(function (r) {
        var a = mapa[r.target.id];
        if (!a) return;
        if (r.isIntersecting) {
          linkovi.forEach(function (x) { x.removeAttribute("aria-current"); });
          a.setAttribute("aria-current", "page");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    Object.keys(mapa).forEach(function (id) {
      posmatrac.observe(document.getElementById(id));
    });
  }

  /* ---------- galerija: uvećanje slike ---------- */
  function galerija() {
    var lightbox = document.getElementById("lightbox");
    var slika = document.getElementById("lightbox-slika");
    var zatvori = document.getElementById("lightbox-zatvori");
    if (!lightbox || !slika || !lightbox.showModal) return;

    document.querySelectorAll(".galerija__zumiraj").forEach(function (dugme) {
      dugme.addEventListener("click", function () {
        var img = dugme.closest(".galerija__stavka").querySelector("img");
        if (!img) return;
        slika.src = img.currentSrc || img.src;
        slika.alt = img.alt;
        lightbox.showModal();
      });
    });

    if (zatvori) zatvori.addEventListener("click", function () { lightbox.close(); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) lightbox.close();
    });
  }

  /* ---------- utisci: karusel recenzija ---------- */
  function utisci() {
    var traka = document.getElementById("utisci-traka");
    var strelice = document.getElementById("utisci-strelice");
    var nazad = document.getElementById("utisci-nazad");
    var napred = document.getElementById("utisci-napred");
    if (!traka || !strelice || !nazad || !napred) return;

    var mirno = window.matchMedia("(prefers-reduced-motion: reduce)");

    function korak() {
      var prva = traka.querySelector(".utisci__stavka");
      if (!prva) return traka.clientWidth;
      var razmak = parseFloat(getComputedStyle(traka).columnGap) || 0;
      return prva.getBoundingClientRect().width + razmak;
    }

    /* Visina trake se ne dira. Sve kartice su iste visine iz CSS-a, pa strelice
       ispod uvek stoje na istom mestu i drugi klik pogadja isto dugme. */
    function osvezi() {
      var ima = traka.scrollWidth > traka.clientWidth + 1;
      strelice.hidden = !ima;
      if (!ima) return;
      var kraj = traka.scrollWidth - traka.clientWidth;
      nazad.disabled = traka.scrollLeft <= 1;
      napred.disabled = traka.scrollLeft >= kraj - 1;
    }

    function pomeri(smer) {
      traka.scrollBy({
        left: smer * korak(),
        behavior: mirno.matches ? "auto" : "smooth"
      });
    }

    nazad.addEventListener("click", function () { pomeri(-1); });
    napred.addEventListener("click", function () { pomeri(1); });
    traka.addEventListener("scroll", function () {
      window.requestAnimationFrame(osvezi);
    }, { passive: true });

    if ("ResizeObserver" in window) {
      // Samo promena sirine menja koliko kartica staje, visina nije razlog
      // za ponovno racunanje.
      var poslednjaSirina = 0;
      new ResizeObserver(function (redovi) {
        var s = Math.round(redovi[0].contentRect.width);
        if (s === poslednjaSirina) return;
        poslednjaSirina = s;
        osvezi();
      }).observe(traka);
    } else {
      window.addEventListener("resize", osvezi);
    }
    osvezi();
  }

  /* ---------- cenovnik: tabovi ---------- */
  function cenovnik() {
    var tabovi = Array.prototype.slice.call(document.querySelectorAll(".cenovnik__tab"));
    if (!tabovi.length) return;

    function prikazi(tab) {
      tabovi.forEach(function (t) {
        var aktivan = t === tab;
        t.setAttribute("aria-selected", String(aktivan));
        t.tabIndex = aktivan ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !aktivan;
      });
    }

    tabovi.forEach(function (tab, i) {
      tab.addEventListener("click", function () { prikazi(tab); });
      tab.addEventListener("keydown", function (e) {
        var novi = null;
        if (e.key === "ArrowRight") novi = tabovi[(i + 1) % tabovi.length];
        if (e.key === "ArrowLeft") novi = tabovi[(i - 1 + tabovi.length) % tabovi.length];
        if (e.key === "Home") novi = tabovi[0];
        if (e.key === "End") novi = tabovi[tabovi.length - 1];
        if (novi) { e.preventDefault(); prikazi(novi); novi.focus(); }
      });
    });
  }

  /* ---------- zakazi: klizač pre i posle ---------- */
  function uporedi() {
    var okvir = document.getElementById("uporedi");
    if (!okvir) return;
    var klizac = okvir.querySelector(".uporedi__klizac");
    if (!klizac) return;

    function postavi(v) { okvir.style.setProperty("--pozicija", v + "%"); }
    postavi(klizac.value);
    klizac.addEventListener("input", function () { postavi(klizac.value); });
  }

  /* ---------- zakazi: forma ---------- */
  function forma() {
    var f = document.getElementById("forma");
    if (!f) return;

    var dugme = document.getElementById("posalji");
    var blok = document.getElementById("forma-blok");
    var potvrda = document.getElementById("potvrda");
    var ponovo = document.getElementById("ponovo");
    var sazetak = document.getElementById("forma-greske");
    var sazetakLista = document.getElementById("forma-greske-lista");

    function greska(polje, poruka) {
      var el = document.getElementById(polje + "-greska");
      if (el) el.textContent = poruka || "";
      var unos = document.getElementById(polje);
      if (unos) {
        if (poruka) unos.setAttribute("aria-invalid", "true");
        else unos.removeAttribute("aria-invalid");
      }
    }

    function proveri() {
      var greske = [];
      ["ime", "telefon", "adresa", "usluge", "saglasnost"].forEach(function (p) { greska(p, ""); });

      var ime = f.ime.value.trim();
      if (ime.length < 3) { greska("ime", "Unesite ime i prezime."); greske.push(["ime", "Unesite ime i prezime."]); }

      var tel = f.telefon.value.trim();
      if (!/^[+0-9][0-9 ()\/-]{6,}$/.test(tel)) { greska("telefon", "Unesite ispravan broj telefona."); greske.push(["telefon", "Unesite ispravan broj telefona."]); }

      var adr = f.adresa.value.trim();
      if (adr.length < 5) { greska("adresa", "Unesite adresu za preuzimanje."); greske.push(["adresa", "Unesite adresu za preuzimanje."]); }

      var izabrane = f.querySelectorAll('input[name="usluge"]:checked');
      if (!izabrane.length) { greska("usluge", "Izaberite najmanje jednu uslugu."); greske.push(["usluge-greska", "Izaberite najmanje jednu uslugu."]); }
      if (!f.saglasnost.checked) { greska("saglasnost", "Potrebna je saglasnost sa politikom privatnosti."); greske.push(["saglasnost", "Potrebna je saglasnost sa politikom privatnosti."]); }


      // isti prag kao atribut min na polju, prvi slobodan dan je sutra
      var datum = f.datum.value;
      if (datum && f.datum.min && datum < f.datum.min) {
        greska("datum", "Najraniji termin je sutra.");
        greske.push(["datum", "Najraniji termin je sutra."]);
      }
      return greske;
    }

    function prikaziSazetak(greske) {
      if (!sazetak || !sazetakLista) return;
      sazetakLista.innerHTML = "";
      greske.forEach(function (g) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#" + g[0];
        a.textContent = g[1];
        li.appendChild(a);
        sazetakLista.appendChild(li);
      });
      sazetak.hidden = greske.length === 0;
      if (greske.length) sazetak.focus();
    }

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var greske = proveri();
      prikaziSazetak(greske);
      if (greske.length) return;

      dugme.disabled = true;
      var stariTekst = dugme.textContent;
      dugme.textContent = "ŠALJEM...";

      /* DEMO. Na pravom sajtu se ovde salje POST na /api/zahtev, koji prima
         Cloudflare Pages Function, upisuje zahtev u D1 bazu i salje mejl
         obavestenje. U demou nema servera ni baze, pa se samo prikazuje ista
         potvrda koju bi posetilac video i na pravom sajtu. Kratko cekanje
         postoji da se vidi kako se dugme ponasa dok slanje traje. */
      setTimeout(function () {
        dugme.disabled = false;
        dugme.textContent = stariTekst;
        if (blok) blok.hidden = true;
        if (potvrda) { potvrda.hidden = false; potvrda.focus(); }
      }, 700);
    });

    if (ponovo) {
      ponovo.addEventListener("click", function () {
        f.reset();
        if (sazetak) sazetak.hidden = true;
        if (potvrda) potvrda.hidden = true;
        if (blok) blok.hidden = false;
        dugme.disabled = false;
        dugme.textContent = "ZAKAŽI PREUZIMANJE";
        f.ime.focus();
      });
    }

    // datum ne može biti raniji od sutra
    if (f.datum) {
      var sutra = new Date();
      sutra.setDate(sutra.getDate() + 1);
      f.datum.min = sutra.toISOString().slice(0, 10);
    }
  }

  /* ---------- pitanja: akordeon ---------- */
  function pitanja() {
    document.querySelectorAll(".pitanja__dugme").forEach(function (dugme) {
      dugme.addEventListener("click", function () {
        var otvoren = dugme.getAttribute("aria-expanded") === "true";
        var odgovor = document.getElementById(dugme.getAttribute("aria-controls"));
        dugme.setAttribute("aria-expanded", String(!otvoren));
        var znak = dugme.querySelector(".pitanja__znak");
        if (znak) znak.textContent = otvoren ? "+" : "-";
        if (odgovor) odgovor.hidden = otvoren;
      });
    });
  }

  /* ---------- dugme za vrh ---------- */
  function vrh() {
    var dugme = document.getElementById("vrh");
    if (!dugme) return;
    var prag = 600;
    var skriveno = dugme.hidden;

    // pisanje u DOM samo kad se stanje stvarno menja, ne na svakom pomeraju
    window.addEventListener("scroll", function () {
      var treba = window.scrollY < prag;
      if (treba !== skriveno) {
        skriveno = treba;
        dugme.hidden = treba;
      }
    }, { passive: true });

    dugme.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  zaglavlje();
  navigacija();
  galerija();
  utisci();
  cenovnik();
  uporedi();
  forma();
  pitanja();
  vrh();
})();
