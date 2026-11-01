import { defineFunction } from "@aws-amplify/backend"

export const assignPseudonym = defineFunction({
  name: "assign-pseudonym",
  timeoutSeconds: 30
});
