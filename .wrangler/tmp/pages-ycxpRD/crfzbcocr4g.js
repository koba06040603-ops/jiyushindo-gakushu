// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/404.html",
    "/adaptive-learning-demo.html",
    "/admin-preview.html",
    "/advanced-features-demo.html",
    "/ai-tutor.html",
    "/api-docs.html",
    "/auth-demo.html",
    "/cache-dashboard.html",
    "/collaborative-reports-demo.html",
    "/dashboard.html",
    "/download-correct-pdf.html",
    "/download-pptx.html",
    "/download-slides.html",
    "/gamification-demo.html",
    "/integrated-dashboard.html",
    "/integrated-features-demo.html",
    "/manifest.json",
    "/multilingual-pwa-demo.html",
    "/ocr-test.html",
    "/offline.html",
    "/parent-dashboard-demo.html",
    "/parent-dashboard.html",
    "/performance-dashboard.html",
    "/personalized-learning-demo.html",
    "/problem-generator.html",
    "/progress-board-demo.html",
    "/proposal.html",
    "/school-management-demo.html",
    "/security-dashboard.html",
    "/service-worker.js",
    "/spaced-learning-progress-demo.html",
    "/static/*",
    "/teacher-dashboard-demo.html",
    "/test-buttons.html",
    "/truancy-support-demo.html",
    "/*.pptx",
    "/*.pdf"
  ]
};

// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/home/user/webapp/.wrangler/tmp/pages-ycxpRD/bundledWorker-0.16580852565077508.mjs";
import { isRoutingRuleMatch } from "/home/user/webapp/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/home/user/webapp/.wrangler/tmp/pages-ycxpRD/bundledWorker-0.16580852565077508.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=crfzbcocr4g.js.map
