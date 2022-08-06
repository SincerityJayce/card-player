import './output.css';
import "./App.css"
import { useSpring, animated } from 'react-spring'
import {useGame, liftCard, dropCard } from "./GameState"

import { useContextMenu, ContextMenu } from './ContextMenu';

const yugiohCardBack = "https://ms.yugipedia.com//thumb/e/e5/Back-EN.png/257px-Back-EN.png"
const blackImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Black_colour.jpg/800px-Black_colour.jpg"






function Card({card, dragged=false, owner="developer"}){
  const src = useGame(g=>g.cards[owner][card?.id]?.src)
  const dragging = useGame(g=>g.myDrag().dragging)
  const placeholder = !src
  return (
    <img 
      draggable="false"
      className={`h-24 mx-2 my-2 max-w-fit ${!dragging && !placeholder&& "hover:scale-110"} hover:transition-all`}
      style={{width:'69px'}} 
      src={placeholder?blackImage:(card.faceDown?yugiohCardBack:src)}/>
  )
}


function HandPlacementBox({group, children, index}){
  const {dragging, hGroup, hIndex} = useGame(g=>g.myDrag())
  const set = useGame(g=>g.myDrag)
  const hLeft = hIndex>index
  const gHovered = hGroup==group
  const hOffset = 20/(Math.abs(index+.6-hIndex)+0.5 )

  const {transform}= useSpring({to:{transform:`translateX(${gHovered?(hLeft?hOffset:-hOffset):0}px)`},
    config:{ tension :300, velocity:0}})

  return (
      
      <animated.div     
        onMouseMove={e=>{dragging&&set({hGroup:group,hIndex:index+left(e)})}}

        style={{transform}}>
          {children}
      </animated.div>
  )
}
function PickupBox({group, children, index=0}){
  return(
    <div 
      className={`flex-grow w-0 transition-smooth`}
      onMouseDown={e=>leftclick(e)&&liftCard(group, index)} 
      style={{maxWidth:"85px",flexBasis:"100%"}}>
        {children}
    </div>
  )
}





function Hand({name, content}){
  const cards = useGame(s=>s.initGroup(name, content, {faceDown:false, type:"hand"}))
  const {dragging, hIndex} = useGame(g=>g.myDrag())
  const set = useGame(g=>g.myDrag)
  const openMenuHere = useContextMenu(c=>c.openMenuHere)

  return (
    <div 
    onContextMenu={openMenuHere(name)}
    onMouseLeave={e=>dragging&&set({hGroup:false})}
    onMouseUp={e=>{leftclick(e)&&dropCard(name, hIndex)}} 
    onMouseEnter={e=>dragging&&set({gHover:name, gIndex:cards.length-1})} 
    className="flex flex-row-reverse items-center flex-grow bg-lime-400 justify-end px-1 h-full hand">
      {cards.map((card, index)=>(
        <PickupBox group={name} index={index} key={index}>
          <HandPlacementBox group={name} index={index} key={index}>
            <Card card={card} ></Card>
          </HandPlacementBox>
        </PickupBox>
      ))}
    </div>
  )
}


function Pile({name, content, faceDown=false}){
  const cards = useGame(s=>s.initGroup(name, content, {faceDown, type:"pile"}))
  const dragging = useGame(g=>g.myDrag().dragging)
  const set = useGame(g=>g.myDrag)
  const openMenuHere = useContextMenu(c=>c.openMenuHere)


  return (
    <div 
    onContextMenu={openMenuHere(name)}
    onMouseLeave={e=>dragging&&set({hGroup:false})}
    onMouseUp={e=>{leftclick(e)&&dropCard(name, 0)}} 
    onMouseEnter={e=>dragging&&set({gHover:name, gIndex:0})}
    className="place-items-center flex-grow bg-slate-600 flex">
      <PickupBox group={name}>
        <Card card={{...cards.length?cards.at(-1):{src:false}, faceDown}}></Card>
      </PickupBox>
    </div>
  )
}
function App() {
  return (
    <div className="flex flex-col h-full w-full" style={{userSelect:'none'}}>
      <Row >
        <Hand name="hand"></Hand>
        <Pile name="deck" faceDown={true}></Pile>
      </Row>
      <Row>
        <Hand name="forwards"></Hand>
      </Row>
      <MouseFollower/>
      <ContextMenu/>
    </div>
  );
}

window.addEventListener("mousemove", e => { 
  document.documentElement.style.setProperty('--mouse-x', e.clientX + "px");
  document.documentElement.style.setProperty('--mouse-y', e.clientY + "px");
}); //mousetrackingstyle for MouseFollower
function MouseFollower(){
  const card = useGame(s=>s.myDrag().card)
  return (
    <div className='absolute mouseFollower pointer-events-none' 
      style={{left:'var(--mouse-x)', top:'var(--mouse-y)', transform:'translate(-50%, -50%) scale(1.1)'}}>
      {card&&<Card card={card}></Card>}
    </div>
  )
}


export default App;






function Row({children}){
  return (
    <div className="flex flex-row justify-around items-center w-full">
      {children}
    </div>
  )
}

function left(e){
  let{left, width} = e.target.getBoundingClientRect()
  var x = e.pageX - left;
  return width/2 > x
};

const leftclick = e=>e.button === 0