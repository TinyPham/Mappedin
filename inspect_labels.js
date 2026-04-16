const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log("Launching browser...");
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        console.log("Navigating to localhost:3002...");
        await page.goto('http://localhost:3002/', { waitUntil: 'networkidle2', timeout: 30000 });
        
        console.log("Waiting for map to load...");
        await page.waitForTimeout(10000); // 10 seconds for Mappedin to render
        
        console.log("Extracting HTML...");
        const html = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (canvas && canvas.nextElementSibling) {
                return canvas.nextElementSibling.outerHTML;
            }
            return "No canvas or next sibling found.";
        });
        
        console.log("--- START HTML ---");
        console.log(html);
        console.log("--- END HTML ---");
        
        // Also look for specific classes
        const classes = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('*'))
                 .map(el => el.className)
                 .filter(c => typeof c === 'string' && c.includes('label'))
                 .filter((x, i, a) => a.indexOf(x) == i);
        });
        console.log("Label related classes found:", classes);
        
        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
