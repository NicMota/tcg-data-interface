import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import axs from '../axios';
import { Card } from '../components/Card';





function Home() {
  
  const [cards,setCards] = useState([])
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage,setItemsPerPage] = useState(20);
  const [totalPages,setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showFilters,setShowFilters] = useState(true);
  const [foil, setFoil] = useState(false);

  useEffect(()=>
  {
    var fetchCards = async ()=>{
      const {data} = await axs.get('/cards',{
        params: {
          page: currentPage+1,
          limit: itemsPerPage,
          name: search || undefined,
          foil: foil !== undefined ? foil : undefined,
        },
      });

      setCards(data.data);
      setTotalPages(data.totalPages);
      console.log(data);
    }

    fetchCards();
    
  },[currentPage,itemsPerPage,search,foil])

  useEffect(()=>{
    setCurrentPage(0);
  },[search,foil])
  
  function filterCards(e:ChangeEvent<HTMLInputElement>)
  {
    setSearch(e.target.value);
  }
  

  const paginatedCards = cards;
  
  
  const visiblePages = 5; // quantas páginas mostrar
  const half = Math.floor(visiblePages / 2);

  let start = currentPage - half;
  let end = currentPage + half;

  // ajustar limites
  if (start < 0) {
    start = 0;
    end = visiblePages - 1;
  }

  if (end >= totalPages) {
    end = totalPages - 1;
    start = Math.max(0, end - visiblePages + 1);
  }

  function nextPage(){
    if(currentPage < totalPages - 1)
    {
      setCurrentPage(prev=>prev+1);
    } 
  }
  function previousPage(){
    if(currentPage > 0 )
    {
      setCurrentPage(prev=>prev-1);
    } 
  }
  function goToPage(index){
    if(index >= 0 && index < totalPages)
    {
      setCurrentPage(index);
    }
  }
  

  //resolver cartas que não tem imagem, (face_card)
  return (
    <div className='flex flex-col flex-1 bg-blue-200 min-h-screen h-fit'>
      <div className='w-screen flex bg-black h-24'>
        <h1 className='my-auto p-4 text-white text-2xl font-thin tracking-widest italic font-serif'>MAGIC TCG TRACKER</h1>
      </div>

      {/* filter options */}
      <div className='flex items-center justify-between w-full max-w-5xl mx-auto h-24 bg-cyan-950 px-4'>
        <input type='text' value={search} onChange={filterCards}placeholder='Search'className='outline-none bg-white text-black py-2 px-4 text-2xl font-thin rounded-2xl border border-black w-1/3 m-4'/>
        <button  className='bg-black size-fit text-white p-5 transition-all    cursor-pointer font-bold hover:scale-[1.1] animation-easy rounded-2xl'> search </button>
        
        
        <select className=' border-2 outline-none rounded-2xl bg-white size-fit  p-4 border-black'
          value={itemsPerPage}
          onChange={(e)=>{
            setItemsPerPage(Number(e.target.value))
            setCurrentPage(0)
          }}
        >
          <option value='20'> 20 </option>
          <option value='30'> 30 </option>
          <option value='40'> 40 </option>

        </select>

        <button onClick={()=>setShowFilters(true)} className='bg-black size-fit text-white p-5 transition-all  cursor-pointer font-bold hover:scale-[1.1] ease-in-out duration-100 rounded-2xl '>
          filter
        </button>
      </div>
      {showFilters? 
        <div className='bg-blue-950 m-auto h-fit  rounded-2xl items-center justify-between p-10 flex w-full max-w-7xl my-5'>
          <div className='items-center  gap-y-2 flex flex-col'>
            <label className='font-extrabold  bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-600 bg-clip-text text-transparent'> foil </label>
            <input type='checkbox'  
            onChange={(e) => {
              const checked = e.target.checked;
              setFoil(checked ? true : undefined); // marca = filtra foil, desmarca = remove filtro
              setCurrentPage(0);
            }}/>

            <label className='font-extrabold text-white'> mana cost </label>
            <input className='p-2 bg-white rounded w-12' placeholder='0.0' type='number'/>
          </div>
          <div className=''>

          </div>
          <div> 

          </div>
        </div>
        : 
        <>

        </>}
      {/* pagination and cards list  
        if there is cards to show, show these, else tell user that theres no card to see :c
      
      */}
      
      { paginatedCards.length>0 ? 
        <div className=' grid py-24 gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          { 
            
            paginatedCards.map((card,i)=>(
              <Card c={card} key={card.id}/>
            )) 
          }
        </div> 
        : 
        <p className='m-auto font-bold'>nenhuma carta foi encontrada :c</p>
      } 
      
      <div className='m-auto flex gap-x-4'>
          <button className='bg-black p-4 rounded-2xl text-white cursor-pointer transition-all  hover:scale-[1.1] animation-easy' onClick={()=>previousPage()}>
            previous
          </button>
          <div className='flex gap-x-2 items-center'>
            {
              Array.from({ length: end - start + 1 }, (_, i) => {
                const pageIndex = start + i;

                return (
                  <button
                    key={pageIndex}
                    onClick={() => goToPage(pageIndex)}
                    className={`cursor-pointer font-bold ${
                      pageIndex === currentPage ? 'underline text-blue-600' : ''
                    }`}
                  >
                    {pageIndex + 1}
                  </button>
                );
              })
            }
            
          </div>
          <button onClick={()=>nextPage()} className='bg-black p-4 rounded-2xl text-white transition-all  hover:scale-[1.1] animation-easy cursor-pointer '>
            next
          </button>
      </div>
    </div>
  )
}

export default Home
