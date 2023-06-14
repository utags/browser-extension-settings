import {
  addValueChangeListener,
  getValue,
  setValue,
} from "browser-extension-storage"
import {
  $,
  $$,
  addElement,
  addEventListener,
  addStyle,
  createElement,
  doc,
  removeEventListener,
} from "browser-extension-utils"
import styleText from "data-text:./style.scss"
import { createSwitchOption } from "./switch"
import {
  createExtensionList,
  addCurrentExtension,
  activeExtension,
} from "./extension-list"
import { version } from "./common"

const prefix = "browser_extension_settings_"

type SettingsOptions = {
  id: string
  title: string
  footer?: string
  settingsTable?: SettingsTable
  onValueChange?: () => void
  relatedExtensions?: RelatedExtension[]
}

type SettingsTable = Record<string, SettingsSwitchItem | SettingsInputItem>

type SettingsSwitchItem = {
  title: string
  defaultValue: boolean
}

type SettingsInputItem = {
  title: string
  defaultValue: string
  type: string
}

type RelatedExtension = {
  id: string
  title: string
  description?: string
  url: string
}

type InstalledExtension = {
  id: string
  title: string
  version: string
}

const randomId = String(Math.round(Math.random() * 10_000))
const settingsContainerId = prefix + "container_" + randomId
const settingsElementId = prefix + "main_" + randomId
const getSettingsElement = () => $("#" + settingsElementId)
const getSettingsStyle: () => string = () =>
  styleText
    .replace(/browser_extension_settings_container/gm, settingsContainerId)
    .replace(/browser_extension_settings_main/gm, settingsElementId)
const storageKey = "settings"

let settingsOptions: SettingsOptions
let settingsTable: SettingsTable = {}
let settings = {}
async function getSettings() {
  return (
    ((await getValue(storageKey)) as Record<string, unknown> | undefined) ?? {}
  )
}

async function saveSattingsValue(key: string, value: any) {
  const settings = await getSettings()
  settings[key] =
    settingsTable[key] && settingsTable[key].defaultValue === value
      ? undefined
      : value

  await setValue(storageKey, settings)
}

export function getSettingsValue(key: string): boolean | string | undefined {
  return Object.hasOwn(settings, key)
    ? settings[key]
    : settingsTable[key]?.defaultValue
}

const modalHandler = (event) => {
  let target = event.target as HTMLElement
  const settingsContainer = getSettingsContainer()
  if (settingsContainer) {
    while (target !== settingsContainer && target) {
      target = target.parentNode as HTMLElement
    }

    if (target === settingsContainer) {
      return
    }

    settingsContainer.style.display = "none"
  }

  removeEventListener(document, "click", modalHandler)
}

async function updateOptions() {
  if (!getSettingsElement()) {
    return
  }

  for (const key in settingsTable) {
    if (Object.hasOwn(settingsTable, key)) {
      const checkbox = $(
        `#${settingsElementId} .option_groups .switch_option[data-key="${key}"] input`
      )
      if (checkbox) {
        checkbox.checked = getSettingsValue(key)
      }
    }
  }

  const host = location.host
  const group2 = $(`#${settingsElementId} .option_groups:nth-of-type(2)`)
  if (group2) {
    group2.style.display = getSettingsValue(
      `enableCustomRulesForCurrentSite_${host}`
    )
      ? "block"
      : "none"
  }

  const customStyleValue = $(`#${settingsElementId} .option_groups textarea`)
  if (customStyleValue) {
    customStyleValue.value = settings[`customRulesForCurrentSite_${host}`] || ""
  }
}

function getSettingsContainer() {
  const container = $(`.${prefix}container`)
  if (container) {
    const theVersion = Number.parseInt(container.dataset.besVersion || "0", 10)
    if (theVersion < version) {
      container.id = settingsContainerId
      container.dataset.besVersion = String(version)
    }

    return container
  }

  return addElement(doc.body, "div", {
    id: settingsContainerId,
    class: `${prefix}container`,
    "data-bes-version": version,
  })
}

function getSettingsWrapper() {
  return (
    $(`.${prefix}container .${prefix}wrapper`) ||
    addElement(getSettingsContainer(), "div", {
      class: `${prefix}wrapper`,
    })
  )
}

function initExtensionList() {
  if (!doc.body) {
    setTimeout(initExtensionList, 100)
    return
  }

  const wrapper = getSettingsWrapper()
  if (!$(".extension_list_container", wrapper)) {
    const list = createExtensionList([])
    wrapper.append(list)
  }

  addCurrentExtension({
    id: settingsOptions.id,
    title: settingsOptions.title,
    onclick: showSettings,
  })
}

function createSettingsElement() {
  let settingsMain = getSettingsElement()
  if (!settingsMain) {
    const wrapper = getSettingsWrapper()

    for (const element of $$(`.${prefix}main`)) {
      element.remove()
    }

    settingsMain = addElement(wrapper, "div", {
      id: settingsElementId,
      class: `${prefix}main thin_scrollbar`,
    })

    addElement(settingsMain, "a", {
      textContent: "Settings",
      class: "navigation_go_previous",
      onclick() {
        console.log(1)
      },
    })

    if (settingsOptions.title) {
      addElement(settingsMain, "h2", { textContent: settingsOptions.title })
    }

    const options = addElement(settingsMain, "div", { class: "option_groups" })
    for (const key in settingsTable) {
      if (Object.hasOwn(settingsTable, key)) {
        const item = settingsTable[key]
        if (!item.type || item.type === "switch") {
          const switchOption = createSwitchOption(item.title, {
            async onchange(event) {
              await saveSattingsValue(key, event.target.checked)
            },
          })

          switchOption.dataset.key = key

          addElement(options, switchOption)
        }
      }
    }

    const options2 = addElement(settingsMain, "div", {
      class: "option_groups",
    })
    let timeoutId
    addElement(options2, "textarea", {
      placeholder: `/* Custom rules for internal URLs, matching URLs will be opened in new tabs */`,
      onkeyup(event) {
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }

        timeoutId = setTimeout(async () => {
          const host = location.host
          await saveSattingsValue(
            `customRulesForCurrentSite_${host}`,
            event.target.value.trim()
          )
        }, 100)
      },
    })

    const tip = addElement(options2, "div", {
      class: "tip",
    })
    addElement(tip, "a", {
      class: "tip_anchor",
      textContent: "Examples",
    })
    const tipContent = addElement(tip, "div", {
      class: "tip_content",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      innerHTML: `<p>Custom rules for internal URLs, matching URLs will be opened in new tabs</p>
      <p>
      - One line per url pattern<br>
      - All URLs contains '/posts' or '/users/'<br>
      <pre>/posts/
/users/</pre>

      - Regex is supported<br>
      <pre>^/(posts|members)/d+</pre>

      - '*' for all URLs
      </p>`,
    })

    if (settingsOptions.footer) {
      const footer = addElement(settingsMain, "footer")
      footer.innerHTML =
        typeof settingsOptions.footer === "string"
          ? settingsOptions.footer
          : `<p>Made with ❤️ by
      <a href="https://www.pipecraft.net/" target="_blank">
        Pipecraft
      </a></p>`
    }
  }

  return settingsMain
}

function addSideMenu() {
  if (!doc.body) {
    setTimeout(addSideMenu, 100)
    return
  }

  const menu =
    $("#browser_extension_side_menu") ||
    addElement(doc.body, "div", {
      id: "browser_extension_side_menu",
      "data-bes-version": version,
    })

  const button = $("button[data-bes-version]", menu)

  if (button) {
    const theVersion = Number.parseInt(button.dataset.besVersion || "0", 10)
    if (theVersion >= version) {
      return
    }

    button.remove()
  }

  addElement(menu, "button", {
    type: "button",
    "data-bes-version": version,
    title: "设置",
    onclick() {
      setTimeout(showSettings, 1)
    },
  })
}

export async function showSettings() {
  const settingsContainer = getSettingsContainer()

  const settingsMain = createSettingsElement()
  await updateOptions()
  settingsContainer.style.display = "block"

  addEventListener(document, "click", modalHandler)
  activeExtension(settingsOptions.id)
}

export const initSettings = async (options: SettingsOptions) => {
  settingsOptions = options
  settingsTable = options.settingsTable || {}
  addValueChangeListener(storageKey, async () => {
    settings = await getSettings()
    await updateOptions()
    if (typeof options.onValueChange === "function") {
      options.onValueChange()
    }
  })

  settings = await getSettings()
  addStyle(getSettingsStyle())
  initExtensionList()
  addSideMenu()
}
