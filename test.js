import fetch from "node-fetch";

const response = await fetch("http://localhost:3000/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    emailText: "Hello, can we meet tomorrow at 3?",
    length: 2,
    formality: 4
  })
});

const data = await response.json();
console.log(data);
