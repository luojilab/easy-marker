declare class EasyMarker {
  constructor(options: EasyMarkerOptions);
  public create(
    containerElement: HTMLElement,
    scrollContainerElement?: HTMLElement,
    excludeElements?: HTMLElement[],
  ): void;
  public getSelectText(): string;
  public highlightLine(selection: Selection, id?: any, meta?: any): void;
  public highlightLines(HighlightLines: HighlightLine[]): void;
  public cancelHighlightLine(id: any): boolean;
  public onHighlightLineClick(
    cb: (id: any, meta: any, selection: Selection) => void,
  ): void;
  public onSelectStatusChange(cb: () => void): void;
  public registerEventHook(cb: () => void): void;
  public destroy(): void;
  public static create(
    containerElement: HTMLElement,
    scrollContainerElement?: HTMLElement,
    excludeElements?: HTMLElement[],
  ): this;
}

interface EasyMarkerOptions {
  menuItems?: MenuItem[];
  menuHandler?: (id: any, selection: Selection) => void;
  menuTopOffset?: number | string;
  menuStyle?: MenuStyle;
  disableTapHighlight?: boolean;
  cursor?: Cursor;
  mask?: Mask;
  highlight?: Highlight;
  scrollSpeedLevel?: number;
  scrollOffsetBottom?: number | string;
  markdownOptions?: MarkdownOptions;
}

interface MenuItem {
  text: string;
  iconClassList?: string[];
  style?: Style;
  handler?: (selection: Selection) => void;
}

interface Style {
  [k: string]: string;
}

interface Selection {
  anchorNode: HTMLElement;
  anchorOffset: number;
  focusNode: HTMLElement;
  focusOffset: number;
}

interface MenuStyle {
  menu?: Style;
  triangle?: Style;
  item?: Style;
}

interface Cursor {
  color?: string;
  same?: boolean;
  customClass?: any;
}

interface Mask {
  color?: string;
}

interface Highlight {
  color?: string;
}

interface MarkdownOptions {
  [k: string]: (string) => string;
}

interface HighlightLine {
  id?: any;
  meta?: any;
  selection?: Selection;
}

export default EasyMarker;
