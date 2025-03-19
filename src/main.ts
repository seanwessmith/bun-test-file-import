import fs from "node:fs";

function generateTestData(
  filePath: string,
  chunkSize: number,
  fileSize: number
): void {
  // Create file synchronously to ensure it's ready when needed
  const fd = fs.openSync(filePath, "w");
  const buffer = Buffer.alloc(chunkSize);

  // Fill buffer with pattern data
  for (let i = 0; i < chunkSize; i++) {
    buffer[i] = i % 256;
  }

  let bytesWritten = 0;
  let lastProgress = -5; // To ensure first update shows

  while (bytesWritten < fileSize) {
    const remainingBytes = fileSize - bytesWritten;
    const writeSize = Math.min(chunkSize, remainingBytes);

    fs.writeSync(fd, buffer, 0, writeSize, null);
    bytesWritten += writeSize;

    // Show progress every 5%
    const progress = Math.floor((bytesWritten / fileSize) * 100);
    if (progress >= lastProgress + 5) {
      lastProgress = progress;
      process.stdout.write(`Progress: ${progress}% complete\r`);
    }
  }

  fs.closeSync(fd);
  console.log("\nTest data file generation complete.");
}

async function* streamFile(
  filePath: string,
  chunkSize: number
): AsyncGenerator<Buffer, void, unknown> {
  const fileHandle = await fs.promises.open(filePath, "r");
  const fileSize = (await fileHandle.stat()).size;

  try {
    let position = 0;

    // Calculate exact number of chunks
    const fullChunks = Math.floor(fileSize / chunkSize);
    const hasPartialChunk = fileSize % chunkSize > 0;
    const totalChunks = fullChunks + (hasPartialChunk ? 1 : 0);

    // Read each chunk directly
    for (let i = 0; i < totalChunks; i++) {
      const remainingBytes = fileSize - position;
      const bytesToRead = Math.min(chunkSize, remainingBytes);
      const buffer = Buffer.alloc(bytesToRead);

      const { bytesRead } = await fileHandle.read(
        buffer,
        0,
        bytesToRead,
        position
      );

      if (bytesRead === 0) break;

      position += bytesRead;
      yield buffer;
    }
  } finally {
    await fileHandle.close();
  }
}

// Example usage
const filePath = __dirname + "/testData.bin";

async function testStream() {
  const chunkSize = 64 * 1024 * 1024;
  // 1.3 GB
  const fileSize = 1.3 * 1024 * 1024 * 1024;

  console.log('Testing stream with chunk size:', chunkSize / 1024 / 1024, 'MB');
  console.log('File size:', fileSize / 1024 / 1024, 'MB');
  if (
    !fs.existsSync(filePath) ||
    Math.round(fs.statSync(filePath).size) !== Math.round(fileSize)
  ) {
    generateTestData(filePath, chunkSize, fileSize);
  }
  const stream = streamFile(filePath, chunkSize);

  let i = 0;
  for await (const chunk of stream) {
    ++i;
    // Uncomment to debug
    // console.log(`Chunk ${i}, size: ${chunk.length}`);
  }

  console.log(`Total chunks: ${i}`);
}

testStream().catch(console.error);
