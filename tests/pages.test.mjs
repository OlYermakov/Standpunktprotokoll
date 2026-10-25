import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import vm from 'node:vm';
const out = new URL('../dist-pages/', import.meta.url);
const base = '/Standpunktprotokoll/';
const origin = 'https://olyermakov.github.io';
const html = await readFile(new URL('index.html', out), 'utf8');
const worker = await readFile(new URL('sw.js', out), 'utf8');

test('HTML and all five installed app manifests resolve within the project', async () => {
  for (const [, path] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(path.startsWith(base), path);
    await access(new URL(path.slice(base.length), out));
  }
  for (const language of ['de','en','es','it','uk']) {
    const manifest = JSON.parse(await readFile(new URL(`manifest-${language}.webmanifest`, out)));
    assert.equal(manifest.lang, language);
    assert.equal(manifest.scope, base);
    for (const key of ['id','start_url']) assert.ok(manifest[key].startsWith(base));
    for (const icon of manifest.icons) await access(new URL(icon.src.slice(base.length).split('?')[0], out));
  }
});

test('offline install caches every bundle, fonts and shell; activation preserves other apps', async () => {
  const handlers = {};
  const stored = new Map();
  const deleted = [];
  const cache = {
    async addAll(urls) {
      for (const path of urls) {
        assert.ok(path.startsWith(base), path);
        const relative = path.slice(base.length).split('?')[0] || 'index.html';
        stored.set(new URL(path, origin).href, await readFile(new URL(relative, out), 'utf8'));
      }
    }
  };
  vm.runInNewContext(worker, {
    self: {location: {origin}, addEventListener: (type, fn) => handlers[type] = fn, skipWaiting() {}, clients: {claim() {}}},
    caches: {open: async () => cache, keys: async () => ['other-app-cache', 'standpunktprotokoll-pages:' + base + 'old'], delete: async key => deleted.push(key), match: async path => stored.get(new URL(typeof path === 'string' ? path : path.url, origin).href)},
    fetch: async () => {throw new Error('offline');}, URL, Response,
  });
  let pending;
  handlers.install({waitUntil: p => pending = p}); await pending;
  for (const name of await readdir(new URL('assets/', out))) assert.ok(stored.has(origin + base + 'assets/' + name));
  assert.ok(stored.has(origin + base + 'fonts/DejaVuSans.ttf'));
  handlers.activate({waitUntil: p => pending = p}); await pending;
  assert.deepEqual(deleted, ['standpunktprotokoll-pages:' + base + 'old']);
  handlers.fetch({request: {url: origin + base + '?lang=uk', method: 'GET', mode: 'navigate'}, respondWith: p => pending = p});
  assert.equal(await pending, html);
  let handled = false;
  handlers.fetch({request: {url: origin + '/other-app/', method: 'GET', mode: 'navigate'}, respondWith: () => handled = true});
  assert.equal(handled, false);
});
