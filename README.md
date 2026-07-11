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

## GitHub Pages

Vite izmanto relatīvo bāzes ceļu, tāpēc būvējums darbojas jebkura repozitorija apakšceļā. Darbplūsma `.github/workflows/deploy.yml` pārbauda, būvē un publicē lietotni pēc izmaiņu nosūtīšanas uz `main` vai `master`. Repozitorija iestatījumos sadaļā **Pages** kā avotu izvēlieties **GitHub Actions**.

Profili un progress tiek glabāti tikai lietotāja pārlūka `localStorage`. Lietotne neizmanto serveri, reklāmas, izsekošanu vai pirkumus.
