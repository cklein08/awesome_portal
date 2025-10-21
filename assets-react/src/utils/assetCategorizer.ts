export type RawAsset = Record<string, any>;

export type Asset = {
  id: string;
  name: string;
  category: string;
  campaign: string;
  usage: string;
  raw?: RawAsset;
};

export type CategoryRule = {
  field: string; // supports nested like "metadata.tags"
  pattern: string | RegExp;
  category: string;
};

const getField = (obj: Record<string, any>, path: string): any =>
  path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

export function applyCategoryRules(
  rawAssets: RawAsset[],
  rules: CategoryRule[],
  defaults: Partial<Asset> = {}
): Asset[] {
  return rawAssets.map((r, idx) => {
    const id = String(getField(r, "id") ?? getField(r, "_id") ?? getField(r, "assetId") ?? idx);
    const name = String(getField(r, "name") ?? getField(r, "title") ?? id);
    let category = defaults.category ?? "Uncategorized";

    for (const rule of rules) {
      const value = getField(r, rule.field);
      if (value == null) continue;
      const str = Array.isArray(value) ? value.join(" ") : String(value);
      if (typeof rule.pattern === "string") {
        if (str.includes(rule.pattern)) {
          category = rule.category;
          break;
        }
      } else {
        if (rule.pattern.test(str)) {
          category = rule.category;
          break;
        }
      }
    }

    const campaign = String(getField(r, "campaign") ?? getField(r, "metadata.campaign") ?? defaults.campaign ?? "Unknown");
    const usage = String(getField(r, "usage") ?? getField(r, "metadata.usage") ?? defaults.usage ?? "Unknown");

    return { id, name, category, campaign, usage, raw: r };
  });
}

export const defaultRules: CategoryRule[] = [
  { field: "tags", pattern: /banner|hero/i, category: "Creative" },
  { field: "path", pattern: "/campaigns/", category: "Campaign Assets" },
  { field: "metadata.customer", pattern: /acme/i, category: "Acme" },
];