"use strict";

import Chart from "chart.js";
import RoundedRectangle from "../element.roundedRectangle";

const { isObject, extend } = Chart.helpers;
const PI = Math.PI;
const HALF_PI = PI / 2;
const numberOrZero = (v) => +v || 0;

// Ported from Chart.js 2.9.4
function isVertical(vm) {
  return vm && vm.width !== undefined;
}

// Ported from Chart.js 2.9.4
function swap(orig, v1, v2) {
  return orig === v1 ? v2 : orig === v2 ? v1 : orig;
}

// Ported from Chart.js 2.9.4
function parseBorderWidth(vm, maxW, maxH) {
  var value = vm.borderWidth;
  var skip = parseBorderSkipped(vm);
  var t, r, b, l;

  if (isObject(value)) {
    t = +value.top || 0;
    r = +value.right || 0;
    b = +value.bottom || 0;
    l = +value.left || 0;
  } else {
    t = r = b = l = +value || 0;
  }

  return {
    t: skip.top || t < 0 ? 0 : t > maxH ? maxH : t,
    r: skip.right || r < 0 ? 0 : r > maxW ? maxW : r,
    b: skip.bottom || b < 0 ? 0 : b > maxH ? maxH : b,
    l: skip.left || l < 0 ? 0 : l > maxW ? maxW : l,
  };
}

// Ported and parsed from Chart.js 3.0.0-beta.10
function parseBorderRadius(vm, maxW, maxH) {
  const value = vm.borderRadius;
  const o = toTRBLCorners(value);
  const maxR = Math.min(maxW, maxH);
  const skip = parseBorderSkipped(vm);

  return {
    topLeft: skipOrLimit(skip.top || skip.left, o.topLeft, 0, maxR),
    topRight: skipOrLimit(skip.top || skip.right, o.topRight, 0, maxR),
    bottomLeft: skipOrLimit(skip.bottom || skip.left, o.bottomLeft, 0, maxR),
    bottomRight: skipOrLimit(skip.bottom || skip.right, o.bottomRight, 0, maxR),
  };
}

/**
 * Ported from Chart.js 2.9.4
 *
 * Helper function to get the bounds of the bar regardless of the orientation
 * @param bar {Chart.Element.Rectangle} the bar
 * @return {Bounds} bounds of the bar
 * @private
 */
function getBarBounds(vm) {
  var x1, x2, y1, y2, half;

  if (isVertical(vm)) {
    half = vm.width / 2;
    x1 = vm.x - half;
    x2 = vm.x + half;
    y1 = Math.min(vm.y, vm.base);
    y2 = Math.max(vm.y, vm.base);
  } else {
    half = vm.height / 2;
    x1 = Math.min(vm.x, vm.base);
    x2 = Math.max(vm.x, vm.base);
    y1 = vm.y - half;
    y2 = vm.y + half;
  }

  return {
    left: x1,
    top: y1,
    right: x2,
    bottom: y2,
  };
}

/**
 * Converts the given value into a TRBL corners object (similar with css border-radius).
 * @param {number|object} value - If a number, set the value to all TRBL corner components,
 *  else, if an object, use defined properties and sets undefined ones to 0.
 * @returns {object} The TRBL corner values (topLeft, topRight, bottomLeft, bottomRight)
 * @since 3.0.0
 */
function toTRBLCorners(value) {
  let tl, tr, bl, br;

  if (isObject(value)) {
    tl = numberOrZero(value.topLeft);
    tr = numberOrZero(value.topRight);
    bl = numberOrZero(value.bottomLeft);
    br = numberOrZero(value.bottomRight);
  } else {
    tl = tr = bl = br = numberOrZero(value);
  }

  return {
    topLeft: tl,
    topRight: tr,
    bottomLeft: bl,
    bottomRight: br,
  };
}


function skipOrLimit(skip, value, min, max) {
  return skip ? 0 : Math.max(Math.min(value, max), min);
}

// Ported from Chart.js 2.9.4
function parseBorderSkipped(vm) {
  var edge = vm.borderSkipped;
  var res = {};

  if (!edge) {
    return res;
  }

  if (vm.horizontal) {
    if (vm.base > vm.x) {
      edge = swap(edge, "left", "right");
    }
  } else if (vm.base < vm.y) {
    edge = swap(edge, "bottom", "top");
  }

  res[edge] = true;
  return res;
}

// Ported from Chart.js 2.9.4
function boundingRects(vm) {
  const bounds = getBarBounds(vm);
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  const border = parseBorderWidth(vm, width / 2, height / 2);
  const radius = parseBorderRadius(vm, width / 2, height / 2);

  return {
    outer: {
      x: bounds.left,
      y: bounds.top,
      w: width,
      h: height,
      radius,
    },
    inner: {
      x: bounds.left + border.l,
      y: bounds.top + border.t,
      w: width - border.l - border.r,
      h: height - border.t - border.b,
      radius: {
        topLeft: Math.max(0, radius.topLeft - Math.max(border.t, border.l)),
        topRight: Math.max(0, radius.topRight - Math.max(border.t, border.r)),
        bottomLeft: Math.max(
          0,
          radius.bottomLeft - Math.max(border.b, border.l)
        ),
        bottomRight: Math.max(
          0,
          radius.bottomRight - Math.max(border.b, border.r)
        ),
      },
    },
  };
}

/**
 * Add a path of a rectangle with rounded corners to the current sub-path
 * @param {CanvasRenderingContext2D} ctx Context
 * @param {*} rect Bounding rect
 */
function addRoundedRectPath(ctx, rect) {
  const { x, y, w, h, radius } = rect;

  // top left arc
  ctx.arc(
    x + radius.topLeft,
    y + radius.topLeft,
    radius.topLeft,
    -HALF_PI,
    PI,
    true
  );

  // line from top left to bottom left
  ctx.lineTo(x, y + h - radius.bottomLeft);

  // bottom left arc
  ctx.arc(
    x + radius.bottomLeft,
    y + h - radius.bottomLeft,
    radius.bottomLeft,
    PI,
    HALF_PI,
    true
  );

  // line from bottom left to bottom right
  ctx.lineTo(x + w - radius.bottomRight, y + h);

  // bottom right arc
  ctx.arc(
    x + w - radius.bottomRight,
    y + h - radius.bottomRight,
    radius.bottomRight,
    HALF_PI,
    0,
    true
  );

  // line from bottom right to top right
  ctx.lineTo(x + w, y + radius.topRight);

  // top right arc
  ctx.arc(
    x + w - radius.topRight,
    y + radius.topRight,
    radius.topRight,
    0,
    -HALF_PI,
    true
  );

  // line from top right to top left
  ctx.lineTo(x + radius.topLeft, y);
}

let BarController = Chart.controllers.bar;

export default BarController.extend({
  dataElementType: RoundedRectangle,

  updateElement: function (rectangle, index) {
    const me = this;
    const options = me.chart.options.plugins.roundedBar;
    let model = {};
    let meta;

    meta = me.getMeta();
    meta.bar = true;

    Object.defineProperty(rectangle, "_model", {
      configurable: true,
      get: function () {
        return model;
      },
      set: function (value) {
        extend(model, value, me.chart.options.plugins.roundedBar);
      },
    });

    BarController.prototype.updateElement.apply(me, arguments);

    delete rectangle._model;
    rectangle._model = extend(model, {
      boundingRects: boundingRects,
      addRoundedRectPath: addRoundedRectPath,
    });

    rectangle._roundedBarOptions = options;
  },
  /**
   * Note: pixel values are not clamped to the scale area.
   * @private
   */
  calculateBarValuePixels: function (datasetIndex, index, options) {
    var me = this;
    var chart = me.chart;
    var scale = me._getValueScale();
    var isHorizontal = scale.isHorizontal();
    var datasets = chart.data.datasets;
    var metasets = scale._getMatchingVisibleMetas(me._type);
    var value = scale._parseValue(datasets[datasetIndex].data[index]);
    var minBarLength = options.minBarLength;
    var stacked = scale.options.stacked;
    var stack = me.getMeta().stack;
    var start =
      value.start === undefined
        ? 0
        : value.max >= 0 && value.min >= 0
        ? value.min
        : value.max;
    var length =
      value.start === undefined
        ? value.end
        : value.max >= 0 && value.min >= 0
        ? value.max - value.min
        : value.min - value.max;
    var ilen = metasets.length;
    var i, imeta, ivalue, base, head, size, stackLength;

    if (stacked || (stacked === undefined && stack !== undefined)) {
      for (i = 0; i < ilen; ++i) {
        imeta = metasets[i];

        if (imeta.index === datasetIndex) {
          break;
        }

        if (imeta.stack === stack) {
          stackLength = scale._parseValue(datasets[imeta.index].data[index]);
          ivalue =
            stackLength.start === undefined
              ? stackLength.end
              : stackLength.min >= 0 && stackLength.max >= 0
              ? stackLength.max
              : stackLength.min;

          if ((value.min < 0 && ivalue < 0) || (value.max >= 0 && ivalue > 0)) {
            start += ivalue - 20;
            length += 20;
          }
        }
      }
    }

    base = scale.getPixelForValue(start);
    head = scale.getPixelForValue(start + length);
    size = head - base;

    if (minBarLength !== undefined && Math.abs(size) < minBarLength) {
      size = minBarLength;
      if ((length >= 0 && !isHorizontal) || (length < 0 && isHorizontal)) {
        head = base - minBarLength;
      } else {
        head = base + minBarLength;
      }
    }

    return {
      size: size,
      base: base,
      head: head,
      center: head + size / 2,
    };
  },
});
