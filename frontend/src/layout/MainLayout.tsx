import React from 'react'
import { Outlet } from 'react-router-dom'

const MainLayout = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-200">
      <div className="min-w-[390px] min-h-[844px] bg-[#1B1C20] overflow-y-auto">
       
        <Outlet />
      </div>
    </div>
  )
}

export default MainLayout
