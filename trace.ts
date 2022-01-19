/*
General module for traces used everywhere
Allows selective traces and safe replacement of cons/ole-dot-log
All this module is removed and replaced by void calls for production

Traces also serve as explainer and comments
*/
let Trace = false;
let TraceSelection = null;
let DebugTrace = false;
let TracePath = null;
let TabsLimit = 20;

// from KNVBase to limit dependencies and circular ones
function invariant( val, Msg)
{
  // this is a local invariant function, different from KNVBase and not exposed
  if ( !Trace)
    return;
	
  if ( !val)
    if ( Msg)
      throw new Error("Invariant failed: " + Msg);
    else
      throw new Error("Invariant failed");
}

function isA( a, cls)
{
  return (( typeof a === "object") && ( a instanceof cls));
}

function isArray( a)
{
  return isA( a, Array);
}

function isPromise(value) {
  return value && value.then && typeof value.then === 'function';
}

let Tabs = 0;
let TabsStack = [];

export class Proc
{
  FctName: string;
  args: Array<any>;
  Tabs: String;
  BaseTrace: boolean;
  Trace: boolean;
  printed: boolean;
  buffer: Array<any>;


  constructor( FctName)
  {
		this.FctName = FctName;
		this.args = [];
    this.Tabs = ""; // "  ".repeat( Tabs); // "";
    this.BaseTrace = Trace && (TraceSelection?TraceSelection[ this.FctName]:true);
    this.Trace = this.BaseTrace;
    // Yes we use only this.BaseTrace to optimize Tabs and TabsStack
    // because this.Trace can be turned On and Off later
    // now it's logically equivalent to this.Trace though but marking the difference deliberately
		if ( !this.BaseTrace)
			return;
			
    // Pbs 
    // - we don't have a destructor, 
    // - we don't call Return everywhere, and we have concurrency
    // - an execution error in a generator causing exits by throw 
    // increase stack, find and put back the original value
    if ( Tabs < 0)
    {
      console.log( "trace", Tabs, TabsStack);
      console.trace();
      throw new Error("Trace Stack mess Underflow");
    }
    if ( Tabs > TabsLimit)
    {
      console.log( "trace", Tabs, TabsStack);
      console.trace();
      throw new Error("Trace Stack mess Overflow");
    }
    this.Tabs = "  ".repeat( Tabs);
    Tabs++;
    if (DebugTrace)
    {
      console.log( " ".repeat((Tabs>0)?Tabs:0), FctName, "Enter", Tabs);
      this.Trace == false; 
    }
    TabsStack.push( FctName);
		this.printed = false;
    delete this.buffer;
  }
  Off()
  {
    this.Trace = false;
    return this;
  }
  On()
  {
    // Forces trace on
    this.Trace = this.BaseTrace;
    return this;
  }
  Adjust( trace)
  {
    // adjusts Trace to an argument
    this.Trace = trace;
    return this;
  }
  Force()
  {
    // rarely used
    this.Trace = true;
    return this;
  }
  isOn()
  {
    return this.Trace;
  }
  TVAR( Name, Value, Type = undefined)
  {
    if ( !this.Trace)
      return this;

    this.args.push( { name: Name, value: Value});
    // if ( typeof Type != "undefined")
    //   CheckType( Value, Type);
    return this;
  }
  PrintObject( Obj)
  {
    // We have to write our own stringify to catch toTrace at the lowest levels
    // or implement many toTrace
    const Arrow = " →";
    if ( Obj && Obj.toTrace)
      return Obj.toTrace().replace( /\n/g, "\n" + this.Tabs + Arrow);
    else
    if ( isArray( Obj))
    {
      return `[ ${ Obj.map(elt=>this.PrintObject( elt)).join(",\n")}]`;
    }
    else
    if (( typeof Obj === "object") && ( Obj !== null))
      return JSON.stringify( Obj, null, 2).replace( /\n/g, "\n" + this.Tabs + Arrow);
    else
    if ( typeof Obj === "string")
      return Obj.replace( /\n/g, "\n" + this.Tabs + Arrow);
    else
      return Obj;
  }
  D()
  {
    if ( !this.Trace)
      return this;
      
    let args = [];
    args.push( this.Tabs + this.FctName + "(");
    // let Signature = "";
    for ( let i = 0; i < this.args.length; i++)
    {
      /*
      if ( i > 0)
      {
          Signature += ", ";
      }
      Signature += this.args[ i].name;
      Signature += "=";
      if ( typeof( this.args[ i].value) === "undefined")
        Signature += "undefined";
      else
      if ( this.args[ i].value === null)
        Signature += "null";
      else
        Signature += this.PrintObject( this.args[ i].value); // was .toString();
      */
      if ( i > 0)
      {
          args.push( ", ");
      }
      args.push( this.args[ i].name);
      args.push( "=");
      args.push( this.PrintObject( this.args[ i].value));
    }
    args.push( ")");
    if (!DebugTrace)    
      console.log.apply( console, args);
    if (!DebugTrace)
      if ( this.buffer)
        this.buffer.forEach( line => (typeof line === "string")?console.log( line):console.log.apply( console, line));
    this.printed = true;
    this.args = [];
    return this;
  }
  privateLog( ...args)
  {
    if ( !this.printed)
    {
      if ( !this.buffer)
        this.buffer = [];
      this.buffer.push( args)
    }
    else
      if ( !DebugTrace)
        console.log( ...args);
  }
  privateTab( ...args)
  {
    // #TODO used to catch, weird test though
    if ( !this.printed)
    {
      if ( !this.buffer)
        this.buffer = [];
      this.buffer.push( args)
    }
    else
      if ( DebugTrace)
        console.log( ...args);
  }

  MSG( msg, ...extras)
  {
    return this.log( msg, ...extras);
  }
  explains( msg, ...extras)
  {
    return this.log( msg, ...extras);
  }
  log( msg, ...extras)
  {
    if ( !this.Trace)
      return;

    let Extra = this.Tabs + this.FctName + ":";
    if ( typeof msg !== 'string')
      Extra += this.PrintObject( msg);
    else
      Extra += msg;
    let i;
    for ( i = 0; i < extras.length; i++)
      Extra += " " + this.PrintObject( extras[ i]);
    // #TODO code properly the case of object like console.log does it 
    this.privateLog( Extra);
    return this;
  }
  Exit()
  {
    if ( this.BaseTrace)
    {
      // we use this.BaseTrace to optimize Tabs and TabsStack
      this.privateTab( " ".repeat((Tabs>0)?Tabs:0), this.FctName, "Exit", Tabs);
      Tabs--;
      TabsStack.pop();
    }
    if ( this.Trace)
    {
      if ( !this.Trace || !this.printed)
        return;

      this.privateLog( this.Tabs + this.FctName + ":" + "exit()");
    }
  }
  PreExit()
  {
    // Used when Exit is a return of something too complex to use Return and trace it
    if ( this.BaseTrace)
    {
      // we use this.BaseTrace to optimize Tabs and TabsStack
      this.privateTab( " ".repeat((Tabs>0)?Tabs:0), this.FctName, "PreExit", Tabs);
      Tabs--;
      TabsStack.pop();
    }
    if ( this.Trace)
    {
      if ( !this.Trace || !this.printed)
        return;

      this.privateLog( this.Tabs + this.FctName + ":" + "preExit()");
    }
  }
  Return( val, where = undefined)
  {
    if ( this.BaseTrace)
    {
      this.privateTab( " ".repeat((Tabs>0)?Tabs:0), this.FctName, "Exit", Tabs);
      Tabs--;
      TabsStack.pop();
    }
    if ( this.Trace)
    {
      if ( arguments.length == 0)
      {
        if ( !this.Trace || !this.printed)
          return;
        this.privateLog( this.Tabs + this.FctName + ":" + "return()" + (where?" at "+where:""));
      }
      else
      {
        if ( !this.Trace || !this.printed)
          return val;
        const val1 = this.PrintObject( val);
        this.privateLog( this.Tabs + this.FctName + ":" + "return(", val1 , ")" + (where?" at "+where:""));
        if ( isPromise( val))
        {
          val.then( ( val) => {
            const val1 = this.PrintObject( val);
            this.privateLog( this.Tabs + this.FctName + ":" + "Resolved return(", val1 , ")" + (where?" at "+where:""));
          }); 
        }
        return val;
      }
    }
    return val;
  }
  ReturnV( val, valueToPrint, where)
  {
    if (( typeof valueToPrint === "undefined") && ( typeof val === "string"))
      this.Return( val.substr( 0, 50) , where);
    else
      this.Return( valueToPrint , where);
    return val;
  }
  Yield( val)
  {
    if ( this.Trace)
    {
      if ( arguments.length == 0)
      {
        if ( !this.Trace || !this.printed)
          return;
        this.privateLog( this.Tabs + this.FctName + ":" + "yield()");
      }
      else
      {
        if ( !this.Trace || !this.printed)
          return val;
        const val1 = this.PrintObject( val);
        this.privateLog( this.Tabs + this.FctName + ":" + "yield(", val1 , ")");
        return val;
      }
    }
    return val;
  }
  * YieldStar( gen, where)
  {
    // No it was an error elsewhere, Cannot use Trace cuz it's messing up the stack
  
    /*
    The end of the generator function is reached. In this case, execution of the generator ends and an IteratorResult is returned to the caller in which the value is undefined and done is true.
    A return statement is reached. In this case, execution of the generator ends and an IteratorResult is returned to the caller in which the value is the value specified by the return statement and done is true.
    */
  
    let val;
    while ((val = gen.next()) && !val.done)
      yield this.Yield( val.value);
    if ( typeof val.value === "undefined")
      return this.Exit();
    else
      return this.Return( val.value, where);
  }
}

export class TraceClass
{
  className: string;

  constructor( className)
  {
		this.className = className;
  }
  Constructor()
  {
		return new Mth( this.className, "constructor");
  }
  Mth( MthName)
  {
		return new Mth( this.className, MthName);
  }
}

export class Mth
  extends Proc
{
  Class: any;
  MthName: string;

  constructor( Class, MthName)
  {
    if ( typeof( Class) === "string")
      Class = new TraceClass( Class);
    super( Class.className + "." + MthName);
    this.Class = Class;
    this.MthName = MthName;
  }
}

export class Constructor
  extends Mth
{
  constructor( Class)
  {
    super( Class, "constructor");
  }
}

export class Case
  extends Proc
{
  selector: string;

  constructor( selector)
  {
    super( selector);
    this.selector = selector;
  }
}

export function SetTracePath( p) {
  TracePath = p;
};
	
export function On( Selection) {
  console.log( "SetTrace");
  if ( DebugTrace)
    console.trace();
  Trace = true; 
  if ( Selection)
    TraceSelection = Selection;
  return true;
};

export function Debug() {
  // console.log( "SetTrace"); 
  DebugTrace = true; 
  return true;
};

export function setTabslimit( val) {
  // console.log( "setTabslimit", val);
  TabsLimit = val; 
};

export function ResetTabs( val) {
  // console.log( "ResetTabs", val);
  Tabs = val; 
};

export function Off() { 
  console.log( "UnsetTrace");
  if ( DebugTrace)
    console.trace();
  Trace = false; 
  return false;
};

export function AddOptions( commander) {
  commander.option( "--trace", "set trace", exports.On, false);
  return commander;
};

export function Get() 
{ 
  return Trace 
};

export function Inspect( Name, ObjQ)
{
  if (Trace)
    console.log( Name + ".inspect()=", ObjQ.inspect());
};

export function ComposeTrace( f1, name, argNames)
{
  return ( ...args) =>
  {
    const T = new exports.Proc( name)
      .TVAR( (typeof argNames == "string")?argNames:argNames[0], args[ 0])
      .D();
    const ret = f1.apply( this, args);
    return T.Return( ret);
  }
}

// for rare case we badly need a log
export function logResist( msg, ...args)
{
  if ( !Trace)
    return;

  console.log( "global" + ":" + msg, ...args);
  if ( DebugTrace)
    console.trace( "DebugTrace: no trace should appear");
}
