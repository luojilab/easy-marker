declare class EasyMarker {
  constructor(options: EasyMarkerOptions);
  public create(
    containerElement: HTMLElement,
    scrollContainerElement?: HTMLElement,
    excludeElements?: HTMLElement[],
  ): void;
  public getSelectText(): string;
  public highlightLine(
    selection: EasyMarkerSelection,
    id?: string | number,
    meta?: unknown,
  ): void;
  public highlightLines(HighlightLines: HighlightLine[]): void;
  public cancelHighlightLine(id: string | number): boolean;
  public onHighlightLineClick(
    cb: (
      id: string | number,
      meta: unknown,
      selection: HandlerSelection,
    ) => void,
  ): void;
  public onSelectStatusChange(cb: () => void): void;
  public onMenuClick(
    cb: (id: string | number, selection: HandlerSelection) => void,
  ): void;
  public registerEventHook(cb: () => void): void;
  public destroy(): void;
  public static create(
    containerElement: HTMLElement,
    scrollContainerElement?: HTMLElement,
    excludeElements?: HTMLElement[],
  ): EasyMarker;
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
  iconClassList?: string[];
  style?: Record<string, string>;
  handler?: (selection: HandlerSelection) => void;
}

export interface HandlerSelection extends EasyMarkerSelection {
  toString: () => string;
  toMarkdown: () => string;
}

export interface EasyMarkerSelection {
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
  selection: EasyMarkerSelection;
  id?: string | number;
  meta?: unknown;
}

export default EasyMarker;
