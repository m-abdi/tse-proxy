import express from "express";
import tse from "./tse.mjs";

const app = express();
const port = 3000;

const tseClient = new tse();

app.get("/prices", async (req, res) => {
  const symbol = req.query.symbol;
  const timeframe = req.query.timeframe ?? "D";
  const count = req.query.count ?? 1500;
  const from = req.query.from ?? undefined;
  const to = req.query.to ?? undefined;

  try {
    const data = await tseClient.getPrices(
      symbol,
      timeframe,
      count,
      from && new Date(from?.includes('-') ? from : parseInt(from) * 1000),
      to && new Date(to?.includes('-') ? to : parseInt(to) * 1000),
    );

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/instruments", async (req, res) => {
  try {
    const instruments = await tseClient.getInstruments();
    res.json(instruments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
