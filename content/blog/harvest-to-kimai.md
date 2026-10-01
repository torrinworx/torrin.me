---
title: A Time Tracking App Wanted $28,800 a Year, So I Replaced It With a Homelab
description: Harvest raised my parents' time tracking bill to $28,800 a year. I moved their company to Kimai, an open source tracker, on our own server in one afternoon.
date: 2026-10-01T12:00:00-04:00
---

I first posted this on dev.to in January 2026. This is a cleaned up version.

My parents run a software testing and consulting company called [worX4you](https://worx4you.com). They've run it for 17 years. The business is simple: hire good people, take on small business clients, track time, send invoices, repeat.

For years they tracked time with **Harvest**. It was a simple product at a fair price, $9.99 USD per seat.

Then Harvest was acquired (reported in 2024 as involving the private equity firms Montagu and TA Associates), and my parents got an email about new pricing.

## The new price

The seat price went from $9.99 to **$17.50**. On top of that came a new "usage" fee, with two options:

- **$2,000 a month** for "unlimited usage", or
- a usage-based fee worked out from recent months, capped at **$400 a month**

I still don't know what "usage" means for a time tracker. People type hours into boxes.

The usage-based option had another catch. To take it, we'd have to turn on Harvest's credit card billing for all of our invoices. That puts more of the company's revenue through Harvest, and processing fees can take around 3% of every invoice.

So we priced the unlimited option. That's about $400 a month for seats plus $2,000 a month for the fee. **$28,800 a year, to log hours.** When I wrote the original post, Harvest's [pricing page](https://www.getharvest.com/pricing) still didn't show these prices.

## What I did instead

I set up [Kimai](https://www.kimai.org/), an open source time tracker, on our home server. It took one afternoon.

The setup:

- Kimai runs in Docker, inside a VM on Proxmox.
- Nginx passes requests to it from a clean URL.
- Cloudflare handles DNS and gives it free HTTPS.
- Proxmox ZFS snapshots handle backups.

The server was already there. I've been building out a rack in my parents' basement for years. Right now it has three machines: a 70 TB NAS, a box with two 3080 Ti cards for local LLMs and Docker, and one for Nginx, routing and more Docker. So the extra cost of Kimai is close to zero. If you don't have a homelab, a small VPS costs $6 to $20 a month, or about $120 to $240 a year. That's still less than 1% of the Harvest quote.

The team logs time the same way they did before. The difference is that we control the server, the data and the cost. Kimai isn't fancy. It tracks time, and you set it up once and forget about it. That's all we wanted from Harvest in the first place.

If you want to do the same, I wrote a [Kimai setup guide](/blog/kimai-setup) with the Docker Compose file I used.

## Why I think this keeps happening

I don't know what goes on inside Harvest. But I've seen this pattern before:

1. A firm buys a stable, boring SaaS product with loyal customers.
2. It raises prices hard, mostly on customers who can't easily leave.
3. It adds fees that are hard to explain ("platform", "usage", "success").
4. It takes the revenue now and deals with customers leaving later.

The worst version of this is called **asset stripping**: pulling cash out of a company and leaving it weaker. Hudson's Bay is a Canadian example. It was founded in 1670, spent years under private equity ownership, filed for creditor protection in 2025 and closed its stores the same year.

## Why open source wins when this happens

When pricing is fair, people pay for convenience. When pricing stops making sense, people want control.

Open source doesn't need to be perfect to win here. It needs to be good enough, cheap enough, stable enough, and easy enough to host. In 2026, hosting is the part that changed most. You don't need a server closet and a networking certification anymore. A Mac mini, a Raspberry Pi, an old PC or a $10 VPS can run a lot of open source tools.

Blender is one example. It's a free, open source 3D tool, and it got good enough that studios use it for real work. Paid 3D tools now have to explain why you should pay for them. Open source time trackers like Kimai can get there too, if enough teams that leave Harvest and tools like it start using them and contributing back.

## What I took from it

I don't like watching good products get worse. But when a company squeezes its customers, it pushes them toward the tools that replace it. We moved from Harvest to Kimai in an afternoon, and it saves my parents' company about $28,000 a year.

This is the kind of work I like most: find where a business is losing money to its tools, then build or host something better. I'm a full stack and applied AI engineer. If your team has a problem like this, [get in touch](/).
