/* ===========================================================================
   SERVICE WORKER — la copie hors ligne de la page.
   Tu n'as normalement jamais besoin de toucher à ce fichier.

   UNE SEULE EXCEPTION : quand tu modifies index.html et que tu republies,
   change le numéro de version ci-dessous (v1 -> v2 -> v3...). Ça force les
   téléphones à récupérer la nouvelle version au lieu de garder l'ancienne.
   =========================================================================== */

const VERSION = "camping-riviere-ouelle-v12";

// Les fichiers gardés sur le téléphone pour fonctionner sans réseau.
const FICHIERS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icone-192.png",
  "./icone-512.png",
  "./apple-touch-icon.png"
];

// À l'installation : on met les fichiers de côté.
self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    caches.open(VERSION)
      .then((reserve) => reserve.addAll(FICHIERS))
      .then(() => self.skipWaiting())
  );
});

// À l'activation : on efface les réserves des anciennes versions.
self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(
        noms.filter((nom) => nom !== VERSION).map((nom) => caches.delete(nom))
      ))
      .then(() => self.clients.claim())
  );
});

// À chaque demande de fichier.
self.addEventListener("fetch", (evenement) => {
  const demande = evenement.request;

  // On ne s'occupe que de nos propres fichiers. Le portail Anémone et le site
  // du camping ne sont JAMAIS mis en réserve : ils doivent toujours être frais.
  if (demande.method !== "GET" ||
      new URL(demande.url).origin !== self.location.origin) {
    return;
  }

  evenement.respondWith(
    // On essaie d'abord le réseau, pour avoir la version la plus récente...
    fetch(demande)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(VERSION).then((reserve) => reserve.put(demande, copie));
        return reponse;
      })
      // ...et s'il n'y a pas de réseau, on sert la copie gardée sur le téléphone.
      .catch(() => caches.match(demande).then((copie) => copie || caches.match("./index.html")))
  );
});
