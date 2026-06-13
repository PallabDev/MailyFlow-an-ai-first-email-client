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

export const getEmailHtml = (email: { body: string }, iframeHeightScript: boolean = true) => {
  let rawHtml = email.body;
  if (!isHtml(rawHtml)) {
    rawHtml = formatPlainTextInput(rawHtml);
  }
  return `
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #334155;
            margin: 0;
            padding: 16px;
            box-sizing: border-box;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          a { color: #2563eb; text-decoration: none; word-break: break-all; }
          a:hover { text-decoration: underline; }
          img { max-width: 100% !important; height: auto; }
          table { max-width: 100% !important; table-layout: fixed !important; }
          * { box-sizing: border-box !important; word-break: break-word !important; }
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
            window.parent.postMessage({ type: 'resize-iframe', height: height }, '*');
          }
          window.addEventListener('load', sendHeight);
          window.addEventListener('resize', sendHeight);
          document.addEventListener('DOMContentLoaded', sendHeight);
          setTimeout(sendHeight, 100);
          setTimeout(sendHeight, 500);
          setTimeout(sendHeight, 1000);
          setTimeout(sendHeight, 2000);
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
  'bg-sender-blue text-white border-transparent',
  'bg-sender-clay text-white border-transparent',
  'bg-sender-sand text-white border-transparent',
];

export const getAvatarColor = (name: string) => {
  if (!name) return avatarColors[0];
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
};

