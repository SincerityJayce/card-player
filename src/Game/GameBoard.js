import { useGame, liftCard, dropCard, loadDeck } from "./GameState"
import { JoinOrHostGame, iShouldBeHosting } from './HostJoin';
import { useContextMenu, ContextMenu } from './ContextMenu';

import { useState, useEffect, useRef } from "react"

function BoardHalf({ controlledByOpponent = false }) {
 return (
  <div className={`flex-grow flex flex-col ${controlledByOpponent && "rotate-180"} h-1/2`}>
   <Row >
    <Hand name="hand" {...{ controlledByOpponent }} visibleToOpponent={false}></Hand>
    <Pile name="deck" {...{ controlledByOpponent }} faceDown={true}></Pile>
   </Row>
   <Field name="field" {...{ controlledByOpponent }} />
  </div>
 )

 function Row({ children }) {
  return (
   <div className="flex flex-row justify-around items-center w-full h-1/3">
    {children}
   </div>
  )
 }
}



export function FullBoard() {
 const deckChosen = useGame(s => s.myGroups()?.deck)

 return <>
  {
   !deckChosen ? <DeckLinkSelectScreen /> :
    <>
     <div className="flex gap-2 flex-col overflow-hidden h-full w-full relative select-none"
      style={{height:'90vh'}}>
      <BoardHalf controlledByOpponent={true} />
      <BoardHalf />
      <ContextMenu />
     <MouseFollower />
     </div>
    </>

  }
 </>


 function DeckLinkSelectScreen() {
  const [loadingDeck, setLoading] = useState(false)
  useEffect(function windowListensForDecklinkPaste() {
   window.addEventListener('paste', attemptToLoadDeck)

   function attemptToLoadDeck(e) {
    let clipboardData = e.clipboardData.getData('text') //add method here
    console.log('pasted data:', clipboardData) ||
     amILoadingADeck() && (loadingADeck = true) &&
     !loadingDeck && setLoading(true) ||
     e.clipboardData.getData('text') && loadDeck(clipboardData).then(JoinOrHostGame).catch(er => setLoading(false) || (loadingADeck = false))
   }
   return () => window.removeEventListener('paste', attemptToLoadDeck)
  }, [])

  return (
   <div>
    {loadingDeck ? "..." : `Paste FFDecks.com Deck Link to ${iShouldBeHosting()?"host":"join"} game`}
    <input type="text" style={{marginLeft:'4px', border:'2px solid black'}} autoFocus />
   </div>
  )
 }
}
var loadingADeck = false
function amILoadingADeck() {
 return loadingADeck
}



const yugiohCardBack = "https://ms.yugipedia.com//thumb/e/e5/Back-EN.png/257px-Back-EN.png"
const FFTCGCardBack ="https://upload.wikimedia.org/wikipedia/en/b/b4/Final_Fantasy_CCG.jpg"
const blackImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Black_colour.jpg/800px-Black_colour.jpg"




/// Group Types ////////////////////
//  vvvvvvvvvvv //




function Pile({ name, initialCards, faceDown = false, controlledByOpponent }) {
 const cards = useGame(s => s.initGroup(name, initialCards, { faceDown, type: "pile", controlledByOpponent }))
 const {dragging, group} = useGame(g => g.myDrag())
 const set = useGame(g => g.myDrag)
 const openMenuHere = useContextMenu(c => c.openMenuHere)

 const draggedCardIsntFromThisPile = group != name

 return (
  <div className="place-items-center flex-grow-0 min-w-fit bg-slate-600 flex pile relative"
   onContextMenu={ !controlledByOpponent ? openMenuHere(name) : null }
   onMouseLeave= {e => !controlledByOpponent && dragging && set({ gHover: false})}
   onMouseEnter= {e => !controlledByOpponent && dragging && set({ gHover: name, gIndex: 0 })}
   >
   <PickupBox group={name} disabled={controlledByOpponent}>
    <Card card={{ ...cards.length ? cards.at(-1) : { src: false }, faceDown }}></Card>
   </PickupBox>
   {dragging && !controlledByOpponent && 
    <div className="absolute flex flex-col w-full h-full top-0 left-0 ">
     <div onMouseUp={e => { !controlledByOpponent && leftclick(e) && dropCard(name, 0) }}
      className="text-center font-bold text-white align-middle leading-10 opacity-30 hover:opacity-100">
      Top
     </div>
     {draggedCardIsntFromThisPile &&
      <div onMouseUp={e => { !controlledByOpponent && leftclick(e) && dropCard(name, cards.length) }}
       className="text-center font-bold bg-white align-middle leading-10 opacity-30 hover:opacity-100">
       Bottom
      </div>
     }
    </div>
   }
  </div>
 )
}

function Field(props) {
 const containerRef = useRef()
 const { name, initialCards = [], controlledByOpponent, visibleToOpponent = false } = props
 const cards = useGame(s => s.initGroup(name, initialCards, { ...props, type: 'field', facedown: props.facedown || controlledByOpponent && !visibleToOpponent }))
 const { dragging, hIndex } = useGame(g => g.myDrag())
 const set = useGame(g => g.myDrag)
 const openMenuHere = useContextMenu(c => c.openMenuHere)

 const positionStampDraggedCard = (e) => {
  set(g => {
   g.card.position = {
    left: e.clientX - cardToMouseOffset.left - containerRef.current.getBoundingClientRect().left,
    top: e.clientY - cardToMouseOffset.normalTop - containerRef.current.getBoundingClientRect().top
   }
  })
 }

 return (
  <div ref={containerRef}
   onContextMenu={controlledByOpponent ? null : openMenuHere(name)}
   onMouseLeave={e => !controlledByOpponent && dragging && set({ gHover: false })}
   onMouseUp={e => { !controlledByOpponent && leftclick(e) && positionStampDraggedCard(e) || dropCard(name, cards.length) }}
   onMouseEnter={e => !controlledByOpponent && dragging && set({ gHover: name, gIndex: cards.length - 1 })}
   className="flex flex-row-reverse items-center flex-grow bg-lime-500 justify-end px-1 field relative h-2/3">
   {cards.map((card, index) => (
    <PickupBox group={name} index={index} key={index} disabled={controlledByOpponent}>
     <div className="field-placement-box absolute w-0 h-0" style={card.position}>
      <Card card={card} ></Card>
     </div>
    </PickupBox>
   ))}
  </div>
 )
}


function Hand(props) {
 const { name, initialCards = [], controlledByOpponent, visibleToOpponent = false } = props
 const cards = useGame(s => s.initGroup(name, initialCards, { ...props, type: 'hand', facedown: props.facedown || controlledByOpponent && !visibleToOpponent }))
 const { dragging, hIndex } = useGame(g => g.myDrag())
 const set = useGame(g => g.myDrag)
 const openMenuHere = useContextMenu(c => c.openMenuHere)

 return (
  <div
   onContextMenu={controlledByOpponent ? null : openMenuHere(name)}
   onMouseLeave={e => !controlledByOpponent && dragging && set({ gHover: false })}
   onMouseUp={e => { !controlledByOpponent && leftclick(e) && dropCard(name, hIndex) }}
   onMouseEnter={e => !controlledByOpponent && dragging && set({ gHover: name, gIndex: cards.length - 1 })}
   className="flex flex-row-reverse items-center flex-grow bg-lime-500 justify-end px-1 hand">
   {cards.map((card, index) => (
    <PickupBox group={name} index={index} key={index} disabled={controlledByOpponent}>
     <HandPlacementBox group={name} index={index} key={index}>
      <Card card={card} ></Card>
     </HandPlacementBox>
    </PickupBox>
   ))}
  </div>
 )

 function HandPlacementBox({ group, children, index }) {
  const { dragging, gHover, hIndex } = useGame(g => g.myDrag())
  const set = useGame(g => g.myDrag)
  const hLeft = hIndex > index
  const gHovered = gHover == group
  const hOffset = 20 / (Math.abs(index + .6 - hIndex) + 0.5)


  const slide_ToMakeRoomFor_HoveringCard = {
   transition: 'transform 3s',
   transform: `translateX(${(gHovered&&!controlledByOpponent) ? (hLeft ? hOffset : -hOffset) : 0}px)`
  }
  // const slide_ToMakeRoomFor_HoveringCard = useSpring({
  //  to: { transform: `translateX(${gHovered ? (hLeft ? hOffset : -hOffset) : 0}px)` },
  //  config: { tension: 300, velocity: 0 }
  // })

  function mouseLeftOfCenter(e) {
   let { left, width } = e.target.getBoundingClientRect()
   var x = e.pageX - left;
   return width / 2 > x
  };

  return (
   <div
    onMouseMove={e => { !controlledByOpponent && dragging && set({ gHover: group, hIndex: index + mouseLeftOfCenter(e) }) }}
    style={slide_ToMakeRoomFor_HoveringCard}>
    {children}
   </div>
  )
 }
}


function Card({ card, dragged = false, owner = "host" }) {
 const src = useGame(g => g.cards[owner][card?.id]?.src)
 const dragging = useGame(g => g.myDrag().dragging)
 const placeholder = !src

 const pickupRef = useRef()
 const rememberMouseOffsetToCard = (e) => {
  const { left, top, height } = pickupRef.current.getBoundingClientRect()
  cardToMouseOffset.left = e.clientX - left
  cardToMouseOffset.top = e.clientY - top
  cardToMouseOffset.normalTop = e.clientY - top
  positionMouseFollower(e)
 }
 return (
  <img
   ref={pickupRef}
   onMouseDown={rememberMouseOffsetToCard}
   draggable="false"
   className={`h-4/5 mx-2 my-2 max-w-fit ${!dragging && !placeholder && "hover:scale-110"} hover:transition-all`}
   style={{ width: '69px' }}
   src={placeholder ? blackImage : (card.faceDown ? FFTCGCardBack : src)} />
 )
}

function PickupBox({ group, children, index = 0, disabled }) {

 return (
  <div
   className={`flex-grow w-0 transition-smooth`}
   onMouseDown={e => !disabled && leftclick(e) && liftCard(group, index)}
   style={{ maxWidth: "85px", flexBasis: "100%" }}>
   {children}
  </div>
 )
}

function positionMouseFollower(e) {
 document.documentElement.style.setProperty('--mouse-x', e.clientX - cardToMouseOffset.left + "px");
 document.documentElement.style.setProperty('--mouse-y', e.clientY - cardToMouseOffset.top + "px");
}
const cardToMouseOffset = { left: 0, top: 0 }
window.addEventListener("mousemove", positionMouseFollower);
function MouseFollower() {
 const card = useGame(s => s.myDrag().card)
 const opacity = useGame(s => console.log(s.myDrag().gHover, s.myGroups()[s.myDrag().gHover]?.type)||s.myGroups()[s.myDrag().gHover]?.type=="pile"?.5:1)
 return (
  <div className='absolute mouseFollower pointer-events-none'
   style={{ transform: 'translate(var(--mouse-x),var(--mouse-y)) scale(1.1)', background: 'red', opacity }}>
   {card && <Card card={card}></Card>}
  </div>
 )
}


const leftclick = e => e.button === 0
