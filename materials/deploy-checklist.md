# Digital Materials + Deploy Checklist

## Před každým workshopem

- `cd dashboard && npm run lint`
- `cd dashboard && npm run build`
- ověř `/admin`
- ověř reset instance na správný workshop template
- ověř, že `/api/agenda`, `/api/teams`, `/api/challenges`, `/api/rotation` vrací data
- ověř workshop skill soubory

## Na místě

- otevři dashboard na telefonu
- otevři dashboard na projekci
- ověř, že admin panel je dostupný
- připrav monitoring registry nebo fallback manuální režim

## Pokud deploy zlobí

- použij lokální běh jako fallback
- workshop skill a markdown obsah jsou stále použitelné i bez veřejného deploye
