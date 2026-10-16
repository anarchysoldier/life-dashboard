# Life Dashboard — projekt s više datoteka

Aplikacija je razdvojena iz postojeće HTML verzije. Nisu potrebni npm, instalacija paketa ni izgradnja projekta.

## Datoteke

- `index.html` — osnovni prikaz stranice i redoslijed učitavanja skripti.
- `assets/css/app.css` — svi postojeći stilovi, u izvornom redoslijedu.
- `assets/js/core/` — stanje aplikacije, lokalno spremanje i početni prikaz.
- `assets/js/modules/` — zadaci, kupovina, bilješke, kalendar, aktivnosti i sigurnosne kopije.
- `assets/js/ui/` — pretraga, sat, obrasci, kartice i ostale kontrole.
- `assets/js/auth/` — prijava preko Supabasea.
- `assets/js/integrations/` — Google Calendar i postojeći lokalni Notion uvoz.

## Objavljivanje na postojećem GitHub Pagesu

1. U postojećem dashboardu izvezi sigurnosnu kopiju podataka.
2. Preuzmi ZIP i u Windowsu klikni desnom tipkom → Izdvoji sve.
3. Otvori izdvojenu mapu `life-dashboard`. U njoj su `index.html`, mapa `assets` i ove upute.
4. Otvori svoj GitHub repozitorij `life-dashboard` i njegovu glavnu mapu u kojoj je postojeći `index.html`.
5. Preuzmi stari `index.html` kao rezervnu kopiju.
6. Klikni Add file → Upload files. Povuci novi `index.html` i cijelu mapu `assets` iz izdvojene mape. Možeš dodati i README.md.
7. Provjeri da su u repozitoriju putanje `index.html` i `assets/css/app.css`, a ne `life-dashboard/index.html` unutar dodatne podmape.
8. Potvrdi prijenos tipkom Commit changes. Ako Pages koristi drugu granu ili mapu, prenesi u tu postojeću lokaciju.
9. Pričekaj završetak objave pa otvori istu adresu dashboarda i pritisni Ctrl + F5.
10. Provjeri prijavu, kalendar, zadatke i bilješke. Dodaj probni zadatak i osvježi stranicu radi provjere spremanja.

Supabase Edge funkcija koju si već postavio ostaje nepromijenjena. Nemoj ovaj projekt lijepiti u Edge Functions ili SQL Editor.

## Lokalno otvaranje

Drži index.html i assets zajedno. Dvoklik na index.html može se koristiti za pregled, ali prijava, Google povratne adrese i mrežne integracije provjeravaju se na postojećoj GitHub Pages adresi. Lokalna datoteka ne koristi istu pohranu kao objavljena stranica.

## Podaci i održavanje

Ključ `life-dashboard-v1-demo` ostaje isti. Zamjena datoteka na istoj web adresi ne migrira niti briše lokalne podatke. Ne briši podatke preglednika. Lokalni podaci ostaju nešifrirani.

JavaScript datoteke su klasične skripte, učitane u istom redoslijedu kao izvorni blokovi. Ne dodavati async, defer ili type="module" pojedinim datotekama bez prilagodbe ovisnosti. Postojeće omotače funkcija zadržali smo: ovo je razdvajanje datoteka, a ne dovršena konsolidacija arhitekture. Buduće izmjene mogu se raditi postupno po funkcionalnostima.

Supabase biblioteka i dalje se učitava s postojećeg CDN-a. Projekt ne sadrži service_role ključ, Google client secret ni korisničke tokene.
