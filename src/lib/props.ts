/*
 * I want proper autocompletion when declaring renderable props and I don't
 * have the time to write all these by hand, so this is the next best thing.
 * 
 * (I don't have the time to automate it either.)
 * (And I wanted to do it like this.)
 * (Really fun to write.)
 */

import { Bind, GlobalBinds, HTMLElementBindMap } from "./bind";
import { EventHandler, EventType } from "./event";
import { ReactiveString } from "./reactive_string";
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
type Stringifiable = { toString: () => string };
export type StringLike = Stringifiable | Store<Stringifiable>;
export type LiteralOrStore<T> = T | Store<T>;
export type Reactive<T> = ReactiveString | LiteralOrStore<T>;
export type Tag = keyof HTMLElementTagNameMap;

export type Styles = Partial<{
    [
        StyleKey in keyof CSSStyleDeclaration
        as CSSStyleDeclaration[StyleKey] extends PlainAttribute ? StyleKey : never
    ]: CSSStyleDeclaration[StyleKey] extends string ?
          Reactive<StringLike>
        : Reactive<CSSStyleDeclaration[StyleKey]>
}>;

// https://github.com/microsoft/TypeScript/issues/40689
export type Handlers<ElementTag extends Tag> = Partial<{
    [
        Attribute in keyof HTMLElementTagNameMap[ElementTag]
        as Attribute extends `on${infer Event}` ? Event : never
    ]:
        Attribute extends `on${infer Event}` ?
              Event extends EventType ? EventHandler<Event> : never
            : never
}>;

export type Attributes<ElementTag extends Tag> = Partial<{
    [
        Attribute in keyof OmitReadOnly<Omit<HTMLElementTagNameMap[ElementTag], "style">>
        as Attribute extends `on${infer _}` ?
              never
            : HTMLElementTagNameMap[ElementTag][Attribute] extends PlainAttribute ?
                  Attribute
                : never
    ]:
        HTMLElementTagNameMap[ElementTag][Attribute] extends string ?
              Reactive<StringLike>
            : Reactive<HTMLElementTagNameMap[ElementTag][Attribute]>
}>;

type Cleanup = () => void;
type Action = (node: Node) => Cleanup | void;
export type Actions = Record<string, Action>;

export type Binds<ElementTag extends Tag> = ElementTag extends keyof HTMLElementBindMap ?
      Partial<{
          [Attribute in keyof HTMLElementBindMap[ElementTag]]:
              Bind<HTMLElementBindMap[ElementTag][Attribute], any>
      }> & GlobalBinds
    : GlobalBinds
;

export type Props<ElementTag extends Tag> = Partial<
    Attributes<ElementTag> & {
        style: Styles;
        bind: Binds<ElementTag>;
        use: Actions;
        on: Handlers<ElementTag>;
    }>
;
