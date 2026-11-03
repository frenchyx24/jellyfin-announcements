# Nflix Notice

Plugin Jellyfin 12 pour communiquer avec les utilisateurs de NFLIX, avec dashboards administrateur et utilisateur intégrés au client web.

## Version 0.2.0

### Administration

Ouvrez **Annonces > Administration** depuis le bouton flottant, ou **Dashboard > Plugins > Nflix Notice**.

- Créer, modifier, dupliquer et supprimer une publication.
- Enregistrer un brouillon invisible aux utilisateurs.
- Programmer une publication avec une date de début et une date de fin de popup.
- Archiver et restaurer une publication sans supprimer son historique.
- Catégories : annonce, mise à jour, maintenance, incident.
- Priorités : information, attention, urgent.
- Version ou service concerné, bouton avec lien HTTP/HTTPS, épinglage.
- Activation de la popup indépendante du dashboard.
- Aperçu utilisateur, modèles, recherche, filtres et compteurs.

### Utilisateurs

- Dashboard avec toutes les publications diffusées, dont les anciennes publications terminées ou archivées.
- Filtres par catégorie, recherche et filtre des publications non lues.
- Suivi de lecture séparé par serveur et utilisateur dans le navigateur.
- Popup animée lors des nouvelles publications, bouton permanent avec badge des non lues.
- Interface responsive et respect de la préférence de réduction des animations.

Les annonces de mises à jour sont rédigées par les administrateurs. Cette version ne détecte pas automatiquement les mises à jour du serveur.

## Développement

Prérequis : .NET 10 SDK.

```sh
dotnet restore
dotnet build -c Release
node --check Web/client.js
node --check Web/admin.js
```

## Installation

Activez le script dans JavaScript Injector avec l’URL locale `/Plugins/NflixNotice/client.js`.

Installez le bundle de la release GitHub, puis redémarrez Jellyfin. Rechargez le client web pour charger les nouveaux scripts.

## Sécurité et données

Lectures réservées aux comptes connectés. Toutes les écritures exigent des droits administrateur côté serveur.

Les messages sont rendus en texte, jamais comme HTML. Les liens sont limités à HTTP et HTTPS.

Les brouillons et publications futures ne sont pas exposés dans le dashboard utilisateur. Fermer une popup ne retire pas la publication du dashboard.

Le fichier `data/plugins/NflixNotice/notices.json` est conservé lors des mises à jour. Sauvegardez le plugin et ses données avant installation.
