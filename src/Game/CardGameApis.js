export const OfficialGames = {
 "Final Fantasy" : {
  gSheet:"https://docs.google.com/spreadsheets/d/1t-CRWD00H86h2hZfucLxrxMu1hJi7IK8JIVtg0oQMR8/edit?usp=sharing",
  parseDeckLink:async (decklink)=> {
   var deckrequest = 'https://ffdecks.com/api/deck?deck_id=' + decklink.slice(-16)
   let { cards } = await fetch(deckrequest).then(r => r.json())
  
   var expandedDeck = cards.reduce((newDeck, { card, quantity }) => {
    let i = 0; while (i < quantity) { newDeck.push(card); i++ }
    return newDeck
   },
   []);
  
   return expandedDeck.map(c => c.serial_number)
  }
 }
}