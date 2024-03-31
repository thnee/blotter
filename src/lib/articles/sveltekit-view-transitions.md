---
slug: "sveltekit-view-transitions"
title: "View Transitions in SvelteKit"
date: "2024-03-20"
description: >
  Guide to using View Transitions in SvelteKit,
  with a pratical example on how it can be implemented
  for full-page view transition animations.
tags:
  - "Software Engineering"
  - "JavaScript"
  - "Svelte"
  - "SvelteKit"
---

This is not really a how-to, but more of a how-it-could-be-done-in-this-case.  
View transitions and animations are complex,
and different projects will most definitely need different solutions.

There are a few fundamental concepts in JavaScript and SvelteKit, that are relevant.  
This article demonstrates one way of putting the concepts together in practice,
without using any third party libraries.

The goal of this article is to achieve animations when navigating between pages,
specifically full-page animations.  
For example: "when navigating from /a to /b, make /b slide in over /a".

## View Transitions

The purpose of View Transitions is animating the transition
between normal page navigations within a web site.  
For example when navigating in the browser from `/a` to `/b`,
by clicking a link or a button.

View transitions is a new [standard API][view-transitions-api] in browsers.  
At the time of writing, the [browser support][caniuse-view-transitions] is limited.  
It available in Chrome, Edge, and Opera.
But not in Firefox, Safari, and several others.

To deal with the varying browser support,
it is recommended to use use progressive enhancement.  
In other words, if the view transition API is available then use it, else don't.

To check if the View Transition API is available in the current browser,
check if the `document.startViewTransition` attribute exists.

```js
if (!document.startViewTransition) {
  console.log("It's not available, abort!");
}
```

## SvelteKit navigation lifecycle

Navigation in SvelteKit can be triggered in various ways.  
For example when calling `goto()` from JavaScript code,
or when clicking a regular link.  
(SvelteKit does not require the use of special elements for links.
Regular `<a>` elements are used for client side navigation automatically).  

The [`onNavigate` lifecycle function][sveltekit-onnavigate]
makes it possible to hook into, and control, the navigation between pages.  

```svelte
<script>
  import { onNavigate } from "$app/navigation";
  onNavigate((navigation) => {
    console.log("Coming from:", navigation.from);
    console.log("Going to:", navigation.to);
  });
</script>
```

There is an excellent
[Svelte blog article][svelte-blog-sveltekit-view-transitions]
that demonstrates one way to use View Transitions and `onNavigate` in SvelteKit.  
However, it mostly goes over the fundamentals,
so it's still up to the reader to put it all together.  
And that article only shows how to implement animations with CSS.
Implementing animations with CSS certainly works great.
But it adds a whole new layer of complexity to the code,
so much so that it warrants a whole article all on its own.
In the most typical scenario,
implementing the animations in JavaScript
is going to be a lot simpler and allow for more flexibility with less code.

## Animations

Animations can be done either via CSS or via JavaScript.  
In CSS, the [`animation` property][mdn-css-animation] is used.
And in JS, the [`animate` function][mdn-js-animate] is used.

## Putting it together

The following code is not intended to be a
general purpose framework for View Transitions.  
It is intended to be highly specific, and produce a certain type of effect.  
This effect is probably the most common scenario in a typical application.

It will produce the following effect:

When navigating from `/list` to `/details`:

- The `/details` page will slide in from the left, covering the `/list` page.
- The `/list` page will fade out, remaining in the same position.

When navigating from `/details` to `/list`:

- The `/details` page will slide out to the left, revealing the `/list` page.
- The `/list` page will fade in, remaining in the same position.

When navigating between any other pages, that are not defined in the config:

- Don't animate anything.
- Don't even start a View Transition.

#### File: `lib/transitions.js`

```js
import { onNavigate } from "$app/navigation";

class Transitions {
  pageConfig = [
    this.makePageConfig("/list", "fade", "/details", "slide-left"),
  ];

  makePageConfig(sourceRouteId, sourceAnimation, targetRouteId, targetAnimation) {
    function getAnimation(name) {
      if (name == "fade") {
        return {
          enter: {name: "fade-in"},
          leave: {name: "fade-out"},
        };
      }
      if (name == "slide-left") {
        return {
          enter: {name: "slide-in-from-left"},
          leave: {name: "slide-out-to-left"},
        };
      }
    }
    return {
      source: {
        route: {id: sourceRouteId},
        ...getAnimation(sourceAnimation),
      },
      target: {
        route: {id: targetRouteId},
        ...getAnimation(targetAnimation),
      },
    };
  }

  onNavigateViewTransition() {
    onNavigate((navigation) => {
      let transitionConfig = this.getTransitionConfig(navigation);

      // If there is no transition config for this navigation, do nothing.
      if (!transitionConfig) return;

      return new Promise(async (resolve) => {
        const viewTransition = document.startViewTransition(async () => {
          resolve();
          await navigation.complete;
        });
        // Wait until the new page has been created in the DOM.
        await viewTransition.ready;
        this.performViewTransition(transitionConfig);
      });
    });
  }

  getTransitionConfig(navigation) {
    // If view transitions are not available, do nothing.
    if (!document.startViewTransition) return;

    // Try to find a matching page configuration for current navigation routes.
    for (const config of this.pageConfig) {
      // If going from source to target, direction is entering.
      if (
        config.source.route.id == navigation.from.route.id &&
        config.target.route.id == navigation.to.route.id
      ) {
        return {...config, direction: "entering"};
      }
      // If going from target to source, direction is leaving.
      if (
        config.source.route.id == navigation.to.route.id &&
        config.target.route.id == navigation.from.route.id
      ) {
        return {...config, direction: "leaving"};
      }
    }
  }

  performViewTransition(config) {
    if (config.direction == "entering") {
      this.animatePage(config.source.leave, "old");
      this.animatePage(config.target.enter, "new", true);
    }
    if (config.direction == "leaving") {
      this.animatePage(config.target.leave, "old", true);
      this.animatePage(config.source.enter, "new");
    }
  }

  animatePage(animation, el, onTop) {
    let keyframes = [];
    let options = {};

    if (animation.name == "fade-in") {
      keyframes = [
        {opacity: "0"},
        {opacity: "1"},
      ];
    }
    if (animation.name == "fade-out") {
      keyframes = [
        {opacity: "1"},
        {opacity: "0"},
      ];
    }
    if (animation.name == "slide-in-from-left") {
      keyframes = [
        {transform: "translate(-100vw)"},
        {transform: "translate(0vw)"},
      ];
    }
    if (animation.name == "slide-out-to-left") {
      keyframes = [
        {transform: "translate(0vw)"},
        {transform: "translate(-100vw)"},
      ];
    }

    if (onTop) {
      keyframes[0].zIndex = "999";
      keyframes[1].zIndex = "999";
    }

    options.easing = "ease-in-out";
    options.duration = 250;

    options.pseudoElement = `::view-transition-${el}(root)`;
    document.documentElement.animate(keyframes, options);
  }
}

let transitions = new Transitions();
export default transitions;
```

#### File: `routes/+layout.svelte`

```svelte
<script>
  import transitions from "$lib/transitions";

  transitions.onNavigateViewTransition();
</script>

<slot />

\<style\>
  /* Disable the default view transition animation. */
  :root::view-transition-new(root) {
    animation: none;
  }
  :root::view-transition-old(root) {
    animation: none;
  }
</style>
```



[view-transitions-api]: https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
[caniuse-view-transitions]: https://caniuse.com/view-transitions

[sveltekit-onnavigate]: https://kit.svelte.dev/docs/modules#$app-navigation-onnavigate
[svelte-blog-sveltekit-view-transitions]: https://svelte.dev/blog/view-transitions

[mdn-css-animation]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation
[mdn-js-animate]: https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
