import MenuItems from "./MenuItems";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { category } from "../config/dummy_data";
import { useLocation, useSearchParams } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";

const fetchMenus = async (
  pageParam: number,
  searchQuery: string,
  pathname: string,
  categoryQuery: string,
  sortQuery: string
) => {
  console.log(" fetching post wiht: ", {
    pageParam,
    searchQuery,
    pathname,
    categoryQuery,
  });
  const res = await axios.get(`${import.meta.env.BACKEND_URL}/menu-items`, {
    params: {
      page: pageParam,
      limit: pathname === "/" ? 2 : 10,
      search: searchQuery || "",
      category: categoryQuery || "", //use for filter
      sort: sortQuery,
    },
  });
  console.log("res data: ", res.data);
  return res.data;
};

const MenuList = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["menu_items", searchQuery, category, sort],
    queryFn: ({ pageParam = 1 }) =>
      fetchMenus(pageParam, searchQuery, location.pathname, category, sort),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
  });
  console.log(data);
  if (status === "pending") return "Loading...";

  if (status === "error") return "An error has occurred: " + error.message;

  const allMenus =
    data?.pages
      ?.flatMap((page) =>
        Array.isArray(page?.menu_items) ? page.menu_items : []
      )
      .filter((menu) => menu && menu.id) || [];
  console.log("pages:", data?.pages);
  console.log(data); //ลองดูผลลัพธ์
  console.log("allMenus = ", allMenus);

  return (
    <>
      <InfiniteScroll
        dataLength={allMenus.length}
        next={fetchNextPage}
        hasMore={!!hasNextPage}
        loader={<h4>Loading more menu...</h4>}
      >
        {/* map ตาม array ให้ แต่ละอันโชว์ <MenuItems /> */}
        {allMenus
          .filter((menu) => menu && menu.id)
          .map((menu) => (
            <MenuItems key={menu.id} menu={menu} />
          ))}
      </InfiniteScroll>
    </>
  );
};

export default MenuList;
{
  /* <div className="flex flex-col items-center ">
        <MenuItems />
        <MenuItems />
        <MenuItems />
        <MenuItems />
      </div> */
}
