import tse from "tse-client";
import jalaali from "jalaali-js";

export default class TSE {
  static timeframes = new Map();

  static {
    TSE.timeframes.set("D", "D");
    TSE.timeframes.set("W", "W");
    TSE.timeframes.set("M", "M");
  }

  constructor() {}

  async getInstruments() {
    return await tse.getInstruments();
  }

  async getPrices(symbol, timeframe, count, from, to) {
    try {
      if (!TSE.timeframes.has(timeframe)) {
        throw new Error(
          `The requested timeframe does not exist for this data provider: ${symbol}-${timeframe}`,
        );
      }
      let settings = { adjustPrices: 1 };

      if (from) {
        settings = {
          ...settings,
          startDate: new Date(from.getTime() - 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, ""),
        };
      }
      const result = await tse.getPrices([symbol], settings);

      if (!result.data[0]) {
        throw new Error(result.error);
      }
      let fixedData = [];
      result.data[0].date.forEach((dateString, index) => {
        fixedData[
          new Date(
            `${dateString.toString().substring(0, 4)}-${dateString.toString().substring(4, 6)}-${dateString.toString().substring(6, 8)}T00:00:00Z`,
          ).toISOString()
        ] = {
          open: Math.round(result.data[0].open[index]),
          high: Math.round(result.data[0].high[index]),
          low: Math.round(result.data[0].low[index]),
          close: Math.round(result.data[0].last[index]),
          volume: result.data[0].vol[index],
        };
      });

      let symbolData = {
        datetime: Object.keys(fixedData).map((item) => new Date(item)),
        open: Object.values(fixedData).map((item) => item["open"]),
        high: Object.values(fixedData).map((item) => item["high"]),
        low: Object.values(fixedData).map((item) => item["low"]),
        close: Object.values(fixedData).map((item) => item["close"]),
        volume: Object.values(fixedData).map((item) => item["volume"]),
      };

      if (timeframe === "W") {
        symbolData = this.#resample(symbolData, "weekly");
      } else if (timeframe === "M") {
        symbolData = this.#resample(symbolData, "monthly");
      }

      if (to) {
        let cut = 0;
        for (let i = 0; i < symbolData.datetime.length; i++) {
          if (symbolData.datetime[i].getTime() > to.getTime()) {
            cut = i;
            break;
          } else if (symbolData.datetime[i].getTime() === to.getTime()) {
            cut = i + 1;
            break;
          }
        }

        symbolData = {
          datetime: symbolData.datetime.slice(0, cut),
          open: symbolData.open.slice(0, cut),
          high: symbolData.high.slice(0, cut),
          low: symbolData.low.slice(0, cut),
          close: symbolData.close.slice(0, cut),
          volume: symbolData.volume.slice(0, cut),
        };
      }
      if (count && symbolData.datetime.length > count) {
        symbolData = {
          datetime: symbolData.datetime.slice(-count),
          open: symbolData.open.slice(-count),
          high: symbolData.high.slice(-count),
          low: symbolData.low.slice(-count),
          close: symbolData.close.slice(-count),
          volume: symbolData.volume.slice(-count),
        };
      }
      symbolData = {
        datetime: symbolData.datetime.map((item) =>
          parseInt(item?.getTime() / 1000),
        ),
        open: symbolData.open.slice(-count),
        high: symbolData.high.slice(-count),
        low: symbolData.low.slice(-count),
        close: symbolData.close.slice(-count),
        volume: symbolData.volume.slice(-count),
      };
      return symbolData;
    } catch (error) {
      return {
        datetime: [],
        close: [],
        high: [],
        low: [],
        open: [],
        volume: [],
      };
    }
  }

  #aggregateData(symbolData, weekIndices) {
    const weeklyData = {
      datetime: [],
      open: [],
      high: [],
      low: [],
      close: [],
    };

    Object.entries(weekIndices).forEach(([startOfWeek, week]) => {
      // Initialize weekly values
      let weeklyHigh = Number.NEGATIVE_INFINITY;
      let weeklyLow = Number.POSITIVE_INFINITY;
      let weeklyVolume = 0;

      week.forEach((index) => {
        weeklyHigh = Math.max(weeklyHigh, symbolData.high[index]);
        weeklyLow = Math.min(weeklyLow, symbolData.low[index]);
        if (symbolData.volume) {
          weeklyVolume += symbolData.volume[index];
        }
      });

      if (weeklyVolume !== 0) {
        weeklyData.open.push(symbolData.open[week[0]]);
        weeklyData.high.push(weeklyHigh);
        weeklyData.low.push(weeklyLow);
        weeklyData.close.push(symbolData.close[week[week.length - 1]]); // Set last close of the week
        weeklyData.datetime.push(new Date(startOfWeek));

        if (symbolData.volume) {
          if (!weeklyData.volume) {
            weeklyData.volume = [];
          }
          weeklyData.volume.push(weeklyVolume);
        }
      }
    });

    return weeklyData;
  }

  #getAllDays(symbolData) {
    const start = symbolData.datetime[0];
    const end = symbolData.datetime.at(-1);
    let currentDatetime = new Date(start.getTime());
    const days = [];
    while (true) {
      if (currentDatetime > end) {
        break;
      }
      days.push(currentDatetime);
      currentDatetime = new Date(
        currentDatetime.getTime() + 24 * 60 * 60 * 1000,
      );
    }

    return days;
  }

  #getStartDatetimes(days, type) {
    const datetimes = [];
    days.forEach((day) => {
      if (
        (type === "weekly" && day.getDay() === 6) ||
        (type === "monthly" && jalaali.toJalaali(day).jd === 1)
      ) {
        datetimes.push(day);
      }
    });

    if (datetimes.length === 0) {
      let lastDatetime = days[0];
      while (true) {
        lastDatetime = new Date(lastDatetime.getTime() - 24 * 60 * 60 * 1000);
        if (
          (type === "weekly" && lastDatetime.getDay() === 6) ||
          (type === "monthly" && jalaali.toJalaali(lastDatetime).jd === 1)
        ) {
          datetimes.push(lastDatetime);
          break;
        }
      }
    }
    let lastDatetime = new Date(datetimes[datetimes.length - 1].getTime());
    while (true) {
      lastDatetime = new Date(lastDatetime.getTime() + 24 * 60 * 60 * 1000);
      if (
        (type === "weekly" && lastDatetime.getDay() === 6) ||
        (type === "monthly" && jalaali.toJalaali(lastDatetime).jd === 1)
      ) {
        datetimes.push(lastDatetime);
        break;
      }
    }
    return datetimes;
  }

  #groupDatetimes(symbolData, startDatetimes) {
    let datetimeIndex = 0;
    let dayIndex = 0;
    let groupedDatetimes = {};

    while (
      dayIndex < symbolData.datetime.length &&
      datetimeIndex < startDatetimes.length - 1
    ) {
      if (
        symbolData.datetime[dayIndex] < startDatetimes[datetimeIndex + 1] &&
        symbolData.datetime[dayIndex] >= startDatetimes[datetimeIndex]
      ) {
        if (!groupedDatetimes[startDatetimes[datetimeIndex].toISOString()]) {
          groupedDatetimes[startDatetimes[datetimeIndex].toISOString()] = [];
        }
        groupedDatetimes[startDatetimes[datetimeIndex].toISOString()].push(
          dayIndex,
        );
        dayIndex = dayIndex + 1;
      } else if (
        symbolData.datetime[dayIndex] >= startDatetimes[datetimeIndex + 1]
      ) {
        datetimeIndex = datetimeIndex + 1;
      } else {
        dayIndex = dayIndex + 1;
      }
    }
    return groupedDatetimes;
  }

  #resample(symbolData, type) {
    const days = this.#getAllDays(symbolData);
    const startDatetimes = this.#getStartDatetimes(days, type);
    const groupedDatetimes = this.#groupDatetimes(symbolData, startDatetimes);
    return this.#aggregateData(symbolData, groupedDatetimes);
  }
}
