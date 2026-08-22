"use strict";
function validarFormulario(datos) {
    const errores = {};
    if (datos.nombre.trim().length === 0)
        errores.nombre = "El nombre es requerido";
    if (!esEmailValido(datos.email))
        errores.email = "Email inválido";
    if (datos.mensaje.trim().length < 10)
        errores.mensaje = "El mensaje es muy corto";
    return errores;
}
function limpiarErroresFormulario(form) {
    form.querySelectorAll("input, textarea").forEach((campo) => {
        campo.removeAttribute("aria-invalid");
        campo.removeAttribute("aria-describedby");
    });
    form.querySelectorAll(".form-contacto__error").forEach((el) => {
        el.classList.remove("is-visible");
        el.textContent = "";
    });
    const exito = form.querySelector(".form-contacto__success");
    if (exito) {
        exito.classList.remove("is-visible");
        exito.textContent = "";
    }
}
function mostrarErroresFormulario(form, errores) {
    Object.keys(errores).forEach((nombre) => {
        const campo = form.querySelector(`[name="${nombre}"]`);
        const errorEl = form.querySelector(`#${nombre}-error`);
        if (!campo || !errorEl)
            return;
        campo.setAttribute("aria-invalid", "true");
        campo.setAttribute("aria-describedby", errorEl.id);
        errorEl.textContent = errores[nombre] ?? "";
        errorEl.classList.add("is-visible");
    });
}
function mostrarExitoFormulario(form) {
    const exito = form.querySelector(".form-contacto__success");
    if (!exito)
        return;
    exito.textContent = "¡Mensaje enviado! Te responderemos pronto.";
    exito.classList.add("is-visible");
}
function inicializarFormulario() {
    document.querySelectorAll(".form-contacto").forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            limpiarErroresFormulario(form);
            const nombreInput = form.querySelector('[name="nombre"]');
            const emailInput = form.querySelector('[name="email"]');
            const mensajeInput = form.querySelector('[name="mensaje"]');
            if (!nombreInput || !emailInput || !mensajeInput)
                return;
            const datos = {
                nombre: nombreInput.value,
                email: emailInput.value,
                mensaje: mensajeInput.value,
            };
            const errores = validarFormulario(datos);
            if (Object.keys(errores).length > 0) {
                mostrarErroresFormulario(form, errores);
                return;
            }
            const btn = form.querySelector('[type="submit"]');
            const txt = btn?.textContent ?? "";
            if (btn) {
                btn.disabled = true;
                btn.textContent = "Enviando…";
            }
            setTimeout(() => {
                mostrarExitoFormulario(form);
                form.reset();
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = txt;
                }
            }, 1000);
        });
    });
}
document.addEventListener("DOMContentLoaded", inicializarFormulario);
