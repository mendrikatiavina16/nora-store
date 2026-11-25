# Nora Store — tous les fichiers du site

Archive complète de la boutique **Nora Store** (Nora Essentials, Antananarivo),
préparée pour être reprise dans **Antigravity**. Elle contient deux versions
du même site :

## 1. `vitrine-statique/` — le site prêt à ouvrir, sans serveur

| Fichier | Rôle |
|---|---|
| `index.html` | Page du site (ouvre-la dans un navigateur : le site fonctionne tel quel) |
| `app.js` | Tout le code du site compilé, avec les 28 photos intégrées |
| `README.md` | Explication de la vitrine et activation de GitHub Pages |

La vitrine affiche le catalogue réel (16 articles) et prend les commandes par
**WhatsApp au 038 56 105 57** : au moment de commander, elle compose un
message détaillé (articles, tailles, couleurs, total, livraison) et l'ouvre
dans WhatsApp. Elle n'a **pas** de comptes clients ni de base de données :
c'est la version déployable telle quelle sur GitHub Pages, Netlify, Vercel
ou n'importe quel hébergement statique.

## 2. `nora-store-source/` — le code source complet de la boutique

C'est le code de la boutique complète (celle qui tourne dans Muse, avec
comptes clients, commandes enregistrées et Gestion boutique).

```
nora-store-source/
├── package.json            Dépendances (React 19, TanStack Query, Drizzle, Zod, Tailwind 4)
├── tsconfig.base.json
├── bunfig.toml
├── space.json              Métadonnées de l'application Muse (informatif hors Muse)
├── client/
│   ├── index.html          Page d'entrée (titre, description, Open Graph)
│   ├── build.mjs           Script de build du client
│   ├── tsconfig.json
│   └── src/
│       ├── App.tsx         TOUTE l'interface : Accueil, Collection, Fiche produit,
│       │                   Atelier custom, Panier, Connexion/Inscription,
│       │                   Profil, Gestion boutique (admin), thèmes par article
│       ├── api.ts          Client d'appel des actions serveur (typé)
│       ├── main.tsx        Point d'entrée React
│       ├── theme.css       Thème de base (couleurs, police Plus Jakarta Sans)
│       └── assets/         Les 28 photos produits (celles déposées par la boutique)
├── server/
│   ├── tsconfig.json
│   └── src/
│       ├── actions.ts      Toute la logique serveur : catalogue, comptes,
│       │                   sessions, commandes, actions admin, données d'amorçage
│       └── schema.ts       Schéma de la base (produits, comptes, sessions, commandes)
└── drizzle/                Migrations SQL de la base de données (0001 → 0003)
```

### Point important pour Antigravity

Le code source utilise le SDK de Muse (`@hatch/space-sdk`) pour les actions
serveur et la base de données : il ne tournera pas tel quel en dehors de
Muse. Dans Antigravity, deux chemins possibles :

- **Le plus simple** : partir de `vitrine-statique/` (site autonome) et
  l'enrichir — c'est du HTML/JS standard, déployable partout.
- **La boutique complète** : garder `client/src/App.tsx` comme interface et
  réécrire la couche serveur de `server/src/actions.ts` avec le backend de
  votre choix (Node/Express, Firebase, Supabase…) en gardant les mêmes
  formes de données que `server/src/schema.ts` et le fichier
  `catalogue.json` ci-joint.

## Les données de la boutique (à conserver telles quelles)

- **Catalogue** : 16 articles — voir `catalogue.json` (mêmes données que
  l'amorçage dans `server/src/actions.ts` : `realSandals`, `realTshirts`,
  `realGourdes`).
- **Prix** : sandales 27 000 Ar (25 000 Ar dès 3 paires, pointures 36-40) ;
  t-shirts imprimés 30 000 Ar (S-XL) ; t-shirt vierge adulte 15 000 Ar
  (S-XL, noir/blanc/rouge) ; t-shirt vierge enfant 10 000 Ar (2 à 14 ans,
  blanc/noir/rouge) ; Gourde Thermo 25 000 Ar (450 ml, 5 couleurs de
  couvercle : crème, noir, bordeaux, brun, bleu marine).
- **Livraison** : dès 4 000 Ar (Antananarivo et provinces).
- **Commandes WhatsApp** : 038 56 105 57 (format international +261385610557).
- **Comptes administrateurs** (voient la Gestion boutique) :
  `essentialsnora@gmail.com` et `mendrikatiavina16@gmail.com` — la liste est
  dans `server/src/actions.ts` (`ADMIN_EMAILS`).
- **Thème dynamique** : les couleurs du site suivent l'article sélectionné
  (accueil = rose clair / fuchsia, celui du T-shirt Rose Citrus affiché en
  premier plan) — logique dans `App.tsx` (`PRODUCT_THEMES`, `COLOR_THEMES`).
- **Photos** : uniquement les photos déposées par la boutique, dans
  `client/src/assets/` — ne pas les remplacer par des images générées.
- **Pixel Meta** : pas encore branché (aucun ID fourni à ce jour) ; les
  événements à envoyer à Meta Business sont : vue de produit, ajout au
  panier, commande (montant + référence).
