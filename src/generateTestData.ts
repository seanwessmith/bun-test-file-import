import fs from "fs";
import path from "path";

// Define file size (1.3GB)
const fileSize = 1.3 * 1024 * 1024 * 1024;
const outputPath = path.join(__dirname, "testData.bin");
const chunkSize = 10 * 1024 * 1024; // 10MB chunks for efficient writing

// Create a write stream to the output file
const writeStream = fs.createWriteStream(outputPath);

// Track progress
let bytesWritten = 0;
let lastProgress = 0;

// Function to create a buffer with some recognizable pattern
function createChunk() {
  const buffer = Buffer.alloc(chunkSize);
  // Fill with pattern (just using incremental bytes for simplicity)
  for (let i = 0; i < chunkSize; i++) {
    buffer[i] = i % 256;
  }
  return buffer;
}

// Write data in chunks
function writeNextChunk() {
  if (bytesWritten >= fileSize) {
    writeStream.end();
    console.log("\nFile generation complete!");
    console.log(
      `Created ${outputPath} with size of ${(
        bytesWritten /
        (1024 * 1024 * 1024)
      ).toFixed(2)}GB`
    );
    return;
  }

  // Create and write chunk
  const chunk = createChunk();
  const actualSize = Math.min(chunkSize, fileSize - bytesWritten);

  // Write the chunk
  writeStream.write(chunk.subarray(0, actualSize), (err) => {
    if (err) {
      console.error("Error writing to file:", err);
      return;
    }

    bytesWritten += actualSize;

    // Show progress (every 5%)
    const progress = Math.floor((bytesWritten / fileSize) * 100);
    if (progress >= lastProgress + 5) {
      lastProgress = progress;
      process.stdout.write(`Progress: ${progress}% complete\r`);
    }

    // Continue with next chunk
    setImmediate(writeNextChunk);
  });
}

console.log(
  `Generating ${(fileSize / (1024 * 1024 * 1024)).toFixed(
    2
  )}GB test data file...`
);
writeNextChunk();
