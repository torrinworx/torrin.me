# header
Why Compilers Exist

# description
For a damn good reason. That's why.

# created
2026-02-20T01:21:00-05:00

# modified
2026-02-20T01:21:00-05:00

Will AI be writing binaries for any imaginable task by the end of the year? Nope. Did SpaceX [land on Mars in 2024?](https://www.theverge.com/2016/6/2/11838640/elon-musk-mars-colony-2024-code-conference) Nope. Did Tesla have full self driving in 2018? [Also nope.](https://en.wikipedia.org/wiki/List_of_predictions_for_autonomous_Tesla_vehicles_by_Elon_Musk) But NASA landed Perseverance in 2021, Waymo operates in 6 cities in 2026, because real engineering progress isn’t made by hype timelines and predictions, it’s made by building on what already works.

Autonomous coding agents can do real damage when connected to production systems. For example, an agent reportedly deleted a live database even though it was in a "code and action freeze". [Read more here.](https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure/) Would you trust an agent to output a binary to migrate your family photos? Or manage your prod database? An opaque, non auditable, none de-obfuscatable, unknown file. I have a really hard time imagining risk mitigation for a system like this.

This isn't to say LLMs are useless. I use LLMs and agents all the time for my projects. I'm rocking Ollama on my homelab and Kilo/OpenCode on my laptop. This example just illustrates how ridiculous "writing binaries" is as an expectation. 

Software exists specifically because we *don’t* want to work in raw machine code. Modern computing is layers on layers of abstraction so humans (and tools) can build complex systems without reinventing the universe every time:

- assembly exists because raw binary is painful  
- C compiles to assembly  
- Python was built on C  
- Rust builds on decades of compiler + OS + CPU knowledge  
- frameworks build on runtimes, which build on OS APIs, which build on drivers, etc.

This is the whole point: **abstraction reduces effort and increases reliability**.

So when someone says “AI will write the binary directly,” they’re ignoring that **binary is pretty useless on its own**. A “binary” that isn’t tied into real operating systems, real libraries, real device drivers, real file formats, real network protocols, real security models, real deployment pipelines, and real-world debugging experience… isn’t a product. It's a bunch of useless bits of **11110000 10011111 10010010 10101001**.

The smarter and more realistic path is the opposite: AI building on top of our accumulated human work. Existing codebases that have been tested in production, ugly uncommented code blocks that are there because the senior dev who quit last year put them there for a damn good reason, established standards and protocols, battle tested libraries, and the real world edge cases you simply don’t learn inside a clean VM.

That kind of knowledge is earned over decades, and it’s a huge part of the software development ecosystem.

Could AI eventually write most of the code? Sure. But the direction I see is this:  
1) AI helps humans write code faster (where we are now)  
2) humans mostly describe architecture + constraints, AI implements and tests  
3) eventually we mostly provide intent and creativity, and the implementation becomes automated  

But even in that “future,” AI isn’t going to rewrite the entire universe from scratch every time you search for a file. Generating “pure binaries” per request is ridiculous on multiple levels:
- **compute waste** (why regenerate what already exists?)  
- **verification nightmare** (they optimize for plausible output, not provably correct output)
- **compatibility problems** ("This works on my machine")  
- **pointless reinvention** (we already have fast, optimized, tested stacks, built by smart humans.)

Software development has always been a cycle of abstraction → optimization/“purification” → new abstraction → repeat. Each step builds on the last. In perpetuum, per aspera ad astra. “Write the binary directly” tries to delete that whole evolutionary ladder. That’s why you’re not going to see an LLM reliably produce the complexity of even a basic React TODO app *in pure machine code* in any sane, scalable way. The complexity isn’t just code or binary or better LLMs, it’s the entire stack and the decades of assumptions underneath it.

AI will not replace human knowledge. **It will compound it. It will refine it.** It will never be profitable to torch the foundation and hope raw bits and bytes somehow rebuild modern civilization. The destruction of the Great Library of Alexandria was a tragedy for a reason.
