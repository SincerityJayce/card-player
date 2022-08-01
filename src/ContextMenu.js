import create from "zustand";
import { useCardGroups, groupsData } from "./App";

export const useContextMenu = create((set,get)=>{
    const closeMenu = ()=>set({contextTarget:false, index:false})
  
    window.addEventListener('click', e=>{
      const clickWasOutSideTheContextMenu = !document.getElementById("ContextMenuPlaceholder")?.contains(e.target)
      clickWasOutSideTheContextMenu&&closeMenu()
    })
    return {
      contextTarget:false,
      index:false,
      mouse:{},
      closeMenu,
      openMenuHere:(group, index=false)=>(e)=>{e.preventDefault();set({mouse:{left:e.clientX, top:e.clientY}, contextTarget:group, index})},
    }
  })


export function ContextMenu(){
    const {contextTarget, index, mouse, closeMenu} = useContextMenu()
  
    const options = {
      Shuffle: (group)=>useCardGroups.setState({[group]:[...shuffle(useCardGroups.getState()[group])]})
    }
  
    const menu = {
      default:[],
      pile:["Shuffle",],
      hand:["Shuffle",],
      field:[]
    }
  
    function Option({label}){
      const action = e=>{closeMenu(); options[label](contextTarget,e)}
      return <div onClick={action} className="hover:bg-sky-800 border-gray-400 border-x-2 text-white p-2">{label}</div>
    }
    return(
      <div id="ContextMenuPlaceholder" className="bg-gray-800 border-y-2 absolute rounded" style={mouse}>
        {(contextTarget&&menu[contextTarget]||[]).concat(menu.default||[]).concat(menu[groupsData[contextTarget]?.type]||[] ).map((label, index)=>{
          return <Option key={index} label={label}/>
        })}
      </div>
    )
  }


  
function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
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