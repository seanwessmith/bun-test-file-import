# Bun Stream Chunk Size Verification

This repository verifies the claim made by Урош regarding unexpected behavior when streaming files using custom chunk sizes in Bun. Specifically, it tests the streaming functionality using Node.js file streams to verify the expected behavior independently from Bun.

## Issue

Урош encountered unexpected behavior with `Bun.file().stream(chunkSize)`:

- File size: **1.3GB**
- Expected number of chunks with a chunk size of **64MB**: **21**
- Actual number of chunks observed: **5222**

## Test Case

### Corrected File: `src/main.ts`

This script generates a test data file and streams it using Node.js, ensuring accurate chunk counts.

```typescript
import fs from "node:fs";

function generateTestData(filePath: string, chunkSize: number, fileSize: number): void {
  const fd = fs.openSync(filePath, "w");
  const buffer = Buffer.alloc(chunkSize);

  for (let i = 0; i < chunkSize; i++) buffer[i] = i % 256;

  let bytesWritten = 0;
  let lastProgress = -5;

  while (bytesWritten < fileSize) {
    const remainingBytes = fileSize - bytesWritten;
    const writeSize = Math.min(chunkSize, remainingBytes);

    fs.writeSync(fd, buffer, 0, writeSize, null);
    bytesWritten += writeSize;

    const progress = Math.floor((bytesWritten / fileSize) * 100);
    if (progress >= lastProgress + 5) {
      lastProgress = progress;
      process.stdout.write(`Progress: ${progress}% complete\r`);
    }
  }

  fs.closeSync(fd);
  console.log("\nTest data file generation complete.");
}

async function* streamFile(filePath: string, chunkSize: number): AsyncGenerator<Buffer, void, unknown> {
  const fileHandle = await fs.promises.open(filePath, "r");
  const fileSize = (await fileHandle.stat()).size;

  try {
    let position = 0;

    const fullChunks = Math.floor(fileSize / chunkSize);
    const hasPartialChunk = fileSize % chunkSize > 0;
    const totalChunks = fullChunks + (hasPartialChunk ? 1 : 0);

    for (let i = 0; i < totalChunks; i++) {
      const remainingBytes = fileSize - position;
      const bytesToRead = Math.min(chunkSize, remainingBytes);
      const buffer = Buffer.alloc(bytesToRead);

      const { bytesRead } = await fileHandle.read(buffer, 0, bytesToRead, position);
      if (bytesRead === 0) break;

      position += bytesRead;
      yield buffer;
    }
  } finally {
    await fileHandle.close();
  }
}

const filePath = __dirname + "/testData.bin";

async function testStream() {
  const chunkSize = 64 * 1024 * 1024;
  const fileSize = 1.3 * 1024 * 1024 * 1024;

  console.log('Testing stream with chunk size:', chunkSize / 1024 / 1024, 'MB');
  console.log('File size:', fileSize / 1024 / 1024, 'MB');

  if (!fs.existsSync(filePath) || Math.round(fs.statSync(filePath).size) !== Math.round(fileSize)) {
    generateTestData(filePath, chunkSize, fileSize);
  }

  const stream = streamFile(filePath, chunkSize);

  let i = 0;
  for await (const chunk of stream) {
    ++i;
  }

  console.log(`Total chunks: ${i}`);
}

testStream().catch(console.error);
```

## Environment

- Bun versions tested:
  - v1.1.3
  - v1.2.5

## Steps to Reproduce

1. Clone this repository.
2. Run the provided `src/main.ts` script:

```sh
bun src/main.ts
```

## Observations

- The issue originally reported in Bun is contrasted with standard Node.js stream handling, demonstrating the expected chunk behavior.
- TypeScript errors from Bun (`Expected 0 arguments, but got 1`) persist, indicating a documentation or implementation mismatch.

## Purpose

This repository clarifies expected streaming behavior, supports debugging efforts, and verifies proper chunk handling independent of Bun.

## References

- Discord report by Урош (3/15/25).

