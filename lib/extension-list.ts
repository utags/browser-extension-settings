import { $, addElement, createElement } from "browser-extension-utils"
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
    id: "v2ex.min",
    title: "v2ex.min - V2EX 极简风格",
    url: "https://greasyfork.org/scripts/463552",
  },
]

const getInstalledExtesionList = () => {
  return $(".extension_list_container .installed_extension_list")
}

export const addCurrentExtension = (extension: InstalledExtension) => {
  const list = getInstalledExtesionList()
  if (!list) {
    return
  }

  const id = extension.id
  const added = $(`[data-extension-id="${id}"]`, list)
  if (added) {
    return
  }

  const element = createInstalledExtension(extension)
  list.append(element)
}

const createInstalledExtension = (installedExtension: InstalledExtension) => {
  const div = createElement("div", {
    class: "related_extension",
    "data-extension-id": installedExtension.id,
  })
  const a = addElement(div, "a", {
    onclick: installedExtension.onclick,
  })
  addElement(a, "span", {
    textContent: installedExtension.title,
  })
  const svg = addElement(a, "svg")
  svg.outerHTML = openButton

  return div
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
    console.log(installedExtension)

    const element = createInstalledExtension(installedExtension)
    div2.append(element)
  }

  addElement(div, "h2", { textContent: "Other Extensions" })
  const div3 = addElement(div, "div", {
    class: "related_extension_list",
  })
  for (const relatedExtension of relatedExtensions) {
    console.log(relatedExtension)

    const div4 = addElement(div3, "div", {
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
    svg.outerHTML = openInNewTabButton
  }

  return div
}
