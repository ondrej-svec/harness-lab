# Coaching Codex — karta do kapsy

> Jedna strana. Tahy si klidně ukradněte. Když chcete, vytiskněte si ji.

Workshop učí harness engineering: repo, workflow a kontext, který **unese další krok** bez toho, abyste u toho museli stát. Tahle karta je jeho druhá polovina — tahy, které drží agenta uvnitř funkčního harnessu, jakmile session jednou běží. Talk a briefy staví guides, které si agent čte. Tahle karta je o tom, co řeknete, když už se něco hýbe a něco se chystá uklouznout.

---

## Meta-dovednost: tři otázky, které resetují cokoliv

Tyhle tři otázky fungují v jakékoliv situaci — před kódem, během práce, když se zaseknete, když s agentem nesouhlasíte. Protokoly níž jsou jen konkrétní aplikace.

Když cítíte, že session jede stranou, zastavte se a položte je nahlas, nejdřív sami sobě:

1. **Co teď vlastně zkoušíme dokázat?**
2. **Který artefakt v repu chybí, aby se tomuhle předešlo?**
3. **Jaký je nejmenší check, který tuhle práci vrátí z jistoty zpátky do reality?**

Když na žádnou z těch tří nedokážete odpovědět, session skončila. Zavřete ji. Vraťte se, až odpovědi budete mít.

---

## Než agenta pustíte psát kód

Projděte tohle v tomhle pořadí. Nepřeskakujte.

1. **„Než začnete implementovat, přečtěte si [soubor X] a řekněte tři patterny, které použijete znovu."**
   Chytí špatné čtení za 30 sekund. Nic vás to nestojí.

2. **„Jaká je nejmenší změna, která by mohla dokázat, že tenhle přístup funguje?"**
   Vynutí si tracer bullet — tenký end-to-end řez, který ukáže, že celá věc drží — místo přepsání specifikace. Celek nad detailem: chcete řez, který ukáže další krok, ne unit test na jedné funkci.

3. **„Jaká je definice hotovo — příkaz, který spustím, nebo soubor, na který se podívám — a která nám řekne, že je skutečně hotovo?"**
   Když to agent neumí pojmenovat, nikdo z vás neví, co „hotovo" znamená. Stop.

4. **„Co se může pokazit? Pojmenujte jeden failure mode, o kterém jsem vám neřekl."**
   Tohle je nejlepší detektor task driftu. Když agent řekne „nic", berte to jako žlutou vlajku a zatlačte.

5. **„Ukažte plán ve třech krocích. Ne kód. Plán."**
   Přesměrovat plán stojí minutu. Přesměrovat 300 řádků kódu stojí odpoledne.

---

## Když agent pracuje

Tohle je místo, kde chytáte **task drift** — failure mode, kdy agent dělá uvěřitelná, ale špatná rozhodnutí, protože vám došly constraints. Pojmenujte ho nahlas, jakmile ho vidíte. Řešení není lepší prompt; řešení je chybějící guide.

- **Když začne implementovat dřív, než odpoví na pět otázek výš, zastavte ho.** Session ujíždí. Vraťte se k plánu.
- **Když řekne „úkol je hotový“, zeptejte se: „Co jste ověřili?“** Ne „prošly testy“ — „co jste ověřili“. Přinuťte ho pojmenovat důkaz, ne pocit.
- **Když přidá soubor, o který jste neprosili, zeptejte se „proč zrovna tenhle soubor?", než ho vezmete.** Soubory navíc jsou první známka improvizace.
- **Když se snaží oslabit nějaký constraint („mohli bychom ten test vynechat"), odmítněte a přečtěte ten constraint nahlas znovu.** Constraints, které vyjednáte dolů, se vždycky vrátí.

---

## Když agent říká, že je hotovo

Tohle je váš **sensor** moment — feedback loop, který agenta chytí po tom, co jednal. Verifikace je hranice důvěry. Když agent dělá víc, vy ověřujete líp — a ověřujete celkově. Pustíte tenhle krátký script, vždycky:

1. **„Ukažte mi diff."** Přečtěte si ho. Pokud se vám ho nechce číst, hotový není agent — hotoví jste vy.
2. **„Jaký test tu změnu pokrývá?"** Když žádný, změna pokrytá není. Není to morální soud; je to věta o zítřejším bugu.
3. **„Co si o tomhle další tým mohl špatně přečíst?"** Tohle je váš handoff check. Agentova odpověď je tam, odkud přijde další update do `AGENTS.md`.
4. **„Jaký je další bezpečný krok, když odtud pokračujeme?"** Když odpověď zní „nejsem si jistý“, nenechali jste za sebou harness; nechali jste suť.
5. **Napište session-state poznámku.** Co je dokázané, co je rozpracované, co je další bezpečný tah. Tohle není AGENTS.md (to je mapa). Tohle je pracovní log.

---

## Když s agentem nesouhlasíte

- **Nehádejte se.** Hádka s agentem uvnitř session je znak, že chybí harness. Opusťte chat, posilněte repo, vraťte se.
- **Pojmenujte tu neshodu jako pravidlo.** „V tomhle repu nepoužíváme `any`" je pravidlo. Napište ho. Přesuňte ho do `AGENTS.md`. Nepište ho znova příští session.
- **Zeptejte se: „Který soubor v repu tomuhle měl zabránit?"** Odpověď je obvykle doc, který ještě neexistuje. Vytvořte ho.

---

## Jedno pravidlo, které si pamatujete

**Nepromptujete agenta. Koučujete spolupracovníka, který mezi sessions všechno zapomíná.** Jediná paměť, kterou sdílíte, je repo. Podle toho.

Co není v repu, neexistuje.

## Čtyři slova

> **Lidé řídí. Agenti vykonávají.**

Druhý den, až si otevřete coding agenta, budete pracovat jinak. Ne s novým nástrojem. S jinou rolí. Přestanete být ten, koho se agent ptá, a stanete se tím, kdo staví prostředí, do kterého agent vchází. Všechno na téhle kartě je tah směrem k té roli.

---

*Doplňuje [`content/codex-craft.md`](../../../content/codex-craft.md) — doc o konkrétní nástrojové zběhlosti — a workshopový talk [`content/talks/context-is-king.md`](../../../content/talks/context-is-king.md).*
