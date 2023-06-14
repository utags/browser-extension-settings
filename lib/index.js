export const doc = document

export const win = window

export const uniq = (array) => [...new Set(array)]

export const toCamelCase = function (text) {
  return text.replace(/^([A-Z])|[\s-_](\w)/g, function (match, p1, p2) {
    if (p2) return p2.toUpperCase()
    return p1.toLowerCase()
  })
}

export const $ = (selectors, element) =>
  (element || doc).querySelector(selectors)
export const $$ = (selectors, element) => [
  ...(element || doc).querySelectorAll(selectors),
]
export const querySelector = $
export const querySelectorAll = $$

export const createElement = (tagName, attributes) =>
  setAttributes(doc.createElement(tagName), attributes)

export const addElement = (parentNode, tagName, attributes) => {
  if (!parentNode) {
    return
  }

  if (typeof parentNode === "string") {
    attributes = tagName
    tagName = parentNode
    parentNode = doc.head
  }

  if (typeof tagName === "string") {
    const element = createElement(tagName, attributes)
    parentNode.append(element)
    return element
  }

  // tagName: HTMLElement
  setAttributes(tagName, attributes)
  parentNode.append(tagName)
  return tagName
}

export const addStyle = (styleText) => {
  const element = createElement("style", { textContent: styleText })
  doc.head.append(element)
  return element
}

export const addEventListener = (element, type, listener, options) => {
  if (!element) {
    return
  }

  if (typeof type === "object") {
    for (const type1 in type) {
      if (Object.hasOwn(type, type1)) {
        element.addEventListener(type1, type[type1])
      }
    }
  } else if (typeof type === "string" && typeof listener === "function") {
    element.addEventListener(type, listener, options)
  }
}

export const removeEventListener = (element, type, listener, options) => {
  if (!element) {
    return
  }

  if (typeof type === "object") {
    for (const type1 in type) {
      if (Object.hasOwn(type, type1)) {
        element.removeEventListener(type1, type[type1])
      }
    }
  } else if (typeof type === "string" && typeof listener === "function") {
    element.removeEventListener(type, listener, options)
  }
}

export const getAttribute = (element, name) =>
  element ? element.getAttribute(name) : null
export const setAttribute = (element, name, value) =>
  element ? element.setAttribute(name, value) : undefined

export const setAttributes = (element, attributes) => {
  if (element && attributes) {
    for (const name in attributes) {
      if (Object.hasOwn(attributes, name)) {
        const value = attributes[name]
        if (value === undefined) {
          continue
        }

        if (/^(value|textContent|innerText|innerHTML)$/.test(name)) {
          element[name] = value
        } else if (name === "style") {
          setStyle(element, value, true)
        } else if (/on\w+/.test(name)) {
          const type = name.slice(2)
          addEventListener(element, type, value)
        } else {
          setAttribute(element, name, value)
        }
      }
    }
  }

  return element
}

export const addAttribute = (element, name, value) => {
  const orgValue = getAttribute(element, name)
  if (!orgValue) {
    setAttribute(element, name, value)
  } else if (!orgValue.includes(value)) {
    setAttribute(element, name, orgValue + " " + value)
  }
}

export const addClass = (element, className) => {
  if (!element || !element.classList) {
    return
  }

  element.classList.add(className)
}

export const removeClass = (element, className) => {
  if (!element || !element.classList) {
    return
  }

  element.classList.remove(className)
}

export const hasClass = (element, className) => {
  if (!element || !element.classList) {
    return false
  }

  return element.classList.contains(className)
}

export const setStyle = (element, values, overwrite) => {
  if (!element) {
    return
  }

  // element.setAttribute("style", value) -> Fail when violates CSP
  const style = element.style

  if (typeof values === "string") {
    style.cssText = overwrite ? values : style.cssText + ";" + values
    return
  }

  if (overwrite) {
    style.cssText = ""
  }

  for (const key in values) {
    if (Object.hasOwn(values, key)) {
      style[key] = values[key].replace("!important", "")
    }
  }
}

// convert `font-size: 12px; color: red` to `{"fontSize": "12px"; "color": "red"}`
// eslint-disable-next-line no-unused-vars
const toStyleKeyValues = (styleText) => {
  const result = {}
  const keyValues = styleText.split(/\s*;\s*/)
  for (const keyValue of keyValues) {
    const kv = keyValue.split(/\s*:\s*/)
    // TODO: fix when key is such as -webkit-xxx
    const key = toCamelCase(kv[0])
    if (key) {
      result[key] = kv[1]
    }
  }

  return result
}

export const toStyleMap = (styleText) => {
  styleText = noStyleSpace(styleText)
  const map = {}
  const keyValues = styleText.split("}")
  for (const keyValue of keyValues) {
    const kv = keyValue.split("{")
    if (kv[0] && kv[1]) {
      map[kv[0]] = kv[1]
    }
  }

  return map
}

export const noStyleSpace = (text) => text.replace(/\s*([^\w-+%!])\s*/gm, "$1")

export const createSetStyle = (styleText) => {
  const styleMap = toStyleMap(styleText)
  return (element, value, overwrite) => {
    if (typeof value === "object") {
      setStyle(element, value, overwrite)
    } else if (typeof value === "string") {
      const key = noStyleSpace(value)
      const value2 = styleMap[key]
      setStyle(element, value2 || value, overwrite)
    }
  }
}

export const isUrl = (text) => /^https?:\/\//.test(text)

/**
 *
 * @param { function } func
 * @param { number } interval
 * @returns
 */
export const throttle = (func, interval) => {
  let timeoutId = null
  let next = false
  const handler = (...args) => {
    if (timeoutId) {
      next = true
    } else {
      func.apply(this, args)
      timeoutId = setTimeout(() => {
        timeoutId = null
        if (next) {
          next = false
          handler()
        }
      }, interval)
    }
  }

  return handler
}

if (typeof Object.hasOwn !== "function") {
  Object.hasOwn = (instance, prop) =>
    Object.prototype.hasOwnProperty.call(instance, prop)
}

export const registerMenuCommand = () => undefined

export const extendHistoryApi = () => {
  // https://dirask.com/posts/JavaScript-on-location-changed-event-on-url-changed-event-DKeyZj
  const pushState = history.pushState
  const replaceState = history.replaceState

  history.pushState = function () {
    // eslint-disable-next-line prefer-rest-params
    pushState.apply(history, arguments)
    window.dispatchEvent(new Event("pushstate"))
    window.dispatchEvent(new Event("locationchange"))
  }

  history.replaceState = function () {
    // eslint-disable-next-line prefer-rest-params
    replaceState.apply(history, arguments)
    window.dispatchEvent(new Event("replacestate"))
    window.dispatchEvent(new Event("locationchange"))
  }

  window.addEventListener("popstate", function () {
    window.dispatchEvent(new Event("locationchange"))
  })

  // Usage example:
  // window.addEventListener("locationchange", function () {
  //   console.log("onlocationchange event occurred!")
  // })
}

// eslint-disable-next-line no-script-url
export const actionHref = "javascript:;"

export const getOffsetPosition = (element, referElement) => {
  const position = { top: 0, left: 0 }
  referElement = referElement || doc.body

  while (element && element !== referElement) {
    position.top += element.offsetTop
    position.left += element.offsetLeft
    element = element.offsetParent
  }

  return position
}

const runOnceCache = {}
export const runOnce = (key, func) => {
  if (!key) {
    return func()
  }

  if (Object.hasOwn(runOnceCache, key)) {
    return runOnceCache[key]
  }

  const result = func()
  runOnceCache[key] = result
  return result
}

const cacheStore = {}
const makeKey = (key: string | any[]) =>
  Array.isArray(key) ? key.join(":") : key
// eslint-disable-next-line @typescript-eslint/naming-convention
export const Cache = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  get: (key: string | any[]) => cacheStore[makeKey(key)],
  add(key: string | any[], value: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    cacheStore[makeKey(key)] = value
  },
}

export const sleep = async (time: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1)
    }, time)
  })
}
