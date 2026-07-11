import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

function weekday(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });
}

/** 7-day precipitation bar chart + probability/wind line chart from real data. */
export default function WeatherChart({ daily }) {
  const { t } = useTranslation();
  const data = (daily.time || []).map((d, i) => ({
    day: weekday(d),
    precip: daily.precipitation_sum?.[i] ?? 0,
    prob: daily.precipitation_probability_max?.[i] ?? 0,
    wind: daily.windspeed_10m_max?.[i] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-300">
          {t('dashboard.precipitation')}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-ink-200 dark:stroke-ink-800" />
            <XAxis dataKey="day" fontSize={12} stroke="#94a3b8" />
            <YAxis fontSize={12} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }}
              formatter={(v) => [`${v} mm`, t('dashboard.precipitation')]}
            />
            <Bar dataKey="precip" fill="#0d9488" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-300">
          {t('dashboard.rainProbability')} & {t('dashboard.wind')}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-ink-200 dark:stroke-ink-800" />
            <XAxis dataKey="day" fontSize={12} stroke="#94a3b8" />
            <YAxis fontSize={12} stroke="#94a3b8" />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="prob"
              name={t('dashboard.rainProbability')}
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="wind"
              name={`${t('dashboard.wind')} (km/h)`}
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

WeatherChart.propTypes = {
  daily: PropTypes.object.isRequired,
};
