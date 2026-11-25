# Nora Store — Nora Essentials

Vitrine en ligne officielle de la boutique **Nora Essentials** (Antananarivo, Madagascar).

Articles disponibles :
- **Sandales importées** (pointures 36 à 40) : 27 000 Ar (25 000 Ar dès 3 paires)
- **T-shirts imprimés** (S-XL) : 30 000 Ar
- **T-shirts vierges personnalisables** (adulte et enfant) : dès 10 000 Ar
- **Gourdes isothermes Thermo 450 ml** (5 couleurs) : 25 000 Ar

Livraison rapide à Antananarivo et dans les provinces dès 4 000 Ar.

---

## 🚀 Déploiement sur GitHub Pages

Cette vitrine est 100% statique et prête à être hébergée sans aucun serveur :

1. Rendez-vous dans les **Settings** de votre dépôt GitHub.
2. Allez dans la section **Pages** (dans le menu de gauche).
3. Sous **Build and deployment** :
   - Source : **Deploy from a branch**
   - Branch : **`main`** (ou `master`), dossier : **`/ (root)`**
4. Cliquez sur **Save**.
5. L'adresse publique de votre site sera accessible sous quelques instants à l'adresse :
   `https://<votre-pseudo-github>.github.io/<nom-du-depot>/`

---

## 🛒 Fonctionnement des commandes

La vitrine est entièrement autonome. Les commandes sont générées et envoyées directement par **WhatsApp** au **038 56 105 57** (`+261 38 56 105 57`) avec le récapitulatif complet du panier (articles, tailles, couleurs, quantité, total et coordonnées de livraison).

---

## 📁 Structure du projet

- `index.html` : Fichier principal de la vitrine web.
- `app.js` : Application cliente compilée intégrant l'interface et les 28 photos produits.
- `catalogue.json` : Données structurées des 16 articles du catalogue.
- `source/` : Code source complet de la boutique React 19 + TypeScript.
- `GUIDE-TECHNIQUE.md` : Guide technique et documentation détaillée.
