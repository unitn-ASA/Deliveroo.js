import DeliverooApi from "./lib/DeliverooApi.js";

const client = new DeliverooApi(
  'http://localhost:8080',
  // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyNmY1Y2NmYTNhIiwibmFtZSI6ImdvZCIsImlhdCI6MTcwODAxMzcxOX0.BbUbNZqLBS168A4WtDLcrPqRqkhHfrU-MP5uoZ6aUvc',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ2ZTk3MjYzMGQyIiwibmFtZSI6Im1hcmNvIiwidGVhbSI6IklUQSIsImlhdCI6MTcwODYzMjYwMX0.Kc1mrwT4vxRDEqWkMOCB1YB52UW1tYpZ2In-5loDw84',
  'matchzero',
);

client.shout('Hello World!');

client.move('up')