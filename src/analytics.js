const MEASUREMENT_ID = "G-LGYK0YFJ6L";

let initialized = false;
let lastRoute = null;
let previousLocation = document.referrer;

function initAnalytics() {
  if (initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  // Route mounting owns page views, including the initial view.
  // Also disable history-based page views in GA4 Enhanced Measurement.
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.append(script);
}

export function trackPageView(routeKey, title) {
  if (routeKey === lastRoute) return;
  initAnalytics();

  // Use the resolved route so the default and legacy links share one page.
  const location = new URL(window.location.href);
  location.hash = routeKey;

  window.gtag("event", "page_view", {
    send_to: MEASUREMENT_ID,
    page_title: `${title} | Web Tools`,
    page_location: location.href,
    page_referrer: previousLocation,
  });

  lastRoute = routeKey;
  previousLocation = location.href;
}
