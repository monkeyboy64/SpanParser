const { DOMParser } = require('xmldom');
const words = require('lodash/fp/words').convert({ cap: false });

const OT = 'ot';
const LIGA = 'liga';

const FEATURES_REGEX = /^(aalt|swsh|salt|ss[0-9]{2})/;

function SpanSchema(spans, ligas) {
  this.spans = spans;
  this.ligas = ligas;
}

SpanSchema.prototype.toString = function () {
  const spanElements = this.spans.map(toSpanElement);
  return `<p>${spanElements.join('')}</p>`;
};

function parseSpans(text) {
  text = text ? text : `<p>${text}</p>`;
  const p = new DOMParser(text).parseFromString(text, 'text/html').getElementsByTagName('p')[0];
  const ligas = {};
  const outSpans = [];

  if (p) {
    let finish = false;
    let content = '';
    let sc = '';
    for (let i = 0; i < p.childNodes.length; ++i) {
      const span = p.childNodes[i];
      const styleElement = span.attributes.getNamedItem('style');
      let styleContent = '';
      if (styleElement) {
        styleContent = styleElement.textContent;
        const styles = styleContent.split(';');
        const stylesToKeep = [];
        // eslint-disable-next-line
        styles.forEach(style => {
          if (style.startsWith(OT)) {
            const [, otFeature] = style.split(':');
            if (otFeature === LIGA) {
              ligas[span.textContent] = styleContent;
            }

            if (FEATURES_REGEX.test(otFeature)) {
              // If we just found an AALT or SWSH, then we need to push the previous
              // span into the list before dealing with this span
              if (content.length) {
                outSpans.push({
                  content,
                  length: content.length,
                  style: sc,
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
        styleContent = styleContent.length ? `${styleContent};` : styleContent;
      }

      content = `${content}${span.textContent}`;
      sc = styleContent;

      if (finish || i === p.childNodes.length - 1) {
        outSpans.push({
          content,
          length: content.length,
          style: styleContent,
        });
        content = '';
        finish = false;
      }
    }
  }

  const toString = () => {
    const spanElements = outSpans.map(toSpanElement);
    return `<p>${spanElements.join('')}</p>`;
  };

  return new SpanSchema(outSpans, ligas);
}

function getWords(text) {
  return words(text, /[^ ]+/g);
}

const EMPTY_SPAN = {
  content: '',
  style: '',
};

function applySpans(schema, text) {
  if (!schema || !schema.spans.length) {
    return text;
  }
  const spanCount = schema.spans.length;

  const newSpans = [];

  if (spanCount === 7) {
    const words = getWords(text);
    const wordCount = words.length;

    // If we have 3 words, where the middle word is 1 character
    if (wordCount === 3 && words[1].length === 1) {
      newSpans.push(...fillThreeSpans(schema.spans.slice(0, 3), words[0]));
      newSpans.push({
        content: ` ${words[1]} `,
        style: schema.spans[3].style,
      });
      newSpans.push(...fillThreeSpans(schema.spans.slice(4), words[2]));
    } else if (wordCount === 2) {
      newSpans.push(...fillThreeSpans(schema.spans.slice(0, 3), words[0]));
      newSpans.push({
        content: ' ',
        style: schema.spans[3].style,
      });
      newSpans.push(...fillThreeSpans(schema.spans.slice(4), words[1]));
    } else if (wordCount === 1) {
      newSpans.push(...fillThreeSpans(schema.spans.slice(0, 3), words[0]));
      newSpans.push({ ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN });
    } else {
      newSpans.push({
        content: text,
        style: '',
      });
      newSpans.push({ ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN });
    }
  } else if (spanCount === 5) {
    const words = getWords(text);
    const wordCount = words.length;

    //handle 3 words with middle initial
    if (wordCount === 3 && words[1].length === 1) {
      newSpans.push(...fillTwoSpans(schema.spans.slice(0, 2), false, words[0]));
      newSpans.push({
        content: ` ${words[1]} `,
        style: schema.spans[2].style,
      });
      newSpans.push(...fillTwoSpans(schema.spans.slice(3), true, words[2]));
    } else if (wordCount === 2) {
      newSpans.push(...fillTwoSpans(schema.spans.slice(0, 2), false, words[0]));
      newSpans.push({
        content: ' ',
        style: '',
      });
      newSpans.push(...fillTwoSpans(schema.spans.slice(3), true, words[1]));
    } else if (wordCount === 1) {
      newSpans.push(...fillTwoSpans(schema.spans.slice(0, 2), false, words[0]));
      newSpans.push({ ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN });
    } else {
      newSpans.push({
        content: text,
        style: '',
      });
      newSpans.push({ ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN });
    }
  } else if (spanCount === 4) {
    const words = getWords(text);
    const wordCount = words.length;

    if (wordCount === 2) {
      newSpans.push(...fillTwoSpans(schema.spans.slice(0, 2), false, words[0]));
      newSpans.push(...fillTwoSpans(schema.spans.slice(2), schema.spans[2].length !== 1, words[1]));
    } else if (wordCount === 1) {
      newSpans.push(...fillTwoSpans(schema.spans.slice(0, 2), false, words[0]));
      newSpans.push({ ...EMPTY_SPAN }, { ...EMPTY_SPAN });
    } else {
      newSpans.push(
        ...schema.spans.map((span, index) => {
          return index === 0 ? { content: text, style: span.style } : { ...EMPTY_SPAN };
        }),
      );
    }
  } else if (spanCount === 3) {
    newSpans.push(...fillThreeSpans(schema.spans, text));
  } else if (spanCount === 2) {
    const invert = schema.spans[0].length > 1;
    newSpans.push(...fillTwoSpans(schema.spans, invert, text));
  } else {
    newSpans.push(
      ...schema.spans.map((span, index) => {
        return index === 0 ? { content: text, style: span.style } : { ...EMPTY_SPAN };
      }),
    );
  }

  const filteredSpans = newSpans.filter(s => s);

  const newSpansWithLigatures = [...filteredSpans]; //applyLigatures(newSpans, schema.ligas);

  const spanElements = newSpansWithLigatures.map(toSpanElement);

  return `<p>${spanElements.join('')}</p>`;
}

function fillTwoSpans(spans, invert, text) {
  const length = invert ? text.length - spans[1].length : spans[0].length;

  const newSpans = [{ content: text.substr(0, length), style: spans[0].style }, { content: text.substr(length), style: spans[1].style }];

  return newSpans;
}

function fillThreeSpans(spans, text) {
  const newSpans = [];
  const middleLength = Math.max(0, text.length - (spans[0].length + spans[2].length));

  if (middleLength) {
    newSpans.push({ content: text.substr(0, spans[0].length), style: spans[0].style });
    newSpans.push({ content: text.substr(spans[0].length, middleLength), style: spans[1].style });
    newSpans.push({ content: text.substr(spans[0].length + middleLength), style: spans[2].style });
  } else if (text.length > spans[0].length) {
    newSpans.push({ content: text.substr(0, spans[0].length), style: spans[0].style });
    newSpans.push({ content: '', style: spans[1].style });
    newSpans.push({ content: text.substr(spans[0].length), style: spans[2].style });
  } else {
    newSpans.push({ content: text.substr(0, spans[0].length), style: spans[0].style });
    newSpans.push({ content: '', style: '' });
    newSpans.push({ content: '', style: '' });
  }

  return newSpans;
}

// function applyLigatures(spans, ligas) {
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
  return `<span style="${spanSchema.style}">${spanSchema.content}</span>`;
}

module.exports = {
  parseSpans,
  applySpans,
  getWords,
};
