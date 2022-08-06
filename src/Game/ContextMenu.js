import create from "zustand";
import { myGroups } from "./GameState";


export const useContextMenu = create((set, get) => {
 const closeMenu = () => set({ group: false, index: false })

 window.addEventListener('click', e => {
  const clickWasOutSideMenu = !document.getElementById("ContextMenuPlaceholder")?.contains(e.target)
  clickWasOutSideMenu && closeMenu()
 })
 return {
  group: false,
  index: false,
  mouse: {},
  closeMenu,
  openMenuHere: (group, index = false) => (e) => { e.preventDefault(); set({ mouse: { left: e.clientX, top: e.clientY }, group: group, index }) },
 }
})


export function ContextMenu() {
 const { group, index, mouse, closeMenu } = useContextMenu()

 const options = {
  Shuffle: (group) => myGroups(g => shuffle(g[group].cards)),
 }

 const menu = {
  default: [],
  byType: {
   pile: ["Shuffle",],
   hand: ["Shuffle",],
   field: []
  }
 }

 function Option({ label }) {
  const action = e => { closeMenu(); options[label](group, e) }
  return <div onClick={action} className="hover:bg-sky-800 border-gray-400 border-x-2 text-white p-2">{label}</div>
 }

 const default_Options = menu.default
 const groupType = myGroups()[group]?.type

 const optionsForTarget = default_Options.concat(menu.byType[groupType] || [])

 return (
  <div id="ContextMenuPlaceholder" className="bg-gray-800 border-y-2 absolute rounded" style={mouse}>
   {group && optionsForTarget.map((label, index) => <Option key={index} label={label} />)}
  </div>
 )
}



function shuffle(array) {
 let currentIndex = array.length, randomIndex;

 // While there remain elements to shuffle.
 while (currentIndex != 0) {

  // Pick a remaining element.
  randomIndex = Math.floor(Math.random() * currentIndex);
  currentIndex--;

  // And swap it with the current element.
  [array[currentIndex], array[randomIndex]] = [
   array[randomIndex], array[currentIndex]];
 }

 return array;
}