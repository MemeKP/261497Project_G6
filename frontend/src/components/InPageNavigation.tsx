import { useNavigate, useParams } from "react-router-dom";

const InPageNavigation = () => {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>();
 
  const category = [
    {label: "All", value: ""},
    {label: "Noodles", value: "Noodle"},
    {label: "Sushi & Sashimi", value: "Sushi"},
    {label: "Appetizers", value: "Appetizer"},
    {label: "Rice", value: "Rice"},
    {label: "Desserts", value: "Dessert"},
    {label: "Drinks", value: "Drink"},
  ];

  const handleCategory = (categoryVal: string) =>{
    if (sessionId) {
      if (categoryVal) {
        navigate(`/menu/${sessionId}?category=${categoryVal}`)
      } 
    }
  }
  return (
    <>
      <div className="flex flex-nowrap overflow-x-auto no-scrollbar items-center mt-5 px-4">
        {category.map((category, index) => (
          <button
            key={index}
            onClick={()=>handleCategory(category.value)}
            className="text-white pr-3 cursor-pointer hover:text-yellow-400 transition-all duration-200 whitespace-nowrap"
          >
            {category.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default InPageNavigation;
