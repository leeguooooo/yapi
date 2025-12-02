import React from 'react';
import PropTypes from 'prop-types';

const LogoSVG = props => {
  let length = props.length;
  return (
    <svg className="yapi-logo-svg" width={length} height={length} viewBox="0 0 64 64" version="1.1">
      <title>YApi 2.0 Icon</title>
      <defs>
        <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="grad-blue">
          <stop stopColor="#3B82F6" offset="0%" />
          <stop stopColor="#2563EB" offset="100%" />
        </linearGradient>
        
        <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="grad-green">
          <stop stopColor="#4ADE80" offset="0%" />
          <stop stopColor="#22C55E" offset="100%" />
        </linearGradient>

        <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="grad-red">
          <stop stopColor="#FB923C" offset="0%" />
          <stop stopColor="#EA580C" offset="100%" />
        </linearGradient>

        <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="grad-ring">
          <stop stopColor="#F9FAFB" offset="0%" />
          <stop stopColor="#F3F4F6" offset="100%" />
        </linearGradient>
      </defs>
      <g id="Logo-Core" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            {/* Outer Ring */}
            <circle id="Oval-1" fill="url(#grad-ring)" cx="32" cy="32" r="32" />

            {/* Blue Blade */}
            <path
              d="M36.7078009,31.8054514 L36.7078009,51.7110548 C36.7078009,54.2844537 34.6258634,56.3695395 32.0579205,56.3695395 C29.4899777,56.3695395 27.4099998,54.0704461 27.4099998,51.7941246 L27.4099998,31.8061972 C27.4099998,29.528395 29.4909575,27.218453 32.0589004,27.230043 C34.6268432,27.241633 36.7078009,29.528395 36.7078009,31.8054514 Z"
              fill="url(#grad-blue)"
              fillRule="nonzero"
            />
            {/* Green Blade */}
            <path
              d="M45.2586091,17.1026914 C45.2586091,17.1026914 45.5657231,34.0524383 45.2345291,37.01141 C44.9033351,39.9703817 43.1767091,41.6667796 40.6088126,41.6667796 C38.040916,41.6667796 35.9609757,39.3676862 35.9609757,37.0913646 L35.9609757,17.1034372 C35.9609757,14.825635 38.0418959,12.515693 40.6097924,12.527283 C43.177689,12.538873 45.2586091,14.825635 45.2586091,17.1026914 Z"
              fill="url(#grad-green)"
              fillRule="nonzero"
              transform="translate(40.674608, 27.097010) rotate(60.000000) translate(-40.674608, -27.097010) "
            />
            {/* Red Blade */}
            <path
              d="M28.0410158,17.0465598 L28.0410158,36.9521632 C28.0410158,39.525562 25.9591158,41.6106479 23.3912193,41.6106479 C20.8233227,41.6106479 18.7433824,39.3115545 18.7433824,37.035233 L18.7433824,17.0473055 C18.7433824,14.7695034 20.8243026,12.4595614 23.3921991,12.4711513 C25.9600956,12.4827413 28.0410158,14.7695034 28.0410158,17.0465598 Z"
              fill="url(#grad-red)"
              fillRule="nonzero"
              transform="translate(23.392199, 27.040878) rotate(-60.000000) translate(-23.392199, -27.040878) "
            />
            
            {/* Inner Center Dot (Simplified) */}
            {/* Fake Shadow using a semi-transparent circle slightly offset */}
            <circle cx="32" cy="33" r="2.93" fill="black" opacity="0.1" />
            {/* Main Dot */}
            <circle cx="32" cy="32" r="2.93" fill="#F7F7F7" />
      </g>
    </svg>
  );
};

LogoSVG.propTypes = {
  length: PropTypes.any
};

export default LogoSVG;