import {
  addElement,
  addEventListener,
  createElement,
} from "browser-extension-utils"

type SwichOptions = {
  checked?: boolean
  onchange?: (event: Event) => void | Promise<void>
}

export function createSwitch(options = {} as SwichOptions): HTMLElement {
  const container = createElement("label", { class: "container" })
  const checkbox = createElement(
    "input",
    options.checked ? { type: "checkbox", checked: "" } : { type: "checkbox" }
  )
  addElement(container, checkbox)
  const switchElm = createElement("span", { class: "switch" })
  addElement(switchElm, "span", { class: "slider" })
  addElement(container, switchElm)
  if (options.onchange) {
    addEventListener(checkbox, "change", options.onchange)
  }

  return container
}

export function createSwitchOption(
  text: string,
  options: SwichOptions
): HTMLElement {
  const div = createElement("div", { class: "switch_option" })
  addElement(div, "span", { textContent: text })
  div.append(createSwitch(options))
  return div
}
