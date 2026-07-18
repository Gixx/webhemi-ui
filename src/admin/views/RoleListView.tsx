import { Badge } from '../../shared/components/Badge/Badge';
import { Button } from '../../shared/components/Button/Button';
import { DataTable } from '../components/DataTable/DataTable';
import { PageHeader } from '../components/PageHeader/PageHeader';

export interface RoleRow {
  id: number;
  name: string;
  permissions: string[];
}

export interface RoleListViewProps {
  roles: RoleRow[];
  loading?: boolean;
  createHref?: string;
  editHref?: (role: RoleRow) => string;
}

export function RoleListView({
  roles,
  loading = false,
  createHref = '/admin/roles/new',
  editHref = (role) => `/admin/roles/${role.id}`,
}: RoleListViewProps) {
  return (
    <div className="wh-ui">
      <PageHeader
        title="Roles & permissions"
        description="RBAC roles with permission strings such as site.list."
        actions={
          <a href={createHref}>
            <Button>New role</Button>
          </a>
        }
      />
      <DataTable
        loading={loading}
        rows={roles}
        rowKey={(row) => row.id}
        emptyMessage="No roles defined."
        columns={[
          { key: 'name', header: 'Role', render: (row) => row.name },
          {
            key: 'permissions',
            header: 'Permissions',
            render: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.permissions.map((permission) => (
                  <Badge key={permission} tone="accent">
                    {permission}
                  </Badge>
                ))}
              </div>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <a href={editHref(row)} className="text-[var(--wh-color-accent)] underline">
                Edit
              </a>
            ),
          },
        ]}
      />
    </div>
  );
}
