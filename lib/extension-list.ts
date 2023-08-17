import {
  $,
  $$,
  addClass,
  addElement,
  createElement,
  createHTML,
  removeClass,
} from "browser-extension-utils"
import { openButton, openInNewTabButton } from "./common"
import { i } from "./messages"

type InstalledExtension = {
  id: string
  title: string
  version?: string
  onclick: () => void
}

type RelatedExtension = {
  id: string
  title: string
  description?: string
  url: string
}

const lang = navigator.language
let locale: string
if (lang === "zh-TW" || lang === "zh-HK") {
  locale = "zh-TW"
} else if (lang.includes("zh")) {
  locale = "zh-CN"
} else {
  locale = "en"
}

const relatedExtensions: RelatedExtension[] = [
  {
    id: "utags",
    title: i("settings.extensions.utags.title"),
    url: `https://greasyfork.org/${locale}/scripts/460718-utags-add-usertags-to-links`,
  },
  {
    id: "links-helper",
    title: i("settings.extensions.links-helper.title"),
    description: "在新标签页中打开第三方网站链接，图片链接转图片标签等",
    url: `https://greasyfork.org/${locale}/scripts/464541-links-helper`,
  },
  {
    id: "v2ex.rep",
    title: i("settings.extensions.v2ex.rep.title"),
    url: `https://greasyfork.org/${locale}/scripts/466589-v2ex-rep-%E4%B8%93%E6%B3%A8%E6%8F%90%E5%8D%87-v2ex-%E4%B8%BB%E9%A2%98%E5%9B%9E%E5%A4%8D%E6%B5%8F%E8%A7%88%E4%BD%93%E9%AA%8C`,
  },
  {
    id: "v2ex.min",
    title: i("settings.extensions.v2ex.min.title"),
    url: `https://greasyfork.org/${locale}/scripts/463552-v2ex-min-v2ex-%E6%9E%81%E7%AE%80%E9%A3%8E%E6%A0%BC`,
  },
  {
    id: "replace-ugly-avatars",
    title: i("settings.extensions.replace-ugly-avatars.title"),
    url: `https://greasyfork.org/${locale}/scripts/472616-replace-ugly-avatars`,
  },
  {
    id: "more-by-pipecraft",
    title: i("settings.extensions.more-by-pipecraft.title"),
    url: `https://greasyfork.org/${locale}/users/1030884-pipecraft`,
  },
]

const getInstalledExtesionList = () => {
  return $(".extension_list_container .installed_extension_list")
}

const getRelatedExtesionList = () => {
  return $(".extension_list_container .related_extension_list")
}

const isInstalledExtension = (id: string) => {
  const list = getInstalledExtesionList()
  if (!list) {
    return false
  }

  const installed = $(`[data-extension-id="${id}"]`, list)
  return Boolean(installed)
}

export const addCurrentExtension = (extension: InstalledExtension) => {
  const list = getInstalledExtesionList()
  if (!list) {
    return
  }

  if (isInstalledExtension(extension.id)) {
    return
  }

  const element = createInstalledExtension(extension)
  list.append(element)

  const list2 = getRelatedExtesionList()
  if (list2) {
    updateRelatedExtensions(list2)
  }
}

export const activeExtension = (id: string) => {
  const list = getInstalledExtesionList()
  if (!list) {
    return false
  }

  for (const element of $$(".active", list)) {
    removeClass(element, "active")
  }

  const installed = $(`[data-extension-id="${id}"]`, list)
  if (installed) {
    addClass(installed, "active")
  }
}

export const activeExtensionList = () => {
  const extensionListContainer = $(".extension_list_container")
  if (extensionListContainer) {
    addClass(extensionListContainer, "bes_active")
  }
}

export const deactiveExtensionList = () => {
  const extensionListContainer = $(".extension_list_container")
  if (extensionListContainer) {
    removeClass(extensionListContainer, "bes_active")
  }
}

const createInstalledExtension = (installedExtension: InstalledExtension) => {
  const div = createElement("div", {
    class: "installed_extension",
    "data-extension-id": installedExtension.id,
  })
  const a = addElement(div, "a", {
    onclick: installedExtension.onclick,
  })
  addElement(a, "span", {
    textContent: installedExtension.title,
  })
  const svg = addElement(a, "svg")
  svg.outerHTML = createHTML(openButton)

  return div
}

const updateRelatedExtensions = (container: HTMLElement) => {
  const relatedExtensionElements = $$("[data-extension-id]", container)
  if (relatedExtensionElements.length > 0) {
    for (const relatedExtensionElement of relatedExtensionElements) {
      if (
        isInstalledExtension(
          relatedExtensionElement.dataset.extensionId || "noid"
        )
      ) {
        relatedExtensionElement.remove()
      }
    }
  } else {
    container.innerHTML = createHTML("")
  }

  for (const relatedExtension of relatedExtensions) {
    // console.log(relatedExtension)

    if (
      isInstalledExtension(relatedExtension.id) ||
      $(`[data-extension-id="${relatedExtension.id}"]`, container)
    ) {
      continue
    }

    if ($$("[data-extension-id]", container).length >= 4) {
      return
    }

    const div4 = addElement(container, "div", {
      class: "related_extension",
      "data-extension-id": relatedExtension.id,
    })

    const a = addElement(div4, "a", {
      href: relatedExtension.url,
      target: "_blank",
    })

    addElement(a, "span", {
      textContent: relatedExtension.title,
    })
    const svg = addElement(a, "svg")
    svg.outerHTML = createHTML(openInNewTabButton)
  }
}

export function createExtensionList(installedExtensions: InstalledExtension[]) {
  const div = createElement("div", {
    class: "extension_list_container thin_scrollbar",
  })

  addElement(div, "h1", { textContent: "Settings" })

  const div2 = addElement(div, "div", {
    class: "installed_extension_list",
  })
  for (const installedExtension of installedExtensions) {
    // console.log(installedExtension)

    if (isInstalledExtension(installedExtension.id)) {
      continue
    }

    const element = createInstalledExtension(installedExtension)
    div2.append(element)
  }

  addElement(div, "h2", { textContent: "Other Extensions" })
  const div3 = addElement(div, "div", {
    class: "related_extension_list",
  })
  updateRelatedExtensions(div3)

  return div
}
