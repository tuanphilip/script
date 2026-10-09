// Script export toàn bộ trang web thành single HTML file (CSS inline, giữ font, loại bỏ dynamic scripts)
// Chạy trực tiếp trên Developer Tools Console (F12 -> Console)

(async function exportFullPage() {
  console.log("Đang xử lý...");

  // 1. Thu thập CSS — handle CORS + @import
  let combinedCSS = "";
  for (const sheet of document.styleSheets) {
    try {
      if (sheet.cssRules) {
        for (const rule of sheet.cssRules) {
          // resolve @import inline
          if (rule.type === CSSRule.IMPORT_RULE) {
            try {
              const res = await fetch(rule.href);
              combinedCSS += await res.text() + "\n";
            } catch { combinedCSS += rule.cssText + "\n"; }
          } else {
            combinedCSS += rule.cssText + "\n";
          }
        }
      }
    } catch (e) {
      console.warn("CORS skip:", sheet.href);
    }
  }

  // 2. Clone DOM
  const clone = document.documentElement.cloneNode(true);

  // 3. UTF-8 charset
  let head = clone.querySelector("head") || (() => {
    const h = document.createElement("head");
    clone.insertBefore(h, clone.firstChild);
    return h;
  })();
  if (!clone.querySelector('meta[charset]')) {
    const m = document.createElement("meta");
    m.setAttribute("charset", "UTF-8");
    head.prepend(m);
  }

  // 4. Giữ font links (Google Fonts, preconnect, preload font)
  const fontLinks = Array.from(
    document.querySelectorAll('link[href*="fonts"], link[rel="preconnect"], link[rel="preload"][as="font"]')
  ).map(l => l.outerHTML).join("\n");

  // 5. Xóa script động + analytics
  clone.querySelectorAll("script, noscript").forEach(el => el.remove());

  // 6. Gộp CSS inline
  const styleEl = document.createElement("style");
  styleEl.textContent = combinedCSS;
  head.appendChild(styleEl);

  // 7. Thêm font links vào head
  if (fontLinks) {
    const tmp = document.createElement("div");
    tmp.innerHTML = fontLinks;
    while (tmp.firstChild) head.appendChild(tmp.firstChild);
  }

  // 8. Export
  const html = `<!DOCTYPE html>\n<html lang="${document.documentElement.lang || 'vi'}">\n${clone.innerHTML}\n</html>`;
  
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${document.title.replace(/[^a-z0-9]/gi, '_')}_export.html`;
  a.click();
  URL.revokeObjectURL(a.href);
  
  console.log(`✅ Exported: ${(blob.size / 1024).toFixed(1)}KB`);
})();
