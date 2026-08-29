"use strict";
const TOAST_MAX_VISIBLE = 3;
const TOAST_AUTO_DISMISS_MS = 5000;
const TOAST_DISMISS_ANIM_MS = 250;
const SAVE_PROCESS_MS = 1500;
const SAVE_DONE_MS = 2000;
const TOAST_ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
};
const TOAST_TITLES = {
    success: "Operación exitosa",
    error: "Error al procesar",
};
function dismissToast(toast) {
    toast.classList.add("is-dismissed");
    window.setTimeout(() => {
        if (toast.isConnected)
            toast.remove();
    }, TOAST_DISMISS_ANIM_MS);
}
function createToastElement(message, variant, title = TOAST_TITLES[variant]) {
    const toast = document.createElement("div");
    toast.className = `c-toast c-toast--${variant}`;
    toast.setAttribute("role", variant === "error" ? "alert" : "status");
    const icon = document.createElement("span");
    icon.className = "c-toast__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = TOAST_ICONS[variant];
    const body = document.createElement("div");
    body.className = "c-toast__body";
    const heading = document.createElement("p");
    heading.className = "c-toast__title";
    heading.textContent = title;
    const text = document.createElement("p");
    text.textContent = message;
    body.append(heading, text);
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "c-toast-close";
    closeBtn.setAttribute("aria-label", "Cerrar notificación");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => dismissToast(toast));
    toast.append(icon, body, closeBtn);
    return toast;
}
function showToast(message, variant = "success") {
    const container = document.querySelector("#playground-toasts") ??
        document.querySelector(".c-toast-container");
    if (!container)
        return;
    const toast = createToastElement(message, variant);
    container.prepend(toast);
    const toasts = container.querySelectorAll(".c-toast:not(.is-dismissed)");
    if (toasts.length > TOAST_MAX_VISIBLE) {
        const oldest = toasts[toasts.length - 1];
        if (oldest)
            dismissToast(oldest);
    }
    window.setTimeout(() => {
        if (toast.isConnected)
            dismissToast(toast);
    }, TOAST_AUTO_DISMISS_MS);
}
function initButtons() {
    const saveBtn = document.querySelector("#btn-guardar-demo");
    if (!saveBtn)
        return;
    const defaultLabel = "Guardar";
    let resetTimer;
    saveBtn.addEventListener("click", () => {
        if (saveBtn.disabled)
            return;
        window.clearTimeout(resetTimer);
        saveBtn.disabled = true;
        saveBtn.classList.remove("c-btn--success");
        saveBtn.classList.add("c-btn--loading");
        saveBtn.setAttribute("aria-busy", "true");
        saveBtn.textContent = "Guardando…";
        window.setTimeout(() => {
            saveBtn.classList.remove("c-btn--loading");
            saveBtn.classList.add("c-btn--success");
            saveBtn.removeAttribute("aria-busy");
            saveBtn.textContent = "Guardado";
            resetTimer = window.setTimeout(() => {
                saveBtn.classList.remove("c-btn--success");
                saveBtn.disabled = false;
                saveBtn.textContent = defaultLabel;
            }, SAVE_DONE_MS);
        }, SAVE_PROCESS_MS);
    });
}
function initAlerts() {
    document.querySelectorAll(".c-alert").forEach((alert) => {
        const closeBtn = alert.querySelector(".c-alert-close");
        if (!closeBtn)
            return;
        closeBtn.addEventListener("click", () => {
            alert.hidden = true;
        });
    });
}
function initDialogs() {
    document.querySelectorAll(".c-dialog").forEach((dialog) => {
        if (!dialog.id)
            return;
        const triggers = document.querySelectorAll(`[data-dialog-open="${dialog.id}"]`);
        const confirmBtn = dialog.querySelector("[data-dialog-confirm]");
        const cancelBtn = dialog.querySelector("[data-dialog-cancel]");
        if (triggers.length === 0 || !confirmBtn || !cancelBtn)
            return;
        const modal = dialog;
        const confirm = confirmBtn;
        const cancel = cancelBtn;
        let activeTrigger = null;
        function openDialog(trigger) {
            activeTrigger = trigger;
            if (!modal.open) {
                modal.showModal();
                cancel.focus();
            }
        }
        function closeDialog() {
            if (modal.open)
                modal.close();
        }
        triggers.forEach((trigger) => {
            trigger.addEventListener("click", () => openDialog(trigger));
        });
        confirm.addEventListener("click", () => {
            if (modal.id === "dialog-eliminar-botones") {
                showToast("Registro eliminado correctamente.");
            }
            if (modal.id === "dialog-eliminar-recurso") {
                showToast("Recurso eliminado correctamente.");
            }
            closeDialog();
        });
        cancel.addEventListener("click", closeDialog);
        modal.addEventListener("cancel", (event) => {
            event.preventDefault();
            closeDialog();
        });
        modal.addEventListener("close", () => {
            activeTrigger?.focus();
            activeTrigger = null;
        });
    });
}
function setMenuOpen(elements, isOpen) {
    const { trigger, menu } = elements;
    trigger.setAttribute("aria-expanded", String(isOpen));
    menu.hidden = !isOpen;
    if (isOpen) {
        const firstItem = menu.querySelector('[role="menuitem"]');
        firstItem?.focus();
    }
}
function initMenu(wrapper) {
    const trigger = wrapper.querySelector(".c-menu-account-toggle");
    const menu = wrapper.querySelector(".c-menu-account");
    if (!trigger || !menu)
        return;
    const elements = { trigger, menu };
    const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    trigger.addEventListener("click", () => {
        const isOpen = trigger.getAttribute("aria-expanded") === "true";
        setMenuOpen(elements, !isOpen);
    });
    trigger.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" && trigger.getAttribute("aria-expanded") !== "true") {
            event.preventDefault();
            setMenuOpen(elements, true);
        }
    });
    items.forEach((item) => {
        item.addEventListener("click", (event) => {
            if (item instanceof HTMLAnchorElement) {
                event.preventDefault();
            }
            const action = item.dataset.menuAction ?? item.textContent?.trim() ?? "Acción";
            setMenuOpen(elements, false);
            trigger.focus();
            if (item.classList.contains("c-menu__item--danger")) {
                showToast("Sesión cerrada correctamente.");
                return;
            }
            showToast(`${action} seleccionada.`);
        });
    });
    menu.addEventListener("keydown", (event) => {
        const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]'));
        const currentIndex = menuItems.indexOf(document.activeElement);
        if (event.key === "Escape") {
            event.preventDefault();
            setMenuOpen(elements, false);
            trigger.focus();
            return;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            const next = menuItems[(currentIndex + 1) % menuItems.length];
            next?.focus();
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            const prev = menuItems[(currentIndex - 1 + menuItems.length) % menuItems.length];
            prev?.focus();
        }
    });
    document.addEventListener("click", (event) => {
        if (!wrapper.contains(event.target)) {
            setMenuOpen(elements, false);
        }
    });
}
function initMenus() {
    document.querySelectorAll(".c-menu-wrapper").forEach((wrapper) => {
        initMenu(wrapper);
    });
}
function enforceToastLimit(container) {
    const toasts = container.querySelectorAll(".c-toast:not(.is-dismissed)");
    if (toasts.length <= TOAST_MAX_VISIBLE)
        return;
    const excess = toasts.length - TOAST_MAX_VISIBLE;
    for (let i = 0; i < excess; i++) {
        const toast = toasts[toasts.length - 1 - i];
        if (toast)
            dismissToast(toast);
    }
}
function scheduleToastDismiss(toast) {
    window.setTimeout(() => {
        if (toast.isConnected)
            dismissToast(toast);
    }, TOAST_AUTO_DISMISS_MS);
}
function initToasts() {
    document.querySelectorAll("[data-toast-trigger]").forEach((button) => {
        button.addEventListener("click", () => {
            const variant = button.dataset.toastTrigger === "error" ? "error" : "success";
            const message = variant === "error"
                ? "No se pudo completar la solicitud. Intenta de nuevo."
                : "Registro guardado correctamente.";
            showToast(message, variant);
        });
    });
    document
        .querySelectorAll(".c-toast-container:not(#playground-toasts) .c-toast")
        .forEach((toast) => {
        const closeBtn = toast.querySelector(".c-toast-close");
        closeBtn?.addEventListener("click", () => dismissToast(toast));
        scheduleToastDismiss(toast);
    });
    const viewport = document.querySelector("#playground-toasts");
    if (viewport)
        enforceToastLimit(viewport);
}
function initPlayground() {
    initAlerts();
    initButtons();
    initDialogs();
    initMenus();
    initToasts();
}
document.addEventListener("DOMContentLoaded", initPlayground);
