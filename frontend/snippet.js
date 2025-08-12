(function () {
    const s = document.createElement('script');
    s.src = 'https://ayikefu.onrender.com/embed.iife.js'; // 替换为你部署后的实际 URL
  s.defer = true;
  document.head.appendChild(s);
})();

// 真实使用时：业务方直接引入：<script src="https://your-netlify-site.netlify.app/embed.iife.js" data-agent="AGENT001" data-url="https://your-backend.example.com" defer></script>
