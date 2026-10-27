"use client";

import * as React from "react";

export type Locale = "en" | "bn";

export const COOKIE_NAME = "agri_locale";
export const DEFAULT_LOCALE: Locale = "bn";

export const UI_DICTIONARY = {
  // Brand & Shell
  "app.title": {
    en: "Agri-Koushol",
    bn: "কৃষি কৌশল",
  },
  "app.subtitle": {
    en: "Autonomous AI Farm",
    bn: "স্বায়ত্তশাসিত এআই খামার",
  },

  // Navigation
  "nav.dashboard": {
    en: "Dashboard",
    bn: "ড্যাশবোর্ড",
  },
  "nav.fields": {
    en: "Fields",
    bn: "মাঠ ও ফসল",
  },
  "nav.alerts": {
    en: "Alerts",
    bn: "সতর্কবার্তা",
  },
  "nav.yieldmax": {
    en: "YieldMax",
    bn: "ফলন অপ্টিমাইজার",
  },
  "nav.settings": {
    en: "Settings",
    bn: "সেটিংস",
  },
  "nav.mainNavigation": {
    en: "Main Navigation",
    bn: "মূল নেভিগেশন",
  },
  "nav.safetyPolicy": {
    en: "AI Crop Safety Policy",
    bn: "AI ফসল সুরক্ষা নীতি",
  },
  "nav.safetyText": {
    en: "Spraying pauses automatically when rain probability > 50%.",
    bn: "বৃষ্টির সম্ভাবনা > ৫০% হলে স্প্রে স্বয়ংক্রিয়ভাবে স্থগিত থাকে।",
  },

  // Top Bar
  "topbar.farmerName": {
    en: "Md. Rafiqul Islam",
    bn: "মোঃ রফিকুল ইসলাম",
  },
  "topbar.farmerTitle": {
    en: "(Rafiqul Islam)",
    bn: "(রফিকুল ইসলাম)",
  },
  "topbar.farmerLocation": {
    en: "Mymensingh Farm #4 • Rice & Mustard",
    bn: "ময়মনসিংহ খামার #৪ • ধান ও সরিষা",
  },
  "topbar.unreadAlerts": {
    en: "unread farm alerts",
    bn: "টি অপঠিত সতর্কতা",
  },
  "topbar.alerts": {
    en: "Farm alerts",
    bn: "খামার সতর্কতা",
  },

  // Common UI
  "common.simulated": {
    en: "Simulated",
    bn: "সিমুলেটেড",
  },
  "common.precision": {
    en: "Precision",
    bn: "প্রিসিশন",
  },
  "common.save": {
    en: "Save",
    bn: "সংরক্ষণ করুন",
  },
  "common.cancel": {
    en: "Cancel",
    bn: "বাতিল",
  },
  "common.reset": {
    en: "Reset",
    bn: "রিসেট",
  },
  "common.all": {
    en: "All",
    bn: "সকল",
  },
  "common.loading": {
    en: "Loading...",
    bn: "লোড হচ্ছে...",
  },
  "common.status": {
    en: "Status",
    bn: "অবস্থা",
  },
  "common.unread": {
    en: "Unread",
    bn: "অপঠিত",
  },
  "common.read": {
    en: "Read",
    bn: "পঠিত",
  },
  "common.active": {
    en: "Active",
    bn: "সক্রিয়",
  },
  "common.inspect": {
    en: "Inspect",
    bn: "পরিদর্শন",
  },
  "common.healthy": {
    en: "Healthy",
    bn: "সুস্থ",
  },

  // KPI Cards
  "kpi.waterSaved": {
    en: "Water Saved",
    bn: "পানি সাশ্রয়",
  },
  "kpi.waterUnit": {
    en: "Liters",
    bn: "লিটার",
  },
  "kpi.waterSub": {
    en: "Irrigation optimization",
    bn: "সেচ অপ্টিমাইজেশন",
  },
  "kpi.chemicalsSaved": {
    en: "Chemicals Saved",
    bn: "কীটনাশক হ্রাস",
  },
  "kpi.chemicalsSpot": {
    en: "15m spot",
    bn: "১৫মি. স্পট",
  },
  "kpi.chemicalsSub": {
    en: "Drone spot spray vs blanket",
    bn: "ড্রোন প্রিসিশন স্প্রে বনাম ব্ল্যাঙ্কেট",
  },
  "kpi.activeAlerts": {
    en: "Active Alerts",
    bn: "সক্রিয় সতর্কতা",
  },
  "kpi.alertsUnit": {
    en: "active",
    bn: "টি সক্রিয়",
  },
  "kpi.alertsCritical": {
    en: "1 urgent",
    bn: "১টি জরুরি",
  },
  "kpi.alertsSub": {
    en: "Blight warning & moisture deficit",
    bn: "আলুর নাবী ধসা রোগ ও আর্দ্রতা ঘাটতি",
  },
  "kpi.predictedYield": {
    en: "Predicted Yield",
    bn: "প্রত্যাশিত ফলন",
  },
  "kpi.yieldUnit": {
    en: "tons/ha",
    bn: "টন/হেক্টর",
  },
  "kpi.yieldSub": {
    en: "Agronomic model forecast",
    bn: "কৃষিতত্ত্ব মডেল ভিত্তিক পূর্বাভাস",
  },

  // Forecast Strip
  "forecast.title": {
    en: "48-Hour Field Forecast",
    bn: "৪৮ ঘণ্টার আবহাওয়া পূর্বাভাস",
  },
  "forecast.rainRisk": {
    en: "Rain Risk (6h)",
    bn: "বৃষ্টির ঝুঁকি (৬ ঘণ্টা)",
  },
  "forecast.expectedRain": {
    en: "Expected Rain",
    bn: "বৃষ্টির পরিমাণ",
  },
  "forecast.maxTemp": {
    en: "Max Temp",
    bn: "সর্বোচ্চ তাপমাত্রা",
  },
  "forecast.nextDryWindow": {
    en: "Next Dry Window",
    bn: "পরবর্তী শুষ্ক সময়",
  },

  // Live Alert Feed
  "feed.title": {
    en: "Live Field Alert Feed",
    bn: "সরাসরি মাঠের সতর্কতা ফিড",
  },
  "feed.subtitle": {
    en: "Autonomous real-time monitoring",
    bn: "স্বয়ংক্রিয় রিয়েল-টাইম পর্যবেক্ষণ",
  },
  "feed.allSafe": {
    en: "No active alerts. All fields healthy and secure.",
    bn: "সবগুলো খামার জোন স্বাভাবিক ও নিরাপদ অবস্থায় রয়েছে।",
  },
  "feed.viewAll": {
    en: "View all alerts",
    bn: "সকল সতর্কতা দেখুন",
  },

  // Alerts Page
  "alerts.title": {
    en: "Farm Alerts & Safety Oversight",
    bn: "খামার সতর্কতা ও নিরাপত্তা তদারকি",
  },
  "alerts.subtitle": {
    en: "Monitor autonomous AI decisions, override treatments, and track notifications.",
    bn: "এআই সিদ্ধান্ত তদারকি করুন, অ্যাকশন পরিবর্তন করুন এবং নোটিফিকেশন দেখুন।",
  },
  "alerts.markAllRead": {
    en: "Mark all as read",
    bn: "সব পড়া চিহ্নিত করুন",
  },
  "alerts.searchPlaceholder": {
    en: "Search alerts, crop, or reasoning...",
    bn: "সতর্কতা, ফসল বা কারণ খুঁজুন...",
  },
  "alerts.filter": {
    en: "Filter:",
    bn: "ফিল্টার:",
  },
  "alerts.allSeverity": {
    en: "All Severity",
    bn: "সকল তীব্রতা",
  },
  "alerts.allFields": {
    en: "All Fields",
    bn: "সকল জমি",
  },
  "alerts.allSources": {
    en: "All Sources",
    bn: "সকল উৎস",
  },
  "alerts.unreadOnly": {
    en: "Unread only",
    bn: "শুধুমাত্র অপঠিত",
  },
  "alerts.noAlerts": {
    en: "No alerts match your filter criteria.",
    bn: "আপনার নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো সতর্কতা খুঁজে পাওয়া যায়নি।",
  },
  "alerts.resetFilters": {
    en: "Reset filters",
    bn: "ফিল্টার রিসেট করুন",
  },
  "alerts.simulatedBanner": {
    en: "Simulated action - no real equipment was triggered",
    bn: "সিমুলেটেড অ্যাকশন - কোনো বাস্তব যন্ত্র চালিত হয়নি",
  },
  "alerts.overrideAction": {
    en: "Override Action",
    bn: "অ্যাকশন পরিবর্তন",
  },
  "alerts.cancelAction": {
    en: "Cancel Action",
    bn: "অ্যাকশন বাতিল করুন",
  },
  "alerts.reschedule": {
    en: "Reschedule Action",
    bn: "সময় পরিবর্তন করুন",
  },
  "alerts.aiReasoning": {
    en: "AI Agronomic Reasoning",
    bn: "এআই সিদ্ধান্ত গ্রহণের কারণ",
  },
  "alerts.whatsappStatus": {
    en: "WhatsApp Delivery",
    bn: "হোয়াটসঅ্যাপ ডেলিভারি",
  },

  // Field Pages
  "fields.title": {
    en: "Cultivated Fields",
    bn: "চাষাবাদকৃত জমি ও ফসল",
  },
  "fields.subtitle": {
    en: "Sensor telemetry, growth stages, disease detection, and autonomous decisions.",
    bn: "সেন্সর তথ্য, বৃদ্ধির ধাপ, রোগ শনাক্তকরণ এবং স্বয়ংক্রিয় সেচ ব্যবস্থা।",
  },
  "fields.growthStage": {
    en: "Growth Stage",
    bn: "বৃদ্ধির ধাপ",
  },
  "fields.area": {
    en: "Area",
    bn: "জমির পরিমাণ",
  },
  "fields.soilMoisture": {
    en: "Soil Moisture",
    bn: "মাটির আর্দ্রতা",
  },
  "fields.threshold": {
    en: "Threshold",
    bn: "সেচ সীমা",
  },
  "fields.askShoshsho": {
    en: "Ask শস্য-প্রহরী about this field",
    bn: "এই জমি সম্পর্কে শস্য-প্রহরীকে জিজ্ঞাসা করুন",
  },
  "fields.simulateDrone": {
    en: "Simulate Drone Scan",
    bn: "ড্রোন স্ক্যান সিমুলেট",
  },
  "fields.tabCharts": {
    en: "Soil & Climate Charts",
    bn: "আর্দ্রতা ও আবহাওয়া চার্ট",
  },
  "fields.tabSensors": {
    en: "Sensor Telemetry",
    bn: "সেন্সর তথ্য",
  },
  "fields.tabDetections": {
    en: "Detections",
    bn: "রোগ শনাক্তকরণ",
  },
  "fields.tabDecisions": {
    en: "Decision Timeline",
    bn: "সিদ্ধান্তের ইতিহাস",
  },

  // Chatbot
  "chat.title": {
    en: "Shoshsho-Prohori",
    bn: "শস্য-প্রহরী",
  },
  "chat.subtitle": {
    en: "Autonomous Agricultural Copilot",
    bn: "স্বায়ত্তশাসিত খামার সহকারী",
  },
  "chat.online": {
    en: "Online",
    bn: "সক্রিয়",
  },
  "chat.allFields": {
    en: "All Fields",
    bn: "সকল জমি",
  },
  "chat.clear": {
    en: "Clear chat",
    bn: "চ্যাট মুছুন",
  },
  "chat.inputPlaceholder": {
    en: "Ask anything about fields, blight, weather, or irrigation...",
    bn: "জমি, রোগবালাই, আবহাওয়া বা সেচ সংক্রান্ত প্রশ্ন জিজ্ঞাসা করুন...",
  },
  "chat.proactiveBadge": {
    en: "Proactive Alert",
    bn: "স্বয়ংক্রিয় সতর্কবার্তা",
  },
  "chat.toolsUsed": {
    en: "Tools used",
    bn: "ব্যবহৃত টুলস",
  },
  "chat.quick1": {
    en: "Should I irrigate Field A today?",
    bn: "আজ কি মাঠ ১-এ সেচ দেওয়া প্রয়োজন?",
  },
  "chat.quick2": {
    en: "Field D status & Late Blight risk",
    bn: "মাঠ ৪-এর অবস্থা ও নাবি ধসার ঝুঁকি কেমন?",
  },
  "chat.quick3": {
    en: "Weather forecast for next 48h",
    bn: "আগামী ৪৮ ঘণ্টার আবহাওয়া পূর্বাভাস কেমন?",
  },

  // YieldMax
  "yield.title": {
    en: "YieldMax Agronomic Engine",
    bn: "ফলন অপ্টিমাইজার (YieldMax)",
  },
  "yield.subtitle": {
    en: "Autonomous predictive harvest forecasting based on growth stages, disease penalties, and weather stress.",
    bn: "বৃদ্ধির ধাপ, রোগবালাই ঝুঁকি এবং আবহাওয়া চাপের ওপর ভিত্তি করে স্বয়ংক্রিয় ফলন পূর্বাভাস।",
  },
  "yield.projectedEstimate": {
    en: "Projected Estimate",
    bn: "প্রত্যাশিত প্রাক্কলন",
  },
  "yield.untreatedSlider": {
    en: "What-If: Disease untreated duration",
    bn: "যদি রোগবালাই চিকিৎসা ছাড়া চলমান থাকে",
  },
  "yield.days": {
    en: "days",
    bn: "দিন",
  },

  // Settings
  "settings.title": {
    en: "Demo Control Panel & Settings",
    bn: "ডেমো কন্ট্রোল প্যানেল ও সেটিংস",
  },
  "settings.subtitle": {
    en: "Control simulation scenarios, inspect MCP & n8n connectivity, and manage AI safeguards.",
    bn: "সিমুলেশন পরিস্থিতি নিয়ন্ত্রণ করুন, এমসিপি ও n8n সংযোগ পরীক্ষা করুন এবং এআই সুরক্ষা নীতি পরিচালনা করুন।",
  },
} as const;

export type TranslationKey = keyof typeof UI_DICTIONARY;

/**
 * Pure translation lookup with fallback
 */
export function t(key: TranslationKey, locale: Locale): string {
  const entry = UI_DICTIONARY[key];
  if (!entry) return key;
  return entry[locale] || entry.en || key;
}

/**
 * Helper to get initial locale from cookie in browser
 */
export function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const cookies = document.cookie.split(";");
  for (const c of cookies) {
    const [name, val] = c.trim().split("=");
    if (name === COOKIE_NAME && (val === "en" || val === "bn")) {
      return val as Locale;
    }
  }

  const stored = localStorage.getItem(COOKIE_NAME);
  if (stored === "en" || stored === "bn") return stored;

  return DEFAULT_LOCALE;
}

/**
 * Helper to persist locale to cookie and localStorage
 */
export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;

  // Persist to cookie (1 year expiry)
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  localStorage.setItem(COOKIE_NAME, locale);

  // Set document attributes for CSS typography styling
  document.documentElement.lang = locale;
  document.documentElement.dataset.locale = locale;

  // Notify all listening components
  window.dispatchEvent(new CustomEvent("agri_locale_change", { detail: { locale } }));
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
  isBangla: boolean;
}

const I18nContext = React.createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(() => getInitialLocale());

  React.useEffect(() => {
    // Sync document attributes on mount
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;

    const handleLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ locale: Locale }>;
      if (customEvent.detail?.locale) {
        setLocaleState(customEvent.detail.locale);
      }
    };

    window.addEventListener("agri_locale_change", handleLocaleChange);
    return () => window.removeEventListener("agri_locale_change", handleLocaleChange);
  }, [locale]);

  const setLocale = React.useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
  }, []);

  const toggleLocale = React.useCallback(() => {
    const next = locale === "bn" ? "en" : "bn";
    setLocale(next);
  }, [locale, setLocale]);

  const translate = React.useCallback(
    (key: TranslationKey) => t(key, locale),
    [locale]
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t: translate,
      isBangla: locale === "bn",
    }),
    [locale, setLocale, toggleLocale, translate]
  );

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    // Safe fallback if used outside provider
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      toggleLocale: () => {},
      t: (key) => t(key, DEFAULT_LOCALE),
      isBangla: DEFAULT_LOCALE === "bn",
    };
  }
  return ctx;
}
