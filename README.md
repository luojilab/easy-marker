## easy-marker

`easy-marker` is a library for marking text in html. An example is as follows:

![demo](./demo.gif)

## Install

```bash
npm i easy-marker
```

## Usage

```js
import EasyMarker from 'easy-marker';

const easyMarker = new EasyMarker();
const container = document.querySelector('xxxx');
easyMarker.create(container);
```

## API

- [EasyMarker](#EasyMarker)
  - [new EasyMarker(options)](#new_EasyMarker_new)
  - _instance_
    - [.create(containerElement, [scrollContainerElement], options)](#EasyMarker+create)
    - [.highlightLine(selection, [id], [meta])](#EasyMarker+highlightLine)
    - [.highlightLines(lines)](#EasyMarker+highlightLines)
    - [.cancelHighlightLine(id)](#EasyMarker+cancelHighlightLine) ⇒ <code>boolean</code>
    - [.onHighlightLineClick(cb)](#EasyMarker+onHighlightLineClick)
    - [.onSelectStatusChange(cb)](#EasyMarker+onSelectStatusChange)
    - [.onMenuClick(cb)](#EasyMarker+onMenuClick)
    - [.registerEventHook(cb)](#EasyMarker+registerEventHook)
    - [.destroy()](#EasyMarker+destroy)
  - _static_
    - [.create(containerElement, [scrollContainerElement], options)](#EasyMarker.create) ⇒ [<code>EasyMarker</code>](#EasyMarker)
  - _inner_
    - [~menuClickHandler](#EasyMarker..menuClickHandler) : <code>function</code>
    - [~highlightLineClickHandler](#EasyMarker..highlightLineClickHandler) : <code>function</code>

<a name="new_EasyMarker_new"></a>

### new EasyMarker(options)

Creates an instance of EasyMarker.

| Param                         | Type                                       | Description                                                                                        |
| ----------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| options                       | <code>Object</code>                        | options                                                                                            |
| options.menuItems             | <code>Array.&lt;Object&gt;</code>          | menu item option                                                                                   |
| options.menuItems[].text      | <code>string</code>                        | menu text                                                                                          |
| options.menuItems[].type      | <code>string</code>                        | menu type 'select'(Show menu only when selected) 'highlight' (Show menu only when click highlight) |
| options.menuItems[].iconName  | <code>Array.&lt;string&gt;</code>          | menu icon class                                                                                    |
| options.menuItems[].style     | <code>Object</code>                        | menu item style                                                                                    |
| options.menuItems[].iconStyle | <code>Object</code>                        | menu item icon style                                                                               |
| options.menuTopOffset         | <code>number</code> \| <code>string</code> | the offset from the top of the menu relative screen, default 0.                                    |
| options.menuStyle             | <code>Object</code>                        | the menu style                                                                                     |
| options.menuStyle.menu        | <code>Object</code>                        | the menu style                                                                                     |
| options.menuStyle.triangle    | <code>Object</code>                        | the triangle style                                                                                 |
| options.menuStyle.item        | <code>Object</code>                        | the sub menu style                                                                                 |
| options.menuStyle.icon        | <code>Object</code>                        | the sub menu icon style                                                                            |
| options.disableTapHighlight   | <code>boolean</code>                       | disable highlight when tap                                                                         |
| options.cursor                | <code>Object</code>                        | cursor config                                                                                      |
| options.cursor.color          | <code>string</code>                        | cursor color                                                                                       |
| options.cursor.same           | <code>boolean</code>                       | whether the cursor is in the same direction                                                        |
| options.mask                  | <code>Object</code>                        | mask config                                                                                        |
| options.mask.color            | <code>string</code>                        | mask color                                                                                         |
| options.highlight             | <code>Object</code>                        | highlight config                                                                                   |
| options.highlight.color       | <code>string</code>                        | highlight color                                                                                    |
| options.scrollSpeedLevel      | <code>number</code>                        | The speed of scrolling when touching bottom, default 4                                             |
| options.scrollOffsetBottom    | <code>number</code> \| <code>string</code> | triggering scrolling, distance from the bottom, default 100                                        |
| options.markdownOptions       | <code>Object</code>                        | Customize options about the mapping relations between HTML and Markdown                            |
| options.regions               | <code>Array.&lt;Object&gt;</code>          | In region mode, all region info                                                                    |
| options.regions[].text        | <code>string</code>                        | region text                                                                                        |
| options.regions[].top         | <code>number</code>                        | region top                                                                                         |
| options.regions[].left        | <code>number</code>                        | region left                                                                                        |
| options.regions[].width       | <code>number</code>                        | region width                                                                                       |
| options.regions[].height      | <code>number</code>                        | region height                                                                                      |
| options.disableSelect         | <code>boolean</code>                       | disabled select                                                                                    |

**Example**

```js
// A simple example
const em = new EasyMarker({
  menuTopOffset: '2rem',
  menuItems: [
    {
      text: '划线笔记',
      id: 1
    },
    {
      text: '分享',
      style: {
        backgroundColor: '#407ff2',
        paddingLeft: '0.5rem'
      },
      id: 2
    },
    {
      text: '复制',
      id: 3
    }
  ],
 )

 em.create(document.querySelector('.article-body'),
   document.body,
   document.querySelectorAll('.article-body>:not(.text)')

// a markdown example
const em = new EasyMarker({
menuTopOffset:'2rem',
scrollSpeedLevel: 6,
scrollOffsetBottom: '1.5rem',
  menuItems: [
    {
      text: '划线笔记',
      id: 1,
      iconName:'iconfont icon-mark'
    },
    {
      text: '分享',
      style: {
        backgroundColor: '#407ff2',
        paddingLeft: '0.5rem'
      },
      id: 2,
      iconName:'iconfont icon-share'
    },
    {
      text: '复制',
      id: 3,
      iconName:'iconfont icon-copy'
    }
  ],
// Not required
 markdownOptions: {
  H1: text => `\n# ${text}\n\n`,
  H2: text => `\n## ${text}\n\n`,
  H3: text => `\n### ${text}\n\n`,
  H4: text => `\n#### ${text}\n\n`,
  H5: text => `\n##### ${text}\n\n`,
  H6: text => `\n###### ${text}\n\n`,
  P: text => `${text}\n\n`,
  FIGCAPTION: text => `${text}\n\n`,
  STRONG: text => `**${text}**`,
  B: text => `**${text}**`,
  EM: text => `*${text}*`,
  I: text => `*${text}*`,
  S: text => `~~${text}~~`,
  INS: text => `++${text}++`,
  // IMG
  // option.alt: IMG alt
  // option.src: IMG src
  // option.width: IMG width
  // option.height: IMG height
  IMG: option => `![${option.alt}](${option.src}?size=${option.width}x${option.height})\n`,
  // UL
  // option.listLevel: List nesting level
  UL: (text, option) => {
    if (option.listLevel > 1) {
      return `\n${text}`
    }
    return `\n${text}\n`
  },
  // OL
  // option.listLevel: List nesting level
  OL: (text, option) => {
    if (option.listLevel > 1) {
      return `\n${text}`
    }
    return `\n${text}\n`
  },
  // LI
  // option.type: parentNode nodeName,
  // option.isLastOne: Whether the last item in the list
  // option.itemLevel: List nesting level
  // option.hasChild: Is the node has child node
  // option.index: The index in the list
  LI: (text, option) => {
    let spaceString = ''
    for (let i = 1; i < option.itemLevel; i++) { spaceString += '    ' }
    let endString = '\n'
    if (option.hasChild || option.isLastOne) {
      endString = ''
    }
    if (option.type === 'UL') { return `${spaceString}- ${text}${endString}` }
    return `${spaceString}${option.index}. ${text}${endString}`
  },
 }
})

em.create(document.querySelector('.article-body'), document.body)
em.onMenuClick((id, data) => {
  console.log('You click the menu!');
  console.log(id, data);
});

A Region example

const em = new EasyMarker({
 regions: texts,
 menuTopOffset: '120px',
 scrollSpeedLevel: 6,
 scrollOffsetBottom: '1.5rem',
 mask: {
   color: '#407ff2',
 },
 menuStyle: {
   menu: {},
   item: {
     fontSize: '15px',
     padding: '0px 10px',
     lineHeight: '30px',
   },
   triangle: {},
 },
 menuItems: [
   {
     text: '划线',
     type: 'select',
     iconName: 'iconfont mark',
     id: '302',
     style: {
       backgroundColor: 'yellow',
       paddingLeft: '1rem',
     },
     iconStyle: {
       background: 'green',
     },
   },
   {
     text: '删除划线',
     type: 'highlight',
     iconName: 'iconfont icon-delete',
     id: '302',
   },
   {
     id: 222,
     text: '复制',
     iconName: 'iconfont icon-copy',
   },
  ],
});

em.onMenuClick(function (id, data) {
  console.log('You click the menu!', id, data);
});

em.onSelectStatusChange((val) => {
  console.log('onSelectStatusChange', val);
});

em.create(document.body);
```

<a name="EasyMarker+create"></a>

### easyMarker.create(containerElement, [scrollContainerElement], options)

Initialization

**Kind**: instance method of [<code>EasyMarker</code>](#EasyMarker)

| Param                    | Type                     | Description                            |
| ------------------------ | ------------------------ | -------------------------------------- |
| containerElement         | <code>HTMLElement</code> | container element                      |
| [scrollContainerElement] | <code>HTMLElement</code> | scroll container element               |
| options                  | <code>Object</code>      | options                                |
| options.includeElements  | <code>Object</code>      | included elements                      |
| options.excludeElements  | <code>Object</code>      | not included elements, Higher priority |

<a name="EasyMarker+highlightLine"></a>

### easyMarker.highlightLine(selection, [id], [meta])

Highlight the lines between the specified nodes

**Kind**: instance method of [<code>EasyMarker</code>](#EasyMarker)

| Param                  | Type                | Description              |
| ---------------------- | ------------------- | ------------------------ |
| selection              | <code>Object</code> | selection                |
| selection.anchorNode   | <code>Node</code>   | start node               |
| selection.anchorOffset | <code>number</code> | start node's text offset |
| selection.focusNode    | <code>Node</code>   | end node                 |
| selection.focusOffset  | <code>number</code> | start node's text offset |
| [id]                   | <code>\*</code>     | line id                  |
| [meta]                 | <code>\*</code>     | meta information         |

**Example**

```js
const id = 2;
const selection = {
  anchorNode: textNodeA,
  anchorOffset: 1,
  focusNode: textNodeB,
  focusOffset: 2,
};
const meta = { someKey: 'someValue' };
em.highlightLine(selection, id, meta);
```

<a name="EasyMarker+highlightLines"></a>

### easyMarker.highlightLines(lines)

Highlight multiple lines

**Kind**: instance method of [<code>EasyMarker</code>](#EasyMarker)

| Param                          | Type                              |
| ------------------------------ | --------------------------------- |
| lines                          | <code>Array.&lt;Object&gt;</code> |
| [lines[].id]                   | <code>\*</code>                   |
| [lines[].meta]                 | <code>\*</code>                   |
| lines[].selection              | <code>Object</code>               |
| lines[].selection.anchorNode   | <code>Node</code>                 |
| lines[].selection.anchorOffset | <code>number</code>               |
| lines[].selection.focusNode    | <code>Node</code>                 |
| lines[].selection.focusOffset  | <code>number</code>               |

**Example**

```js
const id = 2;
const selection = {
  anchorNode: textNodeA,
  anchorOffset: 1,
  focusNode: textNodeB,
  focusOffset: 2,
};
const meta = { someKey: 'someValue' };
em.highlightLines([{ selection, id, meta }]);
```

<a name="EasyMarker+cancelHighlightLine"></a>

### easyMarker.cancelHighlightLine(id) ⇒ <code>boolean</code>

Cancel highlight

**Kind**: instance method of [<code>EasyMarker</code>](#EasyMarker)

| Param | Type            | Description |
| ----- | --------------- | ----------- |
| id    | <code>\*</code> | line ID     |

<a name="EasyMarker+onHighlightLineClick"></a>

### easyMarker.onHighlightLineClick(cb)

Highlight line click handler

**Kind**: instance method of [<code>EasyMarker</code>](#EasyMarker)

| Param | Type                                                                             |
| ----- | -------------------------------------------------------------------------------- |
| cb    | [<code>highlightLineClickHandler</code>](#EasyMarker..highlightLineClickHandler) |

<a name="EasyMarker+onSelectStatusChange"></a>

### easyMarker.onSelectStatusChange(cb)

Select status changing callback

**Kind**: instance method of [<code>EasyMarker</code>](#EasyMarker)

| Param | Type                  |
| ----- | --------------------- |
| cb    | <code>function</code> |

<a name="EasyMarker+onMenuClick"></a>

### easyMarker.onMenuClick(cb)

menu item click handler

**Kind**: instance method of [<code>EasyMarker</code>](#EasyMarker)

| Param | Type                                                           |
| ----- | -------------------------------------------------------------- |
| cb    | [<code>menuClickHandler</code>](#EasyMarker..menuClickHandler) |

<a name="EasyMarker+registerEventHook"></a>

### easyMarker.registerEventHook(cb)

Register event hook

**Kind**: instance method of [<code>EasyMarker</code>](#EasyMarker)

| Param | Type            |
| ----- | --------------- |
| cb    | <code>\*</code> |

<a name="EasyMarker+destroy"></a>

### easyMarker.destroy()

Destroy instance

**Kind**: instance method of [<code>EasyMarker</code>](#EasyMarker)  
<a name="EasyMarker.create"></a>

### EasyMarker.create(containerElement, [scrollContainerElement], options) ⇒ [<code>EasyMarker</code>](#EasyMarker)

Initialization factory

**Kind**: static method of [<code>EasyMarker</code>](#EasyMarker)

| Param                    | Type                     | Description                            |
| ------------------------ | ------------------------ | -------------------------------------- |
| containerElement         | <code>HTMLElement</code> | container element                      |
| [scrollContainerElement] | <code>HTMLElement</code> | scroll container element               |
| options                  | <code>Object</code>      | options                                |
| options.includeElements  | <code>Object</code>      | included elements                      |
| options.excludeElements  | <code>Object</code>      | not included elements, Higher priority |

<a name="EasyMarker..menuClickHandler"></a>

### EasyMarker~menuClickHandler : <code>function</code>

Menu item click handler

**Kind**: inner typedef of [<code>EasyMarker</code>](#EasyMarker)

| Param                  | Type                | Description              |
| ---------------------- | ------------------- | ------------------------ |
| id                     | <code>\*</code>     | menu ID                  |
| selection              | <code>Object</code> | selection                |
| selection.anchorNode   | <code>Node</code>   | start node               |
| selection.anchorOffset | <code>number</code> | start node's text offset |
| selection.focusNode    | <code>Node</code>   | end node                 |
| selection.focusOffset  | <code>number</code> | start node's text offset |

<a name="EasyMarker..highlightLineClickHandler"></a>

### EasyMarker~highlightLineClickHandler : <code>function</code>

Menu item click handler

**Kind**: inner typedef of [<code>EasyMarker</code>](#EasyMarker)

| Param                  | Type                | Description              |
| ---------------------- | ------------------- | ------------------------ |
| id                     | <code>\*</code>     | line ID                  |
| meta                   | <code>\*</code>     | meta information         |
| selection              | <code>Object</code> | selection                |
| selection.anchorNode   | <code>Node</code>   | start node               |
| selection.anchorOffset | <code>number</code> | start node's text offset |
| selection.focusNode    | <code>Node</code>   | end node                 |
| selection.focusOffset  | <code>number</code> | start node's text offset |
