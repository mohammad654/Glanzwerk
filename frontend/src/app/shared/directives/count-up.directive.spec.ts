import { parseFigure } from './count-up.directive';

describe('parseFigure', () => {
  it('counts a plain number', () => {
    expect(parseFigure('12')).toEqual({ prefix: '', value: 12, suffix: '' });
  });

  it('keeps the notation that follows the digits', () => {
    expect(parseFigure('140+')).toEqual({ prefix: '', value: 140, suffix: '+' });
    expect(parseFigure('98%')).toEqual({ prefix: '', value: 98, suffix: '%' });
  });

  it('keeps a symbol that precedes the digits', () => {
    expect(parseFigure('€500')).toEqual({ prefix: '€', value: 500, suffix: '' });
  });

  it('ignores the whitespace the template leaves around an interpolation', () => {
    expect(parseFigure('\n  60\n')).toEqual({ prefix: '', value: 60, suffix: '' });
  });

  it('leaves text without digits alone', () => {
    expect(parseFigure('24/7')).toEqual({ prefix: '', value: 24, suffix: '/7' });
    expect(parseFigure('soon')).toBeNull();
    expect(parseFigure(null)).toBeNull();
  });
});
