import { initMenu, syncMenuState } from "./src/menu.js";
import { getRoute, routes } from "./src/routes.js";

const APP_VERSION = "1.3.1";

const root = document.querySelector("#tool-root");
const titleNode = document.querySelector("#page-title");
const descriptionNode = document.querySelector("#page-description");
const navButtons = [...document.querySelectorAll(".nav-link")];
const toolSelect = document.querySelector("#tool-select");
const versionNode = document.querySelector("#app-version");

versionNode.textContent = APP_VERSION;

window.addEventListener("hashchange", mountRoute);

initMenu({
  navButtons,
  toolSelect,
  onRouteChange: (routeKey) => {
    window.location.hash = routeKey;
  },
});

mountRoute();

function mountRoute() {
  const { key, route } = getRoute(window.location.hash);
  const template = document.querySelector(`#${route.templateId}`);

  titleNode.textContent = route.title;
  descriptionNode.textContent = route.description;
  syncMenuState({ key, navButtons, toolSelect });

  root.innerHTML = "";
  root.append(template.content.cloneNode(true));
  route.render();
}

export { routes };
