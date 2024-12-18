/*
 * I want proper autocompletion when declaring renderable props and I don't
 * have the time to write all these by hand, so this is the next best thing.
 * 
 * (I don't have the time to automate it either.)
 * (And I wanted to do it like this.)
 * (Really fun to write.)
 * (Should be on render.ts, but I want it separate for this disclaimer.)
 */

import { EventHandler, EventType } from "./event";
import { ReactiveString, StringLike } from "./render";
import { type Store } from "./store";

// https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
type Equals<X, Y, WhenTrue = true, WhenFalse = false> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? WhenTrue : WhenFalse;
type OmitNever<T> = {
    [Key in keyof T as T[Key] extends never ? never : Key]: T[Key]
};
type OmitReadOnly<T> = {
    [Key in keyof T
        as Equals<
            { [L in Key]: T[L]},
            { -readonly [M in Key]: T[M]},
            Key,
            never
        >
    ]: T[Key]
};

type PlainAttribute = string | number | boolean | null | PlainAttribute[];
export type LiteralOrStore<T> = T | Store<T>;
export type Reactive<T> = ReactiveString | LiteralOrStore<T>;
export type Styles = OmitReadOnly<{
    [StyleKey in keyof CSSStyleDeclaration
        as CSSStyleDeclaration[StyleKey] extends PlainAttribute ?
              StyleKey
            : never
    ]: CSSStyleDeclaration[StyleKey] extends string ?
          Reactive<StringLike>
        : Reactive<CSSStyleDeclaration[StyleKey]>
}>;

export type Tag = keyof HTMLElementTagNameMap;
export type Props<ElementTag extends Tag> = Partial<OmitNever<OmitReadOnly<{
    [Attribute in keyof HTMLElementTagNameMap[ElementTag]]:
        Attribute extends string ?
              HTMLElementTagNameMap[ElementTag][Attribute] extends PlainAttribute ?
                  HTMLElementTagNameMap[ElementTag][Attribute] extends string ?
                      Reactive<StringLike>
                    : Reactive<HTMLElementTagNameMap[ElementTag][Attribute]>
                : Attribute extends `on${infer Event}` ?
                    Event extends EventType ?
                          LiteralOrStore<EventHandler<Event>>
                        : never
                    : never
            : never
}>> | { style: Partial<Styles>}>;
