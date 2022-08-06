import './output.css';
import "./App.css"
import { FullBoard } from "./Game/GameBoard"
import { useAuth } from "./Game/Firebase"




function App() {
 return (
  <div className="flex flex-col">
   <SideBar />
   <FullBoard />
  </div>
 );
}

function SideBar() {
 const { user, login } = useAuth(s => s)

 function Pfp() {
  return <div>{user && <img style={{ borderRadius: '50%', height: '30px' }} src={user.photoURL}></img>}</div>
 }

 return (
  <>
   <div onClick={login} className={`w-full flex flex-row gap-2 flex-grow-0 overflow-hidden bg-sky-900 
   align-center items-center leading-9 font-bold text-white sidebar`}>
    <Pfp/>
    <div>Host</div>
    <div>Join</div>
   </div>
  </>
 )
}



export default App;