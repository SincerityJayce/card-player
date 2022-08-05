import {useQuery} from '@tanstack/react-query';

export function useGoogleSheets(url){
    const data = useQuery((url)=>gSheetAsObj(url), url)
    return data
}

const spreadsheetUrl = "https://docs.google.com/spreadsheets/d/17ywW-5tsdsBBubNyDXoKR_18q47wd0mjTHNAODhDfSQ/edit?usp=sharing"

console.log(gSheetAsObj(spreadsheetUrl))

export async function gSheetAsObj(url){
    const apiKey = "AIzaSyCqyhBLlOry0zA0U4SKM1AXehhvaFzVOuM" 

    const id = getSpreadsheetId(url)
    const sheetName = await getSheetName(id) //for requesting full range of data
    const data = await getSheetData(id, sheetName)
    return parseSheetData(data)

    function getSpreadsheetId(url) {
        const match = url.match(/^https?:\/\/docs.google.com\/spreadsheets\/d\/([^/]+)/)
        return match ? match[1] : null
    }
    async function getSheetName(id){
        return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}?key=${apiKey}`)
        .then(res=>res.json())
        .then(res=>res.sheets[0].properties.title)
    }
    function getSheetData(id, sheetName){
        return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${sheetName}?key=${apiKey}`)
        .then(res=>res.json())
        .then(res=>res.values)
    }
    function parseSheetData([ref, ...data]){
         return data.map(row=>{
           return row.reduce((acc, cur, i)=>{
             acc[ref[i]]=cur
             return acc
           }, {})
         })
    }
}
