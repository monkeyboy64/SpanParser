const chai = require('chai');
const { parseSpans, applySpans, getWords } = require('./Parse');

const { expect } = chai;

describe('parseSpans', () => {
  it('one word to one word', () => {
    const input = '<p><span style="bold:true">Hi</span></p>';
    const schema = parseSpans(input);
    const text = 'Bye';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="">Bye</span></p>');
  });

  it('one word input to two word output', () => {
    const input = '<p><span style="bold:true">Hi</span></p>';
    const schema = parseSpans(input);
    const text = 'Bye there';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="">Bye there</span></p>');
  });

  it('one span input to two word output', () => {
    const input = '<p><span style="bold:true;">Hi There</span></p>';
    const schema = parseSpans(input);
    const text = 'See You';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="">See You</span></p>');
  });

  it('two spans, first character ot', () => {
    const input = '<p><span style="bold:true;ot:aalt;">H</span><span>i There</span></p>';
    const schema = parseSpans(input);
    const text = 'See You';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">S</span><span style="">ee You</span></p>');
  });

  it('two spans, first character ot, only 1 character to apply', () => {
    const input = '<p><span style="bold:true;ot:aalt;">H</span><span>i There</span></p>';
    const schema = parseSpans(input);
    const text = 'S';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">S</span><span style=""></span></p>');
  });

  it('three spans, first and last character ot, only 1 character to apply', () => {
    const input = '<p><span style="bold:true;ot:aalt;">H</span><span>i Ther</span><span style="ot:swsh;">e</span></p>';
    const schema = parseSpans(input);
    const text = 'S';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">S</span><span style=""></span><span style=""></span></p>');
  });

  it('three spans, first and last character ot, only 2 characters to apply', () => {
    const input = '<p><span style="bold:true;ot:aalt;">H</span><span>i Ther</span><span style="ot:swsh;">e</span></p>';
    const schema = parseSpans(input);
    const text = 'Se';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">S</span><span style=""></span><span style="ot:swsh;">e</span></p>');
  });

  it('three spans, first and last character ot, 3 characters to apply', () => {
    const input = '<p><span style="bold:true;ot:aalt;">H</span><span>i Ther</span><span style="ot:swsh;">e</span></p>';
    const schema = parseSpans(input);
    const text = 'Set';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">S</span><span style="">e</span><span style="ot:swsh;">t</span></p>');
  });

  it('three spans, first and last character ot, 3 words to apply', () => {
    const input = '<p><span style="bold:true;ot:aalt;">M</span><span>ary Martha Su</span><span style="ot:swsh;">e</span></p>';
    const schema = parseSpans(input);
    const text = 'William H Macy';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">W</span><span style="">illiam H Mac</span><span style="ot:swsh;">y</span></p>');
  });

  it('four spans, 2 words', () => {
    const spans = ['<span style="bold:true;ot:aalt;">M</span>', '<span>ary</span>', '<span style="ot:aalt;">S</span>', '<span>ue</span>'];
    const input = `<p>${spans.join('')}</p>`;
    const schema = parseSpans(input);
    const text = 'William Macy';
    const output = applySpans(schema, text);
    expect(output).to.equal(
      '<p><span style="ot:aalt;">W</span><span style="">illiam</span><span style="ot:aalt;">M</span><span style="">acy</span></p>',
    );
  });

  it('four spans, 1 word', () => {
    const spans = ['<span style="bold:true;ot:aalt;">M</span>', '<span>ary</span>', '<span style="ot:aalt;">S</span>', '<span>ue</span>'];
    const input = `<p>${spans.join('')}</p>`;
    const schema = parseSpans(input);
    const text = 'William';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">W</span><span style="">illiam</span><span style=""></span><span style=""></span></p>');
  });

  it('four spans, 3 words', () => {
    const spans = ['<span style="bold:true;ot:aalt;">M</span>', '<span>ary</span>', '<span style="ot:aalt;">S</span>', '<span>ue</span>'];
    const input = `<p>${spans.join('')}</p>`;
    const schema = parseSpans(input);
    const text = 'William H Macy';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">William H Macy</span><span style=""></span><span style=""></span><span style=""></span></p>');
  });

  it('five spans, 3 words', () => {
    const input =
      '<p><span style="bold:true;ot:aalt;">M</span><span>ary</span><span style="ot:aalt;">M</span><span>Su</span><span style="ot:swsh;">e</span></p>';
    const schema = parseSpans(input);
    const text = 'William H Macy';
    const output = applySpans(schema, text);
    expect(output).to.equal(
      '<p><span style="ot:aalt;">W</span><span style="">illiam</span><span style="ot:aalt;"> H </span><span style="">Mac</span><span style="ot:swsh;">y</span></p>',
    );
  });

  it('five spans, 2 words', () => {
    const input =
      '<p><span style="bold:true;ot:aalt;">M</span><span>ary</span><span style="ot:aalt;">M</span><span>Su</span><span style="ot:swsh;">e</span></p>';
    const schema = parseSpans(input);
    const text = 'William Macy';
    const output = applySpans(schema, text);
    expect(output).to.equal(
      '<p><span style="ot:aalt;">W</span><span style="">illiam</span><span style=""> </span><span style="">Mac</span><span style="ot:swsh;">y</span></p>',
    );
  });

  it('five spans, 1 word', () => {
    const input =
      '<p><span style="bold:true;ot:aalt;">M</span><span>ary</span><span style="ot:aalt;">M</span><span>Su</span><span style="ot:swsh;">e</span></p>';
    const schema = parseSpans(input);
    const text = 'William';
    const output = applySpans(schema, text);
    expect(output).to.equal(
      '<p><span style="ot:aalt;">W</span><span style="">illiam</span><span style=""></span><span style=""></span><span style=""></span></p>',
    );
  });

  it('five spans, 7 word', () => {
    const input =
      '<p><span style="bold:true;ot:aalt;">M</span><span>ary</span><span style="ot:aalt;">M</span><span>Su</span><span style="ot:swsh;">e</span></p>';
    const schema = parseSpans(input);
    const text = 'William H Macy H Third';
    const output = applySpans(schema, text);
    expect(output).to.equal(
      '<p><span style="">William H Macy H Third</span><span style=""></span><span style=""></span><span style=""></span><span style=""></span><span style=""></span></p>',
    );
  });

  it('seven spans, 3 words', () => {
    const spans = [
      '<span style="bold:true;ot:aalt;">M</span>',
      '<span>ar</span>',
      '<span style="ot:aalt;">y</span>',
      '<span style="ot:aalt;">M</span>',
      '<span style="ot:aalt;">S</span>',
      '<span>u</span>',
      '<span style="ot:swsh;">e</span>',
    ];
    const input = `<p>${spans.join('')}</p>`;
    const schema = parseSpans(input);
    const text = 'William H Macy';
    const output = applySpans(schema, text);
    expect(output).to.equal(
      '<p><span style="ot:aalt;">W</span><span style="">illia</span><span style="ot:aalt;">m</span><span style="ot:aalt;"> H </span><span style="ot:aalt;">M</span><span style="">ac</span><span style="ot:swsh;">y</span></p>',
    );
  });

  it('seven spans, 2 words', () => {
    const spans = [
      '<span style="bold:true;ot:aalt;">M</span>',
      '<span>ar</span>',
      '<span style="ot:aalt;">y</span>',
      '<span style="ot:aalt;">M</span>',
      '<span style="ot:aalt;">S</span>',
      '<span>u</span>',
      '<span style="ot:swsh;">e</span>',
    ];
    const input = `<p>${spans.join('')}</p>`;
    const schema = parseSpans(input);
    const text = 'William Macy';
    const output = applySpans(schema, text);
    expect(output).to.equal(
      '<p><span style="ot:aalt;">W</span><span style="">illia</span><span style="ot:aalt;">m</span><span style="ot:aalt;"> </span><span style="ot:aalt;">M</span><span style="">ac</span><span style="ot:swsh;">y</span></p>',
    );
  });

  it('seven spans, 1 word', () => {
    const spans = [
      '<span style="bold:true;ot:aalt;">M</span>',
      '<span>ar</span>',
      '<span style="ot:aalt;">y</span>',
      '<span style="ot:aalt;">M</span>',
      '<span style="ot:aalt;">S</span>',
      '<span>u</span>',
      '<span style="ot:swsh;">e</span>',
    ];
    const input = `<p>${spans.join('')}</p>`;
    const schema = parseSpans(input);
    const text = 'William';
    const output = applySpans(schema, text);
    expect(output).to.equal(
      '<p><span style="ot:aalt;">W</span><span style="">illia</span><span style="ot:aalt;">m</span><span style=""></span><span style=""></span><span style=""></span><span style=""></span></p>',
    );
  });

  it('seven spans, 4 words', () => {
    const spans = [
      '<span style="bold:true;ot:aalt;">M</span>',
      '<span>ar</span>',
      '<span style="ot:aalt;">y</span>',
      '<span style="ot:aalt;">M</span>',
      '<span style="ot:aalt;">S</span>',
      '<span>u</span>',
      '<span style="ot:swsh;">e</span>',
    ];
    const input = `<p>${spans.join('')}</p>`;
    const schema = parseSpans(input);
    const text = 'William H Macy 3rd';
    const output = applySpans(schema, text);
    expect(output).to.equal(
      '<p><span style="">William H Macy 3rd</span><span style=""></span><span style=""></span><span style=""></span><span style=""></span><span style=""></span><span style=""></span></p>',
    );
  });

  it('two spans, end ot', () => {
    const spans = [
      '<span style="ot:liga,1;ot:locl,0;">Jare</span>',
      '<span style="color:cmyk(0,0,0,255,255);font-size:95pt;font-name:bellissimascriptpro;ot:aalt,4;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">d</span>',
    ];

    const input = `<p>${spans.join('')}</p>`;
    const schema = parseSpans(input);
    const text = 'William';
    const output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:liga,1;ot:locl,0;">Willia</span><span style="ot:aalt,4;ot:locl,0;">m</span></p>');
  });

  it('real world', () => {
    const spans = [
      '<span style="ot:locl,0;ot:ss04,1;">W</span>',
      '<span style="color:cmyk(0,0,0,255,255);font-size:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">illiam </span>',
      '<span style="ot:locl,0;ot:ss04,1;">A</span>',
      '<span style="color:cmyk(0,0,0,255,255);font-ize:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">dkins</span>',
    ];

    const input = `<p>${spans.join('')}</p>`;
    const schema = parseSpans(input);
    const text = 'Barret Bob';
    const output = applySpans(schema, text);
    expect(output).to.equal(
      '<p><span style="ot:locl,0;ot:ss04,1;">B</span><span style="ot:liga;ot:locl,0;">arret</span><span style="ot:locl,0;ot:ss04,1;">B</span><span style="ot:liga;ot:locl,0;">ob</span></p>',
    );
  });

  it('parses and outputs correct', () => {
    const spans = [
      '<span style="ot:locl,0;ot:ss04,1;">W</span>',
      '<span style="color:cmyk(0,0,0,255,255);font-size:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">illiam </span>',
      '<span style="ot:locl,0;ot:ss04,1;">A</span>',
      '<span style="color:cmyk(0,0,0,255,255);font-ize:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">dkins</span>',
    ];

    const input = `<p>${spans.join('')}</p>`;
    const schema = parseSpans(input);
    const output = schema.toString();
    expect(output).to.equal(
      '<p><span style="ot:locl,0;ot:ss04,1;">W</span><span style="ot:liga;ot:locl,0;">illiam </span><span style="ot:locl,0;ot:ss04,1;">A</span><span style="ot:liga;ot:locl,0;">dkins</span></p>',
    );
  })

  it('words start with numbers', () => {
    const words = getWords('310 South');
    expect(words.length).to.equal(2);
  });

  it('three words', () => {
    const words = getWords('This Is Three');
    expect(words.length).to.equal(3);
  });

  it('One word', () => {
    const words = getWords('One');
    expect(words.length).to.equal(1);
  });

  it('words with numbers', () => {
    const words = getWords('One 2 Three 400 Five');
    expect(words.length).to.equal(5);
  });
});
