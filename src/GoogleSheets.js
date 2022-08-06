export function normaliseObject(obj){
    var newObj = {}
    if(typeof obj == "object"){
        Object.entries(obj).forEach(([key,val])=>{
            val=normaliseObject(val)
            const [newKey, ...children] = key.split("/")
            if(children.length){
                const childKey = children.join("/")
                newObj[newKey] = {...newObj[newKey]||{}, [childKey]:val}
            } else {
                newObj[key] = (typeof val == 'object')?{...newObj[key], ...val}:val
            }
        })
        return newObj
    } 
    return obj
}

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
