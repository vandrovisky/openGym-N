// The brand, as a name: "open" in the label colour, "Gym" in the live red, "-N" quiet.
// Only where openGym-N is shown as a brand (sign-in, first run, Home, the version line), never
// inside a sentence, an error or the legal text.
export default function Wordmark() {
  return <span className="wordmark" role="img" aria-label="openGym-N">
    <span className="wm-open" aria-hidden="true">open</span><span className="wm-gym" aria-hidden="true">Gym</span><span className="wm-n" aria-hidden="true">-N</span>
  </span>
}
