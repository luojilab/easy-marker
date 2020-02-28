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
    id?: unknown,
    meta?: unknown,
  ): void;
  public highlightLines(HighlightLines: HighlightLine[]): void;
  public cancelHighlightLine(id: unknown): boolean;
  public onHighlightLineClick(
    cb: (id: unknown, meta: unknown, selection: EasyMarkerSelection) => void,
  ): void;
  public onSelectStatusChange(cb: () => void): void;
  public onMenuClick(cb: (id: unknown, selection: EasyMarkerSelection) => void);
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
  style?: record<string, string>;
  handler?: (selection: EasyMarkerSelection) => void;
}

export interface EasyMarkerSelection {
  anchorNode: Text;
  anchorOffset: number;
  focusNode: Text;
  focusOffset: number;
}

export interface MenuStyle {
  menu?: record<string, string>;
  triangle?: record<string, string>;
  item?: record<string, string>;
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
  id?: unknown;
  meta?: unknown;
  selection?: EasyMarkerSelection;
}

export default EasyMarker;
