export function methodClass(method: string): string {
  const m = method.toLowerCase();
  const known = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
  return `method-badge method-${known.includes(m) ? m : 'other'}`;
}

export function statusClass(status: string): string {
  switch (status) {
    case 'released':
    case 'tested':
      return 'uk-label uk-label-success';
    case 'deprecated':
    case 'obsolete':
    case 'exception':
      return 'uk-label uk-label-danger';
    case 'testing':
    case 'developing':
    case 'integrating':
      return 'uk-label uk-label-warning';
    default:
      return 'uk-label';
  }
}

export function httpStatusClass(status: number): string {
  if (status >= 500) return 'uk-label uk-label-danger';
  if (status >= 400) return 'uk-label uk-label-warning';
  if (status >= 300) return 'uk-label';
  return 'uk-label uk-label-success';
}
