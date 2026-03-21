export function initMenu({ navButtons, toolSelect, onRouteChange }) {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      onRouteChange(button.dataset.route);
    });
  });

  toolSelect.addEventListener("change", () => {
    onRouteChange(toolSelect.value);
  });
}

export function syncMenuState({ key, navButtons, toolSelect }) {
  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === key);
  });
  toolSelect.value = key;
}
