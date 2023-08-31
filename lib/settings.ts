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
  createHTML,
  doc,
  parseInt10,
  registerMenuCommand,
  removeEventListener,
  runWhenDomReady,
  runWhenHeadExists,
} from "browser-extension-utils"
import styleText from "data-text:./style.scss"
import { createSwitchOption } from "./switch"
import {
  createExtensionList,
  addCurrentExtension,
  activeExtension,
  activeExtensionList,
  deactiveExtensionList,
} from "./extension-list"
import { besVersion, settingButton } from "./common"
import { i } from "./messages"

const prefix = "browser_extension_settings_"

type SettingsOptions = {
  id: string
  title: string
  footer?: string
  settingsTable?: SettingsTable
  onValueChange?: () => void
  onViewUpdate?: (settingsMainView: HTMLElement) => void
  relatedExtensions?: RelatedExtension[]
}

type SettingsTable = Record<
  string,
  | SettingsSwitchItem
  | SettingsInputItem
  | SettingsActionItem
  | SettingsSelectItem
  | SettingsTipItem
>

type SettingsSwitchItem = {
  title: string
  icon?: string
  defaultValue: boolean
  type?: "switch"
  onConfirmChange?: (checked: boolean) => boolean
  group?: number
}

type SettingsInputItem = {
  title: string
  icon?: string
  defaultValue: string
  placeholder?: string
  type: string
  group?: number
}

type SettingsActionItem = {
  title: string
  icon?: string
  type: string
  onclick?: () => void
  url?: string
  group?: number
  defaultValue?: any
}

type SettingsSelectItem = {
  title: string
  icon?: string
  type: "select"
  options: { string: { string: any } }
  group?: number
  defaultValue?: any
}

type SettingsTipItem = {
  title: string
  icon?: string
  type: string
  tipContent: string
  group?: number
  defaultValue?: any
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
  (styleText as string)
    .replaceAll(/browser_extension_settings_container/gm, settingsContainerId)
    .replaceAll(/browser_extension_settings_main/gm, settingsElementId)
const storageKey = "settings"

let settingsOptions: SettingsOptions
let settingsTable: SettingsTable = {}
let settings = {}
async function getSettings() {
  return (
    ((await getValue(storageKey)) as Record<string, unknown> | undefined) ?? {}
  )
}

async function saveSettingsValue(key: string, value: any) {
  const settings = await getSettings()
  settings[key] =
    settingsTable[key] && settingsTable[key].defaultValue === value
      ? undefined
      : value

  await setValue(storageKey, settings)
}

export async function resetSettingsValues() {
  await setValue(storageKey, {})
}

export async function saveSettingsValues(
  values: Record<string, boolean | string | undefined>
) {
  const settings = await getSettings()

  for (const key in values) {
    if (Object.hasOwn(values, key)) {
      const value = values[key]

      settings[key] =
        settingsTable[key] && settingsTable[key].defaultValue === value
          ? undefined
          : value
    }
  }

  await setValue(storageKey, settings)
}

export function getSettingsValue(key: string): boolean | string | undefined {
  return Object.hasOwn(settings, key)
    ? (settings[key] as boolean | string | undefined)
    : (settingsTable[key]?.defaultValue as boolean | string | undefined)
}

const closeModal = () => {
  const settingsContainer = getSettingsContainer()
  if (settingsContainer) {
    settingsContainer.style.display = "none"
  }

  removeEventListener(document, "click", onDocumentClick, true)
  removeEventListener(document, "keydown", onDocumentKeyDown, true)
}

export function hideSettings() {
  closeModal()
}

const onDocumentClick = (event: Event) => {
  const target = event.target as HTMLElement
  if (target?.closest(`.${prefix}container`)) {
    return
  }

  closeModal()
}

const onDocumentKeyDown = (event: KeyboardEvent) => {
  if (event.defaultPrevented) {
    return // 如果事件已经在进行中，则不做任何事。
  }

  if (event.key === "Escape") {
    // 按“ESC”键时要做的事。
    closeModal()
    // 取消默认动作，从而避免处理两次。
    event.preventDefault()
  }
}

async function updateOptions() {
  if (!getSettingsElement()) {
    return
  }

  for (const key in settingsTable) {
    if (Object.hasOwn(settingsTable, key)) {
      const item = settingsTable[key]
      const type = item.type || "switch"

      // console.log(key, type)
      switch (type) {
        case "switch": {
          const checkbox = $(
            `#${settingsElementId} .option_groups .switch_option[data-key="${key}"] input`
          ) as HTMLInputElement
          if (checkbox) {
            checkbox.checked = getSettingsValue(key) as boolean
          }

          break
        }

        case "select": {
          const options = $$(
            `#${settingsElementId} .option_groups .select_option[data-key="${key}"] .bes_select option`
          ) as HTMLOptionElement[]

          for (const option of options) {
            option.selected = option.value === String(getSettingsValue(key))
          }

          break
        }

        case "textarea": {
          const textArea = $(
            `#${settingsElementId} .option_groups textarea[data-key="${key}"]`
          ) as HTMLTextAreaElement
          if (textArea) {
            textArea.value = getSettingsValue(key) as string
          }

          break
        }

        default: {
          break
        }
      }
    }
  }

  if (typeof settingsOptions.onViewUpdate === "function") {
    const settingsMain = createSettingsElement()
    settingsOptions.onViewUpdate(settingsMain)
  }
}

function getSettingsContainer() {
  const container = $(`.${prefix}container`)
  if (container) {
    const theVersion = parseInt10(container.dataset.besVersion, 0)
    if (theVersion < besVersion) {
      container.id = settingsContainerId
      container.dataset.besVersion = String(besVersion)
    }

    return container
  }

  return addElement(doc.body, "div", {
    id: settingsContainerId,
    class: `${prefix}container`,
    "data-bes-version": besVersion,
    style: "display: none;",
  })
}

function getSettingsWrapper() {
  const container = getSettingsContainer()
  return (
    $(`.${prefix}wrapper`, container) ||
    addElement(container, "div", {
      class: `${prefix}wrapper`,
    })
  )
}

function initExtensionList() {
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
        activeExtensionList()
      },
    })

    if (settingsOptions.title) {
      addElement(settingsMain, "h2", { textContent: settingsOptions.title })
    }

    const optionGroups: HTMLElement[] = []
    const getOptionGroup = (index: number) => {
      if (index > optionGroups.length) {
        for (let i = optionGroups.length; i < index; i++) {
          optionGroups.push(
            addElement(settingsMain!, "div", {
              class: "option_groups",
            })
          )
        }
      }

      return optionGroups[index - 1]
    }

    for (const key in settingsTable) {
      if (Object.hasOwn(settingsTable, key)) {
        const item = settingsTable[key]
        const type = item.type || "switch"
        const group = item.group || 1
        const optionGroup = getOptionGroup(group)
        // console.log(key, item, type, group)
        switch (type) {
          case "switch": {
            const switchOption = createSwitchOption(item.icon, item.title, {
              async onchange(event: Event) {
                const checkbox = event.target as HTMLInputElement
                if (checkbox) {
                  let result = true
                  if (
                    typeof (item as SettingsSwitchItem).onConfirmChange ===
                    "function"
                  ) {
                    result = (item as SettingsSwitchItem).onConfirmChange!(
                      checkbox.checked
                    )
                  }

                  if (result) {
                    await saveSettingsValue(key, checkbox.checked)
                  } else {
                    checkbox.checked = !checkbox.checked
                  }
                }
              },
            })

            switchOption.dataset.key = key

            addElement(optionGroup, switchOption)

            break
          }

          case "textarea": {
            let timeoutId: number | undefined
            const div = addElement(optionGroup, "div", {
              class: "bes_textarea",
            })
            addElement(div, "textarea", {
              "data-key": key,
              placeholder: (item as SettingsInputItem).placeholder || "",
              onkeyup(event: Event) {
                const textArea = event.target as HTMLTextAreaElement
                if (timeoutId) {
                  clearTimeout(timeoutId)
                  timeoutId = undefined
                }

                timeoutId = setTimeout(async () => {
                  if (textArea) {
                    await saveSettingsValue(key, textArea.value.trim())
                  }
                }, 100)
              },
            })

            break
          }

          case "action": {
            addElement(optionGroup, "a", {
              class: "action",
              textContent: item.title,
              onclick: (item as SettingsActionItem).onclick,
            })

            break
          }

          case "externalLink": {
            const div4 = addElement(optionGroup, "div", {
              class: "bes_external_link",
            })

            addElement(div4, "a", {
              textContent: item.title,
              href: (item as SettingsActionItem).url,
              target: "_blank",
            })
            break
          }

          case "select": {
            const div = addElement(optionGroup, "div", {
              class: "select_option bes_option",
              "data-key": key,
            })
            if (item.icon) {
              addElement(div, "img", { src: item.icon, class: "bes_icon" })
            }

            addElement(div, "span", {
              textContent: item.title,
              class: "bes_title",
            })

            const select = addElement(div, "select", {
              class: "bes_select",
              async onchange() {
                await saveSettingsValue(key, select.value)
              },
            }) as HTMLSelectElement

            for (const option of Object.entries(
              (item as SettingsSelectItem).options
            )) {
              addElement(select, "option", {
                textContent: option[0],
                value: option[1],
              })
            }

            break
          }

          case "tip": {
            const tip = addElement(optionGroup, "div", {
              class: "bes_tip",
            })
            addElement(tip, "a", {
              class: "bes_tip_anchor",
              textContent: item.title,
            })
            const tipContent = addElement(tip, "div", {
              class: "bes_tip_content",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              innerHTML: createHTML((item as SettingsTipItem).tipContent),
            })
            break
          }
          // No default
        }
      }
    }

    if (settingsOptions.footer) {
      const footer = addElement(settingsMain, "footer")
      footer.innerHTML = createHTML(
        typeof settingsOptions.footer === "string"
          ? settingsOptions.footer
          : `<p>Made with ❤️ by
      <a href="https://www.pipecraft.net/" target="_blank">
        Pipecraft
      </a></p>`
      )
    }
  }

  return settingsMain
}

function addSideMenu() {
  if (!getSettingsValue("displaySettingsButtonInSideMenu")) {
    return
  }

  const menu =
    $("#browser_extension_side_menu") ||
    addElement(doc.body, "div", {
      id: "browser_extension_side_menu",
      "data-bes-version": besVersion,
    })

  const button = $("button[data-bes-version]", menu)

  if (button) {
    const theVersion = parseInt10(button.dataset.besVersion, 0)
    if (theVersion >= besVersion) {
      return
    }

    button.remove()
  }

  addElement(menu, "button", {
    type: "button",
    "data-bes-version": besVersion,
    title: i("settings.menu.settings"),
    onclick() {
      setTimeout(showSettings, 1)
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    innerHTML: settingButton,
  })
}

function addCommonSettings(settingsTable: SettingsTable) {
  let maxGroup = 0
  for (const key in settingsTable) {
    if (Object.hasOwn(settingsTable, key)) {
      const item = settingsTable[key]
      const group = item.group || 1
      if (group > maxGroup) {
        maxGroup = group
      }
    }
  }

  settingsTable.displaySettingsButtonInSideMenu = {
    title: i("settings.displaySettingsButtonInSideMenu"),
    defaultValue: !(
      typeof GM === "object" && typeof GM.registerMenuCommand === "function"
    ),
    group: maxGroup + 1,
  }
}

function handleShowSettingsUrl() {
  if (location.hash === "#bes-show-settings") {
    setTimeout(showSettings, 100)
  }
}

export async function showSettings() {
  const settingsContainer = getSettingsContainer()

  const settingsMain = createSettingsElement()
  await updateOptions()
  settingsContainer.style.display = "block"

  addEventListener(document, "click", onDocumentClick, true)
  addEventListener(document, "keydown", onDocumentKeyDown, true)
  activeExtension(settingsOptions.id)
  deactiveExtensionList()
}

export const initSettings = async (options: SettingsOptions) => {
  settingsOptions = options
  settingsTable = options.settingsTable || {}
  addCommonSettings(settingsTable)
  addValueChangeListener(storageKey, async () => {
    settings = await getSettings()
    // console.log(JSON.stringify(settings, null, 2))
    await updateOptions()
    addSideMenu()
    if (typeof options.onValueChange === "function") {
      options.onValueChange()
    }
  })

  settings = await getSettings()
  runWhenHeadExists(() => {
    addStyle(getSettingsStyle())
  })
  runWhenDomReady(() => {
    initExtensionList()
    addSideMenu()
  })

  registerMenuCommand(i("settings.menu.settings"), showSettings, "o")

  handleShowSettingsUrl()
}
