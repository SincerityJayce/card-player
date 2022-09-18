import * as FireBase from './Firebase';
import { gSheetAsObj, normaliseObject } from './GoogleSheets';
import { immer } from "zustand/middleware/immer"
import {OfficialGames} from "./CardGameApis"
import create from "zustand";
import { myRole, opponentsRole, hostId} from './HostJoin';

const devDeck = "https://ffdecks.com/deck/6331280900751360"


const withLogs = (config) => (set, get, api) =>
 config(
  (...args) => {
   // console.log('  applying', args)
   set(...args)
  },
  get,
  api
)

const devCards = () => [
 "1-001",
 "1-002",
 "1-003",
 "1-004",
 "1-005",
 "1-006"
]

export const useGame = create(withLogs(immer((set, get) => {

 const makeCardId = function*(){var i=1;while(true){yield i++}}();

 function makeShortcut(...paths) { //!this is hot girl shit
  //creates a set+get equivalent for a path, 
  //set function applies changes to zustand state and pushes to firebase
  const currentPaths = ()=>paths.map(p=>typeof p == "function"?p():p)
  const path = (startinglocation) => {   
   var location = startinglocation
   currentPaths().forEach(p => (location = location[p])) //🥵
   return location
  }
  return function shortcut(changes) {
   if (typeof changes == "object") { //changes can be a function or asignableValues
    let newValues = changes
    changes = (state) => Object.assign(state, newValues)
   }
   if (changes) { //applies changes if any
    set(s => { changes(path(s)) })
    let data = (path(get()))
    hostId&&FireBase.push(["Games", hostId, ...currentPaths()], data)
     // console.log('hostId was unknown while trying to push data. Path:', currentPaths," Changes:", changes)
   }
   return path(get()) //always returns current state
  } //sexiest function ive ever written
 }
 const myCards = makeShortcut("cards", ()=>myRole)
 const theirCards = makeShortcut("cards", ()=>opponentsRole)
 const myGroups = makeShortcut("groups", ()=>myRole)
 const theirGroups = makeShortcut("groups", ()=>opponentsRole)
 const myDrag = makeShortcut("groups", ()=>myRole, "lifted")


 function initialiseCards(cards, props) {
  let refinedCards = cards.map(c => {
   return { ...props, id: makeCardId.next().value }
  })
  const { GSheetLink, idField } = get().cardLibrary
  refinedCards.length&&gSheetAsObj(GSheetLink).then(cardLibrary => {
    myCards(mC => refinedCards.forEach((card, index) => {
    mC[card.id] = normaliseObject(cardLibrary.find(c => c[idField] == cards[index]))
   }))
  })
  return refinedCards
 }

 function initGroup(name, initialCards = devCards(), props) {
  let group = (props.controlledByOpponent ? theirGroups() : myGroups())?.[name]
  const cardsState = group?.type&&group.cards
  return cardsState || (props.controlledByOpponent ? initOpponentsGroup() : initOwnGroup()) || []

  function initOpponentsGroup() {}
  function initOwnGroup() {
   const cards = group?.cards||initialiseCards(initialCards || [])
   myGroups(groups => groups[name] = { ...props, cards })
   console.log('init group', name, myGroups())
   return cards
  }
 }


 return {
  users: {},
  cardLibrary: {
   //configured only for FF right now
   GSheetLink: OfficialGames["Final Fantasy"].gSheet,
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
    myGroups(g=>g[group].cards=cards)
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
   console.log('loading a deck')
   let deck = await OfficialGames["Final Fantasy"].parseDeckLink(decklink);
   myGroups(g => {
    g.deck=g.deck||{}
    g.deck.cards = initialiseCards(deck, g.deck?.props||{})
   })
  }
 }
})))

export const { liftCard, dropCard, myGroups, loadDeck } = useGame.getState()
window.addEventListener("mouseleave", () => dropCard())
window.addEventListener("mouseup", () => dropCard())