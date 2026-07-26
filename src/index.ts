/** @webhemi/ui — design system with Admin Theme + swappable frontend themes */

// Shared leftovers (moving into themes/default). Form controls that conflict with
// Admin chrome (Button, Checkbox, Select) are not re-exported from the package root —
// import from admin chrome or themes/default paths instead.
export {
  Badge,
  type BadgeProps,
  type BadgeTone,
  Input,
  type InputProps,
  Label,
  type LabelProps,
  FormField,
  type FormFieldProps,
  Alert,
  type AlertProps,
  type AlertTone,
  Icon,
  type IconProps,
  type IconName,
} from './shared';

export * from './admin';
export * from './themes/default';
