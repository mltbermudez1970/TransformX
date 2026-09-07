/**
 * SYS-07 Connectivity Lost — estado global en línea.
 *
 * Comportamiento exigido (Addendum §7.3):
 *  - Banner global en línea, no una página: la vista y lo escrito se conservan.
 *  - Los envíos materiales se deshabilitan mientras no hay conexión. Nunca se
 *    muestra un éxito falso: si la conectividad es incierta, no se afirma que
 *    algo se creó.
 *  - Al reconectar hay que refrescar el estado autoritativo ANTES de volver a
 *    habilitar acciones materiales.
 *
 * `?offline=1` fuerza el estado para la sesión de validación.
 */

let protoOfflineActivo = false;

function protoMaterialButtons(): HTMLButtonElement[] {
  return [
    ...document.querySelectorAll<HTMLButtonElement>(
      "[data-conv-submit], [data-dw-submit], [data-dw-confirm], [data-mi-send], [data-mi-resolve], [data-lead-command], [data-qual-command]"
    ),
  ];
}

function protoRenderConnectivityBanner(): void {
  if (document.querySelector("[data-connectivity]")) return;
  const shell = document.querySelector<HTMLElement>("[data-workspace-shell]");
  if (!shell) return;

  const banner = document.createElement("div");
  banner.className = "ws-offline";
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");
  banner.setAttribute("data-connectivity", "");
  banner.innerHTML = `
    <p class="ws-offline__text">
      <span class="ws-offline__tag">SYS-07</span>
      Se perdió la conexión. Conservamos esta vista y lo que hayas escrito mientras intentas reconectarte.
      <strong>Las acciones que confirman algo están deshabilitadas</strong>: no vamos a decir que se aplicó algo sin poder comprobarlo.
    </p>
    <button type="button" class="c-btn c-btn--secondary" data-reconnect>Reintentar conexión</button>`;
  shell.appendChild(banner);

  banner.querySelector<HTMLButtonElement>("[data-reconnect]")?.addEventListener("click", () => {
    protoSetOffline(false);
  });
}

function protoSetOffline(offline: boolean): void {
  protoOfflineActivo = offline;
  document.documentElement.setAttribute("data-offline", String(offline));

  if (offline) {
    protoRenderConnectivityBanner();
    protoMaterialButtons().forEach((b) => {
      if (!b.disabled) {
        b.setAttribute("data-offline-disabled", "");
        b.disabled = true;
      }
    });
    return;
  }

  document.querySelector("[data-connectivity]")?.remove();
  // Al reconectar se refresca el estado autoritativo antes de rehabilitar.
  const pendientes = document.querySelectorAll<HTMLButtonElement>("[data-offline-disabled]");
  if (pendientes.length > 0) {
    const aviso = document.createElement("div");
    aviso.className = "ws-offline ws-offline--back";
    aviso.setAttribute("role", "status");
    aviso.innerHTML = `<p class="ws-offline__text">Conexión restablecida. Actualiza la vista para trabajar con el estado vigente antes de confirmar nada.</p>
      <button type="button" class="c-btn c-btn--primary" data-offline-refresh>Actualizar</button>`;
    document.querySelector("[data-workspace-shell]")?.appendChild(aviso);
    aviso.querySelector<HTMLButtonElement>("[data-offline-refresh]")?.addEventListener("click", () => location.reload());
  }
}

function protoInitConnectivity(): void {
  if (protoUrlParam("offline") === "1") {
    protoSetOffline(true);
    // Las superficies se pintan en su propio DOMContentLoaded, después de este:
    // hay que volver a deshabilitar los envíos cuando aparecen en el DOM.
    const main = document.querySelector("#main-content");
    if (main) {
      const obs = new MutationObserver(() => {
        if (protoOfflineActivo) {
          protoMaterialButtons().forEach((b) => {
            if (!b.disabled) {
              b.setAttribute("data-offline-disabled", "");
              b.disabled = true;
            }
          });
        }
      });
      obs.observe(main, { childList: true, subtree: true });
    }
  }
  window.addEventListener("offline", () => protoSetOffline(true));
  window.addEventListener("online", () => protoSetOffline(false));
}

document.addEventListener("DOMContentLoaded", protoInitConnectivity);
