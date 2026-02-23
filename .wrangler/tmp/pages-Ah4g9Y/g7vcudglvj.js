// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/adaptive-learning-demo.html",
    "/admin-preview.html",
    "/advanced-features-demo.html",
    "/ai-assistant.html",
    "/ai-chatbot-voice.html",
    "/ai-chatbot.html",
    "/ai-tutor.html",
    "/api-docs.html",
    "/auth-demo.html",
    "/login.html",
    "/cache-dashboard.html",
    "/class-progress-comparison.html",
    "/cognitive-learning.html",
    "/collaborative-reports-demo.html",
    "/curriculum-input.html",
    "/curriculum-problem-generator.html",
    "/dashboard.html",
    "/data-export.html",
    "/download-correct-pdf.html",
    "/download-pptx.html",
    "/download-slides.html",
    "/feature-proposals.html",
    "/feedback-dashboard.html",
    "/gamification-demo.html",
    "/integrated-dashboard.html",
    "/integrated-features-demo.html",
    "/learning-analytics-dashboard.html",
    "/learning-analytics.html",
    "/learning-path.html",
    "/multilingual-pwa-demo.html",
    "/ocr-test.html",
    "/offline.html",
    "/parent-dashboard-demo.html",
    "/parent-dashboard.html",
    "/performance-dashboard.html",
    "/personalized-learning-demo.html",
    "/phase16-theory-dashboard.html",
    "/phase18-realtime-learning.html",
    "/problem-generator.html",
    "/progress-board-demo.html",
    "/proposal.html",
    "/school-management-demo.html",
    "/security-dashboard.html",
    "/spaced-learning-progress-demo.html",
    "/start-learning.html",
    "/student-comments.html",
    "/teacher-comments.html",
    "/teacher-dashboard-demo.html",
    "/teacher-dashboard.html",
    "/teacher-bars-rating.html",
    "/test-buttons.html",
    "/test-case6.html",
    "/theory-assessment.html",
    "/truancy-support-demo.html",
    "/manifest.json",
    "/service-worker.js",
    "/static/*",
    "/*.pptx",
    "/*.pdf"
  ]
};

// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/home/user/webapp/.wrangler/tmp/pages-Ah4g9Y/bundledWorker-0.49960117403190774.mjs";
import { isRoutingRuleMatch } from "/home/user/webapp/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/home/user/webapp/.wrangler/tmp/pages-Ah4g9Y/bundledWorker-0.49960117403190774.mjs";
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
//# sourceMappingURL=g7vcudglvj.js.map
