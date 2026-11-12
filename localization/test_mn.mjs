import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { build } from './build_mn_module.mjs';
import { catalog, root } from './mn-catalog.mjs';

await build({ check: true });
const mn = (await import(pathToFileURL(path.join(root, 'assets/mn.js')))).default;
const { source, lessons } = await catalog();
// Exercise the application's actual dictionary / regex / placeholder pipeline.
const context = { os: mn };
vm.createContext(context);
const start = source.indexOf('Ll=');
const end = source.indexOf('const pn=', start);
assert.ok(start >= 0 && end > start, 'Translation helper boundaries must exist');
vm.runInContext('const ' + source.slice(start, end) + ';globalThis.translate=b;', context);
const translate = context.translate;
const preserved = new Set(JSON.parse(fs.readFileSync(path.join(root, 'localization/mn-preserved.json'), 'utf8')));
assert.equal(translate('STEP {n} OF {total}', { n: 2, total: 6 }), 'НИЙТ 6 АЛХМЫН 2-Р АЛХАМ');
assert.equal(translate('Layer {n}: {name}', { n: 4, name: translate('Transport') }), '4-р давхарга: Дамжуулалт');
assert.equal(translate('PACKETS {from}–{to} OF {total}', { from: 2, to: 4, total: 9 }), 'НИЙТ 9 ПАКЕТЫН 2–4-Р ПАКЕТ');
const examples = [
  ['128 bytes', '128 байт'],
  ['Ethernet II · 60 bytes', 'Ethernet II · 60 байт'],
  ['Handshake, 32 bytes', 'Холболтын тохиролцоо, 32 байт'],
  ['3 h later', '3 цагийн дараа'],
  ['42 s later', '42 секундын дараа'],
  ['52344 (ephemeral)', '52344 (түр порт)'],
  ['2 TCP segments', '2 TCP сегмент'],
  ['TLS 1.3 · 2 records', 'TLS 1.3 · 2 бичлэг'],
  ['Started at 128; 10 routers on the way each took 1.', '128-аас эхэлсэн; зам дахь 10 чиглүүлэгч тус бүр 1-ээр бууруулсан.'],
  ['HTTP/2 · DATA · Stream 3', 'HTTP/2 · DATA · 3-р урсгал'],
  ['WebSocket · Text · 12 bytes', 'WebSocket · Text · 12 байт'],
  ['Field 1 (order_id)', '1-р талбар (order_id)'],
  ['HTTP Chunked · Size: 1A', 'HTTP хэсэгчилсэн · Хэмжээ: 1A'],
  ['STREAM · Stream 4', 'STREAM · 4-р урсгал'],
];
for (const [input, expected] of examples) assert.equal(translate(input), expected, input);
for (const token of ['GET / HTTP/1.1', 'SYN', 'ACK', '192.168.1.10', 'Transfer-Encoding: chunked', 'grpc-status: 0 (OK)', '0x8 (CANCEL)']) assert.equal(translate(token), token);
for (const lesson of Object.values(lessons)) {
  for (const section of [lesson.overview, lesson.outro, ...lesson.steps]) {
    for (const key of ['description', 'title', 'desc', 'detail', 'text']) {
      if (section[key] && !preserved.has(section[key])) assert.match(translate(section[key]), /[\u0400-\u04ff]/u, `${lesson.id}: ${key}`);
    }
  }
}
assert.ok(source.includes('code:"mn",name:"Монгол",short:"MN",html:"mn",dir:"ltr"'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(html.includes('./assets/mn.css'));
console.log(`Passed: actual translation pipeline, placeholders, dynamic values, wire tokens, and all ${Object.keys(lessons).length} lesson narratives.`);
