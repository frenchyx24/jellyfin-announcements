# Nflix Notice

Plugin Jellyfin pour annonces et notifications visuelles, avec interface compacte intégrée au client web.

## Expérience

- Bouton flottant animé, discret et accessible depuis Jellyfin Web.
- Panneau d'annonces avec transitions courtes, responsive et clavier-friendly.
- Console d'administration dédiée: créer, programmer, publier ou retirer une annonce.
- Niveaux info, attention et urgent; fermeture et durée configurables.
- Texte rendu comme texte, jamais comme HTML fourni par l'annonce.
- API protégée par authentification Jellyfin; écriture réservée aux administrateurs.

## État

Dépôt neuf. Cible initiale Jellyfin 12 / .NET 10. Aucune installation sur NFLIX avant compilation et validation.

## Développement

Prérequis: .NET 10 SDK.

```sh
dotnet restore
dotnet build -c Release
```

Le projet doit être compilé et testé sur Jellyfin 12 avant publication d'un paquet installable.

## Installation prévue

Après validation, publier le paquet dans une release GitHub, ajouter le dépôt Jellyfin, installer Nflix Notice, puis activer le script client. L'ancien plugin reste sauvegardé jusqu'à validation complète du remplacement.

## Sécurité et déploiement

Le script client appelle uniquement l'API du même serveur. Il ne contient aucun secret. Ne configure pas le dépôt avant publication d'un binaire signé ou vérifié par checksum.

Le remplacement du plugin actif nécessite une sauvegarde des annonces et de la configuration, puis un redémarrage contrôlé de Jellyfin.
