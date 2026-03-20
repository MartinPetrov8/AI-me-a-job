import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'aimeajob - AI Job Matching for European Professionals';
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
          background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: 'white',
            marginBottom: 20,
          }}
        >
          aimeajob
        </div>
        <div
          style={{
            fontSize: 40,
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 40,
          }}
        >
          AI Job Matching for European Professionals
        </div>
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          8 criteria • 10 countries • Updated daily
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
