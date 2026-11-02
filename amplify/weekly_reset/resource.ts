import { defineFunction } from "@aws-amplify/backend"

export const weeklyReset = defineFunction({
  name: "weekly-reset",
  timeoutSeconds: 60,
  // schedule: "2 1 ? * 1 *", // Every sunday at 21:00 (9pm)
  schedule: "every 1m"
});
