import AdminNav from "../components/AdminNav";
import AdminMenuList from "../components/AdminMenuList";

const AdminOrderList = () => {
  return (
   <div className='bg-[#F4F3F7] min-h-screen w-full font-[Gantari] p-4'>
      {/* NAVBAR (admin) */}
      <AdminNav />
      
      {/* SEARCH */}
      {/* TABLE OF ORDER LIST */}
      <AdminMenuList/>
    </div>
  );
};

export default AdminOrderList;
