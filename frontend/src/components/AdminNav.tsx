import { IoMenu, IoPersonCircleSharp } from "react-icons/io5";


const AdminNav = () => {
  return (
     <div className="flex flex-row justify-between">
        {/* HAMBURGER */}
        <div>
            <IoMenu className="text-3xl"/>
        </div>
        {/* PROFILE IMG */}
        <div>
            <IoPersonCircleSharp className="text-4xl"/>
        </div>
     </div>

   
  )
}

export default AdminNav