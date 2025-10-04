import MenuItems from "./MenuItems";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useLocation, useSearchParams } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";

const fetchMenus = async (
  pageParam: number,
  searchQuery: string,
  pathname: string,
  categoryQuery: string | string[],
) => {
  console.log(" fetching menu with: ", {
    pageParam,
    searchQuery,
    pathname,
    categoryQuery,
  });

  let categoryParam = "";
  if (categoryQuery) {
    categoryParam = Array.isArray(categoryQuery)
      ? categoryQuery.filter((c) => c !== "All").join(",")
      : categoryQuery;
  }
  const params = {
    page: pageParam,
    limit: pathname === "/" ? 4 : 10,
    search: searchQuery || "",
    ...(categoryParam && { category: categoryParam }), 
  };

  const res = await axios.get(
    '/api/menu_items',
    {
      params,
    }
  );

  console.log("res data: ", res.data);
  return res.data;
};

const MenuList = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryQuery = searchParams.get("category") || "";

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["menu_items", searchQuery, categoryQuery],
    queryFn: ({ pageParam = 1 }) =>
      fetchMenus(pageParam, searchQuery, location.pathname, categoryQuery),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
  });
  console.log(data);
  if (status === "pending") return "Loading...";

  if (status === "error") return "An error has occurred: " + error.message;

  const allMenus =
    data?.pages
      ?.flatMap((page) => (Array.isArray(page?.data) ? page.data : []))
      .filter((menu) => menu && menu.id) || [];
  console.log("pages:", data?.pages);
  console.log(data);
  console.log("allMenus = ", allMenus);

  return (
    <>
      <InfiniteScroll
        dataLength={allMenus.length}
        next={fetchNextPage}
        hasMore={!!hasNextPage}
        loader={<h4>Loading more menu...</h4>}
      >
        <div className="flex flex-col justify-center items-center">
        {/* map ตาม array ให้ แต่ละอันโชว์ <MenuItems /> */}
        {allMenus
          .filter((menu) => menu && !menu.isSignature)
          .map((menu) => (
            <MenuItems key={menu.id} menu={menu} />
          ))}
          </div>
      </InfiniteScroll>
    </>
  );
};

export default MenuList;
