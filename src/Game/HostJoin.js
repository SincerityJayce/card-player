import {useGame} from "./GameState"
import * as FireBase from "./Firebase"
const getUser = FireBase.useAuth.getState().login

function hostStatus(){
 return false
}
async function JoinGame(hostId){
 if(hostStatus())return
 const myId = await getUser()
 console.log(myId)
 if(!myId)return alert("Login Unsuccessful. We can't put you into a game without your google account.")
 // listenForJoinApproval(hostId)
 // pushMyselfAsChallenger(hostId)
 function listenForJoinApproval(){
  // FireBase.listen([Games, hostId, users])
 }
}

async function HostGame(){
 const myId = await getUser()
 console.log(myId)
 // pushMyselfAsHost()
}

export function JoinGameFromURL(){
 let url = window.location.toString()
 let {paths, params} = urlObject(url)
 let hostId = paths[1]=="game"&&paths[2]
 hostId?JoinGame(hostId):HostGame()

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
