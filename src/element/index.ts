import { CeresElement } from "./element";
import type { Children, Tag } from "./types";

export { CeresElement } from "./element";

/**
 * Creates a ceres element.
 * Shorthand for `new CeresElement()`.
 * @see {@link CeresElement}
 *
 * @example
 * ```typescript
 * $element("span", {}, ceres)
 * .mount(root);
 * ```
 *
 * @param tag The HTML tag.
 * @param props Element attributes.
 * @param children A single string or a list of child elements.
 * @returns A new CeresElement.
 */
export function $element<const ElementTag extends Tag>(
    tag: ElementTag,
    props: unknown,
    children: Children,
) {
    return new CeresElement(tag, props, children);
}
