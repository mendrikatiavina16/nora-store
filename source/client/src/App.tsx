import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaTopScrim, setFailureNoticeText } from "@hatch/space-sdk/client";
import { api, type ApiResponse } from "./api";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import type { Actions } from "../../server/src/actions";

const FIELDS = actionFields<typeof Actions>();

import heroImg from "./assets/tshirt-rose-citrus.jpg";
import sandalesMarron from "./assets/sandales-marron.jpg";
import sandalesCamel from "./assets/sandales-camel.jpg";
import sandalesNoir from "./assets/sandales-noir.jpg";
import sandalesBeige from "./assets/sandales-beige.jpg";
import sandalesMarronMaille from "./assets/sandales-marron-maille.jpg";
import sandalesArgentStrass from "./assets/sandales-argent-strass.jpg";
import sandalesDoreStrass from "./assets/sandales-dore-strass.jpg";
import sandalesNoirAjoure from "./assets/sandales-noir-ajoure.jpg";
import sandalesMotifBoucles from "./assets/sandales-motif-boucles.jpg";
import sandalesBlancAjoure from "./assets/sandales-blanc-ajoure.jpg";
import sandalesNoirMaille from "./assets/sandales-noir-maille.jpg";
import sandalesBlancDore from "./assets/sandales-blanc-dore.jpg";
import tshirtRoseCitrus from "./assets/tshirt-rose-citrus.jpg";
import tshirtBlancLobster from "./assets/tshirt-blanc-lobster.jpg";
import tshirtJauneCitrus from "./assets/tshirt-jaune-citrus.jpg";
import tshirtLilasDolceVita from "./assets/tshirt-lilas-dolce-vita.jpg";
import tshirtNoirCoeur from "./assets/tshirt-noir-coeur.jpg";
import tshirtViergeNoir from "./assets/tshirt-vierge-noir.jpg";
import tshirtViergeBlanc from "./assets/tshirt-vierge-blanc.jpg";
import tshirtViergeRouge from "./assets/tshirt-vierge-rouge.jpg";
import tshirtEnfantBlanc from "./assets/tshirt-enfant-blanc.jpg";
import tshirtEnfantNoir from "./assets/tshirt-enfant-noir.jpg";
import tshirtEnfantRouge from "./assets/tshirt-enfant-rouge.jpg";
import gourdeCreme from "./assets/gourde-creme.jpg";
import gourdeNoir from "./assets/gourde-noir.jpg";
import gourdeBordeaux from "./assets/gourde-bordeaux.jpg";
import gourdeBrun from "./assets/gourde-brun.jpg";
import gourdeBleu from "./assets/gourde-bleu.jpg";

setFailureNoticeText((_error, message) => message);

// Accès au stockage local protégé : dans l'aperçu Muse, la page tourne
// dans une iframe sandboxée où `localStorage` peut lever une SecurityError
// dès la lecture. Un accès non protégé au premier rendu faisait échouer
// tout l'arbre React (page blanche, l'appli « ne s'ouvre pas »). Ces
// helpers retombent sur une mémoire de session quand le stockage du
// navigateur est inaccessible, pour que l'appli s'ouvre toujours.
const memoryStore = new Map<string, string>();

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memoryStore.get(key) ?? null;
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

function storageSet(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // Stockage navigateur inaccessible : la copie mémoire suffit pour la session.
  }
}

function storageRemove(key: string): void {
  memoryStore.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    // Stockage navigateur inaccessible : rien d'autre à faire.
  }
}

const IMAGES: Record<string, string> = {
  "sandales-marron": sandalesMarron,
  "sandales-camel": sandalesCamel,
  "sandales-noir": sandalesNoir,
  "sandales-beige": sandalesBeige,
  "sandales-marron-maille": sandalesMarronMaille,
  "sandales-argent-strass": sandalesArgentStrass,
  "sandales-dore-strass": sandalesDoreStrass,
  "sandales-noir-ajoure": sandalesNoirAjoure,
  "sandales-motif-boucles": sandalesMotifBoucles,
  "sandales-blanc-ajoure": sandalesBlancAjoure,
  "sandales-noir-maille": sandalesNoirMaille,
  "sandales-blanc-dore": sandalesBlancDore,
  "tshirt-rose-citrus": tshirtRoseCitrus,
  "tshirt-blanc-lobster": tshirtBlancLobster,
  "tshirt-jaune-citrus": tshirtJauneCitrus,
  "tshirt-lilas-dolce-vita": tshirtLilasDolceVita,
  "tshirt-noir-coeur": tshirtNoirCoeur,
  "tshirt-vierge-noir": tshirtViergeNoir,
  "tshirt-vierge-blanc": tshirtViergeBlanc,
  "tshirt-vierge-rouge": tshirtViergeRouge,
  "tshirt-enfant-blanc": tshirtEnfantBlanc,
  "tshirt-enfant-noir": tshirtEnfantNoir,
  "tshirt-enfant-rouge": tshirtEnfantRouge,
  "gourde-creme": gourdeCreme,
  "gourde-noir": gourdeNoir,
  "gourde-bordeaux": gourdeBordeaux,
  "gourde-brun": gourdeBrun,
  "gourde-bleu": gourdeBleu,
};

// Produits présentés en une seule fiche avec une photo par couleur :
// t-shirts vierges (adulte et enfant, noir/blanc/rouge, à plat sur le même
// tapis que les imprimés) et la gourde thermo (5 couleurs de couvercle :
// crème, noir, bordeaux, brun, bleu marine). La propriétaire a déposé une
// vraie photo par couleur. Cette table fait correspondre chaque couleur à
// sa photo, pour que toutes les photos déposées soient visibles et
// sélectionnables — fiche produit (miniatures + grande photo), cartes de
// la Collection et aperçu de l'Atelier. Aucune autre photo n'est générée
// ni substituée.
const COLOR_PHOTOS: Record<string, Record<string, string>> = {
  "tshirt-vierge-noir": {
    Noir: "tshirt-vierge-noir",
    Blanc: "tshirt-vierge-blanc",
    Rouge: "tshirt-vierge-rouge",
  },
  "tshirt-enfant-blanc": {
    Blanc: "tshirt-enfant-blanc",
    Noir: "tshirt-enfant-noir",
    Rouge: "tshirt-enfant-rouge",
  },
  "gourde-creme": {
    Crème: "gourde-creme",
    Noir: "gourde-noir",
    Bordeaux: "gourde-bordeaux",
    Brun: "gourde-brun",
    "Bleu marine": "gourde-bleu",
  },
};

function colorImageKey(
  product: Pick<Product, "imageKey">,
  color: string | null,
): string | null {
  if (!product.imageKey) return null;
  const map = COLOR_PHOTOS[product.imageKey];
  if (color && map && map[color]) return map[color];
  return product.imageKey;
}

function variantPhotos(
  product: Pick<Product, "imageKey" | "colors">,
): Array<{ color: string; imageKey: string }> {
  const map = product.imageKey ? COLOR_PHOTOS[product.imageKey] : undefined;
  if (!map) return [];
  const out: Array<{ color: string; imageKey: string }> = [];
  for (const c of product.colors) {
    const key = map[c];
    if (key) out.push({ color: c, imageKey: key });
  }
  return out;
}

/* ---------- Thèmes par article ----------
   Comme précisé dans l'export Stitch d'origine, le thème de la boutique
   change selon l'article sélectionné : les couleurs d'accent, le fond et
   les halos de page prennent les couleurs de l'article mis en avant.
   L'accueil affiche le T-shirt Rose Citrus au premier plan → thème rose /
   fuchsia. La fiche produit et l'Atelier suivent l'article ouvert et,
   pour les fiches multi-couleurs (t-shirts vierges, gourde thermo), la
   couleur choisie. Hors article (panier, profil…), le thème par défaut
   de la boutique (vert émeraude / violet) s'applique. */
type ThemeVars = {
  accent: string;
  accent2: string;
  soft: string; // teinte douce (--mint) : badges, fonds d'icônes
  bg: string;
  border: string;
  glow1: string;
  glow2: string;
};

const DEFAULT_THEME: ThemeVars = {
  accent: "#0b5136",
  accent2: "#5b36de",
  soft: "#d9f5e3",
  bg: "#f4f2fb",
  border: "#e7e4f2",
  glow1: "rgba(91, 54, 222, 0.10)",
  glow2: "rgba(11, 81, 54, 0.12)",
};

const NOIR_THEME: ThemeVars = {
  accent: "#2a2a31",
  accent2: "#55565e",
  soft: "#e8e8ec",
  bg: "#f3f3f6",
  border: "#e0e0e6",
  glow1: "rgba(42, 42, 49, 0.10)",
  glow2: "rgba(42, 42, 49, 0.14)",
};

const DORE_THEME: ThemeVars = {
  accent: "#b45309",
  accent2: "#92400e",
  soft: "#fdf0d2",
  bg: "#fdf8ec",
  border: "#f0e0b8",
  glow1: "rgba(180, 83, 9, 0.10)",
  glow2: "rgba(146, 64, 14, 0.12)",
};

// Thèmes des couleurs choisissables sur les fiches multi-couleurs
// (t-shirts vierges adulte/enfant, gourde thermo).
const COLOR_THEMES: Record<string, ThemeVars> = {
  Noir: NOIR_THEME,
  Blanc: {
    accent: "#57534e",
    accent2: "#a16207",
    soft: "#efedea",
    bg: "#faf8f6",
    border: "#e7e2dc",
    glow1: "rgba(161, 98, 7, 0.08)",
    glow2: "rgba(87, 83, 78, 0.10)",
  },
  Rouge: {
    accent: "#c2261b",
    accent2: "#7f1d1d",
    soft: "#fdeae8",
    bg: "#fdf4f3",
    border: "#f6d9d5",
    glow1: "rgba(194, 38, 27, 0.10)",
    glow2: "rgba(194, 38, 27, 0.12)",
  },
  Crème: {
    accent: "#9a6a25",
    accent2: "#7c4a21",
    soft: "#f7ecd7",
    bg: "#fbf7ee",
    border: "#eee2cb",
    glow1: "rgba(154, 106, 37, 0.10)",
    glow2: "rgba(124, 74, 33, 0.12)",
  },
  Bordeaux: {
    accent: "#7f1d2d",
    accent2: "#5b1220",
    soft: "#f9e6ea",
    bg: "#fbf3f5",
    border: "#f0d5db",
    glow1: "rgba(127, 29, 45, 0.10)",
    glow2: "rgba(127, 29, 45, 0.12)",
  },
  Brun: {
    accent: "#7c4a21",
    accent2: "#5d3a1a",
    soft: "#f3e6d5",
    bg: "#faf4ec",
    border: "#e9dcc8",
    glow1: "rgba(124, 74, 33, 0.10)",
    glow2: "rgba(124, 74, 33, 0.12)",
  },
  "Bleu marine": {
    accent: "#1e3a5f",
    accent2: "#0f2748",
    soft: "#e2ebf6",
    bg: "#f1f5fa",
    border: "#d5e0ee",
    glow1: "rgba(30, 58, 95, 0.10)",
    glow2: "rgba(30, 58, 95, 0.12)",
  },
};

// Thème propre à chaque article, d'après les couleurs de sa photo.
const PRODUCT_THEMES: Record<string, ThemeVars> = {
  // L'article vedette de l'accueil : rose bonbon de l'imprimé Citrus.
  "tshirt-rose-citrus": {
    accent: "#c2185b",
    accent2: "#e91e63",
    soft: "#fde3ee",
    bg: "#fdf1f6",
    border: "#f6d3e2",
    glow1: "rgba(233, 30, 99, 0.12)",
    glow2: "rgba(194, 24, 91, 0.12)",
  },
  "tshirt-blanc-lobster": {
    accent: "#cf3f2e",
    accent2: "#d97706",
    soft: "#fdeae4",
    bg: "#fdf5f1",
    border: "#f5d9d0",
    glow1: "rgba(207, 63, 46, 0.10)",
    glow2: "rgba(217, 119, 6, 0.12)",
  },
  "tshirt-jaune-citrus": {
    accent: "#b45309",
    accent2: "#65a30d",
    soft: "#fdf3d3",
    bg: "#fffaf0",
    border: "#f3e5bd",
    glow1: "rgba(245, 197, 66, 0.16)",
    glow2: "rgba(180, 83, 9, 0.10)",
  },
  "tshirt-lilas-dolce-vita": {
    accent: "#7c3aed",
    accent2: "#c026d3",
    soft: "#efe9fd",
    bg: "#f7f4fe",
    border: "#e0d7f7",
    glow1: "rgba(124, 58, 237, 0.10)",
    glow2: "rgba(192, 38, 211, 0.10)",
  },
  "tshirt-noir-coeur": {
    accent: "#d92b20",
    accent2: "#26262b",
    soft: "#fdeae8",
    bg: "#fdf4f3",
    border: "#f6d5d1",
    glow1: "rgba(217, 43, 32, 0.10)",
    glow2: "rgba(38, 38, 43, 0.12)",
  },
  "sandales-marron-maille": {
    accent: "#8a4b21",
    accent2: "#b45309",
    soft: "#f3e4d2",
    bg: "#faf4ec",
    border: "#ead9c3",
    glow1: "rgba(138, 75, 33, 0.10)",
    glow2: "rgba(180, 83, 9, 0.12)",
  },
  "sandales-argent-strass": {
    accent: "#5b6b7f",
    accent2: "#7d8ea3",
    soft: "#e8edf2",
    bg: "#f4f6f9",
    border: "#dbe2ea",
    glow1: "rgba(91, 107, 127, 0.10)",
    glow2: "rgba(125, 142, 163, 0.12)",
  },
  "sandales-dore-strass": DORE_THEME,
  "sandales-noir-ajoure": NOIR_THEME,
  "sandales-motif-boucles": {
    accent: "#374151",
    accent2: "#b45309",
    soft: "#e9eaee",
    bg: "#f4f4f6",
    border: "#dedfe4",
    glow1: "rgba(55, 65, 81, 0.10)",
    glow2: "rgba(180, 83, 9, 0.10)",
  },
  "sandales-blanc-ajoure": {
    accent: "#6d6455",
    accent2: "#b45309",
    soft: "#f0ede8",
    bg: "#faf8f5",
    border: "#e6e1d9",
    glow1: "rgba(109, 100, 85, 0.08)",
    glow2: "rgba(180, 83, 9, 0.10)",
  },
  "sandales-noir-maille": NOIR_THEME,
  "sandales-blanc-dore": DORE_THEME,
  // Anciennes clés sandales (catalogue d'origine).
  "sandales-marron": {
    accent: "#8a4b21",
    accent2: "#b45309",
    soft: "#f3e4d2",
    bg: "#faf4ec",
    border: "#ead9c3",
    glow1: "rgba(138, 75, 33, 0.10)",
    glow2: "rgba(180, 83, 9, 0.12)",
  },
  "sandales-camel": DORE_THEME,
  "sandales-noir": NOIR_THEME,
  "sandales-beige": {
    accent: "#96702a",
    accent2: "#7c4a21",
    soft: "#f5ecd9",
    bg: "#faf6ee",
    border: "#eadfc6",
    glow1: "rgba(150, 112, 42, 0.10)",
    glow2: "rgba(124, 74, 33, 0.10)",
  },
};

const CATEGORY_THEMES: Record<Category, ThemeVars> = {
  sandales: PRODUCT_THEMES["sandales-marron-maille"] ?? DEFAULT_THEME,
  tshirts: DEFAULT_THEME,
  gourdes: COLOR_THEMES["Crème"] ?? DEFAULT_THEME,
};

function themeForProduct(
  product: Pick<Product, "imageKey" | "colors" | "category">,
  color?: string | null,
): ThemeVars {
  // Fiches multi-couleurs : la couleur choisie (ou la première, par
  // défaut) pilote le thème — la photo et le thème changent ensemble.
  if (product.imageKey && COLOR_PHOTOS[product.imageKey]) {
    const c = color ?? product.colors[0];
    if (c && COLOR_THEMES[c]) return COLOR_THEMES[c];
  }
  const own = product.imageKey ? PRODUCT_THEMES[product.imageKey] : undefined;
  if (own) return own;
  return CATEGORY_THEMES[product.category] ?? DEFAULT_THEME;
}

type Product = ApiResponse<typeof api, "listProducts">["products"][number];
type Order = ApiResponse<typeof api, "myOrders">["orders"][number];
type Category = Product["category"];

// Mode « vitrine statique » : actif uniquement dans l'export publié sur
// GitHub Pages (le fichier d'export porte la balise meta « nora-static » ;
// l'application Muse ne la porte jamais). Sans serveur, la vitrine
// affiche le catalogue réel ci-dessous — copie des fiches de la boutique —
// et les commandes partent par WhatsApp, comme les commandes par message
// privé de la boutique. Comptes, panier enregistré et Gestion boutique
// restent propres à l'application Muse.
const STATIC_MODE =
  typeof document !== "undefined" &&
  document.querySelector('meta[name="nora-static"]') != null;

const STATIC_PRODUCTS: Product[] = [
  { id: -1, name: "Sandales Marron Maille", category: "sandales", tagline: "Maille tressée · Médaillon doré", description: "Mules importées en maille tressée marron, finies par un médaillon doré. Le modèle mis en avant en boutique, doux et léger au pied.", priceAr: 27000, bulkPriceAr: 25000, bulkMinQty: 3, sizes: ["36", "37", "38", "39", "40"], colors: ["Marron"], imageKey: "sandales-marron-maille", badge: "Populaire", rating: null, reviews: 0, customizable: false, active: true, sortOrder: 0 },
  { id: -2, name: "Sandales Argent Strass", category: "sandales", tagline: "Brides torsadées · Strass scintillants", description: "Sandales plates importées argentées : brides torsadées et large bride sertie de strass. L'éclat qu'il faut pour illuminer une tenue.", priceAr: 27000, bulkPriceAr: 25000, bulkMinQty: 3, sizes: ["36", "37", "38", "39", "40"], colors: ["Argent"], imageKey: "sandales-argent-strass", badge: null, rating: null, reviews: 0, customizable: false, active: true, sortOrder: 1 },
  { id: -3, name: "Sandales Doré Strass", category: "sandales", tagline: "Brides torsadées · Strass scintillants", description: "Sandales plates importées dorées : brides torsadées et large bride sertie de strass. Une touche de lumière, du jour comme du soir.", priceAr: 27000, bulkPriceAr: 25000, bulkMinQty: 3, sizes: ["36", "37", "38", "39", "40"], colors: ["Doré"], imageKey: "sandales-dore-strass", badge: null, rating: null, reviews: 0, customizable: false, active: true, sortOrder: 2 },
  { id: -4, name: "Sandales Noir Ajouré", category: "sandales", tagline: "Découpes géométriques · Bride arrière", description: "Sandales plates importées noires, empeigne ajourée aux motifs géométriques et bride arrière. Aérées et faciles à porter toute la journée.", priceAr: 27000, bulkPriceAr: 25000, bulkMinQty: 3, sizes: ["36", "37", "38", "39", "40"], colors: ["Noir"], imageKey: "sandales-noir-ajoure", badge: null, rating: null, reviews: 0, customizable: false, active: true, sortOrder: 3 },
  { id: -5, name: "Sandales Motif Boucles", category: "sandales", tagline: "Motif noir & blanc · Semelle liège", description: "Mules importées en tissu à motif noir et blanc, doubles boucles dorées ajustables et semelle effet liège. Le modèle décontracté qui ne passe pas inaperçu.", priceAr: 27000, bulkPriceAr: 25000, bulkMinQty: 3, sizes: ["36", "37", "38", "39", "40"], colors: ["Noir & blanc"], imageKey: "sandales-motif-boucles", badge: null, rating: null, reviews: 0, customizable: false, active: true, sortOrder: 4 },
  { id: -6, name: "Sandales Blanc Ajouré", category: "sandales", tagline: "Découpes géométriques · Bride arrière", description: "Sandales plates importées blanches, empeigne ajourée aux motifs géométriques et bride arrière. Fraîches et lumineuses, elles vont avec tout.", priceAr: 27000, bulkPriceAr: 25000, bulkMinQty: 3, sizes: ["36", "37", "38", "39", "40"], colors: ["Blanc"], imageKey: "sandales-blanc-ajoure", badge: null, rating: null, reviews: 0, customizable: false, active: true, sortOrder: 5 },
  { id: -7, name: "Sandales Noir Maille", category: "sandales", tagline: "Maille fine · Médaillon doré", description: "Mules importées noires en maille fine, finies par un médaillon doré. Élégantes et légères, elles habillent le pied en douceur.", priceAr: 27000, bulkPriceAr: 25000, bulkMinQty: 3, sizes: ["36", "37", "38", "39", "40"], colors: ["Noir"], imageKey: "sandales-noir-maille", badge: null, rating: null, reviews: 0, customizable: false, active: true, sortOrder: 6 },
  { id: -8, name: "Sandales Blanc & Doré", category: "sandales", tagline: "Brides tressées · Finitions dorées", description: "Sandales plates importées à brides croisées blanches et dorées, dont une tressée. Le duo blanc-doré qui va avec toutes les tenues.", priceAr: 27000, bulkPriceAr: 25000, bulkMinQty: 3, sizes: ["36", "37", "38", "39", "40"], colors: ["Blanc & doré"], imageKey: "sandales-blanc-dore", badge: "Nouveau", rating: null, reviews: 0, customizable: false, active: true, sortOrder: 7 },
  { id: -9, name: "T-shirt Rose Citrus", category: "tshirts", tagline: "Imprimé Citrus · Cerises & agrumes", description: "T-shirt importé rose à grand imprimé « Citrus » : cerises et agrumes sur fond rayé rose bonbon. Le modèle le plus frais de la collection.", priceAr: 30000, bulkPriceAr: null, bulkMinQty: null, sizes: ["S", "M", "L", "XL"], colors: ["Rose"], imageKey: "tshirt-rose-citrus", badge: "Nouveau", rating: null, reviews: 0, customizable: false, active: true, sortOrder: 8 },
  { id: -10, name: "T-shirt Blanc Lobster", category: "tshirts", tagline: "Imprimé The Lobster Best · Homard & citrons", description: "T-shirt importé blanc à imprimé « The Lobster Best » : homard rouge et quartiers de citron sur fond rayé pêche.", priceAr: 30000, bulkPriceAr: null, bulkMinQty: null, sizes: ["S", "M", "L", "XL"], colors: ["Blanc"], imageKey: "tshirt-blanc-lobster", badge: null, rating: null, reviews: 0, customizable: false, active: true, sortOrder: 9 },
  { id: -11, name: "T-shirt Jaune Citrus", category: "tshirts", tagline: "Imprimé Citrus · Citrons graphiques", description: "T-shirt importé jaune pâle à imprimé « Citrus » : citrons entiers et en quartiers sur fond rayé bleu et jaune.", priceAr: 30000, bulkPriceAr: null, bulkMinQty: null, sizes: ["S", "M", "L", "XL"], colors: ["Jaune"], imageKey: "tshirt-jaune-citrus", badge: null, rating: null, reviews: 0, customizable: false, active: true, sortOrder: 10 },
  { id: -12, name: "T-shirt Lilas Dolce Vita", category: "tshirts", tagline: "Imprimé Dolce Vita · Citron", description: "T-shirt importé lilas à imprimé « Dolce Vita » : un citron et ses feuilles dans un cadre violet rayé.", priceAr: 30000, bulkPriceAr: null, bulkMinQty: null, sizes: ["S", "M", "L", "XL"], colors: ["Lilas"], imageKey: "tshirt-lilas-dolce-vita", badge: null, rating: null, reviews: 0, customizable: false, active: true, sortOrder: 11 },
  { id: -13, name: "T-shirt Noir Cœur Rayonnant", category: "tshirts", tagline: "Imprimé cœur rayonnant · Rouge sur noir", description: "T-shirt importé noir à grand imprimé rouge : un visage en forme de cœur entouré de rayons ondulés. Le modèle qui ne passe pas inaperçu.", priceAr: 30000, bulkPriceAr: null, bulkMinQty: null, sizes: ["S", "M", "L", "XL"], colors: ["Noir"], imageKey: "tshirt-noir-coeur", badge: null, rating: null, reviews: 0, customizable: false, active: true, sortOrder: 12 },
  { id: -14, name: "T-shirt Vierge Noir", category: "tshirts", tagline: "100 % coton · Vierge — noir, blanc ou rouge", description: "T-shirt vierge importé, 100 % coton — l'étiquette précise un lavage à 40 °C maximum. Sans aucun imprimé : portez-le tel quel ou personnalisez-le dans l'Atelier avec votre texte. Trois couleurs : noir, blanc et rouge — choisissez la couleur ci-dessous, la photo suit.", priceAr: 15000, bulkPriceAr: null, bulkMinQty: null, sizes: ["S", "M", "L", "XL"], colors: ["Noir", "Blanc", "Rouge"], imageKey: "tshirt-vierge-noir", badge: null, rating: null, reviews: 0, customizable: true, active: true, sortOrder: 13 },
  { id: -15, name: "T-shirt Enfant Vierge Blanc", category: "tshirts", tagline: "Enfant 2 à 14 ans · Vierge, blanc, noir ou rouge", description: "T-shirt enfant vierge importé, sans imprimé, pour les 2 à 14 ans. Trois couleurs : blanc, noir et rouge — choisissez la couleur ci-dessous, la photo suit. Parfait tel quel ou à personnaliser dans l'Atelier pour un cadeau unique.", priceAr: 10000, bulkPriceAr: null, bulkMinQty: null, sizes: ["2 ans", "4 ans", "6 ans", "8 ans", "10 ans", "12 ans", "14 ans"], colors: ["Blanc", "Noir", "Rouge"], imageKey: "tshirt-enfant-blanc", badge: "Enfant", rating: null, reviews: 0, customizable: true, active: true, sortOrder: 14 },
  { id: -16, name: "Gourde Thermo", category: "gourdes", tagline: "450 ml · 5 couleurs · Température affichée sur le couvercle", description: "Gourde thermo importée de 450 ml. Cinq couleurs de couvercle au choix : crème, noir, bordeaux, brun et bleu marine — choisissez la couleur ci-dessous, la photo suit. L'écran du couvercle affiche la température de la boisson, et la dragonne « Coffee » permet de l'emporter partout. Garde le chaud et le froid pendant des heures.", priceAr: 25000, bulkPriceAr: null, bulkMinQty: null, sizes: [], colors: ["Crème", "Noir", "Bordeaux", "Brun", "Bleu marine"], imageKey: "gourde-creme", badge: "Populaire", rating: null, reviews: 0, customizable: false, active: true, sortOrder: 15 },
];

type CartItem = {
  key: string;
  productId: number;
  name: string;
  imageKey: string | null;
  unitPriceAr: number;
  bulkPriceAr: number | null;
  bulkMinQty: number | null;
  qty: number;
  size: string | null;
  color: string | null;
  customText: string | null;
  customSide: string | null;
};

type Route =
  | { name: "accueil" }
  | { name: "collection"; category?: Category | "tous" }
  | { name: "produit"; id: number }
  | { name: "atelier"; productId?: number }
  | { name: "panier" }
  | { name: "connexion" }
  | { name: "inscription" }
  | { name: "oublie" }
  | { name: "profil" }
  | { name: "commandes" }
  | { name: "gestion" };

const fmt = (n: number) =>
  `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} Ar`;

const DELIVERY_AR = 4000;
const SHOP_PHONES = ["038 56 105 57", "034 17 880 44"];
const SHOP_EMAIL = "essentialsnora@gmail.com";

function unitPrice(item: CartItem): number {
  if (item.bulkPriceAr != null && item.bulkMinQty != null && item.qty >= item.bulkMinQty) {
    return item.bulkPriceAr;
  }
  return item.unitPriceAr;
}

function cartKey(p: {
  productId: number;
  size: string | null;
  color: string | null;
  customText: string | null;
  customSide: string | null;
}): string {
  return [p.productId, p.size ?? "", p.color ?? "", p.customText ?? "", p.customSide ?? ""].join("|");
}

/* ---------- Icônes (SVG inline, style Lucide) ---------- */
function I({ d, size = 22, sw = 2 }: { d: string | string[]; size?: number; sw?: number }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}
const IconHome = (p: { size?: number }) => (
  <I {...p} d={["M3 10.5 12 3l9 7.5", "M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8", "M9 21v-6h6v6"]} />
);
const IconGrid = (p: { size?: number }) => (
  <I {...p} d={["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"]} />
);
const IconPalette = (p: { size?: number }) => (
  <I
    {...p}
    d={[
      "M12 22a10 10 0 1 1 10-10c0 2.2-1.8 3-4 3h-2a2.5 2.5 0 0 0-1.8 4.2c.3.4.3.8.3 1.3 0 1-.9 1.5-2.5 1.5z",
      "M7.5 10.5h.01M12 7.5h.01M16.5 10.5h.01M9 15h.01",
    ]}
  />
);
const IconBag = (p: { size?: number }) => (
  <I {...p} d={["M6 7h15l-1.5 9a2 2 0 0 1-2 1.5h-11A2 2 0 0 1 4.5 16L3 7", "M3 7h18", "M16 10a4 4 0 0 1-8 0"]} />
);
const IconUser = (p: { size?: number }) => (
  <I {...p} d={["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} />
);
const IconHeart = ({ size = 20, filled = false }: { size?: number; filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z" />
  </svg>
);
const IconPlus = (p: { size?: number }) => <I {...p} d={["M12 5v14", "M5 12h14"]} />;
const IconMinus = (p: { size?: number }) => <I {...p} d="M5 12h14" />;
const IconChevron = (p: { size?: number }) => <I {...p} d="m9 18 6-6-6-6" />;
const IconBack = (p: { size?: number }) => <I {...p} d="m15 18-6-6 6-6" />;
const IconStar = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21 7 14.2 2 9.3l6.9-1z" />
  </svg>
);
const IconCheck = (p: { size?: number }) => <I {...p} d="M20 6 9 17l-5-5" />;
const IconTrash = (p: { size?: number }) => (
  <I {...p} d={["M3 6h18", "M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"]} />
);
const IconTruck = (p: { size?: number }) => (
  <I {...p} d={["M1 8h13v8H1z", "M14 11h4l3 3v2h-7", "M5.5 20a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z", "M17.5 20a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z"]} />
);
const IconShield = (p: { size?: number }) => (
  <I {...p} d={["M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z", "m9 11.5 2 2 4-4"]} />
);
const IconSparkles = (p: { size?: number }) => (
  <I {...p} d={["M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z", "M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"]} />
);
const IconSearch = (p: { size?: number }) => (
  <I {...p} d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "m21 21-4.3-4.3"]} />
);
const IconPhone = (p: { size?: number }) => (
  <I {...p} d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9z" />
);
const IconPackage = (p: { size?: number }) => (
  <I {...p} d={["M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8", "M1 3h22v5H1z", "M10 12h4"]} />
);
const IconStore = (p: { size?: number }) => (
  <I {...p} d={["M3 9l1.7-5h14.6L21 9", "M3 9h18v1a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z", "M5 13v8h14v-8", "M9 21v-6h6v6"]} />
);
const IconLogout = (p: { size?: number }) => (
  <I {...p} d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"]} />
);
const IconType = (p: { size?: number }) => (
  <I {...p} d={["M4 7V5h16v2", "M12 5v14", "M9 19h6"]} />
);
const IconEye = (p: { size?: number }) => (
  <I {...p} d={["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]} />
);

/* ---------- Éléments partagés ---------- */

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent)] font-extrabold tracking-tight text-white shadow-lg shadow-emerald-900/20">
        NE
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-extrabold uppercase tracking-[0.14em]">
          Nora Essentials
        </span>
        <span className="block text-[11px] font-medium text-[var(--dim)]">
          Plus qu'un style, un essentiel ✨
        </span>
      </span>
    </span>
  );
}

function Header({
  route,
  go,
  cartCount,
  accountName,
}: {
  route: Route["name"];
  go: (r: Route) => void;
  cartCount: number;
  accountName: string | null;
}) {
  const links: Array<{ name: Route["name"]; label: string; target: Route }> = [
    { name: "accueil", label: "Accueil", target: { name: "accueil" } },
    { name: "collection", label: "Collection", target: { name: "collection", category: "tous" } },
    { name: "atelier", label: "Atelier", target: { name: "atelier" } },
    { name: "panier", label: "Panier", target: { name: "panier" } },
    { name: "profil", label: "Profil", target: { name: "profil" } },
  ];
  const isActive = (name: Route["name"]) =>
    route === name ||
    (name === "accueil" && route === "produit") ||
    (name === "profil" &&
      (route === "connexion" || route === "inscription" || route === "oublie" || route === "commandes" || route === "gestion"));
  return (
    <header className="sticky top-0 z-40 -mx-4 bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go({ name: "accueil" })}
          aria-label="Nora Essentials — retour à l'accueil"
          className="shrink-0 text-left"
        >
          <Logo />
        </button>
        <nav aria-label="Navigation du site" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button
              key={l.name}
              type="button"
              onClick={() => go(l.target)}
              aria-current={isActive(l.name) ? "page" : undefined}
              className={`relative rounded-full px-4 py-2.5 text-[14px] font-bold transition ${
                isActive(l.name)
                  ? "bg-[var(--ink)] text-white shadow-md"
                  : "text-[var(--dim)] hover:bg-white hover:text-[var(--text)]"
              }`}
            >
              {l.label}
              {l.name === "panier" && cartCount > 0 && (
                <span className="absolute -right-0.5 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--orange)] px-1 text-[10px] font-extrabold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => go({ name: "profil" })}
          aria-label={accountName ? `Profil de ${accountName}` : "Mon profil"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--accent-2)] text-white shadow-lg shadow-violet-600/25 md:hidden"
        >
          {accountName ? (
            <span className="text-sm font-extrabold">{accountName.charAt(0).toUpperCase()}</span>
          ) : (
            <IconUser size={20} />
          )}
        </button>
      </div>
    </header>
  );
}

function Footer({ go }: { go: (r: Route) => void }) {
  const shopLinks: Array<{ label: string; target: Route }> = [
    { label: "Accueil", target: { name: "accueil" } },
    { label: "Collection", target: { name: "collection", category: "tous" } },
    { label: "Sandales", target: { name: "collection", category: "sandales" } },
    { label: "T-shirts", target: { name: "collection", category: "tshirts" } },
    { label: "Gourdes thermo", target: { name: "collection", category: "gourdes" } },
    { label: "Atelier de personnalisation", target: { name: "atelier" } },
  ];
  return (
    <footer className="mt-14 border-t border-[var(--border)] pb-2 pt-8">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm font-medium leading-relaxed text-[var(--dim)]">
            Sandales, t-shirts et gourdes thermo importés, vérifiés un à un
            avant envoi. Plus qu'un style, un essentiel.
          </p>
        </div>
        <nav aria-label="Pied de page — boutique">
          <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--dim)]">Boutique</h2>
          <ul className="mt-3 space-y-2">
            {shopLinks.map((l) => (
              <li key={l.label}>
                <button
                  type="button"
                  onClick={() => go(l.target)}
                  className="text-sm font-semibold text-[var(--text)] transition hover:text-[var(--accent)]"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--dim)]">Nous contacter</h2>
          <ul className="mt-3 space-y-2 text-sm font-medium leading-relaxed text-[var(--dim)]">
            <li>Téléphone : {SHOP_PHONES.join(" / ")}</li>
            <li>Email : {SHOP_EMAIL}</li>
            <li>Antananarivo, Madagascar</li>
            <li>Livraison à Antananarivo et dans toutes les provinces, dès {fmt(DELIVERY_AR)}.</li>
          </ul>
        </div>
      </div>
      <p className="mt-8 text-center text-xs font-medium text-[var(--dim)]">
        © 2026 Nora Essentials — Commandes par message privé ou via la boutique en ligne.
      </p>
    </footer>
  );
}

function Stars({ rating, reviews }: { rating: number | null; reviews: number }) {
  if (rating == null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[var(--accent)]">
      <span className="flex text-amber-500">
        {[0, 1, 2, 3, 4].map((i) => (
          <IconStar key={i} size={13} />
        ))}
      </span>
      <span className="text-xs font-bold">{rating.toFixed(1)}</span>
      {reviews > 0 && <span className="text-xs font-medium text-[var(--dim)]">({reviews} avis)</span>}
    </span>
  );
}

function ProductImage({
  product,
  className,
}: {
  product: Pick<Product, "imageKey" | "name">;
  className?: string;
}) {
  const src = product.imageKey ? IMAGES[product.imageKey] : undefined;
  if (!src) {
    return (
      <div className={`grid place-items-center bg-[var(--mint)] text-[var(--accent)] ${className ?? ""}`} aria-hidden="true">
        <IconBag size={36} />
      </div>
    );
  }
  return <img src={src} alt={product.name} className={className} loading="lazy" />;
}

function ProductCard({
  product,
  onOpen,
  onAdd,
  large = false,
}: {
  product: Product;
  onOpen: () => void;
  onAdd: () => void;
  large?: boolean;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.6rem] bg-white shadow-[0_10px_24px_-8px_rgba(91,54,222,0.12)] transition-shadow duration-300 hover:shadow-[0_20px_36px_-10px_rgba(91,54,222,0.25)]">
      <button type="button" onClick={onOpen} className="block text-left" aria-label={`Voir ${product.name}`}>
        <span className="relative block overflow-hidden">
          <ProductImage
            product={product}
            className={`w-full object-cover ${large ? "aspect-[4/3]" : "aspect-square"}`}
          />
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-[var(--orange)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
              {product.badge}
            </span>
          )}
          {variantPhotos(product).length > 1 && (
            <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/45 p-1 backdrop-blur-sm">
              {variantPhotos(product).map((v) => (
                <img
                  key={v.color}
                  src={IMAGES[v.imageKey]}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-white/80"
                />
              ))}
              <span className="pr-1.5 text-[10px] font-extrabold text-white">
                {variantPhotos(product).length} couleurs
              </span>
            </span>
          )}
        </span>
        <span className="block px-4 pt-3">
          <span className="block truncate text-[11px] font-semibold uppercase tracking-wide text-[var(--dim)]">
            {product.tagline}
          </span>
          <span className="block truncate text-[15px] font-bold leading-snug">{product.name}</span>
          <Stars rating={product.rating} reviews={product.reviews} />
        </span>
      </button>
      <div className="mt-auto flex items-end justify-between px-4 pb-4 pt-1">
        <div>
          <span className="block text-[16px] font-extrabold text-[var(--accent)]">{fmt(product.priceAr)}</span>
          {product.bulkPriceAr != null && product.bulkMinQty != null && (
            <span className="block text-[11px] font-semibold text-[var(--orange)]">
              {fmt(product.bulkPriceAr)} dès {product.bulkMinQty} paires
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Ajouter ${product.name} au panier`}
          className="grid h-11 w-11 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-emerald-900/25 transition active:scale-95"
        >
          <IconPlus size={20} />
        </button>
      </div>
    </article>
  );
}

function QtyStepper({
  qty,
  setQty,
  label,
}: {
  qty: number;
  setQty: (q: number) => void;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-[#f3f3fc] p-1">
      <button
        type="button"
        aria-label={`Diminuer la quantité — ${label}`}
        onClick={() => setQty(Math.max(1, qty - 1))}
        className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--text)] shadow-sm"
      >
        <IconMinus size={16} />
      </button>
      <span className="min-w-8 text-center text-sm font-extrabold" aria-label={`Quantité — ${label}`}>
        {qty}
      </span>
      <button
        type="button"
        aria-label={`Augmenter la quantité — ${label}`}
        onClick={() => setQty(Math.min(99, qty + 1))}
        className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--text)] shadow-sm"
      >
        <IconPlus size={16} />
      </button>
    </div>
  );
}

function BottomNav({
  route,
  go,
  cartCount,
}: {
  route: Route["name"];
  go: (r: Route) => void;
  cartCount: number;
}) {
  const item = (
    name: Route["name"],
    label: string,
    icon: ReactNode,
    target: Route,
  ) => {
    const activeTab =
      route === name ||
      (name === "accueil" && route === "produit") ||
      (name === "profil" && (route === "connexion" || route === "inscription" || route === "oublie" || route === "commandes"));
    return (
      <button
        key={label}
        type="button"
        onClick={() => go(target)}
        aria-label={label}
        aria-current={activeTab ? "page" : undefined}
        className={`relative flex min-w-14 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] font-semibold ${
          activeTab ? "text-white" : "text-white/55"
        }`}
      >
        {icon}
        {label}
        {name === "panier" && cartCount > 0 && (
          <span className="absolute -right-0.5 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--orange)] px-1 text-[10px] font-extrabold text-white">
            {cartCount}
          </span>
        )}
      </button>
    );
  };
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-end justify-between rounded-[2rem] bg-[var(--ink)] px-3 pb-2 pt-2 shadow-[0_16px_36px_rgba(0,0,0,0.35)] md:hidden"
    >
      {item("accueil", "Accueil", <IconHome size={21} />, { name: "accueil" })}
      {item("collection", "Collection", <IconGrid size={21} />, { name: "collection", category: "tous" })}
      <button
        type="button"
        onClick={() => go({ name: "atelier" })}
        aria-label="Atelier de personnalisation"
        className={`-mt-7 grid h-14 w-14 place-items-center rounded-full border-4 border-[var(--bg)] text-white shadow-xl ${
          route === "atelier" ? "bg-[var(--accent-2)]" : "bg-[var(--accent)]"
        }`}
      >
        <IconPalette size={24} />
      </button>
      {item("panier", "Panier", <IconBag size={21} />, { name: "panier" })}
      {item("profil", "Profil", <IconUser size={21} />, { name: "profil" })}
    </nav>
  );
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 md:bottom-8" role="status">
      <p className="flex items-center gap-2 rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
        <span className="text-emerald-400">
          <IconCheck size={16} />
        </span>
        {message}
      </p>
    </div>
  );
}

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-700" role="alert">
      {message}
    </p>
  );
}

const inputCls =
  "w-full rounded-2xl border border-[var(--border)] bg-[#fafaff] px-4 py-3 text-[15px] font-medium outline-none transition focus:border-[var(--accent)] focus:bg-white focus:ring-4 focus:ring-emerald-900/10";
const labelCls = "mb-1.5 block text-[13px] font-bold";

/* ---------- Accueil ---------- */

const CATEGORY_TABS: Array<{ key: Category | "tous"; label: string }> = [
  { key: "tous", label: "Tout" },
  { key: "sandales", label: "Sandales" },
  { key: "tshirts", label: "T-shirts" },
  { key: "gourdes", label: "Gourdes" },
];

function Accueil({
  products,
  go,
  addToCart,
}: {
  products: Product[];
  go: (r: Route) => void;
  addToCart: (p: Product, opts?: Partial<CartItem>) => void;
}) {
  const [tab, setTab] = useState<Category | "tous">("tous");
  const heroProduct = products.find((p) => p.imageKey === "tshirt-rose-citrus") ?? products[0];
  const filtered = tab === "tous" ? products : products.filter((p) => p.category === tab);
  const tendances = filtered.slice(0, 8);
  return (
    <div className="space-y-7">
      <section>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--mint)] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[var(--accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Nouvelle Collection 2026
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--dim)]">
            Édition limitée
          </span>
        </div>
        <h1 className="mt-3 text-[30px] font-extrabold leading-[1.12] tracking-tight md:text-[38px] lg:text-[46px] lg:leading-[1.05]">
          L'essentiel, <span className="text-[var(--accent)]">importé</span> pour vous
        </h1>
        <p className="mt-2 max-w-md text-[14px] font-medium leading-relaxed text-[var(--dim)] lg:max-w-xl lg:text-[15px]">
          Sandales, t-shirts et gourdes thermo sélectionnés avec soin, livrés à
          Antananarivo et dans toutes les provinces.
        </p>
      </section>

      <section aria-label="Catégories">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-x-visible">
          {[
            { label: "Personnalisé", icon: <IconSparkles size={16} />, action: () => go({ name: "atelier" }) },
            { label: "Sandales", icon: <IconBag size={16} />, action: () => go({ name: "collection", category: "sandales" }) },
            { label: "T-shirts", icon: <IconType size={16} />, action: () => go({ name: "collection", category: "tshirts" }) },
            { label: "Gourdes", icon: <IconPackage size={16} />, action: () => go({ name: "collection", category: "gourdes" }) },
          ].map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.action}
              className="flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-bold shadow-sm"
            >
              <span className="text-[var(--accent)]">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {heroProduct && (
        <section className="relative overflow-hidden rounded-[2rem] bg-[var(--accent)] text-white shadow-[0_20px_40px_-16px_rgba(0,0,0,0.35)]">
          <div className="relative z-10 max-w-[62%] p-6 lg:max-w-[52%] lg:p-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide">
              <IconSparkles size={13} /> Atelier Nora
            </span>
            <h2 className="mt-3 text-[24px] font-extrabold leading-tight lg:text-[32px]">
              T-shirts personnalisés
            </h2>
            <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-white/85">
              Votre texte, votre style : créez un t-shirt unique dans l'Atelier,
              à partir de {fmt(10000)}.
            </p>
            <button
              type="button"
              onClick={() => go({ name: "atelier" })}
              className="mt-4 rounded-full bg-white px-5 py-2.5 text-[13px] font-extrabold text-[var(--accent)] shadow"
            >
              Créer le mien
            </button>
          </div>
          <img
            src={heroImg}
            alt="T-shirt rose imprimé Citrus, prêt à personnaliser"
            className="absolute -right-6 bottom-0 top-0 h-full w-[52%] rotate-2 object-cover [mask-image:linear-gradient(to_left,black_65%,transparent)] lg:w-[46%]"
          />
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-[19px] font-extrabold tracking-tight">Coupes &amp; Styles</h2>
          <span className="text-xs font-semibold text-[var(--dim)]">{products.length} articles</span>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filtrer par catégorie">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-[13px] font-bold transition ${
                tab === t.key
                  ? "bg-[var(--accent)] text-white shadow-lg shadow-emerald-900/25"
                  : "bg-white text-[var(--dim)] shadow-sm"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-[19px] font-extrabold tracking-tight">Tendances de la boutique</h2>
          <button
            type="button"
            onClick={() => go({ name: "collection", category: tab })}
            className="flex items-center gap-0.5 text-[13px] font-bold text-[var(--accent)]"
          >
            Voir tout <IconChevron size={15} />
          </button>
        </div>
        {tendances.length === 0 ? (
          <p className="rounded-3xl bg-white p-6 text-center text-sm font-medium text-[var(--dim)]">
            Aucun article dans cette catégorie pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {tendances.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                large={i === 0}
                onOpen={() => go({ name: "produit", id: p.id })}
                onAdd={() => addToCart(p)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
      <section className="overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_10px_24px_-8px_rgba(91,54,222,0.10)]">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--mint)] text-[var(--accent)]">
            <IconPalette size={24} />
          </span>
          <div>
            <h2 className="text-[17px] font-extrabold">Configuration Studio</h2>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-[var(--dim)]">
              Choisissez un t-shirt vierge, ajoutez votre texte ou votre motif,
              et voyez le rendu en direct avant de commander.
            </p>
            <button
              type="button"
              onClick={() => go({ name: "atelier" })}
              className="mt-3 flex w-full items-center justify-between rounded-full bg-[var(--accent)] px-5 py-3 text-[14px] font-extrabold text-white shadow-lg shadow-emerald-900/25"
            >
              Ouvrir l'Atelier
              <IconChevron size={17} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 pb-2 text-center">
        {[
          { icon: <IconTruck size={20} />, text: `Livraison dès ${fmt(DELIVERY_AR)}` },
          { icon: <IconShield size={20} />, text: "Vérifié avant envoi" },
          { icon: <IconPhone size={20} />, text: "Commande par message" },
        ].map((b) => (
          <div key={b.text} className="rounded-3xl bg-white px-2 py-4 shadow-sm">
            <span className="mx-auto mb-1.5 grid h-9 w-9 place-items-center rounded-full bg-[#f3f3fc] text-[var(--accent-2)]">
              {b.icon}
            </span>
            <p className="text-[11px] font-bold leading-tight text-[var(--dim)]">{b.text}</p>
          </div>
        ))}
      </section>
      </div>
    </div>
  );
}

/* ---------- Collection ---------- */

function Collection({
  products,
  initialCategory,
  go,
  addToCart,
}: {
  products: Product[];
  initialCategory: Category | "tous";
  go: (r: Route) => void;
  addToCart: (p: Product, opts?: Partial<CartItem>) => void;
}) {
  const [tab, setTab] = useState<Category | "tous">(initialCategory);
  const [query, setQuery] = useState("");
  useEffect(() => setTab(initialCategory), [initialCategory]);
  const filtered = products.filter(
    (p) =>
      (tab === "tous" || p.category === tab) &&
      (query.trim() === "" ||
        `${p.name} ${p.tagline}`.toLowerCase().includes(query.trim().toLowerCase())),
  );
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight">Collection</h1>
        <p className="mt-1 text-sm font-medium text-[var(--dim)]">
          Tous les essentiels Nora, importés et vérifiés un à un.
        </p>
      </div>
      <label className="relative block lg:max-w-md">
        <span className="sr-only">Rechercher un article</span>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--dim)]">
          <IconSearch size={18} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher : sandales, menthe, thermo…"
          className={`${inputCls} pl-11`}
        />
      </label>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Catégories">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-[13px] font-bold ${
              tab === t.key
                ? "bg-[var(--accent)] text-white shadow-lg shadow-emerald-900/25"
                : "bg-white text-[var(--dim)] shadow-sm"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-[var(--dim)]">
          Aucun article ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onOpen={() => go({ name: "produit", id: p.id })}
              onAdd={() => addToCart(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Fiche produit ---------- */

function FicheProduit({
  product,
  go,
  addToCart,
  openAtelier,
  onThemeChange,
}: {
  product: Product;
  go: (r: Route) => void;
  addToCart: (p: Product, opts?: Partial<CartItem>) => void;
  openAtelier: (productId: number) => void;
  onThemeChange: (t: ThemeVars) => void;
}) {
  const [size, setSize] = useState<string | null>(product.sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(product.colors[0] ?? null);
  // Le thème de la boutique suit l'article affiché et, sur les fiches
  // multi-couleurs, la couleur choisie — comme la grande photo.
  useEffect(() => {
    onThemeChange(themeForProduct(product, color));
  }, [product, color, onThemeChange]);
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const unit =
    product.bulkPriceAr != null && product.bulkMinQty != null && qty >= product.bulkMinQty
      ? product.bulkPriceAr
      : product.priceAr;
  // Produits à photo par couleur (t-shirts vierges, gourde thermo) : une
  // vraie photo déposée par couleur — la grande photo suit la couleur
  // choisie, et les miniatures sous la photo montrent toutes les
  // couleurs d'un coup d'œil.
  const variants = variantPhotos(product);
  const displayImageKey = colorImageKey(product, color);
  const displayProduct = { ...product, imageKey: displayImageKey };
  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go({ name: "collection", category: product.category })}
          aria-label="Retour à la collection"
          className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm"
        >
          <IconBack size={20} />
        </button>
        <span className="text-[15px] font-extrabold">Fiche Produit</span>
        <button
          type="button"
          onClick={() => setFav((f) => !f)}
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={fav}
          className={`grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm ${fav ? "text-red-500" : "text-[var(--dim)]"}`}
        >
          <IconHeart size={20} filled={fav} />
        </button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-b from-[var(--mint)] to-white shadow-sm">
        <div className="flex items-center justify-between px-5 pt-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Nora Essentials · Importé
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold text-[var(--accent)]">
            <IconShield size={13} /> Vérifié
          </span>
        </div>
        <h1 className="px-5 pt-3 text-[26px] font-extrabold leading-tight tracking-tight">{product.name}</h1>
        <p className="px-5 text-sm font-medium text-[var(--dim)]">{product.tagline}</p>
        <div className="relative mt-3">
          <ProductImage product={displayProduct} className="aspect-[4/3] w-full object-cover" />
          {variants.length > 1 && color && (
            <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold text-white">
              Couleur : {color}
            </span>
          )}
        </div>
        {variants.length > 1 && (
          <div className="px-5 pt-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--dim)]">
              Les photos par couleur
            </p>
            <div className="mt-2 flex gap-2.5" role="group" aria-label="Photos par couleur">
              {variants.map((v) => (
                <button
                  key={v.color}
                  type="button"
                  onClick={() => setColor(v.color)}
                  aria-pressed={color === v.color}
                  aria-label={`Voir la photo couleur ${v.color}`}
                  className="flex flex-col items-center gap-1"
                >
                  <img
                    src={IMAGES[v.imageKey]}
                    alt=""
                    className={`h-16 w-16 rounded-2xl object-cover ${
                      color === v.color
                        ? "ring-[3px] ring-[var(--accent)] ring-offset-2 ring-offset-white"
                        : "ring-1 ring-black/10"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold ${
                      color === v.color ? "text-[var(--accent)]" : "text-[var(--dim)]"
                    }`}
                  >
                    {v.color}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-end justify-between px-5 pb-5">
          <div className="rounded-2xl bg-white px-4 py-2.5 shadow-md">
            <span className="block text-[10px] font-extrabold uppercase tracking-wide text-[var(--dim)]">
              Prix unitaire
            </span>
            <span className="block text-[22px] font-extrabold leading-none text-[var(--accent)]">
              {fmt(product.priceAr)}
            </span>
          </div>
          {product.bulkPriceAr != null && product.bulkMinQty != null && (
            <span className="max-w-[45%] text-right text-[12px] font-bold leading-snug text-[var(--orange)]">
              {fmt(product.bulkPriceAr)} dès {product.bulkMinQty} paires
            </span>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <Stars rating={product.rating} reviews={product.reviews} />
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--accent)]">
            <IconTruck size={16} /> En stock
          </span>
        </div>
        <h2 className="mt-4 text-[16px] font-extrabold">Description</h2>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-[var(--dim)]">
          {product.description}
        </p>

        {product.colors.length > 0 && (
          <>
            <h3 className="mt-5 text-[15px] font-extrabold">
              Couleur {color && <span className="float-right font-bold text-[var(--accent)]">{color}</span>}
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  onClick={() => setColor(c)}
                  className={`rounded-full px-4 py-2.5 text-[13px] font-bold ${
                    color === c
                      ? "bg-[var(--accent)] text-white shadow-md"
                      : "bg-[#f3f3fc] text-[var(--dim)]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        )}

        {product.sizes.length > 0 && (
          <>
            <h3 className="mt-5 text-[15px] font-extrabold">
              {product.category === "sandales" ? "Pointure" : "Taille"}
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Taille ou pointure">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  onClick={() => setSize(s)}
                  className={`grid h-12 min-w-12 place-items-center rounded-2xl px-3 text-[14px] font-extrabold ${
                    size === s
                      ? "bg-[var(--accent)] text-white shadow-md"
                      : "border border-[var(--border)] bg-white text-[var(--text)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-5 flex items-center justify-between">
          <span className="text-[15px] font-extrabold">Quantité</span>
          <QtyStepper qty={qty} setQty={setQty} label={product.name} />
        </div>

        {product.customizable && (
          <button
            type="button"
            onClick={() => openAtelier(product.id)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-[var(--accent-2)]/40 bg-[var(--mint)] px-5 py-3 text-[14px] font-extrabold text-[var(--accent-2)]"
          >
            <IconPalette size={18} /> Personnaliser dans l'Atelier
          </button>
        )}

        <div className="mt-6 hidden items-center gap-3 border-t border-dashed border-[var(--border)] pt-5 md:flex">
          <button
            type="button"
            onClick={() => setFav((f) => !f)}
            aria-label="Ajouter aux favoris"
            aria-pressed={fav}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f3f3fc] ${fav ? "text-red-500" : "text-[var(--dim)]"}`}
          >
            <IconHeart size={20} filled={fav} />
          </button>
          <button
            type="button"
            onClick={() => addToCart(product, { size, color, qty })}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-emerald-900/25 transition hover:bg-[#0a4530]"
          >
            <IconBag size={18} /> Ajouter au Panier
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[13px]">{fmt(unit * qty)}</span>
          </button>
        </div>
      </section>
      </div>

      <div className="fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-md items-center gap-3 md:hidden">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-[var(--ink)] p-2 pl-3 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
          <button
            type="button"
            onClick={() => setFav((f) => !f)}
            aria-label="Ajouter aux favoris"
            aria-pressed={fav}
            className={`grid h-11 w-11 place-items-center rounded-full bg-white/10 ${fav ? "text-red-400" : "text-white"}`}
          >
            <IconHeart size={19} filled={fav} />
          </button>
          <button
            type="button"
            onClick={() => addToCart(product, { size, color, qty })}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-3 text-[14px] font-extrabold text-white"
          >
            <IconBag size={17} /> Ajouter au Panier
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[12px]">{fmt(unit * qty)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Atelier de personnalisation ---------- */

const SHIRT_BG: Record<string, string> = {
  Menthe: "#bfe8d2",
  Noir: "#23242a",
  Blanc: "#f4f4f6",
  Lilas: "#ddd0f5",
  Sunset: "#f6cfa8",
  Rose: "#f7c8d8",
  Jaune: "#f7ecc0",
  Rouge: "#d92b20",
};

function Atelier({
  products,
  initialProductId,
  addToCart,
  go,
  onThemeChange,
}: {
  products: Product[];
  initialProductId?: number;
  addToCart: (p: Product, opts?: Partial<CartItem>) => void;
  go: (r: Route) => void;
  onThemeChange: (t: ThemeVars) => void;
}) {
  const bases = products.filter((p) => p.customizable);
  const [baseId, setBaseId] = useState<number | null>(initialProductId ?? null);
  const base = bases.find((p) => p.id === baseId) ?? bases[0] ?? null;
  const [side, setSide] = useState<"Face" | "Dos">("Face");
  const [text, setText] = useState("NORA ATELIER");
  const [size, setSize] = useState<string>("M");
  const [qty, setQty] = useState(1);
  const [colorChoice, setColorChoice] = useState<string | null>(null);
  useEffect(() => {
    if (initialProductId != null) setBaseId(initialProductId);
  }, [initialProductId]);
  useEffect(() => {
    if (base && base.sizes.length > 0 && !base.sizes.includes(size)) {
      setSize(base.sizes[Math.min(1, base.sizes.length - 1)] ?? base.sizes[0] ?? "M");
    }
  }, [base, size]);
  // Le thème suit le modèle de base et la couleur choisis dans l'Atelier.
  useEffect(() => {
    if (!base) return;
    const c =
      (colorChoice && base.colors.includes(colorChoice) ? colorChoice : null) ??
      base.colors[0] ??
      null;
    onThemeChange(themeForProduct(base, c));
  }, [base, colorChoice, onThemeChange]);

  if (!base) {
    return (
      <p className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-[var(--dim)]">
        Aucun t-shirt personnalisable n'est disponible pour le moment.
      </p>
    );
  }
  // La couleur se choisit ici aussi : l'aperçu montre la vraie photo
  // déposée pour la couleur choisie (noir, blanc ou rouge).
  const colorName =
    (colorChoice && base.colors.includes(colorChoice) ? colorChoice : null) ??
    base.colors[0] ??
    "Menthe";
  const bg = SHIRT_BG[colorName] ?? "#e8e8f0";
  const darkText = colorName === "Noir";
  const shirtKey = colorImageKey(base, colorName);
  const shirtSrc = shirtKey ? IMAGES[shirtKey] : undefined;

  return (
    <div className="space-y-5 pb-4">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-2)]">
          Studio d'impression
        </p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-tight">Atelier Custom</h1>
        <p className="mt-1 text-sm font-medium text-[var(--dim)]">
          Créez votre t-shirt : base vierge importée, texte imprimé à la commande.
        </p>
      </div>

      <section className="rounded-[2rem] bg-white p-4 shadow-sm lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5 lg:p-6">
        <div className="lg:col-start-2 lg:row-start-1">
        <label className={labelCls} htmlFor="atelier-base">
          Modèle de base
        </label>
        <div className="flex items-center gap-3">
          <select
            id="atelier-base"
            value={base.id}
            onChange={(e) => setBaseId(Number(e.target.value))}
            className={`${inputCls} flex-1`}
          >
            {bases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {fmt(p.priceAr)}
              </option>
            ))}
          </select>
        </div>
        {base.colors.length > 1 && (
          <div className="mt-3">
            <span className={labelCls}>Couleur du t-shirt</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur du t-shirt">
              {base.colors.map((c) => {
                const v = variantPhotos(base).find((x) => x.color === c);
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={colorName === c}
                    onClick={() => setColorChoice(c)}
                    className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-bold ${
                      colorName === c
                        ? "bg-[var(--accent)] text-white shadow-md"
                        : "bg-[#f3f3fc] text-[var(--dim)]"
                    }`}
                  >
                    {v && (
                      <img
                        src={IMAGES[v.imageKey]}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover ring-1 ring-black/10"
                      />
                    )}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 lg:col-start-2 lg:row-start-2 lg:mt-0" role="radiogroup" aria-label="Côté à personnaliser">
          {(["Face", "Dos"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={side === s}
              onClick={() => setSide(s)}
              className={`rounded-full py-2.5 text-[13px] font-extrabold ${
                side === s ? "bg-[var(--ink)] text-white" : "bg-[#f3f3fc] text-[var(--dim)]"
              }`}
            >
              {s}
            </button>
          ))}
          <span className="grid place-items-center rounded-full bg-[#f3f3fc] px-2 text-center text-[11px] font-bold leading-tight text-[var(--dim)]">
            Zone A3 max
          </span>
        </div>

        <div
          className="relative mt-4 overflow-hidden rounded-[1.6rem] lg:sticky lg:top-24 lg:col-start-1 lg:row-span-4 lg:row-start-1 lg:mt-0 lg:self-start"
          style={{ background: `linear-gradient(160deg, ${bg}, #ffffff 130%)` }}
          aria-label={`Aperçu du t-shirt ${colorName}, côté ${side}, texte « ${text} »`}
        >
          {shirtSrc && (
            <img src={shirtSrc} alt="" className="aspect-[4/3] w-full object-cover opacity-90" />
          )}
          <div className="pointer-events-none absolute inset-0 grid place-items-center px-10">
            <p
              className={`max-w-[70%] text-center font-extrabold uppercase leading-tight tracking-wide ${
                darkText ? "text-white" : "text-[var(--ink)]"
              }`}
              style={{ fontSize: "clamp(15px, 4.6vw, 24px)", textShadow: darkText ? "0 1px 8px rgba(0,0,0,.35)" : "0 1px 0 rgba(255,255,255,.5)" }}
            >
              {text.trim() === "" ? "Votre texte" : text}
            </p>
          </div>
          <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold text-white">
            {side} · Aperçu en direct
          </span>
          <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-extrabold text-[var(--accent)]">
            {colorName}
          </span>
        </div>

        <div className="mt-4 lg:col-start-2 lg:row-start-3 lg:mt-0">
          <label className={labelCls} htmlFor="atelier-text">
            <span className="inline-flex items-center gap-1.5">
              <IconType size={15} /> Texte à imprimer
            </span>
          </label>
          <input
            id="atelier-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 40))}
            maxLength={40}
            placeholder="Ex : Maman ❤, Team Nora…"
            className={inputCls}
          />
          <p className="mt-1.5 text-[11px] font-medium text-[var(--dim)]">
            40 caractères max. Vous avez un logo ou une image ? Envoyez-le nous par
            message après la commande, nous vérifions chaque visuel avant impression.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 lg:col-start-2 lg:row-start-4 lg:mt-0">
          <div>
            <span className={labelCls}>Taille</span>
            <div className="flex gap-2" role="radiogroup" aria-label="Taille du t-shirt">
              {base.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  onClick={() => setSize(s)}
                  className={`grid h-11 min-w-11 place-items-center rounded-xl px-2.5 text-sm font-extrabold ${
                    size === s ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] bg-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={labelCls}>Quantité</span>
            <QtyStepper qty={qty} setQty={setQty} label="t-shirt personnalisé" />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-[var(--ink)] p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-white/60">
              Total personnalisé
            </p>
            <p className="text-[24px] font-extrabold leading-tight">{fmt(base.priceAr * qty)}</p>
            <p className="text-[12px] font-medium text-white/60">
              Base {fmt(base.priceAr)} · Impression incluse · Prêt sous 48 h
            </p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-emerald-300">
            <IconShield size={20} />
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            addToCart(base, {
              size,
              color: colorName,
              qty,
              customText: text.trim() === "" ? "Sans texte" : text.trim(),
              customSide: side,
            });
            go({ name: "panier" });
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3.5 text-[15px] font-extrabold text-white"
        >
          <IconBag size={18} /> Ajouter au Panier
        </button>
      </section>
    </div>
  );
}

/* ---------- Panier & commande ---------- */

function Panier({
  cart,
  setQty,
  removeItem,
  clearCart,
  account,
  go,
  onOrderDone,
}: {
  cart: CartItem[];
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  account: { name: string; phone: string } | null;
  go: (r: Route) => void;
  onOrderDone: (reference: string) => void;
}) {
  const [name, setName] = useState(account?.name ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState<"antananarivo" | "provinces">("antananarivo");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  useEffect(() => {
    if (account) {
      setName((v) => (v === "" ? account.name : v));
      setPhone((v) => (v === "" ? account.phone : v));
    }
  }, [account]);

  const subtotal = cart.reduce((sum, i) => sum + unitPrice(i) * i.qty, 0);
  const total = subtotal + (cart.length > 0 ? DELIVERY_AR : 0);
  const count = cart.reduce((sum, i) => sum + i.qty, 0);

  const createOrder = useMutation({
    mutationFn: async () =>
      await api.createOrder({
        token: storageGet("nora-token"),
        customerName: name,
        phone,
        address,
        zone,
        note,
        items: cart.map((i) => ({
          productId: i.productId,
          name: i.name,
          unitPriceAr: i.unitPriceAr,
          qty: i.qty,
          size: i.size,
          color: i.color,
          customText: i.customText,
          customSide: i.customSide,
        })),
      }),
    onSuccess: (res) => {
      if (res.ok && res.reference) {
        clearCart();
        onOrderDone(res.reference);
      } else {
        setFormError(res.error ?? "La commande n'a pas pu être enregistrée.");
      }
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Erreur réseau, réessayez."),
  });

  const submit = () => {
    if (name.trim().length < 2) return setFormError("Indiquez votre nom pour la livraison.");
    if (phone.trim().length < 8) return setFormError("Indiquez un numéro de téléphone valide.");
    if (address.trim().length < 4) return setFormError("Indiquez l'adresse de livraison.");
    setFormError(null);
    if (STATIC_MODE) {
      // Vitrine GitHub Pages : pas de serveur pour enregistrer la commande,
      // elle part par WhatsApp avec tout le détail du panier.
      const lines = cart.map(
        (i) =>
          `• ${i.name} × ${i.qty} — ${fmt(unitPrice(i) * i.qty)}${[
            i.color,
            i.size ? `Taille ${i.size}` : null,
            i.customText ? `« ${i.customText} » (${i.customSide ?? "Face"})` : null,
          ]
            .filter(Boolean)
            .join(" · ")}`,
      );
      const msg = [
        "Bonjour Nora Essentials, je passe commande sur la vitrine Nora Store :",
        ...lines,
        `Livraison (dès ${fmt(DELIVERY_AR)}) — Total estimé : ${fmt(total)}`,
        `Nom : ${name.trim()}`,
        `Téléphone : ${phone.trim()}`,
        `Adresse : ${address.trim()} (${zone === "provinces" ? "Provinces" : "Antananarivo"})`,
        ...(note.trim() ? [`Note : ${note.trim()}`] : []),
      ].join("\n");
      window.open(`https://wa.me/261385610557?text=${encodeURIComponent(msg)}`, "_blank");
      return;
    }
    createOrder.mutate();
  };

  if (cart.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-[26px] font-extrabold tracking-tight">Panier</h1>
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--mint)] text-[var(--accent)]">
            <IconBag size={28} />
          </span>
          <p className="mt-4 text-[16px] font-extrabold">Votre panier est vide</p>
          <p className="mx-auto mt-1 max-w-xs text-sm font-medium text-[var(--dim)]">
            Parcourez la collection et ajoutez vos essentiels : sandales, t-shirts
            et gourdes thermo.
          </p>
          <button
            type="button"
            onClick={() => go({ name: "collection", category: "tous" })}
            className="mt-5 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/25"
          >
            Voir la collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-[26px] font-extrabold tracking-tight">
          <IconBag size={24} /> Panier Nora Essentials
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--dim)]">
          {count} article{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-5">
      <section className="rounded-[2rem] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-[13px] font-bold">
          <span className="inline-flex items-center gap-1.5 text-[var(--accent)]">
            <IconTruck size={16} /> Livraison à partir de {fmt(DELIVERY_AR)}
          </span>
          <span className="text-[var(--dim)]">Antananarivo &amp; provinces</span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#f0eef8]">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-500" />
        </div>
        <p className="mt-2 text-[12px] font-medium text-[var(--dim)]">
          Le montant exact de la livraison est confirmé par message selon votre
          adresse — à partir de {fmt(DELIVERY_AR)}.
        </p>
      </section>

      <section className="space-y-3">
        {cart.map((item) => {
          const src = item.imageKey ? IMAGES[item.imageKey] : undefined;
          return (
            <article key={item.key} className="flex gap-3 rounded-[1.6rem] bg-white p-3 shadow-sm">
              {src ? (
                <img src={src} alt={item.name} className="h-24 w-20 shrink-0 rounded-2xl object-cover" />
              ) : (
                <span className="grid h-24 w-20 shrink-0 place-items-center rounded-2xl bg-[var(--mint)] text-[var(--accent)]">
                  <IconBag size={22} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[14px] font-extrabold leading-snug">{item.name}</h3>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    aria-label={`Retirer ${item.name} du panier`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-50 text-red-500"
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
                <p className="mt-0.5 text-[12px] font-medium leading-snug text-[var(--dim)]">
                  {[
                    item.color,
                    item.size ? `Taille ${item.size}` : null,
                    item.customText ? `« ${item.customText} » (${item.customSide ?? "Face"})` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {item.bulkPriceAr != null && item.bulkMinQty != null && item.qty < item.bulkMinQty && (
                  <p className="mt-0.5 text-[11px] font-bold text-[var(--orange)]">
                    Plus que {item.bulkMinQty - item.qty} pour le prix de gros {fmt(item.bulkPriceAr)}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <QtyStepper qty={item.qty} setQty={(q) => setQty(item.key, q)} label={item.name} />
                  <span className="text-[15px] font-extrabold text-[var(--accent)]">
                    {fmt(unitPrice(item) * item.qty)}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </section>
      </div>

      <section className="rounded-[2rem] bg-white p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-[16px] font-extrabold">Livraison</h2>
        <div className="mt-3 space-y-3">
          <div>
            <label className={labelCls} htmlFor="co-name">Nom complet</label>
            <input id="co-name" {...FIELDS.createOrder.customerName} value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" className={inputCls} autoComplete="name" />
          </div>
          <div>
            <label className={labelCls} htmlFor="co-phone">Téléphone</label>
            <input id="co-phone" {...FIELDS.createOrder.phone} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex : 034 00 000 00" className={inputCls} autoComplete="tel" inputMode="tel" />
          </div>
          <div>
            <label className={labelCls} htmlFor="co-address">Adresse de livraison</label>
            <input id="co-address" {...FIELDS.createOrder.address} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Quartier, rue, repère…" className={inputCls} autoComplete="street-address" />
          </div>
          <div>
            <span className={labelCls}>Zone de livraison</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Zone de livraison">
              {(
                [
                  { key: "antananarivo", label: "Antananarivo" },
                  { key: "provinces", label: "Provinces" },
                ] as const
              ).map((z) => (
                <button
                  key={z.key}
                  type="button"
                  role="radio"
                  aria-checked={zone === z.key}
                  onClick={() => setZone(z.key)}
                  className={`rounded-2xl px-3 py-3 text-[13px] font-extrabold ${
                    zone === z.key ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] bg-white text-[var(--dim)]"
                  }`}
                >
                  {z.label}
                  <span className="block text-[11px] font-semibold opacity-80">dès {fmt(DELIVERY_AR)}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="co-note">Note pour la boutique (optionnel)</label>
            <input id="co-note" {...FIELDS.createOrder.note} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Précision, horaire, repère…" className={inputCls} />
          </div>
        </div>

        <dl className="mt-5 space-y-1.5 border-t border-dashed border-[var(--border)] pt-4 text-sm font-medium">
          <div className="flex justify-between">
            <dt className="text-[var(--dim)]">Sous-total articles ({count})</dt>
            <dd className="font-bold">{fmt(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--dim)]">Contrôle qualité avant envoi</dt>
            <dd className="font-bold text-[var(--accent)]">Inclus</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--dim)]">Livraison (à partir de)</dt>
            <dd className="font-bold">{fmt(DELIVERY_AR)}</dd>
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-2.5 text-[16px]">
            <dt className="font-extrabold">Total estimé</dt>
            <dd className="font-extrabold text-[var(--accent)]">{fmt(total)}</dd>
          </div>
        </dl>
        <FieldError message={formError} />
        {STATIC_MODE && (
          <p className="mt-4 rounded-2xl bg-[#f3f3fc] p-3 text-[12.5px] font-medium leading-relaxed text-[var(--dim)]">
            Vitrine en ligne : la commande part par WhatsApp vers la boutique,
            qui confirme la livraison et le paiement par message.
          </p>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={createOrder.isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-4 text-[15px] font-extrabold text-white shadow-lg shadow-emerald-900/25 disabled:opacity-60"
        >
          {createOrder.isPending
            ? "Envoi en cours…"
            : STATIC_MODE
              ? `Commander sur WhatsApp · ${fmt(total)}`
              : `Commander · ${fmt(total)}`}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] font-medium text-[var(--dim)]">
          <IconShield size={14} /> Paiement à la livraison ou par Mobile Money, confirmé par message.
        </p>
      </section>
      </div>
    </div>
  );
}

function OrderSuccess({ reference, go }: { reference: string; go: (r: Route) => void }) {
  const text = encodeURIComponent(
    `Bonjour Nora Essentials, je viens de passer la commande ${reference} sur Nora Store. Merci de me confirmer la livraison.`,
  );
  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-emerald-900/30">
          <IconCheck size={30} />
        </span>
        <h1 className="mt-4 text-[22px] font-extrabold">Commande reçue !</h1>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-[var(--dim)]">
          Votre commande <strong className="text-[var(--text)]">{reference}</strong> est
          bien enregistrée. Nora Essentials vous contactera par téléphone ou
          message pour confirmer la livraison et le paiement.
        </p>
        <a
          href={`https://wa.me/261385610557?text=${text}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3.5 text-[14px] font-extrabold text-white"
        >
          <IconPhone size={17} /> Confirmer plus vite sur WhatsApp
        </a>
        <button
          type="button"
          onClick={() => go({ name: "commandes" })}
          className="mt-3 w-full rounded-full bg-[#f3f3fc] px-5 py-3.5 text-[14px] font-extrabold text-[var(--text)]"
        >
          Voir mes commandes
        </button>
        <button
          type="button"
          onClick={() => go({ name: "accueil" })}
          className="mt-2 w-full px-5 py-2 text-[14px] font-bold text-[var(--accent)]"
        >
          Continuer mes achats
        </button>
      </div>
    </div>
  );
}

/* ---------- Comptes : connexion, inscription, mot de passe oublié ---------- */

function AuthShell({
  title,
  subtitle,
  children,
  go,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  go: (r: Route) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-md space-y-5 lg:pt-6">
      <button
        type="button"
        onClick={() => go({ name: "accueil" })}
        aria-label="Retour à l'accueil"
        className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm"
      >
        <IconBack size={20} />
      </button>
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-[1.2rem] bg-[var(--accent)] font-extrabold text-white shadow-lg shadow-emerald-900/25">
          NE
        </span>
        <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--dim)]">
          Nora Essentials
        </p>
        <h1 className="mt-1 text-[24px] font-extrabold tracking-tight">{title}</h1>
        <p className="mx-auto mt-1.5 max-w-sm text-sm font-medium leading-relaxed text-[var(--dim)]">
          {subtitle}
        </p>
      </div>
      <section className="rounded-[2rem] bg-white p-6 shadow-sm">{children}</section>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className={labelCls} htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          className={`${inputCls} pr-12`}
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-[var(--dim)]"
        >
          <IconEye size={18} />
        </button>
      </div>
    </div>
  );
}

function Connexion({
  go,
  onAuth,
}: {
  go: (r: Route) => void;
  onAuth: (token: string, name: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useMutation({
    mutationFn: async () => await api.login({ email, password }),
    onSuccess: (res) => {
      if (res.ok && res.token && res.name) onAuth(res.token, res.name);
      else setError(res.error ?? "Connexion impossible.");
    },
    onError: () => setError("Vérifiez votre email et votre mot de passe, puis réessayez."),
  });
  const submit = () => {
    if (!email.includes("@")) return setError("Entrez une adresse email valide.");
    if (password.length < 1) return setError("Entrez votre mot de passe.");
    setError(null);
    login.mutate();
  };
  return (
    <AuthShell
      title="Connexion Client"
      subtitle="Bon retour chez Nora Essentials. Accédez à vos commandes et à vos créations personnalisées."
      go={go}
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls} htmlFor="login-email">Email</label>
          <input id="login-email" {...FIELDS.login.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.mg" className={inputCls} autoComplete="email" />
        </div>
        <PasswordField id="login-password" label="Mot de passe" value={password} onChange={setPassword} />
        <div className="text-right">
          <button type="button" onClick={() => go({ name: "oublie" })} className="text-[13px] font-bold text-[var(--accent-2)]">
            Mot de passe oublié ?
          </button>
        </div>
        <FieldError message={error} />
        <button
          type="button"
          onClick={submit}
          disabled={login.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-emerald-900/25 disabled:opacity-60"
        >
          {login.isPending ? "Connexion…" : "Se connecter"} <IconChevron size={17} />
        </button>
        <p className="text-center text-sm font-medium text-[var(--dim)]">
          Nouveau dans la boutique ?{" "}
          <button type="button" onClick={() => go({ name: "inscription" })} className="font-extrabold text-[var(--accent)]">
            Créer un compte
          </button>
        </p>
        <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[12px] font-medium text-[var(--dim)]">
          <IconShield size={14} /> Connexion sécurisée · Vos données restent confidentielles
        </p>
      </div>
    </AuthShell>
  );
}

function Inscription({
  go,
  onAuth,
}: {
  go: (r: Route) => void;
  onAuth: (token: string, name: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const register = useMutation({
    mutationFn: async () => await api.register({ name, email, phone, password }),
    onSuccess: (res) => {
      if (res.ok && res.token && res.name) onAuth(res.token, res.name);
      else setError(res.error ?? "Inscription impossible.");
    },
    onError: () => setError("Vérifiez vos informations, puis réessayez."),
  });
  const submit = () => {
    if (name.trim().length < 2) return setError("Indiquez votre prénom et votre nom.");
    if (!email.includes("@")) return setError("Entrez une adresse email valide.");
    if (phone.trim().length < 8) return setError("Indiquez un numéro de téléphone valide (il servira à retrouver votre compte).");
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (!accept) return setError("Cochez la case pour accepter les conditions de la boutique.");
    setError(null);
    register.mutate();
  };
  return (
    <AuthShell
      title="Bienvenue dans la boutique"
      subtitle="Rejoignez Nora Essentials : suivez vos commandes, retrouvez vos créations et commandez plus vite."
      go={go}
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls} htmlFor="reg-name">Prénom &amp; Nom</label>
          <input id="reg-name" {...FIELDS.register.name} value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom complet" className={inputCls} autoComplete="name" />
        </div>
        <div>
          <label className={labelCls} htmlFor="reg-email">Adresse email</label>
          <input id="reg-email" {...FIELDS.register.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.mg" className={inputCls} autoComplete="email" />
        </div>
        <div>
          <label className={labelCls} htmlFor="reg-phone">Téléphone</label>
          <input id="reg-phone" {...FIELDS.register.phone} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex : 034 00 000 00" className={inputCls} autoComplete="tel" inputMode="tel" />
        </div>
        <PasswordField id="reg-password" label="Mot de passe (8 caractères min.)" value={password} onChange={setPassword} />
        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] font-medium leading-snug text-[var(--dim)]">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#0b5136]"
            aria-label="J'accepte les conditions générales de Nora Essentials"
          />
          J'accepte les Conditions Générales et la Politique de Confidentialité de Nora Essentials.
        </label>
        <FieldError message={error} />
        <button
          type="button"
          onClick={submit}
          disabled={register.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-emerald-900/25 disabled:opacity-60"
        >
          {register.isPending ? "Création…" : "Créer mon compte"} <IconChevron size={17} />
        </button>
        <p className="text-center text-sm font-medium text-[var(--dim)]">
          Déjà membre ?{" "}
          <button type="button" onClick={() => go({ name: "connexion" })} className="font-extrabold text-[var(--accent)]">
            Se connecter
          </button>
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          {[
            { icon: <IconSparkles size={16} />, label: "Nouveautés en avant-première" },
            { icon: <IconPackage size={16} />, label: "Suivi de commandes" },
            { icon: <IconShield size={16} />, label: "Données protégées" },
          ].map((b) => (
            <div key={b.label} className="rounded-2xl bg-[#f7f5ff] px-2 py-3">
              <span className="mx-auto mb-1 grid h-7 w-7 place-items-center text-[var(--accent-2)]">{b.icon}</span>
              <p className="text-[10.5px] font-bold leading-tight text-[var(--dim)]">{b.label}</p>
            </div>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}

function MotDePasseOublie({ go }: { go: (r: Route) => void }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const reset = useMutation({
    mutationFn: async () => await api.resetPassword({ email, phone, newPassword }),
    onSuccess: (res) => {
      if (res.ok) setDone(true);
      else setError(res.error ?? "Réinitialisation impossible.");
    },
    onError: () => setError("Réinitialisation impossible, réessayez."),
  });
  const submit = () => {
    if (!email.includes("@")) return setError("Entrez l'email de votre compte.");
    if (phone.trim().length < 8) return setError("Entrez le numéro de téléphone utilisé à l'inscription.");
    if (newPassword.length < 8) return setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    setError(null);
    reset.mutate();
  };
  return (
    <AuthShell
      title="Mot de passe oublié ?"
      subtitle="Confirmez l'email de votre compte et le numéro de téléphone donné à l'inscription, puis choisissez un nouveau mot de passe."
      go={go}
    >
      {done ? (
        <div className="space-y-4 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--mint)] text-[var(--accent)]">
            <IconCheck size={26} />
          </span>
          <p className="text-[16px] font-extrabold">Mot de passe mis à jour !</p>
          <p className="text-sm font-medium text-[var(--dim)]">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
          <button
            type="button"
            onClick={() => go({ name: "connexion" })}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3.5 text-[15px] font-extrabold text-white"
          >
            Retourner à la connexion <IconChevron size={17} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="reset-email">Adresse email du compte</label>
            <input id="reset-email" {...FIELDS.resetPassword.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.mg" className={inputCls} autoComplete="email" />
          </div>
          <div>
            <label className={labelCls} htmlFor="reset-phone">Téléphone d'inscription</label>
            <input id="reset-phone" {...FIELDS.resetPassword.phone} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex : 034 00 000 00" className={inputCls} autoComplete="tel" inputMode="tel" />
          </div>
          <PasswordField id="reset-password" label="Nouveau mot de passe" value={newPassword} onChange={setNewPassword} />
          <FieldError message={error} />
          <button
            type="button"
            onClick={submit}
            disabled={reset.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-emerald-900/25 disabled:opacity-60"
          >
            {reset.isPending ? "Vérification…" : "Réinitialiser mon mot de passe"} <IconChevron size={17} />
          </button>
          <ol className="space-y-2 rounded-2xl bg-[#f7f5ff] p-4 text-[13px] font-medium text-[var(--dim)]">
            <li><strong className="text-[var(--text)]">1.</strong> Saisissez l'email et le téléphone du compte</li>
            <li><strong className="text-[var(--text)]">2.</strong> Nous vérifions qu'ils correspondent</li>
            <li><strong className="text-[var(--text)]">3.</strong> Votre nouveau mot de passe est actif aussitôt</li>
          </ol>
          <p className="text-center text-sm font-medium text-[var(--dim)]">
            Vous vous souvenez de votre mot de passe ?{" "}
            <button type="button" onClick={() => go({ name: "connexion" })} className="font-extrabold text-[var(--accent)]">
              Se connecter
            </button>
          </p>
          <p className="text-center text-[12px] font-medium text-[var(--dim)]">
            Besoin d'aide ? Écrivez à {SHOP_EMAIL} ou appelez le {SHOP_PHONES[0]}.
          </p>
        </div>
      )}
    </AuthShell>
  );
}

/* ---------- Profil, commandes, gestion ---------- */

const ORDER_STATUS: Record<Order["status"], { label: string; cls: string }> = {
  nouvelle: { label: "Nouvelle", cls: "bg-orange-100 text-orange-700" },
  confirmee: { label: "Confirmée", cls: "bg-violet-100 text-violet-700" },
  livree: { label: "Livrée", cls: "bg-emerald-100 text-emerald-800" },
  annulee: { label: "Annulée", cls: "bg-red-100 text-red-600" },
};

function OrderCard({ order }: { order: Order }) {
  const st = ORDER_STATUS[order.status];
  const date = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <article className="rounded-[1.6rem] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-extrabold">{order.reference}</h3>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${st.cls}`}>{st.label}</span>
      </div>
      <p className="mt-0.5 text-[12px] font-medium text-[var(--dim)]">
        {date} · {order.zone === "antananarivo" ? "Antananarivo" : "Provinces"}
      </p>
      <ul className="mt-2.5 space-y-1 text-[13px] font-medium">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between gap-2">
            <span className="min-w-0 truncate">
              {item.qty} × {item.name}
              {item.size ? ` · T. ${item.size}` : ""}
              {item.customText ? ` · « ${item.customText} »` : ""}
            </span>
            <span className="shrink-0 font-bold">{fmt(item.unitPriceAr * item.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2.5 flex justify-between border-t border-dashed border-[var(--border)] pt-2.5 text-[13px] font-medium">
        <span className="text-[var(--dim)]">Total (livraison incluse dès {fmt(DELIVERY_AR)})</span>
        <span className="font-extrabold text-[var(--accent)]">{fmt(order.totalAr)}</span>
      </div>
    </article>
  );
}

function MesCommandes({ token }: { token: string | null }) {
  const orders = useQuery({
    queryKey: ["my-orders", token],
    queryFn: () => api.myOrders({ token: token ?? "" }),
    enabled: token != null,
  });
  return (
    <div className="space-y-4">
      <h1 className="text-[26px] font-extrabold tracking-tight">Mes commandes</h1>
      {token == null ? (
        <p className="rounded-3xl bg-white p-6 text-center text-sm font-medium text-[var(--dim)]">
          Connectez-vous pour retrouver vos commandes.
        </p>
      ) : orders.isPending ? (
        <p className="rounded-3xl bg-white p-6 text-center text-sm font-medium text-[var(--dim)]">Chargement…</p>
      ) : (orders.data?.orders.length ?? 0) === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-center text-sm font-medium text-[var(--dim)]">
          Vous n'avez pas encore de commande. Les commandes passées en étant
          connecté apparaîtront ici.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.data?.orders.map((o) => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}

function Profil({
  account,
  go,
  onLogout,
}: {
  account: { name: string; email: string; phone: string; isAdmin: boolean } | null;
  go: (r: Route) => void;
  onLogout: () => void;
}) {
  // « Gestion boutique » n'apparaît que pour les comptes administrateurs
  // (adresses désignées par la propriétaire, vérifiées côté serveur).
  const rows: Array<{ icon: ReactNode; label: string; sub: string; action: () => void }> = account
    ? [
        { icon: <IconPackage size={20} />, label: "Mes commandes", sub: "Suivre vos achats et livraisons", action: () => go({ name: "commandes" }) },
        { icon: <IconPalette size={20} />, label: "Atelier de personnalisation", sub: "Créer un t-shirt unique", action: () => go({ name: "atelier" }) },
        ...(account.isAdmin
          ? [{ icon: <IconStore size={20} />, label: "Gestion boutique", sub: "Catalogue et commandes reçues (propriétaire)", action: () => go({ name: "gestion" }) }]
          : []),
      ]
    : STATIC_MODE
      ? [
          { icon: <IconPhone size={20} />, label: "Commander par WhatsApp", sub: "La boutique confirme chaque commande par message", action: () => window.open("https://wa.me/261385610557", "_blank") },
          { icon: <IconPalette size={20} />, label: "Atelier de personnalisation", sub: "Créer un t-shirt unique", action: () => go({ name: "atelier" }) },
        ]
      : [
          { icon: <IconUser size={20} />, label: "Se connecter", sub: "Retrouver vos commandes", action: () => go({ name: "connexion" }) },
          { icon: <IconSparkles size={20} />, label: "Créer un compte", sub: "Commander plus vite", action: () => go({ name: "inscription" }) },
        ];
  return (
    <div className="space-y-5">
      <h1 className="text-[26px] font-extrabold tracking-tight">Profil</h1>
      <section className="rounded-[2rem] bg-[var(--ink)] p-6 text-white shadow-lg">
        {account ? (
          <>
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--accent-2)] text-xl font-extrabold">
              {account.name.charAt(0).toUpperCase()}
            </span>
            <h2 className="mt-3 flex flex-wrap items-center gap-2 text-[19px] font-extrabold">
              {account.name}
              {account.isAdmin && (
                <span className="rounded-full bg-[var(--accent-2)] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">
                  Admin
                </span>
              )}
            </h2>
            <p className="text-sm font-medium text-white/70">{account.email}</p>
            <p className="text-sm font-medium text-white/70">{account.phone}</p>
          </>
        ) : (
          <>
            <h2 className="text-[19px] font-extrabold">Bienvenue chez Nora Essentials</h2>
            <p className="mt-1 max-w-sm text-sm font-medium leading-relaxed text-white/70">
              {STATIC_MODE
                ? "Parcourez la collection et commandez par WhatsApp : la boutique confirme chaque commande par message."
                : "Connectez-vous pour suivre vos commandes, ou commandez directement en invité depuis le panier."}
            </p>
          </>
        )}
      </section>
      <section className="grid gap-2.5 md:grid-cols-2">
        {rows.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={r.action}
            className="flex w-full items-center gap-3.5 rounded-[1.4rem] bg-white p-4 text-left shadow-sm"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--mint)] text-[var(--accent)]">
              {r.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-extrabold">{r.label}</span>
              <span className="block truncate text-[12.5px] font-medium text-[var(--dim)]">{r.sub}</span>
            </span>
            <IconChevron size={18} />
          </button>
        ))}
        {account && (
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3.5 rounded-[1.4rem] bg-white p-4 text-left text-red-600 shadow-sm"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50">
              <IconLogout size={20} />
            </span>
            <span className="text-[15px] font-extrabold">Se déconnecter</span>
          </button>
        )}
      </section>
      <section className="rounded-[2rem] bg-white p-5 text-sm font-medium leading-relaxed text-[var(--dim)] shadow-sm">
        <h2 className="text-[15px] font-extrabold text-[var(--text)]">Nous contacter</h2>
        <p className="mt-1.5">
          Commandes et questions par message privé, ou par téléphone au{" "}
          {SHOP_PHONES.join(" / ")}. Email : {SHOP_EMAIL}. Boutique basée à
          Antananarivo, livraison dans toutes les provinces dès {fmt(DELIVERY_AR)}.
        </p>
      </section>
    </div>
  );
}

/* ---------- Gestion boutique (propriétaire) ---------- */

type ProductForm = {
  id: number | null;
  name: string;
  category: Category;
  tagline: string;
  description: string;
  priceAr: string;
  sizes: string;
  colors: string;
  badge: string;
  customizable: boolean;
  active: boolean;
};

const emptyForm: ProductForm = {
  id: null,
  name: "",
  category: "tshirts",
  tagline: "",
  description: "",
  priceAr: "",
  sizes: "",
  colors: "",
  badge: "",
  customizable: false,
  active: true,
};

function Gestion({
  go,
  token,
  isAdmin,
}: {
  go: (r: Route) => void;
  token: string | null;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"commandes" | "catalogue" | "finalisation">("commandes");
  const [form, setForm] = useState<ProductForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const orders = useQuery({
    queryKey: ["admin-orders", token],
    queryFn: () => api.adminListOrders({ token: token ?? "" }),
    enabled: isAdmin && token != null,
  });
  const products = useQuery({
    queryKey: ["admin-products", token],
    queryFn: () => api.adminListProducts({ token: token ?? "" }),
    enabled: isAdmin && token != null,
  });

  const setStatus = useMutation({
    mutationFn: async (args: { id: number; status: Order["status"] }) =>
      await api.adminSetOrderStatus({ token: token ?? "", ...args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const saveProduct = useMutation({
    mutationFn: async (f: ProductForm) =>
      await api.adminSaveProduct({
        token: token ?? "",
        id: f.id,
        name: f.name,
        category: f.category,
        tagline: f.tagline,
        description: f.description,
        priceAr: Number(f.priceAr) || 0,
        sizes: f.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        colors: f.colors.split(",").map((s) => s.trim()).filter(Boolean),
        badge: f.badge.trim() === "" ? null : f.badge.trim(),
        customizable: f.customizable,
        active: f.active,
      }),
    onSuccess: () => {
      setForm(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => setFormError("Enregistrement impossible : vérifiez le nom et le prix."),
  });

  const submitForm = () => {
    if (!form) return;
    if (form.name.trim().length < 2) return setFormError("Le nom du produit est requis.");
    if (!/^\d+$/.test(form.priceAr.trim())) return setFormError("Le prix doit être un nombre entier en Ariary.");
    setFormError(null);
    saveProduct.mutate(form);
  };

  const newCount = (orders.data?.orders ?? []).filter((o) => o.status === "nouvelle").length;

  if (!isAdmin) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go({ name: "profil" })}
            aria-label="Retour au profil"
            className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm"
          >
            <IconBack size={20} />
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">Gestion boutique</h1>
            <p className="text-[12.5px] font-medium text-[var(--dim)]">Espace propriétaire Nora Essentials</p>
          </div>
        </div>
        <section className="rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold">Accès réservé aux administrateurs</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm font-medium leading-relaxed text-[var(--dim)]">
            {token
              ? "Ce compte n'a pas les droits d'administration de la boutique. Connectez-vous avec un compte administrateur pour gérer le catalogue et les commandes."
              : "Connectez-vous avec un compte administrateur pour gérer le catalogue et les commandes de la boutique."}
          </p>
          <button
            type="button"
            onClick={() => go({ name: token ? "profil" : "connexion" })}
            className="mt-4 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-extrabold text-white"
          >
            {token ? "Retour au profil" : "Se connecter"}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => go({ name: "profil" })}
          aria-label="Retour au profil"
          className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm"
        >
          <IconBack size={20} />
        </button>
        <div>
          <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">Gestion boutique</h1>
          <p className="text-[12.5px] font-medium text-[var(--dim)]">Espace propriétaire Nora Essentials</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-full bg-white p-1.5 shadow-sm" role="tablist" aria-label="Gestion">
        {(
          [
            { key: "commandes", label: `Commandes${newCount > 0 ? ` (${newCount} nouv.)` : ""}` },
            { key: "catalogue", label: "Catalogue" },
            { key: "finalisation", label: "Finalisation" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full py-2.5 text-[13px] font-extrabold ${
              tab === t.key ? "bg-[var(--ink)] text-white" : "text-[var(--dim)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "commandes" && (
        <section className="space-y-3">
          {orders.isPending ? (
            <p className="rounded-3xl bg-white p-6 text-center text-sm font-medium text-[var(--dim)]">Chargement…</p>
          ) : (orders.data?.orders.length ?? 0) === 0 ? (
            <p className="rounded-3xl bg-white p-6 text-center text-sm font-medium text-[var(--dim)]">
              Aucune commande reçue pour le moment. Les commandes des clients
              apparaîtront ici.
            </p>
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {orders.data?.orders.map((o) => (
                <div key={o.id} className="space-y-2">
                <OrderCard order={o} />
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[12px] font-bold text-[var(--dim)]">
                    {o.customerName} · {o.phone} · {o.address}
                    {o.note ? ` · Note : ${o.note}` : ""}
                  </span>
                </div>
                <label className="flex items-center gap-2 px-1">
                  <span className="text-[12.5px] font-extrabold">Statut :</span>
                  <select
                    value={o.status}
                    onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value as Order["status"] })}
                    aria-label={`Statut de la commande ${o.reference}`}
                    className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-[13px] font-bold"
                  >
                    <option value="nouvelle">Nouvelle</option>
                    <option value="confirmee">Confirmée</option>
                    <option value="livree">Livrée</option>
                    <option value="annulee">Annulée</option>
                  </select>
                </label>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "catalogue" && (
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setFormError(null);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/25"
          >
            <IconPlus size={17} /> Ajouter un produit
          </button>
          <div className="grid gap-3 lg:grid-cols-2">
            {products.data?.products.map((p) => (
              <article key={p.id} className="flex items-center gap-3 rounded-[1.4rem] bg-white p-3 shadow-sm">
              <ProductImage product={p} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px] font-extrabold">{p.name}</h3>
                <p className="text-[12px] font-medium text-[var(--dim)]">
                  {fmt(p.priceAr)} · {p.category}
                  {p.bulkPriceAr != null ? ` · gros ${fmt(p.bulkPriceAr)} dès ${p.bulkMinQty}` : ""}
                  {!p.active ? " · Masqué" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForm({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    tagline: p.tagline,
                    description: p.description,
                    priceAr: String(p.priceAr),
                    sizes: p.sizes.join(", "),
                    colors: p.colors.join(", "),
                    badge: p.badge ?? "",
                    customizable: p.customizable,
                    active: p.active,
                  });
                  setFormError(null);
                }}
                className="shrink-0 rounded-full bg-[#f3f3fc] px-4 py-2.5 text-[13px] font-extrabold"
              >
                Modifier
              </button>
              </article>
            ))}
          </div>

          {form && (
            <form
              className="space-y-3.5 rounded-[1.6rem] bg-white p-5 shadow-md"
              onSubmit={(e) => {
                e.preventDefault();
                submitForm();
              }}
            >
              <h3 className="text-[16px] font-extrabold">
                {form.id == null ? "Nouveau produit" : `Modifier ${form.name}`}
              </h3>
              <div>
                <label className={labelCls} htmlFor="pf-name">Nom du produit</label>
                <input id="pf-name" {...FIELDS.adminSaveProduct.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Ex : Sandales Dorées" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="pf-category">Catégorie</label>
                  <select id="pf-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className={inputCls}>
                    <option value="sandales">Sandales</option>
                    <option value="tshirts">T-shirts</option>
                    <option value="gourdes">Gourdes</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="pf-price">Prix (Ar)</label>
                  <input id="pf-price" {...FIELDS.adminSaveProduct.priceAr} value={form.priceAr} onChange={(e) => setForm({ ...form, priceAr: e.target.value })} className={inputCls} inputMode="numeric" placeholder="27000" />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="pf-tagline">Accroche</label>
                <input id="pf-tagline" {...FIELDS.adminSaveProduct.tagline} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inputCls} placeholder="Ex : Cuir souple · Bride croisée" />
              </div>
              <div>
                <label className={labelCls} htmlFor="pf-desc">Description</label>
                <textarea id="pf-desc" {...FIELDS.adminSaveProduct.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} min-h-20`} placeholder="Description du produit…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="pf-sizes">Tailles (séparées par des virgules)</label>
                  <input id="pf-sizes" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className={inputCls} placeholder="S, M, L, XL" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="pf-colors">Couleurs (séparées par des virgules)</label>
                  <input id="pf-colors" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className={inputCls} placeholder="Marron, Noir" />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="pf-badge">Badge (optionnel)</label>
                <input id="pf-badge" {...FIELDS.adminSaveProduct.badge} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className={inputCls} placeholder="Nouveau, Populaire…" />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold">
                  <input type="checkbox" checked={form.customizable} onChange={(e) => setForm({ ...form, customizable: e.target.checked })} className="h-5 w-5 accent-[#0b5136]" />
                  Personnalisable dans l'Atelier
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-5 accent-[#0b5136]" />
                  Visible dans la boutique
                </label>
              </div>
              <FieldError message={formError} />
              <div className="flex gap-2">
                <button type="submit" disabled={saveProduct.isPending} className="flex-1 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">
                  {saveProduct.isPending ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button type="button" onClick={() => setForm(null)} className="rounded-full bg-[#f3f3fc] px-5 py-3 text-sm font-extrabold">
                  Annuler
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {tab === "finalisation" && (
        <section className="space-y-4">
          <div className="rounded-[1.6rem] bg-white p-5 shadow-sm">
            <h2 className="text-[16px] font-extrabold">Avant de partager le site</h2>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-[var(--dim)]">
              L'état de la boutique avant sa mise en avant sur Meta et son
              partage public : ce qui est prêt, et ce qu'il reste à faire.
            </p>
            <ul className="mt-4 space-y-3.5">
              {(
                [
                  {
                    done: true,
                    title: "Catalogue réel en ligne",
                    detail: `${(products.data?.products ?? []).filter((p) => p.active).length} articles actifs avec les photos déposées par la boutique : 8 sandales, les t-shirts imprimés et vierges (adulte et enfant, 3 couleurs) et la Gourde Thermo en 5 couleurs. Prix en Ariary, livraison dès ${fmt(DELIVERY_AR)}.`,
                  },
                  {
                    done: true,
                    title: "Thème qui suit l'article sélectionné",
                    detail:
                      "Les couleurs du site changent selon l'article ouvert — et selon la couleur choisie sur les fiches multi-couleurs — comme précisé dans le fichier de conception d'origine.",
                  },
                  {
                    done: true,
                    title: "Comptes administrateurs reconnus",
                    detail:
                      "essentialsnora@gmail.com et mendrikatiavina16@gmail.com sont les seuls comptes à voir cette Gestion boutique ; l'accès est aussi vérifié côté serveur. Les autres clientes ne voient que leurs propres commandes.",
                  },
                  {
                    done: true,
                    title: "Commandes reçues et suivies ici",
                    detail: `Chaque commande arrive dans l'onglet Commandes (${(orders.data?.orders ?? []).length} reçue(s) pour le moment) et le client peut confirmer par WhatsApp au 038 56 105 57.`,
                  },
                  {
                    done: true,
                    title: "Site adapté à tous les écrans",
                    detail:
                      "Mise en page pensée pour PC, tablette et téléphone : navigation haute sur grand écran, navigation basse sur mobile, grilles de produits jusqu'à 4 colonnes.",
                  },
                  {
                    done: false,
                    title: "Pixel Meta : ID pas encore fourni",
                    detail:
                      "Sans l'ID du Pixel, le site ne peut pas envoyer les vues de produits, les ajouts au panier et les commandes à Meta Business. Créez le Pixel dans Meta Business Suite (Gestionnaire d'événements), puis transmettez son ID : il sera ajouté au site et les événements partiront vers Meta.",
                  },
                  {
                    done: true,
                    title: "Compte GitHub relié",
                    detail:
                      "Le compte GitHub mendrikatiavina16 est connecté et Muse peut y déposer des fichiers. La vitrine du site est préparée pour GitHub Pages : catalogue réel affiché, commandes par WhatsApp.",
                  },
                  {
                    done: false,
                    title: "Dépôt GitHub « nora-store » : à créer",
                    detail:
                      "L'application GitHub de Muse ne peut pas créer de dépôt (GitHub le refuse) : créez le dépôt vide « nora-store » sur github.com (bouton « New repository », sans README), puis dites-le ici — la vitrine sera envoyée dans le dépôt aussitôt.",
                  },
                  {
                    done: false,
                    title: "Adresse publique : après l'envoi sur GitHub",
                    detail:
                      "Une fois la vitrine dans le dépôt, activez GitHub Pages (Settings → Pages → branche main, dossier racine) : GitHub affichera l'adresse publique du site au même endroit. GitHub Pages héberge la vitrine seule — comptes clients, commandes enregistrées et cette Gestion restent dans l'application Muse, et le Pixel Meta ne suivra les clientes que sur une adresse publique.",
                  },
                ] as const
              ).map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                      item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.done ? (
                      <IconCheck size={14} />
                    ) : (
                      <span className="block h-2 w-2 rounded-full bg-amber-500" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-extrabold">
                      {item.title}
                      <span
                        className={`ml-2 whitespace-nowrap rounded-full px-2 py-0.5 align-middle text-[10.5px] font-extrabold uppercase tracking-wide ${
                          item.done ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.done ? "Prêt" : "À faire"}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[13px] font-medium leading-relaxed text-[var(--dim)]">
                      {item.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.6rem] bg-white p-5 shadow-sm">
            <h2 className="text-[16px] font-extrabold">Publier la vitrine sur GitHub</h2>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-[var(--dim)]">
              Compte relié :{" "}
              <a
                href="https://github.com/mendrikatiavina16"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[var(--accent)] underline"
              >
                github.com/mendrikatiavina16
              </a>
            </p>
            <ol className="mt-2.5 list-decimal space-y-2 pl-5 text-[13.5px] font-medium leading-relaxed text-[var(--dim)]">
              <li>
                Sur github.com, créez un <strong className="text-[var(--text)]">nouveau dépôt public</strong> nommé{" "}
                <strong className="text-[var(--text)]">nora-store</strong>, complètement vide : ne cochez ni README,
                ni .gitignore, ni licence. (L'application GitHub de Muse sait écrire dans un dépôt, mais GitHub
                lui refuse d'en créer un.)
              </li>
              <li>
                Revenez ici et dites <strong className="text-[var(--text)]">« le dépôt est créé »</strong> : la
                vitrine du site — un seul fichier autonome avec le catalogue et les photos — est envoyée dans le
                dépôt immédiatement.
              </li>
              <li>
                Dans le dépôt, ouvrez <strong className="text-[var(--text)]">Settings → Pages</strong>, choisissez
                la branche <strong className="text-[var(--text)]">main</strong> et le dossier racine, puis
                enregistrez : GitHub affiche alors l'adresse publique de la vitrine, à partager sur la Page
                Facebook et dans les publications.
              </li>
            </ol>
            <p className="mt-3 rounded-2xl bg-[#f3f3fc] p-3.5 text-[13px] font-medium leading-relaxed text-[var(--dim)]">
              La vitrine GitHub Pages présente le catalogue et prend les commandes par WhatsApp. La boutique
              complète — comptes clients, commandes enregistrées, Gestion boutique — reste ici, dans
              l'application Muse : GitHub Pages ne fait tourner aucun serveur.
            </p>
          </div>

          <div className="rounded-[1.6rem] bg-white p-5 shadow-sm">
            <h2 className="text-[16px] font-extrabold">Relier les commandes à Meta Business</h2>
            <ol className="mt-2.5 list-decimal space-y-2 pl-5 text-[13.5px] font-medium leading-relaxed text-[var(--dim)]">
              <li>
                Dans Meta Business Suite, ouvrez le <strong className="text-[var(--text)]">Gestionnaire d'événements</strong> et
                créez un Pixel pour Nora Essentials.
              </li>
              <li>
                Copiez l'<strong className="text-[var(--text)]">ID du Pixel</strong> (une suite de chiffres) et transmettez-le ici,
                dans la conversation.
              </li>
              <li>
                Dès réception, l'ID est ajouté au site : les vues de produits,
                les ajouts au panier et les commandes (avec le montant et la
                référence) seront envoyés à Meta, visibles dans le
                Gestionnaire d'événements et utilisables pour les publicités.
              </li>
            </ol>
            <p className="mt-3 rounded-2xl bg-[#f3f3fc] p-3.5 text-[13px] font-medium leading-relaxed text-[var(--dim)]">
              En attendant, rien n'est perdu : toutes les commandes restent
              enregistrées dans l'onglet Commandes de cette Gestion boutique.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- Racine ---------- */

export function App() {
  const [route, setRoute] = useState<Route>({ name: "accueil" });
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = storageGet("nora-cart");
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [token, setToken] = useState<string | null>(() => storageGet("nora-token"));
  const [theme, setTheme] = useState<ThemeVars>(DEFAULT_THEME);
  const [toast, setToast] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => api.listProducts({}),
  });
  // Vitrine statique (GitHub Pages) : pas de serveur, le catalogue embarqué
  // s'affiche directement. Dans l'application Muse (STATIC_MODE toujours
  // faux), le catalogue vient toujours du serveur.
  const products =
    productsQuery.data?.products ?? (STATIC_MODE ? STATIC_PRODUCTS : []);

  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: () => api.me({ token: token ?? "" }),
    enabled: token != null,
  });
  const account = meQuery.data?.account ?? null;

  const seededRef = useRef(false);
  useEffect(() => {
    if (STATIC_MODE) return;
    if (!seededRef.current && productsQuery.isSuccess && products.length === 0) {
      seededRef.current = true;
      void api.seedCatalogue({}).then(() => productsQuery.refetch());
    }
  }, [productsQuery, products.length]);

  // Une fois le catalogue chargé, remplace les t-shirts et gourdes génériques
  // par les vrais modèles (photos de la propriétaire) s'ils n'y sont pas encore.
  const syncedRef = useRef(false);
  useEffect(() => {
    if (STATIC_MODE) return;
    if (
      !syncedRef.current &&
      productsQuery.isSuccess &&
      products.length > 0 &&
      !products.some((p) => p.imageKey === "tshirt-rose-citrus")
    ) {
      syncedRef.current = true;
      void api.syncRealTshirtsGourdes({}).then(() => productsQuery.refetch());
    }
  }, [productsQuery, products]);

  // Une fois le catalogue chargé, fusionne les 5 fiches gourdes en un seul
  // produit à 5 couleurs (comme les t-shirts vierges) si ce n'est pas fait.
  const gourdeMergedRef = useRef(false);
  useEffect(() => {
    if (STATIC_MODE) return;
    if (
      !gourdeMergedRef.current &&
      productsQuery.isSuccess &&
      products.filter((p) => p.category === "gourdes").length > 1
    ) {
      gourdeMergedRef.current = true;
      void api.mergeGourdes({}).then(() => productsQuery.refetch());
    }
  }, [productsQuery, products]);

  useEffect(() => {
    storageSet("nora-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  // Applique le thème courant (celui de l'article sélectionné) aux
  // variables CSS globales : accents, fond de page et halos suivent.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--accent", theme.accent);
    root.setProperty("--accent-2", theme.accent2);
    root.setProperty("--mint", theme.soft);
    root.setProperty("--bg", theme.bg);
    root.setProperty("--border", theme.border);
    root.setProperty("--glow-1", theme.glow1);
    root.setProperty("--glow-2", theme.glow2);
    root.setProperty("--space-surface-alt", theme.soft);
  }, [theme]);

  // Thème de base selon la page : l'accueil prend le thème de l'article
  // vedette (le T-shirt Rose Citrus, affiché au premier plan → rose /
  // fuchsia), la fiche produit celui de l'article ouvert, l'Atelier celui
  // du modèle de base. La fiche et l'Atelier affinent ensuite le thème
  // quand la couleur change (voir leurs effets). Les autres pages
  // reviennent au thème par défaut de la boutique.
  const themeBaseRef = useRef<{ key: string; resolved: boolean }>({
    key: "",
    resolved: false,
  });
  useEffect(() => {
    const key = JSON.stringify(route);
    const prev = themeBaseRef.current;
    if (prev.key === key && prev.resolved) return;
    let resolved = true;
    if (route.name === "accueil") {
      const hero =
        products.find((p) => p.imageKey === "tshirt-rose-citrus") ?? products[0];
      if (hero) setTheme(themeForProduct(hero));
      else resolved = productsQuery.isSuccess;
    } else if (route.name === "produit") {
      const p = products.find((x) => x.id === route.id);
      if (p) setTheme(themeForProduct(p));
      else resolved = false;
    } else if (route.name === "atelier") {
      const p =
        products.find((x) => x.id === route.productId) ??
        products.find((x) => x.customizable);
      if (p) setTheme(themeForProduct(p));
      else resolved = false;
    } else {
      setTheme(DEFAULT_THEME);
    }
    themeBaseRef.current = { key, resolved };
  }, [route, products, productsQuery.isSuccess]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  };

  const go = (r: Route) => {
    setOrderRef(null);
    setRoute(r);
  };

  const addToCart = (p: Product, opts?: Partial<CartItem>) => {
    const item: CartItem = {
      key: "",
      productId: p.id,
      name: p.name,
      imageKey: p.imageKey,
      unitPriceAr: p.priceAr,
      bulkPriceAr: p.bulkPriceAr,
      bulkMinQty: p.bulkMinQty,
      qty: opts?.qty ?? 1,
      size: opts?.size ?? (p.sizes[0] ?? null),
      color: opts?.color ?? (p.colors[0] ?? null),
      customText: opts?.customText ?? null,
      customSide: opts?.customSide ?? null,
    };
    item.key = cartKey(item);
    setCart((prev) => {
      const existing = prev.find((i) => i.key === item.key);
      if (existing) {
        return prev.map((i) => (i.key === item.key ? { ...i, qty: Math.min(99, i.qty + item.qty) } : i));
      }
      return [...prev, item];
    });
    showToast(`${p.name} ajouté au panier`);
  };

  const onAuth = (newToken: string, name: string) => {
    storageSet("nora-token", newToken);
    setToken(newToken);
    showToast(`Bienvenue, ${name} !`);
    setRoute({ name: "profil" });
  };

  const onLogout = async () => {
    if (token) await api.logout({ token }).catch(() => undefined);
    storageRemove("nora-token");
    setToken(null);
    showToast("Vous êtes déconnecté");
    setRoute({ name: "accueil" });
  };

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const currentProduct =
    route.name === "produit" ? products.find((p) => p.id === route.id) : undefined;

  return (
    <div className="min-h-screen">
      <SafeAreaTopScrim backgroundColor="var(--bg)" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-3 sm:px-6 md:pb-14 lg:px-10">
        {route.name !== "connexion" && route.name !== "inscription" && route.name !== "oublie" && (
          <Header route={route.name} go={go} cartCount={cartCount} accountName={account?.name ?? null} />
        )}
        <main className="pt-3">
          {productsQuery.isPending && !STATIC_MODE && route.name !== "gestion" ? (
            <p className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-[var(--dim)]">
              Chargement de la boutique…
            </p>
          ) : route.name === "accueil" ? (
            <Accueil products={products} go={go} addToCart={addToCart} />
          ) : route.name === "collection" ? (
            <Collection
              products={products}
              initialCategory={route.category ?? "tous"}
              go={go}
              addToCart={addToCart}
            />
          ) : route.name === "produit" ? (
            currentProduct ? (
              <FicheProduit
                product={currentProduct}
                go={go}
                addToCart={addToCart}
                openAtelier={(id) => go({ name: "atelier", productId: id })}
                onThemeChange={setTheme}
              />
            ) : (
              <p className="rounded-3xl bg-white p-8 text-center text-sm font-medium text-[var(--dim)]">
                Ce produit n'est plus disponible.
              </p>
            )
          ) : route.name === "atelier" ? (
            <Atelier
              products={products}
              initialProductId={route.productId}
              addToCart={addToCart}
              go={go}
              onThemeChange={setTheme}
            />
          ) : route.name === "panier" ? (
            orderRef ? (
              <OrderSuccess reference={orderRef} go={go} />
            ) : (
              <Panier
                cart={cart}
                setQty={(key, qty) =>
                  setCart((prev) => prev.map((i) => (i.key === key ? { ...i, qty } : i)))
                }
                removeItem={(key) => setCart((prev) => prev.filter((i) => i.key !== key))}
                clearCart={() => setCart([])}
                account={account ? { name: account.name, phone: account.phone } : null}
                go={go}
                onOrderDone={(ref) => setOrderRef(ref)}
              />
            )
          ) : route.name === "connexion" ? (
            <Connexion go={go} onAuth={onAuth} />
          ) : route.name === "inscription" ? (
            <Inscription go={go} onAuth={onAuth} />
          ) : route.name === "oublie" ? (
            <MotDePasseOublie go={go} />
          ) : route.name === "profil" ? (
            <Profil account={account} go={go} onLogout={onLogout} />
          ) : route.name === "commandes" ? (
            <MesCommandes token={token} />
          ) : (
            <Gestion go={go} token={token} isAdmin={account?.isAdmin ?? false} />
          )}
        </main>
        {route.name !== "connexion" && route.name !== "inscription" && route.name !== "oublie" && (
          <Footer go={go} />
        )}
      </div>
      <BottomNav route={route.name} go={go} cartCount={cartCount} />
      <Toast message={toast} />
    </div>
  );
}
