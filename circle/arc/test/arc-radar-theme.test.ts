import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../public/arc-radar-theme.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../public/arc-radar-theme.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../public/arc-radar.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/arc-radar.html", import.meta.url), "utf8");

function fixture(saved: string | null = null, dark = false, blocked = false) {
  const handlers: Record<string, (event?: any) => void> = {};
  const values = new Map(saved ? [["arcrow:theme", saved]] : []);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
  const media = { matches: dark, addEventListener: (_name: string, fn: () => void) => { handlers.media = fn; } };
  const root = { dataset: {} as Record<string, string>, style: {} as Record<string, string> };
  const meta = { content: "" };
  const controls = ["light", "dark", "system"].map(value => ({ value, checked: false, disabled: true,
    addEventListener: (_name: string, fn: () => void) => { handlers[value] = fn; } }));
  let loaded = false;
  const window = { get localStorage() { if (blocked) throw new Error("Storage blocked"); return storage; },
    matchMedia: () => media, addEventListener: (name: string, fn: () => void) => { handlers[name] = fn; } };
  const document = { documentElement: root, querySelector: () => meta,
    querySelectorAll: () => loaded ? controls : [], addEventListener: (name: string, fn: () => void) => { handlers[name] = fn; } };
  runInNewContext(script, { window, document });
  return { root, meta, media, values, storage, controls,
    ready: () => { loaded = true; handlers.DOMContentLoaded(); },
    choose: (value: string) => { controls.forEach(control => { control.checked = control.value === value; }); handlers[value](); },
    system: (value: boolean) => { media.matches = value; handlers.media(); },
    sync: (key: string | null, newValue: string | null) => handlers.storage({ key, newValue, storageArea: storage }) };
}

test("theme applies before DOM ready; no saved preference follows system without writing storage", () => {
  const page = fixture(null, true);
  assert.equal(page.root.dataset.theme, "dark");
  assert.equal(page.root.style.colorScheme, "dark");
  assert.equal(page.meta.content, "#191c1e");
  assert.equal(page.values.size, 0);
  page.ready();
  assert.equal(page.controls.find(control => control.checked)?.value, "system");
  assert.ok(page.controls.every(control => !control.disabled));
});

test("explicit light/dark persists and ignores OS changes until system is selected", () => {
  const page = fixture("light", true);
  page.ready();
  assert.equal(page.root.dataset.theme, "light");
  page.choose("dark");
  assert.equal(page.values.get("arcrow:theme"), "dark");
  page.system(false);
  assert.equal(page.root.dataset.theme, "dark");
  page.choose("system");
  assert.equal(page.root.dataset.theme, "light");
  page.system(true);
  assert.equal(page.root.dataset.theme, "dark");
  assert.equal(fixture(page.values.get("arcrow:theme"), true).root.dataset.theme, "dark");
});

test("blocked storage and invalid saved values preserve functional in-tab controls", () => {
  const blocked = fixture(null, false, true);
  blocked.ready();
  blocked.choose("dark");
  assert.equal(blocked.root.dataset.theme, "dark");
  assert.equal(blocked.values.size, 0);
  assert.equal(fixture("not-a-theme", true).root.dataset.theme, "dark");
});

test("theme sync across tabs excludes unrelated preferences and handles clear", () => {
  const page = fixture("light", true);
  page.ready();
  page.sync("arcrow:watchlist", "dark");
  assert.equal(page.root.dataset.theme, "light");
  page.sync("arcrow:theme", "dark");
  assert.equal(page.root.dataset.theme, "dark");
  page.sync(null, null);
  assert.equal(page.controls.find(control => control.checked)?.value, "system");
});

function tokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(match => [match[1], match[2]]));
}
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const rgb = hex.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

test("both palettes meet text contrast on market surfaces and semantic badges", () => {
  const light = tokens(css.match(/:root\s*\{([^}]+)\}/)![1]);
  const dark = { ...light, ...tokens(css.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/)![1]) };
  for (const theme of [light, dark]) {
    for (const background of ["page", "surface", "surface-soft", "surface-selected"]) {
      for (const foreground of ["text", "text-secondary", "muted", "faint", "positive", "negative", "accent"]) {
        assert.ok(contrast(theme[foreground], theme[background]) >= 4.5, `${theme.scheme}: ${foreground} on ${background}`);
      }
    }
    for (const [foreground, background] of [["on-accent", "accent-fill"], ["on-accent", "accent-hover"],
      ["warning-text", "warning-surface"], ["negative", "danger-surface"], ["info-text", "info-surface"],
      ["token-text", "token-bg"], ["footer-muted", "footer"]]) {
      assert.ok(contrast(theme[foreground], theme[background]) >= 4.5, `${theme.scheme}: ${foreground} on ${background}`);
    }
  }
});

test("all layout colors use defined tokens, and the original emblem is not inverted", () => {
  const defined = new Set([...css.matchAll(/--([\w-]+):/g)].map(match => match[1]));
  for (const match of (css + layout).matchAll(/var\(--([\w-]+)/g)) assert.ok(defined.has(match[1]), match[1]);
  assert.doesNotMatch(layout, /#[\da-f]{3,8}\b|rgba?\(/i);
  assert.doesNotMatch(css + layout, /filter:\s*(?:invert|brightness|hue-rotate)/);
  assert.ok(html.indexOf('src="./arc-radar-theme.js"') < html.indexOf('href="./arc-radar.css"'));
  assert.ok(html.includes('src="./assets/arcrow-mark.png"'));
});
