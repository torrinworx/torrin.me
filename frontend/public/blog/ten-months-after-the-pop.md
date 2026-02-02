# header
Ten Months After the Pop: The rise of the Personal Cloud

# description
A sci-fi-ish look at the post-AI-bubble hardware yard sale, and why cheap, boring hardware could kick off the “Personal Cloud” era: household servers that replace subscriptions, keep your data local, and make self-hosting normal.

# created
2026-02-01T00:00:00-05:00

# modified
2026-02-01T00:00:00-05:00

Ten months after the AI bubble popped, my feed stopped being “prompt engineering tips” and "Moltbot did whaaatt??" and became what it was always destined to be: liquidation notices.

Not metaphorical liquidation. Actual liquidation.

A week after the first “strategic refocus” press release, someone listed eight Nvidia H100s on eBay with the exact energy of a guy selling a used elliptical: **“barely used, only cried on twice, pickup only.”** Another listing offered an entire rack, rails, PDUs, cable spaghetti, and that one mystery Keystone jack nobody understands, tagged as **“ex‑unicorn infrastructure.”** Like it was a vintage denim jacket.

The comments were a mix of [schadenfreude](https://en.wikipedia.org/wiki/Schadenfreude) and gear lust:

- “Does it come with the original box?”
- “Any coil whine?”
- “Was it used for training or inference?”
- “No lowball offers, I know what I have.”

And look, people love to argue about whether “the bubble” is real. That it’s different this time. That AI is inevitable. That this is the next internet.

Sure. Fine. I’m not even here to fight about that.

I’m here for the best part of any hype cycle: **the yard sale.**

Because once the hype fog thins out, hardware stops being mythology. It becomes a thing you can buy, own, and use. And when that happens, the center of gravity shifts away from “renting intelligence” and back toward what actually improves daily life:

**a Personal Cloud you control.**

Personal Cloud: **a home server that runs the boring digital infrastructure you use every day.**

Call it a **Personal Cloud**, a **Home Cloud**, a **Cloudlet** (if you want to sound like a telecom engineer), whatever. The name matters less than the vibe:

> Your services. Your data. Your hardware. Your rules.

## The pop wasn’t AI.
---

AI didn’t stop working. Nobody forgot how transformers function. Nobody had to uninstall CUDA or ROCm.

What popped was the story: that you could pour oceanic amounts of money into compute and reliably get it back as product value *soon*.

Turns out “soon” costs interest. And “soon” was never going to be next quarter.

So what you got instead was a bunch of companies doing what companies always do when they realize they built a rocketship out of a subscription box:

- **mispriced compute**
- chasing **marginal value**
- with a cost structure that only makes sense if growth is eternal
- and, inevitably: **enshitification** (price hikes + rent-seeking + lock-in)

And if that sounds like I’m just dunking on them, yeah, a little. But also: this isn’t a moral failing. It’s incentives.

If the market rewards “ship a demo, raise a round,” you get a lot of demos and a lot of rounds. If the market rewards “rent GPU time to sell $30/month chat,” you get a lot of GPU time being rented and… not a lot of profit.

That’s the core absurdity:

We built a global supply chain of the most advanced, highly engineered computational hardware on Earth to feed a pricing model that looks like a streaming subscription. Netflix charges you $30/month and it’s profitable because it’s not buying out the world’s fab capacity to do it.

Meanwhile, AI economics are like: “Here’s a nice chat UI. Behind the curtain is an industrial furnace. Please don’t ask questions.”

## The real damage was hardware scarcity
---

My beef with the boom isn’t “AI bad.” It’s not even “AI useless.” AI is obviously useful. You’ve used it. I’ve used it. It rules at certain tasks.

The damage was **hardware scarcity** and the knock-on effects of that scarcity.

When GPU and RAM pricing goes feral, it doesn’t only hit people training models. It hits:

- the person who just wants a decent gaming/workstation build
- the student trying to learn CUDA or graphics or ML
- the homelabber who wants to transcode video without setting their CPU on fire
- the open-source crowd who can’t casually test or run heavier workloads locally
- entire ecosystems that depend on “hardware is normal and available”

And it’s never just one thing. GPUs spike, then RAM, then NVMe, then networking gear, then motherboards. When demand ramps hard enough, everybody feels it, even companies that *should* be living in a different supply chain universe.

This is the part that makes me feel like I’m taking crazy pills:

We’re acting like it’s normal for “AI hype” to compete with “consumer electronics that billions of humans use.”

That’s not a personal failing by any one company. It’s a system-level distortion. And it’s not sustainable.

## The best-case outcome: hardware gets boring again
---
Here’s my aggressively optimistic stance: **even if the bubble never “pops,” hardware can still get cheaper and more available over time.** Supply chains expand. Competitors catch up. Used markets mature. The world adapts.

But if there *is* a pop? That can accelerate the boring part.

Because the moment startups fold and the moment big players tighten budgets, the hardware exits stage left. Not into a volcano. Into the secondhand market.

And the secondhand market is where hardware becomes normal.

Ten months after the pop (in this little sci-fi fantasy), the gear started showing up in waves:

- GPUs that used to require executive approval and a blood ritual
- server RAM sold by the pound
- enterprise SSDs with more endurance than my lower back
- 10/25/40/100Gb networking gear that used to live behind keycard doors
- entire chassis being sold as “local pickup only” because shipping would require a forklift and a priest

It felt like the dotcom crash, if the dotcom crash shipped you an EPYC board.

And suddenly, a weird idea stops being weird:

> What if every household could have a small, reliable server that runs the boring infrastructure of their digital life?

Not as a weekend hobby. As a normal appliance. Like a fridge. Yes, like a fridge.

## The Personal Cloud: stop renting your own life back from companies
---
“Self-hosting” has a branding problem. It sounds like something you do because you enjoy pain, or because you have a beard that can compile Gentoo.

So don’t sell it as self-hosting.

Sell it as what it actually is:

### A Personal Cloud (aka: a box that does your stuff)

A household server can replace an absurd number of subscriptions and “free” services that aren’t free at all:

- **photos** (and sharing) without algorithmic nonsense
- **file sync** across devices without a product manager in the middle
- **password management** that isn’t a browser extension lottery
- **media streaming** you actually own
- **home automation** without cloud fragility
- **backups** that actually exist (and restore)
- **personal search** across your own documents and files
- **lightweight local AI** for tagging, summarizing, searching, and workflow glue

**This the Personal Cloud.**

Not “more compute.” Not a benchmark score. Not “my rack is bigger than yours.”

You acheive a goal that homelabs have strived for since personal computing was a thing: **Control.**

My Personal Cloud replaces: Google Photos, iCloud, a chunk of Dropbox, Netflix, and at least three "we promise we are privacy first" services.

People need to start thinking of homelabs as an appliance that provides services, services that negate the need for ten different $30/month subscriptions.

Just like a router provides Wi‑Fi. Just like a water heater provides hot water. It’s infrastructure, not a toy.

## Three machines, one cluster, digital freedom
---

Right now our homelab is a Proxmox cluster across three physical machines:

- **cpu-server**: the “front door”  
  - hosts a VM that runs Docker containers like:
    - Nginx Proxy Manager (routing + SSL)
    - VaultWarden (password manager)
    - OpenWebUI (chat UI for local models)

- **gpu-server**: the “muscle”
  - AMD Ryzen 9 7950X
  - **two RTX 3080 Ti’s**
  - used for Jellyfin transcoding and local model stuff
  - (not to brag, but Proxmox GPU passthrough was “pretty simple” in the way drywall is “pretty simple”)

- **storage-server**: the “behemoth”
  - ZFS pool: **8x 8TB in raidz2**
  - exports NFS shares to the cluster
  - hosts a VM running the Arr stack (qbit + sonarr/radarr/etc)
  - runs backups on a schedule for the important VMs

It’s not a startup. It’s not “a platform.”

It’s just a household system that does household things: media, passwords, storage, backups, and a growing pile of “why am I paying a subscription for this?”

And here’s the killer homelabers need to start talking about:

**resilience via separation.**

When storage is storage and compute is compute, you can upgrade and swap pieces without tossing the whole setup. You can grow it gradually. You can treat it like infrastructure, the way a municipality treats a 10-year growth plan: a road here, a park there, redevelopment over there. (Also: Waterloo Region please install more water fountains.)

That’s the world I want more people to have access to.

## Cheap hardware is redundancy
---

When people fantasize about cheap hardware, they imagine faster benchmarks.

Homelab reality is different. Cheap hardware mostly buys you:

- redundancy
- headroom
- less fragility
- less “oh no, I can’t update this or everything dies”
- more boring reliability

With today’s pricing, you can throw a pile of money at upgrades and somehow end up with… one expensive GPU and the same single points of failure.

Post-pop (or even just “post-supply-chain-calm”), that same budget turns into actual household infrastructure:

- more RAM where it matters (ZFS loves it; VMs love it; everyone loves it)
- more NVMe for VM storage and fast caches
- real networking (10Gb stops being exotic)
- a second storage node or a cold backup box
- a proper UPS and power monitoring
- room to keep services up while you tinker instead of “tinker = outage”

The goal isn’t “my rack is powerful.” The goal is:

> my family doesn’t notice when I’m messing with it.

That’s what makes it an appliance.

And this is the other refrain worth repeating:

**The Personal Cloud isn’t about speed. It’s about control.**  
**The Personal Cloud is how you cancel subscriptions without losing functionality.**

## Cloud is easy. And that’ll cost you.
---
Cloud is easy in the way fast food is easy. It’s convenient, it works, and it’s designed to make you stop thinking about ingredients.

The reason I’m excited, pop or no pop, is that this AI cycle is accidentally building the tools that make Personal Clouds way easier to run.

I used my own LLM client to set up Proxmox Backup Server in an afternoon. Now all my VMs have daily backups. I can sleep easy knowing that if a VM starts to act up, it’s off to the abyss with it. Push a button, restore the service, move on with life.

That kind of “home infrastructure assistant” is a real shift.

The future I want is one where you can install an OS that’s basically:

- Debian underneath
- a clean web UI on top
- “pick what you want to run” like an app store (but not cursed, CasaOS gets close, but still too fiddly for most people)
- sane defaults, automated updates, health checks
- built-in backups and data redundancy
- remote access that doesn’t require networking wizardry
- logs that explain themselves in human language (the hardest thing on this list)

Self-hosting stops being a hobby and becomes household infrastructure.

And AI (the useful parts) can help bridge that gap: explain errors, generate configs, suggest safe upgrades, document your setup as you go, reduce yak shaving.

Not “AI will run your life.” More like: **“AI will make Linux less spiteful for noobs.”**

You can feel the shift: fewer “beg strangers on a forum” moments, more “paste logs into an assistant and move on.”

## Open source wins the AI race
---

This is where I’m fully, unapologetically optimistic.

Historically, in any given field, open source often trails the proprietary state of the art. Not always, but often. And it makes sense: money buys time, teams, and the means of compute.

But in this AI cycle, open source has been moving *ridiculously* fast. Not “caught up instantly” fast, but fast enough that the gap is closing in months, sometimes weeks, not years.

That matters for a Personal Cloud future because:

- you can run solid local models without corporate permission
- you can build workflows without vendor lock-in
- you can keep your data local by default
- you can swap components and keep your stack intact

Even if big companies keep dominating the top end, open source can dominate the “good enough to be useful every day” zone.

That’s the zone that changes normal people’s lives.

## A nod to Cory Doctorow
---

If we want people to own their tech again, the fight isn’t just hardware prices. It’s also law and policy.

Cory Doctorow has been banging the drum for years about how **anti-circumvention laws** and hostile-to-repair rules turn ownership into a subscription. If you “own” a device but can’t modify it, can’t repair it, can’t audit it, can’t replace parts, can’t even decide what software vendors to use, then you don’t really own it. You’re leasing permission.

A Personal Cloud works best in a world where repair is normal, modding is legal, interoperability is expected, and you can run whatever software you want on hardware you bought.

It’s not radical. That’s just what “personal computer” used to mean.

## Compute as a household utility
---

My delusional optimism: I want a world where the default household has a small server the way it has a router.

Where you can hire a local contractor, not a cloud monopoly, to install and maintain a Personal Cloud the way someone installs an air conditioner.

Where paying $30/month is for genuinely external services (like offsite backups), not for the basic privilege of accessing your own stuff.

Ten months after the pop, that world feels possible. Not because Big Tech got nicer, but because the hardware got boring again.

And boring hardware is freedom.

So yeah: if the bubble pops, I’ll be on eBay with everyone else, buying ex‑unicorn infrastructure like it’s Christmas.

And if it doesn’t pop? Cool. I still want the same thing: more open source, more repairability, more local-first services, more people owning their compute.

Hype fades, tools improve, hardware supply normalizes, and the Personal Cloud becomes normal.

And that’s a future I’m genuinely excited to build.

---

**Related:** If you want the origin story for this whole “Personal Cloud” obsession: Harvest tried to charge us **$28,800/year** to type numbers into boxes, so I self-hosted Kimai instead. Write-up:

[A Time Tracking App Wanted $28,800, So I Replaced It With a Homelab](/blog/harvest-tisk-tisk)

If you wanna read more, checkout my other posts [here](/blog) or visit my [home page](/).
