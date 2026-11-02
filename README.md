# Nflix Notice

Plugin Jellyfin pour annonces et notifications visuelles, avec interface compacte intégrée au client web.

## Expérience

- Bouton flottant animé, discret et accessible depuis Jellyfin Web.
- Panneau d'annonces responsive, animations courtes et navigation clavier.
- Console d'administration dédiée: publier, programmer et retirer une annonce.
- Trois niveaux: information, attention et important.
- Texte rendu comme texte, jamais comme HTML fourni par annonce.
- Lecture réservée aux utilisateurs connectés; écriture réservée aux administrateurs.

## État

Dépôt neuf. Cible initiale Jellyfin 12 / .NET 10. Aucun remplacement sur NFLIX avant compilation et validation.

## Développement

Prérequis: .NET 10 SDK.

```sh
dotnet restore
dotnet build -c Release
```

Le projet doit être compilé et testé sur Jellyfin 12 avant publication d'un paquet installable.

## Installation prévue

Après validation, publier paquet dans une release GitHub, installer le plugin, puis activer script client avec JavaScript Injector. URL du script: `/Plugins/NflixNotice/client.js`. Console admin apparaît dans Dashboard > Plugins > Nflix Notice.

L'ancien plugin reste sauvegardé jusqu'à validation complète du remplacement.

## Sécurité et déploiement

Le script client appelle uniquement l'API du même serveur. Il ne contient aucun secret. La page publique du dépôt ne contient pas de binaire prêt à installer.

Le remplacement du plugin actif nécessite une sauvegarde des annonces et réglages, puis redémarrage contrôlé de Jellyfin.
