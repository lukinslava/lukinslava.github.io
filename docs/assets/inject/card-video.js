// Video covers for homepage cards: a muted loop laid over the card's image, which stays underneath as the poster.
// Lives outside React, so it re-attaches if Framer re-renders a card. Plays only while the card is on screen;
// with reduced motion the image stays and no video loads.
(() => {
  // card link path -> video
  const COVERS = {
    "/quack": "/assets/images/cover-notch-duck.mp4",
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const visible = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    }
  }, { threshold: 0.2 });

  const attach = () => {
    for (const card of document.querySelectorAll("a.framer-lux5qc")) {
      const src = COVERS[new URL(card.href, location.href).pathname];
      const wrapper = src && card.querySelector("[data-framer-background-image-wrapper]");
      if (!wrapper || wrapper.querySelector("video[data-card-video]")) continue;
      const poster = wrapper.querySelector("img");
      const video = Object.assign(document.createElement("video"), { src, muted: true, loop: true, playsInline: true, preload: "metadata" });
      video.setAttribute("data-card-video", "");
      video.setAttribute("aria-hidden", "true");
      if (poster?.currentSrc || poster?.src) video.poster = poster.currentSrc || poster.src;
      wrapper.append(video);
      visible.observe(video);
    }
  };

  attach();
  new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });
})();
