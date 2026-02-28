const yearElement = document.getElementById("year");
const toggleButton = document.getElementById("theme-toggle");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

if (toggleButton) {
  toggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
}
