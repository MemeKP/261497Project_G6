import { useQuery } from '@tanstack/react-query'
import AdminNav from '../components/AdminNav'
import OrderProgress from '../components/OrderProgress'
import OverAll from '../components/OverAll'
import TableAndSession from '../components/TableAndSession'
import type { ActiveSession } from '../types'

const AdminDashBoard = () => {
   const { data: activeSessionData } = useQuery<{ activeSessions: ActiveSession[] }>({
    queryKey: ["activeSession"],
    queryFn: async () => {
      const res = await fetch("/api/dining_session/active", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch active sessions");
      return res.json();
    },
  });

  const activeSessions = activeSessionData?.activeSessions || [];

  return (
    <div className='bg-[#F4F3F7] min-h-screen w-full font-[Gantari] p-4'>
      {/* NAVBAR (admin) */}
      <AdminNav />
      
      {/* HEADER */}
      <h1 className='text-xl font-bold text-black'>Overview</h1>
      <p className='text-neutral-500 text-base font-normal'>Welcome back to admin dashboard</p>

      {/* OVERALL */}
      <OverAll/>

      {/* TABLE & SESSION */}
      <TableAndSession/>
      
      {/* ORDER IN PROGRESS */}
      <OrderProgress activeSessions={activeSessions}/>
    </div>
  )
}

export default AdminDashBoard