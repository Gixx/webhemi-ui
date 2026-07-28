import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Select } from './Select';
import { TextArea } from './TextArea';
import { TextBox } from './TextBox';

/** Underline the first case-insensitive occurrence of `key` in plain text; keep original letter case. */
export function underlineAccessKey(text: string, key: string): ReactNode {
  if (!key) {
    return text;
  }
  const index = text.toLowerCase().indexOf(key.toLowerCase());
  if (index === -1) {
    return text;
  }
  const end = index + key.length;
  return (
    <>
      {text.slice(0, index)}
      <u>{text.slice(index, end)}</u>
      {text.slice(end)}
    </>
  );
}

function underlinePlainChild(child: ReactNode, key: string): ReactNode {
  if (typeof child === 'string' || typeof child === 'number') {
    return underlineAccessKey(String(child), key);
  }
  return child;
}

/** Map children; for `<label>`, underline plain-string / number text. Leaves React-tree children untouched. */
export function applyAccessKeyToLabel(children: ReactNode, key: string): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child) || child.type !== 'label') {
      return child;
    }
    return cloneElement(child, undefined, Children.map(child.props.children, (c) => underlinePlainChild(c, key)));
  });
}

function isFormControl(child: ReactElement): boolean {
  const { type } = child;
  if (type === 'input' || type === 'select' || type === 'textarea') {
    return true;
  }
  return type === TextBox || type === Select || type === TextArea;
}

/** Clone the first form control (`input` / `select` / `textarea` / TextBox / Select / TextArea) with `accessKey`. */
export function applyAccessKeyToControl(children: ReactNode, key: string): ReactNode {
  let applied = false;
  return Children.map(children, (child) => {
    if (applied || !isValidElement(child) || !isFormControl(child)) {
      return child;
    }
    applied = true;
    return cloneElement(child as ReactElement<{ accessKey?: string }>, { accessKey: key });
  });
}
