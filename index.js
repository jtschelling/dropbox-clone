const http = require('http');

// created this line to test pull requests
const port = process.env.PORT || 5000;
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('testing new message\n');
});
server.listen(port, () => {
  // eslint-disable-next-line
  console.log(`Server running on ${port}/`);
});
