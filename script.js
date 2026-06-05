// Año del footer
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Navbar fijo: setear --nav-h según altura real
const nav = document.querySelector(".nav");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

function setNavOffset() {
  const h = nav?.offsetHeight || 64;
  document.documentElement.style.setProperty("--nav-h", `${h}px`);
}

function closeMobileMenu() {
  navLinks?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
  requestAnimationFrame(setNavOffset);
}

window.addEventListener("load", setNavOffset);
window.addEventListener("resize", () => {
  setNavOffset();

  // Si vuelve a desktop, cerramos el menú mobile
  if (window.innerWidth > 900) closeMobileMenu();
});

// Toggle menú mobile
navToggle?.addEventListener("click", (e) => {
  e.stopPropagation();

  const isOpen = navLinks?.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));

  requestAnimationFrame(setNavOffset);
});

// Cerrar menú al hacer click en un link
navLinks?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", closeMobileMenu);
});

// Cerrar menú al hacer click fuera del menú
document.addEventListener("click", (e) => {
  const isMenuOpen = navLinks?.classList.contains("is-open");
  const isClickInsideMenu = navLinks?.contains(e.target);
  const isClickOnToggle = navToggle?.contains(e.target);

  if (isMenuOpen && !isClickInsideMenu && !isClickOnToggle) {
    closeMobileMenu();
  }
});

// Cerrar menú con tecla Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMobileMenu();
});

// Reveal on scroll
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    }),
  { threshold: 0.1 }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Formulario de leads con Make
const leadForm = document.getElementById("leadForm");
const leadSubmit = document.getElementById("leadSubmit");
const formMessage = document.getElementById("formMessage");
const successCard = document.getElementById("successCard");
const newMessageBtn = document.getElementById("newMessageBtn");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getLeadFormFields() {
  if (!leadForm) return [];

  return Array.from(
    leadForm.querySelectorAll("input[required], textarea[required], select[required]")
  );
}

function validateLeadForm() {
  if (!leadForm || !leadSubmit) return;

  const fields = getLeadFormFields();

  const allCompleted = fields.every((field) => field.value.trim() !== "");
  const emailInput = leadForm.querySelector('input[name="email"]');
  const emailOk = emailInput ? isValidEmail(emailInput.value.trim()) : false;

  leadSubmit.disabled = !(allCompleted && emailOk);
}

function showFormMessage(message, type) {
  if (!formMessage) return;

  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function showSuccessCard() {
  if (!successCard || !leadSubmit) return;

  leadSubmit.textContent = "Enviar consulta";
  leadSubmit.disabled = true;

  showFormMessage("", "");

  successCard.hidden = false;
}

function resetLeadFormView() {
  if (!leadForm || !successCard || !leadSubmit) return;

  successCard.hidden = true;

  leadSubmit.hidden = false;
  leadSubmit.textContent = "Enviar consulta";

  leadForm.reset();
  validateLeadForm();
  showFormMessage("", "");
}

if (leadForm) {
  const fields = getLeadFormFields();

  fields.forEach((field) => {
    field.addEventListener("input", validateLeadForm);
    field.addEventListener("change", validateLeadForm);
  });

  validateLeadForm();

  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const webhookUrl = leadForm.dataset.webhookUrl;

    if (!webhookUrl || webhookUrl.includes("PEGÁ_ACÁ")) {
      showFormMessage("Falta configurar el webhook de Make.", "error");
      return;
    }

    // Honeypot anti-spam
    const hiddenWebsite = document.getElementById("leadWebsite");
    if (hiddenWebsite && hiddenWebsite.value.trim() !== "") {
      return;
    }

    const formData = new FormData(leadForm);

    const leadData = {
      nombre: formData.get("nombre")?.trim(),
      email: formData.get("email")?.trim(),
      telefono: formData.get("telefono")?.trim(),
      servicio: formData.get("servicio")?.trim(),
      mensaje: formData.get("mensaje")?.trim(),
      origen: "Web Alejo Calderón",
      pagina: window.location.href,
      fechaEnvio: new Date().toISOString()
    };

    leadSubmit.disabled = true;
    leadSubmit.textContent = "Enviando...";
    showFormMessage("", "");

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(leadData)
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar el formulario.");
      }

      showSuccessCard();
    } catch (error) {
      showFormMessage(
        "Hubo un problema al enviar la consulta. Probá nuevamente o escribime por WhatsApp.",
        "error"
      );

      leadSubmit.disabled = false;
      leadSubmit.textContent = "Enviar consulta";
      validateLeadForm();
    }
  });

  newMessageBtn?.addEventListener("click", resetLeadFormView);
}