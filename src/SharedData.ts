import fs from "node:fs";
import path from "node:path";

// File size and chunk configuration
const FILE_SIZE = 1.3 * 1024 * 1024 * 1024; // 1.3GB
const CHUNK_SIZE = 64 * 1024 * 1024; // 64MB chunks to match your stream size in main.ts

class TestFile {
  private filePath: string;
  private initialized: boolean = false;

  constructor() {
    this.filePath = path.join(__dirname, "testData.bin");
    this.initialize();
  }

  private initialize(): void {
    if (!fs.existsSync(this.filePath)) {
      console.log(
        `Generating ${(FILE_SIZE / (1024 * 1024 * 1024)).toFixed(
          2
        )}GB test data file...`
      );
      this.generateTestData();
    } else {
      const stats = fs.statSync(this.filePath);
      if (stats.size === FILE_SIZE) {
        console.log(
          `Using existing test data file (${(
            FILE_SIZE /
            (1024 * 1024 * 1024)
          ).toFixed(2)}GB)`
        );
        this.initialized = true;
      } else {
        console.log(`Existing test file has incorrect size. Regenerating...`);
        this.generateTestData();
      }
    }
  }

  private generateTestData(): void {
    // Create file synchronously to ensure it's ready when needed
    const fd = fs.openSync(this.filePath, "w");
    const buffer = Buffer.alloc(CHUNK_SIZE);

    // Fill buffer with pattern data
    for (let i = 0; i < CHUNK_SIZE; i++) {
      buffer[i] = i % 256;
    }

    let bytesWritten = 0;
    let lastProgress = -5; // To ensure first update shows

    while (bytesWritten < FILE_SIZE) {
      const remainingBytes = FILE_SIZE - bytesWritten;
      const writeSize = Math.min(CHUNK_SIZE, remainingBytes);

      fs.writeSync(fd, buffer, 0, writeSize, null);
      bytesWritten += writeSize;

      // Show progress every 5%
      const progress = Math.floor((bytesWritten / FILE_SIZE) * 100);
      if (progress >= lastProgress + 5) {
        lastProgress = progress;
        process.stdout.write(`Progress: ${progress}% complete\r`);
      }
    }

    fs.closeSync(fd);
    console.log("\nTest data file generation complete.");
    this.initialized = true;
  }

  // Get the size of the test file
  public get size(): number {
    return FILE_SIZE;
  }

  // Create an async generator to stream the file in chunks
  public async *stream(chunkSize: number = CHUNK_SIZE): AsyncGenerator<Buffer> {
    if (!this.initialized) {
      throw new Error("Test file not initialized");
    }

    const fileHandle = await fs.promises.open(this.filePath, "r");
    try {
      let position = 0;
      while (position < FILE_SIZE) {
        const buffer = Buffer.alloc(chunkSize);
        const { bytesRead } = await fileHandle.read(
          buffer,
          0,
          chunkSize,
          position
        );

        if (bytesRead === 0) break;

        position += bytesRead;
        yield buffer.subarray(0, bytesRead);
      }
    } finally {
      await fileHandle.close();
    }
  }
}

// Export a singleton instance
export const file = new TestFile();
