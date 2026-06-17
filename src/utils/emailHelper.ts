export const isHtml = (str: string) => {
    return /<[a-z][\s\S]*>/i.test(str);
};

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
        const cleanedUrl = url.trim().replace(/[.,;)]$/, '');
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
    }

    if (typeof window === 'undefined') return rawHtml;

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');

        // 1. Sanitize HTML
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

        // 2. Resolve parent origin dynamically to enforce strict postMessage destination
        const parentOrigin = typeof window !== 'undefined' ? window.location.origin : '*';
        const isHtmlEmail = isHtml(email.body);
        const bodyBg = isHtmlEmail ? '#ede8e8' : '#dddadaff';
        const linkColor = '#2563eb';

        // 3. Inject our style overrides at the top of doc.head so email stylesheet rules cascade over them
        let head = doc.head;
        if (!head) {
            head = doc.createElement('head');
            doc.documentElement.insertBefore(head, doc.body);
        }

        // Force light color-scheme at browser meta level so the parent app's
        // dark color-scheme is NOT inherited into this iframe document.
        // A <meta name="color-scheme"> overrides inheritance from the parent frame.
        let colorSchemeMeta = doc.querySelector('meta[name="color-scheme"]');
        if (!colorSchemeMeta) {
            colorSchemeMeta = doc.createElement('meta');
            colorSchemeMeta.setAttribute('name', 'color-scheme');
            head.insertBefore(colorSchemeMeta, head.firstChild);
        }
        colorSchemeMeta.setAttribute('content', 'light only');

        // Also set it as an inline style on <html> (highest CSS specificity, beats !important in sheets)
        doc.documentElement.style.colorScheme = 'light';

        // Add base tag for links
        let baseTag = doc.querySelector('base');
        if (!baseTag) {
            baseTag = doc.createElement('base');
            head.insertBefore(baseTag, head.firstChild);
        }
        baseTag.setAttribute('target', '_blank');

        const styleTag = doc.createElement('style');
        styleTag.textContent = `
      :root, html {
        /* Force light color-scheme inside email iframe so the browser UA stylesheet
           does not remap the email's own colors when the app is in dark mode */
        color-scheme: light !important;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
        padding: 8px;
        box-sizing: border-box;
        max-width: 100% !important;
        overflow-x: hidden !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        ${isHtmlEmail ? '' : `background-color: ${bodyBg};`}
      }
      a { color: ${linkColor}; text-decoration: none; word-break: break-all; }
      a:hover { text-decoration: underline; }
      img { max-width: 100% !important; height: auto !important; }
      table { max-width: 100% !important; }
      @media (max-width: 768px) {
        table { width: 100% !important; }
      }
      td, div, p, span { max-width: 100% !important; word-wrap: break-word !important; overflow-wrap: break-word !important; }
      * { box-sizing: border-box !important; }
    `;
        // Prepend styleTag so it has lower precedence than email-defined stylesheets
        head.insertBefore(styleTag, baseTag.nextSibling);

        // 4. Inject iframe resize script in doc.head
        if (iframeHeightScript) {
            const scriptTag = doc.createElement('script');
            scriptTag.textContent = `
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
      `;
            head.appendChild(scriptTag);
        }

        return doc.documentElement.outerHTML;

    } catch (e) {
        console.error('Failed to parse and generate email HTML:', e);
        return rawHtml;
    }
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

    const now = new Date();
    const isToday = parsed.toDateString() === now.toDateString();
    const isThisYear = parsed.getFullYear() === now.getFullYear();

    if (isToday) {
        let hours = parsed.getHours();
        const minutes = String(parsed.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        return `${hours}:${minutes} ${ampm}`;
    } else if (isThisYear) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[parsed.getMonth()]} ${parsed.getDate()}`;
    } else {
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const yearShort = String(parsed.getFullYear()).slice(-2);
        return `${day}/${month}/${yearShort}`;
    }
};
