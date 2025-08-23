import { initAvailableLocales, initI18n, getPrefferedLocale } from "browser-extension-i18n"
import messagesEn from "./en.js"
import messagesZh from "./zh-cn.js"
import messagesZhHk from "./zh-hk.js"
import messagesZhTw from "./zh-tw.js"
import messagesRu from "./ru.js"
import messagesKo from "./ko.js"
import messagesJa from "./ja.js"
import messagesFr from "./fr.js"
import messagesDe from "./de.js"
import messagesIt from "./it.js"
import messagesEs from "./es.js"
import messagesPt from "./pt.js"
import messagesVi from "./vi.js"

const localeMap = {
  en: messagesEn,
  "en-us": messagesEn,
  zh: messagesZh,
  "zh-cn": messagesZh,
  "zh-hk": messagesZhHk,
  "zh-tw": messagesZhTw,
  ru: messagesRu,
  "ru-ru": messagesRu,
  ko: messagesKo,
  "ko-kr": messagesKo,
  ja: messagesJa,
  "ja-jp": messagesJa,
  fr: messagesFr,
  "fr-fr": messagesFr,
  de: messagesDe,
  "de-de": messagesDe,
  it: messagesIt,
  "it-it": messagesIt,
  es: messagesEs,
  "es-es": messagesEs,
  pt: messagesPt,
  "pt-pt": messagesPt,
  "pt-br": messagesPt,
  vi: messagesVi,
  "vi-vn": messagesVi,
}

// Language display names for each locale code
export const localeNames = {
  en: "English",
  "en-us": "English (US)",
  zh: "中文",
  "zh-cn": "中文 (简体)",
  "zh-hk": "中文 (香港)",
  "zh-tw": "中文 (台灣)",
  ru: "Русский",
  "ru-ru": "Русский",
  ko: "한국어",
  "ko-kr": "한국어",
  ja: "日本語",
  "ja-jp": "日本語",
  fr: "Français",
  "fr-fr": "Français",
  de: "Deutsch",
  "de-de": "Deutsch",
  it: "Italiano",
  "it-it": "Italiano",
  es: "Español",
  "es-es": "Español",
  pt: "Português",
  "pt-pt": "Português",
  "pt-br": "Português (Brasil)",
  vi: "Tiếng Việt",
  "vi-vn": "Tiếng Việt",
}

const locales = Object.keys(localeMap)

initAvailableLocales(locales)

console.log("[settings] prefferedLocale:", getPrefferedLocale())
// eslint-disable-next-line import/no-mutable-exports
export let i = initI18n(localeMap, getPrefferedLocale())

export function resetI18n(locale?: string) {
  console.log("[settings] prefferedLocale:", getPrefferedLocale(), "locale:", locale)
  i = initI18n(localeMap, locale || getPrefferedLocale())
}
