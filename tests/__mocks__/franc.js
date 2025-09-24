// Mock for franc library to avoid ES module issues in tests
module.exports = {
  franc: (text) => {
    // Simple mock: detect based on keywords
    if (text.includes('hello') || text.includes('and') || text.includes('the')) {
      return 'eng';
    } else if (text.includes('y') || text.includes('el') || text.includes('la')) {
      return 'spa';
    }
    return 'spa'; // Default to Spanish
  }
};