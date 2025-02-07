const elementsDataAnimation = document.querySelectorAll("[data-animation]");
const animationClass = "animate"; // Definição da classe de animação
const aboutSection = document.getElementById("about");
const menu = document.querySelector(".header__nav");
const menuLinks = document.querySelectorAll(".header__nav a");

console.log(menu);

// Enum de animações
const AnimationTypes = {
  ZOOM: "zoom",
  LEFT: "left",
  RIGHT: "right",
};

// Função que aplica animação de Zoom (executada no carregamento da página)
function applyZoomAnimation(element) {
  element.classList.add(animationClass);
}

// Função que aplica animação de Slide (para os tipos left e right)
function applySlideAnimation(element) {
  if (element.getBoundingClientRect().top < window.innerHeight * 0.6) {
    element.classList.add(animationClass);
  } else {
    element.classList.remove(animationClass);
  }
}

// Função central que aplica a animação de acordo com o tipo
function applyAnimation(element, type) {
  switch (type) {
    case AnimationTypes.ZOOM:
      applyZoomAnimation(element);
      break;
    case AnimationTypes.LEFT:
    case AnimationTypes.RIGHT:
      applySlideAnimation(element, type);
      break;
    default:
      console.warn("Tipo de animação desconhecido:", type);
  }
}

// Animação de Zoom ao carregar a página
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-animation]").forEach((element) => {
    if (element.dataset.animation === AnimationTypes.ZOOM) {
      applyAnimation(element, AnimationTypes.ZOOM);
    }
  });
});

// Animação de Scroll para Left e Right
window.addEventListener("scroll", () => {
  document.querySelectorAll("[data-animation]").forEach((element) => {
    if (element.dataset.animation !== AnimationTypes.ZOOM) {
      applyAnimation(element, element.dataset.animation);
    }
  });
});

window.addEventListener("scroll", () => {
  const aboutTop = aboutSection.getBoundingClientRect().top;

  console.log(aboutTop);

  if (aboutTop <= window.innerHeight * 0.1) {
    menu.classList.add("scrolled");
  } else {
    menu.classList.remove("scrolled");
  }
});

menuLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault(); // Impede o comportamento padrão do link

    const targetId = link.getAttribute("href").substring(1); // Obtém o ID da seção
    const targetSection = document.getElementById(targetId);

    // Faz o scroll suave até a seção
    if (targetSection) {
      window.scrollTo({
        top: targetSection.offsetTop - 60, // Ajuste o valor para considerar a altura do menu fixo
        behavior: "smooth",
      });
    }
  });
});
