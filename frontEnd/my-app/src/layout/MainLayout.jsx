
import NavBar from '@/components/NavBar'
import { Outlet } from 'react-router-dom'


const MainLayout = () => {
  return (
    <div>
      <NavBar/>
      <div>
        <Outlet/>
      </div>
     
    </div>
  )
}

export default MainLayout
