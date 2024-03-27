const express = require('express')
const cors = require('cors')
const app = express()

// middleware parses incoming requests with JSON payloads
app.use(express.json())

// middleware enables CORS
app.use(cors())

// middleware used to show static content
// Express will first check here upon receiving a request
app.use(express.static('dist'))

let notes = [
  {
    id: 1,
    content: "Take out the trash.",
    important: true,
  },
  {
    id: 2,
    content: "Walk the dog.",
    important: false,
  },
  {
    id: 3,
    content: "Empty the dishwasher.",
    important: true,
  },
];

/*  body property would be undefined without the json-parser
    json-parser takes the JSON data of a request, transforms it into 
    a Javascript object and then attaches it to the body property of the request
    object before the route handler is called. 
*/

const generateId = () => {
  const maxId =
    notes.length > 0
      ? Math.max(...notes.map((n) => n.id)) // math.max returns largest #. spread used to provide list of args
      : 0;

  return maxId;
}

app.post("/api/notes", (request, response) => {
  const body = request.body;

  if (!body.content) {
    return response.status(400).json({
      error: "content missing",
    });
  }

  const note = {
    content: body.content,
    important: Boolean(body.important) || false,
    id: generateId(),
  };

  notes = notes.concat(note);

  response.json(note);
})

app.get("/api/notes/:id", (request, response) => {
  const id = Number(request.params.id);
  const note = notes.find((note) => note.id === id);

  // Objects = truthy & undefined = falsy
  note ? response.json(note) : response.status(404).end();
})

app.get("/api/notes", (req, res) => {
  res.json(notes);
})

app.delete("/api/notes/:id", (request, response) => {
  const id = Number(request.params.id);
  notes = notes.filter((note) => note.id !== id);

  response.status(204).end();
})

const PORT = process.env.PORT || 3001;
app.listen(PORT);
console.log(`Server running on port ${PORT}`);
