import { gallery, videos } from '@/lib/content';

/* --------------------------------------------------------------------------
   Yard gallery
   --------------------------------------------------------------------------
   The client's own photographs of their own vehicles, plates and all. That is
   the whole point of the section: stock photography says "a company like this
   exists", a picture of the actual Prado on an Ondo plate says "this is ours".

   Videos are phone-shot, so two of the three are portrait. They are rendered
   at their real aspect rather than letterboxed into a widescreen slot, and
   they are muted, loop and carry `preload="none"` — nothing downloads until a
   visitor presses play, which matters on Nigerian mobile data.
   -------------------------------------------------------------------------- */

export default function Gallery() {
  const landscape = videos.find((v) => v.orientation === 'landscape');
  const portraits = videos.filter((v) => v.orientation === 'portrait');

  return (
    <section className="section section--dark" id="gallery">
      <div className="shell">
        <div className="sectionHead reveal">
          <div>
            <div className="eyebrow">The yard</div>
            <h2>Our actual vehicles</h2>
            <p className="lead">
              Every photograph below is our own fleet, photographed at our yard —
              not stock images of cars we do not own.
            </p>
          </div>
        </div>

        <div className="galleryGrid stagger">
          {gallery.map((shot) => (
            <figure className="galleryItem" key={shot.src}>
              <img src={shot.src} alt={shot.caption} loading="lazy" />
              <figcaption>{shot.caption}</figcaption>
            </figure>
          ))}
        </div>

        {(landscape || portraits.length > 0) && (
          <div className="galleryVideos">
            {landscape && (
              <figure className="galleryVideo galleryVideo--wide">
                <video
                  src={landscape.src}
                  controls
                  muted
                  loop
                  playsInline
                  preload="none"
                />
                <figcaption>{landscape.caption}</figcaption>
              </figure>
            )}

            {portraits.map((clip) => (
              <figure className="galleryVideo galleryVideo--tall" key={clip.src}>
                <video src={clip.src} controls muted loop playsInline preload="none" />
                <figcaption>{clip.caption}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
