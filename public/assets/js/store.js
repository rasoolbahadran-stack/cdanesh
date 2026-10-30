/* ═══ کافه‌دانش — لایه ذخیره‌سازی محلی (پنل مدیریت آزمایشی) ═══
   در نسخه نهایی Next.js این لایه با دیتابیس و API سمت سرور
   جایگزین می‌شود؛ رابط توابع همین حفظ خواهد شد. */
(function () {
  'use strict';

  const NS = 'cd_';
  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(NS + key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  };
  const remove = key => { try { localStorage.removeItem(NS + key); } catch (e) {} };

  window.CDStore = {
    read, write, remove,

    // مقالات: ویرایش/وضعیت/حذف مقالات پایه + مقالات جدید پنل
    articleOverrides: () => read('articles', {}),          // {slug: {...patch}}
    newArticles: () => read('articles_new', []),           // [article, ...]
    saveArticleOverride: (slug, patch) => {
      const all = read('articles', {});
      all[slug] = Object.assign({}, all[slug] || {}, patch);
      return write('articles', all);
    },
    addNewArticle: article => {
      const list = read('articles_new', []);
      list.unshift(article);
      return write('articles_new', list);
    },
    updateNewArticle: (id, patch) => {
      const list = read('articles_new', []);
      const i = list.findIndex(a => a.id === id);
      if (i > -1) { list[i] = Object.assign({}, list[i], patch); return write('articles_new', list); }
      return false;
    },
    deleteNewArticle: id => {
      const list = read('articles_new', []).filter(a => a.id !== id);
      return write('articles_new', list);
    },

    // FAQ صفحات: {pageKey: [{q, a, on}]}
    faqOverrides: () => read('faq', {}),
    saveFaqPage: (pageKey, items) => write('faq', Object.assign({}, read('faq', {}), { [pageKey]: items })),

    // نمونه‌کارها: ترتیب و نمایش در صفحه اصلی {order:[slug], hidden:[slug]}
    portfolioState: () => read('portfolio', { order: null, hidden: [] }),
    savePortfolioState: st => write('portfolio', st),

    // پیام‌های فرم‌ها
    messages: () => read('messages', []),
    addMessage: msg => {
      const list = read('messages', []);
      list.unshift(msg);
      return write('messages', list);
    },
    updateMessage: (id, patch) => {
      const list = read('messages', []);
      const i = list.findIndex(m => m.id === id);
      if (i > -1) { list[i] = Object.assign({}, list[i], patch); return write('messages', list); }
      return false;
    },
    deleteMessage: id => write('messages', read('messages', []).filter(m => m.id !== id)),

    // سئوی صفحات: {path: {title, description}}
    seoOverrides: () => read('seo', {}),
    saveSeo: (path, patch) => write('seo', Object.assign({}, read('seo', {}), { [path]: patch })),

    // تنظیمات عمومی
    settings: () => read('settings', {}),
    saveSettings: patch => write('settings', Object.assign({}, read('settings', {}), patch)),

    // چک‌لیست عملکرد و امنیت: {key: bool}
    flags: () => read('flags', {}),
    saveFlag: (key, val) => write('flags', Object.assign({}, read('flags', {}), { [key]: !!val })),

    // نشست مدیر (آزمایشی سمت مرورگر)
    session: () => read('session', null),
    login: user => write('session', { user, at: Date.now() }),
    logout: () => remove('session'),

    // پاک‌سازی کامل داده‌های آزمایشی
    resetAll: () => {
      ['articles', 'articles_new', 'faq', 'portfolio', 'messages', 'seo', 'settings', 'flags']
        .forEach(remove);
    },
  };
})();
