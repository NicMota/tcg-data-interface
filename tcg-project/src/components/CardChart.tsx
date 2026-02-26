import Chart from 'react-apexcharts'

interface PriceData {
    prices : number[]
    dates : string[]
}
export function CardChart({price_info} : {price_info :PriceData}){


    const cfg = {
        options:{
            chart:{
                id:'chard-bar'
            },
            xaxis:{
                categories: price_info.dates
            }
        },
        series:[
            {
                name:'prices',
                data: price_info.prices
            }
        ]
    }

    return(
        <>
            <Chart
                options = {cfg.options}
                series = {cfg.series}
                type = 'line'
                width='500'
            />
        </>
    )
}