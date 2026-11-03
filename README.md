# Nflix Notice

Plugin Jellyfin pour annonces et notifications visuelles, avec interface compacte intégrée au client web.

## Expérience

- Bouton flottant animé, discret et accessible depuis Jellyfin Web.
- Toast animé à l'arrivée d'une annonce, plus panneau responsive.
- Console d'administration: publier, programmer et retirer une annonce.
- Trois niveaux: information, attention et important.
- Texte rendu comme texte, jamais comme HTML fourni par annonce.
- Lecture réservée aux utilisateurs connectés; écriture réservée aux administrateurs.

## Version 0.1.1

Build testé sur .NET 10 et ciblant Jellyfin 12. Remplacement sur NFLIX en attente d'installation contrôlée.

## Développement

Prérequis: .NET 10 SDK.

```sh
dotnet restore
dotnet build -c Release
```

## Installation

Le script client doit être activé dans JavaScript Injector avec l'URL locale: `/Plugins/NflixNotice/client.js`. La console admin apparaît dans Dashboard > Plugins > Nflix Notice.

Le bundle d'installation accompagne la release GitHub. Vérifie le build et le checksum avant installation.

## Sécurité et déploiement

Le script client appelle uniquement l'API du même serveur. Les lectures exigent une connexion Jellyfin; écritures exigent droits administrateur.

L'ancien plugin et ses annonces sont sauvegardés sur NFLIX avant remplacement. Redémarrage Jellyfin requis.
