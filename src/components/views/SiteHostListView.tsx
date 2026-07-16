import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { DataTable } from '../DataTable/DataTable';
import { PageHeader } from '../PageHeader/PageHeader';

export interface HostRow {
  id: number;
  host: string;
  siteName: string;
  surface: 'admin' | 'site' | 'api';
  status: 'pending' | 'verified' | 'active';
  active: boolean;
}

export interface SiteHostListViewProps {
  hosts: HostRow[];
  loading?: boolean;
  createHref?: string;
  verifyHref?: (host: HostRow) => string;
}

const statusTone = {
  pending: 'warning',
  verified: 'accent',
  active: 'success',
} as const;

export function SiteHostListView({
  hosts,
  loading = false,
  createHref = '/admin/hosts/new',
  verifyHref = (host) => `/admin/hosts/${host.id}/verify`,
}: SiteHostListViewProps) {
  return (
    <div className="wh-ui">
      <PageHeader
        title="Hosts"
        description="Domain names mapped to sites and surfaces (admin, site, api)."
        actions={
          <a href={createHref}>
            <Button>Add host</Button>
          </a>
        }
      />
      <DataTable
        loading={loading}
        rows={hosts}
        rowKey={(row) => row.id}
        emptyMessage="No hosts configured."
        columns={[
          { key: 'host', header: 'Hostname', render: (row) => <code>{row.host}</code> },
          { key: 'site', header: 'Site', render: (row) => row.siteName },
          {
            key: 'surface',
            header: 'Surface',
            render: (row) => <Badge tone="accent">{row.surface}</Badge>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge>,
          },
          {
            key: 'actions',
            header: '',
            render: (row) =>
              row.status === 'pending' ? (
                <a href={verifyHref(row)} className="text-[var(--wh-color-accent)] underline">
                  Verify
                </a>
              ) : (
                '—'
              ),
          },
        ]}
      />
    </div>
  );
}
