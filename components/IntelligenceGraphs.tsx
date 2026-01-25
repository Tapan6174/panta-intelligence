
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { DashboardData } from '../types';

interface GraphProps {
  data: DashboardData;
  isDark?: boolean;
}

const formatNumber = (val: number) => 
  new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`glass p-3 border ${isDark ? 'border-white/20 text-slate-100' : 'border-black/10 text-slate-900'} rounded-none text-[10px] font-mono shadow-2xl`}>
        <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>{new Date(label).toLocaleDateString()}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value > 1000 ? formatNumber(entry.value) : entry.value.toFixed(4)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const MarketCapChart: React.FC<GraphProps> = ({ data, isDark = true }) => {
  const chartData = data.history.market_caps.map(p => ({ time: p[0], mcap: p[1] }));
  const color = "#06b6d4";
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorMcap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="time" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={false} />
        <Area type="monotone" dataKey="mcap" name="Market Cap" stroke={color} fillOpacity={1} fill="url(#colorMcap)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const CirculatingSupplyChart: React.FC<GraphProps> = ({ data, isDark = true }) => {
  const chartData = data.history.market_caps.map((cap, i) => {
    const price = data.history.prices[i][1];
    return {
      time: cap[0],
      supply: cap[1] / price
    };
  });
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="time" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={false} />
        <Area type="monotone" dataKey="supply" name="Supply" stroke="#22c55e" fillOpacity={1} fill="url(#colorSupply)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const SupplyCompositionChart: React.FC<GraphProps> = ({ data, isDark = true }) => {
  const { total_supply, max_supply, circulating_supply } = data.summary;
  const pieData = [
    { name: 'Circulating', value: circulating_supply, color: '#22c55e' },
    { name: 'Locked/Unissued', value: (max_supply || total_supply || circulating_supply) - circulating_supply, color: isDark ? '#1e293b' : '#cbd5e1' },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          innerRadius={60}
          outerRadius={80}
          paddingAngle={0}
          dataKey="value"
          stroke="none"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip isDark={isDark} />} />
        <Legend verticalAlign="bottom" height={36}/>
      </PieChart>
    </ResponsiveContainer>
  );
};

export const ValuationComparisonChart: React.FC<GraphProps> = ({ data, isDark = true }) => {
  const barData = [
    { name: 'Market Cap', value: data.summary.market_cap, fill: '#22c55e' },
    { name: 'FDV', value: data.summary.fully_diluted_valuation || data.summary.market_cap, fill: '#06b6d4' },
  ];
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";
  const tickColor = isDark ? "#94a3b8" : "#64748b";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickColor }} />
        <YAxis hide domain={[0, 'auto']} />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={false} />
        <Bar dataKey="value" radius={0} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const FDVGapChart: React.FC<GraphProps> = ({ data, isDark = true }) => {
  const { max_supply, circulating_supply } = data.summary;
  const ratio = max_supply ? max_supply / circulating_supply : 1;
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";
  
  const chartData = data.history.market_caps.map((point) => {
    const mcap = point[1];
    const fdv = mcap * ratio;
    return {
      time: point[0],
      gap: fdv - mcap
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorGap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="time" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={false} />
        <Area type="monotone" dataKey="gap" name="FDV Gap" stroke="#06b6d4" fillOpacity={1} fill="url(#colorGap)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const PriceChart: React.FC<GraphProps> = ({ data, isDark = true }) => {
  const chartData = data.history.prices.map(p => ({ time: p[0], price: p[1] }));
  const color = data.summary.price_change_percentage_24h >= 0 ? "#22c55e" : "#f43f5e";
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="time" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={false} />
        <Area type="monotone" dataKey="price" name="Price" stroke={color} fillOpacity={1} fill="url(#colorPrice)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const CorrelationChart: React.FC<GraphProps> = ({ data, isDark = true }) => {
  const chartData = data.history.prices.map((p, i) => ({
    time: p[0],
    price: p[1],
    mcap: data.history.market_caps[i][1]
  }));
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="time" hide />
        <YAxis yAxisId="left" hide />
        <YAxis yAxisId="right" orientation="right" hide />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={false} />
        <Line yAxisId="left" type="monotone" dataKey="price" name="Price" stroke="#22c55e" dot={false} strokeWidth={2} />
        <Line yAxisId="right" type="monotone" dataKey="mcap" name="M.Cap" stroke="#06b6d4" dot={false} strokeWidth={1} strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const ATHDistanceChart: React.FC<GraphProps> = ({ data, isDark = true }) => {
  const ath = data.summary.ath;
  const chartData = data.history.prices.map(p => ({
    time: p[0],
    distance: ((ath - p[1]) / ath) * 100
  }));
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="time" hide />
        <YAxis hide domain={[0, 100]} reversed />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={false} />
        <Area type="step" dataKey="distance" name="Dist. from ATH %" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDistance)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};