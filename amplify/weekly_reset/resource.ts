import { defineFunction } from "@aws-amplify/backend"

export const weeklyReset = defineFunction({
  name: "weekly-reset",
  timeoutSeconds: 60,
  schedule: "0 3 ? * 2 *", // Every Monday at 3:00 am in UTC (AKA Sunday at 9pm CST)
  // schedule: "every 1m"
  // schedule: "39 17 ? * 2 *"
});
