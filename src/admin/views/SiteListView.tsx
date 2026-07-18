import { Badge } from '../../shared/components/Badge/Badge';
import { Button } from '../../shared/components/Button/Button';
import { DataTable } from '../components/DataTable/DataTable';
import { PageHeader } from '../components/PageHeader/PageHeader';

export interface SiteRow {
  id: number;
  slug: string;
  name: string;
  enabled: boolean;
  hostCount: number;
}

export interface SiteListViewProps {
  sites: SiteRow[];
  loading?: boolean;
  createHref?: string;
  editHref?: (site: SiteRow) => string;
}

export function SiteListView({
  sites,
  loading = false,
  createHref = '/admin/sites/new',
  editHref = (site) => `/admin/sites/${site.id}`,
}: SiteListViewProps) {
  return (
    <div className="wh-ui">
      <PageHeader
        title="Sites"
        description="Multi-tenant sites bound to one or more hostnames."
        actions={
          <a href={createHref}>
            <Button>New site</Button>
          </a>
        }
      />
      <DataTable
        loading={loading}
        rows={sites}
        rowKey={(row) => row.id}
        emptyMessage="No sites yet. Create the first tenant."
        columns={[
          { key: 'name', header: 'Name', render: (row) => row.name },
          { key: 'slug', header: 'Slug', render: (row) => <code>{row.slug}</code> },
          {
            key: 'hosts',
            header: 'Hosts',
            render: (row) => String(row.hostCount),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <Badge tone={row.enabled ? 'success' : 'neutral'}>
                {row.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
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
