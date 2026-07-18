import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Alert } from './components/Alert/Alert';
import { Badge } from './components/Badge/Badge';
import { Button } from './components/Button/Button';
import { Checkbox } from './components/Checkbox/Checkbox';
import { FormField } from './components/FormField/FormField';
import { Icon } from './components/Icon/Icon';
import { Input } from './components/Input/Input';
import { Select } from './components/Select/Select';
import { Modal } from '../admin/components/Modal/Modal';
import { Pagination } from '../admin/components/Pagination/Pagination';

const meta = {
  title: 'Shared/Molecules',
} satisfies Meta;

export default meta;

/** Shared atoms composed with Admin Theme chrome (Modal, Pagination). */
export const Showcase: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(false);
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
        <Pagination page={2} pageCount={5} onPageChange={() => undefined} />
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal
          open={open}
          title="Confirm"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Confirm</Button>
            </>
          }
        >
          Verify ownership for this host?
        </Modal>
      </div>
    );
  },
};
