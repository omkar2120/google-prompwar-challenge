import Lottie from 'lottie-react';
import PropTypes from 'prop-types';
import loaderAnim from '../../assets/lottie/loader.json';
import errorAnim from '../../assets/lottie/error.json';
import emptyAnim from '../../assets/lottie/empty.json';
import rainAnim from '../../assets/lottie/rain.json';

/**
 * Generic wrapper around a bundled (offline-safe) Lottie animation.
 * All animation JSON is imported locally — never hotlinked — so it works
 * inside the PWA with no network.
 */
function LottieArt({ data, size = 96, loop = true, className = '', label }) {
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <Lottie animationData={data} loop={loop} autoplay style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
LottieArt.propTypes = {
  data: PropTypes.object.isRequired,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  loop: PropTypes.bool,
  className: PropTypes.string,
  label: PropTypes.string,
};

/** Pulsing-dots loading indicator. */
export function LottieLoader({ size = 72, className = '', label = 'Loading' }) {
  return <LottieArt data={loaderAnim} size={size} className={className} label={label} />;
}
LottieLoader.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  label: PropTypes.string,
};

/** Pulsing error mark. */
export function LottieErrorArt({ size = 72, className = '', label = 'Error' }) {
  return <LottieArt data={errorAnim} size={size} className={className} label={label} />;
}
LottieErrorArt.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  label: PropTypes.string,
};

/** Friendly floating cloud for empty states. */
export function LottieEmptyArt({ size = 96, className = '', label = 'Nothing here yet' }) {
  return <LottieArt data={emptyAnim} size={size} className={className} label={label} />;
}
LottieEmptyArt.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  label: PropTypes.string,
};

/** Decorative falling rain (hero). Purely ornamental. */
export function LottieRain({ size = 200, className = '' }) {
  return <LottieArt data={rainAnim} size={size} className={className} label="" />;
}
LottieRain.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
};
