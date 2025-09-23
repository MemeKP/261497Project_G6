
const InPageNavigation = () => {
  const category = [
    "All",
    "noodles",
    "Sushi & Sashimi",
    "Appetizers",
    "Desserts",
    "Drinks",
  ];
  return (
    <>
      <div className="flex flex-nowrap overflow-x-auto no-scrollbar items-center mt-5 px-4">
        {category.map((category, index) => (
          <button
            key={index}
            className="text-white pr-3 cursor-pointer hover:text-yellow-400 transition-all duration-200 whitespace-nowrap"
          >
            {category}
          </button>
        ))}
      </div>
    </>
  );
};

export default InPageNavigation;
