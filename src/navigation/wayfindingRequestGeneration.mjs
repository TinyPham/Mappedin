export function createWayfindingRequestGeneration() {
  let currentGeneration = 0;

  return {
    invalidate() {
      currentGeneration += 1;
      return currentGeneration;
    },
    capture() {
      return currentGeneration;
    },
    isCurrent(requestGeneration) {
      return requestGeneration === currentGeneration;
    }
  };
}
