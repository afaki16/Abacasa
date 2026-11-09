// Backend alan hataları ({ "NewEmail": ["..."] }, büyük/küçük harf fark etmez) → form alanları;
// eşlenemeyenler form üstü banda. Saf; testlidir.

export function mapFieldErrors<F extends string>(
  fieldErrors: Record<string, string[]>,
  mapping: Record<string, F>,
): { fields: { name: F; message: string }[]; rest: string[] } {
  const lower: Record<string, F> = {};
  for (const [key, value] of Object.entries(mapping)) lower[key.toLowerCase()] = value;
  const fields: { name: F; message: string }[] = [];
  const rest: string[] = [];
  for (const [key, messages] of Object.entries(fieldErrors)) {
    const name = lower[(key.split('.').pop() ?? key).toLowerCase()];
    const list = messages.filter(Boolean);
    if (list.length === 0) continue;
    if (name) fields.push({ name, message: list[0] });
    else rest.push(...list);
  }
  return { fields, rest };
}
