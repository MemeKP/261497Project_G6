import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; 
import MenuList from '../components/MenuList';

const MenuPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams(); 
  const [searchParams] = useSearchParams();
  const query = searchParams.get('search'); 
  const category = searchParams.get('category')

  const clearSearch = () => {
    if (sessionId) {
        navigate(`/homepage/${sessionId}`);
    }
  };

  const getHeadingText = () => {
    if (query && category) {
      return `Search "${query}" in ${category}`
    } else if (query) {
      return `Search result for "${query}"`
    } else if (category) {
      return `${category.charAt(0).toUpperCase() + category.slice(1)} Menu`
    }
    return "All menu items."
  }

  const headingText =  getHeadingText()
  const showClearButton = query || category

  return (
    <>
      <div className='py-4 px-2 flex items-center '>
        <h1 className='text-xl font-bold text-white'>{headingText}</h1>
        
        {showClearButton && (
          <button 
            onClick={clearSearch} 
            className='ml-2 cursor-pointer text-lg font-bold text-blue-100 hover:text-red-700 focus:outline-none '
          >
            ✕
          </button>
        )}
      </div>
      
      <MenuList/> 
    </>
  );
};

export default MenuPage;