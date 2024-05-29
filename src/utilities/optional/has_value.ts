function hasValue<T>(value: T | null | undefined): boolean {
  return value !== null && value !== undefined;
}

export default hasValue;
