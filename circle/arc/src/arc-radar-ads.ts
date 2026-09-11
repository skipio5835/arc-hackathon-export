export function canPreviewAds(url: URL): boolean {
  return ["http:", "https:"].includes(url.protocol)
    && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    && url.searchParams.get("ads") === "preview";
}

export function createVisibilityCheck() {
  let since: number | null = null;
  let qualified = false;
  return (now: number, visible: boolean) => {
    if (!visible) since = null;
    else {
      since ??= now;
      if (now - since >= 1000) qualified = true;
    }
    return { qualified, remaining: visible && !qualified ? Math.max(0, 1000 - (now - since!)) : null };
  };
}

export function initializeAdPreview(networkAvailable: boolean): { setContentAvailable(value: boolean): void } {
  const inactive = { setContentAvailable: (_value: boolean) => {} };
  if (!networkAvailable || !canPreviewAds(new URL(location.href))) return inactive;
  const controls = document.querySelector<HTMLElement>("#adPreviewControls")!;
  const toggle = document.querySelector<HTMLInputElement>("#adPreviewToggle")!;
  const slot = document.querySelector<HTMLElement>("[data-ad-preview]")!;
  const creative = slot.querySelector<HTMLElement>(".ad-preview-creative")!;
  const placement = document.querySelector<HTMLSelectElement>("#adPreviewPlacement")!;
  const result = document.querySelector<HTMLElement>("#adPreviewVisibility")!;
  const status = document.querySelector<HTMLElement>("#adPreviewStatus")!;
  const summary = document.querySelector<HTMLElement>(".market-pulse")!;
  const markets = document.querySelector<HTMLElement>("#markets")!;
  let contentAvailable = false;
  let check = createVisibilityCheck();
  let timer: number | undefined;

  // Local geometry diagnostic only: never sends impressions or calls an ad SDK.
  const measure = () => {
    window.clearTimeout(timer);
    const rect = creative.getBoundingClientRect();
    const width = Math.max(0, Math.min(rect.right, document.documentElement.clientWidth) - Math.max(rect.left, 0));
    const height = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
    const area = rect.width * rect.height;
    const visible = toggle.checked && contentAvailable && !document.hidden && area > 0 && width * height / area >= 0.5;
    const sample = check(performance.now(), visible);
    result.textContent = sample.qualified ? "Yes" : "No";
    if (sample.remaining !== null) timer = window.setTimeout(measure, sample.remaining + 10);
  };

  controls.hidden = false;
  toggle.checked = true;
  const update = () => {
    slot.hidden = !toggle.checked;
    // Keep the reserved space during loading, empty filters and fetch failures.
    slot.style.visibility = contentAvailable ? "visible" : "hidden";
    status.textContent = !toggle.checked ? "Off" : contentAvailable ? "Preview only" : "Waiting for market content";
    measure();
  };
  toggle.addEventListener("change", update);
  placement.addEventListener("change", () => {
    if (placement.value === "summary") summary.after(slot);
    else markets.append(slot);
    check = createVisibilityCheck();
    measure();
  });
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  document.addEventListener("visibilitychange", measure);
  update();
  return { setContentAvailable(value) { contentAvailable = value; update(); } };
}
