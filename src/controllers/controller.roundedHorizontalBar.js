"use strict";

import Chart from "chart.js";
import RoundedBarController from "./controller.roundedBar";

const defaults = Chart.defaults;

defaults._set("horizontalBar", {
  hover: {
    mode: "index",
    axis: "y",
  },

  scales: {
    xAxes: [
      {
        type: "linear",
        position: "bottom",
      },
    ],

    yAxes: [
      {
        type: "category",
        position: "left",
        offset: true,
        gridLines: {
          offsetGridLines: true,
        },
      },
    ],
  },

  elements: {
    rectangle: {
      borderSkipped: "left",
    },
  },

  tooltips: {
    mode: "index",
    axis: "y",
  },
});

defaults._set("global", {
  datasets: {
    horizontalBar: {
      categoryPercentage: 0.8,
      barPercentage: 0.9,
    },
  },
});

export default RoundedBarController.extend({
  /**
   * @private
   */
  _getValueScaleId: function () {
    return this.getMeta().xAxisID;
  },

  /**
   * @private
   */
  _getIndexScaleId: function () {
    return this.getMeta().yAxisID;
  },
});
