interface ValidationResult<T extends string = string> {
  ok: boolean;
  err: Partial<Record<T, string>>;
}

type DemoFormFields = "email" | "consent";
type NewsletterFormFields = "newsletter-email";

type FormValidator<T extends string = string> = (form: HTMLFormElement) => ValidationResult<T>;

function getFormDataString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function initHomeNavigation(): void {
  const header = document.querySelector<HTMLElement>(".header");
  if (!header) return;

  const navLinks = document.querySelectorAll<HTMLAnchorElement>(".nav__link, .nav__link--drawer");
  const sections = document.querySelectorAll<HTMLElement>("section[id]");

  const siteHeader = header;

  function onScroll(): void {
    const scrollPos = window.scrollY + siteHeader.offsetHeight + 100;
    let current = "";

    sections.forEach((section) => {
      if (section.offsetTop <= scrollPos) current = section.id;
    });

    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${current}`;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  navLinks.forEach((link) => {
    link.addEventListener("click", (event: MouseEvent): void => {
      const href = link.getAttribute("href");
      if (!href || href[0] !== "#") return;

      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

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

function validateDemoForm(form: HTMLFormElement): ValidationResult<DemoFormFields> {
  const formData = new FormData(form);
  const err: Partial<Record<DemoFormFields, string>> = {};
  const email = getFormDataString(formData, "email");

  if (!email) {
    err.email = "Ingresa tu correo corporativo.";
  } else if (!esEmailCorporativo(email)) {
    err.email = "Usa un correo corporativo válido.";
  }

  if (!formData.get("consent")) {
    err.consent = "Debes aceptar el tratamiento de datos.";
  }

  return { ok: Object.keys(err).length === 0, err };
}

function validateNewsletterForm(form: HTMLFormElement): ValidationResult<NewsletterFormFields> {
  const formData = new FormData(form);
  const err: Partial<Record<NewsletterFormFields, string>> = {};
  const email = getFormDataString(formData, "newsletter-email");

  if (!email) {
    err["newsletter-email"] = "Ingresa tu correo.";
  } else if (!esEmailValido(email)) {
    err["newsletter-email"] = "Correo inválido.";
  }

  return { ok: Object.keys(err).length === 0, err };
}

function clearFormErrors(form: HTMLFormElement): void {
  form.querySelectorAll<HTMLElement>("[aria-invalid]").forEach((field) => {
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");

    const group = field.closest(".form-group");
    const errorEl = group?.querySelector<HTMLElement>(".form-error");
    if (errorEl) errorEl.classList.remove("is-visible");
  });
}

function showFormErrors(form: HTMLFormElement, errors: Partial<Record<string, string>>): void {
  Object.keys(errors).forEach((name) => {
    const field = form.querySelector<HTMLElement>(`[name="${name}"]`);
    if (!field) return;

    field.setAttribute("aria-invalid", "true");

    const group = field.closest(".form-group");
    const errorEl = group?.querySelector<HTMLElement>(".form-error");
    const message = errors[name];

    if (errorEl && message) {
      errorEl.textContent = message;
      errorEl.classList.add("is-visible");
      errorEl.id = `${name}-err`;
      field.setAttribute("aria-describedby", errorEl.id);
    }
  });
}

function showFormSuccessToast(): void {
  const toast = document.createElement("div");
  toast.className = "toast toast--success";
  toast.setAttribute("role", "alert");
  toast.textContent = "¡Gracias! Te contactaremos en menos de 24 horas.";
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(() => toast.remove(), 5000);
}

function setupSimulatedForm(form: HTMLFormElement | null, validate: FormValidator): void {
  if (!form) return;

  form.addEventListener("submit", (event: SubmitEvent): void => {
    event.preventDefault();
    clearFormErrors(form);

    const result = validate(form);
    if (!result.ok) {
      showFormErrors(form, result.err);
      return;
    }

    const btn = form.querySelector<HTMLButtonElement>('[type="submit"]');
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

function initForms(): void {
  setupSimulatedForm(document.getElementById("demo-form") as HTMLFormElement | null, validateDemoForm);
  setupSimulatedForm(
    document.getElementById("newsletter-form") as HTMLFormElement | null,
    validateNewsletterForm
  );
}

function initFormsDemo(): void {
  initHomeNavigation();
  initForms();
}

document.addEventListener("DOMContentLoaded", initFormsDemo);
