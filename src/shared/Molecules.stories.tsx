import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './components/Badge/Badge';
import { Button } from './components/Button/Button';
import { Checkbox } from './components/Checkbox/Checkbox';
import { FormField } from './components/FormField/FormField';
import { Icon } from './components/Icon/Icon';
import { Input } from './components/Input/Input';
import { Select } from './components/Select/Select';

const meta = {
  title: 'Shared/Molecules',
  tags: ['!autodocs'],
} satisfies Meta;

export default meta;

/** Shared leftover atoms (moving into themes/default). */
function MoleculesShowcase() {
  return (
    <div className="wh-ui space-y-6 p-4">
      <div className="flex gap-2">
        <Badge tone="success">verified</Badge>
        <Badge tone="warning">pending</Badge>
        <Icon name="sites" className="text-xl text-[var(--wh-color-accent)]" />
      </div>
      <FormField label="Hostname" htmlFor="host" required hint="Hostname only, no scheme.">
        <Input id="host" placeholder="www.example.com" />
      </FormField>
      <FormField label="Surface" htmlFor="surface">
        <Select id="surface" defaultValue="site">
          <option value="admin">admin</option>
          <option value="site">site</option>
          <option value="api">api</option>
        </Select>
      </FormField>
      <Checkbox label="Active" defaultChecked />
      <Button type="button">Save</Button>
    </div>
  );
}

export const Showcase: StoryObj = {
  render: () => <MoleculesShowcase />,
};
