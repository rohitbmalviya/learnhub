import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'LearnHub — Online Learning Platform';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0f172a',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
          <div
            style={{
              background: '#ffffff',
              width: 160,
              height: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 40,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="11" fill="#f37513" />
              <path d="M4.5 9.5L12 6L19.5 9.5L12 13L4.5 9.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.5 11V15.5C7.5 15.5 9 17.5 12 17.5C15 17.5 16.5 15.5 16.5 15.5V11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.5 9.5V14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            marginBottom: 20,
            textAlign: 'center',
            color: '#0f172a',
          }}
        >
          LearnHub
        </h1>
        <p
          style={{
            fontSize: 36,
            color: '#475569',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Online Learning Platform. World-class courses, expert instructors, and a community of learners.
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
