export const isHtml = (str: string) => {
  return /<[a-z][\s\S]*>/i.test(str);
};

// Client-side lightweight HTML sanitizer to prevent stored XSS in emails
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove blacklisted elements
    const blacklist = ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'applet', 'form', 'svg'];
    blacklist.forEach(tag => {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    // Traverse and clean attributes
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      // Remove inline event handlers (on*) and javascript: links
      const attrs = Array.from(el.attributes);
      attrs.forEach(attr => {
        const name = attr.name.toLowerCase();
        const val = attr.value.toLowerCase();
        
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
        } else if ((name === 'href' || name === 'src' || name === 'action') && val.startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });
    
    return doc.body.innerHTML;
  } catch (e) {
    console.error('HTML Sanitization failed', e);
    return '';
  }
}

export const formatPlainTextInput = (text: string) => {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Replace "Text (https://url)" with links
  html = html.replace(/([a-zA-Z0-9_'-]+(?:[ \t]+[a-zA-Z0-9_'-]+){0,2})\s*\(\s*(https?:\/\/[^\s)]+)\s*\)/g, (match, anchorText, url) => {
    return `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${anchorText.trim()}</a>`;
  });

  // Replace remaining standalone URLs with links
  html = html.replace(/(?<!href=")(?<!">)(https?:\/\/[^\s<]+)/g, (match, url) => {
    let cleanedUrl = url.trim().replace(/[.,;)]$/, '');
    let displayUrl = cleanedUrl;
    if (displayUrl.length > 50) {
      displayUrl = displayUrl.substring(0, 47) + '...';
    }
    return `<a href="${cleanedUrl}" target="_blank" rel="noopener noreferrer">${displayUrl}</a>`;
  });

  html = html.replace(/\n/g, '<br />');
  return html;
};

export const getEmailHtml = (email: { body: string }, iframeHeightScript: boolean = true, isDark: boolean = false) => {
  let rawHtml = email.body;
  if (!isHtml(rawHtml)) {
    rawHtml = formatPlainTextInput(rawHtml);
  } else {
    rawHtml = sanitizeHtml(rawHtml);
  }

  // Resolve parent origin dynamically to enforce strict postMessage destination (prevents wildcard origin vulnerability)
  const parentOrigin = typeof window !== 'undefined' ? window.location.origin : '*';

  const textColor = '#2c2c2a';
  const linkColor = '#2563eb';

  return `
    <html style="${isDark ? 'background-color: #ffffff !important; filter: invert(0.9) hue-rotate(180deg) !important;' : ''}">
      <head>
        <base target="_blank">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: ${textColor};
            margin: 0;
            padding: 16px;
            box-sizing: border-box;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            background: transparent !important;
          }
          a { color: ${linkColor}; text-decoration: none; word-break: break-all; }
          a:hover { text-decoration: underline; }
          img { max-width: 100% !important; height: auto; }
          table { max-width: 100% !important; table-layout: fixed !important; }
          * { box-sizing: border-box !important; word-break: break-word !important; }
          ${isDark ? `
          img, svg, video, [style*="background-image"] {
            filter: invert(1.11) hue-rotate(180deg) !important;
          }
          ` : ''}
        </style>
        ${iframeHeightScript ? `
        <script>
          function sendHeight() {
            var height = Math.max(
              document.body.scrollHeight,
              document.documentElement.scrollHeight,
              document.body.offsetHeight,
              document.documentElement.offsetHeight
            );
            window.parent.postMessage({ type: 'resize-iframe', height: height }, "${parentOrigin}");
          }
          function forceBlankLinks() {
            var links = document.getElementsByTagName('a');
            for (var i = 0; i < links.length; i++) {
              links[i].setAttribute('target', '_blank');
              links[i].setAttribute('rel', 'noopener noreferrer');
            }
          }
          window.addEventListener('load', function() {
            sendHeight();
            forceBlankLinks();
          });
          window.addEventListener('resize', sendHeight);
          document.addEventListener('DOMContentLoaded', function() {
            sendHeight();
            forceBlankLinks();
          });
          setTimeout(function() { sendHeight(); forceBlankLinks(); }, 100);
          setTimeout(function() { sendHeight(); forceBlankLinks(); }, 500);
          setTimeout(function() { sendHeight(); forceBlankLinks(); }, 1000);
          setTimeout(function() { sendHeight(); forceBlankLinks(); }, 2000);
        </script>
        ` : ''}
      </head>
      <body>
        ${rawHtml}
      </body>
    </html>
  `;
};

export const parseSender = (sender: string) => {
  const match = sender.match(/(.*?)\s*<(.*)>/);
  if (match) {
    return { name: match[1].replace(/"/g, ''), email: match[2] };
  }
  return { name: sender, email: '' };
};

export const getInitials = (from: string) => {
  const sender = parseSender(from);
  const parts = sender.name.split(' ');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return sender.name.slice(0, 2).toUpperCase();
};

const avatarColors = [
  'bg-sender-blue/15 text-sender-blue border-sender-blue/20',
  'bg-sender-clay/15 text-sender-clay border-sender-clay/20',
  'bg-sender-sand/15 text-sender-sand border-sender-sand/20',
  'bg-sender-sage/15 text-sender-sage border-sender-sage/20',
];

export const getAvatarColor = (name: string) => {
  if (!name) return avatarColors[0];
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
};

export const formatEmailDate = (dateVal: string | Date | number | undefined): string => {
  if (!dateVal) return '';
  const parsed = new Date(dateVal);
  if (isNaN(parsed.getTime())) {
    return String(dateVal);
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();

  let hours = parsed.getHours();
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');

  return `${day}/${month}/${year} at ${hoursStr}:${minutes} ${ampm}`;
};
