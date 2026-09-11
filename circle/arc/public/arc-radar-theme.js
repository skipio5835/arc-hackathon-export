(() => {
  const key = "arcrow:theme";
  const choices = ["light", "dark", "system"];
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const normalize = value => choices.includes(value) ? value : "system";
  let preference = "system";
  let storage = null;
  try { storage = window.localStorage; preference = normalize(storage.getItem(key)); } catch { /* Tab-only preference when storage is blocked. */ }

  function apply() {
    const theme = preference === "system" ? media.matches ? "dark" : "light" : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#191c1e" : "#ffffff";
    document.querySelectorAll('input[name="arcrow-theme"]').forEach(input => { input.checked = input.value === preference; });
  }

  // Runs before CSS and market data loading, avoiding a light flash on dark startup.
  apply();
  media.addEventListener("change", () => { if (preference === "system") apply(); });
  window.addEventListener("storage", event => {
    if (storage && (event.key === key || event.key === null) && event.storageArea === storage) {
      preference = normalize(event.newValue);
      apply();
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('input[name="arcrow-theme"]').forEach(input => {
      input.disabled = false;
      input.addEventListener("change", () => {
        if (!input.checked) return;
        preference = normalize(input.value);
        try { storage?.setItem(key, preference); } catch { /* Keep the current tab usable. */ }
        apply();
      });
    });
    apply();
  }, { once: true });
})();
