interface ContactForm {
  nombre: string;
  email: string;
  mensaje: string;
}

type FieldErrors = Partial<Record<keyof ContactForm, string>>;

function validarFormulario(datos: ContactForm): FieldErrors {
  const errores: FieldErrors = {};

  if (datos.nombre.trim().length === 0) errores.nombre = "El nombre es requerido";
  if (!esEmailValido(datos.email)) errores.email = "Email inválido";
  if (datos.mensaje.trim().length < 10) errores.mensaje = "El mensaje es muy corto";

  return errores;
}

function limpiarErroresFormulario(form: HTMLFormElement): void {
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach((campo) => {
    campo.removeAttribute("aria-invalid");
    campo.removeAttribute("aria-describedby");
  });

  form.querySelectorAll<HTMLElement>(".form-contacto__error").forEach((el) => {
    el.classList.remove("is-visible");
    el.textContent = "";
  });

  const exito = form.querySelector<HTMLElement>(".form-contacto__success");
  if (exito) {
    exito.classList.remove("is-visible");
    exito.textContent = "";
  }
}

function mostrarErroresFormulario(form: HTMLFormElement, errores: FieldErrors): void {
  (Object.keys(errores) as Array<keyof ContactForm>).forEach((nombre) => {
    const campo = form.querySelector<HTMLElement>(`[name="${nombre}"]`);
    const errorEl = form.querySelector<HTMLElement>(`#${nombre}-error`);
    if (!campo || !errorEl) return;

    campo.setAttribute("aria-invalid", "true");
    campo.setAttribute("aria-describedby", errorEl.id);
    errorEl.textContent = errores[nombre] ?? "";
    errorEl.classList.add("is-visible");
  });
}

function mostrarExitoFormulario(form: HTMLFormElement): void {
  const exito = form.querySelector<HTMLElement>(".form-contacto__success");
  if (!exito) return;

  exito.textContent = "¡Mensaje enviado! Te responderemos pronto.";
  exito.classList.add("is-visible");
}

function inicializarFormulario(): void {
  document.querySelectorAll<HTMLFormElement>(".form-contacto").forEach((form) => {
    form.addEventListener("submit", (event: SubmitEvent): void => {
      event.preventDefault();
      limpiarErroresFormulario(form);

      const nombreInput = form.querySelector<HTMLInputElement>('[name="nombre"]');
      const emailInput = form.querySelector<HTMLInputElement>('[name="email"]');
      const mensajeInput = form.querySelector<HTMLTextAreaElement>('[name="mensaje"]');
      if (!nombreInput || !emailInput || !mensajeInput) return;

      const datos: ContactForm = {
        nombre: nombreInput.value,
        email: emailInput.value,
        mensaje: mensajeInput.value,
      };

      const errores = validarFormulario(datos);
      if (Object.keys(errores).length > 0) {
        mostrarErroresFormulario(form, errores);
        // Qué campos fallaron, nunca su contenido: sirve para detectar
        // fricción en el formulario sin recoger datos de la persona.
        trackEvent("contact_form_rejected", {
          invalid_fields: Object.keys(errores).sort().join(","),
          invalid_field_count: Object.keys(errores).length,
        });
        return;
      }

      const btn = form.querySelector<HTMLButtonElement>('[type="submit"]');
      const txt = btn?.textContent ?? "";
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Enviando…";
      }

      // El envío es simulado (no hay backend): se mide la intención de
      // contacto, que es lo que la validación necesita saber. Ni nombre, ni
      // correo, ni mensaje salen del navegador.
      trackEvent("contact_form_submitted", { is_simulated: true });

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
