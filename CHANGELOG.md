# Changelog

## 0.1.x (unreleased)

### Removed

- Host surface option `api` (public API is always path `/api` on site hosts; no `api` host surface).
- Legacy Tailwind admin stack: `AdminLayout`, `Sidebar`, `TopBar`, `PageHeader`, `FlashList`, `DataTable`, `Pagination`, `Modal` (Twig-era; Retro `DesktopModal` / `FloatingModal` remain).
- Legacy pages: `AdminDashboard`, `SitesPage`, `HostsPage`.
- Legacy list views: `SiteListView`, `SiteHostListView`, `UserListView`, `RoleListView`.

Live admin mounts remain `AdminDesktop` and `LoginPage` only. Hub plan: `docs/plan/Remove_Legacy_Admin_UI.md` / `docs/plan/Admin_API_Access_Mode.md`.
