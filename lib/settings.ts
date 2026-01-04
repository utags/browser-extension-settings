import {
  addValueChangeListener,
  getValue,
  setValue,
} from 'browser-extension-storage'
import {
  $,
  $$,
  addElement,
  addEventListener,
  createHTML,
  doc,
  win,
  parseInt10,
  registerMenuCommand,
  removeEventListener,
  createElement,
} from 'browser-extension-utils'
import styleText from 'data-text:./style.scss'
import {
  initAvailableLocales,
  getPrefferedLocale,
} from 'browser-extension-i18n'
import { createSwitchOption } from './switch'
import { besVersion } from './common'
import { i, resetI18n, localeNames } from './messages/index'

const prefix = 'browser_extension_settings_v2_'

type SettingsOptions = {
  id: string
  title: string
  footer?: string
  settingsTable?: SettingsTable
  availableLocales?: readonly string[]
  onValueChange?: () => void
  onViewUpdate?: (settingsMainView: HTMLElement) => void
  relatedExtensions?: RelatedExtension[]
}

export type SettingsTable = Record<
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
  type?: 'switch'
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
  type: 'select'
  options: Record<string, string | number>
  group?: number
  defaultValue?: string | number
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

const getSettingsElement = () => {
  const wrapper = getSettingsWrapper()
  return (
    (wrapper?.querySelector(`.${prefix}main`) as HTMLElement | undefined) ||
    undefined
  )
}

const storageKey = 'settings'

let settingsOptions: SettingsOptions
let settingsTable: SettingsTable = {}
let settings = {}
async function getSettings(): Promise<
  Record<string, string | boolean | undefined>
> {
  let settings =
    await getValue<Record<string, boolean | string | undefined>>(storageKey)

  if (!settings || typeof settings !== 'object') {
    settings = {}
  }

  return settings
}

async function saveSettingsValue(
  key: string,
  value: boolean | string | undefined
) {
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

export function getSettingsValue<T = boolean | string | undefined>(
  key: string
): T {
  return Object.hasOwn(settings, key)
    ? (settings[key] as T)
    : (settingsTable[key]?.defaultValue as T)
}

const closeModal = () => {
  const settingsContainer = getSettingsContainer()
  if (settingsContainer) {
    settingsContainer.remove()
  }

  removeEventListener(doc, 'click', onDocumentClick, true)
  removeEventListener(doc, 'keydown', onDocumentKeyDown, true)
  removeEventListener(win, 'beforeShowSettings', onBeforeShowSettings, true)
}

export function hideSettings() {
  if (win.self !== win.top) {
    win.top?.postMessage(
      {
        type: 'bes-hide-settings',
        id: settingsOptions?.id,
      },
      '*'
    )
    return
  }

  closeModal()
}

function isSettingsShown() {
  const settingsContainer = $(`.${prefix}container`)

  return Boolean(settingsContainer)
}

const onDocumentClick = (event: Event) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const path = (event as any).composedPath?.() || []
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const insideContainer = path.some(
    (node: unknown) =>
      node instanceof HTMLElement &&
      node.classList?.contains(`${prefix}container`)
  )
  if (insideContainer) {
    return
  }

  closeModal()
}

const onDocumentKeyDown = (event: KeyboardEvent) => {
  if (event.defaultPrevented) {
    return // 如果事件已经在进行中，则不做任何事。
  }

  if (event.key === 'Escape') {
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
      const type = item.type || 'switch'

      // console.log(key, type)
      switch (type) {
        case 'switch': {
          const root = getSettingsElement()!
          const checkbox = $(
            `.option_groups .switch_option[data-key="${key}"] input`,
            root
          ) as HTMLInputElement
          if (checkbox) {
            checkbox.checked = getSettingsValue(key)
          }

          break
        }

        case 'select': {
          const root = getSettingsElement()!
          const options = $$(
            `.option_groups .select_option[data-key="${key}"] .bes_select option`,
            root
          ) as HTMLOptionElement[]

          for (const option of options) {
            option.selected = option.value === String(getSettingsValue(key))
          }

          break
        }

        case 'textarea': {
          const root = getSettingsElement()!
          const textArea = $(
            `.option_groups textarea[data-key="${key}"]`,
            root
          ) as HTMLTextAreaElement
          if (textArea) {
            textArea.value = getSettingsValue(key)
          }

          break
        }

        default: {
          break
        }
      }
    }
  }

  if (typeof settingsOptions.onViewUpdate === 'function') {
    const settingsMain = createSettingsElement()
    settingsOptions.onViewUpdate(settingsMain!)
  }
}

function getSettingsContainer(create = false) {
  const container = $(`.${prefix}container`)
  if (container) {
    const theVersion = parseInt10(container.dataset.besVersion, 0)
    if (theVersion < besVersion) {
      container.dataset.besVersion = String(besVersion)
    }

    return container
  }

  if (create) {
    return addElement(doc.documentElement, 'div', {
      class: `${prefix}container`,
      'data-bes-version': besVersion,
    })
  }
}

function getSettingsShadowRoot(): ShadowRoot | undefined {
  const container = getSettingsContainer(true)
  if (container?.attachShadow) {
    return container.shadowRoot || container.attachShadow({ mode: 'open' })
  }

  return undefined
}

function getSettingsWrapper() {
  const shadow = getSettingsShadowRoot()
  if (!shadow) {
    const container = getSettingsContainer(true)!
    return (
      $(`.${prefix}wrapper`, container) ||
      addElement(container, 'div', { class: `${prefix}wrapper` })
    )
  }

  let wrapper = shadow.querySelector(`.${prefix}wrapper`)
  if (!wrapper) {
    wrapper = createElement('div', { class: `${prefix}wrapper` })
    shadow.append(wrapper)

    const existStyle = shadow.querySelector(`style`)
    if (!existStyle) {
      const styleElm = createElement('style')
      styleElm.textContent = styleText
      shadow.append(styleElm)
    }
  }

  return wrapper as HTMLElement
}

function createSettingsElement() {
  let settingsMain = getSettingsElement()
  if (!settingsMain) {
    const wrapper = getSettingsWrapper()

    for (const element of $$(`.${prefix}main`)) {
      element.remove()
    }

    settingsMain = addElement(wrapper, 'div', {
      class: `${prefix}main thin_scrollbar`,
    })

    const header = addElement(settingsMain, 'header', {
      style: 'display: flex; justify-content: flex-end;',
    })
    addElement(header, 'div', {
      class: `close-button`,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      innerHTML: createHTML(
        `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
      ),
      onclick: hideSettings,
    })

    if (settingsOptions.title) {
      addElement(settingsMain, 'h2', { textContent: settingsOptions.title })
    }

    const optionGroups: HTMLElement[] = []
    const getOptionGroup = (index: number) => {
      if (index > optionGroups.length) {
        for (let i = optionGroups.length; i < index; i++) {
          const optionGroup = addElement(settingsMain, 'div', {
            class: 'option_groups',
          })
          if (optionGroup) optionGroups.push(optionGroup)
        }
      }

      return optionGroups[index - 1]
    }

    for (const key in settingsTable) {
      if (Object.hasOwn(settingsTable, key)) {
        const item = settingsTable[key]
        const type = item.type || 'switch'
        const group = item.group || 1
        const optionGroup = getOptionGroup(group)
        // console.log(key, item, type, group)
        switch (type) {
          case 'switch': {
            const switchOption = createSwitchOption(item.icon, item.title, {
              async onchange(event: Event) {
                const checkbox = event.target as HTMLInputElement
                if (checkbox) {
                  let result = true
                  if (
                    typeof (item as SettingsSwitchItem).onConfirmChange ===
                    'function'
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

          case 'textarea': {
            let timeoutId: ReturnType<typeof setTimeout> | undefined
            const div = addElement(optionGroup, 'div', {
              class: 'bes_textarea',
            })
            addElement(div, 'textarea', {
              'data-key': key,
              placeholder: (item as SettingsInputItem).placeholder || '',
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

          case 'action': {
            addElement(optionGroup, 'a', {
              'data-key': key,
              class: 'action',
              textContent: item.title,
              onclick: (item as SettingsActionItem).onclick,
            })

            break
          }

          case 'externalLink': {
            const div4 = addElement(optionGroup, 'div', {
              class: 'bes_external_link',
            })

            addElement(div4, 'a', {
              'data-key': key,
              textContent: item.title,
              href: (item as SettingsActionItem).url,
              target: '_blank',
            })
            break
          }

          case 'select': {
            const div = addElement(optionGroup, 'div', {
              class: 'select_option bes_option',
              'data-key': key,
            })
            if (item.icon) {
              addElement(div, 'img', { src: item.icon, class: 'bes_icon' })
            }

            addElement(div, 'span', {
              textContent: item.title,
              class: 'bes_title',
            })

            const select = addElement(div, 'select', {
              class: 'bes_select',
              async onchange() {
                await saveSettingsValue(key, select.value)
              },
            }) as HTMLSelectElement

            for (const option of Object.entries(
              (item as SettingsSelectItem).options
            )) {
              addElement(select, 'option', {
                textContent: option[0],
                value: option[1],
              })
            }

            break
          }

          case 'tip': {
            const tip = addElement(optionGroup, 'div', {
              class: 'bes_tip',
            })
            addElement(tip, 'a', {
              class: 'bes_tip_anchor',
              textContent: item.title,
            })
            const tipContent = addElement(tip, 'div', {
              class: 'bes_tip_content',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              innerHTML: createHTML((item as SettingsTipItem).tipContent),
            })
            break
          }

          // No default
          default: {
            break
          }
        }
      }
    }

    if (settingsOptions.footer) {
      const footer = addElement(settingsMain, 'footer')
      footer!.innerHTML = createHTML(
        typeof settingsOptions.footer === 'string'
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

function addCommonSettings(
  settingsTable: SettingsTable,
  options: { locale?: boolean }
) {
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

  if (options.locale) {
    // Switch locale
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    settingsTable.locale = {
      title: i('settings.locale'),
      type: 'select',
      defaultValue: '',
      options: {},
      group: ++maxGroup,
    } as SettingsSelectItem
  }

  // // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  // settingsTable.displaySettingsButtonInSideMenu = {
  //   title: i("settings.displaySettingsButtonInSideMenu"),
  //   defaultValue: !(
  //     typeof GM === "object" && typeof GM?.registerMenuCommand === "function"
  //   ),
  //   group: ++maxGroup,
  // } as SettingsSwitchItem
}

function handleShowSettingsUrl() {
  const hashString = `#!show-settings-${settingsOptions.id}`
  if (location.hash === hashString) {
    setTimeout(showSettings, 100)
    history.replaceState({}, '', location.href.replace(hashString, ''))
  }
}

function onBeforeShowSettings() {
  // Close opened modal before showing settings from other extension
  closeModal()
}

export async function showSettings() {
  // Close opened modal before showing settings
  if (win.self !== win.top) {
    win.top?.postMessage(
      {
        type: 'bes-show-settings',
        id: settingsOptions?.id,
      },
      '*'
    )
    return
  }

  closeModal()

  const event = new CustomEvent('beforeShowSettings')
  // Dispatch beforeShowSettings event to close other extension's settings
  win.dispatchEvent(event)

  // Listen to beforeShowSettings event to close opened modal before showing settings from other extension
  addEventListener(win, 'beforeShowSettings', onBeforeShowSettings, true)

  createSettingsElement()
  await updateOptions()

  addEventListener(doc, 'click', onDocumentClick, true)
  addEventListener(doc, 'keydown', onDocumentKeyDown, true)
  // activeExtension(settingsOptions.id)
  // deactiveExtensionList()
}

let lastLocale: string | undefined

// Reset settings UI on init and locale change
// eslint-disable-next-line @typescript-eslint/naming-convention
const resetSettingsUI = (optionsProvider: () => SettingsOptions) => {
  lastLocale = getSettingsValue('locale') || getPrefferedLocale()
  resetI18n(lastLocale)

  const options = optionsProvider()
  settingsOptions = options
  settingsTable = { ...options.settingsTable }
  const availableLocales = options.availableLocales
  addCommonSettings(settingsTable, {
    locale: Boolean(availableLocales?.length),
  })
  if (availableLocales?.length) {
    initAvailableLocales(availableLocales)
    const localeSelect = settingsTable.locale as SettingsSelectItem
    localeSelect.options = {
      [i('settings.systemLanguage')]: '',
    }
    for (const locale of availableLocales) {
      // Use language display name from localeNames, fallback to locale code if not found
      const lowerCaseLocale = locale.toLowerCase()
      const displayName =
        localeNames[lowerCaseLocale as keyof typeof localeNames] || locale
      localeSelect.options[displayName] = locale
    }
  }

  // runWhenDomReady(() => {
  // initExtensionList()
  // addSideMenu()
  // })
}

export const initSettings = async (optionsProvider: () => SettingsOptions) => {
  await addValueChangeListener(storageKey, async () => {
    settings = await getSettings()
    // console.log(JSON.stringify(settings, null, 2))
    await updateOptions()
    // addSideMenu()

    const newLocale =
      getSettingsValue<string | undefined>('locale') || getPrefferedLocale()
    // console.log("lastLocale:", lastLocale, "newLocale:", newLocale)
    if (lastLocale !== newLocale) {
      const isShown = isSettingsShown()
      closeModal()
      resetI18n(newLocale)
      lastLocale = newLocale

      setTimeout(() => {
        resetSettingsUI(optionsProvider)
      }, 50)

      if (isShown) {
        setTimeout(showSettings, 100)
      }
    }

    if (typeof settingsOptions.onValueChange === 'function') {
      settingsOptions.onValueChange()
    }
  })

  settings = await getSettings()

  resetSettingsUI(optionsProvider)
  // Wait until extension intialized
  setTimeout(() => {
    resetSettingsUI(optionsProvider)
  }, 50)

  void registerMenuCommand(i('settings.menu.settings'), showSettings, {
    accessKey: 'o',
  })

  addEventListener(win, 'message', (event: MessageEvent) => {
    if (!event.data || event.data.id !== settingsOptions?.id) {
      return
    }

    if (event.data.type === 'bes-show-settings') {
      void showSettings()
    } else if (event.data.type === 'bes-hide-settings') {
      hideSettings()
    }
  })

  handleShowSettingsUrl()
}
