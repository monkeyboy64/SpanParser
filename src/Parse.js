const { DOMParser } = require('xmldom');
const escape = require('lodash/fp/escape');
const words = require('lodash/fp/words').convert({ cap: false });

const OT = 'ot';
const LIGA = 'liga';

const FEATURES_REGEX = /^(aalt|swsh|salt|ss[0-9]{2})/;

function SpanSchema(spans, ligas) {
  this.spans = spans;
  this.ligas = ligas;
}

SpanSchema.prototype.toString = function() {
  const spanElements = this.spans.map(toSpanElement);
  return `<p>${spanElements.join('')}</p>`;
};

SpanSchema.prototype.toPlainText = function() {
  const spanElements = this.spans.map(span => span.content);
  return spanElements.join('');
};

function ParagraphSchema(spanSchema) {
  this.spanSchema = spanSchema;
}

ParagraphSchema.prototype.toString = function() {
  if (this.spanSchema) {
    return this.spanSchema.toString();
  }

  return '';
};

ParagraphSchema.prototype.toPlainText = function() {
  if (this.spanSchema) {
    return this.spanSchema.toPlainText();
  }

  return '';
};

function ParagraphsSchema(paragraphSchemas = [], originalText) {
  this.paragraphs = paragraphSchemas;
  this.originalText = originalText;
}

ParagraphsSchema.prototype.toString = function() {
  if (!this.paragraphs.length) {
    return this.originalText;
  }

  return this.paragraphs.map(p => p.toString()).join('');
};

ParagraphsSchema.prototype.toPlainText = function() {
  if (!this.paragraphs.length) {
    return this.originalText;
  }

  return this.paragraphs.map(p => p.toPlainText()).join('\n');
};

function parseSpans(originalText) {
  if (!originalText) {
    return new ParagraphsSchema([]);
  }

  const text = originalText || `<p>${originalText}</p>`;
  const doc = new DOMParser().parseFromString(text, 'text/html');
  if (doc) {
    const ps = doc.getElementsByTagName('p');
    const outParagraphs = [];

    if (!ps.length) {
      // Check to see if there is a text node on the doc
      if (doc.childNodes.length === 1 && doc.childNodes[0].nodeType === 3) {
        return new ParagraphsSchema([], originalText);
      }
    }

    for (let i = 0; i < ps.length; i += 1) {
      const paragraph = ps[i];
      outParagraphs.push(parseParagraph(paragraph));
    }

    return new ParagraphsSchema(outParagraphs);
  }

  return new ParagraphsSchema([], originalText);
}

function parseParagraph(paragraph) {
  const ligas = {};
  const outSpans = [];

  if (paragraph) {
    let finish = false;
    let content = '';
    let sc = '';
    for (let i = 0; i < paragraph.childNodes.length; i += 1) {
      const span = paragraph.childNodes[i];
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

      if (finish || i === paragraph.childNodes.length - 1) {
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

  return new ParagraphSchema(new SpanSchema(outSpans, ligas));
}

function getWords(text) {
  return words(text, /[^ ]+/g);
}

const EMPTY_SPAN = {
  content: '',
  style: '',
};

function applyParagraph(spanSchema, text) {
  if (!text) {
    return '<p></p>';
  }

  if (!spanSchema || !spanSchema.spans.length) {
    return `<p><span style="ot:liga;ot:locl,0;">${text}</span></p>`;
  }
  const spanCount = spanSchema.spans.length;

  const newSpans = [];

  if (spanCount === 7) {
    const allWords = getWords(text);
    const wordCount = allWords.length;

    // If we have 3 words, where the middle word is 1 character
    if (wordCount === 3 && allWords[1].length === 1) {
      newSpans.push(...fillThreeSpans(spanSchema.spans.slice(0, 3), allWords[0]));
      newSpans.push({
        content: ` ${allWords[1]} `,
        style: spanSchema.spans[3].style,
      });
      newSpans.push(...fillThreeSpans(spanSchema.spans.slice(4), allWords[2]));
    } else if (wordCount === 2) {
      newSpans.push(...fillThreeSpans(spanSchema.spans.slice(0, 3), allWords[0]));
      newSpans.push({
        content: ' ',
        style: spanSchema.spans[3].style,
      });
      newSpans.push(...fillThreeSpans(spanSchema.spans.slice(4), allWords[1]));
    } else if (wordCount === 1) {
      newSpans.push(...fillThreeSpans(spanSchema.spans.slice(0, 3), allWords[0]));
      newSpans.push({ ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN });
    } else {
      newSpans.push({
        content: text,
        style: '',
      });
      newSpans.push({ ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN });
    }
  } else if (spanCount === 5) {
    const allWords = getWords(text);
    const wordCount = allWords.length;

    // handle 3 words with middle initial
    if (wordCount === 3 && allWords[1].length === 1) {
      newSpans.push(...fillTwoSpans(spanSchema.spans.slice(0, 2), false, allWords[0]));
      newSpans.push({
        content: ` ${allWords[1]} `,
        style: spanSchema.spans[2].style,
      });
      newSpans.push(...fillTwoSpans(spanSchema.spans.slice(3), true, allWords[2]));
    } else if (wordCount === 2) {
      newSpans.push(...fillTwoSpans(spanSchema.spans.slice(0, 2), false, allWords[0]));
      newSpans.push({
        content: ' ',
        style: '',
      });
      newSpans.push(...fillTwoSpans(spanSchema.spans.slice(3), true, allWords[1]));
    } else if (wordCount === 1) {
      newSpans.push(...fillTwoSpans(spanSchema.spans.slice(0, 2), false, allWords[0]));
      newSpans.push({ ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN });
    } else {
      newSpans.push({
        content: text,
        style: '',
      });
      newSpans.push({ ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN }, { ...EMPTY_SPAN });
    }
  } else if (spanCount === 4) {
    const allWords = getWords(text);
    const wordCount = allWords.length;

    if (wordCount === 2) {
      newSpans.push(...fillTwoSpans(spanSchema.spans.slice(0, 2), false, `${allWords[0]} `));
      newSpans.push(...fillTwoSpans(spanSchema.spans.slice(2), spanSchema.spans[2].length !== 1, allWords[1]));
    } else if (wordCount === 1) {
      newSpans.push(...fillTwoSpans(spanSchema.spans.slice(0, 2), false, allWords[0]));
      newSpans.push({ ...EMPTY_SPAN }, { ...EMPTY_SPAN });
    } else {
      newSpans.push(
        ...spanSchema.spans.map((span, index) => {
          return index === 0 ? { content: text, style: span.style } : { ...EMPTY_SPAN };
        }),
      );
    }
  } else if (spanCount === 3) {
    newSpans.push(...fillThreeSpans(spanSchema.spans, text));
  } else if (spanCount === 2) {
    const invert = spanSchema.spans[0].length > 1;
    newSpans.push(...fillTwoSpans(spanSchema.spans, invert, text));
  } else {
    newSpans.push(
      ...spanSchema.spans.map((span, index) => {
        return index === 0 ? { content: text, style: span.style } : { ...EMPTY_SPAN };
      }),
    );
  }

  const filteredSpans = newSpans.filter(s => s);

  const newSpansWithLigatures = [...filteredSpans]; // applyLigatures(newSpans, schema.ligas);

  const spanElements = newSpansWithLigatures.map(toSpanElement);

  return `<p>${spanElements.join('')}</p>`;
}

function applySpans(paragraphsSchema, text) {
  if (!paragraphsSchema || !paragraphsSchema.paragraphs.length) {
    return text;
  }

  let doc = null;

  try {
    doc = new DOMParser().parseFromString(text, 'text/html');
  } catch (e) {
    // noop
  }

  if (doc) {
    let textParagraphs = [];
    // See if we just have plain text
    if (doc.childNodes.length === 1 && doc.childNodes[0].nodeType === 3) {
      textParagraphs = text.split('\n');
    } else {
      const paragraphs = doc.getElementsByTagName('p');
      for (let i = 0; i < paragraphs.length; i += 1) {
        const paragraph = paragraphs[i];
        const spans = paragraph.getElementsByTagName('span');
        let paragraphText = '';
        for (let j = 0; j < spans.length; j += 1) {
          const span = spans[j];
          paragraphText = `${paragraphText}${span.textContent}`;
        }
        textParagraphs.push(paragraphText);
      }
    }

    let outText = paragraphsSchema.paragraphs.map((paragraph, index) => {
      const { spanSchema } = paragraph;
      const pText = escape(textParagraphs[index] || '');
      return applyParagraph(spanSchema, pText);
    });

    // See if we have more text paragraphs
    if (paragraphsSchema.paragraphs.length < textParagraphs.length) {
      const moreOutText = textParagraphs.slice(paragraphsSchema.paragraphs.length).map(textParagraph => {
        return `<p><span style="ot:liga;ot:locl,0;">${textParagraph}</span></p>`;
      });
      outText.push(...moreOutText);
    }

    if (outText.length > 1) {
      let found = false;
      outText = outText
        .reverse()
        .filter(t => {
          if (found) {
            return true;
          }

          const remove = t === '<p></p>';
          found = !remove;

          return !remove;
        })
        .reverse();
    }

    return outText.join('');
  }

  return '<p></p>';
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
