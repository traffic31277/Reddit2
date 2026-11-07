import { defineFunction } from "@aws-amplify/backend"

export const weeklyReset = defineFunction({
  name: "weekly-reset",
  timeoutSeconds: 60,
  schedule: "0 6 ? * 2 *", // Every Monday at 6:00 am in UTC (AKA Monday at 12:00am CST)
  // schedule: "every 1m"
  // schedule: "39 17 ? * 2 *"
});
