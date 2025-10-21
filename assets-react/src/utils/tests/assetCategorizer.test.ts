import { applyCategoryRules } from "../assetCategorizer";

describe("applyCategoryRules", () => {
  test("applies string pattern rule against a string field", () => {
    const raw = [
      { assetId: "a1", title: "Hero Banner", tags: "homepage banner large", campaign: "C1", usage: "web" },
    ];
    const rules = [{ field: "tags", pattern: "banner", category: "Creative" }];

    const out = applyCategoryRules(raw, rules);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("a1");
    expect(out[0].name).toBe("Hero Banner");
    expect(out[0].category).toBe("Creative");
    expect(out[0].campaign).toBe("C1");
    expect(out[0].usage).toBe("web");
    expect(out[0].raw).toEqual(raw[0]);
  });

  test("applies regex pattern on nested field", () => {
    const raw = [
      { id: "2", metadata: { customer: "ACME Incorporated" }, title: "Logo" },
    ];
    const rules = [{ field: "metadata.customer", pattern: /acme/i, category: "Acme" }];

    const out = applyCategoryRules(raw, rules);
    expect(out[0].id).toBe("2");
    expect(out[0].category).toBe("Acme");
  });

  test("matches when field is an array", () => {
    const raw = [
      { _id: "3", name: "Campaign Hero", tags: ["hero", "mobile"], campaign: "C2" },
    ];
    const rules = [{ field: "tags", pattern: /hero/i, category: "Hero" }];

    const out = applyCategoryRules(raw, rules);
    expect(out[0].id).toBe("3");
    expect(out[0].category).toBe("Hero");
  });

  test("uses defaults when no rule matches", () => {
    const raw = [{ title: "Unmatched Asset" }];
    const rules: any[] = [];
    const defaults = { category: "DefaultCat", campaign: "None", usage: "None" };

    const out = applyCategoryRules(raw, rules, defaults);
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe("DefaultCat");
    expect(out[0].campaign).toBe("None");
    expect(out[0].usage).toBe("None");
    expect(out[0].name).toBe("0");
  });

  test("id selection priority: id, _id, assetId, then index", () => {
    const raws = [
      { id: "id-val" },
      { _id: 42 },
      { assetId: "asset-7" },
      { /* none */ },
    ];
    const out = applyCategoryRules(raws, []);
    expect(out[0].id).toBe("id-val");
    expect(out[1].id).toBe("42");
    expect(out[2].id).toBe("asset-7");
    expect(out[3].id).toBe("3");
  });
});