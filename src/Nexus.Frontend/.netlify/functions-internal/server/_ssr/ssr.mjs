//#region node_modules/.nitro/vite/services/ssr/index.js
/**
* Captures uncaught errors during SSR so they can be reported
* in the response instead of being swallowed by the framework.
*/
var lastCapturedError = null;
if (typeof process !== "undefined") process.on("uncaughtException", (err) => {
	lastCapturedError = err instanceof Error ? err : new Error(String(err));
});
function consumeLastCapturedError() {
	const err = lastCapturedError;
	lastCapturedError = null;
	return err;
}
/**
* Renders a minimal, self-contained error page for catastrophic SSR failures.
* This page is displayed when the React SSR pipeline cannot render the app.
*/
function renderErrorPage() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus — Server Error</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0f;
      color: #e4e4ef;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 480px;
    }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; color: #ff6b6b; }
    p { font-size: 0.95rem; line-height: 1.6; color: #9898b0; margin-bottom: 1.5rem; }
    a {
      display: inline-block;
      padding: 0.6rem 1.5rem;
      background: #2563eb;
      color: #fff;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.2s;
    }
    a:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Something went wrong</h1>
    <p>The server encountered an unexpected error. This is usually temporary. Please try refreshing the page.</p>
    <a href="/">Refresh</a>
  </div>
</body>
</html>`;
}
var serverEntryPromise;
async function getServerEntry() {
	if (!serverEntryPromise) serverEntryPromise = import("./server-bVufwKRE.mjs").then((m) => m.default ?? m);
	return serverEntryPromise;
}
async function normalizeCatastrophicSsrResponse(response) {
	if (response.status < 500) return response;
	if (!(response.headers.get("content-type") ?? "").includes("application/json")) return response;
	const body = await response.clone().text();
	if (!body.includes("\"unhandled\":true") || !body.includes("\"message\":\"HTTPError\"")) return response;
	console.error(consumeLastCapturedError() ?? /* @__PURE__ */ new Error(`h3 swallowed SSR error: ${body}`));
	return new Response(renderErrorPage(), {
		status: 500,
		headers: { "content-type": "text/html; charset=utf-8" }
	});
}
var server_default = { async fetch(request, env, ctx) {
	try {
		return await normalizeCatastrophicSsrResponse(await (await getServerEntry()).fetch(request, env, ctx));
	} catch (error) {
		console.error(error);
		return new Response(renderErrorPage(), {
			status: 500,
			headers: { "content-type": "text/html; charset=utf-8" }
		});
	}
} };
//#endregion
export { server_default as default, renderErrorPage as t };
