# RiverGuard AI
### Real-Time Flood Risk Intelligence for Keralam

> *"In August 2018, Pathanamthitta district watched the Pamba river rise seven metres above danger level in under 48 hours. Fifty-four of Keralam's sixty-one dams opened their shutters within days of each other. Over 5.4 million people had to leave their homes. Nobody had built a system that could look at all of that and tell one village, in plain words, that it was time to go."*

I built RiverGuard AI because that gap felt like something worth trying to close, even a little.

---

## Why This Exists

### The 2018 Kerala Floods

In August 2018, Keralam experienced the worst flooding it had seen in a hundred years. The numbers alone are hard to sit with:

- **483** people lost their lives
- **5.4 million** people were displaced from their homes
- **1,50,000+** houses were damaged or destroyed
- **₹31,000 crore** in estimated economic damage
- All **14 of 14** districts were affected at the same time
- Idukki's reservoir reached a critical level and its shutters were opened for the first time in **26 years**

But numbers, on their own, don't really tell you what it was like to live through it. What made 2018 so devastating wasn't only the rain — it was the distance between the information that existed and the people who needed it. Somewhere, a rainfall reading was being logged. Somewhere else, a dam operator was watching a reservoir climb toward its limit. And in between, a family in a low-lying part of Alappuzha or Kottayam or Pathanamthitta had no way of knowing any of that, and no way of knowing whether tonight was the night to leave. When dams released water upstream, the villages downstream sometimes had barely any warning before it reached them. District officials, trying to manage dozens of rivers and reservoirs at once, had no single place to look and see which one was closest to turning into an emergency.

That distance — between data that already existed and a decision a person needed to make in time — is the thing I hope RiverGuard AI can help shrink.

### It Wasn't a One-Time Event

Keralam has flooded seriously in the monsoon seasons since 2018, more than once. That's not really a surprise if you look at the geography rather than the calendar. The Western Ghats sit right along the state's spine and catch enormous rainfall every year, funnelling it down short, steep rivers that reach the coast in hours, not days. Alappuzha sits at or near sea level, with backwaters that have nowhere obvious to drain to. The Pamba still gathers water from the entire southern highlands and pushes it all through one narrow stretch of land.

None of that has changed, and none of it is likely to change soon. What can change is how early someone finds out, and how clearly they're told.

---

## What RiverGuard AI Actually Does

At its heart, RiverGuard AI tries to answer one simple question for every district in Keralam: *how much danger is there right now, and what should someone do about it?*

It brings together live rainfall data, reservoir and dam storage levels, and a trained machine learning model, and turns all of that into a plain-language risk reading for each district — not just a rainfall number, but something closer to an actual answer. You can explore a real, geographically accurate map of Keralam, select any district, and see its current rainfall, river level, and reservoir status explained simply. There's an assistant built into the experience that you can ask *why* a place is at risk, not just what the risk level says. If you'd rather not keep checking back, you can follow a district and be notified if it moves into real danger. If you need something to hand to a local official, there's a downloadable report. And because the 2018 floods are the reason any of this exists, there's a section of the site built specifically to walk through what happened that year, so the story behind the tool is never far from the tool itself.

### On the Data Behind It

The rainfall and soil readings come from a live weather source. The reservoir and dam storage levels are drawn from Kerala's own electricity and irrigation department telemetry, because it felt important that the tool reflect what 2018 actually taught — that dam management, not only rainfall, was central to how that disaster unfolded. The risk model itself is a Random Forest and XGBoost ensemble weighing eleven hydrological factors together — rainfall, river level, reservoir storage, soil saturation, elevation, drainage, and a few others — and it reports a confidence alongside its classification rather than presenting certainty it doesn't have.

One piece is still missing: real-time river gauge readings from the Central Water Commission aren't available through any free, immediate public source, so this project relies on rainfall and reservoir signals instead for now.

---

## How It's Built

RiverGuard AI runs entirely on free and open tools. The interface is built with Next.js, with a real geographic map of Keralam rendered using D3 rather than a drawn approximation, and a Three.js scene woven into the section that tells the story of 2018. Underneath, a FastAPI backend runs the trained model and pulls together live weather and dam data. Notifications use the open Web Push standard, and an integrated Gemini-powered assistant is there for anyone who'd rather ask a question in their own words than read a dashboard.

---

## What This Is, and What It Isn't

I'd rather be clear about this than let anyone assume more than is true: RiverGuard AI is a decision-support tool. It is not, and isn't trying to be, a replacement for official warnings or emergency instructions. Every risk level it shows comes from a model trained on historical flood patterns and current data, and models are sometimes wrong. My hope is that it makes the distance between information and a decision a little smaller — not that it becomes the final word.

**Risk predictions are generated from a machine learning model trained on physics-informed synthetic data modelled after historical flood patterns. This platform is a decision-support tool and does not replace official warnings issued by the Kerala State Disaster Management Authority.**

---

*Built in the hope that the next warning reaches someone in time.*