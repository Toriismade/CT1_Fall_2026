# Hand Murmuration

A starling murmuration you steer with your hand, built with p5.js and ml5.js handPose. Week 8 homework.

**Live:** https://toriismade.github.io/CT1_Fall_2026/week8/homework/

## Files

| File | Contents |
|---|---|
| `index.html` | Page structure and library links |
| `css/style.css` | Text and layout styles |
| `flock.js` | The starling flock simulation |
| `sound.js` | Synthesized wingbeat sound |
| `sketch.js` | p5.js setup and draw loop: hand tracking, gestures, rendering |

## Run

Open `index.html` in Chrome and allow camera access. Click once on the page to start the sound.

The camera only works over `https://` or on `localhost`. GitHub Pages works.

## Gestures

| Gesture | Effect |
|---|---|
| Open palm | The flock sweeps wide loops |
| Fist | It gathers into a dense ball |
| Pinch | It flattens into a thin sheet |
| Tilt your hand | The flock wheels around |
| Quick swipe | A ripple of alarm runs through it |
| Two hands | It splits in two |

With no hand in view, hold the mouse button to steer.

## Keys

| Key | Action |
|---|---|
| H | Hide the text |
| G | Hand tracking overlay |
| C | Camera preview |
| M | Wingbeat sound on / off |

## How it works

### Flock

The flock is simulated in 3D and projected onto the screen. It is based on the StarDisplay model of starling flocks:

- **7 nearest neighbours.** Each bird aligns with, and moves toward, its 7 nearest neighbours rather than every bird within a fixed distance. Separation still applies to every bird nearby.
- **Rear blind angle.** Birds in the 90° cone behind a bird are ignored for alignment and cohesion.
- **Banking flight.** Birds fly at near-constant speed and turn by rolling into a bank and slowly rolling out, at a 10:1 roll-in to roll-out ratio. Banking costs a little lift.
- **Reaction time.** Each bird re-senses its neighbours about every 50 ms, out of step with the others.
- **Roost attraction.** A horizontal pull toward a roost plus a preferred altitude keep the flock flat and circling. The roost follows your hand. Each bird has its own tolerance, and the pull acts mostly on edge birds, so turns start at the edge and travel inward.
- **Surface tension and pressure.** A coarse density field pulls stray and edge birds inward and pushes crowded birds apart. This keeps the flock's lobes round and taut. It is my own addition, motivated by the observation that real flocks are denser at their border than in their centre.
- **Agitation waves.** A quick swipe startles nearby birds. They roll sideways, and their neighbours copy them, so a dark band travels through the flock.
- **Shading.** Each bird's darkness comes from its bank angle, because a banked bird shows more wing to the viewer.

### Sound

The wingbeat roar is synthesized in the browser, with no audio files. Thousands of short filtered-noise grains, each one a wing stroke, are layered into two seamless loops in the 400–3200 Hz range. A few faint whistles stand in for calls. The spectrum was matched to a recording of a real murmuration overhead. The roar swells with how hard the flock is turning, how close it is and how startled it is, and it pans with the flock's position on screen.

## References

### Starting point

- Murmuration interactive installation video, the reference this project started from: https://www.youtube.com/watch?v=e_WRC0m5pUE

### Research on starling flocks

- Reynolds, C. W. (1987). *Flocks, Herds, and Schools: A Distributed Behavioral Model.* SIGGRAPH '87. The original boids algorithm. https://www.red3d.com/cwr/boids/
- Hildenbrandt, H., Carere, C. & Hemelrijk, C. K. (2010). *Self-organized aerial displays of thousands of starlings: a model.* Behavioral Ecology 21(6). Source of the StarDisplay rules used here: topological neighbours, blind angle, banking, roost attraction. https://arxiv.org/abs/0908.2677
- Ballerini, M. et al. (2008). *An empirical study of large, naturally occurring starling flocks: a benchmark in collective animal behaviour.* Animal Behaviour. Source for flat flock shapes and denser borders. https://arxiv.org/abs/0802.1667
- "Waves of Starlings", BirdGuides. Explains dark agitation waves as birds rolling sideways and copying their neighbours. https://www.birdguides.com/articles/waves-of-starlings/
- A study of collective escape patterns in starling flocks under predation, Behavioral Ecology and Sociobiology (2019). https://link.springer.com/article/10.1007/s00265-019-2734-4

### Visual and sound references

- Photographs and videos of real murmurations, used to judge shape, density and folding.
- "A murmuration of starlings sounds like waves crashing against the shore", r/Damnthatsinteresting. The recording the wingbeat sound was matched against.

### Libraries and fonts

- p5.js 1.11.1: https://p5js.org
- ml5.js handPose: https://ml5js.org
- Google Sans Flex, via Google Fonts: https://fonts.google.com

### Tools

- Built with help from Claude (Anthropic).
