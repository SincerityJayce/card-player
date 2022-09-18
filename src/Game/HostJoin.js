import {useGame} from "./GameState"
import * as FireBase from "./Firebase"
const getUser = FireBase.useAuth.getState().login
const set = (...args)=>useGame.setState(...args)



export var myRole, opponentsRole, myId, hostId
function iAmTheHost(bool){
 bool&&(hostId = myId);
 myRole = bool?"host":"challenger"
 opponentsRole = bool?"challenger":"host"
}
function pushMyself(){
 console.log('pushing self as', myRole)
 FireBase.push(["Games", hostId, "users", myRole], myId)
 console.log("waiting for approval to join game")
 return new Promise(resolve=>{FireBase.listen(['Games', hostId, 'users',myRole],data=>(data==myId)&&resolve(
  console.log("successfully joined game!")
 ))})
}


async function Join(){
 myId = (await getUser())?.uid
 if(!myId)return alert("Login Unsuccessful. We can't put you into a game without your google account.")
 iAmTheHost(false)
 await pushMyself()
 subscribeToGameData()
}

async function Host(){
 myId = (await getUser()).uid
 if(!myId)return alert("Login Unsuccessful. We can't put you into a game without your google account.")
 iAmTheHost(true)
 await pushMyself()
 subscribeToGameData()

 navigator.clipboard.writeText(`tcg-playground.web.app/game/${myId}?role=challenger`)
 alert('The link to your game was copied to your clipboard. Send it to a friend to play.')
}

export function JoinOrHostGame(){
 iShouldBeHosting()?Host():Join()
}

function subscribeToGameData(){
 console.log("subscribing to game data")
 let userInfoListener = FireBase.listen(["Games", hostId, "users"], users=> set({users}))
 let cardMoveListener = FireBase.listen(["Games", hostId, "groups", opponentsRole], data => set(s => { s && data && console.log('groups update', data)||(s.groups[opponentsRole] = data) })) 
 let cardDataListener = FireBase.listen(["Games", hostId, "cards", opponentsRole], data => set(s => { s && data && (s.cards[opponentsRole] = data) }))
}





////
export function iShouldBeHosting(){
 let {paths,params} = currentUrlObject()
 hostId = paths[1]=="game"&&paths[2]
 iAmTheHost(!hostId)
 return !hostId


 function currentUrlObject(){
  let url = window.location.toString()
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





