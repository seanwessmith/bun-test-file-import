# Bun Stream Chunk Size Verification

This repository verifies the claim made by Урош regarding the unexpected behavior of the `Bun.file().stream()` method when setting chunk sizes.

## Issue

Урош claims that when using `Bun.file().stream(chunkSize)` to set the streaming chunk size, the function does not behave as expected:

- File size: **1.3GB**
- Expected number of chunks with chunk size of **64MB**: **21**
- Actual number of chunks returned: **5222**

Additionally, TypeScript reports an issue:
```
Expected 0 arguments, but got 1. typescript (2554)
```

## Test Case

### File: `src/main.ts`

```typescript
import { file } from "./SharedData"; // file size is 1.3GB

const stream = file.stream(64 * 1024 * 1024); // Attempting 64MB chunks

let i = 0;
for await (const chunk of stream) {
  ++i;
}

console.log(i); // Expected: 21, Actual: 5222
```

## Environment

- Bun version tested:
  - v1.1.3 (original issue)
  - v1.2.5 (issue persists)

## Steps to Reproduce

1. Clone this repository.
3. Run the provided test script to generate 1.3GB test file and run test:

```sh
bun run test
```

## Observations

- The method signature in TypeScript suggests no arguments should be provided, causing a mismatch between documentation (`Bun.file(path).stream(chunkSize: number)`) and implementation.
- Actual chunking behavior contradicts expected chunk size calculations.

## Purpose

This repository serves to demonstrate/refute the observed behavior clearly and to provide an easy-to-follow reproduction for debugging and reporting to the Bun maintainers.

## References

- Original discussion and report by Урош on Discord (3/15/25).

