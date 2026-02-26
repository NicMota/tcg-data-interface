    
import { CardChart } from '../components/CardChart';


export function Charts(){
    
    const mock_card_data = {
        prices:[1.0,1.2,5.3,10.0,100.0,20.0],
        dates:['1/2,2/2,3/2,4/2,5/2,6/2']
    };
    

    return(
        <div className='bg-white h-screen w-screen'>
            <CardChart price_info={mock_card_data}/>
        </div>
    )
}