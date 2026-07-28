import type { InputHTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';

export type TextBoxProps = InputHTMLAttributes<HTMLInputElement>;

/** Single-line text / password / email / … — chrome styles the element itself. */
export function TextBox({ className, type = 'text', ...rest }: TextBoxProps) {
  return <input type={type} className={cn(className)} {...rest} />;
}
