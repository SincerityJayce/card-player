import * as FireBase from './Firebase';
import { gSheetAsObj, normaliseObject } from './GoogleSheets';
import { immer } from "zustand/middleware/immer"
import create from "zustand";


//FFDecks Replica Database for dev
const sheetLink = "https://docs.google.com/spreadsheets/d/1syRHsRchz0EcsdFk7ieXyHKK9oe4GeZv4riyr4eXjcg/edit?usp=sharing"

export const useGame = create(immer((set, get) => {

 const myPlayerId = "developer"
 const gameId = myPlayerId
 const otherPlayer = () => get() && get().players.find(id => id != myPlayerId) || "dev-strawman"

 const cardId = function* () { var i = 1; while (true) { yield i++ } }()

 function makeShortcut(...paths) {
  //returns a set+get equivalent to a given path, 
  //which sets to both zustand state and firebaseRTDB
  const path = (startinglocation) => {
   var location = startinglocation
   paths.forEach(p => location = location[p])
   return location
  }
  return (setterFunc) => {
   setterFunc = objToAssignFunc(setterFunc)
   if (setterFunc) {
    set(s => { setterFunc(path(s)) })
    let data = normaliseObject(path(get()))
    FireBase.push(["Games", gameId, ...paths], data)
   }
   return path(get())
  }
  function objToAssignFunc(setterFunc) {
   if (typeof setterFunc == "object") {
    const newValues = setterFunc
    setterFunc = (d) => Object.assign(d, newValues)
   }
   return setterFunc
  }
 }
 const myCards = makeShortcut("cards", myPlayerId)
 const myGroups = makeShortcut("groups", myPlayerId)
 const myDrag = makeShortcut("groups", myPlayerId, "lifted")


 //listen for other players card info
 setTimeout(() => {
  FireBase.listen(["Games", gameId, "cards"], fb => set(s => { s && fb && (s.cards[otherPlayer()] = fb[otherPlayer()]) }))
  FireBase.listen(["Games", gameId, "groups"], fb => set(s => { s && fb && (s.groups[otherPlayer()] = fb[otherPlayer()]) }))
 }, 200)

 function initGroup(name, initialCards, props) {
  const cardsState = myGroups()[name]?.cards
  return cardsState || initGroup() || []
  
  function initGroup() {
   props.controlledByOpponent ? initOpponentsGroup() : initOwnGroup()
   function initOpponentGroup() {

   }
   function initOwnGroup() {
    const cards = initialiseCards(initialCards || devCards())
    myGroups(groups => groups[name] = { ...props, cards })
    return cards

    function initialiseCards(cards, props) {
     let refinedCards = cards.map(c => {
      return { ...props, id: cardId.next().value }
     })
     const { GSheetLink, idField } = get().cardLibrary
     gSheetAsObj(GSheetLink).then(cardLibrary => {
      myCards(mC => refinedCards.forEach((card, index) => {
       mC[card.id] = normaliseObject(cardLibrary.find(c => c[idField] == cards[index]))
      }))
     })
     return refinedCards
    }

   }
  }
 }



 function liftCard(group, index) {
  function popCard(group, index = 0) {
   let cards = [...myGroups()[group].cards]
   let card = cards.splice(index, 1)[0]
   myGroups({ [group]: { cards } })
   return card
  }
  dropLastCard();
  let card = popCard(group, index);
  card && myDrag({ dragging: true, hGroup: group, hIndex: index, card, index, group })
 }
 function dropCard(group, index) {
  function addCard(group, card, index = 0) {
   card && myGroups(g => { g[group].cards.splice(index, 0, card) })
  }
  myDrag()?.card && addCard(group, { ...myDrag().card, faceDown: myGroups()[group]?.faceDown || false }, index);
  myDrag({ hGroup: false, dragging: false, card: false });
 }
 //this is implimented to make sure lifted cards are never deleted accidentally
 const dropLastCard = () => dropCard(myDrag()?.group, myDrag()?.index)
 window.addEventListener("mouseleave", () => dropLastCard())
 window.addEventListener("mouseup", () => dropLastCard())

 return {
  players: [myPlayerId],
  spectators: [],
  cardLibrary: {
   GSheetLink: sheetLink,
   idField: "serial_number"
  },
  cards: {
   [myPlayerId]: {},
   [otherPlayer()]: {}
  },
  groups: {
   [myPlayerId]: { lifted: {} },
   [otherPlayer()]: {}
  },

  initGroup,
  myGroups,
  myDrag,
  liftCard,
  dropCard,
 }
}))
export const { liftCard, dropCard, myGroups } = useGame.getState()


const devCards = () => [
 "1-001",
 "1-002",
 "1-003",
 "1-004",
 "1-005",
 "1-006"
] 