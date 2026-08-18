"use strict";
function esEmailValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}
function validarFormulario(datos) {
    const errores = [];
    if (datos.nombre.trim().length === 0)
        errores.push("El nombre es requerido");
    if (!esEmailValido(datos.email))
        errores.push("Email inválido");
    if (datos.mensaje.trim().length < 10)
        errores.push("El mensaje es muy corto");
    return errores;
}
function inicializarFormulario() {
    const form = document.querySelector(".form-contacto");
    if (!form)
        return;
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const nombreInput = document.getElementById("nombre");
        const emailInput = document.getElementById("email");
        const mensajeInput = document.getElementById("mensaje");
        const datos = {
            nombre: nombreInput.value,
            email: emailInput.value,
            mensaje: mensajeInput.value,
        };
        const errores = validarFormulario(datos);
        mostrarFeedback(errores);
        if (errores.length === 0) {
            form.reset();
        }
    });
}
document.addEventListener("DOMContentLoaded", inicializarFormulario);
