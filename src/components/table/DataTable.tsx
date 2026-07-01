import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileDown,
  AlertCircle,
} from 'lucide-react';
import { ColumnVisibilityModal } from './ColumnVisibilityModal';
import type { FilterFieldConfig } from '../../types/filter';

// ─── Column definition ────────────────────────────────────────────────────────

export interface ColumnDef<T = Record<string, unknown>> {
  /** Unique key matching a field on T */
  key: string;
  /** Display header label */
  label: string;
  /**
   * Custom cell renderer. Receives the full row object.
   * Defaults to String(row[key]) when omitted.
   */
  render?: (row: T) => React.ReactNode;
  /** Whether the column is sortable (sorts by raw row[key] value). Default true */
  sortable?: boolean;
  /** Min-width for the column in px */
  minWidth?: number;
  /** Text alignment for column header and cells */
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T extends Record<string, unknown>> {
  /** Human-readable table title shown in the toolbar */
  title: string;
  /** All data rows (pre-filtered by the parent) */
  data: T[];
  /** Column definitions — drives header, body, sort, and export */
  columns: ColumnDef<T>[];
  /** Filter configs — used only to display the active-filter count chip */
  filterConfigs?: FilterFieldConfig[];
  /** Number of active filter rules (shown as a chip in the toolbar) */
  activeFilterCount?: number;
  /** Max height of the scrollable table body (px). Defaults to 500 */
  maxHeight?: number;
}

type SortDir = 'asc' | 'desc';

const PAGE_SIZES = [10, 25, 50];

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T extends Record<string, unknown>>({
  title,
  data,
  columns,
  activeFilterCount = 0,
  maxHeight = 500,
}: DataTableProps<T>) {
  // Sorting
  const [sortKey, setSortKey] = React.useState<string>(columns[0]?.key ?? '');
  const [sortDir, setSortDir] = React.useState<SortDir>('asc');

  // Pagination
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Column visibility — all visible by default
  const [visibleCols, setVisibleCols] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(columns.map(c => [c.key, true]))
  );
  const [colModalOpen, setColModalOpen] = React.useState(false);

  // Row selection
  const [selectedIds, setSelectedIds] = React.useState<Set<string | number>>(new Set());

  // Reset page & selection whenever the source data changes (e.g. after filter)
  React.useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [data]);

  // ── Sorting ─────────────────────────────────────────────────────────────────

  const sorted = React.useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ── Pagination ───────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  // ── Column visibility ────────────────────────────────────────────────────────

  const visibleColumns = columns.filter(c => visibleCols[c.key]);
  const visibleColumnsCount = visibleColumns.length;

  // ── Row selection ────────────────────────────────────────────────────────────

  const pageKeys = paginated.map(row => (row.id ?? '') as string | number);
  const allPageSelected =
    pageKeys.length > 0 && pageKeys.every(k => selectedIds.has(k));
  const somePageSelected =
    pageKeys.some(k => selectedIds.has(k)) && !allPageSelected;

  const handleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageKeys.forEach(k => next.delete(k));
      } else {
        pageKeys.forEach(k => next.add(k));
      }
      return next;
    });
  };

  const handleSelectRow = (key: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Export ───────────────────────────────────────────────────────────────────

  const exportTooltipLabel = `Exporting ${visibleColumnsCount} of ${columns.length} columns`;

  const exportToCSV = () => {
    const headers = visibleColumns.map(c => c.label).join(',');
    const rows = sorted.map(row =>
      visibleColumns
        .map(c => {
          const v = row[c.key];
          const str = v === null || v === undefined ? '' : String(v);
          return str.includes(',') ? `"${str}"` : str;
        })
        .join(',')
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const filtered = sorted.map(row =>
      Object.fromEntries(visibleColumns.map(c => [c.key, row[c.key]]))
    );
    const blob = new Blob([JSON.stringify(filtered, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* ── Toolbar ── */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {/* Left: title + chips */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary' }}>
            {title}
          </Typography>
          <Chip
            size="small"
            label={`${data.length} record${data.length !== 1 ? 's' : ''}`}
            sx={{ bgcolor: 'rgba(99,102,241,0.08)', color: 'primary.main', fontWeight: 600 }}
          />
          {activeFilterCount > 0 && (
            <Chip
              size="small"
              label={`${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
              color="secondary"
              variant="outlined"
            />
          )}
          {selectedIds.size > 0 && (
            <Chip
              size="small"
              label={`${selectedIds.size} selected`}
              color="primary"
              onDelete={() => setSelectedIds(new Set())}
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {/* Right: action buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {/* Column visibility */}
          <Tooltip
            title={`${visibleColumnsCount} of ${columns.length} columns visible`}
            arrow
            placement="top"
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<Eye size={14} />}
              onClick={() => setColModalOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Columns
            </Button>
          </Tooltip>

          {/* Export CSV */}
          <Tooltip title={exportTooltipLabel} arrow placement="top">
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<FileDown size={14} />}
              onClick={exportToCSV}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Export CSV
            </Button>
          </Tooltip>

          {/* Export JSON */}
          <Tooltip title={exportTooltipLabel} arrow placement="top">
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<Download size={14} />}
              onClick={exportToJSON}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Export JSON
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Table ── */}
      <TableContainer sx={{ overflowX: 'auto', maxHeight }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {/* Select-all checkbox */}
              <TableCell
                padding="checkbox"
                sx={{ bgcolor: 'background.paper', py: 1.5 }}
              >
                <Checkbox
                  size="small"
                  checked={allPageSelected}
                  indeterminate={somePageSelected}
                  onChange={handleSelectAll}
                  slotProps={{ input: { 'aria-label': 'select all rows on page' } }}
                />
              </TableCell>

              {visibleColumns.map(col => (
                <TableCell
                  key={col.key}
                  align={col.align ?? 'left'}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    minWidth: col.minWidth ?? 120,
                    bgcolor: 'background.paper',
                    py: 1.5,
                  }}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={sortKey === col.key}
                      direction={sortKey === col.key ? sortDir : 'asc'}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 1}
                  align="center"
                  sx={{ py: 8 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <AlertCircle size={32} color="#9ca3af" />
                    <Typography
                      variant="body1"
                      sx={{ color: 'text.secondary', fontWeight: 500 }}
                    >
                      No matching records found
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Try relaxing your filter parameters or clearing all filters
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, i) => {
                const rowKey = (row.id ?? i) as string | number;
                return (
                  <TableRow
                    key={String(row.id ?? i)}
                    hover
                    selected={selectedIds.has(rowKey)}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSelectRow(rowKey)}
                  >
                    <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        size="small"
                        checked={selectedIds.has(rowKey)}
                        onChange={() => handleSelectRow(rowKey)}
                        slotProps={{ input: { 'aria-label': `select row ${rowKey}` } }}
                      />
                    </TableCell>

                    {visibleColumns.map(col => (
                      <TableCell
                        key={col.key}
                        align={col.align ?? 'left'}
                        sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', py: 1.25 }}
                      >
                        {col.render
                          ? col.render(row)
                          : String(row[col.key] ?? '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Pagination ── */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Showing{' '}
          <strong>{Math.min((page - 1) * pageSize + 1, sorted.length)}</strong>
          {' '}–{' '}
          <strong>{Math.min(page * pageSize, sorted.length)}</strong>
          {' '}of <strong>{sorted.length}</strong> records
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Rows:
          </Typography>
          <Select
            size="small"
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            sx={{ fontSize: '0.8rem', height: 28, minWidth: 60 }}
          >
            {PAGE_SIZES.map(s => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>

          <IconButton
            size="small"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            sx={{ borderRadius: 1.5 }}
          >
            <ChevronLeft size={16} />
          </IconButton>

          <Typography variant="caption" sx={{ minWidth: 60, textAlign: 'center' }}>
            {page} / {totalPages}
          </Typography>

          <IconButton
            size="small"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            sx={{ borderRadius: 1.5 }}
          >
            <ChevronRight size={16} />
          </IconButton>
        </Box>
      </Box>

      {/* ── Column Visibility Modal ── */}
      <ColumnVisibilityModal
        open={colModalOpen}
        onClose={() => setColModalOpen(false)}
        columns={columns.map(c => ({ key: c.key, label: c.label }))}
        visibleColumns={visibleCols}
        onChange={setVisibleCols}
      />
    </Paper>
  );
}
