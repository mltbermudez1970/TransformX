type MenuElements = {
  trigger: HTMLButtonElement;
  menu: HTMLUListElement;
};

const TOAST_MAX_VISIBLE = 3;
const TOAST_AUTO_DISMISS_MS = 5000;

function initAlerts(): void {
  document.querySelectorAll<HTMLElement>(".c-alert").forEach((alert) => {
    const closeBtn = alert.querySelector<HTMLButtonElement>(".c-alert-close");
    if (!closeBtn) return;

    closeBtn.addEventListener("click", () => {
      alert.hidden = true;
    });
  });
}

function initDialogs(): void {
  const dialog = document.querySelector<HTMLDialogElement>("#seccion-dialogs .c-dialog");
  const openTrigger = document.querySelector<HTMLButtonElement>("#dialog-open-trigger");
  const confirmBtn = dialog?.querySelector<HTMLButtonElement>("[data-dialog-confirm]");
  const cancelBtn = dialog?.querySelector<HTMLButtonElement>("[data-dialog-cancel]");

  if (!dialog || !openTrigger || !confirmBtn || !cancelBtn) return;

  const modal = dialog;
  const trigger = openTrigger;

  function openDialog(): void {
    if (!modal.open) modal.showModal();
  }

  function closeDialog(): void {
    if (modal.open) modal.close();
  }

  trigger.addEventListener("click", openDialog);

  confirmBtn.addEventListener("click", () => {
    closeDialog();
  });

  cancelBtn.addEventListener("click", closeDialog);

  modal.addEventListener("cancel", (event: Event) => {
    event.preventDefault();
    closeDialog();
  });

  modal.addEventListener("close", () => {
    trigger.focus();
  });
}

function setMenuOpen(elements: MenuElements, isOpen: boolean): void {
  const { trigger, menu } = elements;

  trigger.setAttribute("aria-expanded", String(isOpen));
  menu.hidden = !isOpen;

  if (isOpen) {
    const firstItem = menu.querySelector<HTMLElement>("a, button");
    firstItem?.focus();
  }
}

function initMenu(wrapper: HTMLElement): void {
  const trigger = wrapper.querySelector<HTMLButtonElement>(".c-menu-account-toggle");
  const menu = wrapper.querySelector<HTMLUListElement>(".c-menu-account");

  if (!trigger || !menu) return;

  const elements: MenuElements = { trigger, menu };

  trigger.addEventListener("click", () => {
    const isOpen = trigger.getAttribute("aria-expanded") === "true";
    setMenuOpen(elements, !isOpen);
  });

  trigger.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" && trigger.getAttribute("aria-expanded") !== "true") {
      event.preventDefault();
      setMenuOpen(elements, true);
    }
  });

  menu.addEventListener("keydown", (event: KeyboardEvent) => {
    const items = Array.from(menu.querySelectorAll<HTMLElement>("a, button"));
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(elements, false);
      trigger.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = items[(currentIndex + 1) % items.length];
      next?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = items[(currentIndex - 1 + items.length) % items.length];
      prev?.focus();
    }
  });

  document.addEventListener("click", (event: MouseEvent) => {
    if (!wrapper.contains(event.target as Node)) {
      setMenuOpen(elements, false);
    }
  });
}

function initMenus(): void {
  document.querySelectorAll<HTMLElement>(".c-menu-wrapper").forEach((wrapper) => {
    initMenu(wrapper);
  });
}

function dismissToast(toast: HTMLElement): void {
  toast.remove();
}

function enforceToastLimit(container: HTMLElement): void {
  const toasts = container.querySelectorAll<HTMLElement>(".c-toast");
  if (toasts.length <= TOAST_MAX_VISIBLE) return;

  const excess = toasts.length - TOAST_MAX_VISIBLE;
  for (let i = 0; i < excess; i++) {
    toasts[i]?.remove();
  }
}

function scheduleToastDismiss(toast: HTMLElement): void {
  window.setTimeout(() => {
    if (toast.isConnected) dismissToast(toast);
  }, TOAST_AUTO_DISMISS_MS);
}

function initToasts(): void {
  const container = document.querySelector<HTMLElement>(".c-toast-container");
  if (!container) return;

  enforceToastLimit(container);

  container.querySelectorAll<HTMLElement>(".c-toast").forEach((toast) => {
    scheduleToastDismiss(toast);
  });
}

function initPlayground(): void {
  initAlerts();
  initDialogs();
  initMenus();
  initToasts();
}

document.addEventListener("DOMContentLoaded", initPlayground);
