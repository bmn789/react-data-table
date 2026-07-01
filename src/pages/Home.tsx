import React from 'react';
import { Container, Box, CircularProgress, Alert } from '@mui/material';
import { Filter } from 'lucide-react';
import { Chip, Rating, Tooltip, Typography } from '@mui/material';
import { PageHeader, PageBreadcrumbs } from './layout/PageHeader';
import type { Employee } from '../types/employee';
import type { FilterFieldConfig, FilterRule } from '../types/filter';
import { DashboardStats } from '../components/DashboardStats';
import { FilterBuilder } from '../components/FilterBuilder';
import { DataTable, type ColumnDef } from '../components/table';
import { filterData } from '../utils/filterEngine';
import rawEmployees from '../data/employees.json';

const employeeFilterConfigs: FilterFieldConfig[] = [
  { id: 'name', label: 'Name', type: 'text', placeholder: 'Search name...' },
  { id: 'email', label: 'Email', type: 'text', placeholder: 'Search email...' },
  {
    id: 'department',
    label: 'Department',
    type: 'select',
    options: [
      { label: 'Engineering', value: 'Engineering' },
      { label: 'Product', value: 'Product' },
      { label: 'Sales', value: 'Sales' },
      { label: 'Marketing', value: 'Marketing' },
      { label: 'HR', value: 'HR' },
      { label: 'Finance', value: 'Finance' },
      { label: 'Design', value: 'Design' },
      { label: 'Operations', value: 'Operations' },
      { label: 'Legal', value: 'Legal' },
    ],
  },
  { id: 'role', label: 'Role', type: 'text', placeholder: 'Search role (e.g., Software Engineer)...' },
  { id: 'salary', label: 'Salary', type: 'amount', placeholder: 'Salary range...' },
  { id: 'joinDate', label: 'Join Date', type: 'date' },
  { id: 'isActive', label: 'Status', type: 'boolean' },
  { id: 'address.city', label: 'City', type: 'text' },
  { id: 'address.state', label: 'State', type: 'text' },
  { id: 'address.country', label: 'Country', type: 'text' },
  {
    id: 'skills',
    label: 'Skills',
    type: 'array',
    options: [
      { label: 'React', value: 'React' },
      { label: 'TypeScript', value: 'TypeScript' },
      { label: 'Node.js', value: 'Node.js' },
      { label: 'Python', value: 'Python' },
      { label: 'Go', value: 'Go' },
      { label: 'Java', value: 'Java' },
      { label: 'AWS', value: 'AWS' },
      { label: 'Docker', value: 'Docker' },
      { label: 'Kubernetes', value: 'Kubernetes' },
      { label: 'SQL', value: 'SQL' },
      { label: 'GraphQL', value: 'GraphQL' },
      { label: 'UI/UX Design', value: 'UI/UX Design' },
      { label: 'Figma', value: 'Figma' },
      { label: 'Agile', value: 'Agile' },
      { label: 'Product Strategy', value: 'Product Strategy' },
    ],
  },
  { id: 'performanceRating', label: 'Performance Rating', type: 'number' },
];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const getRatingColor = (
  rating: number
): 'success' | 'info' | 'warning' | 'error' => {
  if (rating >= 4.5) return 'success';
  if (rating >= 3.5) return 'info';
  if (rating >= 2.5) return 'warning';
  return 'error';
};

// Employee column definitions using the shared ColumnDef interface
const employeeColumns: ColumnDef<Record<string, unknown>>[] = [
  {
    key: 'id',
    label: 'ID',
    minWidth: 70,
    render: row => (
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        #{String(row.id)}
      </Typography>
    ),
  },
  {
    key: 'name',
    label: 'Name',
    minWidth: 180,
    render: row => {
      const emp = row as unknown as Employee;
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {emp.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {emp.email}
          </Typography>
        </Box>
      );
    },
  },
  {
    key: 'department',
    label: 'Department',
    minWidth: 140,
    render: row => (
      <Chip
        label={String(row.department)}
        size="small"
        sx={{
          fontWeight: 550,
          bgcolor: 'rgba(99, 102, 241, 0.08)',
          color: 'primary.main',
          borderRadius: 1.5,
        }}
      />
    ),
  },
  {
    key: 'role',
    label: 'Role',
    minWidth: 160,
    sortable: false,
    render: row => (
      <Typography variant="body2" sx={{ color: 'text.primary' }}>
        {String(row.role)}
      </Typography>
    ),
  },
  {
    key: 'salary',
    label: 'Salary',
    minWidth: 110,
    render: row => (
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {formatCurrency(Number(row.salary))}
      </Typography>
    ),
  },
  {
    key: 'joinDate',
    label: 'Join Date',
    minWidth: 120,
    render: row => formatDate(String(row.joinDate)),
  },
  {
    key: 'isActive',
    label: 'Status',
    minWidth: 90,
    sortable: false,
    render: row => (
      <Chip
        label={row.isActive ? 'Active' : 'Inactive'}
        size="small"
        color={row.isActive ? 'success' : 'default'}
        variant={row.isActive ? 'filled' : 'outlined'}
        sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem' }}
      />
    ),
  },
  {
    key: 'address',
    label: 'Location',
    minWidth: 160,
    sortable: false,
    render: row => {
      const emp = row as unknown as Employee;
      return (
        <Box>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {emp.address.city}, {emp.address.state}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {emp.address.country}
          </Typography>
        </Box>
      );
    },
  },
  {
    key: 'skills',
    label: 'Skills',
    minWidth: 220,
    sortable: false,
    render: row => {
      const emp = row as unknown as Employee;
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 220 }}>
          {emp.skills.map(skill => (
            <Chip
              key={skill}
              label={skill}
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          ))}
        </Box>
      );
    },
  },
  {
    key: 'performanceRating',
    label: 'Rating',
    minWidth: 140,
    align: 'right',
    render: row => {
      const rating = Number(row.performanceRating);
      return (
        <Tooltip title={`Score: ${rating}`} placement="top" arrow>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Rating value={rating} precision={0.1} readOnly size="small" sx={{ mb: 0.5 }} />
            <Chip
              label={rating.toFixed(1)}
              size="small"
              color={getRatingColor(rating)}
              sx={{ fontWeight: 700, height: 18, fontSize: '0.65rem' }}
            />
          </Box>
        </Tooltip>
      );
    },
  },
];

export const Home: React.FC = () => {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [rules, setRules] = React.useState<FilterRule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setEmployees(rawEmployees as Employee[]);
      } catch (err: any) {
        setError(err.message || 'Failed to load employee list.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filteredEmployees = React.useMemo(
    () => filterData(employees, rules, employeeFilterConfigs),
    [employees, rules]
  );

  return (
    <Box>
      <PageHeader
        icon={<Filter size={24} color="#ffffff" />}
        title="Employee Directory"
      />
      <Container maxWidth={false} sx={{ pt: 2, pb: 6, px: { xs: 2, sm: 3, md: 4 } }}>
        <PageBreadcrumbs />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={48} thickness={4} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>
        )}

        {!loading && !error && (
          <>
            <DashboardStats
              totalCount={employees.length}
              filteredCount={filteredEmployees.length}
              filteredEmployees={filteredEmployees}
            />
            <FilterBuilder
              configs={employeeFilterConfigs}
              rules={rules}
              onChange={setRules}
            />
            <DataTable
              title="Employees Database"
              data={filteredEmployees as unknown as Record<string, unknown>[]}
              columns={employeeColumns}
              filterConfigs={employeeFilterConfigs}
              activeFilterCount={rules.length}
              maxHeight={600}
            />
          </>
        )}
      </Container>
    </Box>
  );
};
