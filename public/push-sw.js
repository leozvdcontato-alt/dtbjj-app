self.addEventListener("push", (event) => {
  let data;
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text?.() || "" };
  }

  const title = data.title || "DTBJJ APP";
  const options = {
    body: data.body || "Você tem uma nova atualização.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "dtbjj-app",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL(
    event.notification.data?.url || "/",
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((janelas) => {
        for (const janela of janelas) {
          if ("focus" in janela) {
            janela.navigate(destino);
            return janela.focus();
          }
        }

        return self.clients.openWindow
          ? self.clients.openWindow(destino)
          : undefined;
      })
  );
});
