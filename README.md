# Ciparu dārzs

Latviešu valodas atmiņas un agrīnās matemātikas spēļu lietotne bērniem vecumā no 2 līdz 6 gadiem.

## Izstrāde

```bash
npm install
npm run dev
```

Pārbaudes un produkcijas būvējums:

```bash
npm test
npm run build
```

## Dizains

`public/shared/` ir **KidMindPath dizaina sistēmas kopija**, nevis šī repozitorija
pašas kods: Fredoka un Nunito fonti, kā arī kopīgie krāsu, tipogrāfijas,
atstarpju, noapaļojumu un ēnu marķieri, ar kuriem visas sešas kidmindpath.com
lapas izskatās kā viena ģimene.

Oriģināls atrodas `Hifistereo/Hifistereo.github.io` mapē `shared/` — tur arī
aprakstīts, kā sinhronizēt izmaiņas. Labo tur, nevis šeit: vietēja izmaiņa tiek
klusi pārrakstīta nākamajā sinhronizācijā.

`src/styles.css` savus mainīgos (`--ink`, `--cream`, `--green`, `--line`)
norāda uz kopīgajiem, tāpēc neviena komponente nebija jāpārraksta. Divas lietas,
ko der atcerēties:

- **Secība ir svarīga.** `index.html` `shared/` jāielādē pirms lietotnes CSS,
  citādi katrs `var(--kmp-*)` atrisinās uz neko un lietotne zaudē krāsas,
  atstarpes un fontus.
- **Vite kopē `public/` bez izmaiņām**, tāpēc `dist/shared/` rodas pats no sevis.
  Būvējuma laikā Vite brīdina, ka `./shared/…` neeksistē — tā ir gaidīta uzvedība
  `public/` failiem, kas tiek atrisināti izpildlaikā.

Fredoka ir pieejama svaros 400/500/600/700 un ne smagākos. Ja kāds virsraksts
tiek uzstādīts uz 800, pārlūks to imitē, un rezultāts izskatās nedaudz greizi
un atšķirīgi katrā pārlūkā.

## GitHub Pages

Vite izmanto relatīvo bāzes ceļu, tāpēc būvējums darbojas jebkura repozitorija apakšceļā. Darbplūsma `.github/workflows/deploy.yml` pārbauda, būvē un publicē lietotni pēc izmaiņu nosūtīšanas uz `main` vai `master`. Repozitorija iestatījumos sadaļā **Pages** kā avotu izvēlieties **GitHub Actions**.

Profili un progress tiek glabāti tikai lietotāja pārlūka `localStorage`. Lietotne neizmanto serveri, reklāmas, izsekošanu vai pirkumus.
