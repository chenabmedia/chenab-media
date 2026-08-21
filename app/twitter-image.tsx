import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CHENAB MEDIA — Independent Label from Jammu & Kashmir';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080808',
          border: '16px solid #141414',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="200"
            height="200"
            viewBox="0 0 512 512"
          >
            <rect
              width="512"
              height="512"
              fill="#080808"
              rx="92.16"
            />
            <rect
              x="30.72"
              y="30.72"
              width="450.56"
              height="450.56"
              fill="none"
              stroke="#1F1F1F"
              strokeWidth="10.24"
              rx="71.68"
            />
            <path
              d="M368.64 174.08 C317.44 112.64 194.56 112.64 143.36 174.08 C92.16 235.52 92.16 327.68 143.36 389.12 C194.56 450.56 317.44 450.56 368.64 389.12"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="51.2"
              strokeLinecap="round"
            />
            <circle
              cx="256.0"
              cy="281.6"
              r="35.84"
              fill="#FFFFFF"
            />
          </svg>
          <div
            style={{
              display: 'flex',
              fontSize: 52,
              fontWeight: 900,
              letterSpacing: '0.22em',
              color: '#F5F5F5',
              marginTop: 28,
              fontFamily: 'sans-serif',
              textTransform: 'uppercase',
            }}
          >
            CHENAB MEDIA
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: '0.28em',
              color: '#888888',
              marginTop: 14,
              fontFamily: 'monospace',
              textTransform: 'uppercase',
            }}
          >
            INDEPENDENT LABEL • JAMMU & KASHMIR
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
