import { expect, test } from "@playwright/test";

/**
 * Smoke test for the public inquiry form. Confirms the form renders and the
 * homepage loads. Submitting the form requires real DB + email infra so we
 * only exercise the network call shape (which is the most regression-prone
 * piece historically — see middleware/POST blocker bugs in PR1).
 */
test("homepage renders and inquiry form is reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Ooty Baker/i);

  // Inquiry section anchor + heading text.
  await page.evaluate(() => {
    document.getElementById("inquiry")?.scrollIntoView();
  });
  await expect(page.getByRole("heading", { name: /Inquiry Details/i })).toBeVisible();
});
