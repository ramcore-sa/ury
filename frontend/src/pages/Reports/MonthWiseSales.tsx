import { useCallback, useEffect, useState } from 'react';
import { call, formatCurrency, __ } from '@ury/core';
import { StatCard, DataTable, type DataTableColumn } from '@ury/ui';
import { IndianRupee, TrendingUp, Trophy, TrendingDown } from 'lucide-react';
import { useBranchContext } from '../../context/BranchContext';
import { BarChartCard } from '../../components/reports/charts/BarChartCard';
import { SearchableSelect } from '../../components/common/SearchableSelect';

interface MonthRow {
  year: number;
  month_number: number;
  month_name: string;
  month: string;
  item_total: number;
  taxes: number;
  grand_total: number;
  growth_percentage: number | null;
}

interface MonthWiseSalesData {
  branch: string | null;
  months_back: number;
  data: MonthRow[];
  summary: {
    total_revenue: number;
    average_monthly_revenue: number;
    best_month: string | null;
    worst_month: string | null;
  };
}

// A function, not a constant, so __() runs after the catalogue has loaded.
const getColumns = (): DataTableColumn<MonthRow>[] => [
  { key: 'month', header: __('Month') },
  { key: 'item_total', header: __('Item Total'), render: (r) => formatCurrency(r.item_total), align: 'right' },
  { key: 'taxes', header: __('Taxes'), render: (r) => formatCurrency(r.taxes), align: 'right' },
  { key: 'grand_total', header: __('Grand Total'), render: (r) => formatCurrency(r.grand_total), align: 'right' },
  {
    key: 'growth_percentage',
    header: __('Growth'),
    align: 'right',
    render: (r) =>
      r.growth_percentage === null ? '—' : `${r.growth_percentage > 0 ? '+' : ''}${r.growth_percentage}%`,
  },
];

const MONTH_OPTIONS = [3, 6, 12, 24];

export function MonthWiseSales() {
  const { activeBranchId } = useBranchContext();
  const [monthsBack, setMonthsBack] = useState(6);
  const [data, setData] = useState<MonthWiseSalesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const branch = activeBranchId === 'all' ? undefined : activeBranchId;
      const res = await call<{ message: MonthWiseSalesData }>('ury.ury.report_api.sales.get_month_wise_sales', {
        branch,
        months_back: monthsBack,
      });
      setData(res.message ?? (res as unknown as MonthWiseSalesData));
    } catch (err) {
      setError(err instanceof Error ? err.message : __('Failed to load report data.'));
    } finally {
      setIsLoading(false);
    }
  }, [activeBranchId, monthsBack]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">{__('Month Wise Sales')}</h1>
          <p className="text-sm text-muted-foreground">
            {__('Monthly revenue trend')}{activeBranchId === 'all' ? ` · ${__('All Branches')}` : ''}
          </p>
        </div>
        <div className="w-44">
          <SearchableSelect
            id="months-back"
            value={String(monthsBack)}
            onChange={(_, val) => setMonthsBack(Number(val))}
            options={MONTH_OPTIONS.map((m) => ({
              value: String(m),
              label: __('Last {0} months', [m]),
            }))}
            strict
          />
        </div>
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
            <StatCard
              label={__('Total Revenue')}
              value={formatCurrency(data.summary.total_revenue)}
              icon={<IndianRupee className="w-4 h-4" />}
            />
            <StatCard
              label={__('Avg Monthly')}
              value={formatCurrency(data.summary.average_monthly_revenue)}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard label={__('Best Month')} value={data.summary.best_month ?? '—'} icon={<Trophy className="w-4 h-4" />} />
            <StatCard
              label={__('Weakest Month')}
              value={data.summary.worst_month ?? '—'}
              icon={<TrendingDown className="w-4 h-4" />}
            />
          </div>

          <BarChartCard
            title={__('Monthly Grand Total')}
            data={data.data}
            xKey="month"
            yKeys={['grand_total']}
            labels={{ grand_total: __('Grand Total') }}
          />

          <DataTable columns={getColumns()} rows={data.data} isLoading={isLoading} />
        </>
      ) : null}
    </div>
  );
}
