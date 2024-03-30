require("dotenv").config(); // should be imported before the Note model. Env vars available globally
const express = require("express");
const cors = require("cors");
const Note = require("./models/note");

const app = express();

// middleware used to show static content
// Express will first check here upon receiving a request
app.use(express.static("dist"));

// middleware enables CORS
app.use(cors());

// middleware parses incoming requests with JSON payloads - must come before handler functions
app.use(express.json());
app.use(requestLogger);

/*  body property would be undefined without the json-parser
    json-parser takes the JSON data of a request, transforms it into 
    a Javascript object and then attaches it to the body property of the request
    object before the route handler is called. 
*/
app.post("/api/notes", (request, response, next) => {
  const body = request.body;

  if (body.content === undefined) {
    return response.status(400).json({
      // Bad Request - server unable to fulfill request
      error: "content missing",
    });
  }

  const note = new Note({
    content: body.content,
    important: Boolean(body.important) || false,
  });

  note
    .save()
    .then((savedNote) => {
      response.json(savedNote);
    })
    .catch((error) => next(error));
});

app.get("/api/notes/:id", (request, response, next) => {
  Note.findById(request.params.id)
    .then((note) => (note ? response.json(note) : response.status(404).end()))
    .catch((error) => next(error));
});

app.get("/api/notes", (req, res) => {
  Note.find({}).then((notes) => {
    res.json(notes);
  });
});

app.delete("/api/notes/:id", (request, response, next) => {
  Note.findByIdAndDelete(request.params.id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.put("api/notes/:id", (request, response, next) => {
  const { content, important } = request.body;

  /*
     There is one important detail regarding the use of the findByIdAndUpdate 
     method. By default, the updatedNote parameter of the event handler receives 
     the original document without the modifications. We added the optional 
     { new: true } parameter, which will cause our event handler to be called 
     with the new modified document instead of the original.
  */
  Note.findByIdAndUpdate(
    request.params.id, 
    { content, important },
    { new: true, runValidators: true, context: 'query' }
  )
    .then((updatedNote) => {
      response.json(updatedNote);
    })
    .catch((error) => next(error));
});

// why are the params diff for each of the error handlers
const unknownEndpoint = (request, response) => {
  // needs to be right before the errorHandler / after HTTP request handler
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint); // handles requests with an unknown endpoint

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name == "ValidationError") {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

// must be the last loaded middleware, all the routes should be registered before this.
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT);
console.log(`Server running on port ${PORT}`);
