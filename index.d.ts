declare class EasyMarker {
  constructor(options: EasyMarkerOptions);
  public create(
    containerElement: HTMLElement,
    scrollContainerElement?: HTMLElement,
    options?: HTMLElement[] | InitOptions,
  ): void;
  public getSelectText(): string;
  public highlightLine(
    selection: SelectionIdentifier,
    id?: string | number,
    meta?: unknown,
  ): void;
  public highlightLines(HighlightLines: HighlightLine[]): void;
  public cancelHighlightLine(id: string | number): boolean;
  public onHighlightLineClick(
    cb: (
      id: string | number,
      meta: unknown,
      selection: SelectionContent,
    ) => void,
  ): void;
  public onSelectStatusChange(cb: (status: SelectStatus) => void): void;
  public onMenuClick(
    cb: (id: string | number, selection: SelectionContent) => void,
  ): void;
  public registerEventHook(cb: () => void): void;
  public destroy(): void;
  public static create(
    containerElement: HTMLElement,
    scrollContainerElement?: HTMLElement,
    options?: HTMLElement[] | InitOptions,
  ): EasyMarker;
}

export enum SelectStatus {
  NONE = 'none',
  SELECTING = 'selecting',
  FINISH = 'finish',
}

export interface InitOptions {
  excludeElements?: HTMLElement[];
  includeElements?: HTMLElement[];
}

export interface EasyMarkerOptions {
  menuItems?: MenuItem[];
  menuTopOffset?: number | string;
  menuStyle?: MenuStyle;
  disableTapHighlight?: boolean;
  cursor?: CursorOptions;
  mask?: MaskOptions;
  highlight?: HighlightOptions;
  scrollSpeedLevel?: number;
  scrollOffsetBottom?: number | string;
  markdownOptions?: MarkdownOptions;
}

export interface MenuItem {
  text: string;
  iconName?: string;
  style?: Record<string, string>;
  handler?: (selection: SelectionContent) => void;
}

export interface SelectionContent extends SelectionIdentifier {
  toString: () => string;
  toMarkdown: () => string;
}

export interface SelectionIdentifier {
  anchorNode: Text;
  anchorOffset: number;
  focusNode: Text;
  focusOffset: number;
}

export interface MenuStyle {
  menu?: Record<string, string>;
  triangle?: Record<string, string>;
  item?: Record<string, string>;
}

export interface CursorOptions {
  color?: string;
  same?: boolean;
  customClass?: unknown;
}

export interface MaskOptions {
  color?: string;
}

export interface HighlightOptions {
  color?: string;
}

export interface MarkdownOptions {
  [k: string]: (key: string) => string;
}

export interface HighlightLine {
  selection: SelectionIdentifier;
  id?: string | number;
  meta?: unknown;
}

export default EasyMarker;
