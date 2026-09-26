import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("V1.7 exposes the quiet three-tab product shell", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "晚上好" })).toBeVisible();
  await expect(page.getByRole("button", { name: "今晚", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "声音", exact: true }).click();
  await expect(page.getByRole("heading", { name: "给今晚一点留白" })).toBeVisible();
  await page.getByRole("button", { name: "我的", exact: true }).click();
  await expect(page.getByText("你的睡眠记录仅保存在本机。")).toBeVisible();
});

test("timer offers fade-out choices", async ({ page }) => {
  await page.getByRole("button", { name: "定时 30 分钟", exact: true }).click();
  await expect(page.getByText("渐弱关闭")).toBeVisible();
  await expect(page.getByRole("button", { name: "5 分钟", exact: true })).toBeVisible();
});

test("sound search and favorite persist locally", async ({ page }) => {
  await page.getByRole("button", { name: "声音", exact: true }).click();
  await page.getByRole("textbox", { name: "搜索声音" }).fill("棕噪");
  await expect(page.getByRole("button", { name: /棕噪音 低频厚实/ })).toBeVisible();
  await page.getByRole("button", { name: "收藏棕噪音" }).click();
  await page.getByRole("button", { name: "我的", exact: true }).click();
  await expect(page.getByText("棕噪音", { exact: true })).toBeVisible();
});

test("breathing and three-track mixer routes work", async ({ page }) => {
  await page.getByRole("button", { name: "睡前呼吸", exact: true }).click();
  await expect(page.getByRole("heading", { name: "放松呼吸" })).toBeVisible();
  await page.getByRole("button", { name: "4 · 7 · 8", exact: true }).click();
  await expect(page.getByText("屏息")).toBeVisible();
  await page.getByRole("button", { name: "‹", exact: true }).click();
  await page.getByRole("button", { name: "声音", exact: true }).click();
  await page.getByRole("button", { name: /混音/ }).first().click();
  await expect(page.getByText("最多同时播放三种声音")).toBeVisible();
  await expect(page.locator(".v17-track-count")).toHaveText("3/3");
});
