import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

const APP_PASSWORD = '1236';

const TRANSLATIONS = {
  en: {
    appName: 'E-Breshna - Offline Electricity Meter',
    heroTitle: 'Offline Electricity Meter by E-Breshna',
    loginTitle: 'Secure Login',
    loginHint: 'Password only, works fully offline',
    password: 'Password',
    enterPassword: 'Enter password',
    login: 'Login',
    wrongPassword: 'Wrong password. Please try again.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    logout: 'Logout',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    language: 'Language',
    english: 'English',
    dari: 'دری',
    pashto: 'پښتو',
    category: 'Category',
    residential: 'Residential',
    commercial: 'Commercial',
    factory: 'Registered Factory',
    kwToMoney: 'kWh → AFN',
    moneyToKw: 'AFN → kWh',
    previousKw: 'Previous period kWh reading',
    currentKw: 'Current period kWh reading',
    previousMoney: 'Previous period money (AFN)',
    currentMoney: 'Current period money (AFN)',
    calculate: 'Calculate',
    amountAfn: 'Amount (AFN)',
    enterNumber: 'Enter number',
    result: 'Result',
    monthlyKw: 'Current month consumption',
    monthlyMoney: 'Current month spent money',
    estimatedBill: 'Estimated bill by selected category',
    total: 'Total',
    tierTable: 'Tariff breakdown table',
    tier: 'Tier',
    rate: 'Rate (AFN)',
    usedKw: 'kWh',
    cost: 'Cost (AFN)',
    moneyShare: 'Money used (AFN)',
    convertedKw: 'Converted kWh',
    sectionHelp: 'Press Enter after typing values to confirm and calculate.',
    invalidReadings: 'Current values must be greater than or equal to previous values.',
    invalidAmount: 'Please enter a value greater than zero.',
    madeBy: 'Made by: Yaser Rahimi'
  },
  fa: {
    appName: 'E-Breshna - Offline Electricity Meter',
    heroTitle: 'Offline Electricity Meter by E-Breshna',
    loginTitle: 'ورود امن',
    loginHint: 'فقط رمز عبور، کاملاً آفلاین',
    password: 'رمز عبور',
    enterPassword: 'رمز عبور را وارد کنید',
    login: 'ورود',
    wrongPassword: 'رمز عبور اشتباه است.',
    showPassword: 'نمایش رمز',
    hidePassword: 'پنهان‌سازی رمز',
    logout: 'خروج',
    theme: 'تم',
    dark: 'تاریک',
    light: 'روشن',
    language: 'زبان',
    english: 'English',
    dari: 'دری',
    pashto: 'پښتو',
    category: 'بخش',
    residential: 'مسکونی',
    commercial: 'تجاری',
    factory: 'کارخانه ثبت‌شده',
    kwToMoney: 'کیلووات ساعت → افغانی',
    moneyToKw: 'افغانی → کیلووات ساعت',
    previousKw: 'قرائت کیلووات قبلی',
    currentKw: 'قرائت کیلووات فعلی',
    previousMoney: 'پول دوره قبلی (AFN)',
    currentMoney: 'پول دوره فعلی (AFN)',
    calculate: 'محاسبه',
    amountAfn: 'مقدار (AFN)',
    enterNumber: 'عدد وارد کنید',
    result: 'نتیجه',
    monthlyKw: 'مصرف ماه جاری',
    monthlyMoney: 'مبلغ مصرف‌شده ماه جاری',
    estimatedBill: 'هزینه تخمینی بر اساس بخش انتخاب‌شده',
    total: 'مجموع',
    tierTable: 'جدول تفکیک تعرفه',
    tier: 'پله',
    rate: 'نرخ (AFN)',
    usedKw: 'کیلووات',
    cost: 'هزینه (AFN)',
    moneyShare: 'سهم پول (AFN)',
    convertedKw: 'کیلووات تبدیل‌شده',
    sectionHelp: 'برای تأیید و محاسبه بعد از ورود مقدار Enter بزنید.',
    invalidReadings: 'مقادیر فعلی باید بزرگ‌تر یا مساوی مقادیر قبلی باشند.',
    invalidAmount: 'لطفاً عددی بزرگ‌تر از صفر وارد کنید.',
    madeBy: 'ساخته شده توسط: Yaser Rahimi'
  },
  ps: {
    appName: 'E-Breshna - Offline Electricity Meter',
    heroTitle: 'Offline Electricity Meter by E-Breshna',
    loginTitle: 'خوندي ننوتل',
    loginHint: 'یوازې پاسورډ، په بشپړ ډول آفلاین',
    password: 'پاسورډ',
    enterPassword: 'پاسورډ ولیکئ',
    login: 'ننوتل',
    wrongPassword: 'پاسورډ ناسم دی.',
    showPassword: 'پاسورډ ښکاره کړئ',
    hidePassword: 'پاسورډ پټ کړئ',
    logout: 'وتل',
    theme: 'بڼه',
    dark: 'تیاره',
    light: 'روښانه',
    language: 'ژبه',
    english: 'English',
    dari: 'دری',
    pashto: 'پښتو',
    category: 'کټګوري',
    residential: 'استوګنیز',
    commercial: 'سوداګریز',
    factory: 'ثبت شوې فابریکه',
    kwToMoney: 'kWh → AFN',
    moneyToKw: 'AFN → kWh',
    previousKw: 'د تېرې مودې kWh',
    currentKw: 'د اوسنۍ مودې kWh',
    previousMoney: 'د تېرې مودې پیسې (AFN)',
    currentMoney: 'د اوسنۍ مودې پیسې (AFN)',
    calculate: 'محاسبه',
    amountAfn: 'مقدار (AFN)',
    enterNumber: 'شمېره ولیکئ',
    result: 'پایله',
    monthlyKw: 'د روانې میاشتې مصرف',
    monthlyMoney: 'د روانې میاشتې لګول شوې پیسې',
    estimatedBill: 'د ټاکل شوې کټګورۍ له مخې اټکلي بیل',
    total: 'ټول',
    tierTable: 'د تعرفې جزییات',
    tier: 'کچه',
    rate: 'بیه (AFN)',
    usedKw: 'kWh',
    cost: 'لګښت (AFN)',
    moneyShare: 'کارول شوې پیسې (AFN)',
    convertedKw: 'بدلې شوې kWh',
    sectionHelp: 'له شمېرې وروسته Enter کېکاږئ تر څو محاسبه وشي.',
    invalidReadings: 'اوسني ارزښتونه باید د پخوانیو ارزښتونو نه کم نه وي.',
    invalidAmount: 'مهرباني وکړئ له صفر څخه لویه شمېره دننه کړئ.',
    madeBy: 'جوړونکی: Yaser Rahimi'
  }
};

const TARIFFS = {
  residential: [
    { min: 1, max: 200, rate: 2.19 },
    { min: 201, max: 400, rate: 5.63 },
    { min: 401, max: 700, rate: 8.13 },
    { min: 701, max: 2000, rate: 11.25 },
    { min: 2001, max: Infinity, rate: 12.5 }
  ],
  commercial: [{ min: 0, max: Infinity, rate: 16.25 }],
  factory: [{ min: 0, max: Infinity, rate: 6.75 }]
};

const formatNumber = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

function App() {
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeCategory, setActiveCategory] = useState('residential');

  const [kwInputs, setKwInputs] = useState({ prevKw: '', currKw: '', prevMoney: '', currMoney: '' });
  const [kwResult, setKwResult] = useState(null);

  const [moneyInput, setMoneyInput] = useState('');
  const [moneyResult, setMoneyResult] = useState(null);

  const rtl = language !== 'en';
  const t = (key) => TRANSLATIONS[language][key] || key;

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('ebreshna-offline') || '{}');
    if (saved.language) setLanguage(saved.language);
    if (typeof saved.darkMode === 'boolean') setDarkMode(saved.darkMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('ebreshna-offline', JSON.stringify({ language, darkMode }));
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
  }, [language, darkMode, rtl]);

  const categoryOptions = useMemo(
    () => [
      { key: 'residential', label: t('residential') },
      { key: 'commercial', label: t('commercial') },
      { key: 'factory', label: t('factory') }
    ],
    [language]
  );

  const getTierBreakdownFromKw = (kw, category) => {
    let remainingKw = Number(kw);
    const breakdown = [];

    for (const slab of TARIFFS[category]) {
      if (remainingKw <= 0) break;
      const slabSize = slab.max === Infinity ? Infinity : slab.max - slab.min + 1;
      const used = slabSize === Infinity ? remainingKw : Math.min(remainingKw, slabSize);
      const cost = used * slab.rate;

      breakdown.push({
        tier: `${slab.min}-${slab.max === Infinity ? '∞' : slab.max}`,
        kw: used,
        rate: slab.rate,
        cost
      });
      remainingKw -= used;
    }

    return breakdown;
  };

  const getBreakdownFromMoney = (amount, category) => {
    let remainingMoney = Number(amount);
    const breakdown = [];

    for (const slab of TARIFFS[category]) {
      if (remainingMoney <= 0) break;
      const slabSize = slab.max === Infinity ? Infinity : slab.max - slab.min + 1;
      const slabMaxMoney = slabSize === Infinity ? Infinity : slabSize * slab.rate;

      const usedMoney = slabMaxMoney === Infinity ? remainingMoney : Math.min(remainingMoney, slabMaxMoney);
      const convertedKw = usedMoney / slab.rate;

      breakdown.push({
        tier: `${slab.min}-${slab.max === Infinity ? '∞' : slab.max}`,
        kw: convertedKw,
        rate: slab.rate,
        cost: usedMoney
      });

      remainingMoney -= usedMoney;
    }

    return breakdown;
  };

  const onLogin = () => {
    if (password === APP_PASSWORD) {
      setIsLoggedIn(true);
      setPassword('');
      return;
    }
    alert(t('wrongPassword'));
  };

  const calculateKwToMoney = () => {
    const prevKw = Number(kwInputs.prevKw);
    const currKw = Number(kwInputs.currKw);
    const prevMoney = Number(kwInputs.prevMoney);
    const currMoney = Number(kwInputs.currMoney);

    if (currKw < prevKw || currMoney < prevMoney) {
      alert(t('invalidReadings'));
      return;
    }

    const monthlyKw = currKw - prevKw;
    const monthlyMoney = currMoney - prevMoney;
    const breakdown = getTierBreakdownFromKw(monthlyKw, activeCategory);
    const estimatedBill = breakdown.reduce((sum, row) => sum + row.cost, 0);

    setKwResult({ monthlyKw, monthlyMoney, breakdown, estimatedBill });
  };

  const calculateMoneyToKw = () => {
    const amount = Number(moneyInput);
    if (!(amount > 0)) {
      alert(t('invalidAmount'));
      return;
    }

    const breakdown = getBreakdownFromMoney(amount, activeCategory);
    const convertedKw = breakdown.reduce((sum, row) => sum + row.kw, 0);

    setMoneyResult({ amount, breakdown, convertedKw });
  };

  const handleEnter = (event, action) => {
    if (event.key === 'Enter') action();
  };

  if (!isLoggedIn) {
    return (
      <div className={`app-shell ${darkMode ? 'dark' : ''}`}>
        <div className="login-card fade-in-up">
          <div className="top-strip">
            <h1 className="brand-title">{t('appName')}</h1>
            <div className="top-actions">
              <div className="moving-select-wrap" title={t('language')}>
                <span>🌐</span>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="moving-select">
                  <option value="en">{t('english')}</option>
                  <option value="fa">{t('dari')}</option>
                  <option value="ps">{t('pashto')}</option>
                </select>
              </div>
              <button type="button" className="icon-btn" onClick={() => setDarkMode((v) => !v)}>
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          <h2>{t('loginTitle')}</h2>
          <p>{t('loginHint')}</p>

          <label className="field-label">{t('password')}</label>
          <div className="password-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => handleEnter(e, onLogin)}
              placeholder={t('enterPassword')}
            />
            <button
              type="button"
              className="eye-btn"
              title={showPassword ? t('hidePassword') : t('showPassword')}
              onClick={() => setShowPassword((v) => !v)}
            >
              👁️
            </button>
          </div>

          <button type="button" className="primary-btn" onClick={onLogin}>
            {t('login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${darkMode ? 'dark' : ''}`}>
      <header className="main-header fade-in-up">
        <div className="header-left">
          <div className="logo-bolt">⚡</div>
          <div>
            <h1 className="brand-title">{t('appName')}</h1>
            <p className="hero-subtitle">{t('heroTitle')}</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="moving-select-wrap" title={t('language')}>
            <span>🌐</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="moving-select">
              <option value="en">{t('english')}</option>
              <option value="fa">{t('dari')}</option>
              <option value="ps">{t('pashto')}</option>
            </select>
          </div>

          <button type="button" className="icon-btn" title={t('theme')} onClick={() => setDarkMode((v) => !v)}>
            {darkMode ? '☀️' : '🌙'}
          </button>

          <button type="button" className="icon-btn" title={t('logout')} onClick={() => setIsLoggedIn(false)}>
            🚪
          </button>
        </div>
      </header>

      <main className="dashboard fade-in-up">
        <div className="category-row">
          <label>{t('category')}</label>
          <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="category-select">
            {categoryOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <section className="split-grid">
          <article className="meter-card">
            <h2>⚡ {t('kwToMoney')}</h2>
            <p className="hint">{t('sectionHelp')}</p>

            <div className="fields-grid">
              <label>
                {t('previousKw')}
                <input
                  type="number"
                  value={kwInputs.prevKw}
                  onChange={(e) => setKwInputs((s) => ({ ...s, prevKw: e.target.value }))}
                  placeholder={t('enterNumber')}
                />
              </label>
              <label>
                {t('currentKw')}
                <input
                  type="number"
                  value={kwInputs.currKw}
                  onChange={(e) => setKwInputs((s) => ({ ...s, currKw: e.target.value }))}
                  onKeyDown={(e) => handleEnter(e, calculateKwToMoney)}
                  placeholder={t('enterNumber')}
                />
              </label>
              <label>
                {t('previousMoney')}
                <input
                  type="number"
                  value={kwInputs.prevMoney}
                  onChange={(e) => setKwInputs((s) => ({ ...s, prevMoney: e.target.value }))}
                  placeholder={t('enterNumber')}
                />
              </label>
              <label>
                {t('currentMoney')}
                <input
                  type="number"
                  value={kwInputs.currMoney}
                  onChange={(e) => setKwInputs((s) => ({ ...s, currMoney: e.target.value }))}
                  onKeyDown={(e) => handleEnter(e, calculateKwToMoney)}
                  placeholder={t('enterNumber')}
                />
              </label>
            </div>

            <button type="button" className="primary-btn" onClick={calculateKwToMoney}>
              {t('calculate')}
            </button>

            {kwResult && (
              <div className="result-box">
                <h3>{t('result')}</h3>
                <p>{t('monthlyKw')}: <strong>{formatNumber(kwResult.monthlyKw)} kWh</strong></p>
                <p>{t('monthlyMoney')}: <strong>{formatNumber(kwResult.monthlyMoney)} AFN</strong></p>
                <p>{t('estimatedBill')}: <strong>{formatNumber(kwResult.estimatedBill)} AFN</strong></p>

                <h4>{t('tierTable')}</h4>
                <table>
                  <thead>
                    <tr>
                      <th>{t('tier')}</th>
                      <th>{t('usedKw')}</th>
                      <th>{t('rate')}</th>
                      <th>{t('cost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kwResult.breakdown.map((row, index) => (
                      <tr key={`kw-${index}`}>
                        <td>{row.tier}</td>
                        <td>{formatNumber(row.kw)}</td>
                        <td>{formatNumber(row.rate)}</td>
                        <td>{formatNumber(row.cost)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>{t('total')}</td>
                      <td>{formatNumber(kwResult.breakdown.reduce((s, r) => s + r.kw, 0))}</td>
                      <td>-</td>
                      <td>{formatNumber(kwResult.breakdown.reduce((s, r) => s + r.cost, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="meter-card">
            <h2>💰 {t('moneyToKw')}</h2>
            <p className="hint">{t('sectionHelp')}</p>

            <label>
              {t('amountAfn')}
              <input
                type="number"
                value={moneyInput}
                onChange={(e) => setMoneyInput(e.target.value)}
                onKeyDown={(e) => handleEnter(e, calculateMoneyToKw)}
                placeholder={t('enterNumber')}
              />
            </label>

            <button type="button" className="primary-btn" onClick={calculateMoneyToKw}>
              {t('calculate')}
            </button>

            {moneyResult && (
              <div className="result-box">
                <h3>{t('result')}</h3>
                <p>{t('convertedKw')}: <strong>{formatNumber(moneyResult.convertedKw)} kWh</strong></p>

                <h4>{t('tierTable')}</h4>
                <table>
                  <thead>
                    <tr>
                      <th>{t('tier')}</th>
                      <th>{t('moneyShare')}</th>
                      <th>{t('rate')}</th>
                      <th>{t('usedKw')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moneyResult.breakdown.map((row, index) => (
                      <tr key={`money-${index}`}>
                        <td>{row.tier}</td>
                        <td>{formatNumber(row.cost)}</td>
                        <td>{formatNumber(row.rate)}</td>
                        <td>{formatNumber(row.kw)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td>{t('total')}</td>
                      <td>{formatNumber(moneyResult.breakdown.reduce((s, r) => s + r.cost, 0))}</td>
                      <td>-</td>
                      <td>{formatNumber(moneyResult.breakdown.reduce((s, r) => s + r.kw, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      </main>

      <footer className="footer-note">{t('madeBy')}</footer>
    </div>
  );
}

export default App;
