# Czech Style Examples

## Do / Don't

### 1. Instrukce

Do:

- „Otevřete repozitář a nejdřív doplňte `AGENTS.md`.“

Don't:

- „V prvním kroku je vhodné provést vytvoření souboru `AGENTS.md`.“

### 2. Setup

Do:

- „Když se setup sekne, přejděte na Codex App nebo web fallback.“

Don't:

- „V případě komplikací v procesu instalace je možné využít alternativní variantu přístupu.“

### 3. Facilitation

Do:

- „Prvních 10 minut po rotaci jen čtěte a mapujte repo.“

Don't:

- „Po realizaci rotace doporučujeme zahájit aktivitu detailní analýzou repozitáře.“

### 4. Workshop framing

Do:

- „Dnes nejde o to být nejrychlejší. Jde o to předat práci tak, aby ji cizí tým dokázal převzít.“

Don't:

- „Hlavním cílem dnešního dne je maximalizace schopnosti efektivního předávání výstupů mezi týmy.“

### 5. Czech + English

Do:

- „Nejdřív spusťte `/plan`, potom implementujte malý krok a nakonec udělejte `/review`.“

Don't:

- „Nejdříve vytvořte plán, pak proveďte implementaci a následně zrevidujte změnu.“

Poznámka:

Tady je angličtina přirozenější, protože jde o konkrétní commands a workflow terms.

### 6. Technical explanation

Do:

- „Monitoring teď běží jako manuální MVP. Ondřej spustí scan repozitářů a z výsledku připraví intermezzo brief.“

Don't:

- „Monitoring je aktuálně realizován prostřednictvím minimální životaschopné verze manuálního typu.“

### 7. Briefs

Do:

- „Mock data jsou v pořádku, pokud workflow působí realisticky.“

Don't:

- „Použití simulovaných dat je akceptovatelné za předpokladu, že výsledný proces bude působit realisticky.“

### 8. Error / fallback messaging

Do:

- „Pokud vám nefunguje CLI, pokračujte přes App a neztrácejte dalších 20 minut.“

Don't:

- „V případě nefunkčnosti rozhraní příkazové řádky doporučujeme zvážit alternativní postup.“

## Approved English Terms

Tyto výrazy se v textech pro účastníky běžně nechávají v angličtině:

- `prompt`
- `review`
- `workflow`
- `skill`
- `runbook`
- `build`
- `deploy`
- `checkpoint`
- `fallback`
- `handoff`
- `CLI`
- `App`
- `repo`
- `README`
- `AGENTS.md`
- `Done When`

## Usually Better In Czech

Tyto části bývají lepší česky:

- cíle a instrukce
- facilitační věty
- reflexe a uzavírání
- vysvětlení, proč něco děláme
- očekávání a pravidla workshopu

## Rewrite Heuristic

Když text zní moc tvrdě přeloženě, uprav ho takto:

1. zkrať větu
2. vrať české sloveso do aktivního rodu
3. nech technický termín v angličtině
4. zkontroluj, že věta vede k akci

## Slovesné vs jmenné vyjadřování

Nominalizace je nejspolehlivější otisk přeložené nebo AI-generované češtiny. Přepište věty kolem aktivního slovesa – čtenář je zpracuje výrazně rychleji.

### 9. Konfigurace a setup

Do:

- „Nakonfigurujte systém podle `AGENTS.md`."
- „Až nainstalujete Codex, pokračujte podle `setup.md`."

Don't:

- „Provedení konfigurace systému podle `AGENTS.md` je nutné."
- „Po dokončení instalace Codexu dojde k pokračování podle `setup.md`."

### 10. Kontrola a ověření

Do:

- „Po každé změně zkontrolujte repo."
- „Ověřte, že nasazený kód funguje, a teprve potom pokračujte."

Don't:

- „Kontrola stavu repozitáře po každé změně je důležitá."
- „Verifikace funkčnosti nasazeného kódu musí proběhnout před pokračováním."

### 11. Facilitace

Do:

- „Než workshop začne, rozdejte účastníkům tištěné karty."
- „Když se build zasekne, vraťte se k `AGENTS.md` a přepište, co chybí."

Don't:

- „V rámci realizace přípravné fáze workshopu je nutné provést distribuci tištěných karet mezi účastníky."
- „V případě uvíznutí procesu sestavení doporučujeme návrat k `AGENTS.md` za účelem doplnění chybějících informací."

## Typografie – co reviewer hlídá

Tyhle věci řeší deterministický audit (`marvin:copy-editor`, Layer 1), ale znát je má autor i reviewer.

### 12. Nezlomitelná mezera po jednopísmenných předložkách

Do (nezlomitelná mezera `\u00A0`):

- „Nejdřív si přečtěte, co je v\u00A0repu."
- „S\u00A0účastníky proberte, co je v\u00A0`AGENTS.md`."

Don't (běžná mezera):

- „Nejdřív si přečtěte, co je v repu."
- „S účastníky proberte, co je v `AGENTS.md`."

### 13. České uvozovky

Do:

- „Workshop začíná v\u00A09 hodin."

Don't:

- "Workshop začíná v 9 hodin."

### 14. Sentence case v nadpisech

Do:

- `Jak nastavit vývojové prostředí`
- `Co je kontext a proč na něm záleží`

Don't:

- `Jak Nastavit Vývojové Prostředí`
- `Co Je Kontext A Proč Na Něm Záleží`

### 15. Trojtečka jako jeden znak

Do:

- „Počkejte chvíli…"

Don't:

- „Počkejte chvíli..."
