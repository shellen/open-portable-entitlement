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
      page.locator("h1", { hasText: "Portable subscriptions for the open web" })
    ).toBeVisible();
  });

  test("has link to spec", async ({ page }) => {
    await page.goto("/ope/");
    const specLink = page.getByRole("link", { name: "Read the Spec", exact: true });
    await expect(specLink).toBeVisible();
    await expect(specLink).toHaveAttribute("href", /\/ope\/spec\//);
  });

  test("shows all four principles", async ({ page }) => {
    await page.goto("/ope/");
    await expect(page.locator("text=Entitlement, not payments")).toBeVisible();
    await expect(page.locator("text=Truly portable")).toBeVisible();
    await expect(page.locator("text=Works with any feed")).toBeVisible();
    await expect(page.locator("text=Publisher-controlled")).toBeVisible();
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
