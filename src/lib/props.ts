/*
 * I want proper autocompletion when declaring renderable props and I don't
 * have the time to write all these by hand, so this is the next best thing.
 * 
 * (I don't have the time to automate it either.)
 * (And I wanted to do it like this.)
 * (Really fun to write.)
 */

import { ComponentBinds, DocumentBinds, WindowBinds } from "./bind";
import { ElementEventType, EventHandler } from "./event";
import { ReactiveString } from "./reactive_string";
import { type Store } from "./store";

export type Props<ElementTag extends Tag> = Partial<
    Attributes<ElementTag> & {
        className: Classes;
        style: Styles;
        bind: ComponentBinds<ElementTag>;
        use: Actions<ElementTag>;
        on: Handlers<ElementTag>;
    }>
;
export type WindowProxyProps = {
    bind?: WindowBinds;
    on?: WindowHandlers;
};
export type DocumentProxyProps = {
    className?: Classes;
    style?: Styles;
    bind?: DocumentBinds;
    on?: DocumentHandlers;
};
export type BodyProxyProps = {
    className?: Classes;
    style?: Styles;
    on?: Handlers<"body">;
}

type PlainAttribute = string | number | boolean | null | PlainAttribute[];
export type Stringifiable = { toString: () => string };
export type StringLike = Stringifiable | Store<Stringifiable>;
export type LiteralOrStore<T> = T | Store<T>;
export type Reactive<T> = ReactiveString | LiteralOrStore<T>;
export type Tag = keyof HTMLElementTagNameMap;

export type Styles = Partial<{
    [
        StyleKey in keyof Omit<CSSStyleDeclaration, "className">
        as CSSStyleDeclaration[StyleKey] extends PlainAttribute ? StyleKey : never
    ]: CSSStyleDeclaration[StyleKey] extends string ?
          Reactive<StringLike>
        : Reactive<CSSStyleDeclaration[StyleKey]>
}>;

export type Classes =
    | LiteralOrStore<Stringifiable>
    | LiteralOrStore<Array<string>>
    | Record<string, LiteralOrStore<boolean>>
;

// https://github.com/microsoft/TypeScript/issues/40689
export type Handlers<ElementTag extends Tag> = Partial<{
    [
        Attribute in keyof HTMLElementTagNameMap[ElementTag]
        as Attribute extends `on${infer Event}` ? Event : never
    ]:
        Attribute extends `on${infer Event}` ?
              Event extends ElementEventType ? EventHandler<HTMLElementEventMap[Event]>
                : never
            : never
}>;

type SpecialElementHandlers<EventMap> = {
    [Key in keyof EventMap]?: EventHandler<EventMap[Key]>;
};
export type WindowHandlers = SpecialElementHandlers<WindowEventMap>;
export type DocumentHandlers = SpecialElementHandlers<DocumentEventMap>;

export type Attributes<ElementTag extends Tag> = Partial<{
    [
        Attribute in keyof OmitReadOnly<Omit<HTMLElementTagNameMap[ElementTag], "style" | "className">>
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
type Action<ElementTag extends Tag> = (node: HTMLElementTagNameMap[ElementTag]) => Cleanup | void;
export type Actions<ElementTag extends Tag> = Record<string, Action<ElementTag>>;

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
