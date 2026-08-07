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
pašas kods: Quicksand un Nunito fonti, kā arī kopīgie krāsu, tipogrāfijas,
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

Quicksand nomainīja Fredoka, jo Fredoka `latin-ext` apakškopā trūkst gandrīz
visu latviešu garumzīmju. Starpposmā tika izmēģināts arī Baloo 2 — tam
garumzīmes (ā/ē/ī/ū) ir, bet tās vizuāli nav savietotas ar burtu. Quicksand ir
vienīgais no trim, kur latviešu diakritika ir gan pilnīga, gan pareizi novietota.
Pieejama svaros 400/500/600/700 un ne smagākos — ja kāds virsraksts tiek
uzstādīts uz 800, pārlūks to imitē, un rezultāts izskatās nedaudz greizi un
atšķirīgi katrā pārlūkā.

## Kopīgais profils

Ja lietotne tiek atvērta no kidmindpath.com, tā seko bērnam, kurš izvēlēts
sākumlapā: `syncWithHub()` (`src/storage.ts`) sameklē profilu, kura `id` sakrīt
ar kopīgo bērna id, un izvēlas to. Vārds vairs nav jāievada atkārtoti.

Pirmajā reizē uz ierīces, kur jau ir spēlēts, esošais profils tiek **pārņemts**
— tam nomaina `id` un uzliek `linkedToHub` — lai bērns nezaudētu nevienu
zvaigzni. Tas notiek tikai vienu reizi un tikai tad, ja neviens profils vēl nav
piesaistīts, tāpēc otrs bērns nekad nevar pārņemt pirmā progresu.

Ja kopīgā profila nav (piemēram, atverot no `hifistereo.github.io/Memory/`),
`syncWithHub()` neko nedara un lietotnes pašas profilu izvēle darbojas kā agrāk.
Viss `src/kmp.ts` ir rakstīts tā, lai nekad nemestu kļūdu, ja `window.KMP` nav.

Skaņas un kustību iestatījumi, ja tie ir uzstādīti sākumlapā, aizstāj profila
pašas iestatījumus — citādi skaņas izslēgšana šeit tiktu klusi atgriezta atpakaļ
nākamajā renderā.

Pieaugušo skats tagad ir aiz reizināšanas jautājuma. Tas nav drošība — tas ir
tāpēc, ka no turienes var atiestatīt progresu un dzēst profilu.

## GitHub Pages

Vite izmanto relatīvo bāzes ceļu, tāpēc būvējums darbojas jebkura repozitorija apakšceļā. Darbplūsma `.github/workflows/deploy.yml` pārbauda, būvē un publicē lietotni pēc izmaiņu nosūtīšanas uz `main` vai `master`. Repozitorija iestatījumos sadaļā **Pages** kā avotu izvēlieties **GitHub Actions**.

Profili un progress tiek glabāti tikai lietotāja pārlūka `localStorage`. Lietotne neizmanto serveri, reklāmas, izsekošanu vai pirkumus.
