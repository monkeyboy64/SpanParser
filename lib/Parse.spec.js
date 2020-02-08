"use strict";

var chai = require('chai');

var _require = require('./Parse'),
    parseSpans = _require.parseSpans,
    applySpans = _require.applySpans,
    getWords = _require.getWords;

var expect = chai.expect;
describe('parseSpans', function () {
  it('one word to one word', function () {
    var input = '<p><span style="bold:true">Hi</span></p>';
    var schema = parseSpans(input);
    var text = 'Bye';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="">Bye</span></p>');
  });
  it('one word input to two word output', function () {
    var input = '<p><span style="bold:true">Hi</span></p>';
    var schema = parseSpans(input);
    var text = 'Bye there';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="">Bye there</span></p>');
  });
  it('one span input to two word output', function () {
    var input = '<p><span style="bold:true;">Hi There</span></p>';
    var schema = parseSpans(input);
    var text = 'See You';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="">See You</span></p>');
  });
  it('two spans, first character ot', function () {
    var input = '<p><span style="bold:true;ot:aalt;">H</span><span>i There</span></p>';
    var schema = parseSpans(input);
    var text = 'See You';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">S</span><span style="">ee You</span></p>');
  });
  it('two spans, first character ot, only 1 character to apply', function () {
    var input = '<p><span style="bold:true;ot:aalt;">H</span><span>i There</span></p>';
    var schema = parseSpans(input);
    var text = 'S';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">S</span><span style=""></span></p>');
  });
  it('three spans, first and last character ot, only 1 character to apply', function () {
    var input = '<p><span style="bold:true;ot:aalt;">H</span><span>i Ther</span><span style="ot:swsh;">e</span></p>';
    var schema = parseSpans(input);
    var text = 'S';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">S</span><span style=""></span><span style=""></span></p>');
  });
  it('three spans, first and last character ot, only 2 characters to apply', function () {
    var input = '<p><span style="bold:true;ot:aalt;">H</span><span>i Ther</span><span style="ot:swsh;">e</span></p>';
    var schema = parseSpans(input);
    var text = 'Se';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">S</span><span style=""></span><span style="ot:swsh;">e</span></p>');
  });
  it('three spans, first and last character ot, 3 characters to apply', function () {
    var input = '<p><span style="bold:true;ot:aalt;">H</span><span>i Ther</span><span style="ot:swsh;">e</span></p>';
    var schema = parseSpans(input);
    var text = 'Set';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">S</span><span style="">e</span><span style="ot:swsh;">t</span></p>');
  });
  it('three spans, first and last character ot, 3 words to apply', function () {
    var input = '<p><span style="bold:true;ot:aalt;">M</span><span>ary Martha Su</span><span style="ot:swsh;">e</span></p>';
    var schema = parseSpans(input);
    var text = 'William H Macy';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">W</span><span style="">illiam H Mac</span><span style="ot:swsh;">y</span></p>');
  });
  it('four spans, 2 words', function () {
    var spans = ['<span style="bold:true;ot:aalt;">M</span>', '<span>ary</span>', '<span style="ot:aalt;">S</span>', '<span>ue</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var text = 'William Macy';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">W</span><span style="">illiam </span><span style="ot:aalt;">M</span><span style="">acy</span></p>');
  });
  it('four spans, 1 word', function () {
    var spans = ['<span style="bold:true;ot:aalt;">M</span>', '<span>ary</span>', '<span style="ot:aalt;">S</span>', '<span>ue</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var text = 'William';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">W</span><span style="">illiam</span><span style=""></span><span style=""></span></p>');
  });
  it('four spans, 3 words', function () {
    var spans = ['<span style="bold:true;ot:aalt;">M</span>', '<span>ary</span>', '<span style="ot:aalt;">S</span>', '<span>ue</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var text = 'William H Macy';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">William H Macy</span><span style=""></span><span style=""></span><span style=""></span></p>');
  });
  it('five spans, 3 words', function () {
    var input = '<p><span style="bold:true;ot:aalt;">M</span><span>ary</span><span style="ot:aalt;">M</span><span>Su</span><span style="ot:swsh;">e</span></p>';
    var schema = parseSpans(input);
    var text = 'William H Macy';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">W</span><span style="">illiam</span><span style="ot:aalt;"> H </span><span style="">Mac</span><span style="ot:swsh;">y</span></p>');
  });
  it('five spans, 2 words', function () {
    var input = '<p><span style="bold:true;ot:aalt;">M</span><span>ary</span><span style="ot:aalt;">M</span><span>Su</span><span style="ot:swsh;">e</span></p>';
    var schema = parseSpans(input);
    var text = 'William Macy';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">W</span><span style="">illiam</span><span style=""> </span><span style="">Mac</span><span style="ot:swsh;">y</span></p>');
  });
  it('five spans, 1 word', function () {
    var input = '<p><span style="bold:true;ot:aalt;">M</span><span>ary</span><span style="ot:aalt;">M</span><span>Su</span><span style="ot:swsh;">e</span></p>';
    var schema = parseSpans(input);
    var text = 'William';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">W</span><span style="">illiam</span><span style=""></span><span style=""></span><span style=""></span></p>');
  });
  it('five spans, 7 word', function () {
    var input = '<p><span style="bold:true;ot:aalt;">M</span><span>ary</span><span style="ot:aalt;">M</span><span>Su</span><span style="ot:swsh;">e</span></p>';
    var schema = parseSpans(input);
    var text = 'William H Macy H Third';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="">William H Macy H Third</span><span style=""></span><span style=""></span><span style=""></span><span style=""></span><span style=""></span></p>');
  });
  it('seven spans, 3 words', function () {
    var spans = ['<span style="bold:true;ot:aalt;">M</span>', '<span>ar</span>', '<span style="ot:aalt;">y</span>', '<span style="ot:aalt;">M</span>', '<span style="ot:aalt;">S</span>', '<span>u</span>', '<span style="ot:swsh;">e</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var text = 'William H Macy';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">W</span><span style="">illia</span><span style="ot:aalt;">m</span><span style="ot:aalt;"> H </span><span style="ot:aalt;">M</span><span style="">ac</span><span style="ot:swsh;">y</span></p>');
  });
  it('seven spans, 2 words', function () {
    var spans = ['<span style="bold:true;ot:aalt;">M</span>', '<span>ar</span>', '<span style="ot:aalt;">y</span>', '<span style="ot:aalt;">M</span>', '<span style="ot:aalt;">S</span>', '<span>u</span>', '<span style="ot:swsh;">e</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var text = 'William Macy';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">W</span><span style="">illia</span><span style="ot:aalt;">m</span><span style="ot:aalt;"> </span><span style="ot:aalt;">M</span><span style="">ac</span><span style="ot:swsh;">y</span></p>');
  });
  it('seven spans, 1 word', function () {
    var spans = ['<span style="bold:true;ot:aalt;">M</span>', '<span>ar</span>', '<span style="ot:aalt;">y</span>', '<span style="ot:aalt;">M</span>', '<span style="ot:aalt;">S</span>', '<span>u</span>', '<span style="ot:swsh;">e</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var text = 'William';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:aalt;">W</span><span style="">illia</span><span style="ot:aalt;">m</span><span style=""></span><span style=""></span><span style=""></span><span style=""></span></p>');
  });
  it('seven spans, 4 words', function () {
    var spans = ['<span style="bold:true;ot:aalt;">M</span>', '<span>ar</span>', '<span style="ot:aalt;">y</span>', '<span style="ot:aalt;">M</span>', '<span style="ot:aalt;">S</span>', '<span>u</span>', '<span style="ot:swsh;">e</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var text = 'William H Macy 3rd';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="">William H Macy 3rd</span><span style=""></span><span style=""></span><span style=""></span><span style=""></span><span style=""></span><span style=""></span></p>');
  });
  it('two spans, end ot', function () {
    var spans = ['<span style="ot:liga,1;ot:locl,0;">Jare</span>', '<span style="color:cmyk(0,0,0,255,255);font-size:95pt;font-name:bellissimascriptpro;ot:aalt,4;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">d</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var text = 'William';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:liga,1;ot:locl,0;">Willia</span><span style="ot:aalt,4;ot:locl,0;">m</span></p>');
  });
  it('real world Barret Bob', function () {
    var spans = ['<span style="ot:locl,0;ot:ss04,1;">W</span>', '<span style="color:cmyk(0,0,0,255,255);font-size:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">illiam </span>', '<span style="ot:locl,0;ot:ss04,1;">A</span>', '<span style="color:cmyk(0,0,0,255,255);font-ize:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">dkins</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var text = 'Barret Bob';
    var output = applySpans(schema, text);
    expect(output).to.equal('<p><span style="ot:locl,0;ot:ss04,1;">B</span><span style="ot:liga;ot:locl,0;">arret </span><span style="ot:locl,0;ot:ss04,1;">B</span><span style="ot:liga;ot:locl,0;">ob</span></p>');
  });
  it('parses and outputs correct', function () {
    var spans = ['<span style="ot:locl,0;ot:ss04,1;">W</span>', '<span style="color:cmyk(0,0,0,255,255);font-size:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">illiam </span>', '<span style="ot:locl,0;ot:ss04,1;">A</span>', '<span style="color:cmyk(0,0,0,255,255);font-ize:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">dkins</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var output = schema.toString();
    expect(output).to.equal('<p><span style="ot:locl,0;ot:ss04,1;">W</span><span style="ot:liga;ot:locl,0;">illiam </span><span style="ot:locl,0;ot:ss04,1;">A</span><span style="ot:liga;ot:locl,0;">dkins</span></p>');
  });
  it('words start with numbers', function () {
    var words = getWords('310 South');
    expect(words.length).to.equal(2);
  });
  it('three words', function () {
    var words = getWords('This Is Three');
    expect(words.length).to.equal(3);
  });
  it('One word', function () {
    var words = getWords('One');
    expect(words.length).to.equal(1);
  });
  it('words with numbers', function () {
    var words = getWords('One 2 Three 400 Five');
    expect(words.length).to.equal(5);
  });
  it('null schema', function () {
    expect('This is Here', applySpans(null, 'This is Here'));
  });
  it('null schema, null text', function () {
    expect('', applySpans(null, ''));
  });
  it('schema, empty text', function () {
    var spans = ['<span style="color:cmyk(0,0,0,255,255);font-ize:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">dkins</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var output = applySpans(schema, '');
    expect(output).to.equal('<p></p>');
  });
  it('schema, null text', function () {
    var spans = ['<span style="color:cmyk(0,0,0,255,255);font-ize:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(0,0,0,255,1,rgb(0,0,0))">dkins</span>'];
    var input = "<p>".concat(spans.join(''), "</p>");
    var schema = parseSpans(input);
    var output = applySpans(schema, null);
    expect(output).to.equal('<p></p>');
  });
  it('schema with empty spans', function () {
    var text = 'this is text';
    var schema = parseSpans(text);
    expect(schema.paragraphs.length).to.equal(0);
    expect(schema.toString()).to.equal(text);
  });
  it('schema with empty spans with newline characater', function () {
    var text = 'this is text \nhi there';
    var schema = parseSpans(text);
    expect(schema.paragraphs.length).to.equal(0);
    expect(schema.toString()).to.equal(text);
  });
  it('input with no spans', function () {
    var input = 'this is text';
    var schema = parseSpans(input);
    expect(applySpans(schema, input)).to.equal(input);
  });
  it('schema with empty spans with empty text', function () {
    var schema = parseSpans('');
    expect(schema.paragraphs.length).to.equal(0);
  });
  it('schema with empty paragraph', function () {
    var schema = parseSpans('<p></p>');
    expect(schema.paragraphs.length).to.equal(1);
  });
  it('can handle three paragraphs with one paragraph on input as plain string', function () {
    var text = '<p><span style="color:cmyk(41,69,163,0,255);font-size:33pt;ot:calt,0;ot:liga,1;ot:locl,0;" >MR. AND MRS. JOHN PAUL FRAZIER</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >request the honor of your presence at</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >THE WEDDING OF THEIR DAUGHTER</span></p>';
    var schema = parseSpans(text);
    expect(schema.paragraphs.length).to.equal(3);
    var input = 'hello world';
    var output = applySpans(schema, input);
    expect(output).to.equal('<p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">hello world</span></p>');
  });
  it('can handle three paragraphs with one paragraph on input as html', function () {
    var text = '<p><span style="color:cmyk(41,69,163,0,255);font-size:33pt;ot:calt,0;ot:liga,1;ot:locl,0;" >MR. AND MRS. JOHN PAUL FRAZIER</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >request the honor of your presence at</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >THE WEDDING OF THEIR DAUGHTER</span></p>';
    var schema = parseSpans(text);
    expect(schema.paragraphs.length).to.equal(3);
    var input = '<p><span>hello world</span></p>';
    var output = applySpans(schema, input);
    expect(output).to.equal('<p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">hello world</span></p>');
  });
  it('can handle three paragraphs with two paragraphs on input as plain string', function () {
    var text = '<p><span style="color:cmyk(41,69,163,0,255);font-size:33pt;ot:calt,0;ot:liga,1;ot:locl,0;" >MR. AND MRS. JOHN PAUL FRAZIER</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >request the honor of your presence at</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >THE WEDDING OF THEIR DAUGHTER</span></p>';
    var schema = parseSpans(text);
    expect(schema.paragraphs.length).to.equal(3);
    var input = 'hello world\ntis nice';
    var output = applySpans(schema, input);
    expect(output).to.equal('<p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">hello world</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">tis nice</span></p>');
  });
  it('can handle three paragraphs with two paragraphs on input as html', function () {
    var text = '<p><span style="color:cmyk(41,69,163,0,255);font-size:33pt;ot:calt,0;ot:liga,1;ot:locl,0;" >MR. AND MRS. JOHN PAUL FRAZIER</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >request the honor of your presence at</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >THE WEDDING OF THEIR DAUGHTER</span></p>';
    var schema = parseSpans(text);
    expect(schema.paragraphs.length).to.equal(3);
    var input = '<p><span>hello world</span></p><p><span>tis nice</span></p>';
    var output = applySpans(schema, input);
    expect(output).to.equal('<p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">hello world</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">tis nice</span></p>');
  });
  it('can handle three paragraphs with three paragraphs on input as plain string', function () {
    var text = '<p><span style="color:cmyk(41,69,163,0,255);font-size:33pt;ot:calt,0;ot:liga,1;ot:locl,0;" >MR. AND MRS. JOHN PAUL FRAZIER</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >request the honor of your presence at</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >THE WEDDING OF THEIR DAUGHTER</span></p>';
    var schema = parseSpans(text);
    expect(schema.paragraphs.length).to.equal(3);
    var input = 'hello world\ntis nice\nAll is well';
    var output = applySpans(schema, input);
    expect(output).to.equal('<p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">hello world</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">tis nice</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">All is well</span></p>');
  });
  it('can handle three paragraphs with three paragraphs on input as html', function () {
    var text = '<p><span style="color:cmyk(41,69,163,0,255);font-size:33pt;ot:calt,0;ot:liga,1;ot:locl,0;" >MR. AND MRS. JOHN PAUL FRAZIER</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >request the honor of your presence at</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >THE WEDDING OF THEIR DAUGHTER</span></p>';
    var schema = parseSpans(text);
    expect(schema.paragraphs.length).to.equal(3);
    var input = '<p><span>hello world</span></p><p><span>tis nice</span></p><p><span>All is well</span></p>';
    var output = applySpans(schema, input);
    expect(output).to.equal('<p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">hello world</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">tis nice</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">All is well</span></p>');
  });
  it('can handle three paragraphs with four paragraphs on input as plain string with &', function () {
    var text = '<p><span style="color:cmyk(41,69,163,0,255);font-size:33pt;ot:calt,0;ot:liga,1;ot:locl,0;" >MR. AND MRS. JOHN PAUL FRAZIER</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >request the honor of your presence at</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >THE WEDDING OF THEIR DAUGHTER</span></p>';
    var schema = parseSpans(text);
    expect(schema.paragraphs.length).to.equal(3);
    var input = 'hello & world\ntis & nice\nAll & is well\njump & on the trampoline';
    var output = applySpans(schema, input);
    expect(output).to.equal('<p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">hello &amp; world</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">tis &amp; nice</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">All &amp; is well</span></p><p><span style="ot:liga;ot:locl,0;">jump &amp; on the trampoline</span></p>');
  });
  it('can handle three paragraphs with four paragraphs on input as html with &', function () {
    var text = '<p><span style="color:cmyk(41,69,163,0,255);font-size:33pt;ot:calt,0;ot:liga,1;ot:locl,0;" >MR. AND MRS. JOHN PAUL FRAZIER</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >request the honor of your presence at</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;" >THE WEDDING OF THEIR DAUGHTER</span></p>';
    var schema = parseSpans(text);
    expect(schema.paragraphs.length).to.equal(3);
    var input = '<p><span>hello & world</span></p><p><span>tis & nice</span></p><p><span>All & is well</span></p><p><span>jump & on the trampoline</span></p>';
    var output = applySpans(schema, input);
    expect(output).to.equal('<p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">hello &amp; world</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">tis &amp; nice</span></p><p><span style="ot:calt,0;ot:liga,1;ot:locl,0;">All &amp; is well</span></p><p><span style="ot:liga;ot:locl,0;">jump &amp; on the trampoline</span></p>');
  });
  it('expect output to be the same as input', function () {
    var ps = ['<p><span style="ot:locl,0;">MARRIAGE OFFICIANT: REVEREND JOHN DILLAN</span></p>', '<p><span style="ot:locl,0;">PRELUDE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE GROOM &amp; GROOMSMEN</span></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE PARENTS</span></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE MAID OF HONOR </span></p>', '<p><span style="ot:locl,0;">RING BEARER & FLOWER GIRL</span></p>', '<p></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">& FATHER OF THE BRIDE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">CEREMONY</span></p>', '<p></p>', '<p><span style="ot:locl,0;">READING BY THE SISTER OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">READING BY THE GROOM’S UNCLE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">GIVING OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">EXCHANGING OF VOWS</span></p>', '<p><span style="ot:locl,0;">EXCHANGING OF RINGS</span></p>', '<p><span style="ot:locl,0;">PRONOUNCEMENT</span></p>', '<p></p>', '<p><span style="ot:locl,0;">MUSIC AND PROCESSION</span></p>', '<p><span style="ot:locl,0;">SIGNING OF THE REGISTRY</span></p>'];
    var expectedOutput = ['<p><span style="ot:locl,0;">MARRIAGE OFFICIANT: REVEREND JOHN DILLAN</span></p>', '<p><span style="ot:locl,0;">PRELUDE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE GROOM &amp; GROOMSMEN</span></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE PARENTS</span></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE MAID OF HONOR </span></p>', '<p><span style="ot:locl,0;">RING BEARER &amp; FLOWER GIRL</span></p>', '<p></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">&amp; FATHER OF THE BRIDE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">CEREMONY</span></p>', '<p></p>', '<p><span style="ot:locl,0;">READING BY THE SISTER OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">READING BY THE GROOM’S UNCLE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">GIVING OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">EXCHANGING OF VOWS</span></p>', '<p><span style="ot:locl,0;">EXCHANGING OF RINGS</span></p>', '<p><span style="ot:locl,0;">PRONOUNCEMENT</span></p>', '<p></p>', '<p><span style="ot:locl,0;">MUSIC AND PROCESSION</span></p>', '<p><span style="ot:locl,0;">SIGNING OF THE REGISTRY</span></p>'];
    var schema = parseSpans(ps.join(''));
    var output = applySpans(schema, ps.join(''));
    expect(output).to.equal(expectedOutput.join(''));
  });
  it('expect output to be the same as input', function () {
    var ps = ['<p><span style="ot:locl,0;">MARRIAGE OFFICIANT: REVEREND JOHN DILLAN</span></p>', '<p><span style="ot:locl,0;">PRELUDE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE GROOM &amp; GROOMSMEN</span></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE PARENTS</span></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE MAID OF HONOR</span></p>', '<p><span style="ot:locl,0;">RING BEARER &amp; FLOWER GIRL</span></p>', '<p></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">&amp; FATHER OF THE BRIDE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">CEREMONY</span></p>', '<p></p>', '<p><span style="ot:locl,0;">READING BY THE SISTER OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">READING BY THE GROOM’S UNCLE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">GIVING OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">EXCHANGING OF VOWS</span></p>', '<p><span style="ot:locl,0;">EXCHANGING OF RINGS</span></p>', '<p><span style="ot:locl,0;">PRONOUNCEMENT</span></p>', '<p></p>', '<p><span style="ot:locl,0;">MUSIC AND PROCESSION</span></p>', '<p><span style="ot:locl,0;">SIGNING OF THE REGISTRY</span></p>'];
    var expectedOutput = ['MARRIAGE OFFICIANT: REVEREND JOHN DILLAN', 'PRELUDE', '', 'ENTRANCE OF THE GROOM & GROOMSMEN', 'ENTRANCE OF THE PARENTS', 'ENTRANCE OF THE MAID OF HONOR', 'RING BEARER & FLOWER GIRL', '', 'ENTRANCE OF THE BRIDE', '& FATHER OF THE BRIDE', '', 'CEREMONY', '', 'READING BY THE SISTER OF THE BRIDE', 'READING BY THE GROOM’S UNCLE', '', 'GIVING OF THE BRIDE', 'EXCHANGING OF VOWS', 'EXCHANGING OF RINGS', 'PRONOUNCEMENT', '', 'MUSIC AND PROCESSION', 'SIGNING OF THE REGISTRY'];
    var schema = parseSpans(ps.join(''));
    var output = schema.toPlainText();
    expect(output).to.equal(expectedOutput.join('\n'));
  });
  it('handle different paragraph scheme on input', function () {
    var ps = ['<p><span style="ot:locl,0;">MARRIAGE OFFICIANT: REVEREND JOHN DILLAN</span></p>', '<p><span style="ot:locl,0;">PRELUDE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE GROOM &amp; GROOMSMEN</span></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE PARENTS</span></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE MAID OF HONOR</span></p>', '<p><span style="ot:locl,0;">RING BEARER &amp; FLOWER GIRL</span></p>', '<p></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">&amp; FATHER OF THE BRIDE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">CEREMONY</span></p>', '<p></p>', '<p><span style="ot:locl,0;">READING BY THE SISTER OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">READING BY THE GROOM’S UNCLE</span></p>', '<p></p>', '<p><span style="ot:locl,0;">GIVING OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">EXCHANGING OF VOWS</span></p>', '<p><span style="ot:locl,0;">EXCHANGING OF RINGS</span></p>', '<p><span style="ot:locl,0;">PRONOUNCEMENT</span></p>', '<p></p>', '<p><span style="ot:locl,0;">MUSIC AND PROCESSION</span></p>', '<p><span style="ot:locl,0;">SIGNING OF THE REGISTRY</span></p>'];
    var input = ['', 'MARRIAGE OFFICIANT: REVEREND JOHN DILLAN', '', 'PRELUDE', '', '', 'ENTRANCE OF THE GROOM & GROOMSMEN', 'ENTRANCE OF THE PARENTS', '', 'ENTRANCE OF THE MAID OF HONOR', 'RING BEARER & FLOWER GIRL', '', 'ENTRANCE OF THE BRIDE', '& FATHER OF THE BRIDE', '', 'CEREMONY', '', 'READING BY THE SISTER OF THE BRIDE', 'READING BY THE GROOM’S UNCLE', ''];
    var expectedOutput = ['<p></p>', '<p><span style="ot:locl,0;">MARRIAGE OFFICIANT: REVEREND JOHN DILLAN</span></p>', '<p></p>', '<p><span style="ot:locl,0;">PRELUDE</span></p>', '<p></p>', '<p></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE GROOM &amp; GROOMSMEN</span></p>', '<p><span style="ot:liga;ot:locl,0;">ENTRANCE OF THE PARENTS</span></p>', '<p></p>', '<p><span style="ot:locl,0;">ENTRANCE OF THE MAID OF HONOR</span></p>', '<p><span style="ot:liga;ot:locl,0;">RING BEARER &amp; FLOWER GIRL</span></p>', '<p></p>', '<p><span style="ot:liga;ot:locl,0;">ENTRANCE OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">&amp; FATHER OF THE BRIDE</span></p>', '<p></p>', '<p><span style="ot:liga;ot:locl,0;">CEREMONY</span></p>', '<p></p>', '<p><span style="ot:locl,0;">READING BY THE SISTER OF THE BRIDE</span></p>', '<p><span style="ot:locl,0;">READING BY THE GROOM’S UNCLE</span></p>'];
    var schema = parseSpans(ps.join(''));
    var output = applySpans(schema, input.join('\n'));
    expect(output).to.equal(expectedOutput.join(''));
  });
  it('schema with empty spans', function () {
    var text = 'this is text';
    var schema = parseSpans(text);
    expect(schema.toPlainText()).to.equal(text);
  });
  it('schema with empty spans with newline characater', function () {
    var text = 'this is text \nhi there';
    var schema = parseSpans(text);
    expect(schema.toPlainText()).to.equal(text);
  });
  it('real world Taylor Frazier', function () {
    var text = ['<p>', '<span style="ot:locl,0;ot:ss04,1;">T</span>', '<span style="color:cmyk(41,69,163,0,255);font-size:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(41,69,163,0,1,rgb(216,181,115))">aylor </span>', '<span style="ot:locl,0;ot:ss04,1;">F</span>', '<span style="color:cmyk(41,69,163,0,255);font-size:33pt;font-name:burguesscript;ot:liga;ot:locl,0;" data-full-color="device-cmyk(41,69,163,0,1,rgb(216,181,115))">razier</span>', '</p>'];
    var expectedOutput = ['<p>', '<span style="ot:locl,0;ot:ss04,1;">T</span>', '<span style="ot:liga;ot:locl,0;">aylor </span>', '<span style="ot:locl,0;ot:ss04,1;">F</span>', '<span style="ot:liga;ot:locl,0;">razier</span>', '</p>'];
    var schema = parseSpans(text.join(''));
    var output = applySpans(schema, 'Taylor Frazier');
    expect(output).to.equal(expectedOutput.join(''));
  });
});