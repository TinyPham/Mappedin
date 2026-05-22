const fs = require('fs');
const filePath = 'd:\\E-Map-Website\\ERP-Mappedin\\index.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Change isSidebarCollapsed default to true
content = content.replace(
  'let isSidebarCollapsed = false;',
  'let isSidebarCollapsed = window.innerWidth > 768; // Start collapsed on desktop'
);

// 2. Replace the auto-collapse setTimeout with showing floating search bar after load
const oldAutoCollapse = `  // Auto-collapse sidebar on initial load (desktop only)
  if (window.innerWidth > 768) {
    setTimeout(() => {
      collapseSidebar(true);
    }, 1500);
  }`;

const newAutoCollapse = `  // Sidebar starts collapsed on desktop (class set in HTML).
  // Show floating search bar immediately since sidebar is already hidden.
  if (window.innerWidth > 768 && floatingSearchBar) {
    // Use requestAnimationFrame to ensure DOM is painted before showing
    requestAnimationFrame(() => {
      floatingSearchBar.classList.add("visible");
    });
  }`;

content = content.replace(oldAutoCollapse, newAutoCollapse);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Sidebar default state updated!');
