import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";

interface PriceData {
  prices: (number | null)[];
  dates: string[];
}

type Config = {
  options: ApexOptions;
  series: ApexAxisChartSeries;
};

export function CardChart({ price_info }: { price_info: PriceData }) {
  const sortedData = price_info.dates
    .map((date, index) => ({
      date,
      price: price_info.prices[index],
    }))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const cfg: Config = {
    options: {
      chart: {
        id: "price-chart",
        toolbar: { show: false },
        background: "transparent",
        animations: {
          enabled: true,
          speed: 900,
        },
        sparkline: { enabled: false },
      },

      theme: { mode: "light" },

      stroke: {
        curve: "straight",
        width: 2.5,
        colors: ["#20765b"],
      },

      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.28,
          opacityTo: 0.02,
          stops: [0, 100],
          colorStops: [
            { offset: 0, color: "#20765b", opacity: 0.28 },
            { offset: 100, color: "#20765b", opacity: 0.02 },
          ],
        },
      },

      grid: {
        borderColor: "rgba(32,118,91,0.08)",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
      },

      xaxis: {
        type: "datetime",
        categories: sortedData.map((item) => Date.parse(item.date)),
        labels: {
          style: {
            colors: "#6b6578",
            fontSize: "11px",
            fontFamily: "'Inter', sans-serif",
          },
          rotate: -30,
        },
        axisBorder: { color: "rgba(32,118,91,0.1)" },
        axisTicks: { color: "rgba(32,118,91,0.1)" },
      },

      yaxis: {
        labels: {
          style: {
            colors: "#6b6578",
            fontSize: "11px",
            fontFamily: "'Inter', sans-serif",
          },
          formatter: (val: number) => `$${val.toFixed(2)}`,
        },
      },

      tooltip: {
        theme: "light",
        style: {
          fontSize: "12px",
          fontFamily: "'Inter', sans-serif",
        },
        y: {
          formatter: (val: number) => `$${val.toFixed(2)}`,
        },
        marker: { fillColors: ["#20765b"] },
      },

      markers: {
        size: 0,
        hover: {
          size: 6,
          sizeOffset: 2,
        },
        colors: ["#20765b"],
        strokeColors: "#0f0e17",
        strokeWidth: 2,
      },

      dataLabels: { enabled: false },

      colors: ["#20765b"],
    },

    series: [
      {
        name: "Price USD",
        data: sortedData.map((item) => item.price),
      },
    ],
  };

  if (!sortedData.some((item) => item.price != null))
    return <p role="status">—</p>;
  return (
    <div className="w-full overflow-hidden" style={{ margin: "0 -8px" }}>
      <Chart
        options={cfg.options}
        series={cfg.series}
        type="area"
        height={360}
      />
    </div>
  );
}
