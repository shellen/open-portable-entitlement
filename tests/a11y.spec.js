// ABOUTME: Accessibility tests using axe-core to validate WCAG 2.1 AA compliance.
// ABOUTME: Checks all main pages for accessibility violations.

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("homepage has no a11y violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("OPE landing page has no a11y violations", async ({ page }) => {
    await page.goto("/ope/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("spec page has no a11y violations", async ({ page }) => {
    await page.goto("/ope/spec/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("skip link is present and functional", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute("href", "#main-content");
    // Should become visible on focus
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test("all pages have a main landmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main#main-content")).toBeAttached();
    await page.goto("/ope/");
    await expect(page.locator("main#main-content")).toBeAttached();
  });

  test("navigation has aria-label", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator('nav[aria-label="Primary"]');
    await expect(nav).toBeAttached();
  });

  test("OPE story tabs have proper ARIA roles", async ({ page }) => {
    await page.goto("/ope/");
    const tablist = page.locator('[role="tablist"]').first();
    await expect(tablist).toBeAttached();
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    // First tab should be selected
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  });

  test("deck carousel has screen reader announcements", async ({ page }) => {
    await page.goto("/ope/");
    const liveRegion = page.locator('.deck-live[aria-live="polite"]').first();
    await expect(liveRegion).toBeAttached();
  });

  test("html element has lang and dir attributes", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");
    await expect(html).toHaveAttribute("dir", "ltr");
  });
});
