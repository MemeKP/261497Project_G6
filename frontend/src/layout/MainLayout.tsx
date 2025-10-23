import { Outlet } from 'react-router-dom'

const MainLayout = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-200">
      <div className="min-w-[400px] min-h-screen bg-[#1B1C20] overflow-y-auto">
       
        <Outlet />
      </div>
    </div>
  )
}

export default MainLayout