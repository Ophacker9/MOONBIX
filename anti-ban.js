const axios = require("axios");

// User-Agent List
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 Chrome/114.0.0.0 Mobile Safari/537.36"
];

// Function to simulate human-like delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to send safe requests
async function safeRequest(url) {
  try {
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    // Send request with randomized headers
    const response = await axios.get(url, {
      headers: {
        "User-Agent": userAgent,
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com",
      },
      timeout: 10000,
    });

    console.log(`Request Successful: ${response.status}`);
  } catch (error) {
    console.error("Request failed:", error.message);
  }
}

(async () => {
  const url = "https://example.com"; // Target URL

  for (let i = 0; i < 10; i++) {
    console.log(`Request ${i + 1}`);
    await safeRequest(url);

    // Random delay between 3-8 seconds
    const delay = Math.floor(Math.random() * (8000 - 3000 + 1)) + 3000;
    console.log(`Waiting ${delay / 500} seconds...`);
    await sleep(delay);
  }
})();
