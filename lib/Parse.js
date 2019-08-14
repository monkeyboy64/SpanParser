"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var _require = require('xmldom'),
    DOMParser = _require.DOMParser;

var words = require('lodash/fp/words').convert({
  cap: false
});

var OT = 'ot';
var LIGA = 'liga';
var FEATURES_REGEX = /^(aalt|swsh|salt|ss[0-9]{2})/;

function SpanSchema(spans, ligas) {
  this.spans = spans;
  this.ligas = ligas;
}

SpanSchema.prototype.toString = function () {
  var spanElements = this.spans.map(toSpanElement);
  return "<p>".concat(spanElements.join(''), "</p>");
};

SpanSchema.prototype.toPlainText = function () {
  var spanElements = this.spans.map(function (span) {
    return span.content;
  });
  return spanElements.join('');
};

function ParagraphSchema(spanSchema) {
  this.spanSchema = spanSchema;
}

ParagraphSchema.prototype.toString = function () {
  if (this.spanSchema) {
    return this.spanSchema.toString();
  }
};

ParagraphSchema.prototype.toPlainText = function () {
  if (this.spanSchema) {
    return this.spanSchema.toPlainText();
  }
};

function ParagraphsSchema() {
  var paragraphSchemas = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var originalText = arguments.length > 1 ? arguments[1] : undefined;
  this.paragraphs = paragraphSchemas;
  this.originalText = originalText;
}

ParagraphsSchema.prototype.toString = function () {
  if (!this.paragraphs.length) {
    return this.originalText;
  }

  return this.paragraphs.map(function (p) {
    return p.toString();
  }).join('');
};

ParagraphsSchema.prototype.toPlainText = function () {
  if (!this.paragraphs.length) {
    return this.originalText;
  }

  return this.paragraphs.map(function (p) {
    return p.toPlainText();
  }).join('\n');
};

function parseSpans(originalText) {
  if (!originalText) {
    return new ParagraphsSchema();
  }

  var text = originalText || "<p>".concat(originalText, "</p>");
  var doc = new DOMParser().parseFromString(text, 'text/html');
  var ps = doc.getElementsByTagName('p');
  var outParagraphs = [];

  if (!ps.length) {
    // Check to see if there is a text node on the
    if (doc.childNodes.length === 1 && doc.childNodes[0].nodeType === 3) {
      return new ParagraphsSchema([], originalText);
    }
  }

  for (var i = 0; i < ps.length; i += 1) {
    var paragraph = ps[i];
    outParagraphs.push(parseParagraph(paragraph));
  }

  return new ParagraphsSchema(outParagraphs);
}

function parseParagraph(paragraph) {
  var ligas = {};
  var outSpans = [];

  if (paragraph) {
    (function () {
      var finish = false;
      var content = '';
      var sc = '';

      var _loop = function _loop(i) {
        var span = paragraph.childNodes[i];
        var styleElement = span.attributes.getNamedItem('style');
        var styleContent = '';

        if (styleElement) {
          styleContent = styleElement.textContent;
          var styles = styleContent.split(';');
          var stylesToKeep = []; // eslint-disable-next-line

          styles.forEach(function (style) {
            if (style.startsWith(OT)) {
              var _style$split = style.split(':'),
                  _style$split2 = _slicedToArray(_style$split, 2),
                  otFeature = _style$split2[1];

              if (otFeature === LIGA) {
                ligas[span.textContent] = styleContent;
              }

              if (FEATURES_REGEX.test(otFeature)) {
                // If we just found an AALT or SWSH, then we need to push the previous
                // span into the list before dealing with this span
                if (content.length) {
                  outSpans.push({
                    content: content,
                    length: content.length,
                    style: sc
                  });
                  content = '';
                  sc = '';
                }

                finish = true;
              }

              stylesToKeep.push(style);
            }
          });
          styleContent = stylesToKeep.join(';');
          styleContent = styleContent.length ? "".concat(styleContent, ";") : styleContent;
        }

        content = "".concat(content).concat(span.textContent);
        sc = styleContent;

        if (finish || i === paragraph.childNodes.length - 1) {
          outSpans.push({
            content: content,
            length: content.length,
            style: styleContent
          });
          content = '';
          finish = false;
        }
      };

      for (var i = 0; i < paragraph.childNodes.length; ++i) {
        _loop(i);
      }
    })();
  }

  return new ParagraphSchema(new SpanSchema(outSpans, ligas));
}

function getWords(text) {
  return words(text, /[^ ]+/g);
}

var EMPTY_SPAN = {
  content: '',
  style: ''
};

function applyParagraph(spanSchema, text) {
  if (!spanSchema || !spanSchema.spans.length) {
    return "<p>".concat(text, "</p>");
  }

  var spanCount = spanSchema.spans.length;
  var newSpans = [];

  if (spanCount === 7) {
    var _words = getWords(text);

    var wordCount = _words.length; // If we have 3 words, where the middle word is 1 character

    if (wordCount === 3 && _words[1].length === 1) {
      newSpans.push.apply(newSpans, _toConsumableArray(fillThreeSpans(spanSchema.spans.slice(0, 3), _words[0])));
      newSpans.push({
        content: " ".concat(_words[1], " "),
        style: spanSchema.spans[3].style
      });
      newSpans.push.apply(newSpans, _toConsumableArray(fillThreeSpans(spanSchema.spans.slice(4), _words[2])));
    } else if (wordCount === 2) {
      newSpans.push.apply(newSpans, _toConsumableArray(fillThreeSpans(spanSchema.spans.slice(0, 3), _words[0])));
      newSpans.push({
        content: ' ',
        style: spanSchema.spans[3].style
      });
      newSpans.push.apply(newSpans, _toConsumableArray(fillThreeSpans(spanSchema.spans.slice(4), _words[1])));
    } else if (wordCount === 1) {
      newSpans.push.apply(newSpans, _toConsumableArray(fillThreeSpans(spanSchema.spans.slice(0, 3), _words[0])));
      newSpans.push(_objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN));
    } else {
      newSpans.push({
        content: text,
        style: ''
      });
      newSpans.push(_objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN));
    }
  } else if (spanCount === 5) {
    var _words2 = getWords(text);

    var _wordCount = _words2.length; //handle 3 words with middle initial

    if (_wordCount === 3 && _words2[1].length === 1) {
      newSpans.push.apply(newSpans, _toConsumableArray(fillTwoSpans(spanSchema.spans.slice(0, 2), false, _words2[0])));
      newSpans.push({
        content: " ".concat(_words2[1], " "),
        style: spanSchema.spans[2].style
      });
      newSpans.push.apply(newSpans, _toConsumableArray(fillTwoSpans(spanSchema.spans.slice(3), true, _words2[2])));
    } else if (_wordCount === 2) {
      newSpans.push.apply(newSpans, _toConsumableArray(fillTwoSpans(spanSchema.spans.slice(0, 2), false, _words2[0])));
      newSpans.push({
        content: ' ',
        style: ''
      });
      newSpans.push.apply(newSpans, _toConsumableArray(fillTwoSpans(spanSchema.spans.slice(3), true, _words2[1])));
    } else if (_wordCount === 1) {
      newSpans.push.apply(newSpans, _toConsumableArray(fillTwoSpans(spanSchema.spans.slice(0, 2), false, _words2[0])));
      newSpans.push(_objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN));
    } else {
      newSpans.push({
        content: text,
        style: ''
      });
      newSpans.push(_objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN));
    }
  } else if (spanCount === 4) {
    var _words3 = getWords(text);

    var _wordCount2 = _words3.length;

    if (_wordCount2 === 2) {
      newSpans.push.apply(newSpans, _toConsumableArray(fillTwoSpans(spanSchema.spans.slice(0, 2), false, _words3[0])));
      newSpans.push.apply(newSpans, _toConsumableArray(fillTwoSpans(spanSchema.spans.slice(2), spanSchema.spans[2].length !== 1, _words3[1])));
    } else if (_wordCount2 === 1) {
      newSpans.push.apply(newSpans, _toConsumableArray(fillTwoSpans(spanSchema.spans.slice(0, 2), false, _words3[0])));
      newSpans.push(_objectSpread({}, EMPTY_SPAN), _objectSpread({}, EMPTY_SPAN));
    } else {
      newSpans.push.apply(newSpans, _toConsumableArray(spanSchema.spans.map(function (span, index) {
        return index === 0 ? {
          content: text,
          style: span.style
        } : _objectSpread({}, EMPTY_SPAN);
      })));
    }
  } else if (spanCount === 3) {
    newSpans.push.apply(newSpans, _toConsumableArray(fillThreeSpans(spanSchema.spans, text)));
  } else if (spanCount === 2) {
    var invert = spanSchema.spans[0].length > 1;
    newSpans.push.apply(newSpans, _toConsumableArray(fillTwoSpans(spanSchema.spans, invert, text)));
  } else {
    newSpans.push.apply(newSpans, _toConsumableArray(spanSchema.spans.map(function (span, index) {
      return index === 0 ? {
        content: text,
        style: span.style
      } : _objectSpread({}, EMPTY_SPAN);
    })));
  }

  var filteredSpans = newSpans.filter(function (s) {
    return s;
  });

  var newSpansWithLigatures = _toConsumableArray(filteredSpans); //applyLigatures(newSpans, schema.ligas);


  var spanElements = newSpansWithLigatures.map(toSpanElement);
  return "<p>".concat(spanElements.join(''), "</p>");
}

function applySpans(paragraphsSchema, text) {
  if (!paragraphsSchema || !paragraphsSchema.paragraphs.length) {
    return text;
  }

  var nodes = new DOMParser().parseFromString(text, 'text/html');
  var textParagraphs = []; // See if we just have plain text

  if (nodes.childNodes.length === 1 && nodes.childNodes[0].nodeType === 3) {
    textParagraphs = text.split('\n');
  } else {
    var paragraphs = nodes.getElementsByTagName('p');

    for (var i = 0; i < paragraphs.length; i += 1) {
      var paragraph = paragraphs[i];
      var spans = paragraph.getElementsByTagName('span');
      var paragraphText = '';

      for (var j = 0; j < spans.length; j += 1) {
        var span = spans[j];
        paragraphText = "".concat(paragraphText).concat(span.textContent);
      }

      textParagraphs.push(paragraphText);
    }
  }

  var outText = paragraphsSchema.paragraphs.map(function (paragraph, index) {
    var spanSchema = paragraph.spanSchema;
    var text = textParagraphs[index] || '';
    return applyParagraph(spanSchema, text);
  }); // See if we have more text paragraphs

  if (paragraphsSchema.paragraphs.length < textParagraphs.length) {
    var moreOutText = textParagraphs.slice(paragraphsSchema.length).map(function (textParagraph) {
      return "<p><span style=\"ot:liga;ot:locl,0;\">".concat(textParagraph, "</span></p>");
    });
    outText.push.apply(outText, _toConsumableArray(moreOutText));
  }

  return outText.join('');
}

function fillTwoSpans(spans, invert, text) {
  var length = invert ? text.length - spans[1].length : spans[0].length;
  var newSpans = [{
    content: text.substr(0, length),
    style: spans[0].style
  }, {
    content: text.substr(length),
    style: spans[1].style
  }];
  return newSpans;
}

function fillThreeSpans(spans, text) {
  var newSpans = [];
  var middleLength = Math.max(0, text.length - (spans[0].length + spans[2].length));

  if (middleLength) {
    newSpans.push({
      content: text.substr(0, spans[0].length),
      style: spans[0].style
    });
    newSpans.push({
      content: text.substr(spans[0].length, middleLength),
      style: spans[1].style
    });
    newSpans.push({
      content: text.substr(spans[0].length + middleLength),
      style: spans[2].style
    });
  } else if (text.length > spans[0].length) {
    newSpans.push({
      content: text.substr(0, spans[0].length),
      style: spans[0].style
    });
    newSpans.push({
      content: '',
      style: spans[1].style
    });
    newSpans.push({
      content: text.substr(spans[0].length),
      style: spans[2].style
    });
  } else {
    newSpans.push({
      content: text.substr(0, spans[0].length),
      style: spans[0].style
    });
    newSpans.push({
      content: '',
      style: ''
    });
    newSpans.push({
      content: '',
      style: ''
    });
  }

  return newSpans;
} // function applyLigatures(spans, ligas) {
//   const ligaKeys = Object.keys(ligas);
//   if (!ligaKeys) {
//     return spans;
//   }
//   return spans.reduce((acc, span) => {
//     const allSpans = [];
//     ligaKeys.forEach(liga => {
//       const reg = new RegExp(liga, 'g');
//       const match = reg.exec(span.content);
//       while (match) {}
//     });
//     if (!allSpans.length) {
//       allSpans.push(span);
//     }
//     return [...acc, ...appSpans];
//   }, []);
// }


function toSpanElement(spanSchema) {
  return "<span style=\"".concat(spanSchema.style, "\">").concat(spanSchema.content, "</span>");
}

module.exports = {
  parseSpans: parseSpans,
  applySpans: applySpans,
  getWords: getWords
};