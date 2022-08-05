import './output.css';
import create from "zustand";
import "./App.css"
import { useSpring, animated } from 'react-spring'
import * as FireBase from './Firebase';
import { gSheetAsObj } from './GoogleSheets';
import {immer} from "zustand/middleware/immer"

import { useContextMenu, ContextMenu } from './ContextMenu';

//FFDecks Database for dev
const sheetLink = "https://docs.google.com/spreadsheets/d/1syRHsRchz0EcsdFk7ieXyHKK9oe4GeZv4riyr4eXjcg/edit?usp=sharing"

const useGame = create(immer((set, get)=>{

  const myPlayerId = "developer"
  const gameId = myPlayerId
  const otherPlayer = ()=>get()&&get().players.find(id=>id!=myPlayerId)

  const cardId = function*(){var i = 1;while(true){yield i++}}

  //listen for other players card info
  setTimeout(()=>{
    FireBase.listen(["Games", gameId, "cards"], fb=>set(s=>{s&&(s.cards[otherPlayer()]=fb[otherPlayer()])}))
    FireBase.listen(["Games", gameId, "groups"], fb=>set(s=>{s&&(s.groups[otherPlayer()]=fb[otherPlayer()])}))
  }, 200)

  function myCards (setterFunc){
    if(setterFunc){
      set(s=>setterFunc(s.cards[myPlayerId]))
      FireBase.push(["Games", gameId, "cards", myPlayerId], get().cards[myPlayerId])
    }
    return  get().cards[myPlayerId]
  }
  function myGroups(setterFunc){
    if(setterFunc){
      set(s=>setterFunc(s.groups[myPlayerId]))
      FireBase.push(["Games", gameId, "groups", myPlayerId], get().groups[myPlayerId])
    }
    return get().groups[myPlayerId]
  }
  function initGroup(name, content, props){
    function initGroup(){
      const cards = initialiseCards(content||devCards())
      myGroups(groups=>groups[name]={...props, cards})
      return cards

      function initialiseCards (cards, props){
        let refinedCards = cards.map(c=>({...props, id:cardId.next()}))
        const {GSheetLink, idField} = get().cardLibrary
        gSheetAsObj(GSheetLink).then(cardLibrary=>{
          myCards(mC=>refinedCards.forEach((card, index)=>{
            mC[card.id]=cardLibrary.find(c=>c[idField]=cards[index])
          }))
        })
        return refinedCards
      }
    }
    return myGroups()[name].cards||initGroup()||[]
  }
  
  return{
    players:[myPlayerId],
    spectators:[],
    cardLibrary:{
      defaultGSheetLink:sheetLink,
      idField:"serial_number"
    },
    cards:{
      [myPlayerId]:{},
      [otherPlayer()]:{}
    },
    groups:{
      [myPlayerId]:{},
      [otherPlayer()]:{}
    },

    initGroup,

  }
}))

const yugiohCardBack = "https://ms.yugipedia.com//thumb/e/e5/Back-EN.png/257px-Back-EN.png"
const blackImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Black_colour.jpg/800px-Black_colour.jpg"

function devCards(){
  let dc = [
    " 1-001",
    " 1-002",
    " 1-003",
    " 1-004",
    " 1-005",
    " 1-006"
  ] 
  return [...dc]
}
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
  const cards = useGame(s=>s.initGroup(name, content, {faceDown:false, type:"hand"}))
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
  const cards = useGame(s=>s.initGroup(name, content, {faceDown, type:"pile"}))
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