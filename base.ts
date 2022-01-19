/*
Potpourri of small utilities functions accumulated over years
some are picked from examples, stack overflow, MIT licensed tiny libraries

> Potpourri: a mixture of dried petals and spices placed in a bowl or small sack to perfume clothing or a room.

*/

export function invariant( val: boolean, l: String = "invariant breaks")
{
  if (!val)
    console.trace( "invariant");
  console.assert( val, l);
  if (!val)
    throw new Error( "invariant");
}

export function precondition( val: Boolean)
{
  if (!val)
    console.trace();
  console.assert( val);
  if (!val)
    throw new Error( "invariant");
}

// from https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
export async function asyncForEach<T>(array: Array<T>, callback: (item: T, index: number) => Promise<void>) {
  for (let index = 0; index < array.length; index++) {
      await callback(array[index], index);
  }
}

// Basic testing predicates

export function isSet( a)
{
  return (typeof a !== 'undefined');
}

export function isA( a, cls)
{
  return (( typeof a === "object") && ( a instanceof cls));
}

export function isArray( a)
{
  return isA( a, Array);
}

export function isObject( a)
{
  return ( typeof a === "object");
}

export function isNull( a)
{
  return ( a === null);
}

export function isString( a)
{
  return ( typeof a === 'string');
}

export function isNumber( a)
{
  return ( typeof a === 'number');
}

// Data access and manipulation

export function select( XML, Tag)
{
  if ( isNull( XML))
    return [];
  if (!XML.hasOwnProperty( Tag))
    if (!XML.hasOwnProperty( "children"))
      return [];
    else
    {
      return XML.children.reduce( (res, cur) => {
        if ((Tag === "*") || ( cur.tag === Tag))
          res.push( cur)
        return res;
      }, []);
    }
  const Tags = XML[ Tag];
  if (( typeof Tags === "object") && ( Tags instanceof Array))
    return Tags;
  if (( typeof Tags === "object") && ( Tags === null))
    return [];
  return [ Tags ];
}
