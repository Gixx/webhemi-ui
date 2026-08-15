import type { JSX } from 'react';
import {
  $applyNodeReplacement,
  type DOMExportOutput,
  type EditorConfig,
  type ElementFormatType,
  type LexicalNode,
  type LexicalUpdateJSON,
  type NodeKey,
  type Spread,
} from 'lexical';
import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import { AccordionPlaceholder } from './AccordionPlaceholder';

export type AccordionItem = {
  id: string;
  title: string;
  body: string;
};

export type SerializedAccordionNode = Spread<
  {
    type: 'wh-accordion';
    version: 1;
    blockId: string;
    items: AccordionItem[];
  },
  SerializedDecoratorBlockNode
>;

function newId(): string {
  return `acc-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultAccordionItems(): AccordionItem[] {
  return [
    { id: newId(), title: 'Section 1', body: '' },
    { id: newId(), title: 'Section 2', body: '' },
  ];
}

export class AccordionNode extends DecoratorBlockNode {
  __blockId: string;
  __items: AccordionItem[];

  static getType(): string {
    return 'wh-accordion';
  }

  static clone(node: AccordionNode): AccordionNode {
    return new AccordionNode(node.__blockId, structuredClone(node.__items), node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedAccordionNode): AccordionNode {
    const node = $createAccordionNode(
      serializedNode.blockId,
      serializedNode.items ?? createDefaultAccordionItems(),
    );
    return node.updateFromJSON(serializedNode);
  }

  constructor(
    blockId: string,
    items: AccordionItem[],
    format?: ElementFormatType,
    key?: NodeKey,
  ) {
    super(format, key);
    this.__blockId = blockId;
    this.__items = items;
  }

  afterCloneFrom(prevNode: this): void {
    super.afterCloneFrom(prevNode);
    this.__blockId = prevNode.__blockId;
    this.__items = structuredClone(prevNode.__items);
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedAccordionNode>): this {
    const self = super.updateFromJSON(serializedNode);
    if (serializedNode.blockId != null) {
      self.__blockId = serializedNode.blockId;
    }
    if (serializedNode.items != null) {
      self.__items = structuredClone(serializedNode.items);
    }
    return self;
  }

  exportJSON(): SerializedAccordionNode {
    return {
      ...super.exportJSON(),
      type: 'wh-accordion',
      version: 1,
      blockId: this.__blockId,
      items: structuredClone(this.__items),
    };
  }

  createDOM(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'wh-doc-block wh-doc-block--accordion';
    return el;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-wh-block', 'accordion');
    element.setAttribute('data-block-id', this.__blockId);
    element.setAttribute('data-items', JSON.stringify(this.__items));
    return { element };
  }

  getBlockId(): string {
    return this.getLatest().__blockId;
  }

  getItems(): AccordionItem[] {
    return structuredClone(this.getLatest().__items);
  }

  setItems(items: AccordionItem[]): void {
    const writable = this.getWritable();
    writable.__items = structuredClone(items);
  }

  decorate(_editor: unknown, _config: EditorConfig): JSX.Element {
    return (
      <AccordionPlaceholder
        nodeKey={this.getKey()}
        blockId={this.__blockId}
        items={this.__items}
      />
    );
  }
}

export function $createAccordionNode(
  blockId: string = newId(),
  items: AccordionItem[] = createDefaultAccordionItems(),
): AccordionNode {
  return $applyNodeReplacement(new AccordionNode(blockId, items));
}

export function $isAccordionNode(
  node: LexicalNode | null | undefined,
): node is AccordionNode {
  return node instanceof AccordionNode;
}
