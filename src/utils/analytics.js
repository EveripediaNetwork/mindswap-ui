// if changes config, change it on index.html too
function init() {
  window.gtag("js", new Date());
  window.gtag("config", "G-HXR797R20F");
}

function sendEvent(action, data) {
  window.gtag("event", action, data);
}

function sendPageview(path, location) {
  window.gtag("send", "page_view", {
    page_location: location,
    page_path: path,
  });
}

export default {
  init,
  sendEvent,
  sendPageview,
};
