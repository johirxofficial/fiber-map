/* Runtime branding and shared navigation for the built React app. */
(function () {
  'use strict';

  var replacementsMap = {
    'fiber-map': true,
    'Fiber Map': true,
    'Fiber network management map': true
  };

  var identity = {
    loaded: false,
    canManage: (function () {
      try { return localStorage.getItem('site_can_manage') === '1'; } catch (error) { return false; }
    })()
  };

  var siteConfig = {
    site_name: 'fiber-map',
    tagline: 'Fiber network management map',
    logo_url: '/static/img/logo.jpg'
  };

  function getToken() {
    try { return localStorage.getItem('token'); } catch (error) { return null; }
  }

  function isSetupPath() {
    return location.pathname === '/setup' || location.pathname.indexOf('/setup/') === 0;
  }

  function setTitle(config) {
    var name = config.site_name || 'fiber-map';
    var tagline = config.tagline || '';
    var current = document.title || '';
    if (/dashboard/i.test(current)) {
      document.title = name + ' - Dashboard';
    } else if (/management/i.test(current)) {
      document.title = name + ' - Management';
    } else if (/zones/i.test(current)) {
      document.title = name + ' - Management';
    } else if (current) {
      document.title = tagline ? name + ' - ' + tagline : name;
    }
  }

  function applyLogos(config) {
    if (!config.logo_url) return;
    var brandLogo = document.getElementById('brandLogo');
    if (brandLogo) brandLogo.src = config.logo_url;
    var images = document.querySelectorAll('img');
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (img.getAttribute('data-site-nav') || img.getAttribute('data-no-branding')) continue;
      var alt = (img.getAttribute('alt') || '').toLowerCase();
      var src = (img.getAttribute('src') || '').toLowerCase();
      if (alt.indexOf('logo') !== -1 || src.indexOf('logo') !== -1) {
        img.src = config.logo_url;
        img.removeAttribute('srcset');
      }
    }
  }

  function replaceText(config) {
    var brandName = document.getElementById('brandName');
    if (brandName && config.site_name) brandName.textContent = config.site_name;
    var replacements = {
      'fiber-map': config.site_name,
      'Fiber Map': config.site_name,
      'Fiber network management map': config.tagline
    };
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      var parent = node.parentNode;
      if (!parent) continue;
      var tag = (parent.tagName || '').toUpperCase();
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'INPUT' || tag === 'TEXTAREA') continue;
      var value = (node.nodeValue || '').trim();
      if (!value || !Object.prototype.hasOwnProperty.call(replacements, value)) continue;
      var replacement = replacements[value];
      if (replacement && replacement !== value) {
        node.nodeValue = node.nodeValue.replace(value, replacement);
      }
    }
  }

  function makeNavItem(text, href, active, key) {
    var link = document.createElement('a');
    link.className = 'item' + (active ? ' active' : '');
    link.href = href;
    link.textContent = text;
    link.setAttribute('data-site-nav', key);
    return link;
  }

  function findNav(menu, key) {
    return menu.querySelector('[data-site-nav="' + key + '"]');
  }

  function ensureItem(menu, key, text, href, active, before) {
    var item = findNav(menu, key);
    if (!item) {
      item = makeNavItem(text, href, active, key);
      if (before) menu.insertBefore(item, before); else menu.appendChild(item);
      return item;
    }
    if (item.textContent !== text) item.textContent = text;
    if (item.getAttribute('href') !== href) item.setAttribute('href', href);
    if (active !== item.classList.contains('active')) item.classList.toggle('active', active);
    if (before && item.nextSibling !== before) menu.insertBefore(item, before);
    return item;
  }

  function sharedNavCss() {
    var css = document.getElementById('sharedNavCss');
    if (css) return;
    css = document.createElement('style');
    css.id = 'sharedNavCss';
    css.textContent = [
      '#sharedSiteNav{position:sticky;top:0;z-index:1000;background:#fff;margin:0!important;',
      'padding:0 24px;border-radius:0!important;}',
      '#sharedSiteNav .brand-item{display:flex!important;align-items:center;gap:9px;',
      'color:#111!important;font-weight:700!important;font-size:17px;}',
      '#sharedSiteNav .brand-item img{width:28px;height:28px;object-fit:contain;border-radius:4px;}',
      '#sharedSiteNav .logout-item{background:transparent;border:0;cursor:pointer;font:inherit;}',
      '#root > .ui.pointing.secondary.menu{display:none!important;}'
    ].join('');
    document.head.appendChild(css);
  }

  function ensureSharedNav() {
    var nav = document.getElementById('sharedSiteNav');
    if (nav) return nav;
    nav = document.createElement('div');
    nav.id = 'sharedSiteNav';
    nav.className = 'ui pointing secondary menu site-menu';
    var root = document.getElementById('root');
    if (root && root.parentNode) root.parentNode.insertBefore(nav, root);
    else document.body.insertBefore(nav, document.body.firstChild);
    return nav;
  }

  function removeSharedNav() {
    var nav = document.getElementById('sharedSiteNav');
    if (nav) nav.parentNode.removeChild(nav);
    var css = document.getElementById('sharedNavCss');
    if (css) css.parentNode.removeChild(css);
  }

  function hasStaticNav() {
    return !!document.querySelector('body > .site-menu:not(#sharedSiteNav)');
  }

  function cacheManage(value) {
    try { localStorage.setItem('site_can_manage', value ? '1' : '0'); } catch (error) {}
  }

  function injectNav() {
    if (!getToken() || isSetupPath() || location.pathname === '/login') {
      removeSharedNav();
      return;
    }
    /* Management / Zones pages render their own static menu. */
    if (hasStaticNav()) {
      removeSharedNav();
      return;
    }

    sharedNavCss();
    var menu = ensureSharedNav();
    var path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    var manageActive = /^\/(management|manage|site-settings)\/?$/.test(path);
    var dashboardActive = path === '/' || path === '/dashboard';
    var networkActive = path === '/network-point';

    var brand = findNav(menu, 'brand');
    if (!brand) {
      brand = document.createElement('a');
      brand.className = 'item brand-item';
      brand.href = '/';
      brand.setAttribute('data-site-nav', 'brand');
      var brandImage = document.createElement('img');
      brandImage.alt = 'logo';
      brandImage.setAttribute('data-no-branding', '1');
      var brandText = document.createElement('span');
      brand.appendChild(brandImage);
      brand.appendChild(brandText);
      menu.insertBefore(brand, menu.firstChild);
    }
    var logo = brand.querySelector('img');
    var name = brand.querySelector('span');
    var logoUrl = siteConfig.logo_url || '/static/img/logo.jpg';
    if (logo && logo.getAttribute('src') !== logoUrl) logo.src = logoUrl;
    if (name && name.textContent !== (siteConfig.site_name || 'fiber-map')) {
      name.textContent = siteConfig.site_name || 'fiber-map';
    }

    var rightMenu = menu.querySelector('.right.menu');
    if (!rightMenu) {
      rightMenu = document.createElement('div');
      rightMenu.className = 'right menu';
      menu.appendChild(rightMenu);
    }

    ensureItem(menu, 'dashboard', 'Dashboard', '/', dashboardActive, rightMenu);
    ensureItem(menu, 'network', 'Network Point', '/network-point', networkActive, rightMenu);
    ['zones', 'users-create'].forEach(function (key) {
      var old = findNav(menu, key);
      if (old) old.parentNode.removeChild(old);
    });
    if (identity.canManage) {
      ensureItem(menu, 'management', 'Management', '/management/', manageActive, rightMenu);
    } else {
      var management = findNav(menu, 'management');
      if (management) management.parentNode.removeChild(management);
    }

    if (!findNav(menu, 'logout')) {
      var logout = document.createElement('a');
      logout.className = 'item logout-item';
      logout.href = '/login';
      logout.textContent = 'Logout';
      logout.setAttribute('data-site-nav', 'logout');
      logout.addEventListener('click', function () {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('expirationDate');
        } catch (error) {}
      });
      rightMenu.appendChild(logout);
    }
  }

  function loadIdentity() {
    var token = getToken();
    if (!token) {
      identity.loaded = true;
      identity.canManage = false;
      cacheManage(false);
      injectNav();
      return;
    }
    /* Keep the cached role while the request is in flight.  A transient
       verify-token failure must never make Management/Create User vanish. */
    identity.canManage = identity.canManage || (function () {
      try { return localStorage.getItem('site_can_manage') === '1'; } catch (error) { return false; }
    })();
    injectNav();
    var attempt = 0;
    function verify() {
      attempt += 1;
      fetch('/api/verify-token/', {
        headers: { 'Authorization': 'Token ' + token },
        credentials: 'same-origin',
        cache: 'no-store'
      })
        .then(function (response) {
          if (response.status === 401) {
            try { localStorage.removeItem('token'); } catch (error) {}
            removeSharedNav();
            return null;
          }
          return response.ok ? response.json() : Promise.reject(new Error('verify failed'));
        })
        .then(function (data) {
          if (data && data.user) {
            identity.canManage = !!(data.user.permissions && data.user.permissions.manage);
            cacheManage(identity.canManage);
            identity.loaded = true;
            injectNav();
          } else if (data === null) {
            identity.loaded = true;
          } else {
            throw new Error('verify failed');
          }
        })
        .catch(function () {
          /* Keep the cached role and retry, so a temporary outage does not
             remove Management/Create User from the menu. */
          if (attempt < 4) {
            setTimeout(verify, 1200);
          } else {
            identity.loaded = true;
            injectNav();
          }
        });
    }
    verify();
  }

  function apply(config) {
    if (!config || !config.site_name) return;
    siteConfig = config;
    setTitle(config);
    applyLogos(config);
    replaceText(config);
    injectNav();

    var root = document.getElementById('root') || document.body;
    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        applyLogos(config);
        replaceText(config);
        injectNav();
      });
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  function fetchBranding() {
    try {
      fetch('/api/site/', { credentials: 'same-origin', cache: 'no-store' })
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (config) {
          if (config) apply(config);
          loadIdentity();
        })
        .catch(function () {
          loadIdentity();
        });
    } catch (error) {
      loadIdentity();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchBranding);
  } else {
    fetchBranding();
  }
})();
