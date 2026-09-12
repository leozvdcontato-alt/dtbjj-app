self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text?.() || "" };
  }

  const title = data.title || "Tatame Pro";
  const options = {
    body: data.body || "Você tem uma nova atualização.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "tatame-pro",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if ("focus" in janela) {
          janela.navigate(destino);
          return janela.focus();
        }
      }
      return clients.openWindow ? clients.openWindow(destino) : undefined;
    })
  );
});
