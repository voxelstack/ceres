import { CeresElement } from "./element";
import type { Children, Tag } from "./types";

export { CeresElement } from "./element";
export function $element<const ElementTag extends Tag>(
    tag: ElementTag,
    props: unknown,
    children: Children,
) {
    return new CeresElement(tag, props, children);
}
