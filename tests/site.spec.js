// ABOUTME: End-to-end tests verifying the feedspec.org site renders correctly.
// ABOUTME: Checks homepage content, OPE landing page, and spec page structure.

import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("renders hero headline", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("h1", { hasText: "Open specifications for the feed ecosystem" })
    ).toBeVisible();
  });

  test("shows OPE spec card with link", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("a", {
      hasText: "Open Portable Entitlement",
    });
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("href", /\/ope\//);
  });

  test("shows principles section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("text=Extend, don't replace")
    ).toBeVisible();
    await expect(
      page.locator("text=Graceful degradation")
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Built on standards" })
    ).toBeVisible();
  });

  test("nav has feedspec.org link and GitHub button", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav a", { hasText: "feedspec.org" })).toBeVisible();
    await expect(page.locator("nav a", { hasText: "GitHub" })).toBeVisible();
  });
});

test.describe("OPE Landing Page", () => {
  test("renders hero with title", async ({ page }) => {
    await page.goto("/ope/");
    await expect(
      page.locator("h1", { hasText: "Your access, in every app" })
    ).toBeVisible();
    await expect(page.locator("text=Draft v0.2 · Proposed, open for comment")).toBeVisible();
  });

  test("has link to spec", async ({ page }) => {
    await page.goto("/ope/");
    const specLink = page.getByRole("link", { name: "Read the v0.2 Draft" }).first();
    await expect(specLink).toBeVisible();
    await expect(specLink).toHaveAttribute("href", /\/ope\/spec\/0\.2\/$/);
  });

  test("shows all five principles", async ({ page }) => {
    await page.goto("/ope/");
    await expect(page.locator("text=Entitlement, not payments")).toBeVisible();
    await expect(page.locator("text=Truly portable")).toBeVisible();
    await expect(page.locator("text=Works with any feed")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Built on OAuth" })).toBeVisible();
    await expect(page.locator("text=Publisher-controlled")).toBeVisible();
  });

  test("tells four stories, each a working carousel", async ({ page }) => {
    await page.goto("/ope/");
    const tabs = page.locator("#story-tabs").getByRole("tab");
    await expect(tabs).toHaveCount(4);
    for (const id of ["alice", "priya", "bob", "school"]) {
      await page.locator(`#tab-${id}`).click();
      const deck = page.locator(`#story-${id}`);
      await expect(deck).toBeVisible();
      const cards = deck.locator(".deck-card");
      const dots = deck.locator(".deck-dot");
      expect(await dots.count()).toBe(await cards.count());
    }
  });

  test("uses v0.2 vocabulary, not v0.1", async ({ page }) => {
    await page.goto("/ope/");
    const body = page.locator("body");
    await expect(body).toContainText("oauth-protected-resource");
    for (const stale of ["/.well-known/ope", "grant token", "PASETO", "Macaroon", "Brokers"]) {
      await expect(body).not.toContainText(stale);
    }
  });
});

test.describe("Entitlement Builder", () => {
  const output = (page) => page.getByRole("region", { name: "Entitlement claim JSON" }).locator("pre");

  test("offers the 14 named aliases and v0.2 types", async ({ page }) => {
    await page.goto("/ope/");
    const builder = page.locator("#entitlement-builder");
    await builder.getByRole("tab", { name: "All 14 Presets" }).click();
    await expect(builder.getByRole("button", { name: /^Load .* preset$/ })).toHaveCount(14);
    await builder.getByRole("tab", { name: "Builder" }).click();
    for (const t of ["access", "limit", "status"]) {
      await expect(builder.getByRole("button", { name: t, exact: true })).toBeVisible();
    }
    await expect(builder).not.toContainText("signal");
  });

  test("emits an entitlement claim with coverage", async ({ page }) => {
    await page.goto("/ope/");
    const json = JSON.parse(await output(page).innerText());
    expect(json).toEqual({
      entitlement: { type: "access", coverage: "collection", duration: "recurring", source: "direct" },
    });
  });

  test("rentals carry a rental_expires_at timestamp", async ({ page }) => {
    await page.goto("/ope/");
    await page.locator("#entitlement-builder").getByRole("button", { name: "Rental", exact: true }).click();
    const { entitlement } = JSON.parse(await output(page).innerText());
    expect(entitlement.duration).toBe("rental");
    const now = Math.floor(Date.now() / 1000);
    expect(entitlement.rental_expires_at).toBeGreaterThan(now + 71 * 3600);
    expect(entitlement.rental_expires_at).toBeLessThan(now + 73 * 3600);
  });

  test("metered limits use an ISO 8601 period", async ({ page }) => {
    await page.goto("/ope/");
    await page.locator("#entitlement-builder").getByRole("button", { name: "Metered", exact: true }).click();
    const { entitlement } = JSON.parse(await output(page).innerText());
    expect(entitlement).toMatchObject({ type: "limit", kind: "metered", quota: 5, period: "P1M" });
  });
});

test.describe("Namespaces", () => {
  test("ns/0.2 documents the v0.2 elements", async ({ page }) => {
    await page.goto("/ope/ns/0.2/");
    await expect(page.locator("h1")).toHaveText("OPE Namespace 0.2");
    const body = page.locator("body");
    await expect(body).toContainText('xmlns:ope="https://feedspec.org/ope/ns/0.2"');
    for (const el of ["ope:offer", "ope:asset", "ope:payment", "ope:terms"]) {
      await expect(body).toContainText(el);
    }
  });

  test("ns/1.0 is marked withdrawn and points to 0.2", async ({ page }) => {
    await page.goto("/ope/ns/1.0/");
    const notice = page.getByRole("note");
    await expect(notice).toContainText("Replaced in the v0.2 proposal");
    await expect(notice.getByRole("link")).toHaveAttribute("href", /\/ope\/ns\/0\.2\//);
  });
});

test.describe("Spec Page", () => {
  test("renders spec content from markdown", async ({ page }) => {
    await page.goto("/ope/spec/");
    await expect(
      page.locator("h1", { hasText: "Open Portable Entitlement" })
    ).toBeVisible();
  });

  test("has sidebar navigation", async ({ page }) => {
    await page.goto("/ope/spec/");
    // Sidebar should have nav links on desktop
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeAttached();
    // Should have section links
    const navLinks = sidebar.locator(".nav-link");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(10);
  });

  test("headings have anchor IDs", async ({ page }) => {
    await page.goto("/ope/spec/");
    const h2WithId = page.locator("article h2[id]");
    const count = await h2WithId.count();
    expect(count).toBeGreaterThan(5);
  });

  test("code blocks are present", async ({ page }) => {
    await page.goto("/ope/spec/");
    const codeBlocks = page.locator("article pre");
    const count = await codeBlocks.count();
    expect(count).toBeGreaterThan(3);
  });
});

test.describe("Spec Versions", () => {
  test("/ope/spec/ is the published v0.1 and points to the v0.2 proposal", async ({ page }) => {
    await page.goto("/ope/spec/");
    await expect(page.locator("article")).toContainText("Draft Specification v0.1");
    const notice = page.getByRole("note");
    await expect(notice).toContainText("A revision is proposed");
    await notice.getByRole("link", { name: "Read the v0.2 draft" }).click();
    await expect(page).toHaveURL(/\/ope\/spec\/0\.2\/$/);
  });

  test("/ope/spec/0.2/ is the proposed draft and points back to v0.1", async ({ page }) => {
    await page.goto("/ope/spec/0.2/");
    await expect(page.locator("article")).toContainText("Draft Specification v0.2");
    const notice = page.getByRole("note");
    await expect(notice).toContainText("Proposed draft, open for comment");
    await expect(notice.getByRole("link", { name: "Comment on GitHub" })).toHaveAttribute("href", /github\.com\/shellen\/open-portable-entitlement/);
    await notice.getByRole("link", { name: "v0.1" }).click();
    await expect(page).toHaveURL(/\/ope\/spec\/$/);
  });

  test("v0.2 Part headings appear as sidebar group labels", async ({ page }) => {
    await page.goto("/ope/spec/0.2/");
    const parts = page.locator("#sidebar .nav-part");
    await expect(parts).toHaveCount(3);
    await expect(parts.first()).toHaveText("Part I: Core");
  });

  test("key/value tables have no empty header row", async ({ page }) => {
    await page.goto("/ope/spec/0.2/");
    await expect(page.locator("article thead th:empty")).toHaveCount(0);
  });

  test("v0.1 keeps its permanent URL, sidebar, and anchors", async ({ page }) => {
    await page.goto("/ope/spec/0.1/");
    await expect(page.locator("article")).toContainText("Draft Specification v0.1");
    await expect(page.locator("#sidebar .nav-link").first()).toBeAttached();
    await expect(page.locator('article h2[id="8-grant-tokens"]')).toBeAttached();
  });

  test("toolbars link to the other version", async ({ page }) => {
    await page.goto("/ope/spec/");
    await expect(page.getByRole("link", { name: "v0.2 (proposed draft)" })).toHaveAttribute("href", /\/ope\/spec\/0\.2\/$/);
    await page.goto("/ope/spec/0.2/");
    await expect(page.getByRole("link", { name: "v0.1 (published)" })).toHaveAttribute("href", /\/ope\/spec\/0\.1\/$/);
  });

  test("markdown is served for every version", async ({ request }) => {
    const published = await request.get("/ope/spec.md");
    expect(await published.text()).toContain("Draft Specification v0.1");
    const v01 = await request.get("/ope/spec/0.1.md");
    expect(await v01.text()).toContain("Draft Specification v0.1");
    const v02 = await request.get("/ope/spec/0.2.md");
    expect(await v02.text()).toContain("Draft Specification v0.2");
  });
});
