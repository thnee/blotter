---
url: "sveltekit-view-transitions"
title: "View Transitions in SvelteKit"
date: "2024-03-20"
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

<!--more-->

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


## SvelteKit page store

There is a [builtin store called `page`][sveltekit-app-stores-page]
which contains information about the current page.

When navigating to a new page,
the `page` store is updated before the `onNavigation` handler is triggered.  
So it's possible to query it and use that information
in some logic in the navigation lifecycle handler.

```svelte
<script>
  import { page } from "$app/stores";
  console.log($page.route);
</script>
```

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

- The page `/list` is not animated, it remains static during navigation.
- The page `/details` is animated, with a sliding animation.
- When navigating from `/list` to `/details`,
  the `/details` page will slide in from the left, covering the `/list` page.
- When navigating from `/details` to `/list`,
  the `/details` page will slide out to the left, revealing the `/list` page.
- During these animations,
  the `/details` page will always be on top of the `/list` page.

#### File: `lib/transitions.js`

This file contains central logic for View Transitions,
so that individual pages only need to contain a minimum amount of code.

```js
import { get } from "svelte/store";
import { page } from "$app/stores";
import { onNavigate } from "$app/navigation";

export default class Transitions {
  /*
  * Register that the current page in the page store should
  * have the animation defined by the name parameter.
  * Should be called from a specific page that wants to have a View Transition.
  */
  registerPage(name) {
    let sourcePage = get(page);
    this.pageConfig = {
      animationName: name,
      route: sourcePage.route,
    };
  }

  /*
  * Setup View Transitions for page navigation.
  * Can be called from any page, or more conveniently from the root layout,
  * to enable View Transitions for all page navigations in the site.
  */
  onNavigateViewTransition() {
    onNavigate((navigation) => {
      // If view transitions are not available, do nothing.
      if (!document.startViewTransition) return;

      return new Promise(async (resolve) => {
        const viewTransition = document.startViewTransition(async () => {
          resolve();
          await navigation.complete;
        });
        // Wait until the new page has been created in the DOM.
        await viewTransition.ready;
        this.animate(navigation);
      });
    });
  }

  animate(navigation) {
    if (this.pageConfig) {
      // If navigating to a page with a defined animation.
      if (this.pageConfig.route.id == navigation.to.route.id) {
        this.animatePage(this.pageConfig.animationName, "entering");
      }

      // If navigating from a page with a defined animation.
      if (this.pageConfig.route.id == navigation.from.route.id) {
        this.animatePage(this.pageConfig.animationName, "leaving");
      }
    }
  }

  animatePage(animationName, direction) {
    // Define values that apply to all animations.
    let options = {};
    let keyframeAttrs = {};
    let keyframeStart = {zIndex: "999"};
    let keyframeEnd = {zIndex: "999"};

    if (animationName == "slide-left") {
      keyframeAttrs.transform = "translateX(-100vw)";
      options.easing = "ease-in-out";
      options.duration = 300;
    }

    // If navigating to the page,
    // apply the animation to the starting keyframe on the new page element.
    if (direction == "entering") {
      Object.assign(keyframeStart, keyframeAttrs);
      options.pseudoElement = "::view-transition-new(root)";
    }

    // If navigating from the page,
    // apply the animation to the ending keyframe on the old page element.
    if (direction == "leaving") {
      Object.assign(keyframeEnd, keyframeAttrs);
      options.pseudoElement = "::view-transition-old(root)";
    }
    document.documentElement.animate([keyframeStart, keyframeEnd], options);
  }
}


let transitions = new Transitions();
export default transitions;
```

#### File: `routes/list/+page.svelte`

```svelte
<a href="/details">To details page</a>
```

#### File: `routes/details/+page.svelte`

```svelte
<script>
  import transitions from "$lib/transitions";

  // Define that this page will slide from and to the left,
  // when entering and leaving this page.
  transitions.registerPage("slide-left");
</script>

<a href="/list">Back to list page</a>
```

#### File: `routes/+layout.svelte`

```svelte
<script>
  import transitions from "$lib/transitions";

  // Enable View Transitions for all pages on this site.
  transitions.onNavigateViewTransition();
</script>

<slot />

<style>
  /* Change the default view transition animation from fade to nothing.*/
  :root::view-transition-new(root) { animation: none; }
  :root::view-transition-old(root) { animation: none; }
</style>
```




[view-transitions-api]: https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
[caniuse-view-transitions]: https://caniuse.com/view-transitions

[sveltekit-onnavigate]: https://kit.svelte.dev/docs/modules#$app-navigation-onnavigate
[svelte-blog-sveltekit-view-transitions]: https://svelte.dev/blog/view-transitions

[sveltekit-app-stores-page]: https://kit.svelte.dev/docs/modules#$app-stores-page
[svelte-store]: https://svelte.dev/docs/svelte-store

[mdn-css-animation]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation
[mdn-js-animate]: https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
