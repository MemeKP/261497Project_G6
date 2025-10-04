import AdminNav from '../components/AdminNav'
import OverAll from '../components/OverAll'

const AdminDashBoard = () => {
  return (
    <div className='bg-[#F4F3F7] min-h-screen w-full font-[Gantari] p-4'>
      {/* NAVBAR (admin) */}
      <AdminNav />
      
      {/* HEADER */}
      <h1 className='text-xl font-bold text-black'>Overview</h1>
      <p className='text-neutral-500 text-base font-normal'>Hi, Somkid. Welcome back to admin dashboard</p>

      {/* OVERALL */}
      <OverAll/>

      {/* TABLE & SESSION */}
      
      {/* ORDER IN PROGRESS */}
    </div>
  )
}

export default AdminDashBoard