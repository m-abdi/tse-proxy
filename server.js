const express = require('express');
const tse = require('tse-client');

const app = express();
const port = 3000;

app.get('/prices', async (req, res) => {
  const symbols = req.query.symbols ? req.query.symbols.split(',') : ['ذوب', 'فولاد'];
  const adjustPrices = req.query.adjust === 'true'; // Convert string to boolean
  const columns = req.query.columns ? req.query.columns.split(',') : null;

  try {
    const options = {
      adjustPrices: adjustPrices
    };

    if (columns) {
      options.columns = columns.map(col => {
        const [num, name] = col.split(':');
        return [parseInt(num), name ? name : null];
      });
    }

    const data = await tse.getPrices(symbols, options);

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    res.json(data.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/instruments', async (req, res) => {
  try {
    const instruments = await tse.getInstruments();
    res.json(instruments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
