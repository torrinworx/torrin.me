# header
A Time Tracking App Wanted $28,800, So I Replaced It With a Homelab

# description
A time tracking tool tried to turn a boring $9.99/seat SaaS into a $28,800/year line item with “usage fees” and forced credit card billing. So I self-hosted Kimai on our homelab instead, and it got me thinking: private equity price hikes might be accidentally accelerating open source adoption as more teams realize they can run the tools they need on a cheap VPS or a Mac mini.

# A Time Tracking App Wanted **$28,800**, So I Replaced It With a Homelab

My parents run a software testing + consulting company called [worX4you](https://worx4you.com). They’ve been doing it for **17 years**. They’re stable, they’re good at what they do, and their business is not complicated:

**Hire good people --> small business clients --> track time --> invoice --> repeat.**

For years they used **Harvest** for time tracking. Simple product, fair price. Everyone moves on with their life.

Then Harvest changed their pricing after an acquisition (reported in 2024 as involving private equity firms Montagu and TA Associates). And the vibe went from “boring SaaS you forget about” to “wait, are you serious?” pretty fast.

We were paying **$9.99 USD per seat**. Then my parents recieved an email about a pricing change: **$17.50 per seat**, plus a new “usage” layer where the options were either:

- **$2,000/month** for “unlimited usage”, or
- **usage-based billing capped at $400/month**

As of writing, Harvest has not updated their [pricing page](https://www.getharvest.com/pricing) to reflect these increases.

Maybe you’re thinking: “Enterprise pricing is always weird.” Sure. But this wasn’t a giant enterprise rolling in cash. This is a small business that just wants to log hours and get on with real work.

So I did what any reasonable person with a mild homelab addiction does:

I spun up [Kimai](https://www.kimai.org/), an open source time tracking alternative, on our home server.

Now everyone can log hours at our own URL, on our own hardware, for the cost of electricity and an internet connection we’re paying for anyway.

And here’s the part I can’t stop thinking about:

## I think this kind of pricing is accelerating open source adoption
---
Not because everyone suddenly became an “open source purist”.

But because at some point, the math becomes insulting enough that people start asking:

> “Wait… why are we paying *how much*… to record hours?”

## The pricing breaks the value prop
---
For context, my parents were on **$9.99 USD per seat** as a flat fee. Totally reasonable. Then they got a new quote: bump the per-seat price to **$17.50**, and add a whole new “usage” layer.

Option one was a **$2,000/month** flat fee for “unlimited usage”. Option two was “usage-based”, calculated from recent months, capped at **$400/month**. Which, first of all, how do you even charge “usage” for a time tracking app? People are literally typing numbers into boxes.

And **the weirdest part**: if we took the usage-based option, we’d have to enable **credit card billing on all invoices**. Translation: route more of the company’s money flow through Harvest’s credit card billing, and potentially hand over **+3%** of invoice revenue in processing/platform fees.

At that point it stops feeling like “time tracking software” and starts feeling like someone found a new place to stick a toll booth or [boom](https://en.wikipedia.org/wiki/Boom_(navigational_barrier)).

If my parents took the “unlimited usage” option, that’s roughly **$400/month** for seats plus **$2,000/month** for the unlimited fee.

In total, my parents would have to pay **$28,800 a year** for a time tracking app.

That’s not “a little increase to help out a time tracking startup”. That’s **“congrats, your time tracker is now a mortgage-sized monthly bill.”**

Meanwhile, hosting Kimai:

- On a homelab: basically **free** (already paying for power + internet + old PCs and already bought hardware)
- On a VPS: still basically free compared to **$28,000 A YEAR**
  - A small VPS on DigitalOcean/Linode/etc is like **$6–$20/month**
  - Call it **$120–$240/year**, plus a domain

Peanuts. Even accounting for time spent tinkering and setting everything up. 

For **$28,000** you could hire someone to build a full height rack, set up all the SaaS and IT services you could dream of, and still have enough money left over to buy 16gb of ddr5 for your gaming pc.

Our homelab was basically a one-time hardware purchase. After that, it’s a fixed platform I can keep extending. I can run dozens of Docker containers on it, hosting open source alternatives to the paid stuff we used to subscribe to, all for about the cost of a Netflix subscription each year.

## What I actually did
---
I’m a fullstack dev, I main Ubuntu on a framework 16, and I LOVE homelab stuff. Been building out a full height rack for years. Currently I have three machines: one is a dedicated 70Tb NAS, another has 2 3080 Ti's for llms + docker containers, the other is dedicated to nginx, routing and more docker. This wasn’t heroicly built. It was just modern infra being very accessible now. I spun up the Kimai in an afternoon of tinkering.

At a high level, it’s Kimai running in Docker, with Docker running inside a VM on Proxmox. I put Nginx in front so it’s reachable at a clean URL, used Cloudflare for DNS and proxying, and got HTTPS set up with free SSL through Cloudflare. For backups, I rely on Proxmox ZFS snapshots, because I enjoy sleeping.

Now my parents’ team can log time like they always did, except we control the instance, we control the data, and we control the cost. And Kimai is… fine. It’s not some VC-designed conversion funnel. It’s a time tracker. That’s the point: simple, does the job, set it up once and forget about it. **What we thought we could rely on Harvest for.**

## The private equity playbook (and why it backfires)
---
I’m not claiming I know what’s happening inside Harvest. I’m not on the board. I’m not reading internal memos.

But I *have* seen this pattern enough times to recognize the shape of it:

1. Buy a stable “boring SaaS” with predictable customers  
2. Increase prices hard (especially on teams that can’t easily churn)  
3. Add vague fees that are hard to justify (“platform”, “usage”, “success”, etc.)  
4. Squeeze revenue now, worry about retention later  
5. If customers leave… that’s a next-quarter problem

A pretty common term people use for the worst version of this is asset stripping **asset stripping**, extracting value (cash, fees, whatever) and leaving the company weaker on the other side. I theorize a version of this is happening over at Harvest right now. In extreme scinarios, the company dies as a result. The recent Hudson's Bay bankruptcy is a good example of this process. A 356 year old company, one that shaped the fabric of Canadian nationhood, obliterated in 2 years of private equity management.

And here’s the funny part:

## This strategy creates the exact conditions where open source wins
---
When pricing is fair, convenience wins.
When pricing gets weird, **control** wins.

We've seen this play out before with movie streaming vs piracy. The 2020s have seen a surge in consumer streaming costs and a surge in content piracy.

Open source doesn’t need to be perfect. It just needs to be:
- good enough
- cheaper enough
- stable enough
- easy enough to host and use

And in 2026, that last part is *way* easier than it used to be.

## The “Blender effect”: once open source is good, it’s hard to compete
---
Blender is the example I keep coming back to. Blender didn’t win because it had the best pricing page. It won because it became genuinely good, widely supported, and community-driven. It’s also basically impossible to undercut because “free + open source” is undefeated. ~$100/month for cinema 4d and octane engine? No thanks.

Any proprietary 3D tool competing with Blender has to justify why you should pay… when the free option is legit industry-grade.

Time tracking isn’t 3D modeling, obviously. But the pattern rhymes:

If enough people get burned by “stable SaaS --> acquisition --> pricing explosion”, they start looking for exits.

Open source is that exit.

## I think we’re entering a new software cycle
---
I think we’re going to see more of:

1. **Small stable SaaS** exists for years (slow growth, reliable)
2. It gets acquired (VC/PE/etc.)
3. Prices go up, fees appear, support gets “optimized”
4. Customers churn, especially the technical ones
5. Open source alternatives get an influx of users + contributors
6. The market resets around tools people can actually control

And the difference now vs. 10-15 years ago is huge:

You don’t need a rack in a closet and a CCNA to self-host something.

I do own a rack, but it's in my parents baseement... far better than a closet I'd argue. but my point remains!

You can run a ton of open source SaaS tooling on:
- a Mac mini
- a Raspberry Pi
- a $10/month VPS
- an old pc repurposed as a home server

Open source adoption isn’t just ideology anymore. It’s logistics. And logistics that small businesses will take seriously when it's destroying their bottom line.

## The optimistic takeaway
---
Do I like watching solid products get enshittified? Not really.

But I *do* like the unintended side effect:

When companies squeeze users for short-term gains, they’re basically funding the ecosystem that replaces them.

People won’t just roll over and take it. We didn’t.

We replaced Harvest with Kimai in an afternoon and moved on with our lives. Literally saving us **$28,000 A YEAR.** 

And if enough teams do that, the “boring SaaS” category starts to look a lot like:
- open tools
- self-hostable defaults
- paid hosting as a choice (not a hostage situation)

Which is… honestly kind of great imo.

---

If you wanna read more, checkout my other posts [here](/blog).
