# Czech Reject List

Živý seznam kalků, nominálních řetězů, AI fingerprintů a výplňových sloves, které se nemají objevit ve viditelném českém workshop obsahu. Doplňuje [`content/style-guide.md`](./style-guide.md) a [`content/czech-editorial-review-checklist.md`](./czech-editorial-review-checklist.md).

Tenhle seznam není dogma. Je to datová sada. Když reviewer najde další opakovaný problém, přidá ho sem i s krátkým „Why". Když přijde legitimní výjimka, přidá se ke konkrétní položce jako poznámka.

**Layer 1 je deterministická typografie (ta se řeší ve skriptu).** Tenhle seznam je primárně vstup pro Layer 2 – reject-list hit detection a návrhy přepisů. Reviewer ho může i čistě „grepnout" přes změnu.

## Kalky z angličtiny

| Vyhnout se | Preferovat | Why |
|---|---|---|
| `v rámci čehosi` | `při X`, `v X`, `jako součást X`, často úplně vynechat | Nejčastější kalk z anglického „within / as part of". V autorské češtině třikrát méně častý než v překladu. |
| `na denní bázi` | `každý den`, `denně`, `pravidelně` | Doslovný překlad „on a daily basis". V češtině vždy neohrabaný. |
| `na konci dne` | `nakonec`, `v konečném důsledku`, `výsledek je` | Kalk „at the end of the day" ve významu „to hlavní je". Nic se nedokončuje na konci dne. |
| `je to o tom, že` | `jde o to, že`, `podstatou je`, `základ je` | Kalk „it's about". V češtině zní vágně a zaklínačsky. |
| `je nutné / je důležité / je třeba + infinitiv` | přímý imperativ (`udělejte`, `spusťte`, `ověřte`) | Kalk „it is important/necessary to". Workshop má být akční – jdeme rovnou k činnosti. |
| `dochází k + podstatné jméno` | slovesná vazba (`data se načítají`, místo `dochází k načítání dat`) | Nominalizace, která se v překladu plodí sama. Viz sekce Nominální řetězy. |
| `s cílem + infinitiv / s cílem maximalizace` | `aby`, `pro`, vynechat | Korporátní otisk. Žádný workshop nemá „cíl maximalizace". |
| `za účelem + podstatné jméno` | `aby`, vynechat | Totéž, knižní a zbytečné. |
| `v případě, že` | `když`, `pokud` | Těžkopádná vazba. Čeština má krátké spojky – používejte je. |
| `v souvislosti s` | `kvůli`, `k`, `u`, restrukturalizace věty | Výplň. Skoro vždy se dá odstranit bez ztráty významu. |
| `proaktivně` | vynechat, nebo být konkrétní (`dopředu`, `včas`) | Prázdné slovo. Když něco děláte proaktivně, prostě to děláte. |
| `poskytnout podporu` | `pomoct`, `podpořit` | Nominalizovaná verze jednoslovného slovesa. |
| `zajistit, aby` | `dbát na to, aby`, často restrukturalizace | V překladech přebujelé. Zkuste říct větu bez něj. |
| `ze strany + osoba` | ta osoba jako podmět (`ze strany uživatelů` → `uživatelé`) | Kalk pasivní angličtiny. Česká věta preferuje aktivní podmět. |
| `s ohledem na` | `kvůli`, `pro`, `protože`, `u` | Výplň. |
| `v kontextu + čeho` | `při`, `v`, vynechat | Slovo „kontext" v textu o kontextu je v pořádku. Jako výplňová vazba ne. |
| `jedná se o` | `je to`, vynechat | „Jedná se o workshop" → „Je to workshop" / „Workshop je…". |
| `tvoří součást` | `patří do`, `je součástí`, `je v` | Knižní varianta, kterou AI ráda generuje. |

## Nominální řetězy (slovesné vs jmenné vyjadřování)

Nominalizace – transformace sloves na `-ní`, `-ost`, `-ace` podstatná jména – je **nejspolehlivější otisk přeložené nebo AI-generované češtiny**. Čeština je synteticky sloveso-centrická: čtenář zpracovává věty s aktivním slovesem výrazně rychleji než věty, kde slovesnou informaci nese řetěz podstatných jmen.

Základní test: když dokážete nahradit podstatné jméno vedlejší větou s `aby`, `když`, `jak` nebo `že`, udělejte to.

| Nominální styl (vyhnout) | Slovesný styl (preferovat) |
|---|---|
| `Provedení konfigurace systému je nutné.` | `Nakonfigurujte systém.` |
| `Implementace řešení problému` | `Jak problém vyřešit` |
| `Dochází k načítání dat.` | `Data se načítají.` |
| `Zajištění správného fungování je důležité.` | `Ať to funguje správně.` |
| `Po dokončení instalace dojde k restartu.` | `Až nainstalujete, systém se restartuje.` |
| `Kontrola stavu repozitáře po každé změně` | `Po každé změně zkontrolujte repo` |
| `Správce konfigurace nastavení prostředí` | (přestavět celou větu – nominální řetěz dlouhý tři články je vždy špatně) |
| `V rámci realizace přípravné fáze workshopu` | `Než workshop začne` |
| `Verifikace funkčnosti nasazeného kódu` | `Ověřte, že nasazený kód funguje` |

**Signál k přepsání:** jakmile vidíte věty, kde jsou tři a více za sebou jdoucí `-ní`/`-ost`/`-ace` podstatná jména v genitivu (`správa konfigurace nastavení`), přestavte větu kolem aktivního slovesa.

## AI-generated fingerprints

Vzory, které se v LLM-generované nebo strojově překládané češtině kupí. Každý jednotlivě může být legitimní – ale když jich reviewer v jednom odstavci vidí tři a víc, je to signál, že odstavec potřebuje přepsat od nuly (ne uhladit).

| Vzor | Proč je to signál | Preferovat |
|---|---|---|
| `přičemž` jako univerzální spojka | Nadužívané jako překlad anglického participia („while doing X"). Autorská čeština střídá `a`, novou větu, pomlčku. | `a`, tečka + nová věta, pomlčka s mezerami |
| `nicméně` / `avšak` / `přesto` na začátku každé protikladné věty | Knižní otisk, který se v živé češtině střídá s `ale` nebo s restrukturalizací. | `ale`, `jenže`, přestavba věty |
| `být + trpné příčestí` jako výchozí pasivum (`bylo provedeno`, `je zajišťováno`) | Čeština používá pasivum – ale střídá ho s reflexivním `se` a s aktivem. LLM to neumí vyvážit. | aktivní věta s podmětem, nebo `se`-reflexivum |
| `pro + abstraktní podstatné jméno` jako kalk anglického „for" | `Pro lepší výsledky…`, `Pro úspěšnou instalaci…` – typicky překlad. | `abyste dosáhli`, `při instalaci`, `aby to fungovalo` |
| uniformní délka vět v celém odstavci | Lidský autor přirozeně střídá délky. Metronomický rytmus je otisk generovaného textu. | Spoken check – pokud zní jako pochodovka, přepište |
| podstatné jméno na konci věty místo slovesa (`… provádí kontrolu.`) | Nominální závěr oslabuje akci. | `… kontroluje.` |
| `ve smyslu + genitiv` | Překladatelská vycpávka. | konkrétní předložka (`jako`, `podle`, vynechat) |
| `z pohledu + podstatné jméno` | Nadužívané, obvykle prázdné. | konkrétní formulace (`pro autora`, `když píšete`) |
| víceúrovňové vnořené vedlejší věty (4+ úrovní) | Syntaktická hustota, kterou lidský autor záměrně rozdělí. | rozdělit na dvě až tři věty |
| nadměrný výskyt `se` (`se zdá, že se jedná o systém, který se používá`) | Reflexivní řetěz je otisk pasivního překladu. | přepsat do aktiva |

## Výplňová slovesa (nadužívaná)

Slovesa, která se v AI/překladovém textu objevují jako univerzální náhrada za konkrétní činnost. Samy o sobě nejsou špatná, ale když je reviewer vidí opakovaně, je to signál, že text je abstraktní tam, kde má být konkrétní.

| Slabá volba | Preferovat podle situace |
|---|---|
| `realizovat` | `udělat`, `provést`, `spustit`, `zavést`, `uskutečnit` – nebo konkrétní sloveso |
| `implementovat` | `zavést`, `napsat`, `vytvořit`, `přidat`, `spustit` – `implementovat` nechte pro technickou implementaci v úzkém smyslu |
| `poskytnout` | `dát`, `ukázat`, `nabídnout`, `umožnit`, `vystavit` |
| `zajistit` | `postarat se o`, `udělat`, přestavba věty (`zajistit, aby to fungovalo` → `ať to funguje`) |
| `provést` | konkrétní sloveso (`spustit`, `projít`, `udělat`, `přejít`) |
| `disponovat` | `mít` |
| `umožnit + podstatné jméno` | `umožnit + infinitiv` nebo konkrétní sloveso (`umožnit přístup` → `dovolit přístup` / `pustit dovnitř`) |
| `být schopen + infinitiv` | `umět`, `moct`, `zvládnout` |
| `využít` / `využívat` | `použít`, `vzít`, `sáhnout po` – `využít` jen tam, kde jde opravdu o efektivní použití zdroje |

## Jak se tenhle seznam používá

1. **Autor** si ho projde při self-passu před review. Najde ve svém draftu výskyty a zvažuje, jestli je ponechání záměrné.
2. **Human reviewer** ho používá jako pomůcku – ne kontrolní seznam. Layer 2 rozhodnutí (zda navrhovaný přepis opravdu zlepšuje větu) zůstává na člověku.
3. **Copy-editor skill** (Heart of Gold `marvin:copy-editor`) tenhle seznam čte jako data. Layer 1 (typografie) je deterministická a blokující. Reject-list hity jsou Layer 2 – agent navrhuje, člověk rozhoduje.
4. **Živost:** když reviewer najde nový opakovaný problém, přidá ho sem s krátkým „Why". Když se ukáže, že některá položka plodí falešné pozitivy, doplňte k ní výjimku nebo ji přeformulujte.

## Co sem NEpatří

- **Hovorová a verbifikovaná angličtina v developerském kontextu** (`commitnout`, `pushnout`, `mergovat`, `deployovat`, `debugovat`). Tyhle jsou v česky mluveném vývojářském prostředí přirozené a workshop je používá záměrně. Pravidla pro code-switching jsou v [`content/style-guide.md`](./style-guide.md#code-switching-s-anglickými-termíny).
- **Technické termíny** (`prompt`, `workflow`, `skill`, `runbook`, `CLI`, `repo`, `checkpoint`, `handoff`, `fallback`). Schválený seznam drží [`content/style-examples.md`](./style-examples.md#approved-english-terms).
- **Jednorázové slabě znějící věty.** Tenhle seznam je pro opakované vzory, ne pro jednotlivé škobrtáčky. Ty řeší běžný editorial pass.

## Zdroje

- ÚJČ AV ČR – [Internetová jazyková příručka](https://prirucka.ujc.cas.cz/) – normativní autorita
- Nový encyklopedický slovník češtiny – [Nominalizace](https://www.czechency.org/slovnik/NOMINALIZACE)
- [Mozilla Czech Localization Style Guide](https://mozilla-l10n.github.io/styleguides/cs/general.html) – praktická reference pro tech/software copy
- [Microsoft Czech Localization Style Guide (PDF)](https://download.microsoft.com/download/7/b/5/7b57e4a1-d299-4238-9997-f3ac51d6f763/ces-cze-StyleGuide.pdf)
- Naše řeč (ÚJČ) – [archiv článků o anglicismech v odborném vyjadřování](http://nase-rec.ujc.cas.cz/)
