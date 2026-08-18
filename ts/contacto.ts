interface ContactForm {
  nombre: string;
  email: string;
  mensaje: string;
}

function esEmailValido(valor: string): valor is string {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function validarFormulario(datos: ContactForm): string[] {
  const errores: string[] = [];

  if (datos.nombre.trim().length === 0) errores.push("El nombre es requerido");
  if (!esEmailValido(datos.email)) errores.push("Email inválido");
  if (datos.mensaje.trim().length < 10) errores.push("El mensaje es muy corto");

  return errores;
}

function inicializarFormulario(): void {
  const form = document.querySelector<HTMLFormElement>(".form-contacto");
  if (!form) return;

  form.addEventListener("submit", function (event: Event): void {
    event.preventDefault();

    const nombreInput = document.getElementById("nombre") as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const mensajeInput = document.getElementById("mensaje") as HTMLTextAreaElement;

    const datos: ContactForm = {
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
