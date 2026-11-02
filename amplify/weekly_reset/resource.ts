import { defineFunction } from "@aws-amplify/backend"

export const weeklyReset = defineFunction({
  name: "weekly-reset",
  timeoutSeconds: 60,
  // schedule: "0 21 ? * 1 *", // Every sunday at 21:00 (9pm)
  // schedule: "every 1m"
  schedule: "31 11 ? * 2 *"
});
