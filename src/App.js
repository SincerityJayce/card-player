import './output.css';
import create from "zustand";
import "./App.css"
import { useSpring, animated } from 'react-spring'
import { useFirebase } from './Firebase';
import { useGoogleSheets } from './GoogleSheets';



import { useContextMenu, ContextMenu } from './ContextMenu';



const yugiohCardBack = "https://ms.yugipedia.com//thumb/e/e5/Back-EN.png/257px-Back-EN.png"
const blackImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Black_colour.jpg/800px-Black_colour.jpg"
const devCards = [
  "https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=394485&type=card",
  "https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=527503&type=card",
  "https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=574358&type=card",
  "https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=394507&type=card",
  "https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=394486&type=card",
  "https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=394487&type=card",
  "https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=394488&type=card",
]

function popCard(group, index=0){
  let newGroups = {...useCardGroups.getState()}
  let newList = [...newGroups[group]]
  let card = newList.splice(index, 1)[0]
  newGroups[group] = newList
  useCardGroups.setState(newGroups)
  useCardDrag.setState({hGroup:group, hIndex:index})
  return card
}
function addCard(group, card, index=0){
  if(!card) return
  let newGroups = {...useCardGroups.getState()}

  let newList = [...newGroups[group]]
  newList.splice(index, 0, card)
  newGroups[group] = newList
  useCardGroups.setState(newGroups)
  useCardDrag.setState({hGroup:false})
}
function liftCard(group, index){dropLastCard(); let card = popCard(group,index); if(!card)return;lifted = {card, index, group}; useCardDrag.setState({dragging:true, hGroup:group, hIndex:index})}
function dropCard(group, index){lifted?.card&&addCard(group, {...lifted.card, faceDown:groupsData[group]?.faceDown}, index); lifted = null; useCardDrag.setState({dragging:false})}
function dropLastCard(){lifted?.card&&dropCard(lifted.group, lifted.index)} 
//this is implimented to make sure lifted cards are never deleted accidentally
window.addEventListener("mouseleave", dropLastCard)
window.addEventListener("mouseup", dropLastCard)

var lifted={
  card:null,
  index:null,
  group:null
}
export const groupsData ={
  
}
export const useCardGroups = create((set, get)=>{
  return {
  initGroupIfAbsent:(name,props)=>{
    const content = props.content||[...devCards].map(card=>({src:card})).map(c=>{c.faceDown=props.faceDown;return c})
    function initGroup(){
      groupsData[name]=props
      set({[name]:content})
    }
    return get()[name]||initGroup()||content
  }
}});

const useCardDrag = create(set=>{
  window.addEventListener("mousemove", e => { 
    document.documentElement.style.setProperty('--mouse-x', e.clientX + "px");
    document.documentElement.style.setProperty('--mouse-y', e.clientY + "px");
  });
  return {
  dragging:false,
  hGroup:null,
  hIndex:null,
  set
}})

function Card({data, dragged=false}){
  const dragging = useCardDrag(s=>s.dragging)
  const placeholder = !data?.src
  return (
    <img 
      draggable="false"
      className={`h-24 mx-2 my-2 max-w-fit ${!dragging && !placeholder&& "hover:scale-110"} hover:transition-all`}
      style={{width:'69px'}} 
      src={placeholder?blackImage:(data.faceDown?yugiohCardBack:data.src)}/>
  )
}


function HandPlacementBox({group, children, index}){
  const {dragging, hGroup, hIndex, set} = useCardDrag()
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
  const cards = useCardGroups(groups=>groups.initGroupIfAbsent(name, {content, faceDown:false, type:"hand"}))
  const {set, dragging, hIndex} = useCardDrag(s=>s)
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
            <Card data={card} ></Card>
          </HandPlacementBox>
        </PickupBox>
      ))}
    </div>
  )
}


function Pile({name, content, faceDown=false}){
  const cards = useCardGroups(groups=>groups.initGroupIfAbsent(name, {content, faceDown, type:"pile"}))
  const {set, dragging, hIndex} = useCardDrag(s=>s)
  const openMenuHere = useContextMenu(c=>c.openMenuHere)


  return (
    <div 
    onContextMenu={openMenuHere(name)}
    onMouseLeave={e=>dragging&&set({hGroup:false})}
    onMouseUp={e=>{leftclick(e)&&dropCard(name, 0)}} 
    onMouseEnter={e=>dragging&&set({gHover:name, gIndex:0})}
    className="place-items-center flex-grow bg-slate-600 flex">
      <PickupBox group={name}>
        <Card data={{...cards.length?cards.at(-1):{src:false}, faceDown}}></Card>
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


function MouseFollower(){
  const dragging = useCardDrag(s=>s.dragging)
  return (
    <div className='absolute mouseFollower pointer-events-none' 
      style={{left:'var(--mouse-x)', top:'var(--mouse-y)', transform:'translate(-50%, -50%) scale(1.1)'}}>
      {dragging&&<Card data={lifted.card}></Card>}
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
  if(width/2 > x) return true
  return false
};

const leftclick = (e)=>{
  if(e.button === 0) return true
  return false
}