"use strict";
function getFormDataString(formData, name) {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
}
function initHomeNavigation() {
    const header = document.querySelector(".header");
    if (!header)
        return;
    const navLinks = document.querySelectorAll(".nav__link, .nav__link--drawer");
    const sections = document.querySelectorAll("section[id]");
    const siteHeader = header;
    function onScroll() {
        const scrollPos = window.scrollY + siteHeader.offsetHeight + 100;
        let current = "";
        sections.forEach((section) => {
            if (section.offsetTop <= scrollPos)
                current = section.id;
        });
        navLinks.forEach((link) => {
            const active = link.getAttribute("href") === `#${current}`;
            link.classList.toggle("is-active", active);
            if (active) {
                link.setAttribute("aria-current", "location");
            }
            else {
                link.removeAttribute("aria-current");
            }
        });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");
            if (!href || href[0] !== "#")
                return;
            const target = document.querySelector(href);
            if (!target)
                return;
            event.preventDefault();
            window.scrollTo({
                top: target.getBoundingClientRect().top + window.scrollY - siteHeader.offsetHeight,
                behavior: "smooth",
            });
            history.pushState(null, "", href);
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
        });
    });
}
function validateDemoForm(form) {
    const formData = new FormData(form);
    const err = {};
    const email = getFormDataString(formData, "email");
    if (!email) {
        err.email = "Ingresa tu correo corporativo.";
    }
    else if (!esEmailCorporativo(email)) {
        err.email = "Usa un correo corporativo válido.";
    }
    if (!formData.get("consent")) {
        err.consent = "Debes aceptar el tratamiento de datos.";
    }
    return { ok: Object.keys(err).length === 0, err };
}
function validateNewsletterForm(form) {
    const formData = new FormData(form);
    const err = {};
    const email = getFormDataString(formData, "newsletter-email");
    if (!email) {
        err["newsletter-email"] = "Ingresa tu correo.";
    }
    else if (!esEmailValido(email)) {
        err["newsletter-email"] = "Correo inválido.";
    }
    return { ok: Object.keys(err).length === 0, err };
}
function clearFormErrors(form) {
    form.querySelectorAll("[aria-invalid]").forEach((field) => {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
        const group = field.closest(".form-group");
        const errorEl = group?.querySelector(".form-error");
        if (errorEl)
            errorEl.classList.remove("is-visible");
    });
}
function showFormErrors(form, errors) {
    Object.keys(errors).forEach((name) => {
        const field = form.querySelector(`[name="${name}"]`);
        if (!field)
            return;
        field.setAttribute("aria-invalid", "true");
        const group = field.closest(".form-group");
        const errorEl = group?.querySelector(".form-error");
        const message = errors[name];
        if (errorEl && message) {
            errorEl.textContent = message;
            errorEl.classList.add("is-visible");
            errorEl.id = `${name}-err`;
            field.setAttribute("aria-describedby", errorEl.id);
        }
    });
}
function showFormSuccessToast() {
    const toast = document.createElement("div");
    toast.className = "toast toast--success";
    toast.setAttribute("role", "alert");
    toast.textContent = "¡Gracias! Te contactaremos en menos de 24 horas.";
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => toast.remove(), 5000);
}
function setupSimulatedForm(form, validate) {
    if (!form)
        return;
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        clearFormErrors(form);
        const result = validate(form);
        if (!result.ok) {
            showFormErrors(form, result.err);
            return;
        }
        const btn = form.querySelector('[type="submit"]');
        const originalText = btn?.textContent ?? "";
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Enviando…";
        }
        setTimeout(() => {
            showFormSuccessToast();
            form.reset();
            if (btn) {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        }, 1000);
    });
}
function initForms() {
    setupSimulatedForm(document.getElementById("demo-form"), validateDemoForm);
    setupSimulatedForm(document.getElementById("newsletter-form"), validateNewsletterForm);
}
function initFormsDemo() {
    initHomeNavigation();
    initForms();
}
document.addEventListener("DOMContentLoaded", initFormsDemo);
