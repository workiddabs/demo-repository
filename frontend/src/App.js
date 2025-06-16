import React, { useState, useEffect } from 'react';
import './App.css';

// Translations object with manual translations
const translations = {
  en: {
    title: "Electricity Meter Calculator",
    login: "Login",
    password: "Password",
    enterPassword: "Enter password",
    loginButton: "Login",
    invalidPassword: "Invalid password",
    kwToMoney: "Kilowatts to Money",
    moneyToKw: "Money to Kilowatts", 
    residential: "Residential",
    commercial: "Commercial",
    factory: "Registered Factory",
    previousReading: "Previous Reading",
    currentReading: "Current Reading",
    enterKw: "Enter kW",
    enterMoney: "Enter Money (AFN)",
    calculate: "Calculate",
    consumption: "Monthly Consumption",
    totalCost: "Total Cost",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    language: "Language",
    english: "English",
    dari: "دری",
    pashto: "پښتو",
    results: "Results",
    breakdown: "Price Breakdown",
    tier: "Tier",
    rate: "Rate",
    amount: "Amount",
    cost: "Cost",
    history: "Consumption History",
    clear: "Clear History",
    export: "Export Data",
    settings: "Settings",
    resetCalculator: "Reset Calculator"
  },
  fa: {
    title: "محاسبه گر میتر برق",
    login: "ورود",
    password: "رمز عبور",
    enterPassword: "رمز عبور را وارد کنید",
    loginButton: "ورود",
    invalidPassword: "رمز عبور نامعتبر",
    kwToMoney: "کیلووات به پول",
    moneyToKw: "پول به کیلووات",
    residential: "مسکونی",
    commercial: "تجاری",
    factory: "کارخانه ثبت شده",
    previousReading: "قرائت قبلی",
    currentReading: "قرائت فعلی",
    enterKw: "کیلووات وارد کنید",
    enterMoney: "پول وارد کنید (افغانی)",
    calculate: "محاسبه",
    consumption: "مصرف ماهانه",
    totalCost: "کل هزینه",
    darkMode: "حالت تاریک",
    lightMode: "حالت روشن",
    language: "زبان",
    english: "انگلیسی",
    dari: "دری",
    pashto: "پښتو",
    results: "نتایج",
    breakdown: "تفکیک قیمت",
    tier: "سطح",
    rate: "نرخ",
    amount: "مقدار",
    cost: "هزینه",
    history: "تاریخچه مصرف",
    clear: "پاک کردن تاریخچه",
    export: "صادرات داده ها",
    settings: "تنظیمات",
    resetCalculator: "بازنشانی محاسبه گر"
  },
  ps: {
    title: "د بریښنا میټر محاسبه کونکی",
    login: "ننوتل",
    password: "پټ نوم",
    enterPassword: "پټ نوم ولیکئ",
    loginButton: "ننوتل",
    invalidPassword: "غلط پټ نوم",
    kwToMoney: "کیلووات څخه پیسو ته",
    moneyToKw: "پیسې څخه کیلووات ته",
    residential: "استوګنې",
    commercial: "سوداګریز",
    factory: "راجسټر شوې فابریکه",
    previousReading: "پخوانی لوستل",
    currentReading: "اوسنی لوستل",
    enterKw: "کیلووات ولیکئ",
    enterMoney: "پیسې ولیکئ (افغانۍ)",
    calculate: "محاسبه",
    consumption: "میاشتنی مصرف",
    totalCost: "ټول لګښت",
    darkMode: "تیاره حالت",
    lightMode: "رڼا حالت",
    language: "ژبه",
    english: "انګلیسي",
    dari: "دري",
    pashto: "پښتو",
    results: "پایلې",
    breakdown: "د نرخ توپیر",
    tier: "کچه",
    rate: "نرخ",
    amount: "اندازه",
    cost: "لګښت",
    history: "د مصرف تاریخ",
    clear: "تاریخ پاک کول",
    export: "معلومات صادرول",
    settings: "تنظیمات",
    resetCalculator: "محاسبه کونکی بیا پیل"
  }
};

// Rate configurations
const rates = {
  residential: [
    { min: 1, max: 200, rate: 2.19 },
    { min: 201, max: 400, rate: 5.63 },
    { min: 401, max: 700, rate: 8.13 },
    { min: 701, max: 2000, rate: 11.25 },
    { min: 2001, max: Infinity, rate: 12.5 }
  ],
  commercial: { rate: 16.25 },
  factory: { rate: 6.75 }
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [currentType, setCurrentType] = useState('residential');
  
  // Calculator states
  const [kwToMoneyData, setKwToMoneyData] = useState({
    previousReading: '',
    currentReading: '',
    result: null,
    breakdown: []
  });
  
  const [moneyToKwData, setMoneyToKwData] = useState({
    amount: '',
    result: null
  });
  
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedData = localStorage.getItem('electricityMeterData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setDarkMode(data.darkMode || false);
      setLanguage(data.language || 'en');
      setHistory(data.history || []);
    }
  }, []);

  const saveToLocalStorage = () => {
    const data = {
      darkMode,
      language,
      history
    };
    localStorage.setItem('electricityMeterData', JSON.stringify(data));
  };

  const t = (key) => translations[language][key] || key;

  const handleLogin = () => {
    if (password === '1236') {
      setIsLoggedIn(true);
      setPassword('');
    } else {
      alert(t('invalidPassword'));
    }
  };

  const calculateResidentialCost = (kw) => {
    let totalCost = 0;
    let remainingKw = kw;
    const breakdown = [];

    for (const tier of rates.residential) {
      if (remainingKw <= 0) break;
      
      const tierUsage = Math.min(remainingKw, tier.max - tier.min + 1);
      if (tierUsage > 0) {
        const tierCost = tierUsage * tier.rate;
        totalCost += tierCost;
        breakdown.push({
          tier: `${tier.min}-${tier.max === Infinity ? '∞' : tier.max}`,
          usage: tierUsage,
          rate: tier.rate,
          cost: tierCost
        });
        remainingKw -= tierUsage;
      }
    }

    return { totalCost, breakdown };
  };

  const calculateCommercialCost = (kw) => {
    const totalCost = kw * rates.commercial.rate;
    return { 
      totalCost, 
      breakdown: [{ 
        tier: '0-∞', 
        usage: kw, 
        rate: rates.commercial.rate, 
        cost: totalCost 
      }] 
    };
  };

  const calculateFactoryCost = (kw) => {
    const totalCost = kw * rates.factory.rate;
    return { 
      totalCost, 
      breakdown: [{ 
        tier: '0-∞', 
        usage: kw, 
        rate: rates.factory.rate, 
        cost: totalCost 
      }] 
    };
  };

  const calculateKwToMoney = () => {
    const prevReading = parseFloat(kwToMoneyData.previousReading) || 0;
    const currReading = parseFloat(kwToMoneyData.currentReading) || 0;
    const consumption = currReading - prevReading;

    if (consumption <= 0) {
      alert('Current reading must be greater than previous reading');
      return;
    }

    let result;
    switch (currentType) {
      case 'residential':
        result = calculateResidentialCost(consumption);
        break;
      case 'commercial':
        result = calculateCommercialCost(consumption);
        break;
      case 'factory':
        result = calculateFactoryCost(consumption);
        break;
      default:
        return;
    }

    const calculationResult = {
      consumption,
      totalCost: result.totalCost,
      breakdown: result.breakdown,
      type: currentType,
      timestamp: new Date().toISOString()
    };

    setKwToMoneyData({
      ...kwToMoneyData,
      result: calculationResult
    });

    // Add to history
    const newHistory = [...history, calculationResult];
    setHistory(newHistory);
    saveToLocalStorage();
  };

  const calculateMoneyToKw = () => {
    const amount = parseFloat(moneyToKwData.amount) || 0;
    if (amount <= 0) return;

    let totalKw = 0;

    switch (currentType) {
      case 'residential':
        let remainingAmount = amount;
        for (const tier of rates.residential) {
          if (remainingAmount <= 0) break;
          
          const tierRange = tier.max === Infinity ? Infinity : tier.max - tier.min + 1;
          const maxTierCost = tierRange === Infinity ? Infinity : tierRange * tier.rate;
          
          if (remainingAmount >= maxTierCost && tierRange !== Infinity) {
            totalKw += tierRange;
            remainingAmount -= maxTierCost;
          } else {
            totalKw += remainingAmount / tier.rate;
            break;
          }
        }
        break;
      case 'commercial':
        totalKw = amount / rates.commercial.rate;
        break;
      case 'factory':
        totalKw = amount / rates.factory.rate;
        break;
    }

    setMoneyToKwData({
      ...moneyToKwData,
      result: { totalKw: Math.round(totalKw * 100) / 100 }
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('electricityMeterData');
  };

  const resetCalculator = () => {
    setKwToMoneyData({ previousReading: '', currentReading: '', result: null, breakdown: [] });
    setMoneyToKwData({ amount: '', result: null });
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`p-8 rounded-lg shadow-lg w-96 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
          <h1 className="text-2xl font-bold text-center mb-6">{t('login')}</h1>
          <div className="space-y-4">
            <input
              type="password"
              placeholder={t('enterPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleLogin)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t('loginButton')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-4`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          
          <div className="flex flex-wrap items-center space-x-4">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`p-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="en">{t('english')}</option>
              <option value="fa">{t('dari')}</option>
              <option value="ps">{t('pashto')}</option>
            </select>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${
                darkMode ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white'
              }`}
            >
              {darkMode ? t('lightMode') : t('darkMode')}
            </button>

            {/* Category Selector */}
            <select
              value={currentType}
              onChange={(e) => setCurrentType(e.target.value)}
              className={`p-2 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            >
              <option value="residential">{t('residential')}</option>
              <option value="commercial">{t('commercial')}</option>
              <option value="factory">{t('factory')}</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* KW to Money Calculator */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <h2 className="text-xl font-bold mb-4">{t('kwToMoney')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('previousReading')}</label>
                <input
                  type="number"
                  value={kwToMoneyData.previousReading}
                  onChange={(e) => setKwToMoneyData({...kwToMoneyData, previousReading: e.target.value})}
                  placeholder={t('enterKw')}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('currentReading')}</label>
                <input
                  type="number"
                  value={kwToMoneyData.currentReading}
                  onChange={(e) => setKwToMoneyData({...kwToMoneyData, currentReading: e.target.value})}
                  onKeyPress={(e) => handleKeyPress(e, calculateKwToMoney)}
                  placeholder={t('enterKw')}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              
              <button
                onClick={calculateKwToMoney}
                className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                {t('calculate')}
              </button>
              
              {kwToMoneyData.result && (
                <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className="font-bold text-lg mb-2">{t('results')}</h3>
                  <p><span className="font-medium">{t('consumption')}:</span> {kwToMoneyData.result.consumption} kW</p>
                  <p><span className="font-medium">{t('totalCost')}:</span> {kwToMoneyData.result.totalCost.toFixed(2)} AFN</p>
                  
                  <div className="mt-4">
                    <h4 className="font-bold mb-2">{t('breakdown')}</h4>
                    <div className="space-y-1">
                      {kwToMoneyData.result.breakdown.map((item, index) => (
                        <div key={index} className="text-sm">
                          <span>{t('tier')} {item.tier}: {item.usage.toFixed(2)} kW × {item.rate} AFN = {item.cost.toFixed(2)} AFN</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Money to KW Calculator */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <h2 className="text-xl font-bold mb-4">{t('moneyToKw')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('amount')}</label>
                <input
                  type="number"
                  value={moneyToKwData.amount}
                  onChange={(e) => setMoneyToKwData({...moneyToKwData, amount: e.target.value})}
                  onKeyPress={(e) => handleKeyPress(e, calculateMoneyToKw)}
                  placeholder={t('enterMoney')}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              
              <button
                onClick={calculateMoneyToKw}
                className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('calculate')}
              </button>
              
              {moneyToKwData.result && (
                <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className="font-bold text-lg mb-2">{t('results')}</h3>
                  <p><span className="font-medium">Kilowatts:</span> {moneyToKwData.result.totalKw} kW</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className={`mt-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('history')}</h2>
              <div className="space-x-2">
                <button
                  onClick={resetCalculator}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  {t('resetCalculator')}
                </button>
                <button
                  onClick={clearHistory}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t('clear')}
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Consumption (kW)</th>
                    <th className="p-2 text-left">Cost (AFN)</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(-10).reverse().map((record, index) => (
                    <tr key={index} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <td className="p-2">{new Date(record.timestamp).toLocaleDateString()}</td>
                      <td className="p-2 capitalize">{record.type}</td>
                      <td className="p-2">{record.consumption}</td>
                      <td className="p-2">{record.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;