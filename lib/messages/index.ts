import { initAvailableLocales, initI18n, extractLocaleFromNavigator } from "browser-extension-i18n"
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
  "en-US": messagesEn,
  zh: messagesZh,
  "zh-CN": messagesZh,
  "zh-HK": messagesZhHk,
  "zh-TW": messagesZhTw,
  ru: messagesRu,
  "ru-RU": messagesRu,
  ko: messagesKo,
  "ko-KR": messagesKo,
  ja: messagesJa,
  "ja-JP": messagesJa,
  fr: messagesFr,
  "fr-FR": messagesFr,
  de: messagesDe,
  "de-DE": messagesDe,
  it: messagesIt,
  "it-IT": messagesIt,
  es: messagesEs,
  "es-ES": messagesEs,
  pt: messagesPt,
  "pt-PT": messagesPt,
  "pt-BR": messagesPt,
  vi: messagesVi,
  "vi-VN": messagesVi,
}

const locales = Object.keys(localeMap)

initAvailableLocales(locales)

export const prefferedLocale = extractLocaleFromNavigator() || "en"

// eslint-disable-next-line import/no-mutable-exports
export let i = initI18n(localeMap, prefferedLocale)

export function resetI18n(locale?: string) {
  i = initI18n(localeMap, locale || prefferedLocale)
}
