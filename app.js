const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null
const app = express()
const format = require('date-fns/format')
app.use(express.json())
const intalizationDbAndeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Starting up the server.....')
    })
  } catch (e) {
    console.log(`Database Error : ${e.message}`)
    process.exit(1)
  }
}
intalizationDbAndeServer()

let priorityArray = ['HIGH', 'MEDIUM', 'LOW']
let statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
let categoryArray = [' WORK', 'HOME', 'LEARNING']

const convertCamelCase = listObj => {
  return {
    id: listObj.id,
    todo: listObj.todo,
    priority: listObj.priority,
    status: listObj.status,
    category: listObj.category,
    dueDate: listObj.due_date,
  }
}
//get all todos

app.get('/todo/', async (request, response) => {
  const getTodoQuery = `
        
        SELECT
          *
        FROM
          todo
        
          ;  
        
        `

  const getTodo = await db.all(getTodoQuery)
  response.send(getTodo)
  response.status(200)
})

//get  todos

app.get('/todos/', async (request, response) => {
  const {status, priority, search_q = '', category, date} = request.query
  let getTodoQuery = ''
  switch (true) {
    case priority !== undefined && status !== undefined:
      if (priorityArray.includes(priority) && statusArray.includes(status)) {
        getTodoQuery = `
            
            SELECT
              *
            FROM
              todo
            WHERE
              priority='${priority}' AND status='${status}' 
              ;  
            
            `
      } else {
        response.status(400)
      }
      break
    case category !== undefined && status !== undefined:
      if (categoryArray.includes(category) && statusArray.includes(status)) {
        getTodoQuery = `
              
              SELECT
                *
              FROM
                todo
              WHERE
                category='${category}' AND status='${status}' ;  
              
              `
      } else {
        response.status(400)
      }

      break
    case category !== undefined && priority !== undefined:
      if (
        priorityArray.includes(priority) &&
        categoryArray.includes(category)
      ) {
        getTodoQuery = `
            
            SELECT
              *
            FROM
              todo
            WHERE
              category='${category}' AND priority='${priority}' 
              ;  
            
            `
      } else {
        response.status(400)
      }

      break
    case category !== undefined:
      if (categoryArray.includes(category)) {
        getTodoQuery = `
            
            SELECT
              *
            FROM
              todo
            WHERE
              category='${category}'  
              ;  
            
            `
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break
    case status !== undefined:
      if (statusArray.includes(status)) {
        getTodoQuery = `
            
            SELECT
              *
            FROM
              todo
            WHERE
              status='${status}'  
              ;  
            
            `
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case priority !== undefined:
      if (priorityArray.includes(priority)) {
        getTodoQuery = `
            
            SELECT
              *
            FROM
              todo
            WHERE
              priority='${priority}'  
              ;  
            
            `
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break
    case search_q !== null:
      getTodoQuery = `
        
        SELECT
          *
        FROM
          todo
        WHERE
          todo='%${search_q}%'  
          ;  
        
        `
      break
  }

  const getTodo = await db.all(getTodoQuery)
  response.send(getTodo.map(forEach => convertCamelCase(forEach)))
  response.status(200)
})

//get each todo

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getEachTodo = `
  
  SELECT
    *
  FROM
    todo
  WHERE
    id=${todoId}    ;
  
  `
  const getTodo = await db.get(getEachTodo)
  response.send(convertCamelCase(getTodo))
  response.status(200)
})

//get deudate

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  const dueDateQuery = `
  
  SELECT
    *
  FROM
    todo
  WHERE
    due_date='${format(new Date(date), 'yyyy-MM-dd')}'    ;
  
  
  `
  const getDate = await db.all(dueDateQuery)
  if (getDate !== undefined) {
    response.send(getDate.map(forEach => convertCamelCase(forEach)))
    response.status(200)
  } else {
    response.send('Invalid Due Date')
    response.status(400)
  }
})

// create new todo

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, due_date} = request.body
  const createTodoQuery = `
    INSERT INTO
      todo (id,todo,priority,status,category,due_date)
    VALUES  (
      ${id},
      '${todo}',
      '${priority}',
      '${status}',
      '${category}',
      '${due_date}'
    )  ;
  
  `
  await db.run(createTodoQuery)
  response.send('Todo Successfully Added')
  response.status(200)
})

//update each todo

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestedBody = request.body
  let whereToUpdate = ''

  switch (true) {
    case requestedBody.status !== undefined:
      whereToUpdate = 'Status Updated'
      break
    case requestedBody.priority !== undefined:
      whereToUpdate = 'Priority Updated'
      break
    case requestedBody.todo !== undefined:
      whereToUpdate = 'Todo Updated'
      break
    case requestedBody.category !== undefined:
      whereToUpdate = 'Category Updated'
      break
    case requestedBody.due_date !== undefined:
      whereToUpdate = 'Due Date Updated'
      break
  }

  const updatePreviousQuery = `
  
  SELECT
    *
  FROM
    todo
  WHERE
    id=${todoId}    ;
  
  `
  const getprevioustodo = await db.get(updatePreviousQuery)

  const {
    status = getprevioustodo.status,
    priority = getprevioustodo.priority,
    todo = getprevioustodo.todo,
    category = getprevioustodo.category,
    due_date = getprevioustodo.due_date,
  } = request.body

  const updatedQuery = `
        
        UPDATE
          todo
        SET
          status='${status}',
          due_date='${due_date}',
          priority='${priority}',
          todo='${todo}',
          category='${category}'
        WHERE
          id=${todoId};
        `
  await db.run(updatedQuery)
  response.send(whereToUpdate)
  response.status(200)
})

//delete todo

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
  
  DELETE FROM
    todo
  WHERE
    id=${todoId}    ;
  
  `
  await db.run(deleteQuery)
  response.send('Todo Deleted')
  response.status(200)
})

module.exports = app
