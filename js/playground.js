"use strict";
const TOAST_MAX_VISIBLE = 3;
const TOAST_AUTO_DISMISS_MS = 5000;
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
    const dialog = document.querySelector("#seccion-dialogs .c-dialog");
    const openTrigger = document.querySelector("#dialog-open-trigger");
    const confirmBtn = dialog?.querySelector("[data-dialog-confirm]");
    const cancelBtn = dialog?.querySelector("[data-dialog-cancel]");
    if (!dialog || !openTrigger || !confirmBtn || !cancelBtn)
        return;
    const modal = dialog;
    const trigger = openTrigger;
    function openDialog() {
        if (!modal.open)
            modal.showModal();
    }
    function closeDialog() {
        if (modal.open)
            modal.close();
    }
    trigger.addEventListener("click", openDialog);
    confirmBtn.addEventListener("click", () => {
        closeDialog();
    });
    cancelBtn.addEventListener("click", closeDialog);
    modal.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeDialog();
    });
    modal.addEventListener("close", () => {
        trigger.focus();
    });
}
function setMenuOpen(elements, isOpen) {
    const { trigger, menu } = elements;
    trigger.setAttribute("aria-expanded", String(isOpen));
    menu.hidden = !isOpen;
    if (isOpen) {
        const firstItem = menu.querySelector("a, button");
        firstItem?.focus();
    }
}
function initMenu(wrapper) {
    const trigger = wrapper.querySelector(".c-menu-account-toggle");
    const menu = wrapper.querySelector(".c-menu-account");
    if (!trigger || !menu)
        return;
    const elements = { trigger, menu };
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
    menu.addEventListener("keydown", (event) => {
        const items = Array.from(menu.querySelectorAll("a, button"));
        const currentIndex = items.indexOf(document.activeElement);
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
function dismissToast(toast) {
    toast.remove();
}
function enforceToastLimit(container) {
    const toasts = container.querySelectorAll(".c-toast");
    if (toasts.length <= TOAST_MAX_VISIBLE)
        return;
    const excess = toasts.length - TOAST_MAX_VISIBLE;
    for (let i = 0; i < excess; i++) {
        toasts[i]?.remove();
    }
}
function scheduleToastDismiss(toast) {
    window.setTimeout(() => {
        if (toast.isConnected)
            dismissToast(toast);
    }, TOAST_AUTO_DISMISS_MS);
}
function initToasts() {
    const container = document.querySelector(".c-toast-container");
    if (!container)
        return;
    enforceToastLimit(container);
    container.querySelectorAll(".c-toast").forEach((toast) => {
        scheduleToastDismiss(toast);
    });
}
function initPlayground() {
    initAlerts();
    initDialogs();
    initMenus();
    initToasts();
}
document.addEventListener("DOMContentLoaded", initPlayground);
