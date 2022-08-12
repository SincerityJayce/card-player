import * as FireBase from './Firebase';
import { gSheetAsObj, normaliseObject } from './GoogleSheets';
import { immer } from "zustand/middleware/immer"
import create from "zustand";

//FFDecks Replica Database for dev
const sheetLink = "https://docs.google.com/spreadsheets/d/1syRHsRchz0EcsdFk7ieXyHKK9oe4GeZv4riyr4eXjcg/edit?usp=sharing"
const devDeck = "https://ffdecks.com/deck/6331280900751360"

const myPlayerId = "developer"
const gameId = myPlayerId
export const myRole = "host"
const opponentsRole = ["challenger", "host"].find(f => f != myRole)

const withLogs = (config) => (set, get, api) =>
 config(
  (...args) => {
   // console.log('  applying', args)
   set(...args)
  },
  get,
  api
 )

export const useGame = create(withLogs(immer((set, get) => {

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
 const myCards = makeShortcut("cards", myRole)
 const theirCards = makeShortcut("cards", opponentsRole)
 const myGroups = makeShortcut("groups", myRole)
 const theirGroups = makeShortcut("groups", opponentsRole)
 const myDrag = makeShortcut("groups", myRole, "lifted")


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

 function initGroup(name, initialCards = devCards(), props) {
  const cardsState = (props.controlledByOpponent ? theirGroups() : myGroups())?.[name]?.cards


  return cardsState || (props.controlledByOpponent ? initOpponentsGroup() : initOwnGroup()) || []


  function initOpponentsGroup() {

  }
  function initOwnGroup() {
   const cards = initialiseCards(initialCards || devCards())
   myGroups(groups => groups[name] = { ...props, cards })
   return cards
  }
 }


 return {
  users: {

  },
  cardLibrary: {
   GSheetLink: sheetLink,
   idField: "serial_number"
  },
  cards: {
   host: {},
   challenger: {}
  },
  groups: {
   host: { lifted: {} },
   challenger: { lifted: {} }
  },

  initGroup,
  myGroups,
  myDrag,
  liftCard: (group, index) => {
   function popCard(group, index = 0) {
    let cards = [...myGroups()[group].cards]
    let card = cards.splice(index, 1)[0]
    myGroups({ [group]: { cards } })
    return card
   }
   get().dropCard();
   let card = popCard(group, index);
   card && myDrag({ dragging: true, hGroup: group, hIndex: index, card, index, group })
  },
  dropCard: (group = myDrag()?.group, index = myDrag()?.index) => {
   function addCard(group, card, index = 0) {
    card && myGroups(g => { g[group].cards.splice(index, 0, card) })
   }
   myDrag()?.card && addCard(group, { ...myDrag().card, faceDown: myGroups()[group]?.faceDown || false }, index);
   myDrag({ hGroup: false, dragging: false, card: false });
  },
  loadDeck: async (decklink) => {
   let deck = await FFDeck(decklink);
   theirGroups(g => {
    g.deck=g.deck||{}
    g.deck.cards = initialiseCards(deck, g.deck?.props||{})
   })
  }
 }
})))
export const { liftCard, dropCard, myGroups, loadDeck } = useGame.getState()
const set = useGame.setState



//this is implimented to make sure lifted cards are never deleted accidentally
window.addEventListener("mouseleave", () => dropCard())
window.addEventListener("mouseup", () => dropCard())


FireBase.push(["Games", gameId, "users", myRole], myPlayerId)

setTimeout(() => loadDeck(devDeck), 300)


// listen for other players card info
FireBase.listen(["Games", gameId, "cards", opponentsRole], data => set(s => { s && data && (s.cards[opponentsRole] = data) }))
FireBase.listen(["Games", gameId, "groups", opponentsRole], data => set(s => { s && data && console.log('groups update', data)||(s.groups[opponentsRole] = data) }))
FireBase.listen(["Games", gameId, "users"], users=> set({users}))


const devCards = () => [
 "1-001",
 "1-002",
 "1-003",
 "1-004",
 "1-005",
 "1-006"
]



async function FFDeck(decklink) {
 var deckrequest = 'https://ffdecks.com/api/deck?deck_id=' + decklink.slice(-16)
 let { cards } = await fetch(deckrequest).then(r => r.json())

 var expandedDeck = cards.reduce((newDeck, { card, quantity }) => {
  let i = 0; while (i < quantity) { newDeck.push(card); i++ }
  return newDeck
 },
 []);

 return expandedDeck.map(c => c.serial_number)
}