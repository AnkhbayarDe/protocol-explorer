# Mongolian localization

Choose **Монгол** (MN) in the language menu. This uses Mongolian Cyrillic,
`lang="mn"`, and left-to-right layout. Mongolian is the default for new visitors;
the selected language is saved under `protocol-explorer:lang` in localStorage.

The Mongolian module covers the interface, all 21 lessons, their step details
and summaries, diagram labels, and packet inspector explanations. Protocol
identifiers, HTTP headers, commands, sample payloads, addresses and hex values
remain in their wire format. `PROTOCOL EXPLORER` remains the product name.

## Editing and generating

- Edit `translations_mn.json` for fixed text. Keys are exact English source
  strings; preserve punctuation in keys and placeholders such as `{n}`.
- Edit `mn-patterns.mjs` for variable display text, such as byte counts.
  Do not add blanket text replacement that could change protocol examples.
- `mn-preserved.json` lists reviewed technical values intentionally left as
  written. Do not add missing prose to this list to bypass coverage checks.
- Run `npm run build:mn` to regenerate `assets/mn.js`. Commit both the source
  and generated module; GitHub Pages serves the checked-in assets directly.
- `assets/mn.css` uses the shared Iosevka font, with system fallbacks for
  Mongolian Cyrillic. It adjusts long panel headings and reserves space for
  language and theme controls. No remote font download is required.

Generation does not depend on the missing original `.orig` bundle or on the
older localization patch scripts. It can be rerun without injecting duplicate
language entries or modifying other language modules.

## Verification

After `npm ci`, run:

```sh
npm run build:mn
npm run check:mn
npm run test:mn:browser
npm run test:mn:header
```

The build checks empty values, placeholder mismatches, unreviewed untranslated
values, missing catalog entries and stale generated output. The catalog uses
the existing language keys plus actual lesson text, facts, diagram payload
labels, wire notes, decoder labels and fixed UI calls from the shipped bundle.
This checks that text has a translation or an explicit technical exemption;
it does not certify linguistic quality or every possible future runtime value.

The unit checks exercise the actual application translation helper, counters,
dynamic values and all lesson narratives. The browser check starts its own
temporary localhost server and verifies all 112 steps, packet inspector samples,
all 270 wire frames remaining unchanged, saved language on reload, English /
Persian / Mongolian switching, a temporarily zero-size network diagram, and
390px / 768px layouts. The camera preserves its last valid view while the SVG
has no layout size, preventing invalid viewBox values during layout changes.
Screenshots go to the
OS temporary directory, not the repository. Both checks fail with a nonzero
exit status on errors.

The focused header check verifies the theme toggle fits beside the language
selector at ten widths from 360px to 1920px and switches both light and dark
themes correctly. In phone layout, the existing design shows the button for
the other theme only.

Browser checks use an installed Chrome/Edge or Puppeteer's downloaded browser.
Set `CHROME_PATH` to choose another installed browser. If neither is available,
install Puppeteer's browser with `npx puppeteer browsers install chrome`.

The catalog locates lesson-definition boundaries in the current bundled JS.
If the bundle is replaced or rebuilt, update these boundaries and the bundle
path in `mn-catalog.mjs`, then rerun the checks.

## Terminology

| English | Mongolian |
| --- | --- |
| Packet | Пакет |
| Protocol | Протокол |
| Router | Чиглүүлэгч |
| Header | Толгой хэсэг |
| Payload | Өгөгдлийн хэсэг |
| Handshake | Холболтын тохиролцоо |
| Retransmission | Дахин дамжуулалт |
| Stream | Урсгал |
| Packet loss | Пакетын алдагдал |
| Head-of-line blocking | Дарааллын эхний саатал |
