// Abacasa tanıtım sayfası: TR/EN dil değişimi ve uygulama bağlantıları.
// Türkçe metin HTML'de durur (arama motorları ve JS'siz ziyaretçiler için); İngilizce burada.
// Dil seçimi: ?lang=en|tr > kayıtlı tercih > tarayıcı dili (tr değilse en).

(function () {
  'use strict';

  // Web uygulamasının adresi. data-app="/yol" taşıyan bağlantılar buna göre kurulur.
  var APP_URL = 'https://app.abacasa.com';

  var EN = {
    'meta.title': 'Abacasa · Your household budget in one place',
    'meta.description': 'Expenses, recurring payments, debts and donations — managed together with your family, in one app.',
    'nav.skip': 'Skip to content',
    'nav.label': 'Main menu',
    'nav.features': 'Features',
    'nav.how': 'How it works',
    'nav.privacy': 'Privacy',
    'nav.faq': 'FAQ',
    'nav.language': 'Language',
    'nav.login': 'Log in',

    'hero.eyebrow': 'Family budgeting, together',
    'hero.title': 'Your household budget in one place.',
    'hero.lead': 'Track expenses, bills, installments, debts and donations together with your family. See at a glance how much you spent this month and what is still to come.',
    'hero.primary': 'Create an account',
    'hero.secondary': 'Log in',
    'hero.mobile': 'Mobile app',
    'hero.soon': 'Coming soon',

    'mock.household': 'The Millers',
    'mock.admin': 'Admin',
    'mock.month': 'November 2026',
    'mock.total': 'Period total',
    'mock.totalValue': '₺48,250.40',
    'mock.spent': 'Spent',
    'mock.spentValue': '₺31,420.40',
    'mock.donation': 'Donations',
    'mock.donationValue': '₺2,500.00',
    'mock.pending': 'Pending',
    'mock.pendingValue': '₺14,330.00',
    'mock.recurring': 'Recurring',
    'mock.paidOf': '7 of 12 paid',
    'mock.debt': 'Open debt',
    'mock.debtValue': '₺86,400.00',
    'mock.debtNote': 'In TRY · 4 debts',
    'mock.upcoming': 'Upcoming payments',
    'mock.row1': 'Electricity bill',
    'mock.row1Value': '₺1,240.00',
    'mock.row2': 'Credit card installment',
    'mock.row2Value': '₺3,500.00',
    'mock.row3': 'Family car · Inspection',
    'mock.row3Value': '12 days',
    'mock.floatA': 'Rent paid',
    'mock.floatASub': 'Ayşe · 2 min ago',
    'mock.floatB': 'USD · EUR · Quarter gold',
    'mock.floatBSub': 'Converted at today’s rate',

    'strip.label': 'Highlights',
    'strip.a': 'Multiple households',
    'strip.aSub': 'Home, summer house, parents’ home',
    'strip.b': '4 currencies',
    'strip.bSub': 'TRY, USD, EUR, quarter gold',
    'strip.c': 'Web + mobile',
    'strip.cSub': 'One account, every device',
    'strip.d': 'Turkish and English',
    'strip.dSub': 'Light and dark theme',

    'features.eyebrow': 'Features',
    'features.title': 'Everything a family does with money',
    'features.sub': 'Brings together what is scattered across spreadsheets, notebooks and group chats.',
    'f1.t': 'Expenses',
    'f1.d': 'Log them with a category, payment method and person. Cards, cash and bank accounts stay separate; meal cards don’t inflate your total.',
    'f2.t': 'Recurring payments & installments',
    'f2.d': 'Bills, subscriptions, rent and installment plans. Pay one and the record is created; which months are paid shows up on its own.',
    'f3.t': 'Debts',
    'f3.d': 'Who you borrowed from, how much you repaid, what’s left. Foreign-currency and gold debts show their value in TRY at today’s rate.',
    'f4.t': 'Donations, goals, entrusted funds',
    'f4.d': 'Zakat, charity, scholarships… Set a yearly goal and see your progress. Keep money others entrusted to you separate.',
    'f5.t': 'Vehicles',
    'f5.d': 'Inspection, traffic insurance, comprehensive insurance, vehicle tax and maintenance dates. You get a heads-up on the summary when one is due.',
    'f6.t': 'Yearly table',
    'f6.d': 'Enter your income by month; expenses fill in from your records. See what’s left in every month of the year.',
    'f7.t': 'Together with family',
    'f7.d': 'Invite your partner, kids or siblings. Admin and member roles make it clear who can see and change what.',
    'f8.t': 'Live exchange rates',
    'f8.d': 'USD and EUR rates are fetched daily from the Central Bank of Turkey, or enter your own. You set the quarter gold price.',

    'how.eyebrow': 'How it works',
    'how.title': 'Get started in three steps',
    'how.s1t': 'Create your household',
    'how.s1d': 'Name your household when you sign up. Categories and basics come ready.',
    'how.s2t': 'Invite your family',
    'how.s2d': 'Send an invite by email. It’s valid for 7 days, and whoever accepts joins your household directly.',
    'how.s3t': 'Log it, see it',
    'how.s3d': 'The moment you add an expense, your period total, pending payments and debts update.',

    'privacy.eyebrow': 'Privacy',
    'privacy.title': 'Your data is yours, and your household is only yours.',
    'privacy.sub': 'Abacasa shows no ads and never sells your data. It runs with a KVKK-compliant privacy notice and explicit consent.',
    'privacy.c1': 'Each household’s records are kept completely separate.',
    'privacy.c2': 'Download all your data as an Excel file whenever you like.',
    'privacy.c3': 'When you delete your account, your personal details are anonymized.',
    'privacy.c4': 'See your sessions and sign out an unknown device with one tap.',

    'faq.eyebrow': 'FAQ',
    'faq.title': 'Frequently asked questions',
    'faq.q1': 'Can I manage more than one household?',
    'faq.a1': 'Yes. Create separate households for your home, a summer house or your parents’ home and switch between them with one tap. Each household has its own members and records.',
    'faq.q2': 'Which currencies are supported?',
    'faq.a2': 'Turkish lira, US dollar, euro and quarter gold. Foreign-currency and gold records are converted to TRY at the current rate for totals.',
    'faq.q3': 'Where do the exchange rates come from?',
    'faq.a3': 'For USD and EUR, the Central Bank of Turkey’s selling rate is fetched automatically every day. Your household can also enter its own rate; the more recent one is used. The quarter gold price is entered manually.',
    'faq.q4': 'When is the mobile app coming?',
    'faq.a4': 'The iOS and Android apps are coming to the stores soon. Until then, the web app works comfortably in your phone’s browser.',
    'faq.q5': 'Can I take my data elsewhere?',
    'faq.a5': 'Yes. Download your personal data from your profile, and all of a household’s records from household settings, as Excel files.',

    'final.title': 'Start this month’s budget today.',
    'final.sub': 'Set up your household and invite your family in minutes.',
    'final.cta': 'Create an account',

    'footer.label': 'Legal',
    'footer.terms': 'Terms of use',
    'footer.privacy': 'Privacy notice',
    'footer.contact': 'Contact'
  };

  var STORAGE_KEY = 'abacasa.lang';
  var TR = {};
  var textNodes = document.querySelectorAll('[data-i18n]');
  var attrNodes = document.querySelectorAll('[data-i18n-attr]');

  // Türkçe metinleri HTML'den bir kez topla (tek kaynak HTML).
  textNodes.forEach(function (el) { TR[el.getAttribute('data-i18n')] = el.textContent.trim().replace(/\s+/g, ' '); });
  attrNodes.forEach(function (el) {
    el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
      var parts = pair.split(':');
      TR[parts[1]] = el.getAttribute(parts[0]);
    });
  });

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* özel pencere vb. */ }
  }

  function initialLang() {
    var param = new URLSearchParams(location.search).get('lang');
    if (param === 'tr' || param === 'en') return param;
    var saved = read(STORAGE_KEY);
    if (saved === 'tr' || saved === 'en') return saved;
    return (navigator.language || 'tr').toLowerCase().indexOf('tr') === 0 ? 'tr' : 'en';
  }

  function apply(lang) {
    var dict = lang === 'en' ? EN : TR;
    document.documentElement.lang = lang;
    textNodes.forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n')];
      if (value != null) el.textContent = value;
    });
    attrNodes.forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var parts = pair.split(':');
        var value = dict[parts[1]];
        if (value != null) el.setAttribute(parts[0], value);
      });
    });
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === lang));
    });
  }

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-lang');
      write(STORAGE_KEY, lang);
      apply(lang);
      var url = new URL(location.href);
      if (lang === 'en') url.searchParams.set('lang', 'en'); else url.searchParams.delete('lang');
      history.replaceState(null, '', url);
    });
  });

  document.querySelectorAll('[data-app]').forEach(function (a) {
    a.href = APP_URL + a.getAttribute('data-app');
  });

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  apply(initialLang());
})();
