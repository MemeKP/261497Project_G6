import React from "react";
import MenuItems from "./MenuItems";

const MenuList = () => {
  return (
    <>
      <div className="flex flex-col items-center ">
        <MenuItems />
        <MenuItems />
        <MenuItems />
        <MenuItems />
      </div>
    </>
  );
};

export default MenuList;
