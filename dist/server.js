import { setupSampleLakebaseRoutes } from "./routes/lakebase/todo-routes.js";
import { createApp, lakebase, server } from "@databricks/appkit";

//#region server/server.ts
createApp({
	plugins: [lakebase(), server()],
	async onPluginsReady(appkit) {
		await setupSampleLakebaseRoutes(appkit);
	}
}).catch(console.error);

//#endregion
export {  };