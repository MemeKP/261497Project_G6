import homepage from "../assets/imgs/homepage.png";
import { FaArrowRightLong } from "react-icons/fa6";
import InPageNavigation from "../components/InPageNavigation";
import MenuList from "../components/MenuList";
import BestSellerList from "../components/BestSellerList";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageAnimation from "../common/PageAnimetion";
import { useEffect } from "react";
import axios from "axios";
import Search from "../components/Search";
import { CartProvider } from "../context/CartContext";
import { useQuery } from "@tanstack/react-query";
import type { MenuItem } from "../types";
import IKImageWrapper from "../components/IKImageWrapper";

const fetchSignatureMenu = async (): Promise<MenuItem[]> => {
  const response = await axios.get('/api/menu_items', {
    params: {
      isSignature: true,
      limit: 1,
      showAll: false,
      sortBy: 'createdAt',
      sortOrder:'desc',
    }
  });

  return response.data.data;
};

const useSignatureMenu = () => {
  return useQuery({
    queryKey: ['signature_menu'],
    queryFn: fetchSignatureMenu,
    staleTime: 5 * 60 * 1000, // 5 นาที
  });
};

const HomePage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: signatureMenus, isLoading, error } = useSignatureMenu();
  useEffect(() => {
    if (sessionId) {
      axios
        .get(`/api/dining_session/${sessionId}`)
        .catch((err) => console.error(err));
    }
  }, [sessionId]);
  console.log('AppWrapper - sessionId:', sessionId);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center mt-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center mt-6">
        Error loading signature menu
      </div>
    );
  }

  return (
    <>
      <div className="w-[400px] bg-[#1B1C20] text-white font-[Epilogue]">
        <CartProvider sessionId={sessionId}>
          <Navbar />
        </CartProvider>
        <div className="px-5">
          <section>
            <div className=" bg-[#1B1C20] text-white font-[Epilogue]">
              {/* SEARCH */}
              <Search />

              {/* NAVIGATION */}
              <InPageNavigation />

              {/* HERO */}
              <div
                className="w-full min-h-129 bg-cover bg-center"
                style={{ backgroundImage: `url(${homepage})` }}
              >
                {/* SIGNATURE MENU */}
                {/* <div className="flex flex-col items-center mt-6 relative">
                <PageAnimation index={0}>
                  <img
                    src={sg1}
                    alt="Signature menu"
                    className="w-72 h-96 relative"
                  />
                </PageAnimation>

                <PageAnimation index={1}>
                  <div className="absolute z-10 left-[150px] top-[330px] w-50 bg-black shadow-[3px_3px_5px_0px_rgba(244,233,32,1.00)] rounded-xl p-3 mt-4">
                    <div className="font-semibold text-base">
                      Enso’s Secret Beef Ramen
                    </div>
                    <div className="font-light text-xs pr-6">
                      A luxurious bowl featuring marinated beef, soft-boiled
                      egg.
                    </div>
                    <Link to={`/details/${sessionId}/4`}>
                      <FaArrowRightLong className="absolute bottom-2 right-2 w-4 h-4 text-white cursor-pointer" />
                    </Link>
                  </div>
                </PageAnimation>
              </div> */}

                <div className="flex flex-col items-center mt-6 relative">
                  {signatureMenus?.map((menu, index) => (
                    <div key={menu.id} className="mb-8">
                      <PageAnimation index={index * 2}>
                        <IKImageWrapper
                          src={menu.imageUrl}
                          alt="signature menu"
                          // width={125}
                          className="w-72 h-96 relative object-cover"
                        />
                        {/* <img
                          src={menu.imageUrl || '/default-image.jpg'}
                          alt={menu.name}
                          className="w-72 h-96 relative object-cover"
                        /> */}
                      </PageAnimation>

                      <PageAnimation index={index * 2 + 1}>
                        <div className="absolute z-10 left-[150px] top-[330px] w-50 bg-black shadow-[3px_3px_5px_0px_rgba(244,233,32,1.00)] rounded-xl p-3 mt-4">
                          <div className="font-semibold text-base">
                            {menu.name}
                          </div>
                          <div className="font-light text-xs pr-6">
                            {menu.description}
                          </div>
                          <Link to={`/details/${sessionId}/${menu.id}`}>
                            <FaArrowRightLong className="absolute bottom-2 right-2 w-4 h-4 text-white cursor-pointer" />
                          </Link>
                        </div>
                      </PageAnimation>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* BEST SELLER */}
          <section className="">
            <h2 className="text-lg font-bold mb-4 text-white">Best Seller</h2>
            <div className="flex gap-4 items-center justify-between">
              {/* Best seller menu */}
              <BestSellerList />
            </div>
          </section>

          {/* MENU LIST */}
          <h1 className="mt-10 text-white font-bold">All Menu</h1>
          <MenuList />
        </div>
      </div> </>
  );
};

export default HomePage;
