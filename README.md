# React Data Table — Reusable Filter & Data Table System

A fully type-safe, configuration-driven React 18, TypeScript, and Material UI v9 application featuring a dynamic filter builder, a unified reusable `DataTable` component, and multiple data-driven pages. The system supports nested-field filtering, array-based records, real-time statistics, and column-aware exports — all driven by a flexible client-side engine.

---

## 🚀 Key Features

- **Unified Reusable DataTable**: A single generic `DataTable<T>` component inside `src/components/table/` drives all data pages. Pass `columns: ColumnDef<T>[]` with optional custom `render()` functions — no page-specific table components needed.
- **Configuration-Driven Filters**: Define filter schemas via `FilterFieldConfig[]`. The `FilterBuilder` automatically renders operators and inputs (text, number ranges, date pickers, multi-selects, booleans).
- **Logical AND / OR Filtering**: Combines rules with OR within the same field and AND across different fields.
- **Real-Time Debounced Searching**: Inputs are debounced by 300 ms to keep filtering performant.
- **Interactive Sorting & Pagination**: Sort any column (ascending/descending), choose rows-per-page (10 / 25 / 50), and navigate with prev/next controls.
- **Row Selection with Checkboxes**: Select individual rows or toggle the entire page. A dismissible chip shows the selected count.
- **Dynamic Column Visibility**: Toggle individual columns through the **Columns** modal. Column state is managed per-table instance.
- **Column-Aware Export**: Export the filtered dataset as `.csv` or `.json`. Only currently visible columns are included.
- **Dual Theme (Light & Dark)**: Custom MUI v9 theme with persistent `localStorage` sync. Toggle from the sidebar footer or any page header.
- **Multi-Page App**: Three independent pages — **Employee Directory**, **Users**, and **Transactions** — each wired to its own dataset, filter config, and column definitions.
- **Dashboard Metrics** (Employees page): KPI cards for totals, matching percentage, average salary, and active count.
- **Empty State UI**: Friendly "No matching records" illustration when filters return no results.

---

## 📁 Project Structure

```text
src/
├── components/
│   ├── table/                          # ✅ Reusable table module
│   │   ├── DataTable.tsx               #    Unified generic DataTable<T> component
│   │   ├── ColumnVisibilityModal.tsx   #    Column toggle modal (co-located)
│   │   └── index.ts                    #    Barrel: export { DataTable, ColumnDef, … }
│   ├── DashboardStats.tsx              # KPI summary cards (Employees page)
│   └── FilterBuilder.tsx               # Dynamic filter form & custom inputs
├── data/
│   ├── employees.json                  # 55 mock employee records
│   ├── users.json                      # Mock user records
│   └── transactions.json              # Mock transaction records
├── pages/
│   ├── layout/
│   │   ├── Layout.tsx                  # Shell with sidebar navigation
│   │   └── PageHeader.tsx              # Per-page header with theme toggle
│   ├── Home.tsx                        # Employee Directory page
│   ├── Users.tsx                       # Users page
│   └── Transactions.tsx               # Transactions page
├── types/
│   ├── employee.ts                     # Employee TypeScript interfaces
│   ├── user.ts                         # User TypeScript interfaces
│   ├── transaction.ts                  # Transaction TypeScript interfaces
│   └── filter.ts                       # FilterRule, FilterFieldConfig types
├── utils/
│   └── filterEngine.ts                 # Client-side AND/OR filter execution engine
├── App.tsx                             # Router and ThemeProvider setup
├── index.css                           # Global styles & Google font imports
└── main.tsx                            # Application entry point
```

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation & Run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧩 Using the Reusable DataTable

Import from the `table/` barrel and pass a `columns` array with optional `render` functions:

```tsx
import { DataTable, type ColumnDef } from '../components/table';

type User = { id: number; name: string; email: string; isActive: boolean };

const columns: ColumnDef<Record<string, unknown>>[] = [
  {
    key: 'id',
    label: 'ID',
    minWidth: 70,
    render: row => `#${row.id}`,
  },
  { key: 'name', label: 'Name', minWidth: 160 },
  { key: 'email', label: 'Email', minWidth: 220 },
  {
    key: 'isActive',
    label: 'Status',
    sortable: false,
    render: row => (
      <Chip
        label={row.isActive ? 'Active' : 'Inactive'}
        color={row.isActive ? 'success' : 'default'}
        size="small"
      />
    ),
  },
];

<DataTable
  title="Users"
  data={filteredUsers}
  columns={columns}
  activeFilterCount={rules.length}
  maxHeight={600}
/>
```

### `ColumnDef<T>` Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `key` | `string` | ✅ | Field key on the data row |
| `label` | `string` | ✅ | Column header text |
| `render` | `(row: T) => ReactNode` | — | Custom cell renderer; falls back to `String(row[key])` |
| `sortable` | `boolean` | — | Set `false` to disable sorting. Defaults to `true` |
| `minWidth` | `number` | — | Min column width in px. Defaults to `120` |
| `align` | `'left' \| 'center' \| 'right'` | — | Cell alignment. Defaults to `'left'` |

### `DataTable` Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | ✅ | Shown in the toolbar |
| `data` | `T[]` | ✅ | Pre-filtered rows from the parent |
| `columns` | `ColumnDef<T>[]` | ✅ | Column definitions |
| `activeFilterCount` | `number` | — | Displays an active-filters chip when > 0 |
| `maxHeight` | `number` | — | Scrollable table body height in px. Defaults to `500` |

---

## 🔧 Filter Schema Example

```typescript
import type { FilterFieldConfig } from './types/filter';

const filterConfigs: FilterFieldConfig[] = [
  { id: 'name',     label: 'Name',    type: 'text',    placeholder: 'Search name...' },
  { id: 'salary',   label: 'Salary',  type: 'amount' },
  { id: 'joinDate', label: 'Join Date', type: 'date' },
  { id: 'isActive', label: 'Status',  type: 'boolean' },
  {
    id: 'skills',
    label: 'Skills',
    type: 'array',
    options: [
      { label: 'React',      value: 'React' },
      { label: 'TypeScript', value: 'TypeScript' },
    ],
  },
  { id: 'address.city', label: 'City', type: 'text' },  // nested field support
];
```

---

## 🔍 Supported Filter Operators

| Data Type | Available Operators | Input UI |
|:---|:---|:---|
| **Text** | Contains, Equals, Starts With, Ends With, Does Not Contain | Debounced `TextField` |
| **Number / Amount** | Equals, ≠, >, <, ≥, ≤, Between | Number input / Min–Max row |
| **Date** | Between, Before, After, Relative | Date pickers / Preset ranges |
| **Select** | Is, Is Not | Option dropdown |
| **Array / Multi-Select** | In, Not In, Contains Any, Contains All, Does Not Contain | Checkbox multi-select |
| **Boolean** | Is | Active / Inactive dropdown |

---

## 🎨 Theme System

The application ships with a dual Light/Dark theme built on MUI v9 `ThemeProvider`.

- **Default**: Light mode for first-time visitors.
- **Toggle**: Sun/Moon icon in the sidebar footer **or** any page header.
- **Persistence**: Stored under the `theme-mode` key in `localStorage`; restored on every reload.

---

## 📊 Column Visibility & Export

- **Column Modal**: Click **Columns** in any table toolbar to show/hide individual columns. At least one column is always kept visible.
- **Export CSV / JSON**: Only the currently visible columns are exported. The file is named after the table title (e.g. `employees_database_export.csv`).

---

## 🧠 Design Notes

| Decision | Rationale |
|---|---|
| Single `DataTable<T>` | Replaces the previous `DataTable.tsx` (Employee-specific) and `GenericDataTable.tsx` (generic) with one unified, fully generic component. |
| `table/` folder | Co-locates `DataTable`, `ColumnVisibilityModal`, and the barrel `index.ts` for clean imports. |
| `ColumnDef.render()` | Delegate cell rendering to the consumer so the table core stays data-agnostic (no Employee/Transaction logic inside). |
| Simulated async loading | `Promise` + `setTimeout` mirrors a real API without a backend, keeping the app self-contained. |
| `import type { … }` | Enforced for all type-only imports to comply with strict TypeScript `isolatedModules`. |
| MUI v9 `slotProps` | Replaces deprecated `InputLabelProps`, `inputProps`, etc. with the modern nested slot API. |
| MUI v9 `Grid size` | Uses `<Grid size={{ xs: 6 }}>` instead of the legacy `<Grid item xs={6}>`. |
