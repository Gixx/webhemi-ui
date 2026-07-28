import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Multiline text — chrome styles the element itself. */
export function TextArea({ className, ...rest }: TextAreaProps) {
  return <textarea className={cn(className)} {...rest} />;
}
