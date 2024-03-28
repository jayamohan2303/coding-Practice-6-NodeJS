const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'covid19India.db')

const app = express()
app.use(express.json())

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log('DB Error : `${e.message}')
    process.exit(1)
  }
}

initializeDBAndServer()
//stateDBObject
const convertStateDBObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
//districtDBObject
const convertDistrictDBObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}
//API 1
app.get('/states/', async (request, response) => {
  const getStatesQuerry = `
SELECT
  * 
FROM 
  state
`
  const statesArray = await db.all(getStatesQuerry)
  response.send(
    statesArray.map(eachState =>
      convertStateDBObjectToResponseObject(eachState),
    ),
  )
})

//API 2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params

  const getStateQuery = `
SELECT 
  *
FROM 
  state
WHERE   
  state_id=${stateId}
`
  const stateOne = await db.get(getStateQuery)
  response.send(convertStateDBObjectToResponseObject(stateOne))
})

//API 3

app.post('/districts/', async (request, response) => {
  const districtObject = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtObject
  const addDistrictQuery = `
  INSERT INTO
    district(district_name,state_id,cases,cured,active,deaths)
   VALUES (
      '${districtName}',
      '${stateId}',
      '${cases}',
      '${cured}',
      '${active}',
      '${deaths}'
   ) 

  `
  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

//API 4

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT *
    FROM 
      district
  WHERE  
    district_id=${districtId}
  `
  const districtArray = await db.get(getDistrictQuery)
  response.send(convertDistrictDBObjectToResponseObject(districtArray))
})

//API 5
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE 
    FROM 
      district
  WHERE 
  district_id=${districtId}    
  `
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

//API 6

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrictQuery = `
    UPDATE 
      district
    SET 
      district_name = '${districtName}',
      state_id = '${stateId}',
      cases = '${cases}',
      cured = '${cured}',
      active = '${active}',
      deaths = '${deaths}'
    WHERE 
      district_id=${districtId}  
  `
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

//API 7
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
  SELECT  
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
FROM 
  district 
 WHERE 
  state_id=${stateId} 
  `
  const stats = await db.get(getStateStatsQuery)
  console.log(stats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

//API 8
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
  SELECT state_id  FROM district
  WHERE 
  district_id=${districtId}
  `
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery)

  const getStateNameQuery = `
  SELECT 
    state_name AS 
  stateName 
    FROM 
  state
    WHERE   
  state_id =${getDistrictIdQueryResponse.state_id}
  `
  const getStateNameQueryResponse = await db.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
})

module.exports = app
