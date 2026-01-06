import { Observable } from "../observable/observable";
import type { CeresElement } from "./element";

/**
 * A tag used to create and HTML, SVG, or MathML element.
 */
export type Tag =
    | keyof HTMLElementTagNameMap
    | keyof SVGElementTagNameMap
    | keyof MathMLElementTagNameMap;

/**
 * The element defined by a given tag.
 */
export type TagElement<T> = T extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[T]
    : T extends keyof SVGElementTagNameMap
    ? SVGElementTagNameMap[T]
    : T extends keyof MathMLElementTagNameMap
    ? MathMLElementTagNameMap[T]
    : never;

/**
 * A value that can be represented as a string.
 */
export type StringLike = string | { toString(): string };

/**
 * Children of a CeresElement.
 *
 * Either one static/dynamic StringLike, or multiple CeresElements.
 */
export type Children = StringLike | Observable<StringLike> | CeresElement[];
