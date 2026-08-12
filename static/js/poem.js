(() => {
  const selectors = [
    '.site-subtitle',
    '.sidebar .site-subtitle',
    '.sidebar .subtitle',
    '.site-meta .site-subtitle',
    '.site-meta .subtitle',
    '.site-description',
    '[data-subtitle]',
  ];

  function setSubtitle(text) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        el.textContent = text;
        el.setAttribute('data-subtitle', text);
        document.documentElement.classList.add('poem-ready');
        return true;
      }
    }
    return false;
  }

  async function fetchPoem() {
    try {
      const resp = await fetch('https://v1.jinrishici.com/all.json', { cache: 'no-store' });
      if (!resp.ok) throw new Error('network');
      const data = await resp.json();
      const content = data && data.content;
      const line = content || '春江潮水连海平，海上明月共潮生。';
      return line;
    } catch (e) {
      return '但愿人长久，千里共婵娟。';
    }
  }

  function runOnce() {
    fetchPoem().then((text) => {
      if (setSubtitle(text)) return;
      // 重试若元素稍后才出现
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (setSubtitle(text) || attempts >= 20) {
          clearInterval(timer);
        }
      }, 250);
    });
  }

  function observeAndApply() {
    // 监听 DOM 变化，元素出现时再设置
    const observer = new MutationObserver(() => {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.getAttribute('data-poem-applied') !== '1') {
          // 标记避免反复重写
          runOnce();
          el.setAttribute('data-poem-applied', '1');
          break;
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    // 初始也执行一次
    runOnce();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeAndApply, { once: true });
  } else {
    observeAndApply();
  }
})();


