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

const relatedExtensions: RelatedExtension[] = [
  {
    id: "utags",
    title: "🏷️ UTags - Add usertags to links",
    url: "https://greasyfork.org/scripts/460718",
  },
  {
    id: "links-helper",
    title: "🔗 链接助手",
    description: "在新标签页中打开第三方网站链接，图片链接转图片标签等",
    url: "https://greasyfork.org/scripts/464541",
  },
  {
    id: "v2ex.rep",
    title: "V2EX.REP - 专注提升 V2EX 主题回复浏览体验",
    url: "https://greasyfork.org/scripts/466589",
  },
  {
    id: "v2ex.min",
    title: "v2ex.min - V2EX 极简风格",
    url: "https://greasyfork.org/scripts/463552",
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
  container.innerHTML = createHTML("")

  for (const relatedExtension of relatedExtensions) {
    // console.log(relatedExtension)

    if (isInstalledExtension(relatedExtension.id)) {
      continue
    }

    const div4 = addElement(container, "div", {
      class: "related_extension",
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
