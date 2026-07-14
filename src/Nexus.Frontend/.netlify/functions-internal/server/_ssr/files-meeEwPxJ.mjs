import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/files-meeEwPxJ.js
var $$splitComponentImporter = () => import("./files-BV81dN0V.mjs");
var Route = createFileRoute("/files")({
	validateSearch: (search) => {
		return { path: search.path };
	},
	head: () => ({ meta: [{ title: "Files — NEXUS" }, {
		name: "description",
		content: "Browse files and network shares."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
