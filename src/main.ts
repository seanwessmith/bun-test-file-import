import { file } from "./SharedData"; // file has size of 1.3GB
const stream = file.stream(64 * 1024 * 1024);

let i = 0;
for await (const chunk of stream) {
  ++i;
}

console.log(i); //expected to give 21 actually is 5222
