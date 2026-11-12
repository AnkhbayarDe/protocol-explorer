import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const bundlePath = path.join(root, 'assets/index-4NePqLyW.js');

// The repository contains the shipped bundle rather than its original source.
// Evaluate only the lesson definitions, before any browser UI is initialized.
export async function catalog() {
  const source = fs.readFileSync(bundlePath, 'utf8');
  const start = source.indexOf('const f=');
  const end = source.indexOf('const Dt=');
  if (start < 0 || end <= start) throw new Error('Lesson bundle boundaries changed');
  const context = { localStorage: { getItem: () => null } };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end) + ';globalThis.lessons=cs;', context, { timeout: 5000 });
  const reference = (await import(pathToFileURL(path.join(root, 'assets/de-HYTLkJDz.js')))).default;
  const required = new Set(Object.keys(reference.strings));
  const add = value => { if (typeof value === 'string' && value.trim()) required.add(value); };
  const wireNotes = value => {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (key === 'note') add(item);
      else if (item && typeof item === 'object') wireNotes(item);
    }
  };
  for (const lesson of Object.values(context.lessons)) {
    for (const key of ['name', 'title']) add(lesson[key]);
    for (const section of [lesson.overview, lesson.outro, ...lesson.steps]) {
      for (const key of ['full', 'description', 'title', 'desc', 'detail', 'text']) add(section[key]);
      for (const fact of section.facts || []) fact.forEach(add);
    }
    for (const item of lesson.legend || []) add(item[1]);
    for (const item of Object.values(lesson.labels || {})) add(item[0]);
    for (const step of lesson.steps) for (const event of step.events) {
      for (const packet of event.type === 'stream' ? event.packets : [event]) {
        add(packet.label);
        if (packet.type === 'note') add(packet.text);
        (packet.payload || []).forEach(add);
        wireNotes(packet.row?.wire);
      }
    }
  }
  const decoders = source.slice(source.indexOf('function decodeHttp2'), source.indexOf('// ==================== 7 MODERN'));
  for (const match of decoders.matchAll(/\bnote:\s*("(?:\\.|[^"\\])*")|\.field\(("(?:\\.|[^"\\])*"),/g)) {
    add(JSON.parse(match[1] || match[2]));
  }
  // Fixed UI labels passed directly to the existing translation helpers.
  for (const match of source.matchAll(/\b(?:b|j)\(("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g)) {
    add(vm.runInNewContext(match[1], {}, { timeout: 1000 }));
  }
  return { required: [...required], lessons: context.lessons, source };
}
