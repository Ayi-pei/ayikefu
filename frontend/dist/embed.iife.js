// 源码：embed.js
// 这个脚本负责在页面注入一个 iframe，iframe 指向后端或前端提供的 embed 页面
(function () {
    const currentScript = document.currentScript || (function () { const s = document.getElementsByTagName('script'); return s[s.length - 1]; })();
    const agent = currentScript?.getAttribute('data-agent') || '';
    const url = currentScript?.getAttribute('data-url') || window.location.origin;
    const position = currentScript?.getAttribute('data-position') || 'right';
    const width = currentScript?.getAttribute('data-width') || '360px';
    const height = currentScript?.getAttribute('data-height') || '520px';

    const iframe = document.createElement('iframe');
    const right = position === 'right' ? '20px' : 'auto';
    const left = position === 'left' ? '20px' : 'auto';
    iframe.src = `${url}/?embed=1&agent=${encodeURIComponent(agent)}`;
    iframe.style = `position:fixed;bottom:20px;right:${right};left:${left};width:${width};height:${height};border:none;border-radius:8px;z-index:9999999;box-shadow:0 6px 20px rgba(0,0,0,0.15);`;
    iframe.setAttribute('aria-hidden', 'false');
    document.body.appendChild(iframe);
})();
  