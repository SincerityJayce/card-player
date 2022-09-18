import './output.css';
import "./App.css"
import { FullBoard } from "./Game/GameBoard"
import { useAuth } from "./Game/Firebase"

import {
 BrowserRouter as Router,
 Routes,
 Route,
} from "react-router-dom";


function App() {
 const user = useAuth(s=>s.user)
 return (
  <Router>

  <div className="flex flex-col">
   <SideBar />
   {user&&<FullBoard />}
  </div>
  </Router>
 );
}

function SideBar() {
 const { user, login, logout } = useAuth(s => s)

 function Pfp() {
  return <div onClick={logout}>{user && <img style={{ borderRadius: '50%', height: '30px' }} src={user.photoURL}></img>}</div>
 }

 return (
  <>
   <div className={`w-full flex flex-row gap-2 flex-grow-1 overflow-hidden bg-sky-900 
   align-center items-center leading-9 font-bold text-white sidebar max-h-1/8`}>
    <Pfp/>
     {/* <Routes>
      <Route path="game/:hostId" element={<div>Join</div>}></Route>
      <Route path="" element={<div>Host</div>}></Route>
     </Routes> */}
    
   </div>
  </>
 )
}



export default App;