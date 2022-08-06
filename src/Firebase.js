// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDt5W4Hw53mi7qoA3jcxplDydezrzEAb4w",
  authDomain: "tcg-playground.firebaseapp.com",
  databaseURL: "https://tcg-playground-default-rtdb.firebaseio.com",
  projectId: "tcg-playground",
  storageBucket: "tcg-playground.appspot.com",
  messagingSenderId: "696146170050",
  appId: "1:696146170050:web:0ce3fe4850806e42022b5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

//https://firebase.google.com/docs/database/web/read-and-write
const db = (...paths)=>ref(database, paths.join("/"))

export function push(paths, state){
  set(db(...paths), state);
}
export function listen(paths, callback){
  onValue(db(...paths), data=>callback(data.val()))
}

