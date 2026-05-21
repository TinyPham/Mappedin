const fs = require('fs');
let data = fs.readFileSync('index.ts', 'utf8');
data = data.replace(/"easeInOut"/g, '"ease-in-out"');
fs.writeFileSync('index.ts', data);
console.log('Fixed easeInOut');
