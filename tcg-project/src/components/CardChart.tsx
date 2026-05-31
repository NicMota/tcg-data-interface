import type { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts';

interface PriceData {
    prices: number[]
    dates: string[]
}

type Config = {
    options: ApexOptions,
    series: ApexAxisChartSeries
}

export function CardChart({
    price_info
}: {
    price_info: PriceData
}) {

    const cfg: Config = {

        options: {
            chart: {
                id: 'price-chart',
                toolbar: { show: false },
                background: 'transparent',
                animations: {
                    enabled: true,
                    speed: 900,
                },
                sparkline: { enabled: false },
            },

            theme: { mode: 'dark' },

            stroke: {
                curve: 'smooth',
                width: 2.5,
                colors: ['#d4af37'],
            },

            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.28,
                    opacityTo: 0.02,
                    stops: [0, 100],
                    colorStops: [
                        { offset: 0, color: '#d4af37', opacity: 0.28 },
                        { offset: 100, color: '#d4af37', opacity: 0.02 },
                    ],
                },
            },

            grid: {
                borderColor: 'rgba(212,175,55,0.08)',
                strokeDashArray: 4,
                xaxis: { lines: { show: false } },
            },

            xaxis: {
                categories: price_info.dates,
                labels: {
                    style: {
                        colors: '#6b6578',
                        fontSize: '11px',
                        fontFamily: "'DM Sans', sans-serif",
                    },
                    rotate: -30,
                },
                axisBorder: { color: 'rgba(212,175,55,0.1)' },
                axisTicks: { color: 'rgba(212,175,55,0.1)' },
            },

            yaxis: {
                labels: {
                    style: {
                        colors: '#6b6578',
                        fontSize: '11px',
                        fontFamily: "'DM Sans', sans-serif",
                    },
                    formatter: (val: number) => `$${val.toFixed(2)}`,
                },
            },

            tooltip: {
                theme: 'dark',
                style: {
                    fontSize: '12px',
                    fontFamily: "'DM Sans', sans-serif",
                },
                y: {
                    formatter: (val: number) => `$${val.toFixed(2)}`,
                },
                marker: { fillColors: ['#d4af37'] },
            },

            markers: {
                size: 0,
                hover: {
                    size: 6,
                    sizeOffset: 2,
                },
                colors: ['#d4af37'],
                strokeColors: '#0f0e17',
                strokeWidth: 2,
            },

            dataLabels: { enabled: false },

            colors: ['#d4af37'],
        },

        series: [
            {
                name: 'Price USD',
                data: price_info.prices,
            }
        ],
    };

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