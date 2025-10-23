import React, { useEffect, useRef, useState } from 'react'
import { LuSearch } from 'react-icons/lu'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const Search = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams, setSearchParams] = useSearchParams()
  const [localQuery, setLocalQuery] = useState(searchParams.get("search") || "");
  const navigate = useNavigate()
  const debounceTimeoutRef = useRef<number | null>(null);

  // Cleanup debounce เมื่อ component unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceTimeoutRef.current!);
    };
  }, []);  

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setLocalQuery('');
    setSearchParams({});
  }

  // Handle 'Enter' key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(debounceTimeoutRef.current!);  
       if (localQuery.trim()) {
          const newPath = `/menu/${sessionId}?search=${localQuery.trim()}`; 
          navigate(newPath);
      } else if (sessionId) {
          navigate(`/menu/${sessionId}`);
      }
    }
  };

  return (
    <form>
      <div className='flex justify-center pt-2'>
        <div className="flex items-center bg-zinc-300 rounded-full px-3 py-2 text-sm text-[#6D6D71] w-80">
          <LuSearch className="mr-2 text-lg" />
          <input 
            type="search" 
            value={localQuery}
            onChange={handleChange}
            placeholder="search your favorite food..."
            onKeyDown={handleKeyPress}
            className="bg-transparent w-full focus:outline-none appearance-none" 
      
          />
          {/* Clear Button */}
          {localQuery && (
            <button 
            type="button" 
            onClick={clearSearch}
            className="ml-2 text-sm font-medium text-[#6D6D71] hover:text-black"
          >
          </button>  )}
        </div>
      </div>
    </form>
  )
}

export default Search;
