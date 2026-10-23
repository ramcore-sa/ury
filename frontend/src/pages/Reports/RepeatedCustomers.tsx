import { useCallback, useEffect, useState } from 'react';
import { call, __ } from '@ury/core';
import { StatCard, DataTable, type DataTableColumn } from '@ury/ui';
import { Users, UserPlus, Repeat, Percent } from 'lucide-react';
import { useBranchContext } from '../../context/BranchContext';
import { DateRangeFilter, type DateRangeValue } from '../../components/reports/DateRangeFilter';
import { BarChartCard } from '../../components/reports/charts/BarChartCard';
import { toApiDate } from '../../lib/reportDate';
import { startOfMonth, endOfDay } from 'date-fns';

interface DayRow {
  date: string;
  total_customers: number;
  new_customers: number;
  repeat_customers: number;
  repeat_rate_percent: number;
}

interface RepeatedCustomersData {
  rows: DayRow[];
  summary: {
    total_customers: number;
    new_customers: number;
    repeat_customers: number;
    avg_repeat_rate_percent: number;
  };
}

// A function, not a constant, so __() runs after the catalogue has loaded.
const getColumns = (): DataTableColumn<DayRow>[] => [
  { key: 'date', header: __('Date') },
  { key: 'total_customers', header: __('Total'), align: 'right' },
  { key: 'new_customers', header: __('New'), align: 'right' },
  { key: 'repeat_customers', header: __('Repeat'), align: 'right' },
  { key: 'repeat_rate_percent', header: __('Repeat Rate'), render: (r) => `${r.repeat_rate_percent}%`, align: 'right' },
];

export function RepeatedCustomers() {
  const { activeBranchId } = useBranchContext();
  const [range, setRange] = useState<DateRangeValue>(() => ({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  }));
  const [data, setData] = useState<RepeatedCustomersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const branch = activeBranchId === 'all' ? undefined : activeBranchId;
      const res = await call<{ message: RepeatedCustomersData }>('ury.ury.report_api.customers.get_repeated_customers', {
        branch,
        start_date: toApiDate(range.from),
        end_date: toApiDate(range.to),
      });
      setData(res.message ?? (res as unknown as RepeatedCustomersData));
    } catch (err) {
      setError(err instanceof Error ? err.message : __('Failed to load report data.'));
    } finally {
      setIsLoading(false);
    }
  }, [activeBranchId, range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">{__('Repeated Customers')}</h1>
          <p className="text-sm text-muted-foreground">
            {__('New vs. repeat visits')}{activeBranchId === 'all' ? ` · ${__('All Branches')}` : ''}
          </p>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && !data ? (
        <div className="text-sm text-muted-foreground">{__('Loading...')}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={__('Total Visits')} value={data.summary.total_customers} icon={<Users className="w-4 h-4" />} />
            <StatCard label={__('New Customers')} value={data.summary.new_customers} icon={<UserPlus className="w-4 h-4" />} />
            <StatCard label={__('Repeat Visits')} value={data.summary.repeat_customers} icon={<Repeat className="w-4 h-4" />} />
            <StatCard
              label={__('Avg Repeat Rate')}
              value={`${data.summary.avg_repeat_rate_percent}%`}
              icon={<Percent className="w-4 h-4" />}
            />
          </div>

          <BarChartCard
            title={__('New vs Repeat Visits')}
            data={data.rows}
            xKey="date"
            yKeys={['new_customers', 'repeat_customers']}
            labels={{ new_customers: __('New Customers'), repeat_customers: __('Repeat Customers') }}
          />

          <DataTable columns={getColumns()} rows={data.rows} isLoading={isLoading} />
        </>
      ) : null}
    </div>
  );
}
