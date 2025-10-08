import { useEffect, useState } from "react";
import BestSeller from "../components/BestSeller";
import axios from "axios";
import type { MenuItem } from "../types";


const BestSellerList = () => {
   const [bestseller, setBestseller] = useState<MenuItem[]>([]);
  
    useEffect(() => {
      const fetchBestseller = async () => {
        try {
          const res = await axios.get<MenuItem[]>("/api/menu_items/bestsellers");
          setBestseller(res.data);
        } catch (error) {
          console.error(
            "[FRONTEND] ERROR: Failed to fetch bestseller data.",
            error
          );
        }
      };
      fetchBestseller();
    }, []);
  return (
     <>
      {bestseller.map((item) => (
        <BestSeller key={item.id} menu={item} />
      ))}
    </> 
  );
};

export default BestSellerList;

