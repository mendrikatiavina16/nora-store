// Actions for Nora Store — catalogue, comptes clients, commandes et
// gestion boutique (propriétaire).
//
// Le catalogue est amorcé une seule fois (seedCatalogue) à partir des
// produits réels de Nora Essentials fournis par la propriétaire :
// sandales importées 27 000 Ar (25 000 Ar dès 3 paires, pointures 36-40),
// t-shirts importés 30 000 Ar (tailles S-XL, 5 modèles), gourde thermo
// 25 000 Ar (450 ml, 1 fiche, 5 couleurs de couvercle). Livraison dès 4 000 Ar.

import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { desc, eq } from "drizzle-orm";
import * as schema from "./schema";

const DELIVERY_AR = 4000;

const productOut = z.object({
  id: z.number(),
  name: z.string(),
  category: z.enum(["sandales", "tshirts", "gourdes"]),
  tagline: z.string(),
  description: z.string(),
  priceAr: z.number(),
  bulkPriceAr: z.number().nullable(),
  bulkMinQty: z.number().nullable(),
  sizes: z.array(z.string()),
  colors: z.array(z.string()),
  imageKey: z.string().nullable(),
  badge: z.string().nullable(),
  rating: z.number().nullable(),
  reviews: z.number(),
  customizable: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number(),
});

type ProductRow = typeof schema.products.$inferSelect;

function toProduct(row: ProductRow): z.infer<typeof productOut> {
  const parse = (raw: string): string[] => {
    try {
      const v: unknown = JSON.parse(raw);
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  };
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    tagline: row.tagline,
    description: row.description,
    priceAr: row.priceAr,
    bulkPriceAr: row.bulkPriceAr,
    bulkMinQty: row.bulkMinQty,
    sizes: parse(row.sizes),
    colors: parse(row.colors),
    imageKey: row.imageKey,
    badge: row.badge,
    rating: row.rating,
    reviews: row.reviews,
    customizable: row.customizable,
    active: row.active,
    sortOrder: row.sortOrder,
  };
}

const orderLine = z.object({
  productId: z.number(),
  name: z.string(),
  unitPriceAr: z.number(),
  qty: z.number(),
  size: z.string().nullable(),
  color: z.string().nullable(),
  customText: z.string().nullable(),
  customSide: z.string().nullable(),
});

const orderOut = z.object({
  id: z.number(),
  reference: z.string(),
  customerName: z.string(),
  phone: z.string(),
  address: z.string(),
  zone: z.enum(["antananarivo", "provinces"]),
  note: z.string(),
  items: z.array(orderLine),
  subtotalAr: z.number(),
  deliveryAr: z.number(),
  totalAr: z.number(),
  status: z.enum(["nouvelle", "confirmee", "livree", "annulee"]),
  createdAt: z.string(),
});

type OrderRow = typeof schema.orders.$inferSelect;

function toOrder(row: OrderRow): z.infer<typeof orderOut> {
  let items: z.infer<typeof orderLine>[] = [];
  try {
    const v: unknown = JSON.parse(row.items);
    if (Array.isArray(v)) {
      items = v
        .map((x) => orderLine.safeParse(x))
        .filter((r) => r.success)
        .map((r) => (r as { data: z.infer<typeof orderLine> }).data);
    }
  } catch {
    items = [];
  }
  return {
    id: row.id,
    reference: row.reference,
    customerName: row.customerName,
    phone: row.phone,
    address: row.address,
    zone: row.zone,
    note: row.note,
    items,
    subtotalAr: row.subtotalAr,
    deliveryAr: row.deliveryAr,
    totalAr: row.totalAr,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function newToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function accountForToken(ctx: Ctx, token: string) {
  const db = ctx.db<typeof schema>();
  const rows = await db
    .select({ account: schema.accounts })
    .from(schema.sessions)
    .innerJoin(schema.accounts, eq(schema.sessions.accountId, schema.accounts.id))
    .where(eq(schema.sessions.token, token))
    .limit(1);
  return rows[0]?.account ?? null;
}

// Comptes administrateurs de la boutique, désignés par la propriétaire
// (2026-11-25) : tout compte client créé avec l'une de ces adresses est
// reconnu comme admin — il voit la « Gestion boutique » et ses actions
// d'administration sont autorisées côté serveur. Les autres comptes ne
// voient que leurs propres commandes.
const ADMIN_EMAILS = new Set([
  "essentialsnora@gmail.com",
  "mendrikatiavina16@gmail.com",
]);

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}

async function requireAdmin(ctx: Ctx, token: string) {
  const account = await accountForToken(ctx, token);
  if (!account || !isAdminEmail(account.email)) {
    throw new Error("Accès réservé aux comptes administrateurs de la boutique.");
  }
  return account;
}

type SeedProduct = {
  name: string;
  category: "sandales" | "tshirts" | "gourdes";
  tagline: string;
  description: string;
  priceAr: number;
  bulkPriceAr?: number;
  bulkMinQty?: number;
  sizes: string[];
  colors: string[];
  imageKey: string;
  badge?: string;
  customizable?: boolean;
};

// Les 8 modèles de sandales réellement vendus par Nora Essentials, avec les
// vraies photos de la propriétaire (une par modèle, marron en premier).
// Prix unique de la ligne : 27 000 Ar, 25 000 Ar dès 3 paires, pointures 36-40.
const realSandals: SeedProduct[] = [
  {
    name: "Sandales Marron Maille",
    category: "sandales",
    tagline: "Maille tressée · Médaillon doré",
    description:
      "Mules importées en maille tressée marron, finies par un médaillon doré. Le modèle mis en avant en boutique, doux et léger au pied.",
    priceAr: 27000,
    bulkPriceAr: 25000,
    bulkMinQty: 3,
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["Marron"],
    imageKey: "sandales-marron-maille",
    badge: "Populaire",
  },
  {
    name: "Sandales Argent Strass",
    category: "sandales",
    tagline: "Brides torsadées · Strass scintillants",
    description:
      "Sandales plates importées argentées : brides torsadées et large bride sertie de strass. L'éclat qu'il faut pour illuminer une tenue.",
    priceAr: 27000,
    bulkPriceAr: 25000,
    bulkMinQty: 3,
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["Argent"],
    imageKey: "sandales-argent-strass",
  },
  {
    name: "Sandales Doré Strass",
    category: "sandales",
    tagline: "Brides torsadées · Strass scintillants",
    description:
      "Sandales plates importées dorées : brides torsadées et large bride sertie de strass. Une touche de lumière, du jour comme du soir.",
    priceAr: 27000,
    bulkPriceAr: 25000,
    bulkMinQty: 3,
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["Doré"],
    imageKey: "sandales-dore-strass",
  },
  {
    name: "Sandales Noir Ajouré",
    category: "sandales",
    tagline: "Découpes géométriques · Bride arrière",
    description:
      "Sandales plates importées noires, empeigne ajourée aux motifs géométriques et bride arrière. Aérées et faciles à porter toute la journée.",
    priceAr: 27000,
    bulkPriceAr: 25000,
    bulkMinQty: 3,
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["Noir"],
    imageKey: "sandales-noir-ajoure",
  },
  {
    name: "Sandales Motif Boucles",
    category: "sandales",
    tagline: "Motif noir & blanc · Semelle liège",
    description:
      "Mules importées en tissu à motif noir et blanc, doubles boucles dorées ajustables et semelle effet liège. Le modèle décontracté qui ne passe pas inaperçu.",
    priceAr: 27000,
    bulkPriceAr: 25000,
    bulkMinQty: 3,
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["Noir & blanc"],
    imageKey: "sandales-motif-boucles",
  },
  {
    name: "Sandales Blanc Ajouré",
    category: "sandales",
    tagline: "Découpes géométriques · Bride arrière",
    description:
      "Sandales plates importées blanches, empeigne ajourée aux motifs géométriques et bride arrière. Fraîches et lumineuses, elles vont avec tout.",
    priceAr: 27000,
    bulkPriceAr: 25000,
    bulkMinQty: 3,
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["Blanc"],
    imageKey: "sandales-blanc-ajoure",
  },
  {
    name: "Sandales Noir Maille",
    category: "sandales",
    tagline: "Maille fine · Médaillon doré",
    description:
      "Mules importées noires en maille fine, finies par un médaillon doré. Élégantes et légères, elles habillent le pied en douceur.",
    priceAr: 27000,
    bulkPriceAr: 25000,
    bulkMinQty: 3,
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["Noir"],
    imageKey: "sandales-noir-maille",
  },
  {
    name: "Sandales Blanc & Doré",
    category: "sandales",
    tagline: "Brides tressées · Finitions dorées",
    description:
      "Sandales plates importées à brides croisées blanches et dorées, dont une tressée. Le duo blanc-doré qui va avec toutes les tenues.",
    priceAr: 27000,
    bulkPriceAr: 25000,
    bulkMinQty: 3,
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["Blanc & doré"],
    imageKey: "sandales-blanc-dore",
    badge: "Nouveau",
  },
];

// Les vrais modèles de t-shirts vendus par Nora Essentials, avec les photos
// fournies par la propriétaire (nov. 2026) : 5 imprimés, le vierge adulte
// 100 % coton (étiquette lue sur sa photo : lavage 40 °C max, tailles S-XL)
// et le vierge enfant 2 à 14 ans. Les vierges existent en noir, blanc et rouge
// (photo par couleur, fournie par la propriétaire).
// Prix donnés par la propriétaire : imprimés 30 000 Ar, vierge adulte
// 15 000 Ar (tailles S-XL), vierge enfant 10 000 Ar.
const ADULT_SIZES = ["S", "M", "L", "XL"];
const KID_SIZES = ["2 ans", "4 ans", "6 ans", "8 ans", "10 ans", "12 ans", "14 ans"];

const realTshirts: SeedProduct[] = [
  {
    name: "T-shirt Rose Citrus",
    category: "tshirts",
    tagline: "Imprimé Citrus · Cerises & agrumes",
    description:
      "T-shirt importé rose à grand imprimé « Citrus » : cerises et agrumes sur fond rayé rose bonbon. Le modèle le plus frais de la collection.",
    priceAr: 30000,
    sizes: ADULT_SIZES,
    colors: ["Rose"],
    imageKey: "tshirt-rose-citrus",
    badge: "Nouveau",
  },
  {
    name: "T-shirt Blanc Lobster",
    category: "tshirts",
    tagline: "Imprimé The Lobster Best · Homard & citrons",
    description:
      "T-shirt importé blanc à imprimé « The Lobster Best » : homard rouge et quartiers de citron sur fond rayé pêche.",
    priceAr: 30000,
    sizes: ADULT_SIZES,
    colors: ["Blanc"],
    imageKey: "tshirt-blanc-lobster",
  },
  {
    name: "T-shirt Jaune Citrus",
    category: "tshirts",
    tagline: "Imprimé Citrus · Citrons graphiques",
    description:
      "T-shirt importé jaune pâle à imprimé « Citrus » : citrons entiers et en quartiers sur fond rayé bleu et jaune.",
    priceAr: 30000,
    sizes: ADULT_SIZES,
    colors: ["Jaune"],
    imageKey: "tshirt-jaune-citrus",
  },
  {
    name: "T-shirt Lilas Dolce Vita",
    category: "tshirts",
    tagline: "Imprimé Dolce Vita · Citron",
    description:
      "T-shirt importé lilas à imprimé « Dolce Vita » : un citron et ses feuilles dans un cadre violet rayé.",
    priceAr: 30000,
    sizes: ADULT_SIZES,
    colors: ["Lilas"],
    imageKey: "tshirt-lilas-dolce-vita",
  },
  {
    name: "T-shirt Noir Cœur Rayonnant",
    category: "tshirts",
    tagline: "Imprimé cœur rayonnant · Rouge sur noir",
    description:
      "T-shirt importé noir à grand imprimé rouge : un visage en forme de cœur entouré de rayons ondulés. Le modèle qui ne passe pas inaperçu.",
    priceAr: 30000,
    sizes: ADULT_SIZES,
    colors: ["Noir"],
    imageKey: "tshirt-noir-coeur",
  },
  {
    name: "T-shirt Vierge Noir",
    category: "tshirts",
    tagline: "100 % coton · Vierge — noir, blanc ou rouge",
    description:
      "T-shirt vierge importé, 100 % coton — l'étiquette précise un lavage à 40 °C maximum. Sans aucun imprimé : portez-le tel quel ou personnalisez-le dans l'Atelier avec votre texte. Trois couleurs : noir, blanc et rouge — choisissez la couleur ci-dessous, la photo suit.",
    priceAr: 15000,
    sizes: ADULT_SIZES,
    colors: ["Noir", "Blanc", "Rouge"],
    imageKey: "tshirt-vierge-noir",
    customizable: true,
  },
  {
    name: "T-shirt Enfant Vierge Blanc",
    category: "tshirts",
    tagline: "Enfant 2 à 14 ans · Vierge, blanc, noir ou rouge",
    description:
      "T-shirt enfant vierge importé, sans imprimé, pour les 2 à 14 ans. Trois couleurs : blanc, noir et rouge — choisissez la couleur ci-dessous, la photo suit. Parfait tel quel ou à personnaliser dans l'Atelier pour un cadeau unique.",
    priceAr: 10000,
    sizes: KID_SIZES,
    colors: ["Blanc", "Noir", "Rouge"],
    imageKey: "tshirt-enfant-blanc",
    customizable: true,
    badge: "Enfant",
  },
];

// La gourde thermo de Nora Essentials, présentée en UNE seule fiche comme
// les t-shirts vierges : 5 couleurs de couvercle au choix (crème, noir,
// bordeaux, brun, bleu marine), avec une vraie photo déposée par la
// propriétaire pour chaque couleur — la photo de la fiche suit la couleur
// choisie. Écran de température sur le couvercle et dragonne « Coffee ».
// Prix unique : 25 000 Ar, 450 ml.
const realGourdes: SeedProduct[] = [
  {
    name: "Gourde Thermo",
    category: "gourdes",
    tagline: "450 ml · 5 couleurs · Température affichée sur le couvercle",
    description:
      "Gourde thermo importée de 450 ml. Cinq couleurs de couvercle au choix : crème, noir, bordeaux, brun et bleu marine — choisissez la couleur ci-dessous, la photo suit. L'écran du couvercle affiche la température de la boisson, et la dragonne « Coffee » permet de l'emporter partout. Garde le chaud et le froid pendant des heures.",
    priceAr: 25000,
    sizes: [],
    colors: ["Crème", "Noir", "Bordeaux", "Brun", "Bleu marine"],
    imageKey: "gourde-creme",
    badge: "Populaire",
  },
];

const seedProducts: SeedProduct[] = [...realSandals, ...realTshirts, ...realGourdes];

export const Actions = {
  listProducts: defineAction({
    description: "Liste les produits actifs du catalogue Nora Essentials.",
    request: z.object({}),
    response: z.object({ products: z.array(productOut) }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.active, true))
        .orderBy(schema.products.sortOrder, schema.products.id);
      return { products: rows.map(toProduct) };
    },
  }),

  seedCatalogue: defineAction({
    description:
      "Amorce le catalogue avec les produits réels de Nora Essentials si la boutique est vide.",
    request: z.object({}),
    response: z.object({ seeded: z.boolean(), count: z.number() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const existing = await db.select({ id: schema.products.id }).from(schema.products).limit(1);
      if (existing.length > 0) return { seeded: false, count: 0 };
      for (const [i, p] of seedProducts.entries()) {
        await db.insert(schema.products).values({
          name: p.name,
          category: p.category,
          tagline: p.tagline,
          description: p.description,
          priceAr: p.priceAr,
          bulkPriceAr: p.bulkPriceAr ?? null,
          bulkMinQty: p.bulkMinQty ?? null,
          sizes: JSON.stringify(p.sizes),
          colors: JSON.stringify(p.colors),
          imageKey: p.imageKey,
          badge: p.badge ?? null,
          customizable: p.customizable ?? false,
          sortOrder: i,
        });
      }
      ctx.invalidateQueries();
      return { seeded: true, count: seedProducts.length };
    },
  }),

  syncRealSandals: defineAction({
    description:
      "Remplace les sandales génériques du catalogue par les 8 modèles réels de Nora Essentials (vraies photos de la propriétaire).",
    request: z.object({}),
    response: z.object({ updated: z.number(), inserted: z.number(), retired: z.number() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const realKeys = new Set(realSandals.map((p) => p.imageKey));
      const rows = await db.select().from(schema.products);
      let updated = 0;
      let inserted = 0;
      let retired = 0;
      // Retire (sans supprimer) les sandales qui ne sont pas des modèles réels,
      // pour préserver l'historique d'éventuelles commandes.
      for (const row of rows) {
        if (
          row.category === "sandales" &&
          !(row.imageKey && realKeys.has(row.imageKey)) &&
          row.active
        ) {
          await db
            .update(schema.products)
            .set({ active: false })
            .where(eq(schema.products.id, row.id));
          retired++;
        }
      }
      // Insère ou met à jour les 8 modèles réels.
      for (const [i, p] of realSandals.entries()) {
        const values = {
          name: p.name,
          category: p.category,
          tagline: p.tagline,
          description: p.description,
          priceAr: p.priceAr,
          bulkPriceAr: p.bulkPriceAr ?? null,
          bulkMinQty: p.bulkMinQty ?? null,
          sizes: JSON.stringify(p.sizes),
          colors: JSON.stringify(p.colors),
          imageKey: p.imageKey,
          badge: p.badge ?? null,
          customizable: p.customizable ?? false,
          active: true,
          sortOrder: i,
        };
        const existing = rows.find((r) => r.imageKey === p.imageKey);
        if (existing) {
          await db.update(schema.products).set(values).where(eq(schema.products.id, existing.id));
          updated++;
        } else {
          await db.insert(schema.products).values(values);
          inserted++;
        }
      }
      // Réordonne le reste du catalogue après les sandales : t-shirts puis gourdes.
      const rest = rows
        .filter((r) => r.category !== "sandales")
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      let offset = realSandals.length;
      for (const row of rest) {
        if (row.sortOrder !== offset) {
          await db
            .update(schema.products)
            .set({ sortOrder: offset })
            .where(eq(schema.products.id, row.id));
        }
        offset++;
      }
      ctx.invalidateQueries();
      return { updated, inserted, retired };
    },
  }),

  syncRealTshirtsGourdes: defineAction({
    description:
      "Remplace les t-shirts et gourdes génériques du catalogue par les vrais modèles de Nora Essentials (photos fournies par la propriétaire : 5 t-shirts imprimés, vierges adulte et enfant en 3 couleurs, 1 gourde thermo en 5 couleurs de couvercle).",
    request: z.object({}),
    response: z.object({ updated: z.number(), inserted: z.number(), retired: z.number() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const realLines: Array<{ category: "tshirts" | "gourdes"; items: SeedProduct[] }> = [
        { category: "tshirts", items: realTshirts },
        { category: "gourdes", items: realGourdes },
      ];
      const rows = await db.select().from(schema.products);
      let updated = 0;
      let inserted = 0;
      let retired = 0;
      for (const line of realLines) {
        const realKeys = new Set(line.items.map((p) => p.imageKey));
        // Retire (sans supprimer) les lignes qui ne sont pas des modèles réels.
        for (const row of rows) {
          if (
            row.category === line.category &&
            !(row.imageKey && realKeys.has(row.imageKey)) &&
            row.active
          ) {
            await db
              .update(schema.products)
              .set({ active: false })
              .where(eq(schema.products.id, row.id));
            retired++;
          }
        }
        // Insère ou met à jour les modèles réels.
        for (const p of line.items) {
          const values = {
            name: p.name,
            category: p.category,
            tagline: p.tagline,
            description: p.description,
            priceAr: p.priceAr,
            bulkPriceAr: p.bulkPriceAr ?? null,
            bulkMinQty: p.bulkMinQty ?? null,
            sizes: JSON.stringify(p.sizes),
            colors: JSON.stringify(p.colors),
            imageKey: p.imageKey,
            badge: p.badge ?? null,
            customizable: p.customizable ?? false,
            active: true,
          };
          const existing = rows.find((r) => r.imageKey === p.imageKey);
          if (existing) {
            await db.update(schema.products).set(values).where(eq(schema.products.id, existing.id));
            updated++;
          } else {
            await db.insert(schema.products).values({ ...values, sortOrder: 999 });
            inserted++;
          }
        }
      }
      // Réordonne tout le catalogue : sandales, puis t-shirts réels, puis gourdes réelles.
      const fresh = await db.select().from(schema.products);
      const tshirtOrder = new Map(realTshirts.map((p, i) => [p.imageKey, i]));
      const gourdeOrder = new Map(realGourdes.map((p, i) => [p.imageKey, i]));
      const rank = (r: ProductRow): number => {
        if (r.category === "sandales") return r.sortOrder;
        if (r.category === "tshirts")
          return 100 + (r.imageKey ? (tshirtOrder.get(r.imageKey) ?? 90) : 90);
        return 200 + (r.imageKey ? (gourdeOrder.get(r.imageKey) ?? 90) : 90);
      };
      const ordered = [...fresh].sort((a, b) => rank(a) - rank(b) || a.id - b.id);
      for (const [i, row] of ordered.entries()) {
        if (row.sortOrder !== i) {
          await db
            .update(schema.products)
            .set({ sortOrder: i })
            .where(eq(schema.products.id, row.id));
        }
      }
      ctx.invalidateQueries();
      return { updated, inserted, retired };
    },
  }),

  mergeGourdes: defineAction({
    description:
      "Fusionne les 5 fiches gourdes en un seul produit « Gourde Thermo » avec les 5 couleurs de couvercle au choix (crème, noir, bordeaux, brun, bleu marine), comme les t-shirts vierges.",
    request: z.object({}),
    response: z.object({ merged: z.boolean(), retired: z.number() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const target = realGourdes[0];
      if (!target) return { merged: false, retired: 0 };
      const rows = await db.select().from(schema.products);
      const gourdes = rows.filter((r) => r.category === "gourdes");
      if (gourdes.length <= 1) {
        const only = gourdes[0];
        if (only && only.name === target.name) return { merged: false, retired: 0 };
      }
      // La fiche qui porte la photo principale (crème) devient la fiche
      // unique ; à défaut, la première gourde du catalogue.
      const keeper =
        gourdes.find((r) => r.imageKey === target.imageKey) ??
        [...gourdes].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)[0];
      if (!keeper) return { merged: false, retired: 0 };
      await db
        .update(schema.products)
        .set({
          name: target.name,
          tagline: target.tagline,
          description: target.description,
          priceAr: target.priceAr,
          bulkPriceAr: target.bulkPriceAr ?? null,
          bulkMinQty: target.bulkMinQty ?? null,
          sizes: JSON.stringify(target.sizes),
          colors: JSON.stringify(target.colors),
          imageKey: target.imageKey,
          badge: target.badge ?? null,
          customizable: target.customizable ?? false,
          active: true,
        })
        .where(eq(schema.products.id, keeper.id));
      // Retire (sans supprimer) les autres fiches gourdes, pour préserver
      // l'historique d'éventuelles commandes.
      let retired = 0;
      for (const row of gourdes) {
        if (row.id !== keeper.id && row.active) {
          await db
            .update(schema.products)
            .set({ active: false })
            .where(eq(schema.products.id, row.id));
          retired++;
        }
      }
      ctx.invalidateQueries();
      return { merged: true, retired };
    },
  }),

  register: defineAction({
    description: "Crée un compte client Nora Essentials et ouvre une session.",
    request: z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(120),
      phone: z.string().trim().min(8).max(20),
      password: z.string().min(8).max(72),
    }),
    response: z.object({
      ok: z.boolean(),
      token: z.string().nullable(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      error: z.string().nullable(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const email = args.email.toLowerCase();
      const existing = await db
        .select({ id: schema.accounts.id })
        .from(schema.accounts)
        .where(eq(schema.accounts.email, email))
        .limit(1);
      if (existing.length > 0) {
        return {
          ok: false,
          token: null,
          name: null,
          email: null,
          error: "Un compte existe déjà avec cet email. Connectez-vous.",
        };
      }
      const salt = newToken().slice(0, 16);
      const passwordHash = await hashPassword(args.password, salt);
      const inserted = await db
        .insert(schema.accounts)
        .values({ name: args.name, email, phone: args.phone, passwordHash, salt })
        .returning({ id: schema.accounts.id });
      const account = inserted[0];
      if (!account) throw new Error("register: insertion sans retour");
      const token = newToken();
      await db.insert(schema.sessions).values({ token, accountId: account.id });
      return { ok: true, token, name: args.name, email, error: null };
    },
  }),

  login: defineAction({
    description: "Connecte un client Nora Essentials avec email et mot de passe.",
    request: z.object({
      email: z.string().trim().email().max(120),
      password: z.string().min(1).max(72),
    }),
    response: z.object({
      ok: z.boolean(),
      token: z.string().nullable(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      error: z.string().nullable(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const email = args.email.toLowerCase();
      const rows = await db
        .select()
        .from(schema.accounts)
        .where(eq(schema.accounts.email, email))
        .limit(1);
      const account = rows[0];
      if (!account) {
        return {
          ok: false,
          token: null,
          name: null,
          email: null,
          error: "Aucun compte avec cet email. Créez un compte pour continuer.",
        };
      }
      const hash = await hashPassword(args.password, account.salt);
      if (hash !== account.passwordHash) {
        return {
          ok: false,
          token: null,
          name: null,
          email: null,
          error: "Mot de passe incorrect. Réessayez ou réinitialisez-le.",
        };
      }
      const token = newToken();
      await db.insert(schema.sessions).values({ token, accountId: account.id });
      return { ok: true, token, name: account.name, email: account.email, error: null };
    },
  }),

  me: defineAction({
    description: "Retourne le client connecté pour un jeton de session donné.",
    request: z.object({ token: z.string().min(1).max(80) }),
    response: z.object({
      account: z
        .object({
          name: z.string(),
          email: z.string(),
          phone: z.string(),
          isAdmin: z.boolean(),
        })
        .nullable(),
    }),
    async handler(ctx, args) {
      const account = await accountForToken(ctx, args.token);
      if (!account) return { account: null };
      return {
        account: {
          name: account.name,
          email: account.email,
          phone: account.phone,
          isAdmin: isAdminEmail(account.email),
        },
      };
    },
  }),

  logout: defineAction({
    description: "Ferme la session associée au jeton donné.",
    request: z.object({ token: z.string().min(1).max(80) }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.sessions).where(eq(schema.sessions.token, args.token));
      return { ok: true };
    },
  }),

  resetPassword: defineAction({
    description:
      "Réinitialise le mot de passe d'un compte après vérification du numéro de téléphone d'inscription.",
    request: z.object({
      email: z.string().trim().email().max(120),
      phone: z.string().trim().min(8).max(20),
      newPassword: z.string().min(8).max(72),
    }),
    response: z.object({ ok: z.boolean(), error: z.string().nullable() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.accounts)
        .where(eq(schema.accounts.email, args.email.toLowerCase()))
        .limit(1);
      const account = rows[0];
      if (!account) {
        return { ok: false, error: "Aucun compte avec cet email." };
      }
      const digits = (s: string) => s.replace(/\D/g, "");
      if (digits(account.phone) !== digits(args.phone)) {
        return {
          ok: false,
          error: "Ce numéro ne correspond pas à celui du compte. Vérifiez et réessayez.",
        };
      }
      const salt = newToken().slice(0, 16);
      const passwordHash = await hashPassword(args.newPassword, salt);
      await db
        .update(schema.accounts)
        .set({ passwordHash, salt })
        .where(eq(schema.accounts.id, account.id));
      await db.delete(schema.sessions).where(eq(schema.sessions.accountId, account.id));
      return { ok: true, error: null };
    },
  }),

  createOrder: defineAction({
    description: "Enregistre une commande client avec ses articles et la livraison.",
    request: z.object({
      token: z.string().max(80).nullable(),
      customerName: z.string().trim().min(2).max(80),
      phone: z.string().trim().min(8).max(20),
      address: z.string().trim().min(4).max(200),
      zone: z.enum(["antananarivo", "provinces"]),
      note: z.string().trim().max(300).default(""),
      items: z.array(orderLine).min(1).max(50),
    }),
    response: z.object({
      ok: z.boolean(),
      reference: z.string().nullable(),
      totalAr: z.number().nullable(),
      error: z.string().nullable(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      // Recompute prices server-side from the catalog: never trust the client.
      const rows = await db.select().from(schema.products);
      const byId = new Map(rows.map((r) => [r.id, r]));
      let subtotal = 0;
      const lines: z.infer<typeof orderLine>[] = [];
      for (const item of args.items) {
        const product = byId.get(item.productId);
        if (!product || !product.active) {
          return {
            ok: false,
            reference: null,
            totalAr: null,
            error: "Un article du panier n'est plus disponible. Retirez-le et réessayez.",
          };
        }
        const unit =
          product.bulkPriceAr != null &&
          product.bulkMinQty != null &&
          item.qty >= product.bulkMinQty
            ? product.bulkPriceAr
            : product.priceAr;
        subtotal += unit * item.qty;
        lines.push({
          productId: product.id,
          name: product.name,
          unitPriceAr: unit,
          qty: item.qty,
          size: item.size,
          color: item.color,
          customText: item.customText,
          customSide: item.customSide,
        });
      }
      const delivery = DELIVERY_AR;
      const total = subtotal + delivery;
      let accountId: number | null = null;
      if (args.token) {
        const account = await accountForToken(ctx, args.token);
        accountId = account?.id ?? null;
      }
      const reference = `NE-${Date.now().toString(36).toUpperCase()}`;
      await db.insert(schema.orders).values({
        reference,
        accountId,
        customerName: args.customerName,
        phone: args.phone,
        address: args.address,
        zone: args.zone,
        note: args.note,
        items: JSON.stringify(lines),
        subtotalAr: subtotal,
        deliveryAr: delivery,
        totalAr: total,
      });
      ctx.invalidateQueries();
      return { ok: true, reference, totalAr: total, error: null };
    },
  }),

  myOrders: defineAction({
    description: "Liste les commandes du client connecté.",
    request: z.object({ token: z.string().min(1).max(80) }),
    response: z.object({ orders: z.array(orderOut) }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const account = await accountForToken(ctx, args.token);
      if (!account) return { orders: [] };
      const rows = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.accountId, account.id))
        .orderBy(desc(schema.orders.id));
      return { orders: rows.map(toOrder) };
    },
  }),

  adminListProducts: defineAction({
    description: "Liste tous les produits du catalogue, actifs ou non (gestion boutique, comptes admin uniquement).",
    request: z.object({ token: z.string().min(1).max(80) }),
    response: z.object({ products: z.array(productOut) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.token);
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.products)
        .orderBy(schema.products.sortOrder, schema.products.id);
      return { products: rows.map(toProduct) };
    },
  }),

  adminSaveProduct: defineAction({
    description: "Crée ou met à jour un produit du catalogue (gestion boutique, comptes admin uniquement).",
    request: z.object({
      token: z.string().min(1).max(80),
      id: z.number().int().positive().nullable(),
      name: z.string().trim().min(2).max(80),
      category: z.enum(["sandales", "tshirts", "gourdes"]),
      tagline: z.string().trim().max(120).default(""),
      description: z.string().trim().max(600).default(""),
      priceAr: z.number().int().min(0).max(100_000_000),
      sizes: z.array(z.string().max(10)).max(12).default([]),
      colors: z.array(z.string().max(30)).max(12).default([]),
      badge: z.string().trim().max(30).nullable().default(null),
      customizable: z.boolean().default(false),
      active: z.boolean().default(true),
    }),
    response: z.object({ id: z.number() }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.token);
      const db = ctx.db<typeof schema>();
      const values = {
        name: args.name,
        category: args.category,
        tagline: args.tagline,
        description: args.description,
        priceAr: args.priceAr,
        sizes: JSON.stringify(args.sizes),
        colors: JSON.stringify(args.colors),
        badge: args.badge && args.badge.length > 0 ? args.badge : null,
        customizable: args.customizable,
        active: args.active,
      };
      if (args.id != null) {
        await db.update(schema.products).set(values).where(eq(schema.products.id, args.id));
        ctx.invalidateQueries();
        return { id: args.id };
      }
      const inserted = await db
        .insert(schema.products)
        .values(values)
        .returning({ id: schema.products.id });
      const row = inserted[0];
      if (!row) throw new Error("adminSaveProduct: insertion sans retour");
      ctx.invalidateQueries();
      return { id: row.id };
    },
  }),

  adminListOrders: defineAction({
    description: "Liste toutes les commandes reçues par la boutique (gestion boutique, comptes admin uniquement).",
    request: z.object({ token: z.string().min(1).max(80) }),
    response: z.object({ orders: z.array(orderOut) }),
    async handler(ctx, args) {
      await requireAdmin(ctx, args.token);
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.id));
      return { orders: rows.map(toOrder) };
    },
  }),

  adminSetOrderStatus: defineAction({
    description: "Met à jour le statut d'une commande (gestion boutique, comptes admin uniquement).",
    request: z.object({
      token: z.string().min(1).max(80),
      id: z.number().int().positive(),
      status: z.enum(["nouvelle", "confirmee", "livree", "annulee"]),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      await requireAdmin(ctx, args.token);
      const db = ctx.db<typeof schema>();
      await db
        .update(schema.orders)
        .set({ status: args.status })
        .where(eq(schema.orders.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

} satisfies ActionsModule;
