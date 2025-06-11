# TWES Animation & Motion Principles

## 1. Our Philosophy: Motion with Purpose, The Wildcat's Grace

In the wild, a cat's movement is never superfluous. Every step, every pounce, every subtle turn of the head has a purpose: to navigate, to communicate, to conserve energy. This is the guiding metaphor for motion in the TWES digital experience.

Our approach to animation is not about adding flashy decoration. It is about **communication, empathy, and respect**. Motion, when used correctly, is a silent tool that can guide users, provide clarity, and deepen their connection to our mission. When used poorly, it is a distracting and wasteful indulgence that undermines our credibility and harms the user experience.

**Our motion must be:**
- **Purposeful:** It must have a clear, functional, or narrative job to do.
- **Efficient:** It must be performant on low-powered devices, respecting our users' hardware and data.
- **Respectful:** It must be gentle and considerate of users with motion sensitivities.
- **Cohesive:** It must feel like an integrated part of our warm, minimalist aesthetic, not an afterthought.

Every animation we implement must answer the question: **"Does this movement serve the user and our mission, or does it serve itself?"**

## 2. The First Question: Should This Element Move?

Before writing a single line of animation code, every developer must use this decision-making framework. If the answer to all of the following questions is "no," the element should remain static.

**The Motion Value Test:**

1. **Does it orient the user or guide their attention?**
   - *Example:* A new modal window sliding up from the button that triggered it, creating a clear spatial and causal link.
   - *Example:* A subtle highlight that moves to the next field in a form.

2. **Does it provide feedback on a user's action?**
   - *Example:* A button subtly scaling down on press to confirm it has been tapped.
   - *Example:* A checkmark animating in after a form is successfully submitted.

3. **Does it illustrate a change in state or context?**
   - *Example:* An item in a "to-donate" list smoothly fading out and shrinking when removed.
   - *Example:* A loading spinner transitioning into the loaded content.

4. **Does it improve perceived performance?**
   - *Example:* Using a subtle cross-fade between two pages can make the transition feel faster and smoother than an instantaneous, jarring snap.
   - *Example:* A skeleton loader that shimmers gently while content is being fetched.

5. **Does it enhance the narrative or foster an empathetic connection?** (Use with extreme care)
   - *Example:* A photo of a rescued wildcat slowly and gently fading into view, giving the user a moment to connect emotionally, rather than it just appearing.
   - *Example:* A counter for donations ticking up smoothly, creating a sense of shared progress and community effort.

If a proposed animation does not pass this test, it is decoration. **We do not use decorative animation.**

## 3. The Core Principles of Meaningful Motion

Once you've determined that motion adds value, it must adhere to these five principles.

### Principle 1: Purposeful & Informative (The Choreography of Attention)
Motion should direct the user's focus without demanding it. It creates relationships between elements, explains what just happened, and hints at what can be done next.

- **Logic:** Use motion to connect cause and effect. If clicking A causes B to appear, B should emerge from A.
- **Hierarchy:** Animate elements in a logical sequence to guide the eye. For example, a container fades in, then its title, then its content.
- **Focus:** Use subtle motion (e.g., a soft glow, a gentle pulse) to draw attention to a critical action, like a "Donate Now" button after a compelling story.

### Principle 2: Efficient & Performant (The Conservation of Energy)
Just as a wildcat conserves energy, our animations must conserve CPU/GPU resources. Poorly performing animations make our platform feel broken and inaccessible on lower-powered devices, which is a failure of our mission to reach everyone.

- **Performance Budget:**
  - **Target:** 60 frames per second (fps) is the goal for all animations.
  - **Interaction Animations (e.g., button press):** < 100ms. Must feel instantaneous.
  - **UI Transitions (e.g., modals, page fades):** 200ms - 350ms. Noticeable but swift.
  - **Narrative Animations (e.g., photo reveals):** 400ms - 800ms. Deliberately slow, used sparingly.
- **Implementation:**
  - **Prioritize CSS `transform` and `opacity`.** These properties can be animated by the browser's compositor thread and are significantly more performant than animating properties that trigger layout and paint (e.g., `width`, `height`, `margin`, `top`, `box-shadow`).
  - Use `will-change: transform, opacity;` judiciously on elements you know will be animated, to hint to the browser to create a separate layer. Do not overuse it.

### Principle 3: Gentle & Respectful (The Quiet Approach)
Our motion should be calm and reassuring, aligning with our "warm minimalism" and respecting users' sensitivities. It should never be jarring, frantic, or aggressive.

- **Easing:** Avoid linear motion. Use gentle `ease-out` or `ease-in-out` curves. This mimics natural physics, where objects accelerate and decelerate. A sharp, sudden stop feels artificial and aggressive.
- **Subtlety:** Favor fades over slides. Favor subtle scaling over dramatic bouncing. The best motion is often the motion you feel more than you see.
- **Accessibility:** This is a non-negotiable requirement. See Section 4.

### Principle 4: Cohesive & Consistent (The Consistent Rhythm)
Motion is a part of our design system. Its "physics" should feel consistent across the entire platform, regardless of the theme. This builds trust and makes the interface predictable.

- **System-Wide Timing & Easing:** Use a predefined set of duration and easing variables (e.g., `var(--duration-fast)`, `var(--ease-out-gentle)`). Do not use magic numbers.
- **Theme Independence:** The *mechanics* of an animation (its timing, easing, and properties) must be identical across all four themes. Only theme-specific values like color may change. A button press should feel the same whether it's in the light theme or the dark theme.

### Principle 5: Narrative & Empathetic (The Silent Storyteller)
This is our most unique principle. Motion can be used to control pacing and add emotional weight, directly supporting our mission.

- **Pacing:** A slow, gentle fade-in on an animal's story creates a moment of reverence. A quick, jarring animation would be disrespectful. We use timing to give our content the gravity it deserves.
- **Empathy:** The motion should feel organic and natural, not robotic. This subtle organic quality mirrors the living creatures we are dedicated to protecting and helps the user feel more connected to the natural world.
- **Focus on the Subject:** Motion should always serve to enhance the content (the animals, their stories, the calls to action), never to upstage it. If you notice the animation more than the animal, the animation has failed.

## 4. Technical Guardrails & Responsible Implementation

### Accessibility: `prefers-reduced-motion`
This is a critical requirement for respecting users with vestibular disorders, motion sickness, or general sensitivity. All non-essential animations **MUST** be disabled when this media query is active.

- **What to Reduce:**
  - **Disable:** All large-scale movements (sliding panels), complex transitions, and long-duration fades.
  - **Replace:** Replace movement-based transitions with a simple, quick cross-fade (`opacity`).
  - **Keep:** Essential feedback animations that don't involve large-scale movement, like a button's color changing on hover or a spinner indicating a loading state.

- **Implementation (CSS Example):**
  ```css
  /* Define the standard transition */
  .modal {
    transition: transform 300ms var(--ease-out-gentle), opacity 300ms var(--ease-out-gentle);
    transform: translateY(20px);
    opacity: 0;
  }

  .modal.is-active {
    transform: translateY(0);
    opacity: 1;
  }

  /* Override for users who prefer reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .modal {
      /* Disable the transform, shorten the opacity fade */
      transition: opacity 150ms ease-out;
    }
  }
  ```

### How to Test Animation Performance
Do not assume your powerful development machine represents the average user.

1. **Browser DevTools (Performance Tab):**
   - Record a performance profile while your animation is running.
   - Look for a consistent green bar at 60fps. Dips into yellow or red indicate performance issues.
   - Check the "Summary" to ensure you are not causing expensive "Layout" or "Paint" operations. The "Composite Layers" should be doing the work.

2. **Browser DevTools (Rendering Tab):**
   - Enable "Paint Flashing" to see which parts of the screen are being repainted. Only the animated element should flash green. If the whole screen flashes, you are triggering an expensive repaint.
   - Enable "Layout Shift Regions" to ensure your animations are not causing content to move unexpectedly.

3. **CPU & Network Throttling:**
   - Use the browser's built-in throttling tools to simulate a slower CPU (e.g., 4x or 6x slowdown) and a slower network. This will reveal jank and performance bottlenecks that are invisible on a fast machine.

4. **Real-World Device Testing:**
   - **The Gold Standard.** Test on a mid-to-low-range Android phone or an older iPhone. This is the only way to truly understand the experience for a significant portion of our user base.

## 5. Motion's Role in Our Mission

Ultimately, every decision we make must serve our mission of animal welfare and education. Motion is no exception.

- **Building Trust:** A smooth, performant, and predictable interface feels professional and trustworthy. When users trust our platform, they are more likely to trust our message and be moved to act.
- **Reducing Friction:** A well-placed animation can make a donation or sign-up process feel simpler and more seamless. By removing cognitive friction, we remove a barrier to support.
- **Fostering Reverence:** The gentle, deliberate pacing of our narrative animations asks the user to slow down and pay attention. It frames the stories of our animals with the respect they deserve, transforming a simple web page into a space for quiet contemplation and connection.

By adhering to these principles, we ensure that motion in the TWES experience is a tool for empathy—a quiet, graceful, and powerful ally in our mission.

## 6. Motion Token System

Just as we use design tokens for colors and spacing, we use motion tokens for consistent animation behavior:

### Duration Tokens
```css
:root {
  --duration-instant: 50ms;    /* Micro-interactions */
  --duration-fast: 150ms;      /* Quick feedback */
  --duration-moderate: 300ms;  /* Standard transitions */
  --duration-slow: 600ms;      /* Deliberate reveals */
  --duration-narrative: 800ms; /* Story pacing */
}
```

### Easing Tokens
```css
:root {
  --ease-out-gentle: cubic-bezier(0.2, 0, 0.38, 0.9);
  --ease-in-out-natural: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-soft: cubic-bezier(0.4, 0, 1, 1);
}
```

### Usage Example
```css
.card {
  transition: 
    transform var(--duration-moderate) var(--ease-out-gentle),
    opacity var(--duration-fast) var(--ease-in-out-natural);
}
```

## 7. Decision Tree for Motion Implementation

```
Should this move?
├─ No clear purpose? → DON'T ANIMATE
└─ Has purpose?
   ├─ Check performance budget
   │  ├─ Too expensive? → SIMPLIFY OR REMOVE
   │  └─ Within budget?
   │     ├─ Check accessibility
   │     │  ├─ Causes issues? → PROVIDE ALTERNATIVE
   │     │  └─ Accessible?
   │     │     ├─ Aligns with mission?
   │     │     │  ├─ No → RECONSIDER
   │     │     │  └─ Yes → IMPLEMENT WITH TOKENS
   │     │     └─ Test on low-end devices
   │     │        ├─ Poor performance? → OPTIMIZE
   │     │        └─ Performs well? → SHIP
```

Remember: When in doubt, choose stillness. A functional, static interface is always better than a beautiful, broken one.