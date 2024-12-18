      const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const readline = require("readline");
const { HttpsProxyAgent } = require("https-proxy-agent");
const logger = require("./config/logger"); // Import the logger
const printBanner = require("./config/banner");
const prompt = require("prompt-sync")();

// Helper Functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clearLine = () => {
  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout, 0);
};

printBanner();
logger.info("Application started successfully!");

// Binance Class
class Binance {
  constructor() {
    this.headers = this.defaultHeaders();
    this.proxyConfig = this.loadProxyConfig();
    this.axios = this.createAxiosInstance();
  }

  defaultHeaders() {
    return {
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US;q=0.6,en;q=0.5",
      "Content-Type": "application/json",
      Origin: "https://www.binance.com",
      Referer: "https://www.binance.com/vi/game/tg/moon-bix",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36",
    };
  }

  loadProxyConfig() {
    try {
      const configPath = path.join(__dirname, "config", "config.json");
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (error) {
      logger.error("Proxy configuration load failed.");
      return { useProxy: false };
    }
  }

  createAxiosInstance() {
    const config = { headers: this.headers };
    if (this.proxyConfig.useProxy) {
      const { proxyProtocol, proxyAuth, proxyHost, proxyPort } = this.proxyConfig;
      const proxyUrl = `${proxyProtocol}://${proxyAuth.username}:${proxyAuth.password}@${proxyHost}:${proxyPort}`;
      config.httpsAgent = new HttpsProxyAgent(proxyUrl);
      config.proxy = false;
    }
    return axios.create(config);
  }

  async countdown(seconds) {
    for (let i = seconds; i > 0; i--) {
      clearLine();
      process.stdout.write(`Waiting ${i} seconds...`);
      await delay(1000);
    }
    clearLine();
  }

  encryptPayload(text, key) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString("base64") + encrypted.toString("base64");
  }

  async fetchAccessToken(queryString) {
    const url = "https://www.binance.com/bapi/growth/v1/friendly/growth-paas/third-party/access/accessToken";
    try {
      const response = await this.axios.post(url, { queryString, socialType: "telegram" });
      return response.data.data.accessToken;
    } catch (error) {
      logger.error("Failed to fetch access token.");
      return null;
    }
  }

  async startGame(accessToken) {
    const url = "https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/game/start";
    try {
      const response = await this.axios.post(url, { resourceId: 2056 }, { headers: { "X-Growth-Token": accessToken } });
      if (response.data.code === "000000") {
        logger.info("Game started successfully.");
        return response.data;
      } else {
        logger.warn("Unable to start game.");
        return null;
      }
    } catch (error) {
      logger.error("Game start request failed.");
      return null;
    }
  }

  async simulateGameEvents(gameTag, duration = 45000) {
    const events = [];
    let currentTime = Date.now();
    const endTime = currentTime + duration;

    while (currentTime < endTime) {
      const eventTime = currentTime + Math.floor(Math.random() * 2000 + 1500);
      const data = {
        time: eventTime,
        posX: (Math.random() * 200 + 50).toFixed(3),
        posY: (Math.random() * 50 + 200).toFixed(3),
        angle: (Math.random() * 2 - 1).toFixed(3),
      };
      events.push(`${data.time}|${data.posX}|${data.posY}|${data.angle}`);
      currentTime = eventTime;
    }

    const payload = events.join(";");
    return this.encryptPayload(payload, gameTag);
  }

  async completeGame(accessToken, encryptedData) {
    const url = "https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/game/complete";
    try {
      const response = await this.axios.post(
        url,
        { resourceId: 2056, payload: encryptedData },
        { headers: { "X-Growth-Token": accessToken } }
      );
      return response.data.success;
    } catch (error) {
      logger.error("Failed to complete the game.");
      return false;
    }
  }

  async play(queryString) {
    const accessToken = await this.fetchAccessToken(queryString);
    if (!accessToken) return;

    const startGameResponse = await this.startGame(accessToken);
    if (!startGameResponse) return;

    const gameTag = startGameResponse.data.gameTag;
    const encryptedData = await this.simulateGameEvents(gameTag);
    const success = await this.completeGame(accessToken, encryptedData);

    if (success) logger.info("Game completed successfully.");
    else logger.error("Game completion failed.");
  }

  async run() {
    logger.info("Starting Binance MoonBix Script...");
    const useProxy = prompt("Use proxy? (y/n): ").toLowerCase() === "y";

    if (useProxy && !this.proxyConfig.useProxy) {
      logger.warn("Proxy is not configured. Update config.json.");
      return;
    }

    const accounts = fs.readFileSync(path.join(__dirname, "data.txt"), "utf8").split("\n").filter(Boolean);
    while (true) {
      for (let i = 0; i < accounts.length; i++) {
        const queryString = accounts[i];
        logger.info(`Processing account ${i + 1}`);
        await this.play(queryString);
        await delay(1000);
      }
      logger.info("Cycle complete. Waiting 24 hours.");
      await this.countdown(86400); // 24 hours
    }
  }
}

// Initialize and Run
const client = new Binance();
client.run().catch((err) => {
  logger.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});
