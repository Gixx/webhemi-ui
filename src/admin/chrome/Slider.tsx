import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Chrome `.has-box-indicator` */
  boxIndicator?: boolean;
  /** Wrap in `.is-vertical` for vertical orientation */
  vertical?: boolean;
};

export function Slider({ boxIndicator, vertical, className, ...rest }: SliderProps) {
  const input = (
    <input
      type="range"
      className={cn(boxIndicator && 'has-box-indicator', className)}
      {...rest}
    />
  );

  if (vertical) {
    return <div className="is-vertical">{input}</div>;
  }

  return input;
}
