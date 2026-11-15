export function qs<T extends Element>(
  selector: string,
  parent: ParentNode = document,
): T {
  const element = parent.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

/** Creates a decorative Phosphor icon for explorer controls built outside React. */
export function phosphorIcon(name: string, className = ""): HTMLElement {
  const icon = document.createElement("i");
  icon.className = `ph ph-${name}${className ? ` ${className}` : ""}`;
  icon.setAttribute("aria-hidden", "true");
  return icon;
}
