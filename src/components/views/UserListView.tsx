import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { DataTable } from '../DataTable/DataTable';
import { PageHeader } from '../PageHeader/PageHeader';

export interface UserRow {
  id: number;
  email: string;
  roles: string[];
}

export interface UserListViewProps {
  users: UserRow[];
  loading?: boolean;
  createHref?: string;
  editHref?: (user: UserRow) => string;
}

export function UserListView({
  users,
  loading = false,
  createHref = '/admin/users/new',
  editHref = (user) => `/admin/users/${user.id}`,
}: UserListViewProps) {
  return (
    <div className="wh-ui">
      <PageHeader
        title="Users"
        description="Accounts with global roles and optional per-site assignments."
        actions={
          <a href={createHref}>
            <Button>New user</Button>
          </a>
        }
      />
      <DataTable
        loading={loading}
        rows={users}
        rowKey={(row) => row.id}
        emptyMessage="No users yet."
        columns={[
          { key: 'email', header: 'Email', render: (row) => row.email },
          {
            key: 'roles',
            header: 'Roles',
            render: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.roles.map((role) => (
                  <Badge key={role}>{role}</Badge>
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
