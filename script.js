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