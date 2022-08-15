import {useGame} from "./GameState"
import * as FireBase from "./Firebase"
const getUser = FireBase.useAuth.getState().login
const set = useGame.setState

function hostStatus(){
 return false
}


async function Join(hostId){
 if(hostStatus())return
 const myId = (await getUser())?.uid
 if(!myId)return alert("Login Unsuccessful. We can't put you into a game without your google account.")
 pushMyselfAs('challenger', myId, hostId)
 listenForJoinApproval(hostId).then(()=>subscribeToGameData('host', hostId))
 function listenForJoinApproval(hostId, myId){
  new Promise(resolve=>{FireBase.listen(['Games', hostId, 'users','challenger'],data=>(data==myId)&&resolve())})
 }
}

async function Host(){
 const myId = (await getUser()).uid
 pushMyselfAs('host', myId, myId)
 toClipboard(`tcg-playground.web.app/game/${myId}`)
 alert('The link to your game was copied to your clipboard. Send it to a friend to play.')
 subscribeToGameData('challenger', hostId)
}

export function JoinGameFromURL(){
 let url = window.location.toString()
 let {paths} = urlObject(url)
 let hostId = paths[1]=="game"&&paths[2]
 hostId?Join(hostId):Host()

 function urlObject(url){
  url = decodeURI(url)
  let [paths, protocol="http:"]= url.split("//").reverse()
  paths=paths.split("/")
 
  let [lastPath, params=""] = paths.at(-1).split("?")
  paths.pop();paths.push(lastPath)
   params = params.split("&")
    .reduce((map,p)=>{
     let [key, val]=p.split("="); typeof val == "string"&&map.set(key,val);return map
    }, new Map() )
   return {protocol, paths, params}
 }
}

function subscribeToGameData(opponent, hostId){
 let userInfoListener = FireBase.listen(["Games", hostId, "users"], users=> set({users}))
 let cardMoveListener = FireBase.listen(["Games", hostId, "groups", opponent], data => set(s => { s && data && console.log('groups update', data)||(s.groups[opponent] = data) })) 
 let cardDataListener = FireBase.listen(["Games", hostId, "cards", opponent], data => set(s => { s && data && (s.cards[opponent] = data) }))
}

function pushMyselfAs(role, uid, hostId){
 FireBase.push(["Games", hostId, "users", role], uid)
}



///////
function toClipboard(text){
 let proxy = document.createElement('div')
 proxy.innerHTML=text

 proxy.select();
 proxy.setSelectionRange(0, 99999); /* For mobile devices */
 navigator.clipboard.writeText(proxy.value);

 proxy.remove()
}