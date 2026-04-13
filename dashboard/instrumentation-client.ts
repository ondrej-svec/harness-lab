import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    { path: "/admin/sign-in", method: "POST" },
  ],
});
