import hasValue from '../optional/has_value';

export function parseDate(text: string): Date {
  return new Date(Date.parse(text));
}

export function parseOptionalDate(text: string | undefined | null): Date | undefined {
  return hasValue(text)
       ? parseDate(text!)
       : undefined;
}
