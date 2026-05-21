const fs = require('fs');
let data = fs.readFileSync('index.ts', 'utf8');

// 1. Merge mobile-wayfinding-combined
data = data.replace(
  "if ((step?.id === 'desktop-search' || step?.id === 'desktop-wayfinding') && rects.length > 1)",
  "if ((step?.id === 'desktop-search' || step?.id === 'desktop-wayfinding' || step?.id === 'mobile-wayfinding-combined') && rects.length > 1)"
);

// 2. Tab navigation hook
const oldNavBlock = `  userGuideBack?.addEventListener('click', () => {
    if (currentGuideStepIndex > 0) {
      currentGuideStepIndex -= 1;
      renderUserGuideStep();
    }
  });
  userGuideNext?.addEventListener('click', () => {
    if (currentGuideStepIndex < activeGuideSteps.length - 1) {
      currentGuideStepIndex += 1;
      renderUserGuideStep();
    }
  });`;

const newNavBlock = `  userGuideBack?.addEventListener('click', () => {
    if (currentGuideStepIndex > 0) {
      const prevStep = getActiveGuideStep();
      currentGuideStepIndex -= 1;
      const step = getActiveGuideStep();
      
      let needsDelay = false;
      if (prevStep?.id === 'mobile-wayfinding-combined' && step?.id === 'mobile-floor-language') {
        document.getElementById('tab-search')?.click();
        needsDelay = true;
      }
      
      if (needsDelay) setTimeout(renderUserGuideStep, 150);
      else renderUserGuideStep();
    }
  });
  userGuideNext?.addEventListener('click', () => {
    if (currentGuideStepIndex < activeGuideSteps.length - 1) {
      currentGuideStepIndex += 1;
      const step = getActiveGuideStep();
      
      let needsDelay = false;
      if (step?.id === 'mobile-wayfinding-combined') {
        document.getElementById('tab-directions')?.click();
        needsDelay = true;
      }
      
      if (needsDelay) setTimeout(renderUserGuideStep, 150);
      else renderUserGuideStep();
    }
  });`;

data = data.replace(oldNavBlock, newNavBlock);

// 3. dirElevator coordinates length
data = data.replace(
  "const dir = (distElev <= distEsc && dirElevator?.coordinates?.length > 0) ? dirElevator : dirEscalator;",
  "const dir = (distElev <= distEsc && (dirElevator?.coordinates?.length ?? 0) > 0) ? dirElevator : dirEscalator;"
);

// 4. Unreachable code removal (wayfinding-status)
// Since there might be some Vietnamese characters, we'll replace using regex to match the unreachable lines.
data = data.replace(
  /renderRouteNotFoundState\(\);\s*return;\s*const statusEl = document\.getElementById\("wayfinding-status"\);\s*if \(statusEl\) \{\s*statusEl\.textContent = TranslationManager\.t\('not_found', "[^"]+"\);\s*\}/g,
  "renderRouteNotFoundState();\n        return;"
);
data = data.replace(
  /renderRouteNotFoundState\('error_nav', "[^"]+"\);\s*return;\s*const statusEl = document\.getElementById\("wayfinding-status"\);\s*if \(statusEl\) \{\s*statusEl\.textContent = TranslationManager\.t\('error_nav', "[^"]+"\);\s*\}/g,
  "renderRouteNotFoundState('error_nav', \"Lỗi khi tìm đường đi\");\n      return;"
);

// 5. Math.round(result.distanceMeters) -> Math.round(result.distanceMeters || 0)
data = data.replace(
  /Math\.round\(result\.distanceMeters\)/g,
  "Math.round(result.distanceMeters || 0)"
);

fs.writeFileSync('index.ts', data);
console.log('Fixed index.ts completely without encoding issues');
